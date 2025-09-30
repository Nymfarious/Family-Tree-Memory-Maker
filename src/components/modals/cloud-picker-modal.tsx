import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CloudProvider } from "@/types/gedcom";
import { Cloud, Database, HardDrive, Folder } from "lucide-react";

interface CloudPickerModalProps {
  open: boolean;
  onClose: () => void;
  onChoose: (provider: CloudProvider) => void;
}

const providers = [
  { 
    id: "generic" as const, 
    name: "Cloud Storage",
    icon: Cloud,
    color: "text-blue-400"
  },
  { 
    id: "supabase" as const, 
    name: "Supabase",
    icon: Database,
    color: "text-green-400"
  },
  { 
    id: "drive" as const, 
    name: "Google Drive",
    icon: HardDrive,
    color: "text-yellow-400"
  },
  { 
    id: "dropbox" as const, 
    name: "Dropbox",
    icon: Folder,
    color: "text-cyan-400"
  },
];

export function CloudPickerModal({ open, onClose, onChoose }: CloudPickerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Save to Cloud</DialogTitle>
          <DialogDescription>
            Select a storage provider
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center gap-4 py-6">
          {providers.map((provider) => {
            const Icon = provider.icon;
            return (
              <Button
                key={provider.id}
                variant="ghost"
                size="icon"
                onClick={() => onChoose(provider.id)}
                className="h-16 w-16 flex-col gap-2 hover:bg-accent/10"
                title={provider.name}
              >
                <Icon className={`h-8 w-8 ${provider.color}`} />
                <span className="text-xs text-muted-foreground">{provider.name}</span>
              </Button>
            );
          })}
        </div>
        
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}