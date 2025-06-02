
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, Lightbulb, BookOpen, Calculator, Microscope, History, Sparkles, MessageCircle } from 'lucide-react';

const AIAssistant = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { 
      id: 1, 
      type: 'ai', 
      message: 'Hello! I\'m your AI study assistant powered by advanced AI. I can help you with math problems, explain complex concepts, provide study tips, create practice questions, and much more. What would you like to learn about today? ✨', 
      time: '10:00 AM',
      category: 'welcome'
    },
  ]);

  const quickPrompts = [
    { text: 'Explain derivatives step by step', icon: Calculator, subject: 'Mathematics', color: 'bg-blue-500' },
    { text: 'What is photosynthesis?', icon: Microscope, subject: 'Biology', color: 'bg-green-500' },
    { text: 'Help with essay structure', icon: BookOpen, subject: 'English', color: 'bg-purple-500' },
    { text: 'World War II timeline', icon: History, subject: 'History', color: 'bg-orange-500' },
    { text: 'Practice quiz questions', icon: Lightbulb, subject: 'General', color: 'bg-pink-500' },
    { text: 'Study schedule tips', icon: Brain, subject: 'Study Skills', color: 'bg-indigo-500' },
  ];

  const categories = [
    { name: 'Mathematics', count: 15, color: 'bg-blue-100 text-blue-700' },
    { name: 'Science', count: 12, color: 'bg-green-100 text-green-700' },
    { name: 'Languages', count: 8, color: 'bg-purple-100 text-purple-700' },
    { name: 'History', count: 6, color: 'bg-orange-100 text-orange-700' },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: chatHistory.length + 1,
        type: 'user',
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'user'
      };
      
      setChatHistory([...chatHistory, newMessage]);
      setMessage('');
      setIsTyping(true);
      
      // Simulate AI response with more realistic delay
      setTimeout(() => {
        const responses = [
          'Great question! Let me break this down for you step by step. This is a fundamental concept that builds on several key principles...',
          'I understand you want to learn about that topic. Here\'s a comprehensive explanation with examples to help you understand better...',
          'This is an interesting problem! Let me guide you through the solution process and explain the reasoning behind each step...',
          'That\'s a complex topic, but I can make it simple for you. Let\'s start with the basics and build up your understanding...',
        ];
        
        const aiResponse = {
          id: chatHistory.length + 2,
          type: 'ai',
          message: responses[Math.floor(Math.random() * responses.length)],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'explanation'
        };
        setChatHistory(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-20">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Brain className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Study Assistant</h2>
            <p className="text-sm text-purple-100">Your personal learning companion powered by AI</p>
          </div>
          <div className="ml-auto">
            <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          {categories.map((category, index) => (
            <div key={index} className="bg-white bg-opacity-10 rounded-lg p-2 backdrop-blur-sm">
              <p className="text-lg font-bold">{category.count}</p>
              <p className="text-xs text-purple-100">{category.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Quick Prompts */}
      <div className="p-4 bg-white border-b shadow-sm">
        <h3 className="text-sm font-semibold mb-3 flex items-center">
          <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />
          Quick Study Help
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {quickPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="h-auto p-3 justify-start hover:shadow-md transition-all"
              onClick={() => handleQuickPrompt(prompt.text)}
            >
              <div className={`w-8 h-8 ${prompt.color} rounded-lg flex items-center justify-center mr-3 flex-shrink-0`}>
                <prompt.icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-medium truncate">{prompt.text}</p>
                <p className="text-xs text-gray-500">{prompt.subject}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Enhanced Chat Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                chat.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white border text-gray-800 shadow-md rounded-bl-md'
              }`}
            >
              {chat.type === 'ai' && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Brain className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-purple-600">AI Assistant</span>
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                </div>
              )}
              <p className="text-sm leading-relaxed">{chat.message}</p>
              <p className={`text-xs mt-2 ${chat.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {chat.time}
              </p>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Message Input */}
      <div className="bg-white border-t p-4 shadow-lg">
        <div className="flex space-x-2 mb-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Ask me anything about your studies..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="rounded-full border-gray-300 focus:border-purple-500"
            />
          </div>
          <Button 
            onClick={handleSendMessage} 
            size="sm" 
            className="rounded-full w-10 h-10 p-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
            disabled={!message.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            💡 Try asking for explanations, practice problems, or study tips
          </p>
          <Badge variant="outline" className="text-xs">
            <MessageCircle className="h-3 w-3 mr-1" />
            {chatHistory.length - 1} messages
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
