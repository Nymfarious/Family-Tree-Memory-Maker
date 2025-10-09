import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Cloudflare Turnstile widget type
declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("signin");
  const turnstileSignupRef = useRef<HTMLDivElement>(null);
  const turnstileSigninRef = useRef<HTMLDivElement>(null);
  const turnstileMagicRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIds = useRef<{ signup?: string; signin?: string; magic?: string }>({});

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        navigate("/");
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load Turnstile script
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup widgets on unmount
      if (window.turnstile) {
        Object.values(turnstileWidgetIds.current).forEach(id => {
          if (id) window.turnstile?.remove(id);
        });
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Render Turnstile widgets when tabs change
  const renderTurnstile = (ref: HTMLDivElement, widgetKey: 'signup' | 'signin' | 'magic') => {
    if (!window.turnstile || !TURNSTILE_SITE_KEY || !ref) return;

    // Remove existing widget if present
    if (turnstileWidgetIds.current[widgetKey]) {
      window.turnstile.remove(turnstileWidgetIds.current[widgetKey]!);
    }

    // Render new widget
    try {
      const widgetId = window.turnstile.render(ref, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          setTurnstileToken(token);
        },
        'error-callback': () => {
          setTurnstileToken('');
          toast.error('Bot protection verification failed');
        },
        'expired-callback': () => {
          setTurnstileToken('');
        },
        theme: 'auto',
      });
      turnstileWidgetIds.current[widgetKey] = widgetId;
    } catch (error) {
      console.error('Turnstile render error:', error);
    }
  };

  // Render Turnstile widget only for the active tab
  useEffect(() => {
    if (!window.turnstile || !TURNSTILE_SITE_KEY) return;

    // Small delay to ensure DOM elements are ready after tab switch
    const timer = setTimeout(() => {
      // Only render widget for the active tab
      if (activeTab === "signup" && turnstileSignupRef.current && !turnstileWidgetIds.current.signup) {
        renderTurnstile(turnstileSignupRef.current, 'signup');
      } else if (activeTab === "signin" && turnstileSigninRef.current && !turnstileWidgetIds.current.signin) {
        renderTurnstile(turnstileSigninRef.current, 'signin');
      } else if (activeTab === "magic" && turnstileMagicRef.current && !turnstileWidgetIds.current.magic) {
        renderTurnstile(turnstileMagicRef.current, 'magic');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeTab, turnstileSignupRef.current, turnstileSigninRef.current, turnstileMagicRef.current]);

  const verifyTurnstile = async (token: string): Promise<boolean> => {
    if (!TURNSTILE_SITE_KEY) return true; // Skip if Turnstile not configured

    try {
      const response = await supabase.functions.invoke('verify-turnstile', {
        body: { token },
      });

      if (response.error) {
        console.error('Turnstile verification error:', response.error);
        return false;
      }

      return response.data?.success === true;
    } catch (error) {
      console.error('Turnstile verification failed:', error);
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify Turnstile if configured
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        toast.error('Please complete the bot protection check');
        setLoading(false);
        return;
      }

      if (TURNSTILE_SITE_KEY) {
        const isValid = await verifyTurnstile(turnstileToken);
        if (!isValid) {
          toast.error('Bot protection verification failed. Please try again.');
          setTurnstileToken('');
          if (window.turnstile && turnstileWidgetIds.current.signup) {
            window.turnstile.reset(turnstileWidgetIds.current.signup);
          }
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
      toast.success("Account created! You can now sign in.");
      setEmail("");
      setPassword("");
      setTurnstileToken('');
    } catch (error: any) {
      toast.error(error.message || "Error signing up");
      setTurnstileToken('');
      if (TURNSTILE_SITE_KEY && window.turnstile && turnstileWidgetIds.current.signup) {
        window.turnstile.reset(turnstileWidgetIds.current.signup);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify Turnstile if configured
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        toast.error('Please complete the bot protection check');
        setLoading(false);
        return;
      }

      if (TURNSTILE_SITE_KEY) {
        const isValid = await verifyTurnstile(turnstileToken);
        if (!isValid) {
          toast.error('Bot protection verification failed. Please try again.');
          setTurnstileToken('');
          if (window.turnstile && turnstileWidgetIds.current.signin) {
            window.turnstile.reset(turnstileWidgetIds.current.signin);
          }
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error signing in");
      setTurnstileToken('');
      if (TURNSTILE_SITE_KEY && window.turnstile && turnstileWidgetIds.current.signin) {
        window.turnstile.reset(turnstileWidgetIds.current.signin);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify Turnstile if configured
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        toast.error('Please complete the bot protection check');
        setLoading(false);
        return;
      }

      if (TURNSTILE_SITE_KEY) {
        const isValid = await verifyTurnstile(turnstileToken);
        if (!isValid) {
          toast.error('Bot protection verification failed. Please try again.');
          setTurnstileToken('');
          if (window.turnstile && turnstileWidgetIds.current.magic) {
            window.turnstile.reset(turnstileWidgetIds.current.magic);
          }
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
      toast.success("Magic link sent! Check your email.");
      setEmail("");
      setTurnstileToken('');
    } catch (error: any) {
      toast.error(error.message || "Error sending magic link");
      setTurnstileToken('');
      if (TURNSTILE_SITE_KEY && window.turnstile && turnstileWidgetIds.current.magic) {
        window.turnstile.reset(turnstileWidgetIds.current.magic);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
      setResetEmail("");
      setResetDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error sending reset link");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Family Tree App</CardTitle>
          <CardDescription className="text-center">
            Sign in or create an account to manage your family trees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="magic">Magic Link</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" size="sm" className="px-0 h-auto text-xs">
                          Forgot password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Password</DialogTitle>
                          <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="you@example.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                {TURNSTILE_SITE_KEY && (
                  <div className="flex justify-center">
                    <div ref={turnstileSigninRef} />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading || (TURNSTILE_SITE_KEY && !turnstileToken)}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 characters
                  </p>
                </div>
                {TURNSTILE_SITE_KEY && (
                  <div className="flex justify-center">
                    <div ref={turnstileSignupRef} />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading || (TURNSTILE_SITE_KEY && !turnstileToken)}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="magic">
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send you a magic link to sign in without a password
                  </p>
                </div>
                {TURNSTILE_SITE_KEY && (
                  <div className="flex justify-center">
                    <div ref={turnstileMagicRef} />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading || (TURNSTILE_SITE_KEY && !turnstileToken)}>
                  {loading ? "Sending..." : "Send Magic Link"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
