
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Hash, Plus, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ChatRoom {
  id: string;
  title: string;
  created_at: string;
  is_group: boolean;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  chat_id: string;
  profiles?: {
    username: string;
    email: string;
  };
}

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const ensureUserInDefaultChats = useCallback(async () => {
    if (!user) return;

    try {
      // Get all chat rooms
      const { data: allChats, error: chatsError } = await supabase
        .from('chats')
        .select('*');

      if (chatsError) {
        console.error('Error fetching all chats:', chatsError);
        return;
      }

      // Get user's current participations
      const { data: userParticipations, error: participationsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (participationsError) {
        console.error('Error fetching user participations:', participationsError);
        return;
      }

      const participatingChatIds = userParticipations?.map(p => p.chat_id) || [];
      const chatsToJoin = allChats?.filter(chat => !participatingChatIds.includes(chat.id)) || [];

      // Add user to chats they're not already in
      if (chatsToJoin.length > 0) {
        const insertData = chatsToJoin.map(chat => ({
          chat_id: chat.id,
          user_id: user.id
        }));

        const { error: insertError } = await supabase
          .from('chat_participants')
          .insert(insertData);

        if (insertError) {
          console.error('Error joining chats:', insertError);
        } else {
          console.log(`Joined ${chatsToJoin.length} new chat rooms`);
        }
      }
    } catch (err) {
      console.error('Unexpected error ensuring user in chats:', err);
    }
  }, [user]);

  const fetchChatRooms = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First ensure user is in default chats
      await ensureUserInDefaultChats();

      // Fetch chats user is participating in using the fixed RLS policy
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('Error fetching chat rooms:', error);
        toast.error('Failed to fetch chat rooms.');
        return;
      }

      console.log('Fetched chat rooms:', data);
      setChatRooms(data || []);
      if (data && data.length > 0 && !activeRoom) {
        setActiveRoom(data[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
      setLoading(false);
    }
  }, [user, ensureUserInDefaultChats]);

  const fetchMessages = useCallback(async () => {
    if (!activeRoom) return;

    try {
      console.log('Fetching messages for room:', activeRoom.id);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          chat_id,
          profiles!messages_sender_id_fkey (
            username,
            email
          )
        `)
        .eq('chat_id', activeRoom.id)
        .order('created_at');

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        toast.error('Failed to fetch messages.');
        return;
      }

      console.log('Messages data:', messagesData);
      setMessages(messagesData || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
    }
  }, [activeRoom]);

  const joinRoom = useCallback((room: ChatRoom) => {
    setActiveRoom(room);
    console.log(`Joined room: ${room.title}`);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          chat_id: activeRoom.id,
          sender_id: user.id,
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message.');
        return;
      }

      setNewMessage("");
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!activeRoom) return;

    const messagesChannel = supabase
      .channel(`messages-${activeRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeRoom.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [activeRoom, fetchMessages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chat rooms...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to access the chat rooms.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">StudySphere</h1>
          <p className="text-sm text-slate-300">Chat Rooms</p>
        </div>

        {/* Channels Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Channels</h2>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-white hover:bg-slate-700">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {chatRooms.length === 0 ? (
                <p className="text-slate-400 text-sm py-4">No chat rooms available</p>
              ) : (
                chatRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => joinRoom(room)}
                    className={`w-full flex items-center px-2 py-1.5 rounded text-left text-sm transition-colors ${
                      activeRoom?.id === room.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{room.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-slate-400">Online</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-200 flex items-center px-6 bg-white">
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{activeRoom.title}</h2>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Hash className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message: Message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8 mt-0.5">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gray-500 text-white text-xs">
                        {message.profiles?.username?.[0]?.toUpperCase() || 
                         message.profiles?.email?.[0]?.toUpperCase() || 
                         'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {message.profiles?.username || 
                           message.profiles?.email?.split('@')[0] || 
                           'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex items-center space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message #${activeRoom.title}`}
                  className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to StudySphere Chat</h3>
              <p className="text-gray-500">Select a channel to start chatting with your study group.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
