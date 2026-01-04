import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Person } from "@/types/gedcom";
import { useState, useEffect } from "react";

interface PersonCardProps {
  pid: string;
  people: Record<string, Person>;
  childToParents: Record<string, string[]>;
  onFocus?: (pid: string) => void;
  className?: string;
  showPin?: boolean;
}

interface CardDisplayPreferences {
  showBirth: boolean;
  showDeath: boolean;
  showNickname: boolean;
  showMaidenName: boolean;
  showOccupation: boolean;
}

const DEFAULT_PREFERENCES: CardDisplayPreferences = {
  showBirth: true,
  showDeath: true,
  showNickname: false,
  showMaidenName: false,
  showOccupation: true,
};

export function PersonCard({ pid, people, childToParents, onFocus, className, showPin = false }: PersonCardProps) {
  const person = people[pid];
  const [isPinned, setIsPinned] = useState(false);
  const [preferences, setPreferences] = useState<CardDisplayPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const saved = localStorage.getItem('card-display-preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

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

  // Check if person is maternal line (for maiden name display)
  const isMaternalLine = parents.some(parentId => {
    const parent = people[parentId];
    return parent?.sex?.toLowerCase() === 'f' || parent?.sex?.toLowerCase() === 'female';
  });

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg group relative",
        "border border-border bg-card",
        isPinned && "ring-2 ring-primary",
        className
      )}
      tabIndex={0}
      onClick={() => onFocus?.(pid)}
    >
      {showPin && (
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "absolute -top-2 -left-2 h-6 w-6 rounded-full z-10",
            isPinned ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted hover:bg-muted/80"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsPinned(!isPinned);
          }}
        >
          <Pin className={cn("h-3 w-3", isPinned && "fill-current")} />
        </Button>
      )}

      <CardContent className="p-4">
        <div className="space-y-2.5">
          {/* Name and Nickname */}
          <div>
            <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {person.name || pid}
            </h3>
            {preferences.showNickname && person.nickname && (
              <p className="text-xs text-muted-foreground italic">"{person.nickname}"</p>
            )}
          </div>
          
          {/* Sex and Surname/Maiden Name */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getSexColor(sex)}>
              {person.sex || "?"}
            </Badge>
            {person.surname && (
              <Badge variant="secondary">
                {person.surname}
              </Badge>
            )}
            {preferences.showMaidenName && person.maidenName && isMaternalLine && (
              <Badge variant="outline" className="border-genealogy-female/50">
                née {person.maidenName}
              </Badge>
            )}
          </div>

          {/* Birth and Death Information */}
          {(preferences.showBirth || preferences.showDeath) && (person.birth || person.death || person.birthPlace || person.deathPlace) && (
            <div className="text-xs text-muted-foreground space-y-1">
              {preferences.showBirth && (person.birth || person.birthPlace) && (
                <div>
                  <span className="font-medium">Born:</span> {person.birth}
                  {person.birthPlace && <span className="block ml-11 text-[10px]">{person.birthPlace}</span>}
                </div>
              )}
              {preferences.showDeath && (person.death || person.deathPlace) && (
                <div>
                  <span className="font-medium">Died:</span> {person.death}
                  {person.deathPlace && <span className="block ml-11 text-[10px]">{person.deathPlace}</span>}
                </div>
              )}
            </div>
          )}

          {/* Occupation */}
          {preferences.showOccupation && person.occupation && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Occupation:</span> {person.occupation}
            </div>
          )}

          {/* Second Wife Placeholder */}
          {person.fams && person.fams.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs w-full"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              View Spouse 2
            </Button>
          )}

          {/* Parents */}
          {parents.length > 0 && (
            <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              <span className="font-medium">Parents: </span>
              {parents.map((parentId, index) => (
                <span key={parentId}>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary hover:text-primary/80"
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
