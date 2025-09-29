import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Person } from "@/types/gedcom";

interface PersonCardProps {
  pid: string;
  people: Record<string, Person>;
  childToParents: Record<string, string[]>;
  onFocus?: (pid: string) => void;
  className?: string;
}

export function PersonCard({ pid, people, childToParents, onFocus, className }: PersonCardProps) {
  const person = people[pid];
  if (!person) return null;

  const parents = childToParents[pid] || [];
  const sex = person.sex?.toLowerCase();

  const getSexColor = (sex?: string) => {
    switch (sex) {
      case 'm':
      case 'male':
        return "bg-genealogy-male text-white";
      case 'f':
      case 'female':
        return "bg-genealogy-female text-white";
      default:
        return "bg-genealogy-unknown text-white";
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-card group",
        "border border-border bg-gradient-card",
        className
      )}
      tabIndex={0}
      onClick={() => onFocus?.(pid)}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {person.name || pid}
          </h3>
          
          <div className="flex gap-2">
            <Badge className={getSexColor(sex)}>
              {person.sex || "?"}
            </Badge>
            {person.surname && (
              <Badge variant="secondary">
                {person.surname}
              </Badge>
            )}
          </div>

          {parents.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Parents: </span>
              {parents.map((parentId, index) => (
                <span key={parentId}>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-sm text-primary hover:text-primary/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocus?.(parentId);
                    }}
                  >
                    {people[parentId]?.name || parentId}
                  </Button>
                  {index < parents.length - 1 && ", "}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}