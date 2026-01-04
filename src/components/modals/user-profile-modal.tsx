import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Plus, X, Upload, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export function UserProfileModal({ open, onClose }: UserProfileModalProps) {
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('user-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setName(profile.name || "");
      setBirthday(profile.birthday || "");
      setSocialLinks(profile.socialLinks || []);
      setAvatar(profile.avatar || null);
    }
  }, [open]);

  const handleSave = () => {
    const profile = {
      name,
      birthday,
      socialLinks,
      avatar,
    };
    localStorage.setItem('user-profile', JSON.stringify(profile));
    toast({
      title: "Profile Updated",
      description: "Profile settings have been saved.",
    });
    onClose();
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, {
      id: crypto.randomUUID(),
      platform: "",
      url: "",
    }]);
  };

  const removeSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter(link => link.id !== id));
  };

  const updateSocialLink = (id: string, field: 'platform' | 'url', value: string) => {
    setSocialLinks(socialLinks.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIAvatar = () => {
    toast({
      title: "AI Avatar Generation",
      description: "AI avatar creation coming soon...",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avatar Section */}
          <div className="space-y-3">
            <Label>Profile Avatar</Label>
            <div className="flex items-center gap-4">
              {avatar ? (
                <div className="relative">
                  <img 
                    src={avatar} 
                    alt="Avatar" 
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => setAvatar(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Upload className="h-3 w-3 mr-2" />
                    Upload
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={generateAIAvatar}
                >
                  <Sparkles className="h-3 w-3 mr-2" />
                  AI Generate
                </Button>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Birthday */}
          <div className="space-y-2">
            <Label htmlFor="profile-birthday">Birthday</Label>
            <Input
              id="profile-birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Social Links</Label>
              <Button 
                size="sm" 
                variant="outline"
                onClick={addSocialLink}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {socialLinks.map((link) => (
                <Card key={link.id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Platform (e.g., Twitter)"
                        value={link.platform}
                        onChange={(e) => updateSocialLink(link.id, 'platform', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeSocialLink(link.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => updateSocialLink(link.id, 'url', e.target.value)}
                    />
                  </CardContent>
                </Card>
              ))}
              {socialLinks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No social links added yet
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Profile</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}