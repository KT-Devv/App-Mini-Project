import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Hash, Menu, Search, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import UserMentionInput from './UserMentionInput';
import ChatMessage from './ChatMessage';
import ChatSidebar from './chat/ChatSidebar';
import ChatWelcome from './chat/ChatWelcome';
import InviteToRoomModal from './InviteToRoomModal';

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  is_active: boolean;
  created_by: string | null;
}

interface ChatMessageWithProfile {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  room_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const fetchChatRooms = async () => {
    try {
      console.log('Fetching chat rooms...');
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) {
        console.error('Error fetching chat rooms:', error);
        toast.error(`Failed to load chat rooms: ${error.message}`);
        return;
      }

      console.log('Chat rooms fetched successfully:', data);
      setChatRooms(data || []);
      if (data && data.length > 0 && !activeRoom) {
        setActiveRoom(data[0]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred while fetching chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeRoom) return;

    try {
      console.log('Fetching messages for room:', activeRoom.id);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', activeRoom.id)
        .order('created_at');

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        toast.error(`Failed to load messages: ${messagesError.message}`);
        return;
      }

      const userIds = [...new Set(messagesData?.map(msg => msg.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      const transformedMessages = (messagesData || []).map(msg => {
        const profile = profilesMap.get(msg.user_id);
        return {
          ...msg,
          username: profile?.username || profile?.email?.split('@')[0] || 'Unknown User',
          display_name: profile?.username || profile?.email?.split('@')[0] || 'Unknown User',
          avatar_url: null
        };
      });

      console.log('Messages fetched successfully:', transformedMessages);
      setMessages(transformedMessages);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred while fetching messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !user) return;

    try {
      console.log('Sending message:', { content: newMessage.trim(), room_id: activeRoom.id, user_id: user.id });
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: newMessage.trim(),
          room_id: activeRoom.id,
          user_id: user.id,
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error(`Failed to send message: ${error.message}`);
        return;
      }

      console.log('Message sent successfully');
      setNewMessage("");
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred while sending message');
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !user) {
      console.log('Create room validation failed:', { name: newRoomName.trim(), user: !!user });
      toast.error('Please enter a room name and ensure you are logged in');
      return;
    }

    try {
      console.log('Creating room with data:', {
        name: newRoomName.trim(),
        description: newRoomDescription.trim() || null,
        created_by: user.id,
        is_active: true
      });

      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: newRoomName.trim(),
          description: newRoomDescription.trim() || null,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Detailed error creating room:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast.error(`Failed to create room: ${error.message}`);
        return;
      }

      console.log('Room created successfully:', data);
      setNewRoomName("");
      setNewRoomDescription("");
      setIsCreateRoomOpen(false);
      fetchChatRooms();
      toast.success('Room created successfully!');
    } catch (err) {
      console.error('Unexpected error creating room:', err);
      toast.error('An unexpected error occurred while creating the room');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectRoom = (room: ChatRoom) => {
    console.log('Selecting room:', room);
    setActiveRoom(room);
    setMessages([]);
    setShowSidebar(false);
  };

  useEffect(() => {
    console.log('Component mounted, user:', user);
    fetchChatRooms();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;

    console.log('Setting up real-time subscription for room:', activeRoom.id);
    const messageChannel = supabase
      .channel(`chat-messages-${activeRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoom.id}`
        },
        (payload) => {
          console.log('Real-time message received:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up message subscription');
      supabase.removeChannel(messageChannel);
    };
  }, [activeRoom]);

  useEffect(() => {
    console.log('Setting up real-time subscription for room updates');
    const roomChannel = supabase
      .channel('chat-rooms-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_rooms'
        },
        (payload) => {
          console.log('Real-time room update received:', payload);
          fetchChatRooms();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up room subscription');
      supabase.removeChannel(roomChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 pb-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Loading Chat</h3>
          <p className="text-slate-600">Connecting to your conversations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <ChatWelcome type="not-signed-in" />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col pb-20">
      {/* Modern Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {activeRoom && (
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => setShowSidebar(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {activeRoom ? activeRoom.name : 'StudySphere Chat'}
                </h1>
                <p className="text-sm text-slate-500">
                  {activeRoom ? (activeRoom.description || 'Study group chat') : 'Select a room to start chatting'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {activeRoom && (
              <>
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                  <Search className="h-4 w-4" />
                </Button>
                <InviteToRoomModal
                  roomId={activeRoom.id}
                  roomName={activeRoom.name}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <ChatSidebar
        show={showSidebar}
        chatRooms={chatRooms}
        activeRoom={activeRoom}
        onClose={() => setShowSidebar(false)}
        onSelectRoom={selectRoom}
        onCreateRoom={createRoom}
        newRoomName={newRoomName}
        newRoomDescription={newRoomDescription}
        setNewRoomName={setNewRoomName}
        setNewRoomDescription={setNewRoomDescription}
        isCreateRoomOpen={isCreateRoomOpen}
        setIsCreateRoomOpen={setIsCreateRoomOpen}
      />

      {/* Enhanced Main Chat Area */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Start the Conversation</h3>
                  <p className="text-slate-600 mb-6">Be the first to share an idea, ask a question, or just say hello!</p>
                  <div className="text-sm text-slate-500">
                    Type @ to mention someone
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  currentUserId={user?.id || ''}
                />
              ))
            )}
          </div>

          {/* Enhanced Message Input */}
          <div className="bg-white border-t border-slate-200 p-6">
            <div className="max-w-4xl mx-auto">
              <UserMentionInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={sendMessage}
                onKeyPress={handleKeyPress}
                placeholder={`Message #${activeRoom.name}`}
                disabled={false}
              />
            </div>
          </div>
        </div>
      ) : (
        <ChatWelcome type="no-room-selected" onBrowseRooms={() => setShowSidebar(true)} />
      )}
    </div>
  );
};

export default ChatInterface;
