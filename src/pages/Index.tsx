
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Video, BookOpen, Users, Brain, FileText, Plus, Search, Bell, Home, User, TrendingUp, Clock, Star, LogIn } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import MobileNavigation from '../components/MobileNavigation';
import ChatInterface from '../components/ChatInterface';
import StudyRooms from '../components/StudyRooms';
import ResourceHub from '../components/ResourceHub';
import AIAssistant from '../components/AIAssistant';
import Profile from '../components/Profile';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [notifications] = useState(3);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold">Loading StudySphere...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const quickActions = [
    { title: 'Ask Question', description: 'Get help from peers', icon: MessageCircle, color: 'bg-gradient-to-br from-blue-500 to-blue-600', action: () => setActiveTab('chat') },
    { title: 'Study Session', description: 'Join video study room', icon: Video, color: 'bg-gradient-to-br from-green-500 to-green-600', action: () => setActiveTab('study-rooms') },
    { title: 'AI Assistant', description: 'Smart study help', icon: Brain, color: 'bg-gradient-to-br from-purple-500 to-purple-600', action: () => setActiveTab('ai-assistant') },
    { title: 'Resources', description: 'Share notes & files', icon: FileText, color: 'bg-gradient-to-br from-orange-500 to-orange-600', action: () => setActiveTab('resources') },
  ];

  const recentActivities = [
    { type: 'question', user: 'Alex M.', subject: 'Mathematics', time: '5 min ago', status: 'resolved', avatar: 'AM' },
    { type: 'session', user: 'Sarah K.', subject: 'Physics', time: '12 min ago', status: 'active', avatar: 'SK' },
    { type: 'resource', user: 'John D.', subject: 'Chemistry', time: '30 min ago', status: 'shared', avatar: 'JD' },
    { type: 'ai', user: 'AI Assistant', subject: 'Biology', time: '1 hour ago', status: 'answered', avatar: 'AI' },
  ];

  const trendingTopics = [
    { subject: 'Calculus Derivatives', count: 24, trend: 'up' },
    { subject: 'Organic Chemistry', count: 18, trend: 'up' },
    { subject: 'Physics Mechanics', count: 15, trend: 'down' },
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
          <div className="space-y-6 pb-20 animate-fade-in">
            {/* Enhanced Welcome Section */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold mb-1">Good morning, Student! 🌟</h2>
                  <p className="text-blue-100">Ready to learn something new today?</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-300" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white bg-opacity-10 rounded-xl p-3">
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-blue-200">Active Sessions</p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-xl p-3">
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-xs text-blue-200">Questions Solved</p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-xl p-3">
                  <p className="text-2xl font-bold">15</p>
                  <p className="text-xs text-blue-200">Study Partners</p>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span>Quick Actions</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 animate-pulse"></div>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 shadow-md" onClick={action.action}>
                    <CardContent className="p-4">
                      <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                        <action.icon className="h-7 w-7 text-white" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{action.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Trending Topics
              </h3>
              <div className="space-y-2">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-sm">{topic.subject}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">{topic.count} discussions</span>
                      <TrendingUp className={`h-4 w-4 ${topic.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Recent Activity */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
              </div>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">{activity.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-sm truncate">{activity.user}</p>
                        {activity.type === 'question' && <MessageCircle className="h-3 w-3 text-blue-600 flex-shrink-0" />}
                        {activity.type === 'session' && <Video className="h-3 w-3 text-green-600 flex-shrink-0" />}
                        {activity.type === 'resource' && <FileText className="h-3 w-3 text-purple-600 flex-shrink-0" />}
                        {activity.type === 'ai' && <Brain className="h-3 w-3 text-orange-600 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-600 flex items-center">
                        <span className="truncate">{activity.subject}</span>
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="flex-shrink-0">{activity.time}</span>
                      </p>
                    </div>
                    <Badge 
                      variant={activity.status === 'active' ? 'default' : activity.status === 'resolved' ? 'secondary' : 'outline'} 
                      className="text-xs flex-shrink-0"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Active Study Groups */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Active Study Groups</h3>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm font-semibold text-green-800">Physics Study Group</p>
                      </div>
                      <Badge className="bg-green-600 text-white text-xs">Live</Badge>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-green-600 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        5 members online
                      </p>
                      <p className="text-xs text-green-600">Quantum Mechanics</p>
                    </div>
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 shadow-sm">
                      Join Session
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <p className="text-sm font-semibold text-blue-800">Math Help Desk</p>
                      </div>
                      <Badge variant="outline" className="border-blue-600 text-blue-600 text-xs">Available</Badge>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-blue-600 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        3 members online
                      </p>
                      <p className="text-xs text-blue-600">Calculus</p>
                    </div>
                    <Button size="sm" variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 shadow-sm">
                      Join Session
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader notifications={notifications} />
      
      <main className="px-4 pt-4">
        {renderContent()}
      </main>
      
      <MobileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Index;
