import { cn } from "@/lib/utils";

interface DevNoteProps {
  type?: "question" | "idea";
  title: string;
  note?: string;
  className?: string;
}

export function DevNote({ type = "question", title, note, className }: DevNoteProps) {
  const isQuestion = type === "question";
  
  return (
    <div 
      className={cn(
        "rounded-lg border-l-4 bg-card p-4 shadow-sm",
        isQuestion ? "border-l-destructive" : "border-l-warning",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div 
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold",
            isQuestion ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"
          )}
          aria-hidden="true"
        >
          {isQuestion ? "?" : "💡"}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-card-foreground">{title}</div>
          {note && <div className="mt-1 text-sm text-muted-foreground">{note}</div>}
        </div>
      </div>
    </div>
  );
}