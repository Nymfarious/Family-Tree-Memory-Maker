import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ChevronDown, 
  LogOut, 
  Trash2, 
  Info, 
  Heart, 
  Code, 
  Wrench,
  Globe,
  User
} from "lucide-react";

const APP_VERSION = "1.0.0";

export default function Settings() {
  const navigate = useNavigate();
  const { user, isDevMode, setDevMode, signOut } = useAuth();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [devOptionsOpen, setDevOptionsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const handleClearLocalStorage = () => {
    const confirmed = window.confirm(
      "This will clear all local data including saved trees and preferences. Continue?"
    );
    if (confirmed) {
      localStorage.clear();
      toast.success("Local storage cleared");
      navigate("/");
    }
  };

  const handleToggleDevMode = () => {
    setDevMode(!isDevMode);
    toast.success(isDevMode ? "Dev mode disabled" : "Dev mode enabled");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              App Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Version</span>
              <Badge variant="secondary">{APP_VERSION}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
              </span>
              <span>English</span>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>
              {user ? "Manage your account settings" : "Not signed in"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  {isDevMode ? "Running in dev mode (no auth)" : "Sign in to sync your data"}
                </p>
                {!isDevMode && (
                  <Button onClick={() => navigate("/auth")}>Sign In</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Special Thanks / Credits */}
        <Collapsible open={creditsOpen} onOpenChange={setCreditsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Special Thanks & Credits
                  </span>
                  <ChevronDown 
                    className={`h-5 w-5 transition-transform ${creditsOpen ? "rotate-180" : ""}`} 
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* Built with assistance from */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                    Built with assistance from
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Claude (Anthropic)</li>
                    <li>• Lovable</li>
                  </ul>
                </div>

                <Separator />

                {/* Powered by */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                    Powered by
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Supabase (Auth & Database)</li>
                    <li>• ElevenLabs (Text-to-Speech)</li>
                    <li>• Google GenAI</li>
                    <li>• Cloudflare Turnstile</li>
                  </ul>
                </div>

                <Separator />

                {/* Open Source Libraries */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                    Open Source Libraries
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "React", "Vite", "TypeScript", "Tailwind CSS", 
                      "shadcn/ui", "React Flow", "date-fns", "Lucide Icons",
                      "React Query", "React Router"
                    ].map((lib) => (
                      <Badge key={lib} variant="outline" className="text-xs">
                        {lib}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Developer Options */}
        <Collapsible open={devOptionsOpen} onOpenChange={setDevOptionsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Developer Options
                  </span>
                  <ChevronDown 
                    className={`h-5 w-5 transition-transform ${devOptionsOpen ? "rotate-180" : ""}`} 
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Auth State */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Auth State</span>
                  <Badge variant={user ? "default" : isDevMode ? "secondary" : "destructive"}>
                    {user ? "Authenticated" : isDevMode ? "Dev Mode" : "Not Authenticated"}
                  </Badge>
                </div>

                {/* Dev Mode Indicator */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Dev Mode
                  </span>
                  <Button 
                    variant={isDevMode ? "destructive" : "outline"} 
                    size="sm"
                    onClick={handleToggleDevMode}
                  >
                    {isDevMode ? "Disable" : "Enable"}
                  </Button>
                </div>

                {isDevMode && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      ⚠️ Dev mode is active. Authentication is bypassed.
                    </p>
                  </div>
                )}

                <Separator />

                {/* Version Info */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Build Version</span>
                  <span className="font-mono text-xs">{APP_VERSION}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Environment</span>
                  <Badge variant="outline">
                    {import.meta.env.DEV ? "Development" : "Production"}
                  </Badge>
                </div>

                <Separator />

                {/* Clear Local Storage */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleClearLocalStorage}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Local Storage
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </main>
    </div>
  );
}
