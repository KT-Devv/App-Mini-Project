
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SessionHeader } from './video/SessionHeader';
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

const VideoConference: React.FC<VideoConferenceProps> = ({ sessionId, sessionTitle, onLeaveSession }) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
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
      setIsLoading(true);
      setError(null);
      
      await Promise.all([
        initializeJitsi(),
        fetchParticipants(),
        fetchMessages(),
        setupRealtimeSubscriptions()
      ]);
      
      console.log('Session initialized successfully');
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError('Failed to initialize video session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    console.log('Starting cleanup...');
    
    try {
      // Clean up Jitsi
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }

      // Clean up channels
      await cleanupChannels();
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

  const initializeJitsi = async () => {
    if (!user || !jitsiContainerRef.current) return;

    try {
      // Load Jitsi Meet API script if not already loaded
      if (!window.JitsiMeetExternalAPI) {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      const domain = 'meet.jit.si';
      const roomName = `StudySphere-${sessionId}`;
      
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user.email?.split('@')[0] || 'Anonymous',
          email: user.email
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableInviteFunctions: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          ],
        },
      };

      jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      // Set up event listeners
      jitsiApiRef.current.addEventListener('readyToClose', () => {
        handleLeaveSession();
      });

      jitsiApiRef.current.addEventListener('participantJoined', (participant: any) => {
        console.log('Participant joined:', participant);
        toast.success(`${participant.displayName || 'Someone'} joined the session`);
      });

      jitsiApiRef.current.addEventListener('participantLeft', (participant: any) => {
        console.log('Participant left:', participant);
        toast.info(`${participant.displayName || 'Someone'} left the session`);
      });

      console.log('Jitsi Meet initialized successfully');
    } catch (error) {
      console.error('Error initializing Jitsi Meet:', error);
      setError('Failed to initialize video conference. Please try again.');
      throw error;
    }
  };

  const setupRealtimeSubscriptions = () => {
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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Connecting to session...</h2>
          <p className="text-gray-400">Loading video conference</p>
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
        <div className="flex-1">
          <div ref={jitsiContainerRef} className="w-full h-full" />
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

// Declare the Jitsi Meet External API type
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default VideoConference;
