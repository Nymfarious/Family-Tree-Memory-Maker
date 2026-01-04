import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { ChangeLogEntry } from "@/types/gedcom";

interface ChangeLogDrawerProps {
  open: boolean;
  onClose: () => void;
  entries: ChangeLogEntry[];
}

export function ChangeLogDrawer({ open, onClose, entries }: ChangeLogDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Change Log</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <ol className="space-y-4">
            {entries.map((entry, index) => (
              <li key={index} className="border-l-2 border-tree-line pl-4 pb-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-card-foreground">{entry.title}</h4>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {entry.when} · {entry.author}
                </div>
                {entry.detail && (
                  <div className="text-sm text-card-foreground mt-2">{entry.detail}</div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </SheetContent>
    </Sheet>
  );
}