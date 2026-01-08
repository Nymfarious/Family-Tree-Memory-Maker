import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const DEV_MODE_KEY = "static-karma-dev-mode";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean; // NEW: Track if auth has been initialized
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDevMode, setIsDevMode] = useState(() => 
    localStorage.getItem(DEV_MODE_KEY) === "true"
  );
  
  // Use ref to prevent race conditions
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get the current session first
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event);
        
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // Only set loading to false if we haven't initialized yet
          if (!isInitialized) {
            setIsLoading(false);
            setIsInitialized(true);
          }
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    const redirectBase = import.meta.env.PROD ? "/Family-Tree-Memory-Maker" : "";
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectBase}/`,
        },
      });
      return { error: error as Error | null };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      // Clear dev mode on sign out
      localStorage.removeItem(DEV_MODE_KEY);
      setIsDevMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setDevModeValue = (enabled: boolean) => {
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
        isInitialized,
        isDevMode,
        signIn,
        signUp,
        signOut,
        setDevMode: setDevModeValue,
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
