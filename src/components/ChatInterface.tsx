import React, { useState, useEffect } from 'react';
//import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
//import { Badge } from "@/components/ui/badge";
import { Send, Plus, Search,Hash, Smile, Paperclip } from 'lucide-react';
//import { Users, Clock} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ChatRoom {
  id: string;
  name: string;
  subject: string;
  description: string;
  color: string;
  created_at: string;
}

interface Message {
  id: number;
  content: string;
  user_id: string;
  created_at: string;
  room_id: string;
  profiles?: {
    username: string;
  };
}

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages();
      joinRoom();
    }
  }, [activeRoom]);

  const fetchChatRooms = async () => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at');

    if (error) {
      toast.error('Failed to load chat rooms');
    } else {
      setChatRooms(data || []);
      if (data && data.length > 0) {
        setActiveRoom(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!activeRoom) return;

    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', activeRoom)
      .order('created_at');

    if (error) {
      toast.error('Failed to load messages');
      return;
    }

    // Fetch profiles separately for message authors
    const userIds = [...new Set(messagesData?.map(msg => msg.user_id).filter(Boolean))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    // Combine messages with profile data
    const messagesWithProfiles = messagesData?.map(msg => ({
      ...msg,
      profiles: profilesData?.find(profile => profile.id === msg.user_id) || { username: 'Unknown User' }
    })) || [];

    setMessages(messagesWithProfiles);
  };

  const joinRoom = async () => {
    if (!user || !activeRoom) return;

    const { error } = await supabase
      .from('room_members')
      .upsert({ room_id: activeRoom, user_id: user.id });

    if (error && !error.message.includes('duplicate key')) {
      console.error('Failed to join room:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !activeRoom) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        content: message,
        user_id: user.id,
        room_id: activeRoom
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setMessage('');
      fetchMessages();
    }
  };

  const activeRoomData = chatRooms.find(room => room.id === activeRoom);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Study Chats</h2>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" className="border-blue-600 text-blue-600">
                <Search className="h-4 w-4" />
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>
          
          {/* Room Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {chatRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeRoom === room.id 
                    ? 'bg-blue-100 border border-blue-200 text-blue-700' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <div className={`w-3 h-3 ${room.color} rounded-full`}></div>
                <span className="text-sm font-medium">{room.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Room Info */}
        {activeRoomData && (
          <div className="px-4 pb-3 border-t bg-gray-50">
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">{activeRoomData.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Chat Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => {
          const isOwn = user?.id === msg.user_id;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {!isOwn && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">
                      {msg.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white border text-gray-800 rounded-bl-md'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-1 text-blue-600">
                      {msg.profiles?.username || 'Unknown User'}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-2 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Message Input */}
      <div className="bg-white border-t p-4 shadow-lg">
        <form onSubmit={sendMessage} className="flex items-center space-x-2 mb-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pr-20 rounded-full border-gray-300 focus:border-blue-500"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Paperclip className="h-3 w-3 text-gray-500" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Smile className="h-3 w-3 text-gray-500" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit"
            size="sm" 
            className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 shadow-md"
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-gray-500 text-center">
          Press Enter to send • Be respectful and helpful
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
