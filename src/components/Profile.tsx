import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, MessageSquare, FileText, LogOut, Edit, Users, Video, Sparkles, TrendingUp } from 'lucide-react';
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

interface UserStats {
  messagesSent: number;
  resourcesShared: number;
  sessionsJoined: number;
  studySubjects: string[];
  recentActivities: Array<{
    type: string;
    content: string;
    time: string;
    subject?: string;
  }>;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    messagesSent: 0,
    resourcesShared: 0,
    sessionsJoined: 0,
    studySubjects: [],
    recentActivities: []
  });
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

    const { data, error } = await supabase.functions.invoke('create-profile');

    if (error) {
      console.error('Error creating profile via function:', error);
      toast.error(`Failed to create profile: ${error.message}`);
      return null;
    }
    
    console.log('Profile created successfully via function:', data);
    return data.profile;
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch messages count
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('id, content, created_at, chat_rooms!inner(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch resources count
      const { data: resources } = await supabase
        .from('resources')
        .select('id, title, subject, created_at')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch session participation count
      const { data: sessions } = await supabase
        .from('session_participants')
        .select(`
          joined_at,
          study_sessions!inner(title, subject)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(10);

      // Get unique subjects from resources and sessions
      const resourceSubjects = resources?.map(r => r.subject) || [];
      const sessionSubjects = sessions?.map(s => s.study_sessions?.subject).filter(Boolean) || [];
      const uniqueSubjects = [...new Set([...resourceSubjects, ...sessionSubjects])];

      // Create recent activities
      const activities = [];

      // Add messages to activities
      messages?.forEach(msg => {
        activities.push({
          type: 'message',
          content: `Posted in ${msg.chat_rooms?.name || 'chat room'}`,
          time: new Date(msg.created_at).toLocaleDateString(),
          subject: msg.chat_rooms?.name
        });
      });

      // Add resources to activities
      resources?.forEach(resource => {
        activities.push({
          type: 'resource',
          content: `Uploaded ${resource.title}`,
          time: new Date(resource.created_at).toLocaleDateString(),
          subject: resource.subject
        });
      });

      // Add sessions to activities
      sessions?.forEach(session => {
        activities.push({
          type: 'session',
          content: `Joined ${session.study_sessions?.title || 'study session'}`,
          time: new Date(session.joined_at).toLocaleDateString(),
          subject: session.study_sessions?.subject
        });
      });

      // Sort activities by date and take most recent
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setUserStats({
        messagesSent: messages?.length || 0,
        resourcesShared: resources?.length || 0,
        sessionsJoined: sessions?.length || 0,
        studySubjects: uniqueSubjects.slice(0, 5), // Limit to 5 subjects
        recentActivities: activities.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
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

      // Fetch user statistics
      await fetchUserStats();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 pb-20">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
          </div>
          <p className="text-gray-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 pb-20">
        <Card className="max-w-sm mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Profile not found</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">There was an issue loading your profile. Let's try again.</p>
            <Button 
              onClick={fetchProfile} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 pb-24 pt-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden relative">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
          
          <CardContent className="p-6 relative">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                {profile.username}
              </h2>
              <p className="text-gray-600 text-sm mb-2">{profile.email}</p>
              <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                <Calendar className="h-3 w-3 mr-1" />
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-xl transition-all duration-200"
              onClick={() => setEditing(!editing)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>

            {editing && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                    <Input
                      id="username"
                      value={editedProfile.username}
                      onChange={(e) => setEditedProfile({...editedProfile, username: e.target.value})}
                      className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                      className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                    />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <Button 
                      onClick={updateProfile} 
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                    >
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditing(false)} 
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 text-center relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userStats.messagesSent}</p>
                <p className="text-xs text-gray-600 font-medium">Messages</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 text-center relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userStats.resourcesShared}</p>
                <p className="text-xs text-gray-600 font-medium">Resources</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 text-center relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-500 opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userStats.sessionsJoined}</p>
                <p className="text-xs text-gray-600 font-medium">Sessions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Study Subjects */}
        {userStats.studySubjects.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                Study Subjects
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {userStats.studySubjects.map((subject, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors duration-200 rounded-lg px-3 py-1"
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {userStats.recentActivities.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {userStats.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:from-blue-50 hover:to-indigo-50 transition-colors duration-200">
                    <div className="flex-shrink-0">
                      {activity.type === 'message' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {activity.type === 'resource' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {activity.type === 'session' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Video className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.content}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No activity message */}
        {userStats.recentActivities.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">No Activity Yet</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Start participating in chats, sessions, or share resources to see your activity here.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">Join Sessions</Badge>
                <Badge variant="outline" className="text-xs border-green-200 text-green-700">Share Resources</Badge>
                <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">Chat with Others</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-3"
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
