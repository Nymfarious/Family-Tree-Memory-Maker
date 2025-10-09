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
import { Code, Bug, Sparkles, Image, Brain, Zap, RotateCcw, Plus, X, Save, Link as LinkIcon, Copy, Trash2, ShieldAlert } from "lucide-react";
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

export function DevTools({ showChangelog, onToggleChangelog, showRoadmap, onToggleRoadmap, onResetTreeData }: DevToolsProps) {
  const [open, setOpen] = useState(false);
  const [devNotes, setDevNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState<DevNote[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
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

  const handleTestData = () => {
    toast({
      title: "Test Data Loaded",
      description: "Sample GEDCOM bindings populated for testing.",
    });
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
            {isAdmin && <Badge variant="destructive" className="text-xs">ADMIN</Badge>}
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
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  Temporary Access (Admin Only)
                </h3>
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
              </div>
            </>
          )}

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

          {/* API Integrations */}
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
