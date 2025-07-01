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

type ConnectionState = 'connecting' | 'connected' | 'failed' | 'disconnected';

const VideoConference: React.FC<VideoConferenceProps> = ({ sessionId, sessionTitle, onLeaveSession }) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [remoteVideos, setRemoteVideos] = useState<RemoteVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    if (user) {
      initializeSession();
    }

    return () => {
      cleanup();
    };
  }, [sessionId, user]);

  const initializeSession = async () => {
    try {
      setConnectionState('connecting');
      setError(null);
      
      await Promise.all([
        initializeWebRTC(),
        fetchParticipants(),
        fetchMessages(),
        setupRealtimeSubscriptions()
      ]);
      
      console.log('Session initialized successfully');
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError('Failed to initialize video session. Please try again.');
      setConnectionState('failed');
    }
  };

  const cleanup = async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    console.log('Starting cleanup...');
    
    try {
      await Promise.all([
        cleanupWebRTC(),
        cleanupChannels()
      ]);
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      isCleaningUpRef.current = false;
    }
  };

  const cleanupChannels = async () => {
    const promises = channelsRef.current.map(async (channel) => {
      try {
        const result = await channel.unsubscribe();
        console.log(`Channel unsubscribe result: ${result}`);
      } catch (error) {
        console.error('Error unsubscribing from channel:', error);
      }
    });

    await Promise.allSettled(promises);
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

      webrtcService.onConnectionState((state) => {
        console.log('Connection state changed:', state);
        setConnectionState(state as ConnectionState);
        
        if (state === 'failed') {
          setError('Connection failed. Please check your internet connection.');
          toast.error('Connection failed');
        } else if (state === 'connected') {
          setError(null);
          toast.success('Connected to session');
        }
      });

      await webrtcService.initialize(localVideoRef.current);
      console.log('WebRTC initialized successfully');
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      setError(error instanceof Error ? error.message : 'Failed to access camera/microphone');
      setConnectionState('failed');
      throw error;
    }
  };

  const cleanupWebRTC = async () => {
    if (webrtcServiceRef.current) {
      try {
        webrtcServiceRef.current.cleanup();
      } catch (error) {
        console.error('Error cleaning up WebRTC:', error);
      } finally {
        webrtcServiceRef.current = null;
      }
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Clean up any existing channels first
    cleanupChannels();

    try {
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
            console.log('Participants changed, refetching...');
            fetchParticipants();
          }
        )
        .subscribe((status) => {
          console.log('Participants channel status:', status);
          if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to participants channel');
          }
        });

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
            console.log('New message received:', payload);
            if (payload.new.room_id === sessionId) {
              fetchMessages();
            }
          }
        )
        .subscribe((status) => {
          console.log('Messages channel status:', status);
          if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to messages channel');
          }
        });

      channelsRef.current = [participantsChannel, messagesChannel];
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      console.log('Fetching participants for session:', sessionId);
      
      const { data: participantsData, error: participantsError } = await supabase
        .from('session_participants')
        .select('session_id, user_id, joined_at')
        .eq('session_id', sessionId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return;
      }

      console.log('Participants data:', participantsData);

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
        console.log('No participants found, ending session');
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

      await cleanup();
      onLeaveSession();
    } catch (error) {
      console.error('Unexpected error leaving session:', error);
    }
  };

  const retryConnection = () => {
    console.log('Retrying connection...');
    setError(null);
    initializeSession();
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={retryConnection}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onLeaveSession}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors ml-3"
            >
              Leave Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (connectionState === 'connecting') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Connecting to session...</h2>
          <p className="text-gray-400">Setting up video and audio</p>
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

      {connectionState === 'failed' && (
        <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mx-4 mt-2 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                Connection issues detected. Some features may not work properly.
                <button 
                  onClick={retryConnection}
                  className="ml-2 underline hover:no-underline"
                >
                  Retry connection
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
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
            webrtcService={webrtcServiceRef.current}
            sessionId={sessionId}
            userId={user?.id}
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
