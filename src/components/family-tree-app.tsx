import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CloudPickerModal } from "@/components/modals/cloud-picker-modal";
import { PreferencesModal } from "@/components/modals/preferences-modal";
import { ImportGedcomModal } from "@/components/modals/import-gedcom-modal";
import { ChangeLogDrawer } from "@/components/drawers/changelog-drawer";
import { DevTools } from "@/components/dev-tools";
import { TreeList } from "@/components/tree-list";
import { CircularTreeView } from "@/components/circular-tree-view";
import { TaskList } from "@/components/task-list";
import { StatusIndicator } from "@/components/status-indicator";
import { StorageUtils } from "@/utils/storage";
import { parseGedcom } from "@/utils/gedcomParser";
import type { GedcomData, CloudProvider, ChangeLogEntry } from "@/types/gedcom";
import { Upload, Save, Cloud, History, Users, TreePine, Home, Circle, Settings, Globe, LogOut, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function FamilyTreeApp() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [ged, setGed] = useState<GedcomData | null>(() => 
    StorageUtils.loadLocal<GedcomData>("ft:ged-last")
  );
  const [cloudOpen, setCloudOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showChangelog, setShowChangelog] = useState(true);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [maxGenerations, setMaxGenerations] = useState<number>(7);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Calculate stats (must be before any early returns)
  const stats = useMemo(() => {
    if (!ged) return { people: 0, families: 0, roots: 0 };
    return {
      people: Object.keys(ged.people).length,
      families: Object.keys(ged.families).length,
      roots: ged.roots.length
    };
  }, [ged]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });
  };

  // Early returns AFTER all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Open the import modal for the new flow
    setPendingFile(file);
    setImportOpen(true);
    
    // Reset the input so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onImportComplete = (content: string, filename: string, generations: number) => {
    try {
      const parsed = parseGedcom(content);
      setGed(parsed);
      setMaxGenerations(generations);
      StorageUtils.saveLocal("ft:ged-last", parsed);
      toast({
        title: "GEDCOM Imported Successfully",
        description: `Loaded ${Object.keys(parsed.people).length} people and ${Object.keys(parsed.families).length} families from "${filename}" (${generations} generations).`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Could not parse the GEDCOM file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const onSaveLocal = () => {
    if (!ged) {
      toast({
        title: "Nothing to Save",
        description: "Please import a GEDCOM file first.",
        variant: "destructive",
      });
      return;
    }
    
    // Create downloadable file
    const dataStr = JSON.stringify(ged, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `family-tree-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Your family tree has been saved to your Downloads folder.",
    });
  };

  const onChooseCloud = async (providerId: CloudProvider) => {
    setCloudOpen(false);

    if (!ged) {
      toast({
        title: "Nothing to Save",
        description: "Please import a GEDCOM file first.",
        variant: "destructive",
      });
      return;
    }

    const content = JSON.stringify(ged, null, 2);
    const filename = `family-tree-${new Date().toISOString().split('T')[0]}.json`;

    try {
      switch (providerId) {
        case 'supabase':
          const { CloudStorage } = await import('@/utils/cloudStorage');
          const supabaseStorage = new CloudStorage({ provider: 'supabase' });
          const supabaseResult = await supabaseStorage.uploadFile(filename, content);
          
          if (supabaseResult.success) {
            toast({
              title: "✅ Saved to Cloud Storage",
              description: "Your family tree has been saved securely.",
            });
          } else {
            toast({
              title: "Upload Failed",
              description: supabaseResult.error || "Could not save to cloud storage.",
              variant: "destructive",
            });
          }
          break;

        case 'dropbox':
          const dropboxToken = localStorage.getItem('dropbox_access_token');
          if (!dropboxToken) {
            toast({
              title: "Dropbox Not Connected",
              description: "Please connect your Dropbox account in Preferences first.",
              variant: "destructive",
            });
            setPrefsOpen(true);
            return;
          }
          
          const { CloudStorage: CloudStorage1 } = await import('@/utils/cloudStorage');
          const dropboxStorage = new CloudStorage1({ provider: 'dropbox', accessToken: dropboxToken });
          const dropboxResult = await dropboxStorage.uploadFile(filename, content);
          
          if (dropboxResult.success) {
            toast({
              title: "✅ Saved to Dropbox",
              description: `Saved to: ${dropboxResult.url}`,
            });
          } else {
            toast({
              title: "Dropbox Upload Failed",
              description: dropboxResult.error || "Could not upload to Dropbox.",
              variant: "destructive",
            });
          }
          break;

        case 'drive':
          const driveToken = localStorage.getItem('google_drive_access_token');
          if (!driveToken) {
            toast({
              title: "Google Drive Not Connected",
              description: "Please connect your Google Drive account in Preferences first.",
              variant: "destructive",
            });
            setPrefsOpen(true);
            return;
          }
          
          const { CloudStorage: CloudStorage2 } = await import('@/utils/cloudStorage');
          const driveStorage = new CloudStorage2({ provider: 'drive', accessToken: driveToken });
          const driveResult = await driveStorage.uploadFile(filename, content);
          
          if (driveResult.success) {
            toast({
              title: "✅ Saved to Google Drive",
              description: `File ID: ${driveResult.url}`,
            });
          } else {
            toast({
              title: "Google Drive Upload Failed",
              description: driveResult.error || "Could not upload to Google Drive.",
              variant: "destructive",
            });
          }
          break;

        default:
          toast({
            title: "Coming Soon",
            description: `${providerId} integration is in development.`,
          });
      }
    } catch (error) {
      console.error('Cloud upload error:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const changelog: ChangeLogEntry[] = [
    {
      title: "Add Change Log drawer",
      when: "2025-09-29",
      author: "You & Don",
      detail: "Minimal drawer; entries hard-coded for now."
    },
    {
      title: "Add Save to Cloud stub",
      when: "2025-09-29",
      author: "You & Don",
      detail: "Opens provider picker. Wire up later."
    },
    {
      title: "GEDCOM upload + parse",
      when: "2025-09-29",
      author: "You & Don",
      detail: "Parses INDI/FAM basics, renders tree."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Dev Tools */}
      <DevTools 
        showChangelog={showChangelog} 
        onToggleChangelog={() => setShowChangelog(!showChangelog)}
        showRoadmap={showRoadmap}
        onToggleRoadmap={() => setShowRoadmap(!showRoadmap)}
        onResetTreeData={() => {
          setGed(null);
          setFocus(null);
          StorageUtils.saveLocal("ft:ged-last", null);
        }}
        onLoadTestData={(content, filename) => {
          try {
            const parsed = parseGedcom(content);
            
            // Filter to 12 generations if loading Kennedy tree
            const treeFilters = localStorage.getItem('tree-filter-preferences');
            const maxGens = treeFilters ? JSON.parse(treeFilters).maxGenerations : 12;
            
            setGed(parsed);
            setMaxGenerations(maxGens);
            StorageUtils.saveLocal("ft:ged-last", parsed);
            toast({
              title: "Test Data Loaded",
              description: `Loaded ${Object.keys(parsed.people).length} people from "${filename}" (${maxGens} generations max).`,
            });
          } catch (error) {
            toast({
              title: "Failed to Parse Test Data",
              description: "Could not parse the test GEDCOM file.",
              variant: "destructive",
            });
          }
        }}
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <TreePine className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Family Tree GED</h1>
              <Badge variant="outline" className="text-xs">Prototype</Badge>
              <StatusIndicator status="working" size="sm" />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => inputRef.current?.click()} variant="default" className="relative">
                <Upload className="mr-2 h-4 w-4" />
                Import GEDCOM
                <StatusIndicator status="configured" size="sm" className="absolute -top-1 -right-1" />
              </Button>
              <Input
                ref={inputRef}
                type="file"
                accept=".ged,.gedcom,.zip,.rar,.7z,application/x-gedcom,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed"
                onChange={onFile}
                className="hidden"
              />
              <Button onClick={() => setPrefsOpen(true)} variant="outline" className="relative">
                <Settings className="mr-2 h-4 w-4" />
                Preferences
                <StatusIndicator status="tested" size="sm" className="absolute -top-1 -right-1" />
              </Button>
              <Button onClick={onSaveLocal} variant="outline" className="relative">
                <Save className="mr-2 h-4 w-4" />
                Save Local
                <StatusIndicator status="working" size="sm" className="absolute -top-1 -right-1" />
              </Button>
              <Button onClick={() => setCloudOpen(true)} variant="outline" className="relative">
                <Cloud className="mr-2 h-4 w-4" />
                Save to Cloud…
                <StatusIndicator status="configured" size="sm" className="absolute -top-1 -right-1" />
              </Button>
              {showChangelog && (
                <Button onClick={() => setDrawerOpen(true)} variant="ghost">
                  <History className="mr-2 h-4 w-4" />
                  Change Log
                </Button>
              )}
              <Button onClick={() => setShowRoadmap(true)} variant="ghost" className="relative">
                <Globe className="mr-2 h-4 w-4" />
                Roadmap
                <StatusIndicator status="not-configured" size="sm" className="absolute -top-1 -right-1" />
              </Button>
              <Button onClick={() => navigate('/code-health')} variant="outline" className="relative">
                <Activity className="mr-2 h-4 w-4" />
                Code Health
                <StatusIndicator status="working" size="sm" className="absolute -top-1 -right-1" />
              </Button>
              <Button onClick={handleSignOut} variant="ghost" size="icon" title="Sign Out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Overview Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col gap-2 items-start">
                  <span className="text-lg font-semibold text-muted-foreground">Workspace</span>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Overview
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.people}</div>
                    <div className="text-sm text-muted-foreground">People</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.families}</div>
                    <div className="text-sm text-muted-foreground">Families</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.roots}</div>
                    <div className="text-sm text-muted-foreground">Roots</div>
                  </div>
                </div>

                {!ged && (
                  <div className="text-center space-y-4 p-6 border-2 border-dashed border-border rounded-lg">
                    <TreePine className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-muted-foreground mb-4">
                        Import a <code className="bg-muted px-1 py-0.5 rounded text-xs">.ged</code> file to begin.
                      </p>
                      <Button onClick={() => inputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File…
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tree Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col gap-3">
                  <span className="text-lg font-semibold text-muted-foreground">Workspace</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TreePine className="h-5 w-5 text-primary" />
                      Family Tree Views
                    </div>
                  {focus && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Focus:</span>
                      <Badge variant="secondary">
                        {ged?.people[focus]?.name || focus}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => setFocus(null)}>
                        <Home className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ged ? (
                  <Tabs defaultValue="list" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="list" className="flex items-center gap-2">
                        <TreePine className="h-4 w-4" />
                        List View
                      </TabsTrigger>
                      <TabsTrigger value="circular" className="flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        Circular View
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="list" className="mt-0">
                      <TreeList
                        roots={focus ? [focus] : ged.roots}
                        people={ged.people}
                        childToParents={ged.childToParents}
                        families={ged.families}
                        onFocus={setFocus}
                      />
                    </TabsContent>
                    
                    <TabsContent value="circular" className="mt-0">
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                          <p className="flex items-center gap-2">
                            <Circle className="h-4 w-4" />
                            Semi-circular ancestor view with focused person at center. Click any person to refocus.
                          </p>
                        </div>
                        <CircularTreeView
                          rootPerson={focus || ged.roots[0]}
                          people={ged.people}
                          childToParents={ged.childToParents}
                          families={ged.families}
                          onFocus={setFocus}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <TreePine className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No tree yet. Import a GEDCOM file to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Family Tree GEDCOM Parser • Built with React, TypeScript & Tailwind CSS
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CloudPickerModal 
        open={cloudOpen} 
        onClose={() => setCloudOpen(false)} 
        onChoose={onChooseCloud} 
      />
      <PreferencesModal 
        open={prefsOpen} 
        onClose={() => setPrefsOpen(false)} 
      />
      <ImportGedcomModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setPendingFile(null);
        }}
        onImport={onImportComplete}
        file={pendingFile}
      />
      <ChangeLogDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        entries={changelog} 
      />
      
      {/* Roadmap Dialog */}
      <Dialog open={showRoadmap} onOpenChange={setShowRoadmap}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Development Roadmap
            </DialogTitle>
          </DialogHeader>
          <TaskList />
        </DialogContent>
      </Dialog>
    </div>
  );
}