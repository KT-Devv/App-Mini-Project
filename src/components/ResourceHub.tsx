import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Upload, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: string;
  subject: string;
  downloads: number;
  created_at: string;
  profiles?: {
    username: string;
  };
}

const ResourceHub = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    subject: '',
    file_type: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data: resourcesData, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load resources');
      setLoading(false);
      return;
    }

    // Fetch profiles separately for resource uploaders
    const userIds = [...new Set(resourcesData?.map(resource => resource.uploaded_by).filter(Boolean))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    // Combine resources with profile data
    const resourcesWithProfiles = resourcesData?.map(resource => ({
      ...resource,
      profiles: profilesData?.find(profile => profile.id === resource.uploaded_by) || { username: 'Unknown' }
    })) || [];

    setResources(resourcesWithProfiles);
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewResource({
        ...newResource,
        file_type: file.type,
        title: newResource.title || file.name.split('.')[0]
      });
    }
  };

  const uploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    try {
      // For demo purposes, we'll simulate file upload
      // In a real app, you'd upload to Supabase Storage
      const fileUrl = `demo-files/${selectedFile.name}`;
      const fileSize = `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`;

      const { error } = await supabase
        .from('resources')
        .insert({
          ...newResource,
          file_url: fileUrl,
          file_size: fileSize,
          uploaded_by: user.id
        });

      if (error) {
        toast.error('Failed to upload resource');
      } else {
        toast.success('Resource uploaded successfully!');
        setShowUploadModal(false);
        setNewResource({
          title: '',
          description: '',
          subject: '',
          file_type: ''
        });
        setSelectedFile(null);
        fetchResources();
      }
    } catch (error) {
      toast.error('Failed to upload resource');
    }
  };

  const downloadResource = async (resourceId: string) => {
    // Increment download count
    const { error } = await supabase
      .from('resources')
      .update({ downloads: resources.find(r => r.id === resourceId)?.downloads + 1 || 1 })
      .eq('id', resourceId);

    if (!error) {
      toast.success('Download started!');
      fetchResources();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-20 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Resource Hub</h2>
          <p className="text-gray-600">Share and access study materials</p>
        </div>
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Study Resource</DialogTitle>
            </DialogHeader>
            <form onSubmit={uploadResource} className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png"
                  required
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newResource.title}
                  onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={newResource.subject}
                  onValueChange={(value) => setNewResource({...newResource, subject: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newResource.description}
                  onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                  placeholder="Describe what this resource covers..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={!selectedFile}>
                Upload Resource
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search resources..."
          className="pl-10"
        />
      </div>

      {/* Subject Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'].map((subject) => (
          <Button
            key={subject}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            {subject}
          </Button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="grid gap-4">
        {resources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{resource.title}</h4>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                  </div>
                </div>
                <Badge variant="outline">{resource.subject}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>Uploaded by {resource.profiles?.username || 'Unknown'}</span>
                <span>{resource.file_size}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Download className="h-3 w-3 mr-1" />
                    {resource.downloads} downloads
                  </span>
                  <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => downloadResource(resource.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {resources.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
          <p className="text-gray-500 mb-4">Be the first to share a study resource!</p>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload First Resource
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResourceHub;
