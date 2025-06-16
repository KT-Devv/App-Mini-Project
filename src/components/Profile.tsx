
import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ProfileHeader from './profile/ProfileHeader';
import ActivityStats from './profile/ActivityStats';
import StudySubjects from './profile/StudySubjects';
import RecentActivity from './profile/RecentActivity';
import LoadingState from './profile/LoadingState';
import ErrorState from './profile/ErrorState';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

interface UserStats {
  messagesSent: number;
  resourcesShared: number;
  sessionsJoined: number;
  studySubjects: string[];
  recentActivities: Array<{
    type: string;
    content: string;
    time: string;
    subject?: string;
  }>;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    messagesSent: 0,
    resourcesShared: 0,
    sessionsJoined: 0,
    studySubjects: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    username: '',
    email: ''
  });
  const { user, signOut } = useAuth();

  const createProfile = async () => {
    if (!user) return null;

    console.log('Creating profile via edge function for user:', user.id);

    const { data, error } = await supabase.functions.invoke('create-profile');

    if (error) {
      console.error('Error creating profile via function:', error);
      toast.error(`Failed to create profile: ${error.message}`);
      return null;
    }
    
    console.log('Profile created successfully via function:', data);
    return data.profile;
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch messages count
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('id, content, created_at, chat_rooms!inner(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch resources count
      const { data: resources } = await supabase
        .from('resources')
        .select('id, title, subject, created_at')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch session participation count
      const { data: sessions } = await supabase
        .from('session_participants')
        .select(`
          joined_at,
          study_sessions!inner(title, subject)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(10);

      // Get unique subjects from resources and sessions
      const resourceSubjects = resources?.map(r => r.subject) || [];
      const sessionSubjects = sessions?.map(s => s.study_sessions?.subject).filter(Boolean) || [];
      const uniqueSubjects = [...new Set([...resourceSubjects, ...sessionSubjects])];

      // Create recent activities
      const activities = [];

      // Add messages to activities
      messages?.forEach(msg => {
        activities.push({
          type: 'message',
          content: `Posted in ${msg.chat_rooms?.name || 'chat room'}`,
          time: new Date(msg.created_at).toLocaleDateString(),
          subject: msg.chat_rooms?.name
        });
      });

      // Add resources to activities
      resources?.forEach(resource => {
        activities.push({
          type: 'resource',
          content: `Uploaded ${resource.title}`,
          time: new Date(resource.created_at).toLocaleDateString(),
          subject: resource.subject
        });
      });

      // Add sessions to activities
      sessions?.forEach(session => {
        activities.push({
          type: 'session',
          content: `Joined ${session.study_sessions?.title || 'study session'}`,
          time: new Date(session.joined_at).toLocaleDateString(),
          subject: session.study_sessions?.subject
        });
      });

      // Sort activities by date and take most recent
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setUserStats({
        messagesSent: messages?.length || 0,
        resourcesShared: resources?.length || 0,
        sessionsJoined: sessions?.length || 0,
        studySubjects: uniqueSubjects.slice(0, 5),
        recentActivities: activities.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Fetching profile for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
        setLoading(false);
        return;
      }

      if (!data) {
        console.log('No profile found, creating one...');
        const newProfile = await createProfile();
        if (newProfile) {
          setProfile(newProfile);
          setEditedProfile({
            username: newProfile.username,
            email: newProfile.email
          });
        }
      } else {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
        setEditedProfile({
          username: data.username,
          email: data.email
        });
      }

      await fetchUserStats();
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async () => {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update(editedProfile)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully!');
      setProfile({ ...profile, ...editedProfile });
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  const handleProfileChange = (field: string, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <ErrorState type="not-signed-in" />;
  }

  if (!profile) {
    return <ErrorState type="profile-not-found" onRetry={fetchProfile} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 pb-24 pt-4">
      <div className="max-w-md mx-auto space-y-6">
        <ProfileHeader
          profile={profile}
          editing={editing}
          editedProfile={editedProfile}
          onEditToggle={() => setEditing(!editing)}
          onUpdateProfile={updateProfile}
          onProfileChange={handleProfileChange}
        />

        <ActivityStats userStats={userStats} />

        <StudySubjects subjects={userStats.studySubjects} />

        <RecentActivity activities={userStats.recentActivities} />

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

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-3"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Profile;
