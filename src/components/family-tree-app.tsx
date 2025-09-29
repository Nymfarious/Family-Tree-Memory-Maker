import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DevNote } from "@/components/ui/dev-note";
import { CloudPickerModal } from "@/components/modals/cloud-picker-modal";
import { ChangeLogDrawer } from "@/components/drawers/changelog-drawer";
import { TreeList } from "@/components/tree-list";
import { StorageUtils } from "@/utils/storage";
import { parseGedcom } from "@/utils/gedcomParser";
import type { GedcomData, CloudProvider, ChangeLogEntry } from "@/types/gedcom";
import { Upload, Save, Cloud, History, Users, TreePine, Home } from "lucide-react";

export function FamilyTreeApp() {
  const [ged, setGed] = useState<GedcomData | null>(() => 
    StorageUtils.loadLocal<GedcomData>("ft:ged-last")
  );
  const [cloudOpen, setCloudOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const stats = useMemo(() => {
    if (!ged) return { people: 0, families: 0, roots: 0 };
    return {
      people: Object.keys(ged.people).length,
      families: Object.keys(ged.families).length,
      roots: ged.roots.length
    };
  }, [ged]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseGedcom(String(reader.result || ""));
        setGed(parsed);
        StorageUtils.saveLocal("ft:ged-last", parsed);
        toast({
          title: "GEDCOM Imported Successfully",
          description: `Loaded ${Object.keys(parsed.people).length} people and ${Object.keys(parsed.families).length} families.`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Could not parse the GEDCOM file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
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
    
    const success = StorageUtils.saveLocal("ft:ged-last", ged);
    toast({
      title: success ? "Saved Locally" : "Save Failed",
      description: success ? "Your family tree has been saved to local storage." : "Could not save to local storage.",
      variant: success ? "default" : "destructive",
    });
  };

  const onChooseCloud = (providerId: CloudProvider) => {
    setCloudOpen(false);
    toast({
      title: "Cloud Save Stub",
      description: `Pretend-upload to: ${providerId}. Replace this with your actual API call.`,
    });
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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <TreePine className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Family Tree GED</h1>
              <Badge variant="outline" className="text-xs">Prototype</Badge>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => inputRef.current?.click()} variant="default">
                <Upload className="mr-2 h-4 w-4" />
                Import GEDCOM
              </Button>
              <Input
                ref={inputRef}
                type="file"
                accept=".ged,text/plain"
                onChange={onFile}
                className="hidden"
              />
              <Button onClick={onSaveLocal} variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save Local
              </Button>
              <Button onClick={() => setCloudOpen(true)} variant="outline">
                <Cloud className="mr-2 h-4 w-4" />
                Save to Cloud…
              </Button>
              <Button onClick={() => setDrawerOpen(true)} variant="ghost">
                <History className="mr-2 h-4 w-4" />
                Change Log
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Overview
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

                <DevNote
                  type="question"
                  title="Dev note: What's our canonical ID?"
                  note="Using GEDCOM xrefs (@I1@, @F1@) as IDs. If you want stable UUIDs, we can generate and map them."
                />
                
                <DevNote
                  type="idea"
                  title="Idea: Focus mode"
                  note="When you click a person, filter the tree to their ancestors/descendants; add breadcrumbs to pop back."
                />

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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TreePine className="h-5 w-5 text-primary" />
                    Family Tree
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ged ? (
                  <TreeList
                    roots={focus ? [focus] : ged.roots}
                    people={ged.people}
                    childToParents={ged.childToParents}
                    families={ged.families}
                    onFocus={setFocus}
                  />
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
      <ChangeLogDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        entries={changelog} 
      />
    </div>
  );
}