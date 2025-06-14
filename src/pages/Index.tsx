
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Video, Users, Brain, FileText, Plus, TrendingUp, Clock, Star, } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import MobileNavigation from '../components/MobileNavigation';
import ChatInterface from '../components/ChatInterface';
import StudyRooms from '../components/StudyRooms';
import ResourceHub from '../components/ResourceHub';
import AIAssistant from '../components/AIAssistant';
import Profile from '../components/Profile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [greeting, setGreeting] = useState('Good day');
  const [username, setUsername] = useState('Student');
  const [userStats, setUserStats] = useState({
    sessions: 0,
    messages: 0,
    resources: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
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

        // Get recent session participations
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

        const activities = [];

        // Add messages
        messages?.forEach(msg => {
          activities.push({
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
          activities.push({
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
          activities.push({
            type: 'resource',
            user: 'You',
            subject: resource.title,
            time: new Date(resource.created_at).toLocaleDateString(),
            status: 'uploaded',
            avatar: username.charAt(0).toUpperCase()
          });
        });

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
        const { data: sessions } = await supabase
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

  const quickActions = [
    { title: 'Ask Question', description: 'Get help from peers', icon: MessageCircle, color: 'bg-gradient-to-br from-blue-500 to-blue-600', action: () => setActiveTab('chat') },
    { title: 'Study Session', description: 'Join video study room', icon: Video, color: 'bg-gradient-to-br from-green-500 to-green-600', action: () => setActiveTab('study-rooms') },
    { title: 'AI Assistant', description: 'Smart study help', icon: Brain, color: 'bg-gradient-to-br from-purple-500 to-purple-600', action: () => setActiveTab('ai-assistant') },
    { title: 'Resources', description: 'Share notes & files', icon: FileText, color: 'bg-gradient-to-br from-orange-500 to-orange-600', action: () => setActiveTab('resources') },
  ];

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
            {/* Enhanced Welcome Section */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1 leading-tight">{greeting}, {username}! 🌟</h2>
                  <p className="text-blue-100 text-sm">Ready to learn something new today?</p>
                </div>
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                  <Star className="h-5 w-5 text-yellow-300" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white bg-opacity-10 rounded-xl p-3 min-h-[60px] flex flex-col justify-center">
                  <p className="text-xl font-bold">{userStats.sessions}</p>
                  <p className="text-xs text-blue-200">Sessions</p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-xl p-3 min-h-[60px] flex flex-col justify-center">
                  <p className="text-xl font-bold">{userStats.messages}</p>
                  <p className="text-xs text-blue-200">Messages</p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-xl p-3 min-h-[60px] flex flex-col justify-center">
                  <p className="text-xl font-bold">{userStats.resources}</p>
                  <p className="text-xs text-blue-200">Resources</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center px-1">
                <span>Quick Actions</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 animate-pulse"></div>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 shadow-md active:scale-95" onClick={action.action}>
                    <CardContent className="p-4 min-h-[100px] flex flex-col">
                      <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1 leading-tight">{action.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed flex-1">{action.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivities.length > 0 && (
              <div className="px-1">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                  <Button variant="ghost" size="sm" className="text-blue-600 min-h-[40px]">View All</Button>
                </div>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow min-h-[64px] active:bg-gray-50">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-600">{activity.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm truncate">{activity.user}</p>
                          {activity.type === 'message' && <MessageCircle className="h-3 w-3 text-blue-600 flex-shrink-0" />}
                          {activity.type === 'session' && <Video className="h-3 w-3 text-green-600 flex-shrink-0" />}
                          {activity.type === 'resource' && <FileText className="h-3 w-3 text-purple-600 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-600 flex items-center">
                          <span className="truncate">{activity.subject}</span>
                          <span className="mx-1">•</span>
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="flex-shrink-0">{activity.time}</span>
                        </p>
                      </div>
                      <Badge 
                        variant={activity.status === 'joined' ? 'default' : activity.status === 'sent' ? 'secondary' : 'outline'} 
                        className="text-xs flex-shrink-0"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Study Groups */}
            {activeSessions.length > 0 && (
              <div className="px-1">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Active Study Groups</h3>
                  <Button variant="ghost" size="sm" className="text-blue-600 min-h-[40px]" onClick={() => setActiveTab('study-rooms')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {activeSessions.map((session, index) => (
                    <Card key={session.id} className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-sm font-semibold text-green-800">{session.title}</p>
                          </div>
                          <Badge className="bg-green-600 text-white text-xs">Live</Badge>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-green-600 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {session.session_participants?.length || 0} members online
                          </p>
                          <p className="text-xs text-green-600">{session.subject}</p>
                        </div>
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 shadow-sm min-h-[40px]" onClick={() => setActiveTab('study-rooms')}>
                          Join Session
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No activity message */}
            {recentActivities.length === 0 && activeSessions.length === 0 && (
              <div className="px-1">
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-6 text-center">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Get Started</h3>
                    <p className="text-gray-600 mb-4">Join a study session or start chatting to see your activity here.</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setActiveTab('chat')} className="flex-1">
                        Start Chatting
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('study-rooms')} className="flex-1">
                        Join Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader 
        notifications={unreadCount} 
        onNotificationCountChange={setUnreadCount}
        onNavigate={setActiveTab}
      />
      
      <main className="px-3 pt-3">
        {renderContent()}
      </main>
      
      <MobileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Index;
