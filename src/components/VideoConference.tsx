import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, Video, VideoOff, Phone, Send, Users, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface VideoConferenceProps {
  sessionId: string;
  sessionTitle: string;
  onLeaveSession: () => void;
}

interface Message {
  id: number; // Changed from string to number to match database
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    email: string;
  };
}

interface Participant {
  id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    username: string;
    email: string;
  };
}

const VideoConference: React.FC<VideoConferenceProps> = ({ sessionId, sessionTitle, onLeaveSession }) => {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeMedia();
    fetchParticipants();
    fetchMessages();

    // Set up real-time subscriptions
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
          table: 'messages'
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
      cleanupMedia();
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsConnecting(false);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Failed to access camera/microphone');
      setIsConnecting(false);
    }
  };

  const cleanupMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select(`
          id,
          user_id,
          joined_at,
          profiles!session_participants_user_id_fkey (
            username,
            email
          )
        `)
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }

      setParticipants(data || []);

      // Check if session should end (no participants left)
      if (data && data.length === 0) {
        await endSession();
      }
    } catch (error) {
      console.error('Unexpected error fetching participants:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles!messages_user_id_fkey (
            username,
            email
          )
        `)
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
        .from('messages')
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
      // Update session status to ended
      const { error } = await supabase
        .from('study_sessions')
        .update({ 
          status: 'ended',
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

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const handleLeaveSession = async () => {
    try {
      // Remove user from participants
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error leaving session:', error);
      }

      cleanupMedia();
      onLeaveSession();
    } catch (error) {
      console.error('Unexpected error leaving session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isConnecting) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Connecting to session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-lg font-semibold">{sessionTitle}</h1>
          <div className="flex items-center space-x-2 text-gray-300">
            <Users className="h-4 w-4" />
            <span>{participants.length} participants</span>
          </div>
        </div>
        <Button 
          onClick={handleLeaveSession}
          variant="destructive"
          className="bg-red-600 hover:bg-red-700"
        >
          <Phone className="h-4 w-4 mr-2" />
          Leave Session
        </Button>
      </div>

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Local Video */}
            <Card className="relative bg-gray-800 border-gray-700">
              <CardContent className="p-0 h-full">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  You
                </div>
              </CardContent>
            </Card>

            {/* Participants Grid */}
            {participants.slice(0, 3).map((participant) => (
              <Card key={participant.id} className="relative bg-gray-800 border-gray-700">
                <CardContent className="p-0 h-full flex items-center justify-center">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {participant.profiles?.username?.[0]?.toUpperCase() || 
                         participant.profiles?.email?.[0]?.toUpperCase() || 
                         'U'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-white text-sm">
                      {participant.profiles?.username || 
                       participant.profiles?.email?.split('@')[0] || 
                       'Unknown User'}
                    </p>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {participant.profiles?.username || 'Participant'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4 mt-4">
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full h-12 w-12"
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            <Button
              onClick={toggleVideo}
              variant={isVideoOff ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full h-12 w-12"
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full h-12 w-12 text-gray-400"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Session Chat</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-2">
                  <Avatar className="h-6 w-6 mt-1">
                    <AvatarFallback className="bg-gray-500 text-white text-xs">
                      {message.profiles?.username?.[0]?.toUpperCase() || 
                       message.profiles?.email?.[0]?.toUpperCase() || 
                       'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-xs font-medium text-gray-900">
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
                    <p className="text-sm text-gray-700 break-words">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoConference;
