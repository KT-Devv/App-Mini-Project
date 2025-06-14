
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SearchModal from './SearchModal';
import NotificationsDropdown from './NotificationsDropdown';

interface MobileHeaderProps {
  notifications: number;
  onNotificationCountChange: (count: number) => void;
  onNavigate: (tab: string) => void;
}

const MobileHeader = ({ notifications, onNotificationCountChange, onNavigate }: MobileHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-50 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              StudySphere
            </h1>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative min-h-[44px] min-w-[44px] active:scale-95"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <NotificationsDropdown 
              unreadCount={notifications}
              onCountChange={onNotificationCountChange}
            />
          </div>
        </div>
      </header>

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};

export default MobileHeader;
