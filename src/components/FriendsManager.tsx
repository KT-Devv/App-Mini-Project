
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserCheck, UserX, Search } from 'lucide-react';
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
    username: string;
    email: string;
    avatar_url?: string;
  };
  user_profile?: {
    username: string;
    email: string;
    avatar_url?: string;
  };
}

const FriendsManager: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchFriends = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          friend_profile:profiles!friends_friend_id_fkey(username, email, avatar_url),
          user_profile:profiles!friends_user_id_fkey(username, email, avatar_url)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error('Failed to load friends');
    }
  };

  const sendFriendRequest = async () => {
    if (!user || !searchEmail.trim()) return;

    setLoading(true);
    try {
      // Find user by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', searchEmail.trim())
        .single();

      if (profileError || !profileData) {
        toast.error('User not found');
        return;
      }

      if (profileData.id === user.id) {
        toast.error('You cannot add yourself as a friend');
        return;
      }

      // Check if friendship already exists
      const { data: existingFriend } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${profileData.id}),and(user_id.eq.${profileData.id},friend_id.eq.${user.id})`)
        .single();

      if (existingFriend) {
        toast.error('Friend relationship already exists');
        return;
      }

      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: profileData.id,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Friend request sent!');
      setSearchEmail('');
      fetchFriends();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const respondToFriendRequest = async (friendshipId: string, status: 'accepted' | 'blocked') => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status })
        .eq('id', friendshipId);

      if (error) throw error;

      toast.success(status === 'accepted' ? 'Friend request accepted!' : 'Friend request blocked');
      fetchFriends();
    } catch (error) {
      console.error('Error responding to friend request:', error);
      toast.error('Failed to respond to friend request');
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
    return {
      profile,
      isReceived,
      canRespond: isReceived && friend.status === 'pending'
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Friends</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Add Friend */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter email to add friend"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendFriendRequest()}
              />
              <Button onClick={sendFriendRequest} disabled={loading} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Friends List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserPlus className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No friends yet</p>
                <p className="text-sm">Add friends by their email</p>
              </div>
            ) : (
              friends.map((friend) => {
                const { profile, isReceived, canRespond } = getDisplayInfo(friend);
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
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={friend.status === 'accepted' ? 'default' : friend.status === 'pending' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {friend.status}
                          </Badge>
                          {isReceived && friend.status === 'pending' && (
                            <span className="text-xs text-blue-600">Received</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {canRespond && (
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => respondToFriendRequest(friend.id, 'accepted')}
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => respondToFriendRequest(friend.id, 'blocked')}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FriendsManager;
