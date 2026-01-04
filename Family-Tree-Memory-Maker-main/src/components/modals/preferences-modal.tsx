import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VoicesSetupModal } from "./voices-setup-modal";
import { UserProfileModal } from "./user-profile-modal";
import { useState, useEffect } from "react";
import { CloudStorage } from "@/utils/cloudStorage";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Database, HardDrive, ChevronDown, Volume2, User } from "lucide-react";

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

interface TreeFilterPreferences {
  maxGenerations: number;
  timeFilter: 'all' | 'century' | 'decade' | 'generation';
  startYear?: number;
  endYear?: number;
  generationSpans?: string[]; // Changed to array for multi-select
  maternalGenerations: number;
  paternalGenerations: number;
}

const DEFAULT_PREFERENCES: CardDisplayPreferences = {
  showBirth: true,
  showDeath: true,
  showNickname: false,
  showMaidenName: false,
  showOccupation: true,
};

const DEFAULT_TREE_FILTERS: TreeFilterPreferences = {
  maxGenerations: 12,
  timeFilter: 'all',
  maternalGenerations: 6,
  paternalGenerations: 6,
};

export function PreferencesModal({ open, onClose }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<CardDisplayPreferences>(DEFAULT_PREFERENCES);
  const [treeFilters, setTreeFilters] = useState<TreeFilterPreferences>(DEFAULT_TREE_FILTERS);
  const [dropboxConnected, setDropboxConnected] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [voicesModalOpen, setVoicesModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem('card-display-preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
    
    const savedFilters = localStorage.getItem('tree-filter-preferences');
    if (savedFilters) {
      setTreeFilters(JSON.parse(savedFilters));
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
  
  const handleTreeFilterChange = (key: keyof TreeFilterPreferences, value: any) => {
    const updated = { ...treeFilters, [key]: value };
    setTreeFilters(updated);
    localStorage.setItem('tree-filter-preferences', JSON.stringify(updated));
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
    <>
      <VoicesSetupModal open={voicesModalOpen} onClose={() => setVoicesModalOpen(false)} />
      <UserProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
            <DialogTitle>Preferences</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Quick Access Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setVoicesModalOpen(true)}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Voice Settings
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setProfileModalOpen(true)}
              >
                <User className="h-4 w-4 mr-2" />
                User Profile
              </Button>
            </div>

          <div className="space-y-2">
            <Label htmlFor="theme-select">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme-select">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">AI Custom Theme (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              AI Custom Theme uses intelligent color generation for unique combinations.
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
                <SelectItem value="map">Map View</SelectItem>
                <SelectItem value="timeline" disabled>Timeline (Coming Soon)</SelectItem>
                <SelectItem value="pedigree" disabled>Pedigree (Coming Soon)</SelectItem>
                <SelectItem value="hourglass" disabled>Hourglass (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="space-y-4 pt-4 border-t border-border">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <Label className="text-sm font-medium cursor-pointer">Tree Display Filters</Label>
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'transform rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="max-gen" className="text-xs text-muted-foreground">Maximum Generations (Total Display Limit)</Label>
              <Select 
                value={String(treeFilters.maxGenerations)} 
                onValueChange={(val) => handleTreeFilterChange('maxGenerations', parseInt(val))}
              >
                <SelectTrigger id="max-gen">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Generations</SelectItem>
                  <SelectItem value="7">7 Generations</SelectItem>
                  <SelectItem value="10">10 Generations</SelectItem>
                  <SelectItem value="12">12 Generations</SelectItem>
                  <SelectItem value="15">15 Generations</SelectItem>
                  <SelectItem value="20">20 Generations</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sets the overall display limit. Maternal and Paternal line controls below allow fine-tuning within this limit.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-filter" className="text-xs text-muted-foreground">Time Period Filter</Label>
              <Select 
                value={treeFilters.timeFilter} 
                onValueChange={(val) => handleTreeFilterChange('timeFilter', val)}
              >
                <SelectTrigger id="time-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="century">By Century</SelectItem>
                  <SelectItem value="decade">By Decade</SelectItem>
                  <SelectItem value="generation">By Generation Span</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {treeFilters.timeFilter === 'generation' && (
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Generation Spans (Multi-Select)</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-md p-3">
                  {[
                    { value: 'greatest-generation', label: 'Greatest Generation (1901-1927)' },
                    { value: 'silent-generation', label: 'Silent Generation (1928-1945)' },
                    { value: 'baby-boomer', label: 'Baby Boomers (1946-1964)' },
                    { value: 'jones-generation', label: 'Jones Generation (1954-1965)' },
                    { value: 'early-gen-x', label: 'Early Gen X (1965-1972)' },
                    { value: 'late-gen-x', label: 'Late Gen X (1973-1980)' },
                    { value: 'xennials', label: 'Xennials (1977-1983)' },
                    { value: 'millennial', label: 'Millennials (1981-1996)' },
                    { value: 'gen-z', label: 'Gen Z (1997-2012)' },
                    { value: 'gen-alpha', label: 'Gen Alpha (2013+)' },
                  ].map((gen) => (
                    <div key={gen.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`gen-${gen.value}`}
                        checked={treeFilters.generationSpans?.includes(gen.value) || false}
                        onCheckedChange={(checked) => {
                          const current = treeFilters.generationSpans || [];
                          const updated = checked
                            ? [...current, gen.value]
                            : current.filter(s => s !== gen.value);
                          handleTreeFilterChange('generationSpans', updated);
                        }}
                      />
                      <Label htmlFor={`gen-${gen.value}`} className="text-sm font-normal cursor-pointer">
                        {gen.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maternal-gens" className="text-xs text-muted-foreground">Maternal Line Generations</Label>
                <Select 
                  value={String(treeFilters.maternalGenerations)} 
                  onValueChange={(val) => handleTreeFilterChange('maternalGenerations', parseInt(val))}
                >
                  <SelectTrigger id="maternal-gens">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Generations</SelectItem>
                    <SelectItem value="4">4 Generations</SelectItem>
                    <SelectItem value="5">5 Generations</SelectItem>
                    <SelectItem value="6">6 Generations</SelectItem>
                    <SelectItem value="7">7 Generations</SelectItem>
                    <SelectItem value="8">8 Generations</SelectItem>
                    <SelectItem value="10">10 Generations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paternal-gens" className="text-xs text-muted-foreground">Paternal Line Generations</Label>
                <Select 
                  value={String(treeFilters.paternalGenerations)} 
                  onValueChange={(val) => handleTreeFilterChange('paternalGenerations', parseInt(val))}
                >
                  <SelectTrigger id="paternal-gens">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Generations</SelectItem>
                    <SelectItem value="4">4 Generations</SelectItem>
                    <SelectItem value="5">5 Generations</SelectItem>
                    <SelectItem value="6">6 Generations</SelectItem>
                    <SelectItem value="7">7 Generations</SelectItem>
                    <SelectItem value="8">8 Generations</SelectItem>
                    <SelectItem value="10">10 Generations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
              <p className="text-xs text-muted-foreground">
                These filters help you focus on specific time periods or generational groups in large family trees. Jones Generation and Xennials are micro-generations bridging Baby Boomers/Gen X and Gen X/Millennials respectively.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen={true} className="space-y-4 pt-4 border-t border-border">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <Label className="text-sm font-medium cursor-pointer">Person Card Display</Label>
              <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-custom"
                  disabled
                />
                <Label htmlFor="show-custom" className="font-normal cursor-pointer text-muted-foreground">Show Custom Fields (Coming Soon)</Label>
              </div>
            </CollapsibleContent>
          </Collapsible>

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
    </>
  );
}
