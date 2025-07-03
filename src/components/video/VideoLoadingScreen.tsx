
import React from 'react';

export const VideoLoadingScreen: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center text-white">
        <div className="flex justify-center mb-4">
          <img 
            src="/lovable-uploads/e6eb7e5b-37be-4300-9bbb-ed1fcef6aa7e.png" 
            alt="StudySphere Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Connecting to session...</h2>
        <p className="text-gray-400">Loading video conference</p>
      </div>
    </div>
  );
};
