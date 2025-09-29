import { useMemo } from "react";
import { PersonCard } from "./person-card";
import type { Person, Family } from "@/types/gedcom";
import { cn } from "@/lib/utils";

interface TreeListProps {
  roots: string[];
  people: Record<string, Person>;
  childToParents: Record<string, string[]>;
  families: Record<string, Family>;
  onFocus?: (pid: string) => void;
}

export function TreeList({ roots, people, childToParents, families, onFocus }: TreeListProps) {
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

  return (
    <ul className="space-y-4">
      {roots.map(root => renderSubtree(root))}
    </ul>
  );
}