
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, Lightbulb, BookOpen, Calculator, Microscope, History } from 'lucide-react';

const AIAssistant = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { 
      id: 1, 
      type: 'ai', 
      message: 'Hello! I\'m your AI study assistant. I can help you with math problems, explain concepts, provide study tips, and much more. What would you like to learn about today?', 
      time: '10:00 AM' 
    },
  ]);

  const quickPrompts = [
    { text: 'Explain derivatives', icon: Calculator, subject: 'Mathematics' },
    { text: 'What is photosynthesis?', icon: Microscope, subject: 'Biology' },
    { text: 'Help with essay writing', icon: BookOpen, subject: 'English' },
    { text: 'World War II timeline', icon: History, subject: 'History' },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: chatHistory.length + 1,
        type: 'user',
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatHistory([...chatHistory, newMessage]);
      setMessage('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: chatHistory.length + 2,
          type: 'ai',
          message: 'I understand you want to learn about that topic. Let me break it down for you step by step...',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">AI Study Assistant</h2>
            <p className="text-sm text-purple-100">Your personal learning companion</p>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="p-4 bg-white border-b">
        <h3 className="text-sm font-semibold mb-2">Quick Study Help</h3>
        <div className="grid grid-cols-2 gap-2">
          {quickPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="h-auto p-2 justify-start"
              onClick={() => handleQuickPrompt(prompt.text)}
            >
              <prompt.icon className="h-4 w-4 mr-2 text-blue-600" />
              <div className="text-left">
                <p className="text-xs font-medium">{prompt.text}</p>
                <p className="text-xs text-gray-500">{prompt.subject}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                chat.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-800 shadow-sm'
              }`}
            >
              {chat.type === 'ai' && (
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-600">AI Assistant</span>
                </div>
              )}
              <p className="text-sm">{chat.message}</p>
              <p className={`text-xs mt-2 ${chat.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {chat.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Ask me anything about your studies..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="sm" className="px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          AI responses are generated for demonstration purposes
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
