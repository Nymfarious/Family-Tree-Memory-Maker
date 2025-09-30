import { cn } from "@/lib/utils";

type Status = "not-configured" | "configured" | "tested" | "working";

interface StatusIndicatorProps {
  status: Status;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({ status, size = "sm", showLabel = false, className }: StatusIndicatorProps) {
  const getStatusColor = (status: Status) => {
    switch (status) {
      case "not-configured":
        return "bg-status-red";
      case "configured":
        return "bg-status-orange";
      case "tested":
        return "bg-status-yellow";
      case "working":
        return "bg-status-green";
    }
  };

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case "not-configured":
        return "Not Configured";
      case "configured":
        return "Configured";
      case "tested":
        return "Tested";
      case "working":
        return "Working";
    }
  };

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <div className={cn("rounded-full", sizeClasses[size], getStatusColor("not-configured"))} />
        <div className={cn("rounded-full", sizeClasses[size], getStatusColor("configured"))} />
        <div className={cn("rounded-full", sizeClasses[size], getStatusColor("tested"))} />
        <div className={cn("rounded-full", sizeClasses[size], getStatusColor("working"))} />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {getStatusLabel(status)}
        </span>
      )}
    </div>
  );
}
