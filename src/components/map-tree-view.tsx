// src/components/map-tree-view.tsx
// Family Tree Memory Maker v2.2.4
// Map view with inline expandable location cards

import { useMemo, useState, useEffect } from "react";
import type { Person } from "@/types/gedcom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MapPin, Globe, Book, Loader2, UserPlus, Search, 
  ChevronDown, ChevronRight, Baby, Skull, GitBranch, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QuickAddPersonModal } from "./modals/quick-add-person-modal";
import { cn } from "@/lib/utils";

interface MapTreeViewProps {
  people: Record<string, Person>;
  childToParents?: Record<string, string[]>;
  onFocus?: (pid: string) => void;
  onAddPerson?: (person: Person) => void;
}

interface LocationData {
  location: string;
  people: Person[];
  count: number;
  birthCount: number;
  deathCount: number;
}

export function MapTreeView({ people, childToParents = {}, onFocus, onAddPerson }: MapTreeViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [maxGenerations, setMaxGenerations] = useState<number>(6);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historicalContext, setHistoricalContext] = useState<string>("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [defaultRootPerson, setDefaultRootPerson] = useState<string | undefined>();
  const { toast } = useToast();

  // Load default root person from preferences
  useEffect(() => {
    const savedFilters = localStorage.getItem('tree-filter-preferences');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      setDefaultRootPerson(filters.defaultRootPerson);
    }
  }, []);

  const handleGetHistoricalContext = async (location?: string) => {
    setLoadingHistory(true);
    setHistoryDialogOpen(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('historical-context', {
        body: {
          timeframe: "1800-2025",
          location: location || selectedLocation || "United States",
          migrationPattern: true
        }
      });

      if (error) throw error;
      setHistoricalContext(data.context);
    } catch (error) {
      console.error('Error fetching historical context:', error);
      toast({
        title: "Error",
        description: "Failed to fetch historical context. Please try again.",
        variant: "destructive",
      });
      setHistoricalContext("Unable to fetch historical context at this time.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddPerson = (person: Person) => {
    if (onAddPerson) {
      onAddPerson(person);
    }
  };

  const toggleLocation = (location: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(location)) {
      newExpanded.delete(location);
    } else {
      newExpanded.add(location);
    }
    setExpandedLocations(newExpanded);
  };

  // Build lineage path from a person to the root
  const buildLineagePath = (personId: string): string[] => {
    if (!defaultRootPerson || !childToParents) return [];
    
    const path: string[] = [];
    const visited = new Set<string>();
    
    function findPath(currentId: string, depth: number): boolean {
      if (depth > 15 || visited.has(currentId)) return false;
      if (!people[currentId]) return false;
      
      visited.add(currentId);
      path.push(currentId);
      
      if (currentId === defaultRootPerson) return true;
      
      const parents = childToParents[currentId] || [];
      for (const parentId of parents) {
        if (findPath(parentId, depth + 1)) return true;
      }
      
      path.pop();
      return false;
    }
    
    findPath(personId, 0);
    return path;
  };

  // Extract unique locations from birth and death places
  const locations = useMemo(() => {
    const locationMap = new Map<string, LocationData>();
    
    Object.values(people).forEach(person => {
      const birthPlace = person.birthPlace?.trim();
      const deathPlace = person.deathPlace?.trim();

      if (birthPlace) {
        if (!locationMap.has(birthPlace)) {
          locationMap.set(birthPlace, { 
            location: birthPlace, 
            people: [], 
            count: 0,
            birthCount: 0,
            deathCount: 0
          });
        }
        const data = locationMap.get(birthPlace)!;
        if (!data.people.find(p => p.id === person.id)) {
          data.people.push(person);
          data.count++;
        }
        data.birthCount++;
      }

      if (deathPlace) {
        if (!locationMap.has(deathPlace)) {
          locationMap.set(deathPlace, { 
            location: deathPlace, 
            people: [], 
            count: 0,
            birthCount: 0,
            deathCount: 0
          });
        }
        const data = locationMap.get(deathPlace)!;
        if (!data.people.find(p => p.id === person.id)) {
          data.people.push(person);
          data.count++;
        }
        data.deathCount++;
      }
    });

    return Array.from(locationMap.values())
      .sort((a, b) => b.count - a.count);
  }, [people]);

  // Filter locations by search
  const filteredLocations = useMemo(() => {
    if (!searchTerm) return locations;
    const term = searchTerm.toLowerCase();
    return locations.filter(loc => 
      loc.location.toLowerCase().includes(term)
    );
  }, [locations, searchTerm]);

  // Render person entry with birth/death info
  const renderPersonEntry = (person: Person, locationName: string) => {
    const isBirthHere = person.birthPlace === locationName;
    const isDeathHere = person.deathPlace === locationName;
    const lineagePath = buildLineagePath(person.id);

    return (
      <div 
        key={person.id}
        className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors space-y-2 border border-border/30"
      >
        {/* Person Header */}
        <div 
          className="flex items-start justify-between cursor-pointer"
          onClick={() => onFocus?.(person.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm hover:text-primary transition-colors">
              {person.name} {person.surname}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isBirthHere && (
              <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                👶 Born
              </Badge>
            )}
            {isDeathHere && (
              <Badge className="text-[10px] bg-gray-500/20 text-gray-400 border-gray-500/30">
                ✝️ Died
              </Badge>
            )}
          </div>
        </div>

        {/* Birth Info */}
        {(person.birth || person.birthPlace) && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Baby className="h-3 w-3 text-green-500 flex-shrink-0" />
            <span className="text-green-400/80">Born:</span>
            <span>{person.birth || 'Date unknown'}</span>
            {person.birthPlace && person.birthPlace !== locationName && (
              <span className="text-primary/60 truncate">@ {person.birthPlace}</span>
            )}
          </div>
        )}

        {/* Death Info */}
        {(person.death || person.deathPlace) && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Skull className="h-3 w-3 text-gray-500 flex-shrink-0" />
            <span className="text-gray-400/80">Died:</span>
            <span>{person.death || 'Date unknown'}</span>
            {person.deathPlace && person.deathPlace !== locationName && (
              <span className="text-primary/60 truncate">@ {person.deathPlace}</span>
            )}
          </div>
        )}

        {/* No death recorded */}
        {(person.birth || person.birthPlace) && !person.death && !person.deathPlace && (
          <div className="text-xs text-muted-foreground/50 italic flex items-center gap-2">
            <Skull className="h-3 w-3 opacity-30" />
            <span>No death recorded</span>
          </div>
        )}

        {/* Lineage Timeline */}
        {lineagePath.length > 1 && (
          <div className="pt-2 mt-2 border-t border-border/30">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
              <GitBranch className="h-3 w-3 text-primary/60" />
              <span>Lineage to {people[defaultRootPerson!]?.name || 'Root'}:</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {lineagePath.map((ancestorId, idx) => {
                const ancestor = people[ancestorId];
                const isLast = idx === lineagePath.length - 1;
                const isFirst = idx === 0;
                return (
                  <div key={ancestorId} className="flex items-center">
                    <button
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded transition-colors",
                        isFirst 
                          ? "bg-primary/20 text-primary font-medium" 
                          : isLast 
                            ? "bg-green-500/20 text-green-400 font-medium"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onFocus?.(ancestorId);
                      }}
                    >
                      {ancestor?.name?.split(' ')[0] || '?'}
                    </button>
                    {!isLast && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground/50 mx-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render inline expandable location card
  const renderLocationCard = (locData: LocationData) => {
    const isExpanded = expandedLocations.has(locData.location);
    
    return (
      <div
        key={locData.location}
        className="border border-border rounded-lg overflow-hidden bg-card transition-all"
      >
        {/* Location Header - Click to expand */}
        <button 
          className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
          onClick={() => toggleLocation(locData.location)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Pin icon ROTATES when expanded */}
            <div 
              className={cn(
                "transition-transform duration-200 flex-shrink-0",
                isExpanded ? "rotate-90" : "rotate-0"
              )}
            >
              <MapPin className={cn(
                "h-5 w-5 transition-colors",
                isExpanded ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{locData.location}</p>
              <p className="text-xs text-muted-foreground">
                {locData.count} {locData.count === 1 ? 'person' : 'people'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Person count badge */}
            <Badge variant="secondary" className="text-xs tabular-nums">
              <Users className="h-3 w-3 mr-1" />
              {locData.count}
            </Badge>
            
            {/* Birth count */}
            {locData.birthCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs text-green-500 border-green-500/30 tabular-nums">
                    👶 {locData.birthCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{locData.birthCount} born here</TooltipContent>
              </Tooltip>
            )}
            
            {/* Death count */}
            {locData.deathCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs text-gray-500 border-gray-500/30 tabular-nums">
                    ✝️ {locData.deathCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{locData.deathCount} died here</TooltipContent>
              </Tooltip>
            )}

            {/* History button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleGetHistoricalContext(locData.location);
              }}
            >
              <Book className="h-3 w-3" />
            </Button>

            {/* Expand chevron */}
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isExpanded ? "rotate-180" : "rotate-0"
              )} 
            />
          </div>
        </button>

        {/* INLINE Expanded People List */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-2 border-t border-border/50 bg-muted/10">
            <div className="pt-2 text-xs text-muted-foreground">
              People connected to this location:
            </div>
            <div className="space-y-2">
              {locData.people.map(person => renderPersonEntry(person, locData.location))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-4 p-4 rounded-lg border border-border bg-card/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="generation-select" className="text-sm font-medium">Generations to Display</Label>
            <Select value={String(maxGenerations)} onValueChange={(v) => setMaxGenerations(Number(v))}>
              <SelectTrigger id="generation-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 6, 9, 12, 15].map(num => (
                  <SelectItem key={num} value={String(num)}>{num} Generations</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="view-mode" className="text-sm font-medium">View Mode</Label>
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as '2d' | '3d')}>
              <SelectTrigger id="view-mode" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2d">2D Map</SelectItem>
                <SelectItem value="3d">3D Globe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => handleGetHistoricalContext()}
          >
            <Book className="h-4 w-4 mr-2" />
            Historical Context
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickAddOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-border">
        <div className="text-center space-y-4">
          {viewMode === '3d' ? (
            <Globe className="h-16 w-16 text-muted-foreground mx-auto" />
          ) : (
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto" />
          )}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {viewMode === '3d' ? '3D Globe View' : 'Interactive 2D Map'}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              The Map View will display family members' birth and death locations on an interactive {viewMode === '3d' ? 'rotating globe' : 'world map'}. 
              This feature is coming soon and will use geolocation data from uploaded family data.
            </p>
          </div>
        </div>
      </div>

      {/* Location List */}
      {locations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Locations
                <Badge variant="outline">{locations.length}</Badge>
              </CardTitle>
            </div>
            
            {/* Search */}
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Root person indicator */}
            {defaultRootPerson && people[defaultRootPerson] && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mt-2">
                <GitBranch className="h-3 w-3 text-primary" />
                <span>Lineages traced to:</span>
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                  {people[defaultRootPerson].name}
                </Badge>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-2">
                {filteredLocations.map(locData => renderLocationCard(locData))}
                
                {filteredLocations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No locations match your search.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {locations.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground space-y-3">
            <p>No location data found in the current family tree.</p>
            <p className="text-xs">Location information comes from birth and death records in uploaded family data.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setQuickAddOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Person with Location
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Historical Context Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Historical Context
            </DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {historicalContext.split('\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Add Person Modal */}
      <QuickAddPersonModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSave={handleAddPerson}
      />
    </div>
  );
}
