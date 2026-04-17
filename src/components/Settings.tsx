import { User, Moon, Sun, Database, AlertTriangle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { clearAllData } from '../services/api';
import { emitNotification } from '../services/events';

interface SettingsProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  userProfile: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department: string;
  };
  onUpdateProfile: (profile: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department: string;
  }) => void;
  preferences: {
    compactMode: boolean;
    highContrast: boolean;
    notifications: {
      documentIndexingComplete: boolean;
      reportGenerationComplete: boolean;
      systemUpdates: boolean;
    };
  };
  onUpdatePreferences: (preferences: {
    compactMode: boolean;
    highContrast: boolean;
    notifications: {
      documentIndexingComplete: boolean;
      reportGenerationComplete: boolean;
      systemUpdates: boolean;
    };
  }) => void;
}

export function Settings({
  theme,
  onToggleTheme,
  userProfile,
  onUpdateProfile,
  preferences,
  onUpdatePreferences,
}: SettingsProps) {
  const [formData, setFormData] = useState(userProfile);
  const [preferencesData, setPreferencesData] = useState(preferences);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setFormData(userProfile);
  }, [userProfile]);

  useEffect(() => {
    setPreferencesData(preferences);
  }, [preferences]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    onUpdateProfile(formData);
    toast.success('Profile updated successfully');
    emitNotification({
      title: 'Profile Updated',
      message: 'Your profile information has been saved.',
      level: 'success',
    });
  };

  const handlePreferenceToggle = (
    key: 'compactMode' | 'highContrast',
    value: boolean
  ) => {
    setPreferencesData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNotificationToggle = (
    key: 'documentIndexingComplete' | 'reportGenerationComplete' | 'systemUpdates',
    value: boolean
  ) => {
    setPreferencesData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const handleSavePreferences = () => {
    setSavingPreferences(true);
    onUpdatePreferences(preferencesData);
    toast.success('Preferences saved successfully');
    emitNotification({
      title: 'Preferences Updated',
      message: 'Appearance and notification settings saved.',
      level: 'success',
    });
    setSavingPreferences(false);
  };

  const profileChanged = JSON.stringify(formData) !== JSON.stringify(userProfile);
  const preferencesChanged = JSON.stringify(preferencesData) !== JSON.stringify(preferences);

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      try {
        setIsResetting(true);
        await clearAllData();
        toast.success('All data has been reset successfully');
        emitNotification({
          title: 'All Data Reset',
          message: 'Documents, reports, and vectors were cleared.',
          level: 'warning',
        });
      } catch (error) {
        toast.error(`Failed to reset data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        emitNotification({
          title: 'Reset Failed',
          message: error instanceof Error ? error.message : 'Unknown reset error',
          level: 'error',
        });
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Profile Settings */}
      <Card className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold">Profile Information</h3>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm">First Name</Label>
              <Input 
                id="firstName" 
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm">Last Name</Label>
              <Input 
                id="lastName" 
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm">Role</Label>
            <Input 
              id="role" 
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm">Department</Label>
            <Input 
              id="department" 
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={!profileChanged}
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          {theme === 'light' ? (
            <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
          ) : (
            <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
          )}
          <h3 className="text-base sm:text-lg font-semibold">Appearance</h3>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">Theme Mode</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {theme === 'light' ? 'Warm Professional (Light)' : 'Modern Industrial (Dark)'}
              </p>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={onToggleTheme} />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">Compact Mode</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Reduce spacing for denser information display
              </p>
            </div>
            <Switch
              checked={preferencesData.compactMode}
              onCheckedChange={(checked) => handlePreferenceToggle('compactMode', checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">High Contrast</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Increase contrast for better readability
              </p>
            </div>
            <Switch
              checked={preferencesData.highContrast}
              onCheckedChange={(checked) => handlePreferenceToggle('highContrast', checked)}
            />
          </div>

          <Button
            onClick={handleSavePreferences}
            disabled={!preferencesChanged || savingPreferences}
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            Save Appearance Preferences
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Database className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold">Notifications</h3>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">Document Indexing Complete</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Notify when documents are indexed and ready
              </p>
            </div>
            <Switch
              checked={preferencesData.notifications.documentIndexingComplete}
              onCheckedChange={(checked) => handleNotificationToggle('documentIndexingComplete', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">Report Generation Complete</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Notify when reports are generated
              </p>
            </div>
            <Switch
              checked={preferencesData.notifications.reportGenerationComplete}
              onCheckedChange={(checked) => handleNotificationToggle('reportGenerationComplete', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">System Updates</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Notify about new features and improvements
              </p>
            </div>
            <Switch
              checked={preferencesData.notifications.systemUpdates}
              onCheckedChange={(checked) => handleNotificationToggle('systemUpdates', checked)}
            />
          </div>

          <Button
            onClick={handleSavePreferences}
            disabled={!preferencesChanged || savingPreferences}
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            Save Notification Preferences
          </Button>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-4 sm:p-5 lg:p-6 border-destructive/50">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold text-destructive">Danger Zone</h3>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Reset all data including documents, reports, and chat history. This action cannot be undone.
          </p>
          
          <Button
            variant="destructive"
            onClick={handleResetData}
            disabled={isResetting}
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            {isResetting ? 'Resetting...' : 'Reset All Data'}
          </Button>
        </div>
      </Card>
    </div>
  );
}