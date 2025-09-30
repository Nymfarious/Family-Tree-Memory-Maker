import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { StatusIndicator } from "./status-indicator";

interface Task {
  title: string;
  status: "done" | "in-progress" | "todo";
  priority?: "high" | "medium" | "low";
}

const tasks: Task[] = [
  { title: "Import GEDCOM with file type filtering", status: "done", priority: "high" },
  { title: "ZIP file decompression support", status: "done", priority: "high" },
  { title: "File rename prompt on import", status: "done", priority: "high" },
  { title: "Multiple file selection from ZIP", status: "done", priority: "medium" },
  { title: "Generation selection (3-7)", status: "done", priority: "medium" },
  { title: "Ready-Set-Go status indicators", status: "done", priority: "high" },
  { title: "API integration toggles in Dev Tools", status: "done", priority: "medium" },
  { title: "AI-powered dev notes with summarization", status: "done", priority: "medium" },
  { title: "Development Roadmap toggle button", status: "done", priority: "medium" },
  { title: "RSG indicators in Roadmap", status: "done", priority: "low" },
  { title: "Dev Tools reset confirmation", status: "done", priority: "low" },
  { title: "Dev Tools save/close buttons", status: "done", priority: "low" },
  { title: "Reset clears GEDCOM tree data", status: "done", priority: "high" },
  { title: "Circular View - Person selector", status: "done", priority: "high" },
  { title: "Circular View - Lineage filtering (maternal/paternal/both)", status: "done", priority: "high" },
  { title: "Replicate API integration", status: "in-progress", priority: "high" },
  { title: "Google AI integration", status: "in-progress", priority: "high" },
  { title: "Hugging Face integration", status: "in-progress", priority: "medium" },
  { title: "Ancestry.com proprietary format support", status: "todo", priority: "low" },
  { title: "Export to PDF/Image", status: "todo", priority: "low" },
];

export function TaskList() {
  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "todo":
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: Task["status"]) => {
    switch (status) {
      case "done":
        return "Done";
      case "in-progress":
        return "In Progress";
      case "todo":
        return "To Do";
    }
  };

  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Development Roadmap</span>
            <StatusIndicator status="working" size="sm" />
          </div>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="bg-green-500/10">
              {statusCounts.done || 0} Done
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/10">
              {statusCounts["in-progress"] || 0} In Progress
            </Badge>
            <Badge variant="outline" className="bg-muted">
              {statusCounts.todo || 0} To Do
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              {getStatusIcon(task.status)}
              <span className="flex-1 text-sm">{task.title}</span>
              {task.priority && (
                <Badge 
                  variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {task.priority}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {getStatusLabel(task.status)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
