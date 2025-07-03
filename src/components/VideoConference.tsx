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

// Declare the Jitsi Meet External API type
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
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
  const isInitializedRef = useRef(false);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (user && sessionId && !isInitializedRef.current && !initializationPromiseRef.current) {
      initializationPromiseRef.current = initializeSession();
    }

    return () => {
      cleanup();
    };
  }, [sessionId, user]);

  const initializeSession = async () => {
    if (isInitializedRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      isInitializedRef.current = true;
      
      console.log('Initializing session for user:', user?.id, 'session:', sessionId);
      
      // Wait a bit to ensure container is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!jitsiContainerRef.current) {
        throw new Error('Video container not ready');
      }

      if (!user) {
        throw new Error('User not authenticated');
      }
      
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
      isInitializedRef.current = false;
      initializationPromiseRef.current = null;
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
        console.log('Disposing Jitsi API...');
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {
          console.warn('Error disposing Jitsi API:', e);
        }
        jitsiApiRef.current = null;
      }

      // Clean up channels
      await cleanupChannels();
      
      isInitializedRef.current = false;
      initializationPromiseRef.current = null;
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

  const loadJitsiScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="external_api.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', reject);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', reject);
      document.head.appendChild(script);
    });
  };

  const initializeJitsi = async () => {
    console.log('Initializing Jitsi with container:', !!jitsiContainerRef.current, 'user:', !!user);
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!jitsiContainerRef.current) {
      throw new Error('Container not ready');
    }

    try {
      console.log('Loading Jitsi Meet API...');
      await loadJitsiScript();
      
      console.log('Jitsi Meet API loaded, creating instance...');

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
          toolbarButtons: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'settings', 'raisehand', 'videoquality', 
            'filmstrip', 'stats', 'shortcuts', 'tileview', 'help'
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        },
      };

      console.log('Creating Jitsi Meet instance...');
      jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      // Set up event listeners
      jitsiApiRef.current.addEventListener('readyToClose', () => {
        console.log('Jitsi readyToClose event');
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

      jitsiApiRef.current.addEventListener('videoConferenceJoined', (participant: any) => {
        console.log('Video conference joined:', participant);
        toast.success('Successfully joined the video session!');
      });

      jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
        console.log('Video conference left');
      });

      console.log('Jitsi Meet initialized successfully');
    } catch (error) {
      console.error('Error initializing Jitsi Meet:', error);
      throw new Error('Failed to initialize video conference. Please try again.');
    }
  };

  const setupRealtimeSubscriptions = async () => {
    // Always clean up existing channels first
    await cleanupChannels();

    try {
      const participantsChannel = supabase
        .channel(`session-participants-${sessionId}-${Date.now()}`)
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
        .channel(`session-messages-${sessionId}-${Date.now()}`)
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
      } else {
        console.log('No participants found');
        setParticipants([]);
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

  const handleLeaveSession = async () => {
    try {
      console.log('Leaving session...');
      
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
      onLeaveSession(); // Still leave even if there's an error
    }
  };

  const retryConnection = async () => {
    console.log('Retrying connection...');
    setError(null);
    isInitializedRef.current = false;
    initializationPromiseRef.current = null;
    
    // Clean up first
    await cleanup();
    
    // Wait a moment before retrying
    setTimeout(() => {
      initializationPromiseRef.current = initializeSession();
    }, 1000);
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
