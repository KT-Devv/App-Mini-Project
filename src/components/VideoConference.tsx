
import React from 'react';
import VideoConference from './video/VideoConference';

interface VideoConferenceProps {
  sessionId: string;
  sessionTitle: string;
  onLeaveSession: () => void;
}

// This is a wrapper component for backward compatibility
const VideoConferenceWrapper: React.FC<VideoConferenceProps> = (props) => {
  return <VideoConference {...props} />;
};

export default VideoConferenceWrapper;
