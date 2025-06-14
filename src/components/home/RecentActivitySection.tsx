
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Video, FileText, Clock } from 'lucide-react';

interface Activity {
  type: string;
  user: string;
  subject: string;
  time: string;
  status: string;
  avatar: string;
}

interface RecentActivitySectionProps {
  activities: Activity[];
}

const RecentActivitySection = ({ activities }: RecentActivitySectionProps) => {
  if (activities.length === 0) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-3 w-3 text-blue-600 flex-shrink-0" />;
      case 'session':
        return <Video className="h-3 w-3 text-green-600 flex-shrink-0" />;
      case 'resource':
        return <FileText className="h-3 w-3 text-purple-600 flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className="px-1">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Button variant="ghost" size="sm" className="text-blue-600 min-h-[40px]">View All</Button>
      </div>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow min-h-[64px] active:bg-gray-50">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-600">{activity.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="font-medium text-sm truncate">{activity.user}</p>
                {getActivityIcon(activity.type)}
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
  );
};

export default RecentActivitySection;
