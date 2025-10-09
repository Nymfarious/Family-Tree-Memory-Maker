import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CloudStorage } from "@/utils/cloudStorage";
import { useToast } from "@/hooks/use-toast";
import { Database, HardDrive } from "lucide-react";

interface PreferencesModalProps {
  open: boolean;
  onClose: () => void;
}

interface CardDisplayPreferences {
  showBirth: boolean;
  showDeath: boolean;
  showNickname: boolean;
  showMaidenName: boolean;
  showOccupation: boolean;
}

const DEFAULT_PREFERENCES: CardDisplayPreferences = {
  showBirth: true,
  showDeath: true,
  showNickname: false,
  showMaidenName: false,
  showOccupation: true,
};

export function PreferencesModal({ open, onClose }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<CardDisplayPreferences>(DEFAULT_PREFERENCES);
  const [dropboxConnected, setDropboxConnected] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('card-display-preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }

    // Check cloud connections
    setDropboxConnected(!!localStorage.getItem('dropbox_access_token'));
    setDriveConnected(!!localStorage.getItem('google_drive_access_token'));
  }, [open]);

  const handlePreferenceChange = (key: keyof CardDisplayPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('card-display-preferences', JSON.stringify(updated));
  };

  const handleConnectDropbox = async () => {
    try {
      const authUrl = await CloudStorage.initDropboxAuth();
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Could not initialize Dropbox connection. Please check configuration.",
        variant: "destructive",
      });
    }
  };

  const handleConnectGoogleDrive = async () => {
    try {
      const authUrl = await CloudStorage.initGoogleDriveAuth();
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Could not initialize Google Drive connection. Please check configuration.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectDropbox = () => {
    localStorage.removeItem('dropbox_access_token');
    setDropboxConnected(false);
    toast({
      title: "Disconnected",
      description: "Dropbox has been disconnected.",
    });
  };

  const handleDisconnectGoogleDrive = () => {
    localStorage.removeItem('google_drive_access_token');
    setDriveConnected(false);
    toast({
      title: "Disconnected",
      description: "Google Drive has been disconnected.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="theme-select">Theme</Label>
            <Select defaultValue="dark">
              <SelectTrigger id="theme-select">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark (Current)</SelectItem>
                <SelectItem value="light" disabled>Light (Coming Soon)</SelectItem>
                <SelectItem value="auto" disabled>Auto (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Currently using the dark theme as specified in the design system.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tree-style">Default Tree Style</Label>
            <Select defaultValue="list">
              <SelectTrigger id="tree-style">
                <SelectValue placeholder="Select default view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="circular">Circular View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Person Card Display</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-birth"
                  checked={preferences.showBirth}
                  onCheckedChange={(checked) => handlePreferenceChange('showBirth', checked as boolean)}
                />
                <Label htmlFor="show-birth" className="font-normal cursor-pointer">Show Birth Date</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-death"
                  checked={preferences.showDeath}
                  onCheckedChange={(checked) => handlePreferenceChange('showDeath', checked as boolean)}
                />
                <Label htmlFor="show-death" className="font-normal cursor-pointer">Show Death Date</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-nickname"
                  checked={preferences.showNickname}
                  onCheckedChange={(checked) => handlePreferenceChange('showNickname', checked as boolean)}
                />
                <Label htmlFor="show-nickname" className="font-normal cursor-pointer">Show Nickname</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-maiden"
                  checked={preferences.showMaidenName}
                  onCheckedChange={(checked) => handlePreferenceChange('showMaidenName', checked as boolean)}
                />
                <Label htmlFor="show-maiden" className="font-normal cursor-pointer">Show Maiden Name (Maternal Only)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-occupation"
                  checked={preferences.showOccupation}
                  onCheckedChange={(checked) => handlePreferenceChange('showOccupation', checked as boolean)}
                />
                <Label htmlFor="show-occupation" className="font-normal cursor-pointer">Show Occupation</Label>
              </div>
            </div>
          </div>

          {/* Family Crest/Emblem Upload Placeholder */}
          <div className="space-y-3">
            <Label>Family Emblems</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Upload family crest, flag, or tartan</p>
              <Button variant="outline" size="sm" disabled>
                Upload Image (Coming Soon)
              </Button>
            </div>
          </div>

          {/* Cloud Storage Connections */}
          <div className="space-y-3">
            <Label>Cloud Storage</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm">Dropbox</span>
                </div>
                {dropboxConnected ? (
                  <Button variant="outline" size="sm" onClick={handleDisconnectDropbox}>
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={handleConnectDropbox}>
                    Connect
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">Google Drive</span>
                </div>
                {driveConnected ? (
                  <Button variant="outline" size="sm" onClick={handleDisconnectGoogleDrive}>
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={handleConnectGoogleDrive}>
                    Connect
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Connect cloud storage to save your family tree data automatically.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
