import { useMemo, useState } from "react";
import { PersonCard } from "./person-card";
import type { Person, Family } from "@/types/gedcom";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TreeListProps {
  roots: string[];
  people: Record<string, Person>;
  childToParents: Record<string, string[]>;
  families: Record<string, Family>;
  onFocus?: (pid: string) => void;
}

type LineageFilter = 'both' | 'maternal' | 'paternal';
type SortOrder = 'asc' | 'desc';

export function TreeList({ roots, people, childToParents, families, onFocus }: TreeListProps) {
  const [lineageFilter, setLineageFilter] = useState<LineageFilter>('both');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [centerPerson, setCenterPerson] = useState<string>(roots[0] || '');
  const [expandedSide, setExpandedSide] = useState<'maternal' | 'paternal' | null>(null);

  // Build children-by-parent map
  const childrenByParent = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const family of Object.values(families)) {
      const kids = family.children || [];
      const parents = [family.husb, family.wife].filter(Boolean);
      for (const parent of parents) {
        if (parent) {
          map[parent] = map[parent] || new Set();
          for (const kid of kids) {
            map[parent].add(kid);
          }
        }
      }
    }
    return map;
  }, [families]);

  // Get maternal and paternal lines - consecutive generations from center person
  const { maternalLine, paternalLine } = useMemo(() => {
    const maternal: string[] = [];
    const paternal: string[] = [];

    if (!centerPerson) return { maternalLine: maternal, paternalLine: paternal };

    // Find parents of center person
    const familyId = Object.keys(families).find(fid => {
      const fam = families[fid];
      return fam.children?.includes(centerPerson);
    });

    if (!familyId) return { maternalLine: maternal, paternalLine: paternal };

    const family = families[familyId];
    const motherId = family.wife;
    const fatherId = family.husb;

    // Build consecutive generation lineage (parents, then grandparents, etc.)
    const buildLineage = (personId: string, lineage: string[]) => {
      if (!personId) return;
      
      // Add this person first
      lineage.push(personId);
      
      // Find this person's parents
      const personFamilyId = Object.keys(families).find(fid => {
        const fam = families[fid];
        return fam.children?.includes(personId);
      });
      
      if (personFamilyId) {
        const parentFamily = families[personFamilyId];
        const parents = childToParents[personId] || [];
        
        // Add parents in order, then recurse for each
        parents.forEach(parentId => {
          buildLineage(parentId, lineage);
        });
      }
    };

    if (motherId) buildLineage(motherId, maternal);
    if (fatherId) buildLineage(fatherId, paternal);

    return { maternalLine: maternal, paternalLine: paternal };
  }, [centerPerson, childToParents, families]);

  const renderPerson = (pid: string): JSX.Element => {
    return (
      <li key={pid} className="relative">
        <PersonCard 
          pid={pid} 
          people={people} 
          childToParents={childToParents} 
          onFocus={onFocus}
          className="mb-3"
        />
      </li>
    );
  };

  const peopleList = Object.entries(people)
    .map(([pid, person]) => ({ pid, name: person.name || 'Unknown' }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-4 p-4 rounded-lg border border-border bg-card/50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Center Person Selector */}
          <div className="flex-1 space-y-2">
            <Label htmlFor="center-person-select" className="text-sm font-medium">Center Person</Label>
            <Select value={centerPerson} onValueChange={setCenterPerson}>
              <SelectTrigger id="center-person-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {peopleList.map(({ pid, name }) => (
                  <SelectItem key={pid} value={pid}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="sort-order" className="text-sm font-medium">Sort Order</Label>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
              <SelectTrigger id="sort-order" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lineage Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Show Lineage</Label>
          <RadioGroup value={lineageFilter} onValueChange={(value) => setLineageFilter(value as LineageFilter)} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="list-both" />
              <Label htmlFor="list-both" className="font-normal cursor-pointer">Both</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="maternal" id="list-maternal" />
              <Label htmlFor="list-maternal" className="font-normal cursor-pointer">Maternal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="paternal" id="list-paternal" />
              <Label htmlFor="list-paternal" className="font-normal cursor-pointer">Paternal</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Tree Display */}
      {lineageFilter === 'both' ? (
        <div className="space-y-6">
          {/* Center Person Card - Pinned at Top */}
          {centerPerson && (
            <div className="flex justify-center">
              <PersonCard 
                pid={centerPerson} 
                people={people} 
                childToParents={childToParents} 
                onFocus={onFocus}
                showPin={true}
                className="ring-2 ring-primary shadow-lg"
              />
            </div>
          )}

          {/* Navigation Arrows for Expanded View */}
          {expandedSide && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedSide(expandedSide === 'maternal' ? 'paternal' : 'maternal')}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {expandedSide === 'maternal' ? 'Show Paternal' : 'Show Maternal'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedSide(null)}
              >
                Show Both
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedSide(expandedSide === 'maternal' ? 'paternal' : 'maternal')}
              >
                {expandedSide === 'maternal' ? 'Show Paternal' : 'Show Maternal'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Two Column Layout or Expanded View */}
          {expandedSide === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Maternal Line */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-genealogy-female flex items-center gap-2 border-b border-border pb-2">
                    <span className="w-3 h-3 rounded-full bg-genealogy-female"></span>
                    Maternal Line
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedSide('maternal')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-4">
                  {maternalLine.length > 0 ? (
                    (sortOrder === 'asc' ? maternalLine : [...maternalLine].reverse()).map(pid => renderPerson(pid))
                  ) : (
                    <p className="text-muted-foreground text-sm">No maternal lineage data</p>
                  )}
                </ul>
              </div>

              {/* Paternal Line */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-genealogy-male flex items-center gap-2 border-b border-border pb-2">
                    <span className="w-3 h-3 rounded-full bg-genealogy-male"></span>
                    Paternal Line
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedSide('paternal')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-4">
                  {paternalLine.length > 0 ? (
                    (sortOrder === 'asc' ? paternalLine : [...paternalLine].reverse()).map(pid => renderPerson(pid))
                  ) : (
                    <p className="text-muted-foreground text-sm">No paternal lineage data</p>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className={cn(
                "text-lg font-semibold flex items-center gap-2 border-b border-border pb-2",
                expandedSide === 'maternal' ? "text-genealogy-female" : "text-genealogy-male"
              )}>
                <span className={cn(
                  "w-3 h-3 rounded-full",
                  expandedSide === 'maternal' ? "bg-genealogy-female" : "bg-genealogy-male"
                )}></span>
                {expandedSide === 'maternal' ? 'Maternal Line' : 'Paternal Line'} (Expanded)
              </h3>
              <ul className="space-y-4">
                {(expandedSide === 'maternal' ? maternalLine : paternalLine).length > 0 ? (
                  (sortOrder === 'asc' 
                    ? (expandedSide === 'maternal' ? maternalLine : paternalLine)
                    : [...(expandedSide === 'maternal' ? maternalLine : paternalLine)].reverse()
                  ).map(pid => renderPerson(pid))
                ) : (
                  <p className="text-muted-foreground text-sm">No lineage data</p>
                )}
              </ul>
            </div>
          )}
        </div>
      ) : lineageFilter === 'maternal' ? (
        <ul className="space-y-4">
          {maternalLine.length > 0 ? (
            (sortOrder === 'asc' ? maternalLine : [...maternalLine].reverse()).map(pid => renderPerson(pid))
          ) : (
            <p className="text-muted-foreground">No maternal lineage data</p>
          )}
        </ul>
      ) : (
        <ul className="space-y-4">
          {paternalLine.length > 0 ? (
            (sortOrder === 'asc' ? paternalLine : [...paternalLine].reverse()).map(pid => renderPerson(pid))
          ) : (
            <p className="text-muted-foreground">No paternal lineage data</p>
          )}
        </ul>
      )}
    </div>
  );
}
