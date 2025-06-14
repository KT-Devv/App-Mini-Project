
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hash, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RoomInvitation {
  id: string;
  room_id: string;
  invited_by: string;
  invitation_code: string;
  status: string;
  expires_at: string;
  chat_rooms: {
    name: string;
    description: string;
    created_at: string;
  };
  inviter_profile: {
    username: string;
    email: string;
  };
}

const JoinRoomPage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<RoomInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const fetchInvitation = async () => {
    if (!inviteCode) {
      toast.error('Invalid invite code');
      navigate('/');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_room_invitations')
        .select(`
          *,
          chat_rooms (name, description, created_at),
          inviter_profile:profiles!chat_room_invitations_invited_by_fkey (username, email)
        `)
        .eq('invitation_code', inviteCode)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        toast.error('Invalid or expired invite code');
        navigate('/');
        return;
      }

      // Check if invitation has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error('This invitation has expired');
        navigate('/');
        return;
      }

      setInvitation(data);
    } catch (error) {
      console.error('Error fetching invitation:', error);
      toast.error('Failed to load invitation');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!user || !invitation) return;

    setJoining(true);
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('chat_room_members')
        .select('id')
        .eq('room_id', invitation.room_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast.success('You are already a member of this room!');
        navigate('/dashboard');
        return;
      }

      // Add user to room
      const { error: memberError } = await supabase
        .from('chat_room_members')
        .insert({
          room_id: invitation.room_id,
          user_id: user.id,
          role: 'member'
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: inviteError } = await supabase
        .from('chat_room_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      toast.success('Successfully joined the room!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    fetchInvitation();
  }, [inviteCode]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Hash className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sign in Required</h3>
            <p className="text-gray-600 mb-4">
              You need to sign in to join this chat room.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Hash className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Invalid Invitation</h3>
            <p className="text-gray-600 mb-4">
              This invitation link is invalid or has expired.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Hash className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl">Join Chat Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{invitation.chat_rooms.name}</h3>
            {invitation.chat_rooms.description && (
              <p className="text-gray-600 mt-1">{invitation.chat_rooms.description}</p>
            )}
          </div>

          <div className="space-y-3 py-4">
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              <span>Invited by {invitation.inviter_profile.username || invitation.inviter_profile.email}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Created {new Date(invitation.chat_rooms.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={joinRoom} 
              disabled={joining} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {joining ? 'Joining...' : 'Join Room'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')} 
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinRoomPage;
