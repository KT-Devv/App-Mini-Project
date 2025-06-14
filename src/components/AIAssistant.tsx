
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { text: 'Explain derivatives', icon: Calculator, color: 'bg-blue-500' },
    { text: 'What is photosynthesis?', icon: Microscope, color: 'bg-green-500' },
    { text: 'Essay structure help', icon: BookOpen, color: 'bg-purple-500' },
    { text: 'WW2 timeline', icon: History, color: 'bg-orange-500' },
  ];

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

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
          'Great question! Let me break this down for you step by step. This is a fundamental concept that builds on several key principles. First, we need to understand the basic structure and then we can dive into the more complex aspects. This will help you build a solid foundation for understanding more advanced topics in this subject area.',
          'I understand you want to learn about that topic. Here\'s a comprehensive explanation with examples to help you understand better. This concept is particularly important because it forms the basis for many other ideas you\'ll encounter. Let me walk you through it systematically so you can grasp both the theory and practical applications.',
          'This is an interesting problem! Let me guide you through the solution process and explain the reasoning behind each step. Understanding the methodology is just as important as getting the right answer, so I\'ll make sure to explain why we take each approach and how it connects to the broader concepts.',
          'That\'s a complex topic, but I can make it simple for you. Let\'s start with the basics and build up your understanding gradually. I\'ll use analogies and examples that relate to things you already know, which will make it much easier to grasp these new concepts.',
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Compact Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b shadow-sm p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Study Assistant
              </h1>
              <p className="text-gray-600 text-xs">Your intelligent learning companion</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200 text-xs">
              Premium AI
            </Badge>
          </div>
        </div>
      </div>

      {/* Compact Quick Prompts */}
      <div className="bg-white/90 backdrop-blur-sm border-b p-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold flex items-center text-gray-900">
            <Lightbulb className="h-4 w-4 mr-1 text-yellow-600" />
            Quick Start
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quickPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="h-auto p-3 justify-start hover:shadow-md transition-all duration-200 group border-gray-200 hover:border-purple-300"
              onClick={() => handleQuickPrompt(prompt.text)}
            >
              <div className={`w-7 h-7 ${prompt.color} rounded-lg flex items-center justify-center mr-2 group-hover:scale-110 transition-transform duration-200`}>
                <prompt.icon className="h-3 w-3 text-white" />
              </div>
              <span className="font-medium text-gray-900 text-xs">{prompt.text}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Chat Area - Much Larger */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-6 max-w-4xl mx-auto">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] shadow-lg ${
                    chat.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl rounded-br-lg'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-3xl rounded-bl-lg'
                  }`}
                >
                  {chat.type === 'ai' && (
                    <div className="flex items-center space-x-3 p-5 pb-3 border-b border-gray-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-base font-semibold text-purple-600">AI Assistant</span>
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-lg leading-relaxed font-medium">{chat.message}</p>
                    <p className={`text-sm mt-4 ${chat.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {chat.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-gray-200 rounded-3xl shadow-lg max-w-[85%]">
                  <div className="flex items-center space-x-3 p-5 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-base font-semibold text-purple-600">AI Assistant</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-base text-gray-500 font-medium">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="bg-white/95 backdrop-blur-sm border-t shadow-lg p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3 mb-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Ask me anything about your studies..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="rounded-2xl border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-lg py-6 px-6 pr-16 h-auto"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Button 
                  onClick={handleSendMessage} 
                  size="sm" 
                  className="rounded-xl w-12 h-12 p-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
                  disabled={!message.trim() || isTyping}
                >
                  <Send className="h-5 w-5" />
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
    </div>
  );
};

export default AIAssistant;
