
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Video, Brain, FileText } from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
}

const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  const actions = [
    { 
      title: 'Ask Question', 
      description: 'Get help from peers', 
      icon: MessageCircle, 
      color: 'bg-gradient-to-br from-blue-500 to-blue-600', 
      action: () => onNavigate('chat') 
    },
    { 
      title: 'Study Session', 
      description: 'Join video study room', 
      icon: Video, 
      color: 'bg-gradient-to-br from-green-500 to-green-600', 
      action: () => onNavigate('study-rooms') 
    },
    { 
      title: 'AI Assistant', 
      description: 'Smart study help', 
      icon: Brain, 
      color: 'bg-gradient-to-br from-purple-500 to-purple-600', 
      action: () => onNavigate('ai-assistant') 
    },
    { 
      title: 'Resources', 
      description: 'Share notes & files', 
      icon: FileText, 
      color: 'bg-gradient-to-br from-orange-500 to-orange-600', 
      action: () => onNavigate('resources') 
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center px-1">
        <span>Quick Actions</span>
        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 animate-pulse"></div>
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
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
  );
};

export default QuickActions;
