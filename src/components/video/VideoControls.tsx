
import React from 'react';
import { Button } from "@/components/ui/button";
import { Phone } from 'lucide-react';

interface VideoControlsProps {
  onLeaveSession: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  onLeaveSession
}) => {
  return (
    <div className="flex justify-center p-4">
      <Button
        onClick={onLeaveSession}
        variant="destructive"
        size="lg"
        className="bg-red-600 hover:bg-red-700"
      >
        <Phone className="h-4 w-4 mr-2" />
        Leave Session
      </Button>
    </div>
  );
};
