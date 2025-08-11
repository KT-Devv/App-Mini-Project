
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image, File } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    message_type?: string;
    file_url?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    file_size?: number | null;
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            {message.message_type === 'file' && message.file_url ? (
              <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-200">
                    {getFileIcon(message.file_type || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{message.file_name}</p>
                    <p className="text-xs text-blue-200">
                      {message.file_size ? formatFileSize(message.file_size) : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-200 hover:text-white hover:bg-white/20"
                    onClick={() => handleFileDownload(message.file_url!, message.file_name!)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : message.message_type === 'image' && message.file_url ? (
              <div className="space-y-2">
                <img 
                  src={message.file_url} 
                  alt={message.file_name || 'Shared image'} 
                  className="max-w-full h-auto rounded-lg max-h-64 object-cover"
                />
                {message.content && (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            ) : (
              processContent(message.content)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
