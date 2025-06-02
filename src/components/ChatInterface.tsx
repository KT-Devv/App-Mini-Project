
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Plus, Search, Users, Clock } from 'lucide-react';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [activeRoom, setActiveRoom] = useState('general');

  const chatRooms = [
    { id: 'general', name: 'General Discussion', members: 24, lastMessage: '2 min ago', unread: 3 },
    { id: 'math', name: 'Mathematics Help', members: 15, lastMessage: '5 min ago', unread: 1 },
    { id: 'physics', name: 'Physics Problems', members: 12, lastMessage: '10 min ago', unread: 0 },
    { id: 'chemistry', name: 'Chemistry Lab', members: 8, lastMessage: '1 hour ago', unread: 0 },
  ];

  const messages = [
    { id: 1, user: 'Alex M.', message: 'Can someone help me with calculus derivatives?', time: '10:30 AM', isOwn: false },
    { id: 2, user: 'Sarah K.', message: 'Sure! What specific problem are you working on?', time: '10:32 AM', isOwn: false },
    { id: 3, user: 'You', message: 'I can help too. Share the problem!', time: '10:33 AM', isOwn: true },
    { id: 4, user: 'Alex M.', message: 'Thanks! It\'s about finding the derivative of f(x) = x³ + 2x² - 5x + 1', time: '10:35 AM', isOwn: false },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      {/* Chat Rooms List */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Study Chats</h2>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        <div className="space-y-2">
          {chatRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => setActiveRoom(room.id)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                activeRoom === room.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-sm">{room.name}</h3>
                  {room.unread > 0 && (
                    <Badge className="bg-red-500 text-white text-xs w-5 h-5 p-0 flex items-center justify-center">
                      {room.unread}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {room.members}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {room.lastMessage}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                msg.isOwn
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-800'
              }`}
            >
              {!msg.isOwn && (
                <p className="text-xs font-semibold mb-1 text-blue-600">{msg.user}</p>
              )}
              <p className="text-sm">{msg.message}</p>
              <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" className="px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
