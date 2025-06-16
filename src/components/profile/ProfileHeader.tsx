
//import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Edit, Sparkles } from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

interface ProfileHeaderProps {
  profile: UserProfile;
  editing: boolean;
  editedProfile: {
    username: string;
    email: string;
  };
  onEditToggle: () => void;
  onUpdateProfile: () => void;
  onProfileChange: (field: string, value: string) => void;
}

const ProfileHeader = ({ 
  profile, 
  editing, 
  editedProfile, 
  onEditToggle, 
  onUpdateProfile, 
  onProfileChange 
}: ProfileHeaderProps) => {
  return (
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
          onClick={onEditToggle}
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
                  onChange={(e) => onProfileChange('username', e.target.value)}
                  className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) => onProfileChange('email', e.target.value)}
                  className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button 
                  onClick={onUpdateProfile} 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onEditToggle} 
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
  );
};

export default ProfileHeader;
