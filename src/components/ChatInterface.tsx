
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Plus, Search, Users, Clock, Hash, Smile, Paperclip } from 'lucide-react';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [activeRoom, setActiveRoom] = useState('general');

  const chatRooms = [
    { id: 'general', name: 'General Discussion', members: 24, lastMessage: '2 min ago', unread: 3, color: 'bg-blue-500' },
    { id: 'math', name: 'Mathematics Help', members: 15, lastMessage: '5 min ago', unread: 1, color: 'bg-green-500' },
    { id: 'physics', name: 'Physics Problems', members: 12, lastMessage: '10 min ago', unread: 0, color: 'bg-purple-500' },
    { id: 'chemistry', name: 'Chemistry Lab', members: 8, lastMessage: '1 hour ago', unread: 0, color: 'bg-orange-500' },
  ];

  const messages = [
    { id: 1, user: 'Alex M.', message: 'Can someone help me with calculus derivatives? I\'m stuck on this problem 📚', time: '10:30 AM', isOwn: false, avatar: 'AM' },
    { id: 2, user: 'Sarah K.', message: 'Sure! What specific problem are you working on? I just finished that chapter 😊', time: '10:32 AM', isOwn: false, avatar: 'SK' },
    { id: 3, user: 'You', message: 'I can help too. Share the problem and we\'ll work through it together! 💪', time: '10:33 AM', isOwn: true, avatar: 'YU' },
    { id: 4, user: 'Alex M.', message: 'Thanks! It\'s about finding the derivative of f(x) = x³ + 2x² - 5x + 1', time: '10:35 AM', isOwn: false, avatar: 'AM' },
    { id: 5, user: 'Sarah K.', message: 'Easy! Use the power rule: f\'(x) = 3x² + 4x - 5 ✨', time: '10:37 AM', isOwn: false, avatar: 'SK' },
  ];

  const activeRoomData = chatRooms.find(room => room.id === activeRoom);

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
                {room.unread > 0 && (
                  <Badge className="bg-red-500 text-white text-xs w-5 h-5 p-0 flex items-center justify-center">
                    {room.unread}
                  </Badge>
                )}
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
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {activeRoomData.members}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {activeRoomData.lastMessage}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Chat Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${msg.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {!msg.isOwn && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{msg.avatar}</span>
                </div>
              )}
              
              <div
                className={`px-4 py-3 rounded-2xl shadow-sm ${
                  msg.isOwn
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white border text-gray-800 rounded-bl-md'
                }`}
              >
                {!msg.isOwn && (
                  <p className="text-xs font-semibold mb-1 text-blue-600">{msg.user}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.message}</p>
                <p className={`text-xs mt-2 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Message Input */}
      <div className="bg-white border-t p-4 shadow-lg">
        <div className="flex items-center space-x-2 mb-2">
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
            size="sm" 
            className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 shadow-md"
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Press Enter to send • Be respectful and helpful
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
