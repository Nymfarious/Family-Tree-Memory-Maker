import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Code, Bug } from "lucide-react";

interface DevToolsProps {
  showChangelog: boolean;
  onToggleChangelog: () => void;
}

export function DevTools({ showChangelog, onToggleChangelog }: DevToolsProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="fixed top-4 left-4 h-8 w-8 opacity-30 hover:opacity-100 transition-opacity z-50"
          title="Developer Tools"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-warning"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z"
              fill="currentColor"
              opacity="0.6"
            />
            <path
              d="M7 8C7 8 5 10 5 12C5 14 7 16 7 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M17 8C17 8 19 10 19 12C19 14 17 16 17 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-warning" />
            Developer Tools
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* UI Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Code className="h-4 w-4" />
              UI Controls
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <span className="text-sm">Show Changelog Button</span>
                <Button
                  size="sm"
                  variant={showChangelog ? "default" : "outline"}
                  onClick={onToggleChangelog}
                >
                  {showChangelog ? "ON" : "OFF"}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dev Notes */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Developer Notes</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-warning/30 bg-warning/5">
                <div className="font-semibold text-sm mb-1">✓ Stable UUIDs Implemented</div>
                <p className="text-xs text-muted-foreground">
                  Each person now has a stable UUID generated from their GEDCOM ID. This allows you to attach photos, stories, and AI summaries to specific people.
                </p>
              </div>
              
              <div className="p-3 rounded-lg border border-accent/30 bg-accent/5">
                <div className="font-semibold text-sm mb-1">Idea: Focus mode</div>
                <p className="text-xs text-muted-foreground">
                  When you click a person, filter the tree to their ancestors/descendants; add breadcrumbs to pop back.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* API Integration Tracking */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">API Integrations</h3>
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-3">
                Track APIs as they're added to the project. Lovable Cloud is not yet enabled.
              </p>
              
              <div className="space-y-2">
                <div className="text-xs">
                  <Badge variant="outline" className="mr-2">None</Badge>
                  <span className="text-muted-foreground">No APIs configured yet</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                To track APIs, you can manually add them here or enable Lovable Cloud to access Supabase secrets.
              </p>
            </div>
          </div>

          <Separator />

          {/* Component Tracking */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Active Components</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-muted/20">
                <span>FamilyTreeApp</span>
                <Badge variant="secondary" className="text-xs">Main</Badge>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/20">
                <span>TreeList</span>
                <Badge variant="secondary" className="text-xs">View</Badge>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/20">
                <span>CircularTreeView</span>
                <Badge variant="secondary" className="text-xs">View</Badge>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/20">
                <span>GedcomParser</span>
                <Badge variant="secondary" className="text-xs">Util</Badge>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
