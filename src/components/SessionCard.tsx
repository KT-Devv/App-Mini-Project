
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Share2, ExternalLink, Clock } from 'lucide-react';

interface SessionCardProps {
  session: {
    id: string;
    title: string;
    subject: string;
    description: string;
    is_active: boolean;
    max_participants: number;
    created_at: string;
    scheduled_for: string;
    session_url: string;
    status: string;
    profiles?: {
      username: string;
    };
    session_participants: Array<{
      session_id: string;
      user_id: string;
      joined_at: string;
    }>;
  };
  isUserInSession: boolean;
  onJoinSession: (sessionId: string) => void;
  onLeaveSession: (sessionId: string) => void;
  onShareSession: (session: any) => void;
  onOpenSession: (sessionUrl: string) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isUserInSession,
  onJoinSession,
  onLeaveSession,
  onShareSession,
  onOpenSession
}) => {
  const isActive = session.is_active && session.status === 'live';
  
  return (
    <Card className={`${
      isActive 
        ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100' 
        : 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
            }`}></div>
            <h4 className={`font-semibold ${
              isActive ? 'text-green-800' : 'text-blue-800'
            }`}>
              {session.title}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={
              isActive 
                ? 'bg-green-600 text-white' 
                : 'border-blue-600 text-blue-600'
            } variant={isActive ? 'default' : 'outline'}>
              {isActive ? 'Live' : 'Scheduled'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShareSession(session)}
              className="h-8 w-8 p-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <p className={`text-sm ${
            isActive ? 'text-green-700' : 'text-blue-700'
          }`}>
            {session.description}
          </p>
          <div className={`flex items-center justify-between text-xs ${
            isActive ? 'text-green-600' : 'text-blue-600'
          }`}>
            <span className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {session.session_participants?.length || 0}/{session.max_participants} participants
            </span>
            <span className="flex items-center">
              {isActive ? (
                <>
                  <Calendar className="h-3 w-3 mr-1" />
                  {session.subject}
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  {session.scheduled_for ? new Date(session.scheduled_for).toLocaleString() : 'Not scheduled'}
                </>
              )}
            </span>
          </div>
          <p className={`text-xs ${
            isActive ? 'text-green-600' : 'text-blue-600'
          }`}>
            Created by {session.profiles?.username || 'Unknown User'}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {isUserInSession ? (
            <>
              <Button 
                size="sm" 
                className={`flex-1 ${
                  isActive 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={() => onOpenSession(session.session_url)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {isActive ? 'Join Session' : 'View Session'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
                onClick={() => onLeaveSession(session.id)}
              >
                Leave
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              className={`w-full ${
                isActive 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
              variant={isActive ? 'default' : 'outline'}
              onClick={() => onJoinSession(session.id)}
            >
              <Users className="h-4 w-4 mr-2" />
              {isActive ? 'Join Session' : 'Join When Live'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;
