
import React from 'react';

interface VideoErrorScreenProps {
  error: string;
  onRetry: () => void;
  onLeave: () => void;
}

export const VideoErrorScreen: React.FC<VideoErrorScreenProps> = ({
  error,
  onRetry,
  onLeave
}) => {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center text-white max-w-md mx-auto p-6">
        <div className="flex justify-center mb-4">
          <img 
            src="/uploads/e6eb7e5b-37be-4300-9bbb-ed1fcef6aa7e.png" 
            alt="StudySphere Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
        <p className="text-gray-300 mb-6">{error}</p>
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onLeave}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors ml-3"
          >
            Leave Session
          </button>
        </div>
      </div>
    </div>
  );
};
