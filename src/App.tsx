import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatAssistant } from './components/ChatAssistant';
import { DocumentManager } from './components/DocumentManager';
import { ReportGenerator } from './components/ReportGenerator';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentPage, setCurrentPage] = useState('chat');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userProfile, setUserProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@factory.com',
    role: 'Factory Manager',
    department: 'Production',
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedProfile = localStorage.getItem('userProfile');
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
    
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleUpdateProfile = (profile: typeof userProfile) => {
    setUserProfile(profile);
    localStorage.setItem('userProfile', JSON.stringify(profile));
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