import { MessageSquare, FileText, BarChart3, History, Settings, Moon, Sun, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useState } from 'react';
import logoImage from '../images/FactoryMind-AI.png';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  userName: string;
  userRole: string;
}

export function Sidebar({ currentPage, onNavigate, theme, onToggleTheme, userName, userRole }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'chat', label: 'Chat Assistant', icon: MessageSquare },
    { id: 'documents', label: 'Document Manager', icon: FileText },
    { id: 'reports', label: 'Report Generator', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const initials = userName.split(' ').map(n => n[0]).join('');

  return (
    <>
      {/* Mobile Menu Button - Only shows when sidebar is closed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="lg:hidden fixed top-3 left-3 z-50 p-2.5 rounded-lg bg-card border border-border shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 md:w-80 lg:w-72 xl:w-80 bg-sidebar border-r border-sidebar-border
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-4 sm:p-5 lg:p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 p-1"
                style={{ 
                  backgroundColor: '#101010',
                  borderColor: '#000000'
                }}
              >
                <img src={logoImage} alt="FactoryMind AI" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold text-sidebar-foreground">FactoryMind AI</h1>
              </div>
            </div>
            
            {/* Close button for mobile - positioned at top right */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent flex-shrink-0"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (window.innerWidth < 1024) {
                    setIsCollapsed(true);
                  }
                }}
                className={`
                  w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 sm:p-4 border-t border-sidebar-border space-y-2 sm:space-y-3">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleTheme}
            className="w-full justify-start gap-3 text-sm"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </>
            )}
          </Button>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-sidebar-accent">
            <Avatar className="flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-sidebar-foreground truncate">
                {userName}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}