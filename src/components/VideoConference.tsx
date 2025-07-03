
import React from 'react';
import { useVideoConference } from '@/hooks/useVideoConference';
import { SessionHeader } from './video/SessionHeader';
import { ChatSidebar } from './video/ChatSidebar';
import { VideoLoadingScreen } from './video/VideoLoadingScreen';
import { VideoErrorScreen } from './video/VideoErrorScreen';
import { useAuth } from '@/hooks/useAuth';

interface VideoConferenceProps {
  sessionId: string;
  sessionTitle: string;
  onLeaveSession: () => void;
}

const VideoConference: React.FC<VideoConferenceProps> = ({ 
  sessionId, 
  sessionTitle, 
  onLeaveSession 
}) => {
  const { user } = useAuth();
  const {
    participants,
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    error,
    isSessionCreator,
    jitsiContainerRef,
    sendMessage,
    handleLeaveSession,
    handleCloseSession,
    retryConnection
  } = useVideoConference(sessionId, onLeaveSession);

  if (error) {
    return (
      <VideoErrorScreen
        error={error}
        onRetry={retryConnection}
        onLeave={onLeaveSession}
      />
    );
  }

  if (isLoading) {
    return <VideoLoadingScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <SessionHeader 
        sessionTitle={sessionTitle}
        participantCount={participants.length}
        onLeaveSession={handleLeaveSession}
        onCloseSession={isSessionCreator ? handleCloseSession : undefined}
      />

      <div className="flex-1 flex">
        <div className="flex-1">
          <div 
            ref={jitsiContainerRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        </div>

        <ChatSidebar 
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={sendMessage}
          userId={user?.id}
        />
      </div>
    </div>
  );
};

export default VideoConference;
