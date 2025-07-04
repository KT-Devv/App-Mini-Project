
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const ResetApp = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const handleReset = async () => {
    if (!user) return;
    
    setIsResetting(true);
    
    try {
      // Delete chat messages
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .neq('id', '');

      if (messagesError) throw messagesError;

      // Delete session participants
      const { error: participantsError } = await supabase
        .from('session_participants')
        .delete()
        .neq('session_id', '');

      if (participantsError) throw participantsError;

      // Delete study sessions
      const { error: sessionsError } = await supabase
        .from('study_sessions')
        .delete()
        .neq('id', '');

      if (sessionsError) throw sessionsError;

      // Delete chat rooms
      const { error: roomsError } = await supabase
        .from('chat_rooms')
        .delete()
        .neq('id', '');

      if (roomsError) throw roomsError;

      // Delete notifications
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (notificationsError) throw notificationsError;

      toast.success('App reset successfully! All data has been cleared.');
      setIsOpen(false);
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset app. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Reset App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Reset Application
          </DialogTitle>
          <DialogDescription className="pt-2">
            This action will permanently delete all your data including:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              <Trash2 className="h-3 w-3 mr-1" />
              Chat Messages
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              <Trash2 className="h-3 w-3 mr-1" />
              Study Sessions
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              <Trash2 className="h-3 w-3 mr-1" />
              Chat Rooms
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              <Trash2 className="h-3 w-3 mr-1" />
              Notifications
            </Badge>
          </div>
          
          <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              ⚠️ This action cannot be undone!
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isResetting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReset}
            disabled={isResetting}
            className="w-full sm:w-auto"
          >
            {isResetting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Resetting...</span>
              </div>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Everything
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetApp;
