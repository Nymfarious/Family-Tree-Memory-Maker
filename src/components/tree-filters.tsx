// src/components/tree-filters.tsx
// Family Tree Memory Maker v2.1
// Filter tree by surname, region, location, and more

import { useState, useMemo } from 'react';
import { Filter, X, MapPin, Users, Calendar, Search, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Person } from '@/types/gedcom';
import { normalizePlace, getRegion } from '@/lib/place-normalizer';

// US Regions for filtering
const US_REGIONS = [
  'New England',
  'Mid-Atlantic', 
  'Upper South',
  'Deep South',
  'Midwest',
  'Southwest',
  'Mountain West',
  'Pacific',
];

export interface TreeFilters {
  surnames: string[];
  regions: string[];
  locations: string[];
  dateRange: [number | null, number | null];
  showLiving: boolean;
  showDeceased: boolean;
  hasAudio: boolean;
  hasPhotos: boolean;
  searchTerm: string;
}

const DEFAULT_FILTERS: TreeFilters = {
  surnames: [],
  regions: [],
  locations: [],
  dateRange: [null, null],
  showLiving: true,
  showDeceased: true,
  hasAudio: false,
  hasPhotos: false,
  searchTerm: '',
};

interface TreeFiltersProps {
  people: Person[];
  filters: TreeFilters;
  onFiltersChange: (filters: TreeFilters) => void;
  onReset: () => void;
}

export function TreeFiltersPanel({ people, filters, onFiltersChange, onReset }: TreeFiltersProps) {
  const [surnameOpen, setSurnameOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Extract unique values from people data
  const { surnames, locations, regions } = useMemo(() => {
    const surnameSet = new Set<string>();
    const locationSet = new Set<string>();
    const regionSet = new Set<string>();

    people.forEach(person => {
      // Surnames
      if (person.surname) {
        surnameSet.add(person.surname);
      } else if (person.name) {
        const parts = person.name.split(' ');
        if (parts.length > 1) {
          surnameSet.add(parts[parts.length - 1]);
        }
      }

      // Locations and regions
      const places = [person.birthPlace, person.deathPlace].filter(Boolean);
      places.forEach(place => {
        if (place) {
          locationSet.add(place);
          
          // Try to extract region
          const normalized = normalizePlace(place);
          const region = getRegion(normalized);
          if (region) {
            regionSet.add(region);
          }
        }
      });
    });

    return {
      surnames: Array.from(surnameSet).sort(),
      locations: Array.from(locationSet).sort(),
      regions: Array.from(regionSet).sort(),
    };
  }, [people]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.surnames.length > 0) count++;
    if (filters.regions.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.dateRange[0] || filters.dateRange[1]) count++;
    if (!filters.showLiving || !filters.showDeceased) count++;
    if (filters.hasAudio) count++;
    if (filters.hasPhotos) count++;
    if (filters.searchTerm) count++;
    return count;
  }, [filters]);

  const updateFilter = <K extends keyof TreeFilters>(key: K, value: TreeFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'surnames' | 'regions' | 'locations', value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  return (
    <div className="space-y-3 p-4 bg-card rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search names..."
          value={filters.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-2">
        {/* Surname Filter */}
        <Popover open={surnameOpen} onOpenChange={setSurnameOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Surname
              {filters.surnames.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                  {filters.surnames.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search surnames..." />
              <CommandList>
                <CommandEmpty>No surnames found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-[200px]">
                    {surnames.map(surname => (
                      <CommandItem
                        key={surname}
                        onSelect={() => toggleArrayFilter('surnames', surname)}
                      >
                        <Checkbox
                          checked={filters.surnames.includes(surname)}
                          className="mr-2"
                        />
                        {surname}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Region Filter */}
        <Popover open={regionOpen} onOpenChange={setRegionOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              Region
              {filters.regions.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                  {filters.regions.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search regions..." />
              <CommandList>
                <CommandEmpty>No regions found.</CommandEmpty>
                <CommandGroup heading="US Regions">
                  {US_REGIONS.map(region => (
                    <CommandItem
                      key={region}
                      onSelect={() => toggleArrayFilter('regions', region)}
                      className={!regions.includes(region) ? 'opacity-50' : ''}
                    >
                      <Checkbox
                        checked={filters.regions.includes(region)}
                        className="mr-2"
                      />
                      {region}
                      {regions.includes(region) && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          ✓
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {regions.filter(r => !US_REGIONS.includes(r)).length > 0 && (
                  <CommandGroup heading="Other">
                    {regions.filter(r => !US_REGIONS.includes(r)).map(region => (
                      <CommandItem
                        key={region}
                        onSelect={() => toggleArrayFilter('regions', region)}
                      >
                        <Checkbox
                          checked={filters.regions.includes(region)}
                          className="mr-2"
                        />
                        {region}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Location Filter */}
        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              Location
              {filters.locations.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                  {filters.locations.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search locations..." />
              <CommandList>
                <CommandEmpty>No locations found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-[250px]">
                    {locations.map(location => (
                      <CommandItem
                        key={location}
                        onSelect={() => toggleArrayFilter('locations', location)}
                      >
                        <Checkbox
                          checked={filters.locations.includes(location)}
                          className="mr-2"
                        />
                        <span className="truncate">{location}</span>
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filter Tags */}
      {(filters.surnames.length > 0 || filters.regions.length > 0 || filters.locations.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {filters.surnames.map(s => (
            <Badge key={s} variant="secondary" className="text-xs pr-1">
              {s}
              <button
                onClick={() => toggleArrayFilter('surnames', s)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.regions.map(r => (
            <Badge key={r} variant="outline" className="text-xs pr-1 border-blue-500/50 text-blue-600 dark:text-blue-400">
              {r}
              <button
                onClick={() => toggleArrayFilter('regions', r)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.locations.map(l => (
            <Badge key={l} variant="outline" className="text-xs pr-1 border-green-500/50 text-green-600 dark:text-green-400 max-w-[150px]">
              <span className="truncate">{l}</span>
              <button
                onClick={() => toggleArrayFilter('locations', l)}
                className="ml-1 hover:bg-muted rounded-full p-0.5 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced Filters (Collapsible) */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground">
            {advancedOpen ? 'Hide' : 'Show'} Advanced Filters
            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <Separator />
          
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Birth Year Range
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="From"
                className="h-8 text-sm"
                value={filters.dateRange[0] || ''}
                onChange={(e) => updateFilter('dateRange', [
                  e.target.value ? parseInt(e.target.value) : null,
                  filters.dateRange[1]
                ])}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                placeholder="To"
                className="h-8 text-sm"
                value={filters.dateRange[1] || ''}
                onChange={(e) => updateFilter('dateRange', [
                  filters.dateRange[0],
                  e.target.value ? parseInt(e.target.value) : null
                ])}
              />
            </div>
          </div>

          {/* Status Toggles */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.showLiving}
                onCheckedChange={(checked) => updateFilter('showLiving', !!checked)}
              />
              Living
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.showDeceased}
                onCheckedChange={(checked) => updateFilter('showDeceased', !!checked)}
              />
              Deceased
            </label>
          </div>

          {/* Media Filters */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.hasAudio}
                onCheckedChange={(checked) => updateFilter('hasAudio', !!checked)}
              />
              Has Audio
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.hasPhotos}
                onCheckedChange={(checked) => updateFilter('hasPhotos', !!checked)}
              />
              Has Photos
            </label>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================================================
// FILTER LOGIC - Apply filters to people array
// ============================================================================

export function applyFilters(people: Person[], filters: TreeFilters): Person[] {
  return people.filter(person => {
    // Search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const nameMatch = person.name?.toLowerCase().includes(term);
      const surnameMatch = person.surname?.toLowerCase().includes(term);
      if (!nameMatch && !surnameMatch) return false;
    }

    // Surnames
    if (filters.surnames.length > 0) {
      const personSurname = person.surname || person.name?.split(' ').pop();
      if (!personSurname || !filters.surnames.includes(personSurname)) return false;
    }

    // Locations
    if (filters.locations.length > 0) {
      const personLocations = [person.birthPlace, person.deathPlace].filter(Boolean);
      const hasMatchingLocation = filters.locations.some(loc => 
        personLocations.some(pl => pl?.toLowerCase().includes(loc.toLowerCase()))
      );
      if (!hasMatchingLocation) return false;
    }

    // Regions
    if (filters.regions.length > 0) {
      const personLocations = [person.birthPlace, person.deathPlace].filter(Boolean);
      const personRegions = personLocations.map(loc => {
        if (!loc) return null;
        const normalized = normalizePlace(loc);
        return getRegion(normalized);
      }).filter(Boolean);
      
      const hasMatchingRegion = filters.regions.some(r => personRegions.includes(r));
      if (!hasMatchingRegion) return false;
    }

    // Date range
    if (filters.dateRange[0] || filters.dateRange[1]) {
      const birthYear = person.birthYear || (person.birth ? 
        parseInt(person.birth.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/)?.[1] || '0') : 0);
      
      if (birthYear) {
        if (filters.dateRange[0] && birthYear < filters.dateRange[0]) return false;
        if (filters.dateRange[1] && birthYear > filters.dateRange[1]) return false;
      }
    }

    // Living/Deceased
    const isLiving = !person.death && !person.deathYear;
    if (!filters.showLiving && isLiving) return false;
    if (!filters.showDeceased && !isLiving) return false;

    // Media
    if (filters.hasAudio && (!person.audioFiles || person.audioFiles.length === 0)) return false;
    if (filters.hasPhotos && (!person.photos || person.photos.length === 0)) return false;

    return true;
  });
}

export { DEFAULT_FILTERS };
export default TreeFiltersPanel;
