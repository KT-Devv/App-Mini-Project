import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, MessageSquare, FileText, LogOut, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    username: '',
    email: ''
  });
  const { user, signOut } = useAuth();

  const createProfile = async () => {
    if (!user) return null;

    console.log('Creating profile via edge function for user:', user.id);

    // Invoke the edge function to create the profile
    const { data, error } = await supabase.functions.invoke('create-profile');

    if (error) {
      console.error('Error creating profile via function:', error);
      toast.error(`Failed to create profile: ${error.message}`);
      return null;
    }
    
    console.log('Profile created successfully via function:', data);
    return data.profile;
  };

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Fetching profile for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
        setLoading(false);
        return;
      }

      if (!data) {
        console.log('No profile found, creating one...');
        const newProfile = await createProfile();
        if (newProfile) {
          setProfile(newProfile);
          setEditedProfile({
            username: newProfile.username,
            email: newProfile.email
          });
        }
      } else {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
        setEditedProfile({
          username: data.username,
          email: data.email
        });
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async () => {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update(editedProfile)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully!');
      setProfile({ ...profile, ...editedProfile });
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen px-4 pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen px-4 pb-20">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-sm mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Please sign in</h3>
          <p className="text-gray-600">You need to be signed in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen px-4 pb-20">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-sm mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600 mb-4">There was an issue loading your profile.</p>
          <Button onClick={fetchProfile} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-24 pt-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center mb-4">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{profile.username}</h2>
              <p className="text-gray-600 text-sm">{profile.email}</p>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setEditing(!editing)}
            >
              <Edit className="h-4 w-4 mr-1" />
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>

            {editing && (
              <div className="space-y-3 mt-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="username" className="text-sm">Username</Label>
                  <Input
                    id="username"
                    value={editedProfile.username}
                    onChange={(e) => setEditedProfile({...editedProfile, username: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button onClick={updateProfile} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xl font-bold">24</p>
              <p className="text-xs text-gray-600">Messages Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-xl font-bold">8</p>
              <p className="text-xs text-gray-600">Resources Shared</p>
            </CardContent>
          </Card>
        </div>

        {/* Study Subjects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <BookOpen className="h-4 w-4 mr-2" />
              Study Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">Mathematics</Badge>
              <Badge variant="secondary" className="text-xs">Physics</Badge>
              <Badge variant="secondary" className="text-xs">Chemistry</Badge>
              <Badge variant="secondary" className="text-xs">Computer Science</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Posted in Mathematics Help</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Uploaded Calculus Notes</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Profile;
