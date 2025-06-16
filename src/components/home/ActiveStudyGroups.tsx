
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus } from 'lucide-react';

interface StudySession {
  id: string;
  title: string;
  subject: string;
  session_participants?: unknown[];
}

interface ActiveStudyGroupsProps {
  sessions: StudySession[];
  onNavigate: (tab: string) => void;
}

const ActiveStudyGroups = ({ sessions, onNavigate }: ActiveStudyGroupsProps) => {
  if (sessions.length === 0) return null;

  return (
    <div className="px-1">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Active Study Groups</h3>
        <Button variant="ghost" size="sm" className="text-blue-600 min-h-[40px]" onClick={() => onNavigate('study-rooms')}>
          <Plus className="h-4 w-4 mr-1" />
          Join
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {sessions.map((session) => (
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
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 shadow-sm min-h-[40px]" onClick={() => onNavigate('study-rooms')}>
                Join Session
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ActiveStudyGroups;
