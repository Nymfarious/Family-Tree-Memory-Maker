import { useMemo, useState } from "react";
import { PersonCard } from "./person-card";
import type { Person, Family } from "@/types/gedcom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Circle, 
  Slice, 
  Users, 
  User,
  Maximize2,
  Minimize2,
  Settings2
} from "lucide-react";

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
  angle: number; // Store calculated angle for rendering
}

type ViewStyle = 'full-circle' | 'half-fan' | 'quarter-fan';
type LineageFilter = 'both' | 'maternal' | 'paternal';

export function CircularTreeView({
  rootPerson,
  people,
  childToParents,
  families,
  onFocus
}: CircularTreeViewProps) {
  const [selectedPerson, setSelectedPerson] = useState<string>(rootPerson);
  const [lineageFilter, setLineageFilter] = useState<LineageFilter>('both');
  const [viewStyle, setViewStyle] = useState<ViewStyle>('half-fan');
  const [maxGenerations, setMaxGenerations] = useState<number>(5);
  const [compactCards, setCompactCards] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // View style angles
  const getViewAngles = (style: ViewStyle): { start: number; end: number } => {
    switch (style) {
      case 'full-circle':
        return { start: 0, end: 360 };
      case 'half-fan':
        return { start: -90, end: 90 };
      case 'quarter-fan':
        return { start: -45, end: 45 };
      default:
        return { start: -90, end: 90 };
    }
  };

  const positions = useMemo(() => {
    const result: PersonPosition[] = [];
    const visited = new Set<string>();
    const viewAngles = getViewAngles(viewStyle);

    // Build family tree structure going backwards (to ancestors)
    function addAncestors(pid: string, generation: number, startAngle: number, endAngle: number) {
      if (visited.has(pid) || generation > maxGenerations) return;
      visited.add(pid);

      const parents = childToParents[pid] || [];
      
      // Filter parents based on lineage selection
      let filteredParents = parents;
      if (lineageFilter !== 'both' && parents.length >= 1) {
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
      
      const angleRange = endAngle - startAngle;
      const anglePerParent = filteredParents.length > 0 ? angleRange / filteredParents.length : 0;

      filteredParents.forEach((parentId, idx) => {
        const parentStartAngle = startAngle + (anglePerParent * idx);
        const parentEndAngle = parentStartAngle + anglePerParent;
        const parentAngle = (parentStartAngle + parentEndAngle) / 2;

        result.push({
          pid: parentId,
          generation: generation + 1,
          index: idx,
          total: filteredParents.length,
          angle: parentAngle
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
      total: 1,
      angle: 0
    });

    // Add ancestors
    addAncestors(selectedPerson, 0, viewAngles.start, viewAngles.end);

    return result;
  }, [selectedPerson, childToParents, lineageFilter, families, maxGenerations, viewStyle]);

  const getPositionStyle = (pos: PersonPosition) => {
    const { generation, angle } = pos;
    
    if (generation === 0) {
      // Center position for root person
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10
      };
    }

    // Radius increases with each generation
    const baseRadius = compactCards ? 100 : 140;
    const radiusIncrement = compactCards ? 100 : 160;
    const radius = baseRadius + (generation * radiusIncrement);

    // Convert to Cartesian coordinates
    const angleRad = (angle * Math.PI) / 180;
    
    // Adjust for viewport - scale based on view style
    const scaleFactor = viewStyle === 'full-circle' ? 3.5 : viewStyle === 'quarter-fan' ? 5 : 4;
    const x = 50 + (radius * Math.cos(angleRad)) / scaleFactor;
    const y = 50 + (radius * Math.sin(angleRad)) / scaleFactor;

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

  // Count ancestors by generation
  const generationCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    positions.forEach(pos => {
      counts[pos.generation] = (counts[pos.generation] || 0) + 1;
    });
    return counts;
  }, [positions]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Circle className="h-5 w-5" />
              Circular Pedigree
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {positions.length} people
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View settings</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
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

            {/* View Style */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">View Style</Label>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewStyle === 'full-circle' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewStyle('full-circle')}
                    >
                      <Circle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Full Circle (360°)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewStyle === 'half-fan' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewStyle('half-fan')}
                    >
                      <Slice className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Half Fan (180°)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewStyle === 'quarter-fan' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewStyle('quarter-fan')}
                    >
                      <Slice className="h-4 w-4 rotate-45" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quarter Fan (90°)</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Lineage Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lineage</Label>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={lineageFilter === 'both' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLineageFilter('both')}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Both Parents</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={lineageFilter === 'paternal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLineageFilter('paternal')}
                      className={lineageFilter === 'paternal' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Paternal Only (Father's Side)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={lineageFilter === 'maternal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLineageFilter('maternal')}
                      className={lineageFilter === 'maternal' ? 'bg-pink-600 hover:bg-pink-700' : ''}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Maternal Only (Mother's Side)</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Advanced Settings (collapsible) */}
          {showSettings && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
              {/* Generations Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Max Generations</Label>
                  <Badge variant="secondary">{maxGenerations}</Badge>
                </div>
                <Slider
                  value={[maxGenerations]}
                  onValueChange={(v) => setMaxGenerations(v[0])}
                  min={2}
                  max={11}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2</span>
                  <span>11</span>
                </div>
              </div>

              {/* Compact Mode Toggle */}
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="compact-mode" className="text-sm">Compact Cards</Label>
                  <p className="text-xs text-muted-foreground">Show smaller cards for better overview</p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={compactCards}
                  onCheckedChange={setCompactCards}
                />
              </div>
            </div>
          )}

          {/* Generation Stats */}
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(generationCounts).map(([gen, count]) => (
              <Badge key={gen} variant="outline" className="text-xs">
                Gen {gen}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tree Visualization */}
      <div className="relative w-full h-[800px] bg-gradient-to-br from-background via-card to-background rounded-lg border border-border overflow-hidden">
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {positions.map(pos => {
            if (pos.generation === 0) return null;
            
            // Find the child of this person (the person one generation down)
            const childPos = positions.find(p => {
              const parentsOfChild = childToParents[p.pid] || [];
              return parentsOfChild.includes(pos.pid);
            });
            
            if (!childPos) return null;

            const parentStyle = getPositionStyle(pos);
            const childStyle = getPositionStyle(childPos);

            const x1 = parseFloat(String(parentStyle.left));
            const y1 = parseFloat(String(parentStyle.top));
            const x2 = parseFloat(String(childStyle.left));
            const y2 = parseFloat(String(childStyle.top));

            // Color based on lineage
            const person = people[pos.pid];
            const isFemale = person?.sex?.toLowerCase() === 'f' || person?.sex?.toLowerCase() === 'female';
            const strokeColor = isFemale 
              ? 'hsl(var(--genealogy-female))' 
              : 'hsl(var(--genealogy-male))';

            return (
              <line
                key={`line-${pos.pid}-to-${childPos.pid}`}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={strokeColor}
                strokeWidth="2"
                strokeOpacity="0.4"
              />
            );
          })}
        </svg>

        {/* Person cards */}
        {positions.map(pos => (
          <div
            key={`card-${pos.pid}-gen${pos.generation}-idx${pos.index}`}
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
                showPin={true}
                compact={compactCards}
                className={cn(
                  "shadow-lg",
                  pos.generation === 0 && "ring-2 ring-primary",
                  compactCards ? "w-[160px]" : "w-[200px]"
                )}
              />
            </div>
          </div>
        ))}

        {/* No ancestors message */}
        {positions.length === 1 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4 bg-muted/80 rounded-lg">
              <p className="text-muted-foreground">No ancestors found for this person.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try selecting a different person or check your GEDCOM data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
