
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Trophy, Star, BookOpen, Users, MessageCircle, Award } from 'lucide-react';

const Profile = () => {
  const achievements = [
    { name: 'Study Streak', description: '7 days in a row', icon: Trophy, color: 'bg-yellow-500' },
    { name: 'Helper', description: 'Answered 50 questions', icon: MessageCircle, color: 'bg-blue-500' },
    { name: 'Resource Sharer', description: 'Shared 10 files', icon: BookOpen, color: 'bg-green-500' },
    { name: 'Team Player', description: 'Joined 25 study sessions', icon: Users, color: 'bg-purple-500' },
  ];

  const subjects = [
    { name: 'Mathematics', level: 'Advanced', progress: 85 },
    { name: 'Physics', level: 'Intermediate', progress: 70 },
    { name: 'Chemistry', level: 'Beginner', progress: 45 },
    { name: 'Biology', level: 'Intermediate', progress: 60 },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Student Name</h2>
              <p className="text-blue-100">Computer Science • 3rd Year</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm">
                  <Star className="h-4 w-4 inline mr-1" />
                  4.8 Rating
                </span>
                <span className="text-sm">156 Study Hours</span>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">47</p>
            <p className="text-sm text-gray-600">Questions Answered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">28</p>
            <p className="text-sm text-gray-600">Study Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">15</p>
            <p className="text-sm text-gray-600">Resources Shared</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">8</p>
            <p className="text-sm text-gray-600">Achievements</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subject Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjects.map((subject, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{subject.name}</span>
                <Badge variant="outline">{subject.level}</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${subject.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">{subject.progress}% Complete</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {achievements.map((achievement, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 ${achievement.color} rounded-lg flex items-center justify-center`}>
                <achievement.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{achievement.name}</h4>
                <p className="text-sm text-gray-600">{achievement.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Settings Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <User className="h-4 w-4 mr-3" />
            Edit Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-3" />
            Preferences
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <MessageCircle className="h-4 w-4 mr-3" />
            Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start text-red-600">
            <Settings className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
