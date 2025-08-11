import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Mic, MicOff, Paperclip, X, FileText, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  username: string;
  email: string;
}

interface UserMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  placeholder: string;
  disabled?: boolean;
  selectedFile?: File | null;
  onFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile?: () => void;
  isUploading?: boolean;
}

const UserMentionInput: React.FC<UserMentionInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  placeholder,
  disabled,
  selectedFile,
  onFileSelect,
  onRemoveFile,
  isUploading
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [mentionStart, setMentionStart] = useState(-1);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    
    // Check for @ mentions
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
      
      setFilteredUsers(filtered);
      setMentionStart(textBeforeCursor.length - mentionMatch[0].length);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (user: UserProfile) => {
    if (mentionStart === -1) return;
    
    const beforeMention = value.slice(0, mentionStart);
    const afterCursor = value.slice(textareaRef.current?.selectionStart || 0);
    const newValue = `${beforeMention}@${user.username} ${afterCursor}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(-1);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + user.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });
        
        if (error) throw error;
        
        if (data.text) {
          onChange(value + (value ? ' ' : '') + data.text);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-end space-x-4 bg-white rounded-2xl border-2 border-slate-200 p-3 shadow-sm transition-all duration-200 focus-within:border-blue-300 focus-within:shadow-md">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyPress={onKeyPress}
            placeholder={placeholder}
            className="min-h-[50px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-900 placeholder:text-slate-500"
            rows={1}
            disabled={disabled}
          />
          
          {/* File Input */}
          <input
            type="file"
            onChange={onFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx"
            id="file-upload"
          />
          
          {/* Selected File Display */}
          {selectedFile && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <div className="text-blue-600">
                  {selectedFile.type.startsWith('image/') ? (
                    <Image className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-blue-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                  onClick={onRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {showSuggestions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
              <div className="p-2">
                <div className="text-xs font-medium text-slate-500 mb-2 px-2">Mention someone:</div>
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => insertMention(user)}
                    className="w-full px-3 py-3 text-left hover:bg-slate-50 rounded-lg flex items-center space-x-3 transition-colors duration-150"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user.username[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">{user.username}</div>
                      <div className="text-xs text-slate-500">@{user.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Button
          onClick={() => document.getElementById('file-upload')?.click()}
          variant="ghost"
          size="sm"
          className="p-3 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant="ghost"
          size="sm"
          className={`p-3 rounded-xl transition-all duration-200 ${
            isRecording 
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        
        <Button 
          onClick={onSend}
          disabled={(!value.trim() && !selectedFile) || disabled || isUploading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {isRecording && (
        <div className="absolute -top-16 left-0 right-0 flex items-center justify-center">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm flex items-center space-x-2 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Recording audio...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMentionInput;
