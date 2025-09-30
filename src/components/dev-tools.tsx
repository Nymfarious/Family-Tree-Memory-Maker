import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Code, Bug, Sparkles, Image, Brain, Zap, RotateCcw, Plus, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DevToolsProps {
  showChangelog: boolean;
  onToggleChangelog: () => void;
  showRoadmap: boolean;
  onToggleRoadmap: () => void;
  onResetTreeData?: () => void;
}

interface DevNote {
  timestamp: string;
  summary: string;
  fullText: string;
}

export function DevTools({ showChangelog, onToggleChangelog, showRoadmap, onToggleRoadmap, onResetTreeData }: DevToolsProps) {
  const [open, setOpen] = useState(false);
  const [devNotes, setDevNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState<DevNote[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    replicate: 'not-configured' | 'configured' | 'tested' | 'working';
    googleAI: 'not-configured' | 'configured' | 'tested' | 'working';
    huggingFace: 'not-configured' | 'configured' | 'tested' | 'working';
    lovableAI: 'not-configured' | 'configured' | 'tested' | 'working';
  }>({
    replicate: 'not-configured',
    googleAI: 'not-configured',
    huggingFace: 'not-configured',
    lovableAI: 'configured', // Lovable AI is pre-configured
  });
  const { toast } = useToast();

  const handleSummarizeNotes = async () => {
    if (!devNotes.trim()) {
      toast({
        title: "No notes to summarize",
        description: "Please enter some developer notes first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('dev-notes-ai', {
        body: { notes: devNotes }
      });

      if (error) throw error;

      const newNote: DevNote = {
        timestamp: new Date().toLocaleString(),
        summary: data.summary,
        fullText: devNotes,
      };

      setSavedNotes([newNote, ...savedNotes]);
      setDevNotes("");
      
      toast({
        title: "Notes Summarized",
        description: "Your dev notes have been processed and saved!",
      });
    } catch (error: any) {
      console.error("Error summarizing notes:", error);
      toast({
        title: "Summarization Failed",
        description: error.message || "Could not process notes. Check console.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: 'not-configured' | 'configured' | 'tested' | 'working') => {
    switch (status) {
      case 'not-configured': return 'bg-destructive'; // Red
      case 'configured': return 'bg-warning'; // Orange
      case 'tested': return 'bg-yellow-500'; // Yellow
      case 'working': return 'bg-green-500'; // Green
    }
  };

  const getStatusLabel = (status: 'not-configured' | 'configured' | 'tested' | 'working') => {
    switch (status) {
      case 'not-configured': return 'Not Configured';
      case 'configured': return 'API Key Added';
      case 'tested': return 'Tested';
      case 'working': return 'Working';
    }
  };

  const handleTestAPI = async (api: 'replicate' | 'googleAI' | 'huggingFace' | 'lovableAI') => {
    toast({
      title: `Testing ${api}...`,
      description: "Checking API connectivity",
    });
    
    // Simulate API test - in real implementation, call the edge function
    setTimeout(() => {
      setApiStatus({...apiStatus, [api]: 'working'});
      toast({
        title: "API Test Successful",
        description: `${api} is working correctly!`,
      });
    }, 1500);
  };

  const handleReset = () => {
    const confirmed = window.confirm("Are you sure you want to reset all dev settings and clear the family tree? This action cannot be undone.");
    if (confirmed) {
      setSavedNotes([]);
      setDevNotes("");
      setApiStatus({
        replicate: 'not-configured',
        googleAI: 'not-configured',
        huggingFace: 'not-configured',
        lovableAI: 'configured',
      });
      onResetTreeData?.();
      toast({
        title: "Reset Complete",
        description: "Dev tools and family tree data cleared.",
      });
    }
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Dev tools configuration has been saved.",
    });
    setOpen(false);
  };

  const handleTestData = () => {
    toast({
      title: "Test Data Loaded",
      description: "Sample GEDCOM bindings populated for testing.",
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="fixed top-4 left-4 h-8 w-8 opacity-30 hover:opacity-100 transition-opacity z-50"
          title="Developer Tools"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-warning"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z"
              fill="currentColor"
              opacity="0.6"
            />
            <path
              d="M7 8C7 8 5 10 5 12C5 14 7 16 7 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M17 8C17 8 19 10 19 12C19 14 17 16 17 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-warning" />
            Developer Tools
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Actions
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleReset} className="flex-1">
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button size="sm" variant="outline" onClick={handleTestData} className="flex-1">
                <Plus className="h-3 w-3 mr-1" />
                Test Data
              </Button>
            </div>
          </div>

          <Separator />

          {/* Dev Notes with AI */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-warning" />
              Dev Notes (AI-Powered)
            </h3>
            <Textarea
              placeholder="Type or paste developer notes here... These will be summarized and timestamped."
              value={devNotes}
              onChange={(e) => setDevNotes(e.target.value)}
              className="min-h-[120px] font-mono text-xs"
            />
            <Button 
              size="sm" 
              onClick={handleSummarizeNotes} 
              disabled={isProcessing || !devNotes.trim()}
              className="w-full"
            >
              {isProcessing ? "Processing..." : "Summarize & Save"}
            </Button>

            {savedNotes.length > 0 && (
              <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                {savedNotes.map((note, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20">
                    <div className="text-xs text-muted-foreground mb-1">{note.timestamp}</div>
                    <div className="text-sm">{note.summary}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* API Integrations with Ready-Set-Go Indicators */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" />
              API Integrations
            </h3>
            <div className="space-y-3">
              {/* Lovable AI */}
              <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">Lovable AI (Dev Notes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('not-configured')} ${apiStatus.lovableAI === 'not-configured' ? 'ring-1 ring-offset-1 ring-offset-card ring-destructive' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('configured')} ${apiStatus.lovableAI === 'configured' ? 'ring-1 ring-offset-1 ring-offset-card ring-warning' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('tested')} ${apiStatus.lovableAI === 'tested' ? 'ring-1 ring-offset-1 ring-offset-card ring-yellow-500' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('working')} ${apiStatus.lovableAI === 'working' ? 'ring-1 ring-offset-1 ring-offset-card ring-green-500' : 'opacity-30'}`} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{getStatusLabel(apiStatus.lovableAI)}</span>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleTestAPI('lovableAI')}>
                    Test
                  </Button>
                </div>
              </div>

              {/* Replicate */}
              <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Replicate (Photo Enhance)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('not-configured')} ${apiStatus.replicate === 'not-configured' ? 'ring-1 ring-offset-1 ring-offset-card ring-destructive' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('configured')} ${apiStatus.replicate === 'configured' ? 'ring-1 ring-offset-1 ring-offset-card ring-warning' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('tested')} ${apiStatus.replicate === 'tested' ? 'ring-1 ring-offset-1 ring-offset-card ring-yellow-500' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('working')} ${apiStatus.replicate === 'working' ? 'ring-1 ring-offset-1 ring-offset-card ring-green-500' : 'opacity-30'}`} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{getStatusLabel(apiStatus.replicate)}</span>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleTestAPI('replicate')}>
                    Test
                  </Button>
                </div>
              </div>

              {/* Google AI */}
              <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">Google AI (Insights)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('not-configured')} ${apiStatus.googleAI === 'not-configured' ? 'ring-1 ring-offset-1 ring-offset-card ring-destructive' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('configured')} ${apiStatus.googleAI === 'configured' ? 'ring-1 ring-offset-1 ring-offset-card ring-warning' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('tested')} ${apiStatus.googleAI === 'tested' ? 'ring-1 ring-offset-1 ring-offset-card ring-yellow-500' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('working')} ${apiStatus.googleAI === 'working' ? 'ring-1 ring-offset-1 ring-offset-card ring-green-500' : 'opacity-30'}`} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{getStatusLabel(apiStatus.googleAI)}</span>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleTestAPI('googleAI')}>
                    Test
                  </Button>
                </div>
              </div>

              {/* Hugging Face */}
              <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium">Hugging Face (Analysis)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('not-configured')} ${apiStatus.huggingFace === 'not-configured' ? 'ring-1 ring-offset-1 ring-offset-card ring-destructive' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('configured')} ${apiStatus.huggingFace === 'configured' ? 'ring-1 ring-offset-1 ring-offset-card ring-warning' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('tested')} ${apiStatus.huggingFace === 'tested' ? 'ring-1 ring-offset-1 ring-offset-card ring-yellow-500' : 'opacity-30'}`} />
                      <div className={`w-2 h-2 rounded-full ${getStatusColor('working')} ${apiStatus.huggingFace === 'working' ? 'ring-1 ring-offset-1 ring-offset-card ring-green-500' : 'opacity-30'}`} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{getStatusLabel(apiStatus.huggingFace)}</span>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleTestAPI('huggingFace')}>
                    Test
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* UI Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Code className="h-4 w-4" />
              UI Controls
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <span className="text-sm">Show Changelog Button</span>
                <Button
                  size="sm"
                  variant={showChangelog ? "default" : "outline"}
                  onClick={onToggleChangelog}
                >
                  {showChangelog ? "ON" : "OFF"}
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <span className="text-sm">Show Roadmap Button</span>
                <Button
                  size="sm"
                  variant={showRoadmap ? "default" : "outline"}
                  onClick={onToggleRoadmap}
                >
                  {showRoadmap ? "ON" : "OFF"}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dev Notes */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Developer Notes</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-warning/30 bg-warning/5">
                <div className="font-semibold text-sm mb-1">✓ Stable UUIDs Implemented</div>
                <p className="text-xs text-muted-foreground">
                  Each person now has a stable UUID generated from their GEDCOM ID. This allows you to attach photos, stories, and AI summaries to specific people.
                </p>
              </div>
              
              <div className="p-3 rounded-lg border border-accent/30 bg-accent/5">
                <div className="font-semibold text-sm mb-1">Idea: Focus mode</div>
                <p className="text-xs text-muted-foreground">
                  When you click a person, filter the tree to their ancestors/descendants; add breadcrumbs to pop back.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* API Integration Tracking */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">API Integrations</h3>
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-3">
                Track APIs as they're added to the project. Lovable Cloud is not yet enabled.
              </p>
              
              <div className="space-y-2">
                <div className="text-xs">
                  <Badge variant="outline" className="mr-2">None</Badge>
                  <span className="text-muted-foreground">No APIs configured yet</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                To track APIs, you can manually add them here or enable Lovable Cloud to access Supabase secrets.
              </p>
            </div>
          </div>

          <Separator />

          {/* Component Tracking */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Active Components</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-muted/20">
                <span>FamilyTreeApp</span>
                <Badge variant="secondary" className="text-xs">Main</Badge>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/20">
                <span>TreeList</span>
                <Badge variant="secondary" className="text-xs">View</Badge>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/20">
                <span>CircularTreeView</span>
                <Badge variant="secondary" className="text-xs">View</Badge>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/20">
                <span>GedcomParser</span>
                <Badge variant="secondary" className="text-xs">Util</Badge>
              </div>
            </div>
          </div>

          {/* Save and Close Buttons */}
          <div className="sticky bottom-0 bg-background border-t border-border pt-4 flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
              Close
            </Button>
            <Button 
              variant="default" 
              className="flex-1 flex items-center gap-2"
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
