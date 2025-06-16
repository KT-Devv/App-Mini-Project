
import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RemoteVideo {
  userId: string;
  stream: MediaStream;
  username: string;
}

interface Participant {
  session_id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    username: string;
    email: string;
  };
}

interface VideoGridProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideos: RemoteVideo[];
  participants: Participant[];
  userId?: string;
  isMuted: boolean;
  isVideoOff: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localVideoRef,
  remoteVideos,
  participants,
  userId,
  isMuted,
  isVideoOff
}) => {
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Setup remote video refs
  useEffect(() => {
    remoteVideos.forEach(({ userId, stream }) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteVideos]);

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Local Video */}
      <Card className="relative bg-gray-800 border-gray-700">
        <CardContent className="p-0 h-full">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            You {isMuted && '(Muted)'} {isVideoOff && '(Video Off)'}
          </div>
        </CardContent>
      </Card>

      {/* Remote Videos */}
      {remoteVideos.map((remoteVideo) => (
        <Card key={remoteVideo.userId} className="relative bg-gray-800 border-gray-700">
          <CardContent className="p-0 h-full">
            <video
              ref={(el) => {
                if (el) {
                  remoteVideoRefs.current.set(remoteVideo.userId, el);
                } else {
                  remoteVideoRefs.current.delete(remoteVideo.userId);
                }
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {remoteVideo.username}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Participant Avatars for users without video */}
      {participants
        .filter(p => p.user_id !== userId && !remoteVideos.find(rv => rv.userId === p.user_id))
        .slice(0, 3 - remoteVideos.length)
        .map((participant) => (
          <Card key={participant.user_id} className="relative bg-gray-800 border-gray-700">
            <CardContent className="p-0 h-full flex items-center justify-center">
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {participant.profiles?.username?.[0]?.toUpperCase() || 
                     participant.profiles?.email?.[0]?.toUpperCase() || 
                     'U'}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-sm">
                  {participant.profiles?.username || 
                   participant.profiles?.email?.split('@')[0] || 
                   'Unknown User'}
                </p>
              </div>
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {participant.profiles?.username || 'Participant'}
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
};
