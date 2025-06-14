
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileText, Video, BookOpen } from 'lucide-react';

interface Activity {
  type: string;
  content: string;
  time: string;
  subject?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const RecentActivity = ({ activities }: RecentActivityProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-white" />;
      case 'resource':
        return <FileText className="h-4 w-4 text-white" />;
      case 'session':
        return <Video className="h-4 w-4 text-white" />;
      default:
        return <BookOpen className="h-4 w-4 text-white" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'from-blue-500 to-blue-600';
      case 'resource':
        return 'from-green-500 to-green-600';
      case 'session':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (activities.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">No Activity Yet</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">Start participating in chats, sessions, or share resources to see your activity here.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">Join Sessions</Badge>
            <Badge variant="outline" className="text-xs border-green-200 text-green-700">Share Resources</Badge>
            <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">Chat with Others</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-lg font-bold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:from-blue-50 hover:to-indigo-50 transition-colors duration-200">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 bg-gradient-to-r ${getActivityColor(activity.type)} rounded-lg flex items-center justify-center`}>
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{activity.content}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
