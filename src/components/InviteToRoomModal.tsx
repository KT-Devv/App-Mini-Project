import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Copy, Mail, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
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
  roomId: string;
  roomName: string;
}

const InviteToRoomModal: React.FC<InviteToRoomModalProps> = ({ roomId, roomName }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          friend_profile:profiles!friends_friend_id_fkey(id, username, email, avatar_url),
          user_profile:profiles!friends_user_id_fkey(id, username, email, avatar_url)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedFriends = (data || []).map(friend => ({
        ...friend,
        status: friend.status as 'pending' | 'accepted' | 'blocked'
      }));
      
      setFriends(typedFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      // Fallback approach
      try {
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('*')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (friendsError) throw friendsError;

        const userIds = new Set<string>();
        friendsData?.forEach(friend => {
          userIds.add(friend.user_id);
          userIds.add(friend.friend_id);
        });

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url')
          .in('id', Array.from(userIds));

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        const friendsWithProfiles = friendsData?.map(friend => ({
          ...friend,
          status: friend.status as 'pending' | 'accepted' | 'blocked',
          friend_profile: profilesMap.get(friend.friend_id),
          user_profile: profilesMap.get(friend.user_id)
        })) || [];

        setFriends(friendsWithProfiles);
      } catch (fallbackError) {
        console.error('Error in fallback fetch:', fallbackError);
        toast.error('Failed to load friends');
      }
    }
  };

  const generateInviteLink = async () => {
    if (!user) return;

    try {
      const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      const { error } = await supabase
        .from('chat_room_invitations')
        .insert({
          room_id: roomId,
          invited_by: user.id,
          invitation_code: inviteCode,
          expires_at: expiresAt
        });

      if (error) throw error;

      const link = `${window.location.origin}/join-room/${inviteCode}`;
      setInviteLink(link);
      return link;
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast.error('Failed to generate invite link');
      return null;
    }
  };

  const inviteFriends = async () => {
    if (!user || selectedFriends.size === 0) return;

    setLoading(true);
    try {
      const invitations = Array.from(selectedFriends).map(friendId => ({
        room_id: roomId,
        invited_by: user.id,
        invited_user: friendId
      }));

      const { error } = await supabase
        .from('chat_room_invitations')
        .insert(invitations);

      if (error) throw error;

      toast.success(`Invited ${selectedFriends.size} friend(s) to ${roomName}`);
      setSelectedFriends(new Set());
      setIsOpen(false);
    } catch (error) {
      console.error('Error inviting friends:', error);
      toast.error('Failed to send invitations');
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
          email: email.trim()
        });

      if (error) throw error;

      toast.success(`Invitation sent to ${email}`);
      setEmail('');
    } catch (error) {
      console.error('Error sending email invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    let link = inviteLink;
    if (!link) {
      link = await generateInviteLink();
      if (!link) return;
    }

    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen, user]);

  const getDisplayInfo = (friend: Friend) => {
    const isReceived = friend.friend_id === user?.id;
    const profile = isReceived ? friend.user_profile : friend.friend_profile;
    const friendUserId = isReceived ? friend.user_id : friend.friend_id;
    return { profile, friendUserId };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite
        </Button>
      </DialogTrigger>
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

          <TabsContent value="friends" className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="flex-1 overflow-y-auto space-y-2">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No friends available</p>
                  <p className="text-sm">Add friends first to invite them</p>
                </div>
              ) : (
                friends.map((friend) => {
                  const { profile, friendUserId } = getDisplayInfo(friend);
                  const isSelected = selectedFriends.has(friendUserId);
                  
                  return (
                    <div
                      key={friend.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-200 border' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        const newSelected = new Set(selectedFriends);
                        if (isSelected) {
                          newSelected.delete(friendUserId);
                        } else {
                          newSelected.add(friendUserId);
                        }
                        setSelectedFriends(newSelected);
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>
                          {profile?.username?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {profile?.username || profile?.email?.split('@')[0] || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-600">{profile?.email}</p>
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="text-xs">Selected</Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {selectedFriends.size > 0 && (
              <Button onClick={inviteFriends} disabled={loading} className="w-full">
                Invite {selectedFriends.size} Friend(s)
              </Button>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && inviteByEmail()}
              />
            </div>
            <Button onClick={inviteByEmail} disabled={loading || !email.trim()} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex space-x-2">
                <Input
                  value={inviteLink || 'Click generate to create invite link'}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={copyInviteLink} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Anyone with this link can join the room. Links expire in 7 days.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InviteToRoomModal;
