
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SearchModal from './SearchModal';
import NotificationsDropdown from './NotificationsDropdown';
import { ThemeToggle } from './ThemeToggle';

interface MobileHeaderProps {
  notifications: number;
  onNotificationCountChange: (count: number) => void;
  onNavigate: (tab: string) => void;
}

const MobileHeader = ({ notifications, onNotificationCountChange, onNavigate }: MobileHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3 sticky top-0 z-50 safe-area-top transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src="/lovable-uploads/e6eb7e5b-37be-4300-9bbb-ed1fcef6aa7e.png" 
                alt="StudySphere Logo" 
                className="w-8 h-8 object-contain rounded-lg"
              />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
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
            <ThemeToggle />
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
