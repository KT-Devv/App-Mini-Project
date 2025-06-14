import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { WebRTCService } from '@/services/webrtcService';
import { SessionHeader } from './video/SessionHeader';
import { VideoGrid } from './video/VideoGrid';
import { VideoControls } from './video/VideoControls';
import { ChatSidebar } from './video/ChatSidebar';

interface VideoConferenceProps {
  sessionId: string;
  sessionTitle: string;
  onLeaveSession: () => void;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  room_id: string;
}

interface Participant {
  session_id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    username: string;
    email: string;
  };
}

interface RemoteVideo {
  userId: string;
  stream: MediaStream;
  username: string;
}

const VideoConference: React.FC<VideoConferenceProps> = ({ sessionId, sessionTitle, onLeaveSession }) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [remoteVideos, setRemoteVideos] = useState<RemoteVideo[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const channelsRef = useRef<any[]>([]);

  useEffect(() => {
    if (user) {
      initializeWebRTC();
      fetchParticipants();
      fetchMessages();
      setupRealtimeSubscriptions();
    }

    return () => {
      cleanupWebRTC();
      cleanupChannels();
    };
  }, [sessionId, user]);

  const cleanupChannels = () => {
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
  };

  const initializeWebRTC = async () => {
    if (!user || !localVideoRef.current) return;

    try {
      const webrtcService = new WebRTCService(sessionId, user.id);
      webrtcServiceRef.current = webrtcService;

      // Setup callbacks
      webrtcService.onRemoteStream((userId, stream) => {
        console.log('Adding remote stream for user:', userId);
        const participant = participants.find(p => p.user_id === userId);
        const username = participant?.profiles?.username || 'Unknown User';
        
        setRemoteVideos(prev => {
          const existing = prev.find(v => v.userId === userId);
          if (existing) {
            return prev.map(v => v.userId === userId ? { ...v, stream } : v);
          }
          return [...prev, { userId, stream, username }];
        });
      });

      webrtcService.onUserLeft((userId) => {
        console.log('User left:', userId);
        setRemoteVideos(prev => prev.filter(v => v.userId !== userId));
      });

      await webrtcService.initialize(localVideoRef.current);
      setIsConnecting(false);
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      toast.error('Failed to access camera/microphone');
      setIsConnecting(false);
    }
  };

  const cleanupWebRTC = () => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.cleanup();
      webrtcServiceRef.current = null;
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Clean up any existing channels first
    cleanupChannels();

    const participantsChannel = supabase
      .channel(`session-participants-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel(`session-messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          if (payload.new.room_id === sessionId) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    // Store channels for cleanup
    channelsRef.current = [participantsChannel, messagesChannel];
  };

  const fetchParticipants = async () => {
    try {
      const { data: participantsData, error: participantsError } = await supabase
        .from('session_participants')
        .select('session_id, user_id, joined_at')
        .eq('session_id', sessionId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return;
      }

      if (participantsData && participantsData.length > 0) {
        const userIds = participantsData.map(p => p.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        const participantsWithProfiles = participantsData.map(participant => ({
          ...participant,
          profiles: profilesData?.find(profile => profile.id === participant.user_id) || {
            username: 'Unknown User',
            email: 'unknown@example.com'
          }
        }));

        setParticipants(participantsWithProfiles);

        if (participantsWithProfiles.length === 0) {
          await endSession();
        }
      } else {
        setParticipants([]);
        await endSession();
      }
    } catch (error) {
      console.error('Unexpected error fetching participants:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Unexpected error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: newMessage.trim(),
          room_id: sessionId,
          user_id: user.id
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Unexpected error sending message:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const endSession = async () => {
    try {
      const { error } = await supabase
        .from('study_sessions')
        .update({ 
          is_active: false 
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error ending session:', error);
      }

      toast.info('Session has ended');
      onLeaveSession();
    } catch (error) {
      console.error('Unexpected error ending session:', error);
    }
  };

  const toggleMute = () => {
    if (webrtcServiceRef.current) {
      const muted = webrtcServiceRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const toggleVideo = () => {
    if (webrtcServiceRef.current) {
      const videoOff = webrtcServiceRef.current.toggleVideo();
      setIsVideoOff(videoOff);
    }
  };

  const handleLeaveSession = async () => {
    try {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error leaving session:', error);
      }

      cleanupWebRTC();
      onLeaveSession();
    } catch (error) {
      console.error('Unexpected error leaving session:', error);
    }
  };

  if (isConnecting) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Connecting to session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <SessionHeader 
        sessionTitle={sessionTitle}
        participantCount={participants.length}
        onLeaveSession={handleLeaveSession}
      />

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <VideoGrid 
            localVideoRef={localVideoRef}
            remoteVideos={remoteVideos}
            participants={participants}
            userId={user?.id}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
          />

          <VideoControls 
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onLeaveSession={handleLeaveSession}
          />
        </div>

        <ChatSidebar 
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={sendMessage}
          userId={user?.id}
        />
      </div>
    </div>
  );
};

export default VideoConference;
