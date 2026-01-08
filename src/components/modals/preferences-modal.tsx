import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VoicesSetupModal } from "./voices-setup-modal";
import { UserProfileModal } from "./user-profile-modal";
import { useState, useEffect, useMemo } from "react";
import { CloudStorage } from "@/utils/cloudStorage";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Database, HardDrive, ChevronDown, Volume2, User, 
  GitBranch, Search, Crown, Wrench, AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Person } from "@/types/gedcom";

interface PreferencesModalProps {
  open: boolean;
  onClose: () => void;
  people?: Record<string, Person>;
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
  generationSpans?: string[];
  maternalGenerations: number;
  paternalGenerations: number;
  defaultRootPerson?: string;
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
  defaultRootPerson: undefined,
};

export function PreferencesModal({ open, onClose, people = {} }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<CardDisplayPreferences>(DEFAULT_PREFERENCES);
  const [treeFilters, setTreeFilters] = useState<TreeFilterPreferences>(DEFAULT_TREE_FILTERS);
  const [dropboxConnected, setDropboxConnected] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [voicesModalOpen, setVoicesModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [rootPersonSearch, setRootPersonSearch] = useState('');
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  // Get auth context - may be in dev mode
  const { isDevMode, user } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('card-display-preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
    
    const savedFilters = localStorage.getItem('tree-filter-preferences');
    if (savedFilters) {
      setTreeFilters(JSON.parse(savedFilters));
    }

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
    
    if (key === 'defaultRootPerson' && value && people[value]) {
      toast({
        title: "Default Root Person Set",
        description: `Lineages will now trace to ${people[value].name}`,
      });
    }
  };

  const filteredPeople = useMemo(() => {
    const list = Object.entries(people)
      .map(([id, person]) => ({
        id,
        name: person.name || 'Unknown',
        surname: person.surname || '',
        birth: person.birth || person.birthYear?.toString() || '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!rootPersonSearch) return list.slice(0, 50);

    const term = rootPersonSearch.toLowerCase();
    return list.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.surname.toLowerCase().includes(term)
    ).slice(0, 50);
  }, [people, rootPersonSearch]);

  const selectedRootPerson = treeFilters.defaultRootPerson 
    ? people[treeFilters.defaultRootPerson] 
    : null;

  const handleConnectDropbox = async () => {
    if (isDevMode) {
      toast({
        title: "Dev Mode",
        description: "Cloud storage requires authentication. Enable auth or use local storage.",
      });
      return;
    }
    try {
      const authUrl = await CloudStorage.initDropboxAuth();
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Could not initialize Dropbox connection.",
        variant: "destructive",
      });
    }
  };

  const handleConnectGoogleDrive = async () => {
    if (isDevMode) {
      toast({
        title: "Dev Mode",
        description: "Cloud storage requires authentication. Enable auth or use local storage.",
      });
      return;
    }
    try {
      const authUrl = await CloudStorage.initGoogleDriveAuth();
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Could not initialize Google Drive connection.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectDropbox = () => {
    localStorage.removeItem('dropbox_access_token');
    setDropboxConnected(false);
    toast({ title: "Disconnected", description: "Dropbox has been disconnected." });
  };

  const handleDisconnectGoogleDrive = () => {
    localStorage.removeItem('google_drive_access_token');
    setDriveConnected(false);
    toast({ title: "Disconnected", description: "Google Drive has been disconnected." });
  };

  return (
    <>
      <VoicesSetupModal open={voicesModalOpen} onClose={() => setVoicesModalOpen(false)} />
      <UserProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
            <DialogTitle className="flex items-center gap-2">
              Preferences
              {isDevMode && (
                <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                  <Wrench className="h-3 w-3 mr-1" />
                  Dev Mode
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Dev Mode Notice */}
            {isDevMode && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Dev Mode Active</p>
                  <p className="text-xs text-muted-foreground">
                    All local settings work normally. Cloud features require sign-in.
                  </p>
                </div>
              </div>
            )}

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

            {/* Default Root Person Setting */}
            <Collapsible defaultOpen={true} className="space-y-3 p-3 border border-primary/30 rounded-lg bg-primary/5">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium cursor-pointer">Default Root Person</Label>
                  <Badge variant="outline" className="text-[10px]">NEW</Badge>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Set a "home base" person. Location views will show each person's lineage path back to this person.
                </p>
                
                {selectedRootPerson ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{selectedRootPerson.name}</p>
                        {selectedRootPerson.birth && (
                          <p className="text-xs text-muted-foreground">b. {selectedRootPerson.birth}</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleTreeFilterChange('defaultRootPerson', undefined)}
                    >
                      Clear
                    </Button>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 text-center">
                    <p className="text-xs text-muted-foreground">No root person set</p>
                  </div>
                )}

                {Object.keys(people).length > 0 ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for a person..."
                        value={rootPersonSearch}
                        onChange={(e) => setRootPersonSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    <Select 
                      value={treeFilters.defaultRootPerson || ''} 
                      onValueChange={(val) => handleTreeFilterChange('defaultRootPerson', val || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select root person..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {filteredPeople.map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            <span className="flex items-center gap-2">
                              {person.name}
                              {person.surname && (
                                <Badge variant="outline" className="text-[10px]">{person.surname}</Badge>
                              )}
                              {person.birth && (
                                <span className="text-xs text-muted-foreground">b. {person.birth}</span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                        {filteredPeople.length === 0 && (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No people found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Load a GEDCOM file to select a root person
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Theme Selection */}
            <div className="space-y-2">
              <Label htmlFor="theme-select">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme-select">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default Tree Style */}
            <div className="space-y-2">
              <Label htmlFor="tree-style">Default Tree Style</Label>
              <Select defaultValue="list">
                <SelectTrigger id="tree-style">
                  <SelectValue placeholder="Select default view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">📋 Tree List</SelectItem>
                  <SelectItem value="circular">⭕ Circular Pedigree</SelectItem>
                  <SelectItem value="map">🗺️ Map View</SelectItem>
                  <SelectItem value="timeline">📅 Timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tree Filters */}
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="space-y-4 pt-4 border-t border-border">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <Label className="text-sm font-medium cursor-pointer">Tree Display Filters</Label>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-gen">Maximum Generations</Label>
                  <Select 
                    value={String(treeFilters.maxGenerations)} 
                    onValueChange={(val) => handleTreeFilterChange('maxGenerations', parseInt(val))}
                  >
                    <SelectTrigger id="max-gen">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 6, 8, 10, 11, 12].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} Generations</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maternal-gens" className="text-xs text-muted-foreground">Maternal Generations</Label>
                    <Select 
                      value={String(treeFilters.maternalGenerations)} 
                      onValueChange={(val) => handleTreeFilterChange('maternalGenerations', parseInt(val))}
                    >
                      <SelectTrigger id="maternal-gens">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 4, 5, 6, 7, 8, 10].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paternal-gens" className="text-xs text-muted-foreground">Paternal Generations</Label>
                    <Select 
                      value={String(treeFilters.paternalGenerations)} 
                      onValueChange={(val) => handleTreeFilterChange('paternalGenerations', parseInt(val))}
                    >
                      <SelectTrigger id="paternal-gens">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 4, 5, 6, 7, 8, 10].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Person Card Display */}
            <Collapsible defaultOpen={true} className="space-y-4 pt-4 border-t border-border">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <Label className="text-sm font-medium cursor-pointer">Person Card Display</Label>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                {[
                  { key: 'showBirth', label: 'Show Birth Date' },
                  { key: 'showDeath', label: 'Show Death Date' },
                  { key: 'showNickname', label: 'Show Nickname' },
                  { key: 'showMaidenName', label: 'Show Maiden Name' },
                  { key: 'showOccupation', label: 'Show Occupation' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={preferences[key as keyof CardDisplayPreferences]}
                      onCheckedChange={(checked) => handlePreferenceChange(key as keyof CardDisplayPreferences, checked as boolean)}
                    />
                    <Label htmlFor={key} className="font-normal cursor-pointer">{label}</Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Cloud Storage */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="flex items-center gap-2">
                Cloud Storage
                {isDevMode && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Requires Auth
                  </Badge>
                )}
              </Label>
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
                    <Button 
                      variant={isDevMode ? "outline" : "default"} 
                      size="sm" 
                      onClick={handleConnectDropbox}
                      disabled={isDevMode}
                    >
                      {isDevMode ? "Needs Auth" : "Connect"}
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
                    <Button 
                      variant={isDevMode ? "outline" : "default"} 
                      size="sm" 
                      onClick={handleConnectGoogleDrive}
                      disabled={isDevMode}
                    >
                      {isDevMode ? "Needs Auth" : "Connect"}
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {isDevMode 
                    ? "Cloud storage is disabled in dev mode. Your data is saved locally."
                    : "Connect cloud storage to save your family tree data automatically."
                  }
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
