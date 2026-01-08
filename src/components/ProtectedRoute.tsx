import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isInitialized, isDevMode } = useAuth();
  const location = useLocation();

  // Dev mode bypasses all auth checks
  if (isDevMode) {
    return <>{children}</>;
  }

  // Show loading UNTIL auth is fully initialized
  // This prevents the "blip" where content flashes before redirect
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {!isInitialized ? "Initializing..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Auth is initialized and not loading - check if user exists
  if (!user) {
    // Save the attempted location for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated - render the protected content
  return <>{children}</>;
}
