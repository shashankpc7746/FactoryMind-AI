import { User, Moon, Sun, Database, AlertTriangle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { useState, useEffect } from 'react';

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
}

export function Settings({ theme, onToggleTheme, userProfile, onUpdateProfile }: SettingsProps) {
  const [formData, setFormData] = useState(userProfile);

  useEffect(() => {
    setFormData(userProfile);
  }, [userProfile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    onUpdateProfile(formData);
    toast.success('Profile updated successfully');
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      toast.success('Data has been reset');
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

          <Button onClick={handleSaveProfile} className="w-full sm:w-auto text-sm sm:text-base">
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
            <Switch />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">High Contrast</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Increase contrast for better readability
              </p>
            </div>
            <Switch />
          </div>
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
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">Report Generation Complete</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Notify when reports are generated
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">System Updates</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Notify about new features and improvements
              </p>
            </div>
            <Switch defaultChecked />
          </div>
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
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            Reset All Data
          </Button>
        </div>
      </Card>
    </div>
  );
}