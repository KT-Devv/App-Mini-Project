import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Hash } from 'lucide-react';
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

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const fetchChatRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('Error fetching chat rooms:', error);
        toast.error('Failed to fetch chat rooms.');
        return;
      }

      setChatRooms(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!activeRoom) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', activeRoom.id)
        .order('created_at');

      if (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to fetch messages.');
        return;
      }

      setMessages(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
    }
  }, [activeRoom]);

  const joinRoom = useCallback((room: ChatRoom) => {
    setActiveRoom(room);
    console.log(`Joined room: ${room.name}`);
    toast.success(`Joined room: ${room.name}`);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          room_id: activeRoom.id,
          user_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message.');
        return;
      }

      setNewMessage("");
      fetchMessages(); // Refresh messages after sending
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return (
    <div className="chat-interface">
      <div className="chat-rooms">
        <h2>Chat Rooms</h2>
        <ul>
          {chatRooms.map((room) => (
            <li
              key={room.id}
              className={`chat-room ${room.id === activeRoom?.id ? 'active' : ''}`}
              onClick={() => joinRoom(room)}
              style={{ backgroundColor: room.color }}
            >
              <Hash /> {room.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="chat-window">
        {activeRoom ? (
          <>
            <h2>{activeRoom.name}</h2>
            <div className="messages">
              {messages.map((message: any) => (
                <div key={message.id} className="message">
                  <span>{message.content}</span>
                </div>
              ))}
            </div>
            <div className="message-input">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <Button onClick={sendMessage}>
                <Send />
              </Button>
            </div>
          </>
        ) : (
          <p>Select a room to start chatting.</p>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;