
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SessionHeader } from './SessionHeader';
import { ChatSidebar } from './ChatSidebar';
import { VideoLoadingScreen } from './VideoLoadingScreen';
import { VideoErrorScreen } from './VideoErrorScreen';

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

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoConference: React.FC<VideoConferenceProps> = ({ 
  sessionId, 
  sessionTitle, 
  onLeaveSession 
}) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionCreator, setIsSessionCreator] = useState(false);
  
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const isInitialized = useRef(false);

  // Load Jitsi Meet API
  const loadJitsiScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
      document.head.appendChild(script);
    });
  };

  // Initialize Jitsi Meet
  const initializeJitsi = async () => {
    if (!user || !jitsiContainerRef.current || isInitialized.current) return;

    try {
      console.log('Initializing Jitsi Meet...');
      await loadJitsiScript();

      const domain = 'meet.jit.si';
      const roomName = `StudySphere-${sessionId}`;
      
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user.email?.split('@')[0] || 'Anonymous',
          email: user.email || ''
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableInviteFunctions: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
      };

      jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      isInitialized.current = true;

      // Set up event listeners
      jitsiApiRef.current.addEventListener('readyToClose', () => {
        handleLeaveSession();
      });

      jitsiApiRef.current.addEventListener('participantJoined', (participant: any) => {
        toast.success(`${participant.displayName || 'Someone'} joined the session`);
      });

      jitsiApiRef.current.addEventListener('participantLeft', (participant: any) => {
        toast.info(`${participant.displayName || 'Someone'} left the session`);
      });

      jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
        toast.success('Successfully joined the video session!');
      });

      console.log('Jitsi Meet initialized successfully');
    } catch (error) {
      console.error('Error initializing Jitsi Meet:', error);
      setError('Failed to initialize video conference. Please try again.');
    }
  };

  // Check if user is session creator
  const checkSessionCreator = async () => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('created_by')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error checking session creator:', error);
        return;
      }

      setIsSessionCreator(data?.created_by === user?.id);
    } catch (error) {
      console.error('Error checking session creator:', error);
    }
  };

  // Fetch participants
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
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  // Fetch messages
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
      console.error('Error fetching messages:', error);
    }
  };

  // Send message
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
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Handle leave session
  const handleLeaveSession = async () => {
    try {
      console.log('Leaving session...');
      
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }

      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error leaving session:', error);
      }

      onLeaveSession();
    } catch (error) {
      console.error('Error leaving session:', error);
      onLeaveSession();
    }
  };

  // Handle close session
  const handleCloseSession = async () => {
    try {
      console.log('Closing session...');
      
      const { error: updateError } = await supabase
        .from('study_sessions')
        .update({ 
          is_active: false,
          end_time: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error closing session:', updateError);
        toast.error('Failed to close session');
        return;
      }

      const { error: deleteError } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', sessionId);

      if (deleteError) {
        console.error('Error removing participants:', deleteError);
      }

      toast.success('Session closed successfully');
      onLeaveSession();
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Retry connection
  const retryConnection = async () => {
    setError(null);
    setIsLoading(true);
    isInitialized.current = false;
    
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    
    setTimeout(() => {
      initializeSession();
    }, 1000);
  };

  // Initialize session
  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Initializing session for user:', user?.id, 'session:', sessionId);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      await Promise.all([
        checkSessionCreator(),
        fetchParticipants(),
        fetchMessages(),
        initializeJitsi()
      ]);
      
      console.log('Session initialized successfully');
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError('Failed to initialize video session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user || !sessionId) return;

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

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [sessionId, user]);

  // Initialize on mount
  useEffect(() => {
    if (user && sessionId) {
      initializeSession();
    }

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [sessionId, user]);

  if (error) {
    return (
      <VideoErrorScreen
        error={error}
        onRetry={retryConnection}
        onLeave={onLeaveSession}
      />
    );
  }

  if (isLoading) {
    return <VideoLoadingScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <SessionHeader 
        sessionTitle={sessionTitle}
        participantCount={participants.length}
        onLeaveSession={handleLeaveSession}
        onCloseSession={isSessionCreator ? handleCloseSession : undefined}
      />

      <div className="flex-1 flex">
        <div className="flex-1">
          <div 
            ref={jitsiContainerRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
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
