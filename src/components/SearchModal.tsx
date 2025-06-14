
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Users, MessageCircle, Video, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'resource' | 'session' | 'chat' | 'user';
  description?: string;
  subject?: string;
  username?: string;
}

const SearchModal = ({ isOpen, onClose, onNavigate }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const searchData = async (searchQuery: string) => {
    if (!searchQuery.trim() || !user) return;

    setLoading(true);
    try {
      // Search resources
      const { data: resources } = await supabase
        .from('resources')
        .select('id, title, description, subject')
        .or(`title.ilike.%${searchQuery}%, description.ilike.%${searchQuery}%, subject.ilike.%${searchQuery}%`)
        .limit(10);

      // Search study sessions
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('id, title, description, subject')
        .or(`title.ilike.%${searchQuery}%, description.ilike.%${searchQuery}%, subject.ilike.%${searchQuery}%`)
        .limit(10);

      // Search users/profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, email')
        .or(`username.ilike.%${searchQuery}%, email.ilike.%${searchQuery}%`)
        .limit(10);

      // Search chat rooms
      const { data: chatRooms } = await supabase
        .from('chat_rooms')
        .select('id, name, description')
        .or(`name.ilike.%${searchQuery}%, description.ilike.%${searchQuery}%`)
        .limit(10);

      const searchResults: SearchResult[] = [
        ...(resources || []).map(r => ({
          id: r.id,
          title: r.title,
          type: 'resource' as const,
          description: r.description,
          subject: r.subject
        })),
        ...(sessions || []).map(s => ({
          id: s.id,
          title: s.title,
          type: 'session' as const,
          description: s.description,
          subject: s.subject
        })),
        ...(profiles || []).map(p => ({
          id: p.id,
          title: p.username,
          type: 'user' as const,
          username: p.username
        })),
        ...(chatRooms || []).map(c => ({
          id: c.id,
          title: c.name,
          type: 'chat' as const,
          description: c.description
        }))
      ];

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        searchData(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'resource': return <FileText className="h-4 w-4" />;
      case 'session': return <Video className="h-4 w-4" />;
      case 'chat': return <MessageCircle className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'resource': return 'bg-orange-100 text-orange-800';
      case 'session': return 'bg-green-100 text-green-800';
      case 'chat': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'resource':
        onNavigate('resources');
        break;
      case 'session':
        onNavigate('study-rooms');
        break;
      case 'chat':
        onNavigate('chat');
        break;
      case 'user':
        onNavigate('profile');
        break;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search StudySphere
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for resources, sessions, users, or chats..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="text-center py-8 text-gray-500">
                Searching...
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No results found for "{query}"
              </div>
            )}

            {!query && (
              <div className="text-center py-8 text-gray-500">
                Start typing to search across StudySphere
              </div>
            )}

            <div className="space-y-2">
              {results.map((result) => (
                <Button
                  key={result.id}
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.title}</span>
                        <Badge className={`text-xs ${getTypeColor(result.type)}`}>
                          {result.type}
                        </Badge>
                      </div>
                      {result.description && (
                        <p className="text-sm text-gray-600 truncate">{result.description}</p>
                      )}
                      {result.subject && (
                        <p className="text-xs text-blue-600">{result.subject}</p>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
