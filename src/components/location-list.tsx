// src/components/location-list.tsx
// Family Tree Memory Maker v2.2
// Shows ALL locations with expandable people lists, timelines, and full birth/death info

import { useState, useMemo } from 'react';
import { 
  MapPin, Search, ChevronDown, ChevronRight, Filter,
  Globe, Map, Users, Calendar, GitBranch, User, Skull
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import type { Person } from '@/types/gedcom';
import { normalizePlace, getRegion } from '@/lib/place-normalizer';

interface LocationData {
  raw: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  region?: string;
  count: number;
  people: string[];
  birthCount: number;
  deathCount: number;
  yearRange?: [number, number];
}

interface LocationListProps {
  people: Record<string, Person>;
  childToParents: Record<string, string[]>;
  defaultRootPerson?: string; // The "home base" person to trace lineage to
  onLocationClick?: (location: string) => void;
  onPersonClick?: (personId: string) => void;
  maxVisible?: number;
}

type GroupBy = 'none' | 'state' | 'region' | 'country';
type SortBy = 'count' | 'name' | 'state';

// Build lineage path from a person to the root
function buildLineagePath(
  personId: string,
  targetRootId: string,
  people: Record<string, Person>,
  childToParents: Record<string, string[]>,
  maxDepth: number = 15
): string[] {
  const path: string[] = [];
  const visited = new Set<string>();
  
  function findPath(currentId: string, depth: number): boolean {
    if (depth > maxDepth || visited.has(currentId)) return false;
    if (!people[currentId]) return false;
    
    visited.add(currentId);
    path.push(currentId);
    
    if (currentId === targetRootId) return true;
    
    const parents = childToParents[currentId] || [];
    for (const parentId of parents) {
      if (findPath(parentId, depth + 1)) return true;
    }
    
    path.pop();
    return false;
  }
  
  findPath(personId, 0);
  return path;
}

export function LocationList({ 
  people, 
  childToParents,
  defaultRootPerson,
  onLocationClick, 
  onPersonClick,
  maxVisible = 20 
}: LocationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('state');
  const [sortBy, setSortBy] = useState<SortBy>('count');
  const [visibleCount, setVisibleCount] = useState(maxVisible);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [selectedState, setSelectedState] = useState<string>('all');

  // Build location data from people
  const locationData = useMemo(() => {
    const locationMap = new Map<string, LocationData>();

    Object.values(people).forEach(person => {
      const processLocation = (raw: string | undefined, type: 'birth' | 'death') => {
        if (!raw) return;
        
        if (!locationMap.has(raw)) {
          const normalized = normalizePlace(raw);
          locationMap.set(raw, {
            raw,
            city: normalized.city,
            county: normalized.county,
            state: normalized.state,
            country: normalized.country || 'United States',
            region: getRegion(normalized),
            count: 0,
            people: [],
            birthCount: 0,
            deathCount: 0,
          });
        }

        const data = locationMap.get(raw)!;
        if (!data.people.includes(person.id)) {
          data.people.push(person.id);
          data.count++;
        }

        if (type === 'birth') {
          data.birthCount++;
          const year = person.birthYear || extractYear(person.birth);
          if (year) updateYearRange(data, year);
        } else {
          data.deathCount++;
          const year = person.deathYear || extractYear(person.death);
          if (year) updateYearRange(data, year);
        }
      };

      processLocation(person.birthPlace, 'birth');
      processLocation(person.deathPlace, 'death');
    });

    return Array.from(locationMap.values());
  }, [people]);

  // Get unique states for filter
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    locationData.forEach(loc => {
      if (loc.state) states.add(loc.state);
    });
    return Array.from(states).sort();
  }, [locationData]);

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let filtered = locationData;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(loc => 
        loc.raw.toLowerCase().includes(term) ||
        loc.city?.toLowerCase().includes(term) ||
        loc.county?.toLowerCase().includes(term) ||
        loc.state?.toLowerCase().includes(term)
      );
    }

    if (selectedState !== 'all') {
      filtered = filtered.filter(loc => loc.state === selectedState);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'count': return b.count - a.count;
        case 'name': return a.raw.localeCompare(b.raw);
        case 'state': return (a.state || 'ZZZ').localeCompare(b.state || 'ZZZ');
        default: return 0;
      }
    });

    return filtered;
  }, [locationData, searchTerm, selectedState, sortBy]);

  // Group locations
  const groupedLocations = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Locations': filteredLocations };
    }

    const groups: Record<string, LocationData[]> = {};
    
    filteredLocations.forEach(loc => {
      let groupKey: string;
      switch (groupBy) {
        case 'state': groupKey = loc.state || 'Unknown State'; break;
        case 'region': groupKey = loc.region || 'Unknown Region'; break;
        case 'country': groupKey = loc.country || 'Unknown Country'; break;
        default: groupKey = 'All';
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(loc);
    });

    const sortedGroups: Record<string, LocationData[]> = {};
    Object.keys(groups)
      .sort((a, b) => {
        const countA = groups[a].reduce((sum, loc) => sum + loc.count, 0);
        const countB = groups[b].reduce((sum, loc) => sum + loc.count, 0);
        return countB - countA;
      })
      .forEach(key => { sortedGroups[key] = groups[key]; });

    return sortedGroups;
  }, [filteredLocations, groupBy]);

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) newExpanded.delete(group);
    else newExpanded.add(group);
    setExpandedGroups(newExpanded);
  };

  const toggleLocation = (locationRaw: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(locationRaw)) newExpanded.delete(locationRaw);
    else newExpanded.add(locationRaw);
    setExpandedLocations(newExpanded);
  };

  const totalLocations = locationData.length;

  // Render a single person's info with timeline
  const renderPersonEntry = (personId: string, location: LocationData) => {
    const person = people[personId];
    if (!person) return null;

    const isBirthHere = person.birthPlace === location.raw;
    const isDeathHere = person.deathPlace === location.raw;
    
    // Build lineage path if we have a default root
    const lineagePath = defaultRootPerson 
      ? buildLineagePath(personId, defaultRootPerson, people, childToParents)
      : [];

    return (
      <div 
        key={personId}
        className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors space-y-2"
      >
        {/* Person Header */}
        <div 
          className="flex items-start justify-between cursor-pointer"
          onClick={() => onPersonClick?.(personId)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{person.name || 'Unknown'}</p>
            {person.surname && (
              <Badge variant="outline" className="text-[10px] mr-1">{person.surname}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isBirthHere && (
              <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
                Born
              </Badge>
            )}
            {isDeathHere && (
              <Badge variant="outline" className="text-[10px] bg-gray-500/10 text-gray-600 border-gray-500/30">
                Died
              </Badge>
            )}
          </div>
        </div>

        {/* Birth Info */}
        {(person.birth || person.birthPlace) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="text-green-600">👶</span>
            <span className="font-medium">Born:</span>
            <span>{person.birth || 'Date unknown'}</span>
            {person.birthPlace && person.birthPlace !== location.raw && (
              <span className="text-primary/70">@ {person.birthPlace}</span>
            )}
          </div>
        )}

        {/* Death Info */}
        {(person.death || person.deathPlace) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Skull className="h-3 w-3 text-gray-500" />
            <span className="font-medium">Died:</span>
            <span>{person.death || 'Date unknown'}</span>
            {person.deathPlace && person.deathPlace !== location.raw && (
              <span className="text-primary/70">@ {person.deathPlace}</span>
            )}
          </div>
        )}

        {/* Lineage Timeline */}
        {lineagePath.length > 1 && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <GitBranch className="h-3 w-3" />
              <span>Lineage to {people[defaultRootPerson!]?.name || 'Root'}:</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {lineagePath.map((ancestorId, idx) => {
                const ancestor = people[ancestorId];
                const isLast = idx === lineagePath.length - 1;
                return (
                  <div key={ancestorId} className="flex items-center">
                    <button
                      className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPersonClick?.(ancestorId);
                      }}
                    >
                      {ancestor?.name?.split(' ')[0] || '?'}
                    </button>
                    {!isLast && <span className="text-muted-foreground mx-0.5">→</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render a single location card with expandable people
  const renderLocationCard = (loc: LocationData, idx: number) => {
    const isExpanded = expandedLocations.has(loc.raw);
    
    return (
      <Collapsible
        key={`${loc.raw}-${idx}`}
        open={isExpanded}
        onOpenChange={() => toggleLocation(loc.raw)}
      >
        <div className="border border-border rounded-lg overflow-hidden bg-card hover:bg-card/80 transition-colors">
          {/* Location Header - Click to expand */}
          <CollapsibleTrigger asChild>
            <button className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Pin icon rotates when expanded */}
                <div className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{loc.raw}</p>
                  {loc.yearRange && (
                    <p className="text-xs text-muted-foreground">
                      {loc.yearRange[0]} - {loc.yearRange[1]}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Person count */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {loc.count}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{loc.count} people at this location</TooltipContent>
                </Tooltip>
                
                {/* Birth count */}
                {loc.birthCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">
                        👶 {loc.birthCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>{loc.birthCount} births</TooltipContent>
                  </Tooltip>
                )}
                
                {/* Death count */}
                {loc.deathCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs text-gray-600 border-gray-500/30">
                        ✝️ {loc.deathCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>{loc.deathCount} deaths</TooltipContent>
                  </Tooltip>
                )}

                {/* Expand indicator */}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Expanded People List */}
          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
              <div className="text-xs text-muted-foreground mb-2">
                {loc.count} {loc.count === 1 ? 'person' : 'people'} connected to this location:
              </div>
              {loc.people.map(personId => renderPersonEntry(personId, loc))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Locations
            <Badge variant="outline">{totalLocations}</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="state">By State</SelectItem>
              <SelectItem value="region">By Region</SelectItem>
              <SelectItem value="country">By Country</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Most People</SelectItem>
              <SelectItem value="name">Alphabetical</SelectItem>
              <SelectItem value="state">By State</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Default Root Person indicator */}
        {defaultRootPerson && people[defaultRootPerson] && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            <GitBranch className="h-3 w-3" />
            <span>Lineages traced to:</span>
            <Badge variant="secondary" className="text-xs">
              {people[defaultRootPerson].name}
            </Badge>
          </div>
        )}

        {/* Location List */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {Object.entries(groupedLocations).map(([group, locations]) => (
              <Collapsible
                key={group}
                open={groupBy === 'none' || expandedGroups.has(group)}
                onOpenChange={() => groupBy !== 'none' && toggleGroup(group)}
              >
                {/* Group Header */}
                {groupBy !== 'none' && (
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-2 px-3 mb-1"
                    >
                      <span className="flex items-center gap-2">
                        {expandedGroups.has(group) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{group}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {locations.length} location{locations.length !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {locations.reduce((sum, loc) => sum + loc.count, 0)} people
                        </Badge>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                )}

                <CollapsibleContent>
                  <div className="space-y-2 pl-1">
                    {locations
                      .slice(0, groupBy === 'none' ? visibleCount : undefined)
                      .map((loc, idx) => renderLocationCard(loc, idx))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            {/* Load More */}
            {groupBy === 'none' && visibleCount < filteredLocations.length && (
              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setVisibleCount(prev => prev + maxVisible)}
                >
                  Show More ({filteredLocations.length - visibleCount} remaining)
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => setVisibleCount(filteredLocations.length)}
                >
                  Show All {filteredLocations.length} Locations
                </Button>
              </div>
            )}

            {/* No results */}
            {filteredLocations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No locations match your search.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t">
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-lg font-bold">{totalLocations}</div>
            <div className="text-xs text-muted-foreground">Total Locations</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-lg font-bold">{uniqueStates.length}</div>
            <div className="text-xs text-muted-foreground">States/Countries</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-lg font-bold">
              {locationData.reduce((sum, loc) => sum + loc.birthCount, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Birth Records</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-lg font-bold">
              {locationData.reduce((sum, loc) => sum + loc.deathCount, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Death Records</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function extractYear(date?: string): number | null {
  if (!date) return null;
  const match = date.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  return match ? parseInt(match[1]) : null;
}

function updateYearRange(data: LocationData, year: number) {
  if (!data.yearRange) {
    data.yearRange = [year, year];
  } else {
    data.yearRange = [
      Math.min(data.yearRange[0], year),
      Math.max(data.yearRange[1], year)
    ];
  }
}

export default LocationList;
