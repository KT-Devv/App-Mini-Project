import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Hash, Users, Plus, MessageCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import UserMentionInput from './UserMentionInput';
import ChatMessage from './ChatMessage';

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
      <div className="flex items-center justify-center h-screen bg-gray-50 px-4 pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat rooms...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 px-4 pb-20">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-sm mx-auto">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access the chat rooms.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col pb-20">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {activeRoom && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
                onClick={() => setShowSidebar(true)}
              >
                <Hash className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-lg font-bold">
                {activeRoom ? activeRoom.name : 'StudySphere Chat'}
              </h1>
              <p className="text-blue-100 text-sm">
                {activeRoom ? activeRoom.description || 'Chat room' : 'Connect with your study group'}
              </p>
            </div>
          </div>
          <MessageCircle className="h-6 w-6" />
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)}>
          <div className="bg-white w-80 h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Chat Rooms</h2>
                  <p className="text-blue-100 text-sm">Select a room</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowSidebar(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Create Room Button */}
            <div className="p-4 border-b border-gray-200">
              <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Create New Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                        Room Name
                      </label>
                      <Input
                        id="roomName"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="roomDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <Textarea
                        id="roomDescription"
                        value={newRoomDescription}
                        onChange={(e) => setNewRoomDescription(e.target.value)}
                        placeholder="Enter room description"
                        className="w-full"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateRoomOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createRoom}
                        disabled={!newRoomName.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Rooms List */}
            <div className="flex-1 overflow-y-auto p-2">
              {chatRooms.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No chat rooms available</p>
                  <p className="text-gray-400 text-xs mt-1">Create one to get started!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chatRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => selectRoom(room)}
                      className={`w-full flex items-start p-3 rounded-lg text-left transition-all hover:bg-gray-50 ${
                        activeRoom?.id === room.id
                          ? 'bg-blue-50 border-l-4 border-blue-600 shadow-sm'
                          : 'hover:shadow-sm'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-3 ${
                        activeRoom?.id === room.id ? 'bg-blue-600' : 'bg-gray-100'
                      }`}>
                        <Hash className={`h-4 w-4 ${
                          activeRoom?.id === room.id ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium truncate ${
                            activeRoom?.id === room.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {room.name}
                          </span>
                        </div>
                        {room.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {room.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Created {new Date(room.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 max-w-sm mx-auto">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-500">Be the first to start the conversation!</p>
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

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
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
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-sm mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mb-6">
                <MessageCircle className="h-16 w-16 text-blue-600 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to StudySphere Chat</h3>
              <p className="text-gray-600 mb-4">Tap the # button above to select a room and start chatting.</p>
              <Button
                onClick={() => setShowSidebar(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Hash className="h-4 w-4 mr-2" />
                Browse Rooms
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
