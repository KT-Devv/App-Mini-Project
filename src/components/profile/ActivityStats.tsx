
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, FileText, Users } from 'lucide-react';

interface UserStats {
  messagesSent: number;
  resourcesShared: number;
  sessionsJoined: number;
}

interface ActivityStatsProps {
  userStats: UserStats;
}

const ActivityStats = ({ userStats }: ActivityStatsProps) => {
  const stats = [
    {
      value: userStats.messagesSent,
      label: 'Messages',
      icon: MessageSquare,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-400 to-blue-500'
    },
    {
      value: userStats.resourcesShared,
      label: 'Resources',
      icon: FileText,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-400 to-green-500'
    },
    {
      value: userStats.sessionsJoined,
      label: 'Sessions',
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-400 to-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 text-center relative">
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.bgGradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8`}></div>
            <div className="relative">
              <div className={`w-10 h-10 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ActivityStats;
