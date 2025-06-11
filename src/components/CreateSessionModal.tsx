
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    title: string;
    subject: string;
    description: string;
    max_participants: number;
    scheduled_for: string;
  };
  onFormChange: (field: string, value: string | number) => void;
  isCreating: boolean;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  isCreating
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Study Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onFormChange('title', e.target.value)}
              placeholder="Enter session title..."
              required
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Select
              value={formData.subject}
              onValueChange={(value) => onFormChange('subject', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="History">History</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormChange('description', e.target.value)}
              placeholder="Describe what you'll be studying..."
            />
          </div>
          <div>
            <Label htmlFor="max_participants">Max Participants</Label>
            <Input
              id="max_participants"
              type="number"
              min="2"
              max="50"
              value={formData.max_participants}
              onChange={(e) => onFormChange('max_participants', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="scheduled_for">Scheduled For (Optional)</Label>
            <Input
              id="scheduled_for"
              type="datetime-local"
              value={formData.scheduled_for}
              onChange={(e) => onFormChange('scheduled_for', e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Session'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSessionModal;
