
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ShareSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    title: string;
    description: string;
    session_url: string;
  } | null;
}

const ShareSessionModal: React.FC<ShareSessionModalProps> = ({
  isOpen,
  onClose,
  session
}) => {
  const copySessionUrl = () => {
    if (session?.session_url) {
      navigator.clipboard.writeText(session.session_url);
      toast.success('Session URL copied to clipboard!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Session</DialogTitle>
        </DialogHeader>
        {session && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">{session.title}</h4>
              <p className="text-sm text-gray-600">{session.description}</p>
            </div>
            <div>
              <Label>Session URL</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  value={session.session_url || ''}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={copySessionUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Share this URL with others so they can join your study session.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareSessionModal;
