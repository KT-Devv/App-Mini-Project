import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Share2, ExternalLink, Clock, Video, BookOpen, Sparkles } from 'lucide-react';

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
  onShareSession: (session: unknown) => void;
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
    <Card className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] ${
      isActive 
        ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 ring-2 ring-green-200' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 ring-2 ring-blue-200'
    } rounded-2xl`}>
      <CardContent className="p-6 relative">
        {/* Decorative background element */}
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 ${
          isActive ? 'bg-green-500' : 'bg-blue-500'
        } rounded-full transform translate-x-16 -translate-y-16`}></div>
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              isActive ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
            }`}>
              {isActive && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-lg leading-tight mb-1 ${
                isActive ? 'text-green-900' : 'text-blue-900'
              }`}>
                {session.title}
              </h4>
              <div className="flex items-center space-x-2">
                <BookOpen className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-blue-600'}`} />
                <span className={`text-sm font-medium ${
                  isActive ? 'text-green-700' : 'text-blue-700'
                }`}>
                  {session.subject}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge className={`${
              isActive 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
            } px-3 py-1 rounded-xl font-medium transition-colors duration-200`}>
              {isActive ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Scheduled</span>
                </div>
              )}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShareSession(session)}
              className={`h-9 w-9 p-0 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'hover:bg-green-200 text-green-700' 
                  : 'hover:bg-blue-200 text-blue-700'
              }`}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Description */}
        <div className="mb-4 relative z-10">
          <p className={`text-sm leading-relaxed ${
            isActive ? 'text-green-800' : 'text-blue-800'
          }`}>
            {session.description || 'Join this study session to collaborate with other learners.'}
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className={`flex items-center space-x-2 text-sm ${
            isActive ? 'text-green-700' : 'text-blue-700'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isActive ? 'bg-green-200' : 'bg-blue-200'
            }`}>
              <Users className="h-4 w-4" />
            </div>
            <span className="font-medium">
              {session.session_participants?.length || 0}/{session.max_participants}
            </span>
            <span className="text-xs opacity-75">participants</span>
          </div>
          
          <div className={`flex items-center space-x-2 text-xs ${
            isActive ? 'text-green-600' : 'text-blue-600'
          }`}>
            {isActive ? (
              <>
                <Sparkles className="h-3 w-3" />
                <span>Live now</span>
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3" />
                <span>
                  {session.scheduled_for 
                    ? new Date(session.scheduled_for).toLocaleDateString([], { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Not scheduled'
                  }
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Creator info */}
        <div className={`text-xs mb-4 flex items-center space-x-2 ${
          isActive ? 'text-green-600' : 'text-blue-600'
        } relative z-10`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            isActive ? 'bg-green-600' : 'bg-blue-600'
          }`}>
            {(session.profiles?.username || 'U')[0].toUpperCase()}
          </div>
          <span>Created by {session.profiles?.username || 'Unknown User'}</span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-3 relative z-10">
          {isUserInSession ? (
            <>
              <Button 
                size="sm" 
                className={`flex-1 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                onClick={() => onOpenSession(session.session_url)}
              >
                {isActive ? (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Join Session
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Session
                  </>
                )}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-xl transition-all duration-200"
                onClick={() => onLeaveSession(session.id)}
              >
                Leave
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              className={`w-full rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
                isActive 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-200'
              }`}
              onClick={() => onJoinSession(session.id)}
            >
              <Users className="h-4 w-4 mr-2" />
              {isActive ? 'Join Live Session' : 'Join When Live'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;
