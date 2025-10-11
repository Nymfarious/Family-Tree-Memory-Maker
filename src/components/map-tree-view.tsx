import { useMemo, useState } from "react";
import type { Person } from "@/types/gedcom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ZoomIn, ZoomOut } from "lucide-react";

interface MapTreeViewProps {
  people: Record<string, Person>;
  onFocus?: (pid: string) => void;
}

export function MapTreeView({ people, onFocus }: MapTreeViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Extract unique locations from birth and death places
  const locations = useMemo(() => {
    const locationMap = new Map<string, { people: Person[], count: number }>();
    
    Object.values(people).forEach(person => {
      const birthPlace = person.birthPlace?.trim();
      const deathPlace = person.deathPlace?.trim();
      
      if (birthPlace) {
        const existing = locationMap.get(birthPlace) || { people: [], count: 0 };
        existing.people.push(person);
        existing.count++;
        locationMap.set(birthPlace, existing);
      }
      
      if (deathPlace && deathPlace !== birthPlace) {
        const existing = locationMap.get(deathPlace) || { people: [], count: 0 };
        existing.people.push(person);
        existing.count++;
        locationMap.set(deathPlace, existing);
      }
    });
    
    return Array.from(locationMap.entries())
      .map(([location, data]) => ({
        location,
        people: data.people,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count);
  }, [people]);

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-border">
        <div className="text-center space-y-4">
          <MapPin className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Interactive Map View</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              The Map View will display family members' birth and death locations on an interactive world map. 
              This feature is coming soon and will use geolocation data from your GEDCOM file.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" disabled>
              <ZoomIn className="h-4 w-4 mr-2" />
              Zoom In
            </Button>
            <Button variant="outline" size="sm" disabled>
              <ZoomOut className="h-4 w-4 mr-2" />
              Zoom Out
            </Button>
          </div>
        </div>
      </div>

      {/* Location List */}
      {locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations Found in Family Tree
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {locations.slice(0, 20).map(({ location, people, count }) => (
                <div
                  key={location}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLocation(location)}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{location}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'person' : 'people'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {locations.length > 20 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  + {locations.length - 20} more locations
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Location Details */}
      {selectedLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {selectedLocation}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLocation(null)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {locations
                .find(loc => loc.location === selectedLocation)
                ?.people.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-2 rounded border border-border hover:bg-accent/50 cursor-pointer"
                    onClick={() => onFocus?.(person.id)}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {person.name} {person.surname}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {person.birth && `Born: ${person.birth}`}
                        {person.death && ` • Died: ${person.death}`}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {locations.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>No location data found in the current family tree.</p>
            <p className="text-xs mt-2">Location information comes from birth and death place fields in GEDCOM data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
