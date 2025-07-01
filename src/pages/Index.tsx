import { useState, useEffect } from 'react';
import MobileHeader from '../components/MobileHeader';
import MobileNavigation from '../components/MobileNavigation';
import ChatInterface from '../components/ChatInterface';
import StudyRooms from '../components/StudyRooms';
import ResourceHub from '../components/ResourceHub';
import AIAssistant from '../components/AIAssistant';
import Profile from '../components/Profile';
import WelcomeSection from '../components/home/WelcomeSection';
import QuickActions from '../components/home/QuickActions';
import RecentActivitySection from '../components/home/RecentActivitySection';
import ActiveStudyGroups from '../components/home/ActiveStudyGroups';
import EmptyState from '../components/home/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { Activity, StudySession } from "@/types/activity";

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [greeting, setGreeting] = useState('Good day');
  const [username, setUsername] = useState('Student');
  const [userStats, setUserStats] = useState({
    sessions: 0,
    messages: 0,
    resources: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [activeSessions, setActiveSessions] = useState<StudySession[]>([]);
  const { user } = useAuth();
  const { unreadCount, setUnreadCount, createNotification } = useNotifications();

  // Update greeting based on current time
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting('Good morning');
      } else if (hour < 17) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user profile and stats
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (profile?.username) {
          setUsername(profile.username);
        }

        // Fetch user statistics
        const [sessionsResult, messagesResult, resourcesResult] = await Promise.all([
          supabase
            .from('session_participants')
            .select('session_id')
            .eq('user_id', user.id),
          supabase
            .from('chat_messages')
            .select('id')
            .eq('user_id', user.id),
          supabase
            .from('resources')
            .select('id')
            .eq('uploaded_by', user.id)
        ]);

        setUserStats({
          sessions: sessionsResult.data?.length || 0,
          messages: messagesResult.data?.length || 0,
          resources: resourcesResult.data?.length || 0
        });
      }
    };

    fetchUserData();
  }, [user?.id]);

  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!user?.id) return;

      try {
        // Get recent chat messages
        const { data: messages } = await supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            created_at,
            chat_rooms!inner(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2);

        // Get recent session participation
        const { data: sessions } = await supabase
          .from('session_participants')
          .select(`
            joined_at,
            study_sessions!inner(title, subject)
          `)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(2);

        // Get recent resource uploads
        const { data: resources } = await supabase
          .from('resources')
          .select('title, subject, created_at')
          .eq('uploaded_by', user.id)
          .order('created_at', { ascending: false })
          .limit(2);

        const fetchedActivities = [];

        // Add messages
        messages?.forEach(msg => {
          fetchedActivities.push({
            type: 'message',
            user: 'You',
            subject: msg.chat_rooms?.name || 'Chat',
            time: new Date(msg.created_at).toLocaleDateString(),
            status: 'sent',
            avatar: username.charAt(0).toUpperCase()
          });
        });

        // Add sessions
        sessions?.forEach(session => {
          fetchedActivities.push({
            type: 'session',
            user: 'You',
            subject: session.study_sessions?.title || 'Study Session',
            time: new Date(session.joined_at).toLocaleDateString(),
            status: 'joined',
            avatar: username.charAt(0).toUpperCase()
          });
        });

        // Add resources
        resources?.forEach(resource => {
          fetchedActivities.push({
            type: 'resource',
            user: 'You',
            subject: resource.title,
            time: new Date(resource.created_at).toLocaleDateString(),
            status: 'uploaded',
            avatar: username.charAt(0).toUpperCase()
          });
        });

        const activities: (Activity & { status: string; avatar: string })[] = fetchedActivities.map((activity) => ({
          type: activity.type,
          user: activity.user,
          subject: activity.subject,
          time: activity.time,
          details: activity.details,
          status: activity.status,
          avatar: activity.avatar,
        }));

        // Sort by date and take most recent
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setRecentActivities(activities.slice(0, 4));
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchRecentActivities();
  }, [user?.id, username]);

  // Fetch active study sessions
  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const { data: fetchedSessions } = await supabase
          .from('study_sessions')
          .select(`
            id,
            title,
            subject,
            max_participants,
            session_participants!inner(user_id)
          `)
          .eq('is_active', true)
          .limit(2);

        const sessions: StudySession[] = fetchedSessions.map((session) => ({
          id: session.id,
          title: session.title,
          subject: session.subject,
        }));

        setActiveSessions(sessions || []);
      } catch (error) {
        console.error('Error fetching active sessions:', error);
      }
    };

    fetchActiveSessions();
  }, []);

  // Create welcome notification for new users
  useEffect(() => {
    const createWelcomeNotification = async () => {
      if (user?.id && unreadCount === 0) {
        await createNotification(
          user.id,
          'Welcome to StudySphere! 🎉',
          'Start by joining a study session or exploring resources.',
          'general'
        );
      }
    };

    if (user?.id) {
      createWelcomeNotification();
    }
  }, [user?.id]);

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />;
      case 'study-rooms':
        return <StudyRooms />;
      case 'resources':
        return <ResourceHub />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'profile':
        return <Profile />;
      default:
        return (
          <div className="space-y-4 pb-24 animate-fade-in px-1">
            <WelcomeSection 
              greeting={greeting}
              username={username}
              userStats={userStats}
            />

            <QuickActions onNavigate={setActiveTab} />

            <RecentActivitySection activities={recentActivities} />

            <ActiveStudyGroups 
              sessions={activeSessions}
              onNavigate={setActiveTab}
            />

            {recentActivities.length === 0 && activeSessions.length === 0 && (
              <EmptyState onNavigate={setActiveTab} />
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <MobileHeader 
        notifications={unreadCount} 
        onNotificationCountChange={setUnreadCount}
        onNavigate={setActiveTab}
      />
      
      <main className="w-full px-3 pt-3">
        {renderContent()}
      </main>
      
      <MobileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Index;
