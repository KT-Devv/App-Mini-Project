import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    JitsiMeetExternalAPI: new (
      domain: string,
      options: unknown
    ) => JitsiExternalAPI;
  }
}

interface JitsiParticipantEvent {
  displayName?: string;
}

interface JitsiExternalAPI {
  addEventListener: (
    event: string,
    handler: (payload?: unknown) => void
  ) => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  dispose: () => void;
}

const VideoConference: React.FC<VideoConferenceProps> = ({
  sessionId,
  sessionTitle,
  onLeaveSession,
}) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionCreator, setIsSessionCreator] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);

  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<JitsiExternalAPI | null>(null);
  const isInitialized = useRef(false);

  // Load Jitsi Meet API script
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

  // Handle leave session
  const handleLeaveSession = useCallback(async () => {
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
  }, [onLeaveSession, sessionId, user?.id]);

  // Initialize Jitsi Meet
  useEffect(() => {
    const requestMediaPermissions = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({
          audio: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
          video: {
            width: { ideal: 1280, max: 1280, min: 320 },
            height: { ideal: 720, max: 720, min: 180 },
            frameRate: { max: 30 },
          },
        });
      } catch (err) {
        console.warn('Media permissions denied or not available:', err);
      }
    };

    const initializeJitsi = async () => {
      if (!user || isInitialized.current) return;

      try {
        console.log('Requesting media permissions...');
        await requestMediaPermissions();

        console.log('Initializing Jitsi Meet...');
        await loadJitsiScript();

        if (!jitsiContainerRef.current) {
          console.error('Jitsi container ref still null after waiting.');
          setError('Failed to initialize video conference. Please try again.');
          return;
        }

        const domain = 'meet.jit.si';
        const roomName = `StudySphere-${sessionId}`;

        const options = {
          roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: user.email?.split('@')[0] || 'Anonymous',
            email: user.email || '',
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableInviteFunctions: true,
            constraints: {
              audio: {
                autoGainControl: true,
                echoCancellation: true,
                noiseSuppression: true,
              },
              video: {
                width: { ideal: 1280, max: 1280, min: 320 },
                height: { ideal: 720, max: 720, min: 180 },
                frameRate: { max: 30 },
              },
            },
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          },
        };

        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        isInitialized.current = true;

        // Event listeners
        jitsiApiRef.current.addEventListener('readyToClose', () => {
          handleLeaveSession();
        });

        jitsiApiRef.current.addEventListener('participantJoined', (participant?: unknown) => {
          const payload = (participant as JitsiParticipantEvent) || {};
          toast.success(`${payload.displayName || 'Someone'} joined the session`);
        });

        jitsiApiRef.current.addEventListener('participantLeft', (participant?: unknown) => {
          const payload = (participant as JitsiParticipantEvent) || {};
          toast.info(`${payload.displayName || 'Someone'} left the session`);
        });

        jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
          toast.success('Successfully joined the video session!');
        });

        // Keep local mute state in sync with Jitsi
        jitsiApiRef.current.addEventListener('audioMuteStatusChanged', (payload?: unknown) => {
          const data = (payload as { muted?: boolean }) || {};
          setIsAudioMuted(Boolean(data.muted));
        });
        jitsiApiRef.current.addEventListener('videoMuteStatusChanged', (payload?: unknown) => {
          const data = (payload as { muted?: boolean }) || {};
          setIsVideoMuted(Boolean(data.muted));
        });

        console.log('Jitsi Meet initialized successfully');
      } catch (error) {
        console.error('Error initializing Jitsi Meet:', error);
        setError('Failed to initialize video conference. Please try again.');
      }
    };

    initializeJitsi();

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [user, sessionId, handleLeaveSession]);

  // Check if user is session creator
  const checkSessionCreator = useCallback(async () => {
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
  }, [sessionId, user?.id]);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
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
        const userIds = participantsData.map((p) => p.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        const participantsWithProfiles = participantsData.map((participant) => ({
          ...participant,
          profiles:
            profilesData?.find((profile) => profile.id === participant.user_id) || {
              username: 'Unknown User',
              email: 'unknown@example.com',
            },
        }));

        setParticipants(participantsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, [sessionId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      if (!chatRoomId) return;
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', chatRoomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [chatRoomId]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user) return;

    try {
      if (!chatRoomId) return;
      const { error } = await supabase.from('chat_messages').insert({
        content: newMessage.trim(),
        room_id: chatRoomId,
        user_id: user.id,
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
  }, [chatRoomId, fetchMessages, newMessage, user]);

  // Ensure a chat room exists for this session and the user is a member
  const ensureChatRoomAndMembership = useCallback(async () => {
    if (!user || !sessionId) return;
    try {
      // Try to find existing chat room with id = sessionId
      const { data: existingRoom, error: roomFetchError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('id', sessionId)
        .single();

      if (roomFetchError && roomFetchError.code !== 'PGRST116') {
        // PGRST116: No rows found for single() - safe to ignore
        console.warn('Error checking chat room:', roomFetchError);
      }

      let roomIdToUse = existingRoom?.id as string | undefined;

      if (!roomIdToUse) {
        const { data: createdRoom, error: createRoomError } = await supabase
          .from('chat_rooms')
          .insert({
            id: sessionId, // bind chat room id to session id for 1:1 mapping
            name: `${sessionTitle || 'Session'} Chat`,
            description: `Chat for study session ${sessionId}`,
            created_by: user.id,
            is_active: true,
          })
          .select('id')
          .single();

        if (createRoomError) {
          console.error('Error creating chat room for session:', createRoomError);
          return;
        }

        roomIdToUse = createdRoom?.id;
      }

      if (!roomIdToUse) return;

      // Ensure membership
      const { data: existingMember } = await supabase
        .from('chat_room_members')
        .select('id')
        .eq('room_id', roomIdToUse)
        .eq('user_id', user.id)
        .single();

      if (!existingMember) {
        const { error: addMemberError } = await supabase
          .from('chat_room_members')
          .insert({ room_id: roomIdToUse, user_id: user.id, role: 'member' });

        if (addMemberError) {
          console.error('Error adding user to chat room members:', addMemberError);
          // Do not return; membership might be auto-managed elsewhere. Continue.
        }
      }

      setChatRoomId(roomIdToUse);
    } catch (e) {
      console.error('Failed to ensure chat room and membership for session:', e);
    }
  }, [sessionId, sessionTitle, user]);

  // handleLeaveSession already declared above for use in effects

  // Handle close session
  const handleCloseSession = useCallback(async () => {
    try {
      console.log('Closing session...');

      const { error: updateError } = await supabase
        .from('study_sessions')
        .update({
          is_active: false,
          end_time: new Date().toISOString(),
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
  }, [onLeaveSession, sessionId]);

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
  const initializeSession = useCallback(async () => {
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
      ]);

      console.log('Session initialized successfully');
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError('Failed to initialize video session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [checkSessionCreator, fetchMessages, fetchParticipants, sessionId, user]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user || !chatRoomId) return;

    const participantsChannel = supabase
      .channel(`session-participants-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
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
          table: 'chat_messages',
        },
        (payload) => {
          if (payload.new.room_id === chatRoomId) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [chatRoomId, fetchMessages, fetchParticipants, sessionId, user]);

  // Initialize on mount
  useEffect(() => {
    if (user && sessionId) {
      // Prepare chat backend and initial data
      ensureChatRoomAndMembership();
      initializeSession();
    }

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [ensureChatRoomAndMembership, initializeSession, sessionId, user]);

  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isAudioMuted, setIsAudioMuted] = React.useState(false);
  const [isVideoMuted, setIsVideoMuted] = React.useState(false);

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const toggleAudio = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  };

  if (error) {
    return (
      <VideoErrorScreen error={error} onRetry={retryConnection} onLeave={onLeaveSession} />
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
        <div ref={jitsiContainerRef} className="flex-1 w-full h-full" style={{ minHeight: '400px' }} />

        <div className="relative">
          <button
            onClick={toggleChat}
            className="absolute top-2 right-2 z-10 p-2 bg-gray-700 rounded-full text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            aria-expanded={isChatOpen}
            aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
            title={isChatOpen ? 'Hide Chat' : 'Show Chat'}
          >
            {isChatOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16h6M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72A7.963 7.963 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
          </button>

          <div className="absolute top-16 right-2 z-10 flex space-x-2">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isAudioMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
              aria-pressed={isAudioMuted}
              aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
              title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isAudioMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 01-6 0V5a3 3 0 016 0v7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v11m0 0l3-3m-3 3l-3-3" />
                </svg>
              )}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isVideoMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
              aria-pressed={isVideoMuted}
              aria-label={isVideoMuted ? 'Unblock camera' : 'Block camera'}
              title={isVideoMuted ? 'Unblock camera' : 'Block camera'}
            >
              {isVideoMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M10 9v6m-4-3h8" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M10 9v6m-4-3h8" />
                </svg>
              )}
            </button>
          </div>

          {isChatOpen && (
            <ChatSidebar
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSendMessage={sendMessage}
              userId={user?.id}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoConference;
