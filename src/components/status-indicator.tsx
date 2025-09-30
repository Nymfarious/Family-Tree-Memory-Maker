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

  const ringSize = size === 'sm' ? 'ring-[0.5px]' : size === 'md' ? 'ring-1' : 'ring-2';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5">
        <div className={cn(
          "rounded-full", 
          sizeClasses[size], 
          getStatusColor("not-configured"),
          status === "not-configured" ? `${ringSize} ring-offset-1 ring-offset-background ring-destructive` : "opacity-30"
        )} />
        <div className={cn(
          "rounded-full", 
          sizeClasses[size], 
          getStatusColor("configured"),
          status === "configured" ? `${ringSize} ring-offset-1 ring-offset-background ring-warning` : "opacity-30"
        )} />
        <div className={cn(
          "rounded-full", 
          sizeClasses[size], 
          getStatusColor("tested"),
          status === "tested" ? `${ringSize} ring-offset-1 ring-offset-background ring-yellow-500` : "opacity-30"
        )} />
        <div className={cn(
          "rounded-full", 
          sizeClasses[size], 
          getStatusColor("working"),
          status === "working" ? `${ringSize} ring-offset-1 ring-offset-background ring-green-500` : "opacity-30"
        )} />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {getStatusLabel(status)}
        </span>
      )}
    </div>
  );
}
