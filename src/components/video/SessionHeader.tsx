
import React from 'react';
import { Button } from "@/components/ui/button";
import { Users, Phone, X } from 'lucide-react';

interface SessionHeaderProps {
  sessionTitle: string;
  participantCount: number;
  onLeaveSession: () => void;
  onCloseSession?: () => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  sessionTitle,
  participantCount,
  onLeaveSession,
  onCloseSession
}) => {
  return (
    <div className="bg-gray-800 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <img 
          src="/lovable-uploads/e6eb7e5b-37be-4300-9bbb-ed1fcef6aa7e.png" 
          alt="StudySphere Logo" 
          className="w-8 h-8 object-contain"
        />
        <h1 className="text-white text-lg font-semibold">{sessionTitle}</h1>
        <div className="flex items-center space-x-2 text-gray-300">
          <Users className="h-4 w-4" />
          <span>{participantCount} participants</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {onCloseSession && (
          <Button 
            onClick={onCloseSession}
            variant="destructive"
            className="bg-red-700 hover:bg-red-800"
          >
            <X className="h-4 w-4 mr-2" />
            Close Session
          </Button>
        )}
        <Button 
          onClick={onLeaveSession}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <Phone className="h-4 w-4 mr-2" />
          Leave Session
        </Button>
      </div>
    </div>
  );
};
