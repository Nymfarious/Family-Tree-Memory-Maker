import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * AUTH STUB: Authentication temporarily bypassed for development.
 * TODO: Re-enable auth by uncommenting the original implementation below.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Bypass all auth - just render children directly
  return <>{children}</>;
}

/* ORIGINAL IMPLEMENTATION - Uncomment to re-enable auth:
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isDevMode } = useAuth();

  // Check dev mode FIRST - skip auth if dev mode is active
  if (isDevMode) {
    return <>{children}</>;
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
*/
