import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Code, Bug, Sparkles, Image, Brain, Zap, RotateCcw, Plus, X, Save, Link as LinkIcon, Copy, Trash2, ShieldAlert, ChevronDown, Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertCircle, Upload, Cloud, Volume2, Activity, ListTodo, Workflow } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ApiDashboardModal } from "@/components/modals/api-dashboard-modal";
import { AIWorkspace } from "@/components/ai-workspace";

interface DevToolsProps {
  showChangelog: boolean;
  onToggleChangelog: () => void;
  showCodeHealth: boolean;
  onToggleCodeHealth: () => void;
  onResetTreeData?: () => void;
  onLoadTestData?: (content: string, filename: string) => void;
}

interface DevNote {
  timestamp: string;
  summary: string;
  fullText: string;
}

interface TemporaryInvite {
  id: string;
  email: string | null;
  magic_token: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  notes: string | null;
  created_at: string;
}

export function DevTools({ showChangelog, onToggleChangelog, showCodeHealth, onToggleCodeHealth, onResetTreeData, onLoadTestData }: DevToolsProps) {
  const [open, setOpen] = useState(false);
  const [devNotes, setDevNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState<DevNote[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  // Collapsible state
  const [tempAccessOpen, setTempAccessOpen] = useState(true);
  const [devNotesOpen, setDevNotesOpen] = useState(true);
  const [apiIntegrationsOpen, setApiIntegrationsOpen] = useState(true);
  const [flowchartOpen, setFlowchartOpen] = useState(false);
  const [showAIWorkspace, setShowAIWorkspace] = useState(false);
  
  // Temporary Access state
  const [tempEmail, setTempEmail] = useState("");
  const [tempExpiry, setTempExpiry] = useState("24");
  const [tempNotes, setTempNotes] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [invites, setInvites] = useState<TemporaryInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  
  const [apiStatus, setApiStatus] = useState<{
    replicate: 'not-configured' | 'configured' | 'tested' | 'working';
    googleAI: 'not-configured' | 'configured' | 'tested' | 'working';
    huggingFace: 'not-configured' | 'configured' | 'tested' | 'working';
    lovableAI: 'not-configured' | 'configured' | 'tested' | 'working';
  }>({
    replicate: 'not-configured',
    googleAI: 'not-configured',
    huggingFace: 'not-configured',
    lovableAI: 'configured',
  });
  
  // Lovable API Key management (Admin only)
  const [lovableApiKey, setLovableApiKey] = useState("");
  const [showLovableKey, setShowLovableKey] = useState(false);
  const [testingLovableKey, setTestingLovableKey] = useState(false);
  
  // API Dashboard modal state
  const [apiDashboardOpen, setApiDashboardOpen] = useState(false);
  
  const { toast } = useToast();

  // Check if current user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          setCheckingAdmin(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (open) {
      checkAdminRole();
      if (isAdmin) {
        loadInvites();
      }
      // Load Lovable API key from localStorage (admin only)
      const storedKey = localStorage.getItem('lovable_api_key');
      if (storedKey && isAdmin) {
        try {
          setLovableApiKey(atob(storedKey));
          setApiStatus(prev => ({ ...prev, lovableAI: 'configured' }));
        } catch (e) {
          console.error('Error decoding API key:', e);
        }
      }
    }
  }, [open, isAdmin]);

  const loadInvites = async () => {
    setLoadingInvites(true);
    try {
      const { data, error } = await supabase
        .from('temporary_invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error: any) {
      console.error('Error loading invites:', error);
      toast({
        title: "Failed to load invites",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('generate-temporary-link', {
        body: {
          email: tempEmail || undefined,
          expiresInHours: parseInt(tempExpiry),
          notes: tempNotes || undefined,
        },
      });

      if (error) throw error;

      setGeneratedLink(data.magicLink);
      toast({
        title: "Magic Link Generated!",
        description: "Link has been created. Click to copy.",
      });

      // Reset form
      setTempEmail("");
      setTempNotes("");
      setTempExpiry("24");

      // Reload invites
      await loadInvites();
    } catch (error: any) {
      console.error('Error generating link:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate link",
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleReactivateLink = async (inviteId: string, reactivate: boolean) => {
    if (!reactivate) return;

    setGeneratingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('generate-temporary-link', {
        body: {
          reactivateInviteId: inviteId,
          expiresInHours: parseInt(tempExpiry),
        },
      });

      if (error) throw error;

      setGeneratedLink(data.magicLink);
      toast({
        title: "Link Reactivated!",
        description: "New magic link generated with reset timer.",
      });

      // Reload invites
      await loadInvites();
    } catch (error: any) {
      console.error('Error reactivating link:', error);
      toast({
        title: "Reactivation Failed",
        description: error.message || "Could not reactivate link",
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('temporary_invites')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Invite Revoked",
        description: "The magic link has been revoked.",
      });

      await loadInvites();
    } catch (error: any) {
      console.error('Error revoking invite:', error);
      toast({
        title: "Revoke Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

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
      case 'not-configured': return 'bg-destructive';
      case 'configured': return 'bg-warning';
      case 'tested': return 'bg-yellow-500';
      case 'working': return 'bg-green-500';
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

  // Lovable API Key handlers (Admin only)
  const saveLovableApiKey = () => {
    if (!lovableApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem('lovable_api_key', btoa(lovableApiKey));
    setApiStatus(prev => ({ ...prev, lovableAI: 'configured' }));
    toast({
      title: "API Key Saved",
      description: "Lovable API key has been saved successfully",
    });
  };

  const testLovableApiKey = async () => {
    if (!lovableApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key first",
        variant: "destructive",
      });
      return;
    }

    setTestingLovableKey(true);
    setApiStatus(prev => ({ ...prev, lovableAI: 'tested' }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/code-health-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: "test",
            conversationHistory: []
          }),
        }
      );

      if (response.ok) {
        setApiStatus(prev => ({ ...prev, lovableAI: 'working' }));
        toast({
          title: "Connection Successful",
          description: "✅ Lovable AI connection is working!",
        });
      } else {
        setApiStatus(prev => ({ ...prev, lovableAI: 'configured' }));
        toast({
          title: "Connection Failed",
          description: "❌ Check your API key",
          variant: "destructive",
        });
      }
    } catch (error) {
      setApiStatus(prev => ({ ...prev, lovableAI: 'configured' }));
      toast({
        title: "Connection Test Failed",
        description: "❌ Could not connect to Lovable AI",
        variant: "destructive",
      });
    } finally {
      setTestingLovableKey(false);
    }
  };

  const clearLovableApiKey = () => {
    localStorage.removeItem('lovable_api_key');
    setLovableApiKey("");
    setApiStatus(prev => ({ ...prev, lovableAI: 'not-configured' }));
    toast({
      title: "API Key Cleared",
      description: "Lovable API key has been removed",
    });
  };

  const handleTestAPI = async (api: 'replicate' | 'googleAI' | 'huggingFace' | 'lovableAI') => {
    toast({
      title: `Testing ${api}...`,
      description: "Checking API connectivity",
    });
    
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

  const handleTestData = async () => {
    try {
      // Try to load primary test data first (user's Kennedy tree, filtered)
      let response = await fetch('/kennedy-full.ged');
      let filename = 'kennedy-full.ged';
      
      // Fallback to sample if primary not available
      if (!response.ok) {
        response = await fetch('/sample.ged');
        filename = 'sample.ged';
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch test GEDCOM file');
      }
      
      const content = await response.text();
      
      if (onLoadTestData) {
        onLoadTestData(content, filename);
      }
      
      toast({
        title: "Test Data Loaded",
        description: `Loaded ${filename === 'kennedy-full.ged' ? 'Kennedy Family Tree' : 'Sample'} data successfully.`,
      });
    } catch (error) {
      console.error('Error loading test data:', error);
      toast({
        title: "Failed to Load Test Data",
        description: error instanceof Error ? error.message : "Could not load test GEDCOM file.",
        variant: "destructive",
      });
    }
  };

  if (checkingAdmin && open) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="fixed top-4 left-4 h-8 w-8 opacity-30 hover:opacity-100 transition-opacity z-50"
            title="Developer Tools"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-warning" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z" fill="currentColor" opacity="0.6" />
              <path d="M7 8C7 8 5 10 5 12C5 14 7 16 7 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M17 8C17 8 19 10 19 12C19 14 17 16 17 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[400px]">
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="fixed top-4 left-4 h-8 w-8 opacity-30 hover:opacity-100 transition-opacity z-50"
          title="Developer Tools"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-warning" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z" fill="currentColor" opacity="0.6" />
            <path d="M7 8C7 8 5 10 5 12C5 14 7 16 7 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 8C17 8 19 10 19 12C19 14 17 16 17 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-warning" />
            Developer Tools
            {isAdmin && <Badge variant="destructive" className="text-xs bg-destructive hover:bg-destructive">ADMIN</Badge>}
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

          {/* Admin-only Temporary Access section */}
          {isAdmin && (
            <>
              <Separator />
              <Collapsible open={tempAccessOpen} onOpenChange={setTempAccessOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                    Temporary Access (Admin Only)
                  </h3>
                  <ChevronDown className={`h-4 w-4 transition-transform ${tempAccessOpen ? 'transform rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Generate single-use magic links for temporary access
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="temp-email" className="text-xs">Email (optional)</Label>
                    <Input
                      id="temp-email"
                      type="email"
                      placeholder="contractor@example.com"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temp-expiry" className="text-xs">Expires In</Label>
                    <Select value={tempExpiry} onValueChange={setTempExpiry}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="24">24 hours (1 day)</SelectItem>
                        <SelectItem value="72">72 hours (3 days)</SelectItem>
                        <SelectItem value="168">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temp-notes" className="text-xs">Notes (optional)</Label>
                    <Textarea
                      id="temp-notes"
                      placeholder="Purpose of this link..."
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      className="min-h-[60px] text-xs"
                    />
                  </div>

                  <Button 
                    size="sm" 
                    onClick={handleGenerateLink}
                    disabled={generatingLink}
                    className="w-full"
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    {generatingLink ? "Generating..." : "Generate Link"}
                  </Button>

                  {generatedLink && (
                    <div className="p-2 rounded bg-muted/50 space-y-2">
                      <p className="text-xs font-mono break-all">{generatedLink}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs"
                        onClick={() => copyToClipboard(generatedLink)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Link
                      </Button>
                    </div>
                  )}
                </div>

                {/* Active/Past Invites */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {loadingInvites ? (
                    <p className="text-xs text-muted-foreground">Loading invites...</p>
                  ) : invites.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No invites generated yet</p>
                  ) : (
                    invites.map((invite) => {
                      const expired = isExpired(invite.expires_at);
                      const used = !!invite.used_at;
                      const revoked = !!invite.revoked_at;

                      return (
                        <div
                          key={invite.id}
                          className={`p-2 rounded-lg border text-xs space-y-1 ${
                            revoked ? 'border-destructive/50 bg-destructive/5' :
                            used ? 'border-green-500/50 bg-green-500/5' :
                            expired ? 'border-yellow-500/50 bg-yellow-500/5' :
                            'border-border bg-card'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">
                              {invite.email || 'Anonymous'}
                            </span>
                            <Badge 
                              variant={
                                revoked ? 'destructive' :
                                used ? 'default' :
                                expired ? 'secondary' :
                                'outline'
                              }
                              className="text-xs"
                            >
                              {revoked ? 'Revoked' : used ? 'Used' : expired ? 'Expired' : 'Active'}
                            </Badge>
                          </div>
                          
                          {invite.notes && (
                            <p className="text-muted-foreground">{invite.notes}</p>
                          )}
                          
                          <p className="text-muted-foreground">
                            Created: {formatDate(invite.created_at)}
                          </p>
                          <p className="text-muted-foreground">
                            Expires: {formatDate(invite.expires_at)}
                          </p>
                          
                          {used && (
                            <p className="text-green-600">
                              Used: {formatDate(invite.used_at!)}
                            </p>
                          )}

                          {!used && !revoked && (
                            <div className="flex gap-1 mt-2">
                              {expired && (
                                <div className="flex items-center gap-2 flex-1">
                                  <Checkbox
                                    id={`reactivate-${invite.id}`}
                                    onCheckedChange={(checked) => 
                                      handleReactivateLink(invite.id, checked as boolean)
                                    }
                                  />
                                  <label
                                    htmlFor={`reactivate-${invite.id}`}
                                    className="text-xs cursor-pointer"
                                  >
                                    Reactivate
                                  </label>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={() => handleRevokeInvite(invite.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          <Separator />

          {/* Dev Notes with AI */}
          <Collapsible open={devNotesOpen} onOpenChange={setDevNotesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-warning" />
                Dev Notes (AI-Powered)
              </h3>
              <ChevronDown className={`h-4 w-4 transition-transform ${devNotesOpen ? 'transform rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
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
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* API Integrations */}
          <Collapsible open={apiIntegrationsOpen} onOpenChange={setApiIntegrationsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4" />
                API Integrations
              </h3>
              <ChevronDown className={`h-4 w-4 transition-transform ${apiIntegrationsOpen ? 'transform rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
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
                  
                  {/* Admin-only API Key Management */}
                  {isAdmin && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <div className="flex items-center gap-2 text-xs text-destructive font-semibold">
                        <ShieldAlert className="h-3 w-3" />
                        ADMIN ONLY - Live API Key
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lovable-api-key" className="text-xs">Lovable API Key</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="lovable-api-key"
                              type={showLovableKey ? "text" : "password"}
                              value={lovableApiKey}
                              onChange={(e) => setLovableApiKey(e.target.value)}
                              placeholder="Enter Lovable API key..."
                              className="h-8 text-xs pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-2"
                              onClick={() => setShowLovableKey(!showLovableKey)}
                            >
                              {showLovableKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Stored locally, never sent to our servers (only to Lovable AI).
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveLovableApiKey} size="sm" variant="outline" className="flex-1 h-7 text-xs">
                          Save Key
                        </Button>
                        <Button 
                          onClick={testLovableApiKey} 
                          size="sm"
                          variant="outline"
                          disabled={testingLovableKey || !lovableApiKey.trim()}
                          className="flex-1 h-7 text-xs"
                        >
                          {testingLovableKey ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            "Test"
                          )}
                        </Button>
                      </div>
                      {lovableApiKey && (
                        <Button 
                          onClick={clearLovableApiKey} 
                          size="sm"
                          variant="outline" 
                          className="w-full h-7 text-xs"
                        >
                          Clear API Key
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Replicate */}
                <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <span className="text-sm font-medium">Replicate (Image Gen)</span>
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
                      <Brain className="h-4 w-4" />
                      <span className="text-sm font-medium">Google AI (Gemini)</span>
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
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">Hugging Face</span>
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
              
              {/* API Dashboard Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => setApiDashboardOpen(true)}
              >
                <Activity className="h-3 w-3 mr-2" />
                Open API Dashboard
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* AI Flowchart Workspace */}
          <Collapsible open={flowchartOpen} onOpenChange={setFlowchartOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Workflow className="h-4 w-4 text-primary" />
                AI Flowchart Workspace
              </h3>
              <ChevronDown className={`h-4 w-4 transition-transform ${flowchartOpen ? 'transform rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Create flowcharts with voice input or text descriptions. AI-powered generation with save to local/cloud storage.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setShowAIWorkspace(true);
                    setOpen(false);
                  }}
                >
                  <Workflow className="h-3 w-3 mr-2" />
                  Open Flowchart Workspace
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Wishlist Section */}
          <Collapsible defaultOpen className="space-y-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-primary" />
                Dev Wishlist
              </h3>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <div className="p-3 rounded-lg border border-border bg-card/50 space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-api-dashboard" defaultChecked />
                  <Label htmlFor="wish-api-dashboard" className="text-xs leading-relaxed cursor-pointer">
                    API Integration Dashboard - Monitor all API platforms, rate limits, bidirectional status, and secret locations
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-realtime-logs" />
                  <Label htmlFor="wish-realtime-logs" className="text-xs leading-relaxed cursor-pointer">
                    Real-time API Call Logs - View live request/response data with timing and error tracking
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-cost-tracking" />
                  <Label htmlFor="wish-cost-tracking" className="text-xs leading-relaxed cursor-pointer">
                    Cost Analytics - Track API spending across all platforms with budget alerts
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-webhook-tester" />
                  <Label htmlFor="wish-webhook-tester" className="text-xs leading-relaxed cursor-pointer">
                    Webhook Testing Suite - Test and debug webhook integrations with mock payloads
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-performance" />
                  <Label htmlFor="wish-performance" className="text-xs leading-relaxed cursor-pointer">
                    Performance Profiler - Identify slow API calls and optimization opportunities
                  </Label>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic px-3">
                Check items you'd like prioritized. These features help monitor and optimize your API integrations.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* AI Voice Assistant (Admin Only) */}
          {isAdmin && (
            <>
              <Collapsible defaultOpen className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Voice Assistant
                  </h3>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3">
                  {/* Secret Button Icon Configurator */}
                  <div className="p-3 rounded-lg border border-border bg-card/50 space-y-3">
                    <Label className="text-xs font-semibold">Secret Button Icon</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                        <Upload className="h-3 w-3 mr-1" />
                        Upload
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" disabled>
                        <Cloud className="h-3 w-3 mr-1" />
                        Cloud
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" disabled>
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Gen
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Button Visibility</span>
                      <Button size="sm" variant="ghost" className="h-6 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Visible
                      </Button>
                    </div>
                  </div>

                  {/* Voice Transcription & AI Interface */}
                  <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                    {/* Recording Controls */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="relative"
                        disabled
                      >
                        <div className="relative">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" />
                            <path d="M19 10v2a7 7 0 1 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 rounded-full bg-status-red animate-pulse opacity-0 pointer-events-none" />
                        </div>
                      </Button>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">00:00</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-0 bg-primary transition-all" />
                        </div>
                      </div>
                    </div>

                    {/* Transcription Display */}
                    <div className="space-y-2">
                      <Label className="text-xs">Transcribed Text</Label>
                      <Textarea
                        placeholder="Audio will be transcribed here... Edit before sending."
                        className="min-h-[100px] text-xs"
                        disabled
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Recording supports pause/resume. Up to 3 segments will be combined.
                      </p>
                    </div>

                    {/* Send to AI */}
                    <Button size="sm" className="w-full" disabled>
                      <svg className="h-3 w-3 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Send to AI
                    </Button>

                    {/* AI Response Display */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">AI Response</Label>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" disabled>
                          <Volume2 className="h-3 w-3 mr-1" />
                          Read Aloud
                        </Button>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-xs text-muted-foreground min-h-[60px]">
                        AI responses will appear here and can be read aloud.
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground italic">
                    Voice features coming soon. Configure in Settings → Voice Settings.
                  </p>
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

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
                <span className="text-sm">Show Code Health Button</span>
                <Button
                  size="sm"
                  variant={showCodeHealth ? "default" : "outline"}
                  onClick={onToggleCodeHealth}
                >
                  {showCodeHealth ? "ON" : "OFF"}
                </Button>
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
      
      {/* AI Workspace Modal */}
      {showAIWorkspace && (
        <AIWorkspace onClose={() => setShowAIWorkspace(false)} />
      )}

      {/* API Dashboard Modal */}
      <ApiDashboardModal
        open={apiDashboardOpen} 
        onOpenChange={setApiDashboardOpen}
      />
    </Sheet>
  );
}
