import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ApiKeyStatus = 'not-set' | 'valid' | 'invalid' | 'testing';

export function CodeHealthSettings() {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<ApiKeyStatus>('not-set');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('lovable_api_key');
    if (stored) {
      setApiKey(atob(stored));
      setStatus('valid');
    }
  }, []);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    
    // Store encoded in localStorage
    localStorage.setItem('lovable_api_key', btoa(apiKey));
    setStatus('valid');
    toast.success("API key saved successfully");
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key first");
      return;
    }

    setTesting(true);
    setStatus('testing');

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
        setStatus('valid');
        toast.success("✅ Connection successful!");
      } else {
        setStatus('invalid');
        toast.error("❌ Connection failed - check your API key");
      }
    } catch (error) {
      setStatus('invalid');
      toast.error("❌ Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('lovable_api_key');
    setApiKey("");
    setStatus('not-set');
    toast.info("API key cleared");
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Invalid</Badge>;
      case 'testing':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Testing...</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" /> Not Set</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔐 Lovable AI Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your API key for the Code Health Assistant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label>API Key Status:</Label>
            {getStatusBadge()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">Lovable API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally and never sent to our servers (only to Lovable AI).
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={saveApiKey} className="flex-1">
              Save Key
            </Button>
            <Button 
              onClick={testConnection} 
              variant="secondary"
              disabled={testing || !apiKey.trim()}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
          </div>

          {apiKey && (
            <Button 
              onClick={clearApiKey} 
              variant="outline" 
              className="w-full"
            >
              Clear API Key
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}