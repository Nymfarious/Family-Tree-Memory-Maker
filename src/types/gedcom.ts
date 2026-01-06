// ============================================================================
// FAMILY TREE MEMORY MAKER - GEDCOM & PERSON TYPES
// Enhanced type definitions for genealogical data
// Replaces minimal types/gedcom.ts
// ============================================================================

// ============================================================================
// CORE PERSON TYPE
// ============================================================================

export interface Person {
  id: string;
  gedcomId?: string;
  
  // Names
  name?: string;
  surname?: string;
  nickname?: string;
  maidenName?: string;
  
  // Basic info
  sex?: 'M' | 'F' | 'X';
  
  // Dates (store raw string + computed year)
  birth?: string;
  birthYear?: number;
  birthPlace?: string;
  
  death?: string;
  deathYear?: number;
  deathPlace?: string;
  
  // Family links
  famc?: string;           // Family as child
  fams?: string[];         // Families as spouse
  
  // Extended info
  occupation?: string;
  education?: string;
  religion?: string;
  
  // Media
  audioFiles?: string[];
  documents?: string[];
  photos?: string[];
  notes?: string;
  
  // Organizations & Affiliations
  organizations?: OrganizationMembership[];
  
  // Military service
  militaryService?: MilitaryService[];
  
  // Immigration
  immigration?: ImmigrationRecord;
  
  // Place timeline (for migration tracking)
  placeEvents?: PlaceEvent[];
  
  // Computed fields (set during processing)
  generationIndex?: number;
  motherAgeAtBirth?: number;
  fatherAgeAtBirth?: number;
  lineageSignature?: string;  // Path from root for recombination detection
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  source?: string;  // Where this data came from
}

// ============================================================================
// FAMILY TYPE
// ============================================================================

export interface Family {
  id: string;
  gedcomId?: string;
  
  husb?: string;
  wife?: string;
  children?: string[];
  
  marriageDate?: string;
  marriageYear?: number;
  marriagePlace?: string;
  
  divorceDate?: string;
  
  // Recombination detection
  isRecombination?: boolean;
  sharedAncestorIds?: string[];
  relationshipDistance?: string;  // "4th cousins", etc.
  
  notes?: string;
}

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export type OrganizationCategory = 
  | 'lineage_revolutionary'
  | 'lineage_colonial'
  | 'lineage_texas'
  | 'lineage_civil_war'
  | 'lineage_war_1812'
  | 'lineage_immigration'
  | 'first_families'
  | 'hereditary_military'
  | 'fraternal'
  | 'religious'
  | 'military_unit'
  | 'civic'
  | 'other';

export interface OrganizationMembership {
  organizationId: string;
  customName?: string;
  category: OrganizationCategory;
  
  // Membership details
  membershipNumber?: string;
  rank?: string;
  joinDate?: string;
  endDate?: string;
  location?: string;
  chapter?: string;
  
  // For lineage societies
  isQualifyingAncestor?: boolean;
  qualifyingEvent?: string;
  qualifyingUnit?: string;
  applicationNumber?: string;
  proofDocuments?: string[];
  
  notes?: string;
}

// ============================================================================
// MILITARY SERVICE
// ============================================================================

export interface MilitaryService {
  branch: string;
  unit?: string;
  rank?: string;
  serviceStart?: string;
  serviceEnd?: string;
  wars?: string[];
  battles?: string[];
  pensionNumber?: string;
  serviceNumber?: string;
  notes?: string;
}

// ============================================================================
// IMMIGRATION RECORD
// ============================================================================

export interface ImmigrationRecord {
  arrivalDate?: string;
  arrivalYear?: number;
  arrivalPort?: string;
  shipName?: string;
  originCountry?: string;
  originCity?: string;
  naturalizationDate?: string;
  naturalizationPlace?: string;
  alienRegistrationNumber?: string;
  notes?: string;
}

// ============================================================================
// PLACE TYPES (for migration tracking)
// ============================================================================

export interface PlaceHierarchy {
  country?: string;
  region?: string;      // New England, Mid-Atlantic, etc.
  state?: string;
  county?: string;
  city?: string;
  site?: string;        // Parish, fort, etc.
}

export interface PlaceEvent {
  yearRange: [number | null, number | null];
  placeRaw: string;
  placeNorm?: PlaceHierarchy;
  geo?: [number, number];  // [lat, lng]
  eventType: 'birth' | 'marriage' | 'death' | 'residence' | 'census' | 'immigration' | 'military' | 'land' | 'probate';
  source?: string;
}

// ============================================================================
// GEDCOM DATA STRUCTURE
// ============================================================================

export interface GedcomData {
  people: Record<string, Person>;
  families: Record<string, Family>;
  
  // Quick lookups (built during parsing)
  childToParents: Record<string, string[]>;
  parentToChildren: Record<string, string[]>;
  spouseLinks: Record<string, string[]>;
  
  // Tree structure
  roots: string[];  // People with no parents in tree
  
  // Metadata
  source?: string;
  importedAt?: string;
  version?: string;
  totalPeople?: number;
  totalFamilies?: number;
  generationCount?: number;
}

// ============================================================================
// VIEW & UI TYPES
// ============================================================================

export type ViewType = 'list' | 'circular' | 'radial' | 'map' | 'timeline';

export type SortField = 'name' | 'surname' | 'birth' | 'death' | 'location' | 'generation';

export type GroupByField = 'surname' | 'location' | 'occupation' | 'generation' | 'organization' | 'migration' | null;

export interface TreeViewState {
  viewType: ViewType;
  focusPersonId?: string;
  generations: number;
  sortBy: SortField;
  sortDirection: 'asc' | 'desc';
  groupBy: GroupByField;
  searchTerm: string;
  filters: {
    sex?: ('M' | 'F' | 'X')[];
    living?: boolean;
    hasAudio?: boolean;
    hasPhotos?: boolean;
    hasOrganizations?: boolean;
    placeFilter?: string;
    dateRange?: [number, number];
  };
}

// ============================================================================
// RADIAL PEDIGREE TYPES
// ============================================================================

export interface RadialWedge {
  personId: string;
  generation: number;
  angleStart: number;
  angleEnd: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  
  // Branch summary (for aggregate zoom)
  branchStats?: BranchSummary;
}

export interface BranchSummary {
  knownCount: number;
  unknownCount: number;
  completeness: number;
  dominantPlaces: string[];
  migrationSpine: Array<{ gen: number; place: string }>;
  avgMotherAge?: number;
  earliestYear?: number;
  recombinationsWith?: string[];
}

export type SemanticZoomLevel = 'full' | 'compact' | 'glyph' | 'aggregate';

export interface RadialPedigreeState {
  rootPersonId: string;
  maxGenerations: number;
  angleDomain: [number, number];  // Current view angle range
  zoomLevel: SemanticZoomLevel;
  selectedWedgeId?: string;
  highlightedPlaces?: string[];
  showRecombinations: boolean;
  theme: 'classic' | 'parchment' | 'colorWheel' | 'constellation';
}

// ============================================================================
// LINEAGE SOCIETY REFERENCE DATA
// ============================================================================

export interface LineageSociety {
  id: string;
  name: string;
  abbreviation: string;
  category: OrganizationCategory;
  foundedYear?: number;
  website?: string;
  
  requirements: {
    description: string;
    qualifyingEvents: string[];
    qualifyingDateRange?: { start: string; end: string };
    qualifyingLocations?: string[];
    lineageType: 'direct' | 'collateral' | 'either';
    genderRestriction?: 'male' | 'female' | 'none';
  };
  
  icon: string;
  color: string;
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isPerson(obj: unknown): obj is Person {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

export function hasOrganizations(person: Person): boolean {
  return Boolean(person.organizations && person.organizations.length > 0);
}

export function hasMilitaryService(person: Person): boolean {
  return Boolean(person.militaryService && person.militaryService.length > 0);
}

export function isLiving(person: Person): boolean {
  return !person.death && !person.deathYear;
}

export function getDisplayName(person: Person): string {
  if (person.name && person.surname) {
    return `${person.name} ${person.surname}`;
  }
  return person.name || person.surname || 'Unknown';
}

export function getLifespan(person: Person): string {
  const birth = person.birthYear || person.birth || '?';
  const death = person.deathYear || person.death;
  if (death) {
    return `${birth} - ${death}`;
  }
  return `b. ${birth}`;
}
