import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CloudProvider } from "@/types/gedcom";

interface CloudPickerModalProps {
  open: boolean;
  onClose: () => void;
  onChoose: (provider: CloudProvider) => void;
}

const providers = [
  { id: "generic" as const, name: "Generic Cloud (stub)" },
  { id: "supabase" as const, name: "Supabase (wire later)" },
  { id: "drive" as const, name: "Google Drive (API later)" },
  { id: "dropbox" as const, name: "Dropbox (API later)" },
];

export function CloudPickerModal({ open, onClose, onChoose }: CloudPickerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Cloud</DialogTitle>
          <DialogDescription>
            Select a provider (this is a stub you can swap for the real thing):
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              variant="outline"
              onClick={() => onChoose(provider.id)}
              className="justify-start"
            >
              {provider.name}
            </Button>
          ))}
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