
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Video, BookOpen, Users, Brain, FileText, Plus, Search, Bell, Home, User } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import MobileNavigation from '../components/MobileNavigation';
import ChatInterface from '../components/ChatInterface';
import StudyRooms from '../components/StudyRooms';
import ResourceHub from '../components/ResourceHub';
import AIAssistant from '../components/AIAssistant';
import Profile from '../components/Profile';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [notifications] = useState(3);

  const quickActions = [
    { title: 'Ask Question', description: 'Get help from peers', icon: MessageCircle, color: 'bg-blue-500', action: () => setActiveTab('chat') },
    { title: 'Study Session', description: 'Join video study room', icon: Video, color: 'bg-green-500', action: () => setActiveTab('study-rooms') },
    { title: 'AI Assistant', description: 'Smart study help', icon: Brain, color: 'bg-purple-500', action: () => setActiveTab('ai-assistant') },
    { title: 'Resources', description: 'Share notes & files', icon: FileText, color: 'bg-orange-500', action: () => setActiveTab('resources') },
  ];

  const recentActivities = [
    { type: 'question', user: 'Alex M.', subject: 'Mathematics', time: '5 min ago', status: 'resolved' },
    { type: 'session', user: 'Sarah K.', subject: 'Physics', time: '12 min ago', status: 'active' },
    { type: 'resource', user: 'John D.', subject: 'Chemistry', time: '30 min ago', status: 'shared' },
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
          <div className="space-y-4 pb-20">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-bold mb-2">Good morning, Student!</h2>
              <p className="text-blue-100 mb-4">Ready to learn something new today?</p>
              <div className="flex space-x-4 text-center">
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-blue-200">Active Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-xs text-blue-200">Questions Solved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">15</p>
                  <p className="text-xs text-blue-200">Study Partners</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
                    <CardContent className="p-4">
                      <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-xl border">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {activity.type === 'question' && <MessageCircle className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'session' && <Video className="h-5 w-5 text-green-600" />}
                      {activity.type === 'resource' && <FileText className="h-5 w-5 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.user}</p>
                      <p className="text-xs text-gray-600">{activity.subject} • {activity.time}</p>
                    </div>
                    <Badge variant={activity.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Study Groups */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Active Study Groups</h3>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm font-semibold text-green-800">Physics Study</p>
                    </div>
                    <p className="text-xs text-green-600 mb-2">5 members online</p>
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                      Join Session
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm font-semibold text-blue-800">Math Help</p>
                    </div>
                    <p className="text-xs text-blue-600 mb-2">3 members online</p>
                    <Button size="sm" variant="outline" className="w-full border-blue-600 text-blue-600">
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
