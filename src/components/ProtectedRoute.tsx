import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isDevMode } = useAuth();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  // Add a small delay to prevent flash/blip when navigating between protected routes
  useEffect(() => {
    // If we're in dev mode or already have a user, we're ready immediately
    if (isDevMode || user) {
      setIsReady(true);
      return;
    }

    // If still loading, wait
    if (isLoading) {
      return;
    }

    // Auth check is done and no user - we're ready to redirect
    setIsReady(true);
  }, [isDevMode, user, isLoading]);

  // Check dev mode FIRST - skip auth if dev mode is active
  if (isDevMode) {
    return <>{children}</>;
  }

  // Show loading state while checking auth OR while preparing to render
  // This prevents the "blip" by ensuring we don't flash content before redirect
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isLoading ? "Checking authentication..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  // Save the attempted location so we can redirect back after login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
