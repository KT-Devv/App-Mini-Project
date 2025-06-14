
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
            className="bg-blue-100 text-blue-800 px-1 rounded font-medium"
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex items-start space-x-3">
      <Avatar className="h-10 w-10 mt-1">
        <AvatarImage src={message.avatar_url || ""} />
        <AvatarFallback className={`text-white text-sm ${
          isOwnMessage ? 'bg-blue-500' : 'bg-gray-500'
        }`}>
          {avatarFallback}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-sm font-semibold text-gray-900">
              {isOwnMessage ? 'You' : displayName}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(message.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <div className="text-gray-700 break-words">
            {processContent(message.content)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
