
import { Star } from 'lucide-react';

interface WelcomeSectionProps {
  greeting: string;
  username: string;
  userStats: {
    sessions: number;
    messages: number;
    resources: number;
  };
}

const WelcomeSection = ({ greeting, username, userStats }: WelcomeSectionProps) => {
  return (
    <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-1 leading-tight">{greeting}, {username}! 🌟</h2>
          <p className="text-blue-100 text-sm">Ready to learn something new today?</p>
        </div>
        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
          <Star className="h-5 w-5 text-yellow-300" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white bg-opacity-10 rounded-xl p-3 min-h-[60px] flex flex-col justify-center">
          <p className="text-xl font-bold">{userStats.sessions}</p>
          <p className="text-xs text-blue-200">Sessions</p>
        </div>
        <div className="bg-white bg-opacity-10 rounded-xl p-3 min-h-[60px] flex flex-col justify-center">
          <p className="text-xl font-bold">{userStats.messages}</p>
          <p className="text-xs text-blue-200">Messages</p>
        </div>
        <div className="bg-white bg-opacity-10 rounded-xl p-3 min-h-[60px] flex flex-col justify-center">
          <p className="text-xl font-bold">{userStats.resources}</p>
          <p className="text-xs text-blue-200">Resources</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
