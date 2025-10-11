import { useMemo, useState } from "react";
import type { Person } from "@/types/gedcom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Globe, Book, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MapTreeViewProps {
  people: Record<string, Person>;
  onFocus?: (pid: string) => void;
}

export function MapTreeView({ people, onFocus }: MapTreeViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [maxGenerations, setMaxGenerations] = useState<number>(6);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historicalContext, setHistoricalContext] = useState<string>("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

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
      {/* Map Controls */}
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
              This feature is coming soon and will use geolocation data from your family data.
            </p>
          </div>
        </div>
      </div>

      {/* Location List */}
      {locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations Found in Family Data
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
                  <div className="flex gap-2">
                    <Badge variant="secondary">{count}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetHistoricalContext(location);
                      }}
                    >
                      <Book className="h-3 w-3" />
                    </Button>
                  </div>
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
            <p className="text-xs mt-2">Location information comes from birth and death place fields in family data.</p>
          </CardContent>
        </Card>
      )}

      {/* Historical Context Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Historical Context
              {selectedLocation && ` - ${selectedLocation}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">{historicalContext}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
