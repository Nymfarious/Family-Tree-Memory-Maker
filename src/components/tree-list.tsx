import { useMemo, useState } from "react";
import { PersonCard } from "./person-card";
import type { Person, Family } from "@/types/gedcom";
import { cn } from "@/lib/utils";
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

type SortOrder = 'asc' | 'desc';

export function TreeList({ roots, people, childToParents, families, onFocus }: TreeListProps) {
  const [showMaternal, setShowMaternal] = useState(true);
  const [showPaternal, setShowPaternal] = useState(true);
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

  // Get maternal and paternal lines - consecutive generations from center person (default 6 generations)
  const { maternalLine, paternalLine } = useMemo(() => {
    const maternal: string[] = [];
    const paternal: string[] = [];

    if (!centerPerson) return { maternalLine: maternal, paternalLine: paternal };

    // Get generation limits from preferences
    const treeFilters = localStorage.getItem('tree-filter-preferences');
    const maxMaternalGens = treeFilters ? JSON.parse(treeFilters).maternalGenerations || 6 : 6;
    const maxPaternalGens = treeFilters ? JSON.parse(treeFilters).paternalGenerations || 6 : 6;

    // Find parents of center person
    const familyId = Object.keys(families).find(fid => {
      const fam = families[fid];
      return fam.children?.includes(centerPerson);
    });

    if (!familyId) return { maternalLine: maternal, paternalLine: paternal };

    const family = families[familyId];
    const motherId = family.wife;
    const fatherId = family.husb;

    // Build consecutive generation lineage (parents, then grandparents, etc.) up to max generations
    const buildLineage = (personId: string, lineage: string[], maxGens: number, currentGen: number = 0) => {
      if (!personId || currentGen >= maxGens) return;
      
      // Add this person first
      lineage.push(personId);
      
      // Find this person's parents
      const personFamilyId = Object.keys(families).find(fid => {
        const fam = families[fid];
        return fam.children?.includes(personId);
      });
      
      if (personFamilyId) {
        const parents = childToParents[personId] || [];
        
        // Add parents in order, then recurse for each
        parents.forEach(parentId => {
          buildLineage(parentId, lineage, maxGens, currentGen + 1);
        });
      }
    };

    if (motherId) buildLineage(motherId, maternal, maxMaternalGens);
    if (fatherId) buildLineage(fatherId, paternal, maxPaternalGens);

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

        {/* Lineage Filter Toggles */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Label className="text-sm font-medium">Show:</Label>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-paternal"
                checked={showPaternal}
                onChange={(e) => setShowPaternal(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="show-paternal" className="font-normal cursor-pointer">Paternal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-maternal"
                checked={showMaternal}
                onChange={(e) => setShowMaternal(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="show-maternal" className="font-normal cursor-pointer">Maternal</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Display */}
      {/* Always show center person card */}
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

      {(showMaternal || showPaternal) && (
        <div className="space-y-6">
          {/* Navigation Arrows for Expanded View */}
          {expandedSide && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedSide(expandedSide === 'paternal' ? 'maternal' : 'paternal')}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {expandedSide === 'paternal' ? 'Show Maternal' : 'Show Paternal'}
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
                onClick={() => setExpandedSide(expandedSide === 'paternal' ? 'maternal' : 'paternal')}
              >
                {expandedSide === 'paternal' ? 'Show Maternal' : 'Show Paternal'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Two Column Layout or Expanded View */}
          {expandedSide === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Paternal Line - Always First Column */}
              <div className="space-y-3" style={{ visibility: showPaternal ? 'visible' : 'hidden' }}>
                {showPaternal && (
                  <>
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
                  </>
                )}
              </div>

              {/* Maternal Line - Always Second Column */}
              <div className="space-y-3" style={{ visibility: showMaternal ? 'visible' : 'hidden' }}>
                {showMaternal && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className={cn(
                "text-lg font-semibold flex items-center gap-2 border-b border-border pb-2",
                expandedSide === 'paternal' ? "text-genealogy-male" : "text-genealogy-female"
              )}>
                <span className={cn(
                  "w-3 h-3 rounded-full",
                  expandedSide === 'paternal' ? "bg-genealogy-male" : "bg-genealogy-female"
                )}></span>
                {expandedSide === 'paternal' ? 'Paternal Line' : 'Maternal Line'} (Expanded)
              </h3>
              <ul className="space-y-4">
                {(expandedSide === 'paternal' ? paternalLine : maternalLine).length > 0 ? (
                  (sortOrder === 'asc' 
                    ? (expandedSide === 'paternal' ? paternalLine : maternalLine)
                    : [...(expandedSide === 'paternal' ? paternalLine : maternalLine)].reverse()
                  ).map(pid => renderPerson(pid))
                ) : (
                  <p className="text-muted-foreground text-sm">No lineage data</p>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
