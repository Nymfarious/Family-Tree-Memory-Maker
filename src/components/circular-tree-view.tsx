import { useMemo } from "react";
import { PersonCard } from "./person-card";
import type { Person, Family } from "@/types/gedcom";
import { cn } from "@/lib/utils";

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
  const positions = useMemo(() => {
    const result: PersonPosition[] = [];
    const visited = new Set<string>();

    // Build family tree structure going backwards (to ancestors)
    function addAncestors(pid: string, generation: number, startAngle: number, endAngle: number) {
      if (visited.has(pid) || generation > 4) return;
      visited.add(pid);

      const parents = childToParents[pid] || [];
      const angleRange = endAngle - startAngle;
      const anglePerParent = parents.length > 0 ? angleRange / parents.length : 0;

      parents.forEach((parentId, idx) => {
        const parentStartAngle = startAngle + (anglePerParent * idx);
        const parentEndAngle = parentStartAngle + anglePerParent;
        const parentAngle = (parentStartAngle + parentEndAngle) / 2;

        result.push({
          pid: parentId,
          generation: generation + 1,
          index: idx,
          total: parents.length
        });

        // Recursively add grandparents
        addAncestors(parentId, generation + 1, parentStartAngle, parentEndAngle);
      });
    }

    // Start with root person at center (generation 0)
    result.push({
      pid: rootPerson,
      generation: 0,
      index: 0,
      total: 1
    });

    // Add ancestors in a semi-circle (180 degrees)
    addAncestors(rootPerson, 0, -90, 90);

    return result;
  }, [rootPerson, childToParents]);

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

  return (
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
  );
}
