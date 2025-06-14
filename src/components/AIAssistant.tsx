
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Send, Lightbulb, BookOpen, Calculator, Microscope, History, Sparkles, MessageCircle, Zap, Users, Target } from 'lucide-react';

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

  const features = [
    { icon: Brain, title: 'Smart Learning', description: 'Personalized explanations', color: 'bg-blue-500' },
    { icon: Zap, title: 'Instant Help', description: '24/7 availability', color: 'bg-yellow-500' },
    { icon: Users, title: 'Study Groups', description: 'Collaborative learning', color: 'bg-green-500' },
    { icon: Target, title: 'Goal Tracking', description: 'Progress monitoring', color: 'bg-red-500' },
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-indigo-50 pb-20">
      {/* Modern Header */}
      <div className="bg-white border-b shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Study Assistant
              </h1>
              <p className="text-gray-600 text-sm">Your intelligent learning companion</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200">
              Premium AI
            </Badge>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-4 gap-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 text-center">
                <div className={`w-8 h-8 ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <feature.icon className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Prompts Section */}
      <div className="bg-white border-b p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center text-gray-900">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
            Quick Start
          </h2>
          <Badge variant="secondary" className="text-xs">
            {quickPrompts.length} topics
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {quickPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 justify-start hover:shadow-md transition-all duration-200 group border-gray-200 hover:border-purple-300"
              onClick={() => handleQuickPrompt(prompt.text)}
            >
              <div className={`w-10 h-10 ${prompt.color} rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200`}>
                <prompt.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-gray-900 text-sm mb-1">{prompt.text}</p>
                <p className="text-xs text-gray-500">{prompt.subject}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] shadow-sm ${
                chat.type === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl rounded-br-lg'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-3xl rounded-bl-lg'
              }`}
            >
              {chat.type === 'ai' && (
                <div className="flex items-center space-x-3 p-4 pb-2 border-b border-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-purple-600">AI Assistant</span>
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </div>
              )}
              <div className="p-4">
                <p className="text-base leading-relaxed">{chat.message}</p>
                <p className={`text-sm mt-3 ${chat.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {chat.time}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm">
              <div className="flex items-center space-x-3 p-4 pb-2 border-b border-gray-100">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-purple-600">AI Assistant</span>
              </div>
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t shadow-lg p-6">
        <div className="flex space-x-4 mb-4">
          <div className="flex-1 relative">
            <Input
              placeholder="Ask me anything about your studies..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="rounded-2xl border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-base py-4 px-6 pr-20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Button 
                onClick={handleSendMessage} 
                size="sm" 
                className="rounded-xl w-10 h-10 p-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
                disabled={!message.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 flex items-center">
            <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
            Ask for explanations, practice problems, or study guidance
          </p>
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
            <MessageCircle className="h-3 w-3 mr-1" />
            {chatHistory.length - 1} messages
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
