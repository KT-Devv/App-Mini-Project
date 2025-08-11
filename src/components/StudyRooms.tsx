import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import SessionCard from './SessionCard';
import CreateSessionModal from './CreateSessionModal';
import ShareSessionModal from './ShareSessionModal';
import VideoConference from './video/VideoConference';

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
        () => {
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
        () => {
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
          created_by,
          session_participants (
            session_id,
            user_id,
            joined_at
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching study sessions:', sessionsError);
        toast.error('Failed to fetch study sessions. Please refresh the page.');
        return;
      }

      console.log('Sessions data fetched:', sessionsData?.length || 0, 'sessions');

      // Fetch profiles for the created_by field
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Map sessions with profiles and participants
      const sessionsWithProfiles = (sessionsData || []).map((session) => ({
        ...session,
        session_url: `${window.location.origin}/session/${session.id}`,
        status: session.is_active ? 'live' : 'scheduled',
        profiles: profilesData?.find((profile) => profile.id === session.created_by) || { username: 'Unknown User' },
        session_participants: session.session_participants || [],
      }));

      setSessions(sessionsWithProfiles);
    } catch (error) {
      console.error('Unexpected error fetching study sessions:', error);
      toast.error('An unexpected error occurred while loading sessions.');
    } finally {
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
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        toast.error(`Failed to create session: ${error.message}`);
        return;
      }

      console.log('Session created successfully:', data);
      
      // Automatically join the session as the creator
      await joinSession(data.id);
      // Immediately refresh list so the new session appears without a full reload
      await fetchStudySessions();
      
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
        session_url: `${window.location.origin}/session/${data.id}`,
        status: 'live',
        session_participants: [], 
        profiles: { username: user.email?.split('@')[0] || 'You' } 
      });
      setShowShareModal(true);
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
        console.log('User already in session, proceeding to video');
        toast.info('Joining session...');
        
        // Find the session and open video conference
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          setCurrentVideoSession(session);
        }
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
        return;
      }

      console.log('Successfully joined session');
      toast.success('Joined session successfully!');
      
      // Open video conference
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentVideoSession(session);
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
        return;
      }

      toast.success('Left session successfully');
      console.log('Successfully left session:', sessionId);
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
    const session = sessions.find(s => s.session_url === sessionUrl);
    if (session) {
      console.log('Opening video session:', session.title);
      setCurrentVideoSession(session);
    }
  };

  const handleLeaveVideoSession = () => {
    console.log('Leaving video session');
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
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src="/uploads/e6eb7e5b-37be-4300-9bbb-ed1fcef6aa7e.png" 
              alt="StudySphere Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading study sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src="/uploads/e6eb7e5b-37be-4300-9bbb-ed1fcef6aa7e.png" 
                alt="StudySphere Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Study Rooms
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Join collaborative study sessions with peers or create your own learning environment
          </p>
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Plus className="h-5 w-5 mr-2" />
                Create New Session
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Active Sessions Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
              <h2 className="text-xl font-semibold text-white">Live Sessions</h2>
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">
                  {sessions.filter(session => session.is_active && session.status === 'live').length} active
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {sessions.filter(session => session.is_active && session.status === 'live').length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full mx-auto flex items-center justify-center">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Active Sessions</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Be the first to start a study session! Create one now and invite others to join your learning journey.
                </p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Session
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {sessions.filter(session => session.is_active && session.status === 'live').map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isUserInSession={isUserInSession(session)}
                    onJoinSession={joinSession}
                    onLeaveSession={leaveSession}
                    onShareSession={openShareModal}
                    onOpenSession={openVideoSession}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sessions Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Upcoming Sessions</h2>
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">
                  {sessions.filter(session => session.status === 'scheduled').length} scheduled
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {sessions.filter(session => session.status === 'scheduled').length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mx-auto flex items-center justify-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Upcoming Sessions</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Schedule your next study session in advance to help organize your learning schedule and notify participants.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {sessions.filter(session => session.status === 'scheduled').map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isUserInSession={isUserInSession(session)}
                    onJoinSession={joinSession}
                    onLeaveSession={leaveSession}
                    onShareSession={openShareModal}
                    onOpenSession={openVideoSession}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips Section */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl shadow-xl p-6 text-white">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Study Tips</h3>
              <div className="space-y-2 text-purple-100">
                <p className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full mr-3"></span>
                  Create focused sessions with clear topics and goals
                </p>
                <p className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full mr-3"></span>
                  Keep sessions small (2-6 people) for better engagement
                </p>
                <p className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full mr-3"></span>
                  Use the chat feature to share resources and notes
                </p>
              </div>
            </div>
          </div>
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
