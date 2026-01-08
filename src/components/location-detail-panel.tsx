// src/components/location-detail-panel.tsx
// Family Tree Memory Maker v2.1
// Shows all people at a location with dates - helps identify data errors

import { useState, useMemo } from 'react';
import { 
  MapPin, Calendar, Users, AlertTriangle, X, 
  ChevronDown, ChevronRight, ExternalLink, Merge,
  ArrowRight, Baby, Skull, Heart, Home, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Person } from '@/types/gedcom';
import { normalizePlace, getRegion, extractYear } from '@/lib/place-normalizer';

interface LocationEvent {
  person: Person;
  eventType: 'birth' | 'death' | 'marriage' | 'residence' | 'other';
  date?: string;
  year?: number;
  rawLocation: string;
}

interface LocationDetailPanelProps {
  location: string;
  people: Person[];
  allLocations?: string[];
  onClose: () => void;
  onPersonClick?: (person: Person) => void;
  onMergeLocations?: (from: string, to: string) => void;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  birth: <Baby className="h-4 w-4 text-green-500" />,
  death: <Skull className="h-4 w-4 text-gray-500" />,
  marriage: <Heart className="h-4 w-4 text-pink-500" />,
  residence: <Home className="h-4 w-4 text-blue-500" />,
  other: <FileText className="h-4 w-4 text-muted-foreground" />,
};

export function LocationDetailPanel({
  location,
  people,
  allLocations = [],
  onClose,
  onPersonClick,
  onMergeLocations,
}: LocationDetailPanelProps) {
  const [sortBy, setSortBy] = useState<'name' | 'year' | 'event'>('year');
  const [showSimilar, setShowSimilar] = useState(false);

  // Build list of events at this location
  const events = useMemo<LocationEvent[]>(() => {
    const result: LocationEvent[] = [];

    people.forEach(person => {
      // Check birth place
      if (person.birthPlace?.toLowerCase().includes(location.toLowerCase()) ||
          location.toLowerCase().includes(person.birthPlace?.toLowerCase() || '___')) {
        result.push({
          person,
          eventType: 'birth',
          date: person.birth,
          year: person.birthYear || extractYear(person.birth || '') || undefined,
          rawLocation: person.birthPlace || location,
        });
      }

      // Check death place
      if (person.deathPlace?.toLowerCase().includes(location.toLowerCase()) ||
          location.toLowerCase().includes(person.deathPlace?.toLowerCase() || '___')) {
        result.push({
          person,
          eventType: 'death',
          date: person.death,
          year: person.deathYear || extractYear(person.death || '') || undefined,
          rawLocation: person.deathPlace || location,
        });
      }

      // Check place events
      person.placeEvents?.forEach(event => {
        if (event.placeRaw?.toLowerCase().includes(location.toLowerCase())) {
          result.push({
            person,
            eventType: event.eventType as LocationEvent['eventType'],
            date: event.yearRange?.[0]?.toString(),
            year: event.yearRange?.[0] || undefined,
            rawLocation: event.placeRaw,
          });
        }
      });
    });

    // Sort
    return result.sort((a, b) => {
      if (sortBy === 'year') {
        return (a.year || 9999) - (b.year || 9999);
      }
      if (sortBy === 'name') {
        return (a.person.name || '').localeCompare(b.person.name || '');
      }
      if (sortBy === 'event') {
        return a.eventType.localeCompare(b.eventType);
      }
      return 0;
    });
  }, [people, location, sortBy]);

  // Find similar locations (potential duplicates/variants)
  const similarLocations = useMemo(() => {
    const normalized = normalizePlace(location);
    const locationLower = location.toLowerCase();
    
    return allLocations.filter(loc => {
      if (loc === location) return false;
      const locLower = loc.toLowerCase();
      
      // Check for overlap
      const locNorm = normalizePlace(loc);
      
      // Same county?
      if (normalized.county && locNorm.county && 
          normalized.county === locNorm.county &&
          normalized.state === locNorm.state) {
        return true;
      }
      
      // One contains the other?
      if (locLower.includes(locationLower) || locationLower.includes(locLower)) {
        return true;
      }
      
      // Share significant words?
      const words1 = locationLower.split(/[,\s]+/).filter(w => w.length > 3);
      const words2 = locLower.split(/[,\s]+/).filter(w => w.length > 3);
      const overlap = words1.filter(w => words2.includes(w));
      if (overlap.length >= 2) {
        return true;
      }
      
      return false;
    });
  }, [location, allLocations]);

  // Detect potential issues
  const issues = useMemo(() => {
    const problems: string[] = [];
    
    // Check for duplicate county/town name (like "Ulster, Ulster")
    const parts = location.split(',').map(p => p.trim().toLowerCase());
    const uniqueParts = new Set(parts);
    if (uniqueParts.size < parts.length) {
      problems.push('Location has duplicate parts (e.g., county used as town name)');
    }
    
    // Check for very generic location
    if (parts.length === 1 || (parts.length === 2 && parts[1] === 'united states')) {
      problems.push('Location is very generic - consider adding county/city');
    }
    
    // Check for similar locations that might be duplicates
    if (similarLocations.length > 0) {
      problems.push(`${similarLocations.length} similar location(s) found - possible duplicates`);
    }
    
    return problems;
  }, [location, similarLocations]);

  // Get date range
  const dateRange = useMemo(() => {
    const years = events.map(e => e.year).filter(Boolean) as number[];
    if (years.length === 0) return null;
    return {
      min: Math.min(...years),
      max: Math.max(...years),
    };
  }, [events]);

  // Get region
  const region = getRegion(normalizePlace(location));

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <MapPin className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">{location}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {events.length} events
                </Badge>
                {region && (
                  <Badge variant="outline" className="text-xs">
                    {region}
                  </Badge>
                )}
                {dateRange && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {dateRange.min} - {dateRange.max}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Data Quality Alerts */}
        {issues.length > 0 && (
          <Alert variant="destructive" className="bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-600 dark:text-yellow-400">
              Potential Data Issues
            </AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                {issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Similar Locations */}
        {similarLocations.length > 0 && (
          <Collapsible open={showSimilar} onOpenChange={setShowSimilar}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Merge className="h-4 w-4" />
                  {similarLocations.length} Similar Location{similarLocations.length > 1 ? 's' : ''} Found
                </span>
                {showSimilar ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">
                  These locations might be variants of the same place. Consider merging them.
                </p>
                {similarLocations.map((loc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-background rounded border">
                    <span className="text-sm truncate flex-1">{loc}</span>
                    {onMergeLocations && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onMergeLocations(loc, location)}
                        className="ml-2 text-xs"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Merge into this
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <Separator />

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="flex gap-1">
            {(['year', 'name', 'event'] as const).map(option => (
              <Button
                key={option}
                variant={sortBy === option ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSortBy(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Events Table */}
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">Type</TableHead>
                <TableHead>Person</TableHead>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, idx) => (
                <TableRow 
                  key={`${event.person.id}-${event.eventType}-${idx}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onPersonClick?.(event.person)}
                >
                  <TableCell>
                    <div title={event.eventType}>
                      {EVENT_ICONS[event.eventType]}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{event.person.name || 'Unknown'}</span>
                      {event.person.surname && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {event.person.surname}
                        </Badge>
                      )}
                    </div>
                    {event.rawLocation !== location && (
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        as: {event.rawLocation}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {event.date || event.year || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No events found at this location
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Summary Stats */}
        <Separator />
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-muted/50 rounded">
            <div className="text-lg font-bold text-green-500">
              {events.filter(e => e.eventType === 'birth').length}
            </div>
            <div className="text-xs text-muted-foreground">Births</div>
          </div>
          <div className="p-2 bg-muted/50 rounded">
            <div className="text-lg font-bold text-gray-500">
              {events.filter(e => e.eventType === 'death').length}
            </div>
            <div className="text-xs text-muted-foreground">Deaths</div>
          </div>
          <div className="p-2 bg-muted/50 rounded">
            <div className="text-lg font-bold text-pink-500">
              {events.filter(e => e.eventType === 'marriage').length}
            </div>
            <div className="text-xs text-muted-foreground">Marriages</div>
          </div>
          <div className="p-2 bg-muted/50 rounded">
            <div className="text-lg font-bold text-blue-500">
              {events.filter(e => e.eventType === 'residence' || e.eventType === 'other').length}
            </div>
            <div className="text-xs text-muted-foreground">Other</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LocationDetailPanel;
