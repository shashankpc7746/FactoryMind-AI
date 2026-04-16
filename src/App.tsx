import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatAssistant } from './components/ChatAssistant';
import { DocumentManager } from './components/DocumentManager';
import { ReportGenerator } from './components/ReportGenerator';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Toaster } from './components/ui/sonner';

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
};

type UserPreferences = {
  compactMode: boolean;
  highContrast: boolean;
  notifications: {
    documentIndexingComplete: boolean;
    reportGenerationComplete: boolean;
    systemUpdates: boolean;
  };
};

const DEFAULT_PROFILE: UserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@factory.com',
  role: 'Factory Manager',
  department: 'Production',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  compactMode: false,
  highContrast: false,
  notifications: {
    documentIndexingComplete: true,
    reportGenerationComplete: true,
    systemUpdates: true,
  },
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('chat');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const applyPreferences = (nextPreferences: UserPreferences) => {
    document.documentElement.classList.toggle('compact-mode', nextPreferences.compactMode);
    document.documentElement.classList.toggle('high-contrast', nextPreferences.highContrast);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedProfile = localStorage.getItem('userProfile');
    const savedPreferences = localStorage.getItem('userPreferences');
    
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme(theme);
    }
    
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch {
        setUserProfile(DEFAULT_PROFILE);
      }
    }

    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences) as UserPreferences;
        setPreferences(parsed);
        applyPreferences(parsed);
      } catch {
        setPreferences(DEFAULT_PREFERENCES);
        applyPreferences(DEFAULT_PREFERENCES);
      }
    } else {
      applyPreferences(DEFAULT_PREFERENCES);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('userProfile', JSON.stringify(profile));
  };

  const handleUpdatePreferences = (nextPreferences: UserPreferences) => {
    setPreferences(nextPreferences);
    localStorage.setItem('userPreferences', JSON.stringify(nextPreferences));
    applyPreferences(nextPreferences);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'chat':
        return 'Chat Assistant';
      case 'documents':
        return 'Document Manager';
      case 'reports':
        return 'Report Generator';
      case 'history':
        return 'History';
      case 'settings':
        return 'Settings';
      default:
        return 'FactoryMind AI';
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatAssistant />;
      case 'documents':
        return <DocumentManager />;
      case 'reports':
        return <ReportGenerator />;
      case 'history':
        return <History />;
      case 'settings':
        return (
          <Settings 
            theme={theme} 
            onToggleTheme={handleToggleTheme}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
          />
        );
      default:
        return <ChatAssistant />;
    }
  };

  const fullName = `${userProfile.firstName} ${userProfile.lastName}`;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        userName={fullName}
        userRole={userProfile.role}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header 
          title={getPageTitle()} 
          onNavigate={setCurrentPage}
          userName={fullName}
        />
        
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}