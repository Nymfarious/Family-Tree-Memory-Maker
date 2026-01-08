import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, StickyNote, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Person } from "@/types/gedcom";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PersonCardProps {
  pid: string;
  people: Record<string, Person>;
  childToParents: Record<string, string[]>;
  onFocus?: (pid: string) => void;
  onNotesClick?: (pid: string) => void;
  className?: string;
  showPin?: boolean;
  compact?: boolean; // New prop for compact mode
}

interface CardDisplayPreferences {
  showBirth: boolean;
  showDeath: boolean;
  showNickname: boolean;
  showMaidenName: boolean;
  showOccupation: boolean;
  compactMode: boolean; // New preference
}

const DEFAULT_PREFERENCES: CardDisplayPreferences = {
  showBirth: true,
  showDeath: true,
  showNickname: false,
  showMaidenName: false,
  showOccupation: true,
  compactMode: false,
};

export function PersonCard({ 
  pid, 
  people, 
  childToParents, 
  onFocus, 
  onNotesClick,
  className, 
  showPin = false,
  compact: compactProp 
}: PersonCardProps) {
  const person = people[pid];
  const [isPinned, setIsPinned] = useState(false);
  const [preferences, setPreferences] = useState<CardDisplayPreferences>(DEFAULT_PREFERENCES);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('card-display-preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  if (!person) return null;

  // Use prop if provided, otherwise use saved preference
  const isCompact = compactProp !== undefined ? compactProp : preferences.compactMode;

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

  // Extract year from date string
  const extractYear = (date?: string) => {
    if (!date) return null;
    const match = date.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
    return match ? match[1] : null;
  };

  const birthYear = extractYear(person.birth);
  const deathYear = extractYear(person.death);
  const yearsDisplay = birthYear 
    ? deathYear 
      ? `${birthYear}–${deathYear}`
      : `b. ${birthYear}`
    : deathYear 
      ? `d. ${deathYear}`
      : null;

  // Check if person has notes
  const hasNotes = person.notes && person.notes.length > 0;

  // Check if person is maternal line (for maiden name display)
  const isMaternalLine = parents.some(parentId => {
    const parent = people[parentId];
    return parent?.sex?.toLowerCase() === 'f' || parent?.sex?.toLowerCase() === 'female';
  });

  // =========================================================================
  // COMPACT VIEW
  // =========================================================================
  if (isCompact && !isExpanded) {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md group relative",
          "border border-border bg-card",
          isPinned && "ring-2 ring-primary",
          className
        )}
        tabIndex={0}
        onClick={() => onFocus?.(pid)}
      >
        {/* Pin button */}
        {showPin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "absolute -top-2 -left-2 h-5 w-5 rounded-full z-10",
                  isPinned ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted hover:bg-muted/80"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPinned(!isPinned);
                }}
              >
                <Pin className={cn("h-2.5 w-2.5", isPinned && "fill-current")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPinned ? "Unpin person" : "Pin person"}</TooltipContent>
          </Tooltip>
        )}

        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            {/* Sex indicator */}
            <div className={cn("w-2 h-full rounded-full flex-shrink-0", getSexColor(sex).replace('text-white', ''))} />
            
            {/* Name and years */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {person.name || pid}
                </span>
                {hasNotes && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNotesClick?.(pid);
                        }}
                      >
                        <StickyNote className="h-3 w-3 text-yellow-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View notes</TooltipContent>
                  </Tooltip>
                )}
              </div>
              {yearsDisplay && (
                <span className="text-xs text-muted-foreground">{yearsDisplay}</span>
              )}
            </div>

            {/* Expand button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show details</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    );
  }

  // =========================================================================
  // FULL VIEW (existing layout with minor enhancements)
  // =========================================================================
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
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>{isPinned ? "Unpin person" : "Pin person"}</TooltipContent>
        </Tooltip>
      )}

      {/* Collapse button (only in compact mode when expanded) */}
      {isCompact && isExpanded && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10 bg-muted hover:bg-muted/80"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Collapse</TooltipContent>
        </Tooltip>
      )}

      <CardContent className="p-4">
        <div className="space-y-2.5">
          {/* Name and Nickname */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {person.name || pid}
              </h3>
              {preferences.showNickname && person.nickname && (
                <p className="text-xs text-muted-foreground italic">"{person.nickname}"</p>
              )}
            </div>
            {/* Notes button */}
            {hasNotes && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNotesClick?.(pid);
                    }}
                  >
                    <StickyNote className="h-4 w-4 text-yellow-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View notes</TooltipContent>
              </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>This person had multiple spouses</TooltipContent>
            </Tooltip>
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
