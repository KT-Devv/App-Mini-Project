import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Hash, Users, Plus, MessageCircle, ArrowLeft, Menu, Search, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import UserMentionInput from './UserMentionInput';
import ChatMessage from './ChatMessage';
import FriendsManager from './FriendsManager';
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
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 pb-20">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-auto border border-slate-200">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Welcome to Chat</h3>
          <p className="text-slate-600 mb-6">Please log in to start chatting with your study groups.</p>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            Get Started
          </Button>
        </div>
      </div>
    );
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
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowSidebar(false)}>
          <div className="bg-white w-80 h-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Chat Rooms</h2>
                  <p className="text-blue-100 text-sm">Connect with your study groups</p>
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

            {/* Enhanced Friends and Create Room Section */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 space-y-4">
              <FriendsManager />
              <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
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
                      <label htmlFor="roomName" className="block text-sm font-medium text-slate-700 mb-2">
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
                      <label htmlFor="roomDescription" className="block text-sm font-medium text-slate-700 mb-2">
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
                    <div className="flex justify-end space-x-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateRoomOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createRoom}
                        disabled={!newRoomName.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Create Room
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Enhanced Rooms List */}
            <div className="flex-1 overflow-y-auto p-4">
              {chatRooms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Rooms Yet</h3>
                  <p className="text-slate-500 text-sm mb-4">Create your first room or get invited to join conversations!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Active Rooms</h3>
                  {chatRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => selectRoom(room)}
                      className={`w-full flex items-center p-4 rounded-xl text-left transition-all duration-200 group ${
                        activeRoom?.id === room.id
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md'
                          : 'hover:bg-slate-50 border-2 border-transparent hover:shadow-sm'
                      }`}
                    >
                      <div className={`p-3 rounded-xl mr-4 transition-all duration-200 ${
                        activeRoom?.id === room.id 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md' 
                          : 'bg-slate-100 group-hover:bg-slate-200'
                      }`}>
                        <Hash className={`h-4 w-4 ${
                          activeRoom?.id === room.id ? 'text-white' : 'text-slate-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold truncate ${
                            activeRoom?.id === room.id ? 'text-blue-900' : 'text-slate-900'
                          }`}>
                            {room.name}
                          </span>
                          {activeRoom?.id === room.id && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">Active</Badge>
                          )}
                        </div>
                        {room.description && (
                          <p className="text-xs text-slate-500 mb-2 truncate">
                            {room.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-400">
                          Created {new Date(room.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced User Info */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    <p className="text-xs text-slate-500">Online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Welcome to StudySphere Chat</h3>
              <p className="text-slate-600 mb-6">Connect with your study groups and collaborate in real-time.</p>
              <Button
                onClick={() => setShowSidebar(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
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
