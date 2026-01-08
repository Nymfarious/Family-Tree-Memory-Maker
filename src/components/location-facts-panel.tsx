// src/components/location-facts-panel.tsx
// Family Tree Memory Maker v2.1
// Shows supporting evidence for why a location is associated with a person

import { useState } from 'react';
import { MapPin, Calendar, FileText, X, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Person } from '@/types/gedcom';
import { supabase } from '@/integrations/supabase/client';

interface LocationFact {
  type: 'birth' | 'death' | 'marriage' | 'residence' | 'census' | 'military' | 'land' | 'probate';
  date?: string;
  description: string;
  source?: string;
}

interface LocationFactsPanelProps {
  location: string;
  person: Person;
  onClose: () => void;
  allPeopleAtLocation?: Person[];
}

const EVENT_ICONS: Record<string, string> = {
  birth: '👶',
  death: '✝️',
  marriage: '💒',
  residence: '🏠',
  census: '📋',
  military: '⚔️',
  land: '📜',
  probate: '⚖️',
};

const EVENT_LABELS: Record<string, string> = {
  birth: 'Birth Record',
  death: 'Death Record',
  marriage: 'Marriage Record',
  residence: 'Residence',
  census: 'Census Record',
  military: 'Military Record',
  land: 'Land Record',
  probate: 'Probate Record',
};

export function LocationFactsPanel({ 
  location, 
  person, 
  onClose,
  allPeopleAtLocation = []
}: LocationFactsPanelProps) {
  const [historicalContext, setHistoricalContext] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [contextProvider, setContextProvider] = useState<string | null>(null);

  // Build facts from person data
  const facts: LocationFact[] = [];
  
  if (person.birthPlace?.toLowerCase().includes(location.toLowerCase())) {
    facts.push({
      type: 'birth',
      date: person.birth,
      description: `Born in ${person.birthPlace}`,
      source: 'GEDCOM Import'
    });
  }
  
  if (person.deathPlace?.toLowerCase().includes(location.toLowerCase())) {
    facts.push({
      type: 'death',
      date: person.death,
      description: `Died in ${person.deathPlace}`,
      source: 'GEDCOM Import'
    });
  }

  // Check place events if available
  if (person.placeEvents) {
    person.placeEvents.forEach(event => {
      if (event.placeRaw?.toLowerCase().includes(location.toLowerCase())) {
        facts.push({
          type: event.eventType,
          date: event.yearRange?.[0]?.toString(),
          description: `${EVENT_LABELS[event.eventType] || event.eventType} in ${event.placeRaw}`,
          source: event.source || 'GEDCOM Import'
        });
      }
    });
  }

  // Extract approximate year for historical context
  const getTimeframe = (): string | null => {
    if (person.birthYear) {
      const decade = Math.floor(person.birthYear / 10) * 10;
      return `${decade}s`;
    }
    if (person.birth) {
      const yearMatch = person.birth.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
      if (yearMatch) {
        const decade = Math.floor(parseInt(yearMatch[1]) / 10) * 10;
        return `${decade}s`;
      }
    }
    return null;
  };

  const fetchHistoricalContext = async () => {
    const timeframe = getTimeframe();
    if (!timeframe) return;

    setLoadingContext(true);
    try {
      const { data, error } = await supabase.functions.invoke('historical-context', {
        body: {
          timeframe,
          location,
          migrationPattern: true
        }
      });

      if (error) throw error;
      
      setHistoricalContext(data.context);
      setContextProvider(data.provider || 'unknown');
    } catch (err) {
      console.error('Failed to fetch historical context:', err);
      setHistoricalContext('Unable to load historical context. Please try again later.');
    } finally {
      setLoadingContext(false);
    }
  };

  const timeframe = getTimeframe();

  return (
    <Card className="w-full max-w-md border-dirk-300 dark:border-dirk-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-dirk-100 dark:bg-dirk-800">
              <MapPin className="h-5 w-5 text-dirk-600 dark:text-dirk-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{location}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {facts.length} supporting fact{facts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Person Info */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <span className="text-sm font-medium">{person.name || 'Unknown'}</span>
          {person.birth && (
            <Badge variant="outline" className="text-xs">
              {person.birth}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Facts List */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Why This Location?
          </h4>
          
          {facts.length > 0 ? (
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {facts.map((fact, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-lg">{EVENT_ICONS[fact.type] || '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{fact.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {fact.date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {fact.date}
                          </span>
                        )}
                        {fact.source && (
                          <span className="text-xs text-muted-foreground">
                            • {fact.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No direct records found. This location may be inferred from family data.
            </p>
          )}
        </div>

        {/* Other People at Location */}
        {allPeopleAtLocation.length > 1 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Others at This Location ({allPeopleAtLocation.length - 1})
              </h4>
              <div className="flex flex-wrap gap-1">
                {allPeopleAtLocation
                  .filter(p => p.id !== person.id)
                  .slice(0, 5)
                  .map(p => (
                    <Badge key={p.id} variant="secondary" className="text-xs">
                      {p.surname || p.name?.split(' ').pop() || 'Unknown'}
                    </Badge>
                  ))}
                {allPeopleAtLocation.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{allPeopleAtLocation.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        {/* Historical Context */}
        <Separator />
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Historical Context
            </h4>
            {contextProvider && (
              <Badge variant="outline" className="text-xs">
                via {contextProvider}
              </Badge>
            )}
          </div>
          
          {historicalContext ? (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              {historicalContext}
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={fetchHistoricalContext}
              disabled={loadingContext || !timeframe}
            >
              {loadingContext ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {timeframe 
                    ? `What was ${location} like in the ${timeframe}?`
                    : 'Need dates for historical context'
                  }
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default LocationFactsPanel;
