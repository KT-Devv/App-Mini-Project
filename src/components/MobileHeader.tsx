
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MobileHeaderProps {
  notifications: number;
}

const MobileHeader = ({ notifications }: MobileHeaderProps) => {
  return (
    <header className="bg-white border-b px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            StudySphere
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="relative">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center bg-red-500">
                {notifications}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
