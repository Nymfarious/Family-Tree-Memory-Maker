import { useMemo, useState } from "react";
import { PersonCard } from "./person-card";
import type { Person, Family } from "@/types/gedcom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface CircularTreeViewProps {
  rootPerson: string;
  people: Record<string, Person>;
  childToParents: Record<string, string[]>;
  families: Record<string, Family>;
  onFocus?: (pid: string) => void;
}

interface PersonPosition {
  pid: string;
  generation: number;
  index: number;
  total: number;
}

export function CircularTreeView({
  rootPerson,
  people,
  childToParents,
  families,
  onFocus
}: CircularTreeViewProps) {
  const [selectedPerson, setSelectedPerson] = useState<string>(rootPerson);
  const [lineageFilter, setLineageFilter] = useState<'both' | 'maternal' | 'paternal'>('both');

  const positions = useMemo(() => {
    const result: PersonPosition[] = [];
    const visited = new Set<string>();

    // Build family tree structure going backwards (to ancestors)
    function addAncestors(pid: string, generation: number, startAngle: number, endAngle: number) {
      if (visited.has(pid) || generation > 4) return;
      visited.add(pid);

      const parents = childToParents[pid] || [];
      
      // Filter parents based on lineage selection
      let filteredParents = parents;
      if (lineageFilter !== 'both' && parents.length === 2) {
        const person = people[pid];
        if (person) {
          // Get the family to determine which parent is which
          const familyId = Object.keys(families).find(fid => {
            const fam = families[fid];
            return fam.children?.includes(pid);
          });
          
          if (familyId) {
            const family = families[familyId];
            const fatherId = family.husb;
            const motherId = family.wife;
            
            if (lineageFilter === 'paternal') {
              filteredParents = fatherId ? [fatherId] : [];
            } else if (lineageFilter === 'maternal') {
              filteredParents = motherId ? [motherId] : [];
            }
          }
        }
      }
      
      const angleRange = endAngle - startAngle;
      const anglePerParent = filteredParents.length > 0 ? angleRange / filteredParents.length : 0;

      filteredParents.forEach((parentId, idx) => {
        const parentStartAngle = startAngle + (anglePerParent * idx);
        const parentEndAngle = parentStartAngle + anglePerParent;

        result.push({
          pid: parentId,
          generation: generation + 1,
          index: idx,
          total: filteredParents.length
        });

        // Recursively add grandparents
        addAncestors(parentId, generation + 1, parentStartAngle, parentEndAngle);
      });
    }

    // Start with selected person at center (generation 0)
    result.push({
      pid: selectedPerson,
      generation: 0,
      index: 0,
      total: 1
    });

    // Add ancestors in a semi-circle (180 degrees)
    addAncestors(selectedPerson, 0, -90, 90);

    return result;
  }, [selectedPerson, childToParents, lineageFilter, people, families]);

  const getPositionStyle = (pos: PersonPosition) => {
    const { generation, index, total } = pos;
    
    if (generation === 0) {
      // Center position for root person
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10
      };
    }

    // Calculate angle for this person (-90 to +90 degrees, semi-circle)
    const angleSpan = 180;
    const startAngle = -90;
    const anglePerPerson = total > 1 ? angleSpan / (total - 1) : 0;
    const angle = startAngle + (anglePerPerson * index);

    // Radius increases with each generation
    const baseRadius = 120;
    const radiusIncrement = 140;
    const radius = baseRadius + (generation * radiusIncrement);

    // Convert to Cartesian coordinates
    const angleRad = (angle * Math.PI) / 180;
    const x = 50 + (radius * Math.cos(angleRad)) / 4; // Divide by 4 to fit in viewport
    const y = 50 + (radius * Math.sin(angleRad)) / 4;

    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: 10 - generation
    };
  };

  // Get list of all people for selector
  const peopleList = Object.entries(people)
    .map(([pid, person]) => ({ pid, name: person.name || 'Unknown' }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-4 p-4 rounded-lg border border-border bg-card/50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Person Selector */}
          <div className="flex-1 space-y-2">
            <Label htmlFor="person-select" className="text-sm font-medium">Center Person</Label>
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger id="person-select">
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

          {/* Lineage Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Show Lineage</Label>
            <RadioGroup value={lineageFilter} onValueChange={(value) => setLineageFilter(value as 'both' | 'maternal' | 'paternal')} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="font-normal cursor-pointer">Both</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maternal" id="maternal" />
                <Label htmlFor="maternal" className="font-normal cursor-pointer">Maternal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paternal" id="paternal" />
                <Label htmlFor="paternal" className="font-normal cursor-pointer">Paternal</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="relative w-full h-[800px] bg-gradient-to-br from-background via-card to-background rounded-lg border border-border overflow-hidden">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {positions.map(pos => {
          if (pos.generation === 0) return null;
          const parents = childToParents[pos.pid] || [];
          const child = positions.find(p => parents.includes(p.pid));
          if (!child) return null;

          const childStyle = getPositionStyle(pos);
          const parentStyle = getPositionStyle(child);

          const x1 = parseFloat(String(childStyle.left));
          const y1 = parseFloat(String(childStyle.top));
          const x2 = parseFloat(String(parentStyle.left));
          const y2 = parseFloat(String(parentStyle.top));

          return (
            <line
              key={`${pos.pid}-${child.pid}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="hsl(var(--tree-line))"
              strokeWidth="2"
              strokeOpacity="0.3"
            />
          );
        })}
      </svg>

      {/* Person cards */}
      {positions.map(pos => (
        <div
          key={pos.pid}
          className="absolute transition-all duration-300"
          style={getPositionStyle(pos)}
        >
          <div
            className={cn(
              "transform hover:scale-105 transition-transform",
              pos.generation === 0 && "scale-110"
            )}
          >
            <PersonCard
              pid={pos.pid}
              people={people}
              childToParents={childToParents}
              onFocus={onFocus}
              className={cn(
                "shadow-lg",
                pos.generation === 0 && "ring-2 ring-primary"
              )}
            />
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
