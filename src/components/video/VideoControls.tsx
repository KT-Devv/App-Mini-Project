
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Settings, Activity } from 'lucide-react';
import SessionDiagnostics from '../SessionDiagnostics';
import { WebRTCService } from '@/services/webrtcService';

interface VideoControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onLeaveSession: () => void;
  webrtcService?: WebRTCService | null;
  sessionId?: string;
  userId?: string;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  webrtcService,
  sessionId,
  userId
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <>
      <div className="flex justify-center space-x-4 mt-4">
        <Button
          onClick={onToggleMute}
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full h-12 w-12"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        
        <Button
          onClick={onToggleVideo}
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full h-12 w-12"
          title={isVideoOff ? "Turn on video" : "Turn off video"}
        >
          {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </Button>
        
        <Button
          variant="ghost"
          size="lg"
          className="rounded-full h-12 w-12 text-gray-400"
          title="Settings"
        >
          <Settings className="h-6 w-6" />
        </Button>
        
        <Button
          onClick={() => setShowDiagnostics(true)}
          variant="ghost"
          size="lg"
          className="rounded-full h-12 w-12 text-gray-400"
          title="Diagnostics"
        >
          <Activity className="h-6 w-6" />
        </Button>
      </div>

      {sessionId && userId && (
        <SessionDiagnostics
          webrtcService={webrtcService || null}
          sessionId={sessionId}
          userId={userId}
          isVisible={showDiagnostics}
          onClose={() => setShowDiagnostics(false)}
        />
      )}
    </>
  );
};
