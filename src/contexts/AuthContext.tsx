import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const DEV_MODE_KEY = "static-karma-dev-mode";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDevMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setDevMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(() => 
    localStorage.getItem(DEV_MODE_KEY) === "true"
  );

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectBase = import.meta.env.PROD ? "/Family-Tree-Memory-Maker" : "";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectBase}/`,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear dev mode on sign out
    localStorage.removeItem(DEV_MODE_KEY);
    setIsDevMode(false);
  };

  const setDevMode = (enabled: boolean) => {
    if (enabled) {
      localStorage.setItem(DEV_MODE_KEY, "true");
    } else {
      localStorage.removeItem(DEV_MODE_KEY);
    }
    setIsDevMode(enabled);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isDevMode,
        signIn,
        signUp,
        signOut,
        setDevMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
