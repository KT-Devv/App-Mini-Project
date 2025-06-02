
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Share, Search, Filter, Eye } from 'lucide-react';

const ResourceHub = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const resources = [
    { 
      id: 1, 
      title: 'Calculus Derivatives Notes', 
      type: 'PDF', 
      subject: 'Mathematics', 
      author: 'Sarah K.', 
      downloads: 45, 
      size: '2.3 MB',
      uploadDate: '2 days ago'
    },
    { 
      id: 2, 
      title: 'Physics Lab Report Template', 
      type: 'DOCX', 
      subject: 'Physics', 
      author: 'Alex M.', 
      downloads: 32, 
      size: '1.1 MB',
      uploadDate: '1 week ago'
    },
    { 
      id: 3, 
      title: 'Organic Chemistry Reactions', 
      type: 'PDF', 
      subject: 'Chemistry', 
      author: 'John D.', 
      downloads: 67, 
      size: '4.2 MB',
      uploadDate: '3 days ago'
    },
    { 
      id: 4, 
      title: 'Cell Biology Diagrams', 
      type: 'PNG', 
      subject: 'Biology', 
      author: 'Emma R.', 
      downloads: 28, 
      size: '800 KB',
      uploadDate: '5 days ago'
    },
  ];

  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History'];
  const [selectedSubject, setSelectedSubject] = useState('All');

  const filteredResources = resources.filter(resource => 
    (selectedSubject === 'All' || resource.subject === selectedSubject) &&
    resource.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Upload Section */}
      <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-2">Share Your Resources</h2>
          <p className="text-purple-100 mb-4">Help your peers by sharing notes, assignments, and study materials</p>
          <Button className="bg-white text-purple-600 hover:bg-purple-50">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {subjects.map((subject) => (
            <Button
              key={subject}
              variant={selectedSubject === subject ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSubject(subject)}
              className="whitespace-nowrap"
            >
              {subject}
            </Button>
          ))}
        </div>
      </div>

      {/* Resources List */}
      <div className="space-y-3">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate">{resource.title}</h3>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" className="p-1">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="secondary" className="text-xs">{resource.type}</Badge>
                    <Badge variant="outline" className="text-xs">{resource.subject}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>by {resource.author} • {resource.uploadDate}</span>
                    <span>{resource.size}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Download className="h-3 w-3 mr-1" />
                      {resource.downloads} downloads
                    </span>
                    <Button size="sm" className="text-xs px-3 py-1">
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Your Contributions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">8</p>
              <p className="text-xs text-gray-600">Files Shared</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">156</p>
              <p className="text-xs text-gray-600">Downloads</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">24</p>
              <p className="text-xs text-gray-600">Likes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceHub;
