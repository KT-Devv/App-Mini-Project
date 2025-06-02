
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Users, Clock, Mic, MicOff, VideoOff, Phone, MoreVertical } from 'lucide-react';

const StudyRooms = () => {
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const activeRooms = [
    { id: 1, subject: 'Mathematics', topic: 'Calculus Study Group', members: 5, duration: '45 min', host: 'Sarah K.', isLive: true },
    { id: 2, subject: 'Physics', topic: 'Quantum Mechanics Discussion', members: 3, duration: '20 min', host: 'Alex M.', isLive: true },
    { id: 3, subject: 'Chemistry', topic: 'Organic Chemistry Help', members: 8, duration: '1h 15min', host: 'John D.', isLive: true },
  ];

  const upcomingRooms = [
    { id: 4, subject: 'Biology', topic: 'Cell Biology Review', time: '2:00 PM', host: 'Emma R.', participants: 12 },
    { id: 5, subject: 'History', topic: 'World War II Discussion', time: '4:30 PM', host: 'Mike L.', participants: 6 },
  ];

  if (inCall) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white pb-20">
        {/* Video Call Header */}
        <div className="p-4 bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Mathematics Study Group</h2>
              <p className="text-sm text-gray-300">5 participants • 12:34</p>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-2 h-full">
            <div className="bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <span className="text-xl font-bold">SK</span>
                </div>
                <p className="text-sm">Sarah K.</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <span className="text-xl font-bold">AM</span>
                </div>
                <p className="text-sm">Alex M.</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <span className="text-xl font-bold">JD</span>
                </div>
                <p className="text-sm">John D.</p>
              </div>
            </div>
            <div className="bg-blue-600 rounded-lg flex items-center justify-center border-2 border-blue-400">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-800 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <span className="text-xl font-bold">You</span>
                </div>
                <p className="text-sm">You</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call Controls */}
        <div className="p-4 bg-gray-800">
          <div className="flex justify-center space-x-6">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-12 h-12 p-0"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              variant={isVideoOff ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-12 h-12 p-0"
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-12 h-12 p-0"
              onClick={() => setInCall(false)}
            >
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Quick Join */}
      <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-2">Start Instant Study Session</h2>
          <p className="text-green-100 mb-4">Create a room and invite your study partners</p>
          <Button className="bg-white text-green-600 hover:bg-green-50">
            <Video className="h-4 w-4 mr-2" />
            Create Room
          </Button>
        </CardContent>
      </Card>

      {/* Active Study Rooms */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Active Study Rooms</h3>
        <div className="space-y-3">
          {activeRooms.map((room) => (
            <Card key={room.id} className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Badge className="bg-green-600 text-white mb-2">{room.subject}</Badge>
                    <h4 className="font-semibold text-green-800">{room.topic}</h4>
                    <p className="text-sm text-green-600">Hosted by {room.host}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">LIVE</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-green-600">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {room.members}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {room.duration}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setInCall(true)}
                  >
                    Join Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Upcoming Sessions</h3>
        <div className="space-y-3">
          {upcomingRooms.map((room) => (
            <Card key={room.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">{room.subject}</Badge>
                    <h4 className="font-semibold">{room.topic}</h4>
                    <p className="text-sm text-gray-600">
                      {room.time} • by {room.host} • {room.participants} registered
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Register
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyRooms;
