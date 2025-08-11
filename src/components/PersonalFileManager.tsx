import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Upload, 
  Search, 
  Share2, 
  Bot, 
  Trash2, 
  Edit3,
  FolderOpen,
  Image as ImageIcon,
  File,
  Tag,
  Calendar,
  HardDrive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type PersonalFile = Tables<'personal_files'>;
type ChatRoom = Tables<'chat_rooms'>;
type FileShare = Tables<'file_shares'>;
type FileAIShare = Tables<'file_ai_shares'>;

interface PersonalFileManagerProps {
  onFileSelect?: (file: PersonalFile) => void;
  onShareToChat?: (file: PersonalFile, roomId: string) => void;
  onShareToAI?: (file: PersonalFile, purpose?: string) => void;
}

const PersonalFileManager: React.FC<PersonalFileManagerProps> = ({
  onFileSelect,
  onShareToChat,
  onShareToAI
}) => {
  const [files, setFiles] = useState<PersonalFile[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIShareModal, setShowAIShareModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileToShare, setFileToShare] = useState<PersonalFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fileStats, setFileStats] = useState<{
    total_files: number;
    total_size: number;
    file_types: string[];
    recent_uploads: number;
  } | null>(null);
  
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newFile, setNewFile] = useState({
    description: '',
    tags: [] as string[]
  });

  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchChatRooms();
      fetchFileStats();
    }
  }, [user]);

  const fetchFiles = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('personal_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load files');
      return;
    }

    setFiles(data || []);
    setLoading(false);
  };

  const fetchChatRooms = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_room_members')
      .select(`
        chat_rooms (
          id,
          name,
          description
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching chat rooms:', error);
      return;
    }

    const rooms = data?.map(item => item.chat_rooms).filter(Boolean) || [];
    setChatRooms(rooms);
  };

  const fetchFileStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_user_file_stats', { user_uuid: user.id });

    if (error) {
      console.error('Error fetching file stats:', error);
      return;
    }

    if (data && data.length > 0) {
      setFileStats(data[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setNewFile({
        ...newFile,
        description: newFile.description || file.name.split('.')[0]
      });
    }
  };

  const uploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    try {
      setLoading(true);
      
      // Upload to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `personal-files/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('personal_files')
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          file_name: fileName,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          original_name: selectedFile.name,
          description: newFile.description,
          tags: newFile.tags
        });

      if (dbError) {
        throw dbError;
      }

      toast.success('File uploaded successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setNewFile({ description: '', tags: [] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchFiles();
      fetchFileStats();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const { error } = await supabase
        .from('personal_files')
        .delete()
        .eq('id', fileId);

      if (error) {
        throw error;
      }

      toast.success('File deleted successfully!');
      fetchFiles();
      fetchFileStats();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const shareToChat = async (roomId: string) => {
    if (!fileToShare || !user) return;

    try {
      // Create file share record
      const { error: shareError } = await supabase
        .from('file_shares')
        .insert({
          file_id: fileToShare.id,
          chat_room_id: roomId,
          shared_by: user.id
        });

      if (shareError) {
        throw shareError;
      }

      toast.success('File shared to chat room!');
      setShowShareModal(false);
      setFileToShare(null);

      // Call the callback if provided
      if (onShareToChat) {
        onShareToChat(fileToShare, roomId);
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to share file');
    }
  };

  const shareToAI = async (purpose: string) => {
    if (!fileToShare || !user) return;

    try {
      // Create AI share record
      const { error: shareError } = await supabase
        .from('file_ai_shares')
        .insert({
          file_id: fileToShare.id,
          user_id: user.id,
          purpose: purpose
        });

      if (shareError) {
        throw shareError;
      }

      toast.success('File shared with AI!');
      setShowAIShareModal(false);
      setFileToShare(null);

      // Call the callback if provided
      if (onShareToAI) {
        onShareToAI(fileToShare, purpose);
      }
    } catch (error) {
      console.error('Error sharing file with AI:', error);
      toast.error('Failed to share file with AI');
    }
  };

  const downloadFile = async (file: PersonalFile) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-6 w-6" />;
    if (fileType.includes('pdf')) return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTags = selectedTags.length === 0 || 
                       (file.tags && selectedTags.some(tag => file.tags?.includes(tag)));
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(files.flatMap(file => file.tags || [])));

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">My Files</h2>
          <p className="text-gray-600">Manage your private files and share them</p>
        </div>
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New File</DialogTitle>
            </DialogHeader>
            <form onSubmit={uploadFile} className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png,.gif"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newFile.description}
                  onChange={(e) => setNewFile({...newFile, description: e.target.value})}
                  placeholder="Describe this file..."
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={newFile.tags.join(', ')}
                  onChange={(e) => setNewFile({
                    ...newFile, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  placeholder="study, notes, math..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={!selectedFile || loading}>
                {loading ? 'Uploading...' : 'Upload File'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {fileStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold">{fileStats.total_files}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Size</p>
                  <p className="text-2xl font-bold">{formatFileSize(fileStats.total_size)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">File Types</p>
                  <p className="text-2xl font-bold">{fileStats.file_types.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">{fileStats.recent_uploads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTags(prev => 
                  prev.includes(tag) 
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                )}
              >
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Files Grid */}
      <div className="grid gap-4">
        {filteredFiles.map((file) => (
          <Card key={file.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{file.original_name}</h4>
                    <p className="text-sm text-gray-600">{file.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFileToShare(file);
                      setShowShareModal(true);
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFileToShare(file);
                      setShowAIShareModal(true);
                    }}
                  >
                    <Bot className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>{formatFileSize(file.file_size)}</span>
                <span>{new Date(file.created_at).toLocaleDateString()}</span>
              </div>
              
              {file.tags && file.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {file.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Button 
                  size="sm" 
                  onClick={() => downloadFile(file)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {onFileSelect && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onFileSelect(file)}
                  >
                    Select
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || selectedTags.length > 0 
              ? 'Try adjusting your search or filters'
              : 'Upload your first file to get started!'
            }
          </p>
          {!searchQuery && selectedTags.length === 0 && (
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First File
            </Button>
          )}
        </div>
      )}

      {/* Share to Chat Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File to Chat Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Share "{fileToShare?.original_name}" to a chat room
            </p>
            <div className="space-y-2">
              {chatRooms.map((room) => (
                <Button
                  key={room.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareToChat(room.id)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {room.name}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share to AI Modal */}
      <Dialog open={showAIShareModal} onOpenChange={setShowAIShareModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Share "{fileToShare?.original_name}" with AI for analysis
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => shareToAI('General analysis')}
              >
                <Bot className="h-4 w-4 mr-2" />
                General Analysis
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => shareToAI('Study help')}
              >
                <Bot className="h-4 w-4 mr-2" />
                Study Help
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => shareToAI('Content summary')}
              >
                <Bot className="h-4 w-4 mr-2" />
                Content Summary
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonalFileManager;
