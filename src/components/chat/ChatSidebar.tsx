
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Hash, Users, Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import FriendsManager from '../FriendsManager';

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  is_active: boolean;
  created_by: string | null;
}

interface ChatSidebarProps {
  show: boolean;
  chatRooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  onClose: () => void;
  onSelectRoom: (room: ChatRoom) => void;
  onCreateRoom: () => void;
  newRoomName: string;
  newRoomDescription: string;
  setNewRoomName: (name: string) => void;
  setNewRoomDescription: (description: string) => void;
  isCreateRoomOpen: boolean;
  setIsCreateRoomOpen: (open: boolean) => void;
}

const ChatSidebar = ({
  show,
  chatRooms,
  activeRoom,
  onClose,
  onSelectRoom,
  onCreateRoom,
  newRoomName,
  newRoomDescription,
  setNewRoomName,
  setNewRoomDescription,
  isCreateRoomOpen,
  setIsCreateRoomOpen
}: ChatSidebarProps) => {
  const { user } = useAuth();

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-80 h-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Chat Rooms</h2>
              <p className="text-blue-100 text-sm">Connect with your study groups</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Enhanced Friends and Create Room Section */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 space-y-4">
          <FriendsManager />
          <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Create New Room
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-w-sm">
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="roomName" className="block text-sm font-medium text-slate-700 mb-2">
                    Room Name
                  </label>
                  <Input
                    id="roomName"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter room name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="roomDescription" className="block text-sm font-medium text-slate-700 mb-2">
                    Description (Optional)
                  </label>
                  <Textarea
                    id="roomDescription"
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    placeholder="Enter room description"
                    className="w-full"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateRoomOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onCreateRoom}
                    disabled={!newRoomName.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Create Room
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Enhanced Rooms List */}
        <div className="flex-1 overflow-y-auto p-4">
          {chatRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Rooms Yet</h3>
              <p className="text-slate-500 text-sm mb-4">Create your first room or get invited to join conversations!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Active Rooms</h3>
              {chatRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  className={`w-full flex items-center p-4 rounded-xl text-left transition-all duration-200 group ${
                    activeRoom?.id === room.id
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md'
                      : 'hover:bg-slate-50 border-2 border-transparent hover:shadow-sm'
                  }`}
                >
                  <div className={`p-3 rounded-xl mr-4 transition-all duration-200 ${
                    activeRoom?.id === room.id 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md' 
                      : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}>
                    <Hash className={`h-4 w-4 ${
                      activeRoom?.id === room.id ? 'text-white' : 'text-slate-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold truncate ${
                        activeRoom?.id === room.id ? 'text-blue-900' : 'text-slate-900'
                      }`}>
                        {room.name}
                      </span>
                      {activeRoom?.id === room.id && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">Active</Badge>
                      )}
                    </div>
                    {room.description && (
                      <p className="text-xs text-slate-500 mb-2 truncate">
                        {room.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      Created {new Date(room.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced User Info */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                <p className="text-xs text-slate-500">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
