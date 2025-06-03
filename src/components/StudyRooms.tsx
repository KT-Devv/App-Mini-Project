import React, { useState, useEffect } from 'react';
import { Card, CardContent,} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Users, Clock, Plus, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type Participant = {
  session_id: string;
  user_id: string;
  joined_at: string;
};

interface StudySession {
  id: string;
  title: string;
  subject: string;
  description: string;
  is_active: boolean;
  max_participants: number;
  created_at: string;
  scheduled_for: string;
  profiles?: {
    username: string;
  };
  session_participants: Participant[];
}

const StudyRooms = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    subject: '',
    description: '',
    max_participants: 10,
    scheduled_for: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchStudySessions().then((fetchedSessions) => {
      setSessions(fetchedSessions);
      setLoading(false);
    });
  }, []);

  const fetchStudySessions = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('study_sessions')
        .select(`
          id,
          title,
          subject,
          description,
          is_active,
          max_participants,
          created_at,
          scheduled_for,
          created_by,
          session_participants (
            session_id,
            user_id,
            joined_at
          )
        `);

      if (sessionsError) {
        console.error('Error fetching study sessions:', sessionsError);
        toast.error('Failed to fetch study sessions.');
        return [];
      }

      // Fetch profiles for the created_by field
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to fetch profiles.');
        return [];
      }

      // Map sessions with profiles and participants
      const sessionsWithProfiles = sessionsData.map((session) => ({
        ...session,
        profiles: profilesData.find((profile) => profile.id === session.created_by) || { username: 'Unknown' },
        session_participants: session.session_participants.map((participant) => ({
          session_id: participant.session_id,
          user_id: participant.user_id,
          joined_at: participant.joined_at,
        })),
      }));

      return sessionsWithProfiles;
    } catch (error) {
      console.error('Unexpected error fetching study sessions:', error);
      toast.error('An unexpected error occurred.');
      return [];
    }
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from('study_sessions')
      .insert({
        ...newSession,
        created_by: user.id,
        is_active: true
      });

    if (error) {
      toast.error('Failed to create session');
    } else {
      toast.success('Study session created!');
      setShowCreateModal(false);
      setNewSession({
        title: '',
        subject: '',
        description: '',
        max_participants: 10,
        scheduled_for: ''
      });
      fetchStudySessions().then((fetchedSessions) => setSessions(fetchedSessions));
    }
  };

  const joinSession = async (sessionId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('session_participants')
      .insert({
        session_id: sessionId,
        user_id: user.id
      });

    if (error) {
      if (error.message.includes('duplicate key')) {
        toast.info('You are already in this session');
      } else {
        toast.error('Failed to join session');
      }
    } else {
      toast.success('Joined session successfully!');
      fetchStudySessions().then((fetchedSessions) => setSessions(fetchedSessions));
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
          <h2 className="text-2xl font-bold">Study Rooms</h2>
          <p className="text-gray-600">Join or create collaborative study sessions</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={createSession} className="space-y-4">
              <div>
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={newSession.title}
                  onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={newSession.subject}
                  onValueChange={(value) => setNewSession({...newSession, subject: value})}
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
                  value={newSession.description}
                  onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="max_participants">Max Participants</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="2"
                  max="50"
                  value={newSession.max_participants}
                  onChange={(e) => setNewSession({...newSession, max_participants: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="scheduled_for">Scheduled For (Optional)</Label>
                <Input
                  id="scheduled_for"
                  type="datetime-local"
                  value={newSession.scheduled_for}
                  onChange={(e) => setNewSession({...newSession, scheduled_for: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full">Create Session</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
        <div className="grid gap-4">
          {sessions.filter(session => session.is_active).map((session) => (
            <Card key={session.id} className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h4 className="font-semibold text-green-800">{session.title}</h4>
                  </div>
                  <Badge className="bg-green-600 text-white">Live</Badge>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-green-700">{session.description}</p>
                  <div className="flex items-center justify-between text-xs text-green-600">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {session.session_participants?.length || 0}/{session.max_participants} participants
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {session.subject}
                    </span>
                  </div>
                  <p className="text-xs text-green-600">
                    Created by {session.profiles?.username || 'Unknown'}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => joinSession(session.id)}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Upcoming Sessions</h3>
        <div className="grid gap-4">
          {sessions.filter(session => !session.is_active && session.scheduled_for).map((session) => (
            <Card key={session.id} className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h4 className="font-semibold text-blue-800">{session.title}</h4>
                  </div>
                  <Badge variant="outline" className="border-blue-600 text-blue-600">Scheduled</Badge>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-blue-700">{session.description}</p>
                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(session.scheduled_for).toLocaleString()}
                    </span>
                    <span>{session.subject}</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={() => joinSession(session.id)}
                >
                  Join When Live
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyRooms;
