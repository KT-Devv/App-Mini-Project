
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain } from 'lucide-react';

interface EmptyStateProps {
  onNavigate: (tab: string) => void;
}

const EmptyState = ({ onNavigate }: EmptyStateProps) => {
  return (
    <div className="px-1">
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Get Started</h3>
          <p className="text-gray-600 mb-4">Join a study session or start chatting to see your activity here.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onNavigate('chat')} className="flex-1">
              Start Chatting
            </Button>
            <Button size="sm" variant="outline" onClick={() => onNavigate('study-rooms')} className="flex-1">
              Join Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyState;
