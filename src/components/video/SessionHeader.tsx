
import React from 'react';
import { Button } from "@/components/ui/button";
import { Users, Phone } from 'lucide-react';

interface SessionHeaderProps {
  sessionTitle: string;
  participantCount: number;
  onLeaveSession: () => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  sessionTitle,
  participantCount,
  onLeaveSession
}) => {
  return (
    <div className="bg-gray-800 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-white text-lg font-semibold">{sessionTitle}</h1>
        <div className="flex items-center space-x-2 text-gray-300">
          <Users className="h-4 w-4" />
          <span>{participantCount} participants</span>
        </div>
      </div>
      <Button 
        onClick={onLeaveSession}
        variant="destructive"
        className="bg-red-600 hover:bg-red-700"
      >
        <Phone className="h-4 w-4 mr-2" />
        Leave Session
      </Button>
    </div>
  );
};
