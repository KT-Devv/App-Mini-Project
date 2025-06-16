
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Hash } from 'lucide-react';

interface ChatWelcomeProps {
  type: 'not-signed-in' | 'no-room-selected';
  onBrowseRooms?: () => void;
}

const ChatWelcome = ({ type, onBrowseRooms }: ChatWelcomeProps) => {
  if (type === 'not-signed-in') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 pb-20">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-auto border border-slate-200">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Welcome to Chat</h3>
          <p className="text-slate-600 mb-6">Please log in to start chatting with your study groups.</p>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Welcome to StudySphere Chat</h3>
          <p className="text-slate-600 mb-6">Connect with your study groups and collaborate in real-time.</p>
          {onBrowseRooms && (
            <Button
              onClick={onBrowseRooms}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
            >
              <Hash className="h-4 w-4 mr-2" />
              Browse Rooms
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWelcome;
