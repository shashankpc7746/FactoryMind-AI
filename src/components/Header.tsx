import { Search, Bell, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { APP_NOTIFICATION_EVENT, AppNotificationPayload } from '../services/events';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title: string;
  onNavigate?: (page: string) => void;
  userName: string;
}

export function Header({ title, onNavigate, userName }: HeaderProps) {
  const isNotificationAllowed = (payload: AppNotificationPayload) => {
    try {
      const raw = localStorage.getItem('userPreferences');
      if (!raw) return true;

      const parsed = JSON.parse(raw) as {
        notifications?: {
          documentIndexingComplete?: boolean;
          reportGenerationComplete?: boolean;
          systemUpdates?: boolean;
        };
      };

      const prefs = parsed.notifications;
      if (!prefs) return true;

      if (payload.category === 'documents') {
        return prefs.documentIndexingComplete !== false;
      }
      if (payload.category === 'reports') {
        return prefs.reportGenerationComplete !== false;
      }
      if (payload.category === 'system') {
        return prefs.systemUpdates !== false;
      }

      return true;
    } catch {
      return true;
    }
  };

  const [searchValue, setSearchValue] = useState('');
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    unread: boolean;
  }>>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('appNotifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('appNotifications', JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<AppNotificationPayload>;
      const detail = customEvent.detail;
      if (!detail) return;
      if (!isNotificationAllowed(detail)) return;

      const timestamp = new Date();
      const next = {
        id: `${timestamp.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        title: detail.title,
        message: detail.message,
        time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: true,
      };

      setNotifications((prev) => [next, ...prev].slice(0, 50));
    };

    window.addEventListener(APP_NOTIFICATION_EVENT, handler as EventListener);
    return () => window.removeEventListener(APP_NOTIFICATION_EVENT, handler as EventListener);
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => n.unread).length, [notifications]);

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, unread: false } : n
    ));
  };

  const handleSearchSubmit = () => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return;

    if (query.includes('document') || query.includes('pdf')) {
      onNavigate?.('documents');
      toast.success('Opened Document Manager');
      return;
    }
    if (query.includes('report') || query.includes('csv') || query.includes('excel')) {
      onNavigate?.('reports');
      toast.success('Opened Report Generator');
      return;
    }
    if (query.includes('history') || query.includes('recent')) {
      onNavigate?.('history');
      return;
    }
    if (query.includes('setting') || query.includes('profile') || query.includes('theme')) {
      onNavigate?.('settings');
      return;
    }

    onNavigate?.('chat');
    toast.info('Opened Chat Assistant for your query');
  };

  const { user, signOut: firebaseSignOut, isAuthEnabled } = useAuth();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('appNotifications');
      await firebaseSignOut();
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 pl-16 sm:pl-20 md:pl-24 lg:pl-3">
        {/* Page Title */}
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground min-w-fit">
          {title}
        </h2>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search queries, documents, reports..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
              className="pl-10 pr-16 bg-input-background w-full"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-muted border border-border group-focus-within:hidden">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 ml-auto">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-0" align="end">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="p-6 text-sm text-muted-foreground text-center">No notifications yet</div>
                )}
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
                      notification.unread ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {notification.unread && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-1 sm:px-2">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                  {user?.photoURL && (
                    <AvatarImage src={user.photoURL} alt={userName} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                    {userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline text-sm">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate?.('settings')}>
                Profile Settings
              </DropdownMenuItem>
              {isAuthEnabled && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}