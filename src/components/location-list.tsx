// src/components/location-list.tsx
// Family Tree Memory Maker v2.2
// Shows ALL locations with pagination, search, filtering, and grouping

import { useState, useMemo } from 'react';
import { 
  MapPin, Search, ChevronDown, ChevronRight, Filter,
  Globe, Map, Users, Calendar, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Person } from '@/types/gedcom';
import { normalizePlace, getRegion, US_REGIONS } from '@/lib/place-normalizer';

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
  onLocationClick?: (location: string) => void;
  onPersonClick?: (personId: string) => void;
  maxVisible?: number; // How many to show before "Load More"
}

type GroupBy = 'none' | 'state' | 'region' | 'country';
type SortBy = 'count' | 'name' | 'state';

export function LocationList({ 
  people, 
  onLocationClick, 
  onPersonClick,
  maxVisible = 20 
}: LocationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('state');
  const [sortBy, setSortBy] = useState<SortBy>('count');
  const [visibleCount, setVisibleCount] = useState(maxVisible);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(loc => 
        loc.raw.toLowerCase().includes(term) ||
        loc.city?.toLowerCase().includes(term) ||
        loc.county?.toLowerCase().includes(term) ||
        loc.state?.toLowerCase().includes(term)
      );
    }

    // State filter
    if (selectedState !== 'all') {
      filtered = filtered.filter(loc => loc.state === selectedState);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'count':
          return b.count - a.count;
        case 'name':
          return a.raw.localeCompare(b.raw);
        case 'state':
          return (a.state || 'ZZZ').localeCompare(b.state || 'ZZZ');
        default:
          return 0;
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
        case 'state':
          groupKey = loc.state || 'Unknown State';
          break;
        case 'region':
          groupKey = loc.region || 'Unknown Region';
          break;
        case 'country':
          groupKey = loc.country || 'Unknown Country';
          break;
        default:
          groupKey = 'All';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(loc);
    });

    // Sort groups by total count
    const sortedGroups: Record<string, LocationData[]> = {};
    Object.keys(groups)
      .sort((a, b) => {
        const countA = groups[a].reduce((sum, loc) => sum + loc.count, 0);
        const countB = groups[b].reduce((sum, loc) => sum + loc.count, 0);
        return countB - countA;
      })
      .forEach(key => {
        sortedGroups[key] = groups[key];
      });

    return sortedGroups;
  }, [filteredLocations, groupBy]);

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const totalLocations = locationData.length;
  const displayedLocations = filteredLocations.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Locations Found in Family Data
          </CardTitle>
          <Badge variant="secondary">
            {displayedLocations} of {totalLocations}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
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
                      className="w-full justify-between h-auto py-2 px-3"
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
                  <div className="space-y-1 pl-2">
                    {locations.slice(0, groupBy === 'none' ? visibleCount : undefined).map((loc, idx) => (
                      <div
                        key={`${loc.raw}-${idx}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => onLocationClick?.(loc.raw)}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{loc.raw}</p>
                            {loc.yearRange && (
                              <p className="text-xs text-muted-foreground">
                                {loc.yearRange[0]} - {loc.yearRange[1]}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="text-xs">
                                {loc.count}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {loc.count} people at this location
                            </TooltipContent>
                          </Tooltip>
                          
                          {loc.birthCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">
                                  👶 {loc.birthCount}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>{loc.birthCount} births</TooltipContent>
                            </Tooltip>
                          )}
                          
                          {loc.deathCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs text-gray-600 border-gray-600/30">
                                  ✝️ {loc.deathCount}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>{loc.deathCount} deaths</TooltipContent>
                            </Tooltip>
                          )}
                          
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            {/* Load More (for ungrouped view) */}
            {groupBy === 'none' && visibleCount < filteredLocations.length && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setVisibleCount(prev => prev + maxVisible)}
              >
                Show More ({filteredLocations.length - visibleCount} remaining)
              </Button>
            )}

            {/* Show All button */}
            {groupBy === 'none' && visibleCount < filteredLocations.length && (
              <Button
                variant="ghost"
                className="w-full text-xs"
                onClick={() => setVisibleCount(filteredLocations.length)}
              >
                Show All {filteredLocations.length} Locations
              </Button>
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
