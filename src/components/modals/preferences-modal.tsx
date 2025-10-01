import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

interface PreferencesModalProps {
  open: boolean;
  onClose: () => void;
}

interface CardDisplayPreferences {
  showBirth: boolean;
  showDeath: boolean;
  showNickname: boolean;
  showMaidenName: boolean;
}

const DEFAULT_PREFERENCES: CardDisplayPreferences = {
  showBirth: true,
  showDeath: true,
  showNickname: false,
  showMaidenName: false,
};

export function PreferencesModal({ open, onClose }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<CardDisplayPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const saved = localStorage.getItem('card-display-preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, [open]);

  const handlePreferenceChange = (key: keyof CardDisplayPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('card-display-preferences', JSON.stringify(updated));
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
