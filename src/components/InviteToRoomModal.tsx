
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Copy, Mail, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  friend_profile?: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
  };
  user_profile?: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
  };
}

interface InviteToRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

const InviteToRoomModal: React.FC<InviteToRoomModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName
}) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const generateInviteCode = async () => {
    try {
      const code = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { error } = await supabase
        .from('chat_room_invitations')
        .insert({
          room_id: roomId,
          invited_by: user?.id,
          invitation_code: code,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (error) throw error;
      setInviteCode(code);
      toast.success('Invite code generated!');
    } catch (error) {
      console.error('Error generating invite code:', error);
      toast.error('Failed to generate invite code');
    }
  };

  const fetchFriends = async () => {
    if (!user) return;

    try {
      // Try to fetch with profile joins first
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          friend_profile:profiles!friends_friend_id_fkey(id, username, email, avatar_url),
          user_profile:profiles!friends_user_id_fkey(id, username, email, avatar_url)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      // Fallback: fetch friends without profile joins
      try {
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('*')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted');

        if (friendsError) throw friendsError;

        // Get all unique user IDs from friends
        const userIds = new Set<string>();
        friendsData?.forEach(friend => {
          userIds.add(friend.user_id);
          userIds.add(friend.friend_id);
        });

        // Fetch profiles separately
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url')
          .in('id', Array.from(userIds));

        // Map profiles to friends
        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        const friendsWithProfiles = friendsData?.map(friend => ({
          ...friend,
          friend_profile: profilesMap.get(friend.friend_id),
          user_profile: profilesMap.get(friend.user_id)
        })) || [];

        setFriends(friendsWithProfiles);
      } catch (fallbackError) {
        console.error('Error in fallback fetch:', fallbackError);
      }
    }
  };

  const inviteFriend = async (friendUserId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('chat_room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', friendUserId)
        .single();

      if (existingMember) {
        toast.error('User is already a member of this room');
        return;
      }

      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('chat_room_invitations')
        .select('id')
        .eq('room_id', roomId)
        .eq('invited_user', friendUserId)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        toast.error('Invitation already sent to this user');
        return;
      }

      const { error } = await supabase
        .from('chat_room_invitations')
        .insert({
          room_id: roomId,
          invited_by: user.id,
          invited_user: friendUserId,
          status: 'pending'
        });

      if (error) throw error;
      toast.success('Invitation sent!');
    } catch (error) {
      console.error('Error inviting friend:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const inviteByEmail = async () => {
    if (!user || !email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_room_invitations')
        .insert({
          room_id: roomId,
          invited_by: user.id,
          email: email.trim(),
          status: 'pending'
        });

      if (error) throw error;
      toast.success('Invitation sent by email!');
      setEmail('');
    } catch (error) {
      console.error('Error sending email invitation:', error);
      toast.error('Failed to send email invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteCode) {
      const link = `${window.location.origin}/join-room/${inviteCode}`;
      navigator.clipboard.writeText(link);
      toast.success('Invite link copied to clipboard!');
    }
  };

  const getFriendProfile = (friend: Friend) => {
    return friend.friend_id === user?.id ? friend.user_profile : friend.friend_profile;
  };

  const getFriendUserId = (friend: Friend) => {
    return friend.friend_id === user?.id ? friend.user_id : friend.friend_id;
  };

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Invite to {roomName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="friends" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No friends to invite</p>
                  <p className="text-sm">Add friends first to invite them</p>
                </div>
              ) : (
                friends.map((friend) => {
                  const profile = getFriendProfile(friend);
                  const friendUserId = getFriendUserId(friend);
                  return (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback>
                            {profile?.username?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {profile?.username || profile?.email?.split('@')[0] || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">{profile?.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => inviteFriend(friendUserId)}
                        disabled={loading}
                      >
                        Invite
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && inviteByEmail()}
                />
                <Button onClick={inviteByEmail} disabled={loading}>
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Send an invitation to someone who isn't your friend yet
              </p>
            </div>
          </TabsContent>

          <TabsContent value="link" className="mt-4">
            <div className="space-y-4">
              {!inviteCode ? (
                <Button onClick={generateInviteCode} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Generate Invite Link
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Invite Link:</p>
                    <p className="text-xs text-gray-600 break-all">
                      {window.location.origin}/join-room/{inviteCode}
                    </p>
                  </div>
                  <Button onClick={copyInviteLink} className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <p className="text-xs text-gray-500">
                    This link expires in 7 days
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InviteToRoomModal;
