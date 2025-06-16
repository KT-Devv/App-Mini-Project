
import React from 'react';
import { Button } from "@/components/ui/button";
//Phone,
import { Mic, MicOff, Video, VideoOff,  Settings } from 'lucide-react';

interface VideoControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onLeaveSession: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
// onLeaveSession
}) => {
  return (
    <div className="flex justify-center space-x-4 mt-4">
      <Button
        onClick={onToggleMute}
        variant={isMuted ? "destructive" : "secondary"}
        size="lg"
        className="rounded-full h-12 w-12"
      >
        {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>
      <Button
        onClick={onToggleVideo}
        variant={isVideoOff ? "destructive" : "secondary"}
        size="lg"
        className="rounded-full h-12 w-12"
      >
        {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="rounded-full h-12 w-12 text-gray-400"
      >
        <Settings className="h-6 w-6" />
      </Button>
    </div>
  );
};
