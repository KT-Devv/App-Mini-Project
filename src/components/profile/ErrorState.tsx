
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp } from 'lucide-react';

interface ErrorStateProps {
  type: 'not-signed-in' | 'profile-not-found';
  onRetry?: () => void;
}

const ErrorState = ({ type, onRetry }: ErrorStateProps) => {
  if (type === 'not-signed-in') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 pb-20">
        <Card className="max-w-sm mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Please sign in</h3>
            <p className="text-gray-600 leading-relaxed">You need to be signed in to view your profile and access all features.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 pb-20">
      <Card className="max-w-sm mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Profile not found</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">There was an issue loading your profile. Let's try again.</p>
          {onRetry && (
            <Button 
              onClick={onRetry} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorState;
