import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CloudStorage } from "@/utils/cloudStorage";
import { useToast } from "@/hooks/use-toast";

export default function DropboxCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    const result = CloudStorage.parseOAuthCallback(hash);

    if (result && result.provider === 'dropbox') {
      localStorage.setItem('dropbox_access_token', result.accessToken);
      toast({
        title: "✅ Connected to Dropbox",
        description: "Your Dropbox account has been connected successfully.",
      });
      navigate('/');
    } else {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Dropbox. Please try again.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Connecting to Dropbox...</p>
      </div>
    </div>
  );
}
