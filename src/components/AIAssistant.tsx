import { useState, useRef, useEffect } from 'react';
import { queryGemini } from '../lib/geminiAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Brain } from 'lucide-react';
import GeminiResponse from './GeminiResponse';

const LOCAL_STORAGE_KEY = 'aiAssistantChatHistory';

const AIAssistant = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return [{
      id: 1,
      type: 'ai',
      message: "Hi! I'm your AI study assistant. Ask me anything about your studies.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping) return;
    const newMessage = {
      id: Date.now(),
      type: 'user',
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, newMessage]);
    setMessage('');
    setIsTyping(true);
    try {
      const aiContent = await queryGemini(message);
      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          message: aiContent,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          message: 'Sorry, the AI is currently unavailable.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">Study companion</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 max-w-2xl mx-auto">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    chat.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                  style={{ minWidth: '120px', border: '1px solid #e5e7eb' }}
                >
                  {chat.type === 'ai' ? (
                    <div className="text-sm prose prose-sm dark:prose-invert">
                      <GeminiResponse responseText={chat.message} />
                    </div>
                  ) : (
                    <p className="text-sm">{chat.message}</p>
                  )}
                  <p className={`text-xs mt-1 ${
                    chat.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {chat.time}
                  </p>
                </div>
              </div>
            ))}
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]" style={{ minWidth: '120px', border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t bg-card p-4 relative z-10 pb-[calc(env(safe-area-inset-bottom)+4rem)]">
        <div className="max-w-2xl mx-auto">
          <form className="flex space-x-2 min-h-[60px]" onSubmit={e => { e.preventDefault(); handleSendMessage(); }}>
            <Input
              placeholder="Ask me anything..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="flex-1 border border-primary rounded-lg px-4 py-2 bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isTyping}
            />
            <Button
              type="submit"
              disabled={!message.trim() || isTyping}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
