import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Pin, StickyNote, ChevronDown, ChevronUp, MapPin, 
  Globe, Flag, Users, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Person } from "@/types/gedcom";
import { useState, useEffect, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PersonCardProps {
  pid: string;
  people: Record<string, Person>;
  childToParents: Record<string, string[]>;
  onFocus?: (pid: string) => void;
  onNotesClick?: (pid: string) => void;
  onLocationClick?: (location: string) => void;
  className?: string;
  showPin?: boolean;
  compact?: boolean;
  showLocationDetails?: boolean; // NEW: Show expandable location info
}

interface CardDisplayPreferences {
  showBirth: boolean;
  showDeath: boolean;
  showNickname: boolean;
  showMaidenName: boolean;
  showOccupation: boolean;
  compactMode: boolean;
}

const DEFAULT_PREFERENCES: CardDisplayPreferences = {
  showBirth: true,
  showDeath: true,
  showNickname: false,
  showMaidenName: false,
  showOccupation: true,
  compactMode: false,
};

// US state abbreviations for detection
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
  // Full names
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'District of Columbia'
]);

// Check if a location is in the US
function isUSLocation(location?: string): boolean {
  if (!location) return false;
  
  const parts = location.split(',').map(p => p.trim());
  
  // Check if "United States" or "USA" or "US" is in the location
  if (parts.some(p => /united states|usa|u\.s\.a\.|^us$/i.test(p))) {
    return true;
  }
  
  // Check if any part is a US state
  return parts.some(p => US_STATES.has(p));
}

// Get country from location string
function getCountry(location?: string): string | null {
  if (!location) return null;
  
  const parts = location.split(',').map(p => p.trim());
  const lastPart = parts[parts.length - 1];
  
  // Common patterns
  if (/united states|usa|u\.s\.a\.|^us$/i.test(lastPart)) return 'US';
  if (US_STATES.has(lastPart)) return 'US';
  if (/england|scotland|wales|ireland|uk|united kingdom|great britain/i.test(lastPart)) return 'UK';
  if (/germany|deutschland/i.test(lastPart)) return 'Germany';
  if (/france/i.test(lastPart)) return 'France';
  if (/canada/i.test(lastPart)) return 'Canada';
  if (/mexico/i.test(lastPart)) return 'Mexico';
  
  return lastPart.length > 2 ? lastPart : null;
}

export function PersonCard({ 
  pid, 
  people, 
  childToParents, 
  onFocus, 
  onNotesClick,
  onLocationClick,
  className, 
  showPin = false,
  compact: compactProp,
  showLocationDetails = false
}: PersonCardProps) {
  const person = people[pid];
  const [isPinned, setIsPinned] = useState(false);
  const [preferences, setPreferences] = useState<CardDisplayPreferences>(DEFAULT_PREFERENCES);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLocationExpanded, setShowLocationExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('card-display-preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  if (!person) return null;

  const isCompact = compactProp !== undefined ? compactProp : preferences.compactMode;
  const parents = childToParents[pid] || [];
  const sex = person.sex?.toLowerCase();

  // Location analysis
  const birthIsUS = isUSLocation(person.birthPlace);
  const deathIsUS = isUSLocation(person.deathPlace);
  const birthCountry = getCountry(person.birthPlace);
  const deathCountry = getCountry(person.deathPlace);

  // Find others at same location
  const othersAtBirthPlace = useMemo(() => {
    if (!person.birthPlace) return [];
    return Object.entries(people)
      .filter(([id, p]) => id !== pid && p.birthPlace === person.birthPlace)
      .map(([id, p]) => ({ id, name: p.name || 'Unknown' }))
      .slice(0, 5);
  }, [people, pid, person.birthPlace]);

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

  const hasNotes = person.notes && person.notes.length > 0;

  const isMaternalLine = parents.some(parentId => {
    const parent = people[parentId];
    return parent?.sex?.toLowerCase() === 'f' || parent?.sex?.toLowerCase() === 'female';
  });

  // Location badge component
  const LocationBadge = ({ isUS, country }: { isUS: boolean; country: string | null }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] h-4 px-1 gap-0.5",
            isUS 
              ? "border-blue-500/50 text-blue-600 dark:text-blue-400" 
              : "border-purple-500/50 text-purple-600 dark:text-purple-400"
          )}
        >
          {isUS ? (
            <>
              <Flag className="h-2.5 w-2.5" />
              US
            </>
          ) : (
            <>
              <Globe className="h-2.5 w-2.5" />
              {country || 'INT'}
            </>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {isUS ? 'United States' : country || 'International'}
      </TooltipContent>
    </Tooltip>
  );

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
            <TooltipContent>{isPinned ? "Unpin" : "Pin"}</TooltipContent>
          </Tooltip>
        )}

        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-8 rounded-full flex-shrink-0", getSexColor(sex).replace('text-white', ''))} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {person.name || pid}
                </span>
                {hasNotes && (
                  <StickyNote className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {yearsDisplay && (
                  <span className="text-xs text-muted-foreground">{yearsDisplay}</span>
                )}
                {person.birthPlace && <LocationBadge isUS={birthIsUS} country={birthCountry} />}
              </div>
            </div>

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
  // FULL VIEW
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
          <TooltipContent>{isPinned ? "Unpin" : "Pin"}</TooltipContent>
        </Tooltip>
      )}

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

          {/* Birth and Death Information with Location Indicators */}
          {(preferences.showBirth || preferences.showDeath) && (person.birth || person.death || person.birthPlace || person.deathPlace) && (
            <div className="text-xs text-muted-foreground space-y-1">
              {preferences.showBirth && (person.birth || person.birthPlace) && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Born:</span> 
                    <span>{person.birth}</span>
                    {person.birthPlace && <LocationBadge isUS={birthIsUS} country={birthCountry} />}
                  </div>
                  {person.birthPlace && (
                    <Collapsible 
                      open={showLocationExpanded && showLocationDetails}
                      onOpenChange={() => showLocationDetails && setShowLocationExpanded(!showLocationExpanded)}
                    >
                      <CollapsibleTrigger asChild>
                        <button 
                          className="flex items-center gap-1 ml-11 text-[10px] text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (showLocationDetails) {
                              setShowLocationExpanded(!showLocationExpanded);
                            } else {
                              onLocationClick?.(person.birthPlace!);
                            }
                          }}
                        >
                          <MapPin className="h-3 w-3" />
                          {person.birthPlace}
                          {showLocationDetails && (
                            showLocationExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      
                      {showLocationDetails && (
                        <CollapsibleContent>
                          <div className="ml-11 mt-1 p-2 rounded bg-muted/50 space-y-1">
                            {othersAtBirthPlace.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px]">
                                <Users className="h-3 w-3" />
                                <span>{othersAtBirthPlace.length} others born here:</span>
                              </div>
                            )}
                            {othersAtBirthPlace.map(other => (
                              <button
                                key={other.id}
                                className="block text-[10px] text-primary hover:underline ml-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFocus?.(other.id);
                                }}
                              >
                                {other.name}
                              </button>
                            ))}
                            {othersAtBirthPlace.length === 0 && (
                              <p className="text-[10px] text-muted-foreground">Only person born at this location</p>
                            )}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  )}
                </div>
              )}
              {preferences.showDeath && (person.death || person.deathPlace) && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Died:</span>
                    <span>{person.death}</span>
                    {person.deathPlace && <LocationBadge isUS={deathIsUS} country={deathCountry} />}
                  </div>
                  {person.deathPlace && (
                    <button 
                      className="flex items-center gap-1 ml-11 text-[10px] text-primary hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocationClick?.(person.deathPlace!);
                      }}
                    >
                      <MapPin className="h-3 w-3" />
                      {person.deathPlace}
                    </button>
                  )}
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

          {/* Second Spouse */}
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
