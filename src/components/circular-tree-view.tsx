import { useMemo, useState, useEffect } from "react";
import { PersonCard } from "./person-card";
import type { Person, Family } from "@/types/gedcom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Settings2,
  Search,
  AlertTriangle
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
  angle: number;
}

type ViewStyle = 'full-circle' | 'half-fan' | 'quarter-fan';
type LineageFilter = 'both' | 'maternal' | 'paternal';
type SortBy = 'name' | 'surname' | 'birth';

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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  // Update selected person when rootPerson changes
  useEffect(() => {
    if (rootPerson && people[rootPerson]) {
      setSelectedPerson(rootPerson);
    }
  }, [rootPerson, people]);

  // DEBUG: Log the data structure to help identify issues
  useEffect(() => {
    console.log('CircularTreeView Debug:', {
      selectedPerson,
      peopleCount: Object.keys(people).length,
      familiesCount: Object.keys(families).length,
      childToParentsCount: Object.keys(childToParents).length,
      selectedPersonData: people[selectedPerson],
      parentsOfSelected: childToParents[selectedPerson]
    });
  }, [selectedPerson, people, families, childToParents]);

  // Build childToParents from families if not provided or empty
  const effectiveChildToParents = useMemo(() => {
    // If childToParents is provided and has data, use it
    if (childToParents && Object.keys(childToParents).length > 0) {
      return childToParents;
    }
    
    // Otherwise, build it from families
    const built: Record<string, string[]> = {};
    
    Object.values(families).forEach(family => {
      if (family.children) {
        family.children.forEach(childId => {
          if (!built[childId]) {
            built[childId] = [];
          }
          if (family.husb && !built[childId].includes(family.husb)) {
            built[childId].push(family.husb);
          }
          if (family.wife && !built[childId].includes(family.wife)) {
            built[childId].push(family.wife);
          }
        });
      }
    });
    
    console.log('Built childToParents from families:', Object.keys(built).length, 'entries');
    return built;
  }, [childToParents, families]);

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

    // Helper to get parents for a person
    const getParents = (pid: string): string[] => {
      // First try effectiveChildToParents
      let parents = effectiveChildToParents[pid] || [];
      
      // If no parents found, try looking through families
      if (parents.length === 0) {
        const person = people[pid];
        if (person?.famc) {
          const family = families[person.famc];
          if (family) {
            parents = [];
            if (family.husb) parents.push(family.husb);
            if (family.wife) parents.push(family.wife);
          }
        }
      }
      
      return parents;
    };

    // Build family tree structure going backwards (to ancestors)
    function addAncestors(pid: string, generation: number, startAngle: number, endAngle: number) {
      if (visited.has(pid) || generation > maxGenerations) return;
      if (!people[pid]) return; // Skip if person doesn't exist
      
      visited.add(pid);

      const parents = getParents(pid);
      
      // Filter parents based on lineage selection
      let filteredParents = parents.filter(p => people[p]); // Only include existing people
      
      if (lineageFilter !== 'both' && filteredParents.length >= 1) {
        // Find the family to determine which parent is which
        const person = people[pid];
        if (person?.famc) {
          const family = families[person.famc];
          if (family) {
            if (lineageFilter === 'paternal' && family.husb && people[family.husb]) {
              filteredParents = [family.husb];
            } else if (lineageFilter === 'maternal' && family.wife && people[family.wife]) {
              filteredParents = [family.wife];
            }
          }
        }
      }
      
      const angleRange = endAngle - startAngle;
      const anglePerParent = filteredParents.length > 0 ? angleRange / filteredParents.length : 0;

      filteredParents.forEach((parentId, idx) => {
        if (!people[parentId]) return; // Skip non-existent parents
        
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
    if (people[selectedPerson]) {
      result.push({
        pid: selectedPerson,
        generation: 0,
        index: 0,
        total: 1,
        angle: 0
      });

      // Add ancestors
      addAncestors(selectedPerson, 0, viewAngles.start, viewAngles.end);
    }

    console.log('Positions calculated:', result.length, 'people');
    return result;
  }, [selectedPerson, effectiveChildToParents, lineageFilter, families, maxGenerations, viewStyle, people]);

  const getPositionStyle = (pos: PersonPosition) => {
    const { generation, angle } = pos;
    
    if (generation === 0) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10
      };
    }

    const baseRadius = compactCards ? 100 : 140;
    const radiusIncrement = compactCards ? 100 : 160;
    const radius = baseRadius + (generation * radiusIncrement);

    const angleRad = (angle * Math.PI) / 180;
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

  // Get list of all people for selector with search and sort
  const peopleList = useMemo(() => {
    let list = Object.entries(people)
      .map(([pid, person]) => ({ 
        pid, 
        name: person.name || 'Unknown',
        surname: person.surname || '',
        birthYear: person.birthYear || extractYear(person.birth)
      }));
    
    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.surname.toLowerCase().includes(term)
      );
    }
    
    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'surname':
          return (a.surname || 'ZZZ').localeCompare(b.surname || 'ZZZ');
        case 'birth':
          return (a.birthYear || 9999) - (b.birthYear || 9999);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return list;
  }, [people, searchTerm, sortBy]);

  // Count ancestors by generation
  const generationCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    positions.forEach(pos => {
      counts[pos.generation] = (counts[pos.generation] || 0) + 1;
    });
    return counts;
  }, [positions]);

  // Check if we have a data issue
  const hasDataIssue = positions.length <= 1 && Object.keys(people).length > 1;

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
          {/* Data Issue Warning */}
          {hasDataIssue && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-700 dark:text-yellow-300">No ancestors found</p>
                <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                  This person may not have parent relationships in your GEDCOM. Try selecting a different person 
                  who has parents linked, or check your GEDCOM data has FAMC (family as child) tags.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Person Search & Selector */}
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium">Find Person</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">By Name</SelectItem>
                    <SelectItem value="surname">By Surname</SelectItem>
                    <SelectItem value="birth">By Birth Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="Select center person" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {peopleList.map(({ pid, name, surname, birthYear }) => (
                    <SelectItem key={pid} value={pid}>
                      <span className="flex items-center gap-2">
                        {name}
                        {surname && <Badge variant="outline" className="text-xs">{surname}</Badge>}
                        {birthYear && <span className="text-xs text-muted-foreground">b. {birthYear}</span>}
                      </span>
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
                  <TooltipContent>Half Fan (180°) - Classic Pedigree</TooltipContent>
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
                  <TooltipContent>Quarter Fan (90°) - Printable</TooltipContent>
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

          {/* Advanced Settings */}
          {showSettings && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
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
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="compact-mode" className="text-sm">Compact Cards</Label>
                  <p className="text-xs text-muted-foreground">Smaller cards for overview</p>
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
            
            const childPos = positions.find(p => {
              const parentsOfChild = effectiveChildToParents[p.pid] || [];
              return parentsOfChild.includes(pos.pid);
            });
            
            if (!childPos) return null;

            const parentStyle = getPositionStyle(pos);
            const childStyle = getPositionStyle(childPos);

            const x1 = parseFloat(String(parentStyle.left));
            const y1 = parseFloat(String(parentStyle.top));
            const x2 = parseFloat(String(childStyle.left));
            const y2 = parseFloat(String(childStyle.top));

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
                childToParents={effectiveChildToParents}
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

        {/* No ancestors message - only show if truly no data */}
        {positions.length === 1 && Object.keys(people).length > 1 && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center">
            <div className="text-center p-4 bg-card/90 backdrop-blur rounded-lg border shadow-lg max-w-md">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="font-medium">No ancestors found for this person</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try selecting someone who has parent relationships defined in your GEDCOM.
                Look for people with (FAMC) family links.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function
function extractYear(date?: string): number | null {
  if (!date) return null;
  const match = date.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  return match ? parseInt(match[1]) : null;
}
