import { useMemo, useState } from "react";
import { PersonCard } from "./person-card";
import type { Person, Family } from "@/types/gedcom";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Get maternal and paternal lines
  const { maternalLine, paternalLine } = useMemo(() => {
    const maternal: string[] = [];
    const paternal: string[] = [];

    if (!centerPerson) return { maternalLine: maternal, paternalLine: paternal };

    // Find parents of center person
    const parents = childToParents[centerPerson] || [];
    const familyId = Object.keys(families).find(fid => {
      const fam = families[fid];
      return fam.children?.includes(centerPerson);
    });

    if (!familyId) return { maternalLine: maternal, paternalLine: paternal };

    const family = families[familyId];
    const motherId = family.wife;
    const fatherId = family.husb;

    // Build lineages recursively
    const buildLineage = (personId: string, lineage: string[]) => {
      if (!personId) return;
      lineage.push(personId);
      const kids = Array.from(childrenByParent[personId] || []);
      kids.forEach(kid => buildLineage(kid, lineage));
    };

    if (motherId) buildLineage(motherId, maternal);
    if (fatherId) buildLineage(fatherId, paternal);

    return { maternalLine: maternal, paternalLine: paternal };
  }, [centerPerson, childToParents, families, childrenByParent]);

  const renderSubtree = (pid: string, depth = 0): JSX.Element => {
    const kids = Array.from(childrenByParent[pid] || []);
    
    return (
      <li key={`${pid}-${depth}`} className="relative">
        <PersonCard 
          pid={pid} 
          people={people} 
          childToParents={childToParents} 
          onFocus={onFocus}
          className="mb-3"
        />
        {kids.length > 0 && (
          <ul className={cn(
            "ml-6 mt-2 space-y-2 border-l-2 border-tree-line pl-4",
            "relative before:absolute before:top-0 before:left-0 before:w-2 before:h-2 before:bg-tree-line before:rounded-full before:-translate-x-1"
          )}>
            {kids.map(kid => renderSubtree(kid, depth + 1))}
          </ul>
        )}
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

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Maternal Line */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-genealogy-female flex items-center gap-2 border-b border-border pb-2">
                <span className="w-3 h-3 rounded-full bg-genealogy-female"></span>
                Maternal Line
              </h3>
              <ul className="space-y-4">
                {maternalLine.length > 0 ? (
                  maternalLine.map(pid => renderSubtree(pid))
                ) : (
                  <p className="text-muted-foreground text-sm">No maternal lineage data</p>
                )}
              </ul>
            </div>

            {/* Paternal Line */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-genealogy-male flex items-center gap-2 border-b border-border pb-2">
                <span className="w-3 h-3 rounded-full bg-genealogy-male"></span>
                Paternal Line
              </h3>
              <ul className="space-y-4">
                {paternalLine.length > 0 ? (
                  paternalLine.map(pid => renderSubtree(pid))
                ) : (
                  <p className="text-muted-foreground text-sm">No paternal lineage data</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : lineageFilter === 'maternal' ? (
        <ul className="space-y-4">
          {maternalLine.length > 0 ? (
            maternalLine.map(pid => renderSubtree(pid))
          ) : (
            <p className="text-muted-foreground">No maternal lineage data</p>
          )}
        </ul>
      ) : (
        <ul className="space-y-4">
          {paternalLine.length > 0 ? (
            paternalLine.map(pid => renderSubtree(pid))
          ) : (
            <p className="text-muted-foreground">No paternal lineage data</p>
          )}
        </ul>
      )}
    </div>
  );
}
