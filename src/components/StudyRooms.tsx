
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import SessionCard from './SessionCard';
import CreateSessionModal from './CreateSessionModal';
import ShareSessionModal from './ShareSessionModal';
import VideoConference from './VideoConference';

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
  start_time: string;
  session_url: string;
  status: string;
  profiles?: {
    username: string;
  };
  session_participants: Participant[];
}

const StudyRooms = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [currentVideoSession, setCurrentVideoSession] = useState<StudySession | null>(null);
  const [newSession, setNewSession] = useState({
    title: '',
    subject: '',
    description: '',
    max_participants: 10,
    scheduled_for: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchStudySessions();
    
    // Set up real-time subscriptions
    const sessionsChannel = supabase
      .channel('study-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions'
        },
        (payload) => {
          console.log('Session change:', payload);
          fetchStudySessions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants'
        },
        (payload) => {
          console.log('Participant change:', payload);
          fetchStudySessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
    };
  }, []);

  const fetchStudySessions = async () => {
    try {
      console.log('Fetching study sessions...');
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
          start_time,
          session_url,
          status,
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
        return;
      }

      console.log('Sessions data:', sessionsData);

      // Fetch profiles for the created_by field
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      console.log('Profiles data:', profilesData);

      // Map sessions with profiles and participants
      const sessionsWithProfiles = (sessionsData || []).map((session) => ({
        ...session,
        session_url: session.session_url || '',
        status: session.status || 'scheduled',
        profiles: profilesData?.find((profile) => profile.id === session.created_by) || { username: 'Unknown User' },
        session_participants: session.session_participants?.map((participant) => ({
          session_id: participant.session_id,
          user_id: participant.user_id,
          joined_at: participant.joined_at,
        })) || [],
      }));

      setSessions(sessionsWithProfiles);
      setLoading(false);
    } catch (error) {
      console.error('Unexpected error fetching study sessions:', error);
      toast.error('An unexpected error occurred.');
      setLoading(false);
    }
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create a session');
      return;
    }

    if (!newSession.title.trim()) {
      toast.error('Please enter a session title');
      return;
    }

    if (!newSession.subject) {
      toast.error('Please select a subject');
      return;
    }

    setCreating(true);
    
    // Generate a unique session URL
    const sessionUrl = `${window.location.origin}/session/${crypto.randomUUID()}`;
    
    console.log('Creating session with data:', { ...newSession, created_by: user.id, session_url: sessionUrl });

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          title: newSession.title.trim(),
          subject: newSession.subject,
          description: newSession.description.trim(),
          max_participants: newSession.max_participants,
          scheduled_for: newSession.scheduled_for || null,
          start_time: new Date().toISOString(),
          session_url: sessionUrl,
          status: 'live',
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        toast.error(`Failed to create session: ${error.message}`);
      } else {
        console.log('Session created successfully:', data);
        
        // Automatically join the session as the creator
        await joinSession(data.id);
        
        toast.success('Study session created successfully!');
        setShowCreateModal(false);
        setNewSession({
          title: '',
          subject: '',
          description: '',
          max_participants: 10,
          scheduled_for: ''
        });
        
        // Show share modal for the newly created session
        setSelectedSession({ 
          ...data, 
          session_participants: [], 
          profiles: { username: user.email?.split('@')[0] || 'You' } 
        });
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Unexpected error creating session:', error);
      toast.error('An unexpected error occurred while creating the session.');
    } finally {
      setCreating(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a session');
      return;
    }

    try {
      console.log('Joining session:', sessionId, 'as user:', user.id);
      
      // Check if user is already in the session
      const { data: existingParticipant } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (existingParticipant) {
        toast.info('You are already in this session');
        return;
      }

      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: user.id
        });

      if (error) {
        console.error('Error joining session:', error);
        toast.error(`Failed to join session: ${error.message}`);
      } else {
        toast.success('Joined session successfully!');
      }
    } catch (error) {
      console.error('Unexpected error joining session:', error);
      toast.error('An unexpected error occurred while joining the session.');
    }
  };

  const leaveSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving session:', error);
        toast.error('Failed to leave session');
      } else {
        toast.success('Left session successfully');
      }
    } catch (error) {
      console.error('Unexpected error leaving session:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const openShareModal = (session: StudySession) => {
    setSelectedSession(session);
    setShowShareModal(true);
  };

  const openVideoSession = (sessionUrl: string) => {
    const sessionId = sessionUrl.split('/').pop();
    const session = sessions.find(s => s.session_url === sessionUrl);
    if (session) {
      setCurrentVideoSession(session);
    }
  };

  const handleLeaveVideoSession = () => {
    setCurrentVideoSession(null);
  };

  const isUserInSession = (session: StudySession) => {
    return session.session_participants?.some(p => p.user_id === user?.id);
  };

  const handleFormChange = (field: string, value: string | number) => {
    setNewSession(prev => ({ ...prev, [field]: value }));
  };

  if (currentVideoSession) {
    return (
      <VideoConference
        sessionId={currentVideoSession.id}
        sessionTitle={currentVideoSession.title}
        onLeaveSession={handleLeaveVideoSession}
      />
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading study sessions...</div>;
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
        </Dialog>
      </div>

      {/* Active Sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
        <div className="grid gap-4">
          {sessions.filter(session => session.is_active && session.status === 'live').length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active sessions available. Create one to get started!</p>
          ) : (
            sessions.filter(session => session.is_active && session.status === 'live').map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isUserInSession={isUserInSession(session)}
                onJoinSession={joinSession}
                onLeaveSession={leaveSession}
                onShareSession={openShareModal}
                onOpenSession={openVideoSession}
              />
            ))
          )}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Upcoming Sessions</h3>
        <div className="grid gap-4">
          {sessions.filter(session => session.status === 'scheduled').length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming sessions scheduled.</p>
          ) : (
            sessions.filter(session => session.status === 'scheduled').map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isUserInSession={isUserInSession(session)}
                onJoinSession={joinSession}
                onLeaveSession={leaveSession}
                onShareSession={openShareModal}
                onOpenSession={openVideoSession}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createSession}
        formData={newSession}
        onFormChange={handleFormChange}
        isCreating={creating}
      />

      <ShareSessionModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        session={selectedSession}
      />
    </div>
  );
};

export default StudyRooms;
