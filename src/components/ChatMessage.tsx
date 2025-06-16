
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  currentUserId: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, currentUserId }) => {
  const isOwnMessage = message.user_id === currentUserId;
  const displayName = message.display_name || message.username || 'Unknown User';
  const avatarFallback = displayName[0]?.toUpperCase() || 'U';

  // Process mentions in the message content
  const processContent = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a username (odd indices after split)
        return (
          <span 
            key={index} 
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium"
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex items-start space-x-4 group hover:bg-slate-50 -mx-2 px-2 py-3 rounded-xl transition-colors duration-200">
      <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm flex-shrink-0 mt-1">
        <AvatarImage src={message.avatar_url || ""} />
        <AvatarFallback className={`text-white font-semibold ${
          isOwnMessage 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
            : 'bg-gradient-to-br from-slate-500 to-slate-600'
        }`}>
          {avatarFallback}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className={`rounded-2xl p-4 shadow-sm border transition-all duration-200 ${
          isOwnMessage
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-200 ml-8'
            : 'bg-white border-slate-200 mr-8 group-hover:shadow-md'
        }`}>
          <div className="flex items-baseline justify-between mb-2">
            <span className={`text-sm font-semibold ${
              isOwnMessage ? 'text-blue-100' : 'text-slate-900'
            }`}>
              {isOwnMessage ? 'You' : displayName}
            </span>
            <span className={`text-xs ml-3 flex-shrink-0 ${
              isOwnMessage ? 'text-blue-200' : 'text-slate-500'
            }`}>
              {formatTime(message.created_at)}
            </span>
          </div>
          
          <div className={`break-words leading-relaxed ${
            isOwnMessage ? 'text-white' : 'text-slate-800'
          }`}>
            {processContent(message.content)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
