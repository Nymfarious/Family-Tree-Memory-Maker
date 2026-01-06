# 🌀 Radial Pedigree Timeline - Feature Planning

## Family Tree Memory Maker v2.0 "Autumn Heritage"

---

## 🎯 Vision

A **Radial Pedigree Timeline Viewer** that shows 11 generations of ancestors in a circular/fan layout with:
- Semantic zoom (fractal-like collapse)
- Fan-split zoom (divide and expand a branch)
- Place-based clustering ("nebula regions")
- Migration pattern visualization
- Branch recombination detection (when cousins marry)
- Multiple themes (parchment, color wheel, dark constellation)

---

## 📊 The 11-Generation Scope

Starting from a 1970s birth year:

| Gen | Relationship | Era | Max People |
|-----|--------------|-----|------------|
| 0 | Self (root) | 1970s | 1 |
| 1 | Parents | 1940s-1950s | 2 |
| 2 | Grandparents | 1910s-1920s | 4 |
| 3 | Great-grandparents | 1880s-1890s | 8 |
| 4 | 2nd-great-grandparents | 1850s-1860s | 16 |
| 5 | 3rd-great-grandparents | 1820s-1830s | 32 |
| 6 | 4th-great-grandparents | 1790s-1800s | 64 |
| 7 | 5th-great-grandparents | 1760s-1770s | 128 |
| 8 | 6th-great-grandparents | 1730s-1740s | 256 |
| 9 | 7th-great-grandparents | 1700s-1710s | 512 |
| 10 | 8th-great-grandparents | 1670s-1680s | 1024 |
| 11 | 9th-great-grandparents | 1640s-1650s | 2048 |

**Total theoretical max: 4,095 ancestors** (but pedigree collapse reduces this significantly)

---

## 🎨 Visual Themes

### Theme 1: Classic B&W
- Clean lines, print-friendly
- Like the "B&W Circle Pedigree" image
- Best for: printing, formal reports

### Theme 2: Parchment Heritage
- Warm sepia/aged paper texture
- Serif headers ("Larsen Family" style)
- Autumn Heritage colors
- Best for: display, sharing

### Theme 3: Color Wheel Backdrop
- Quadrant colors behind wedges (the beautiful rainbow wheel)
- Wedges have thin outlines for readability
- Like the "Family History" wall art
- Best for: visual impact, identifying branches quickly

### Theme 4: Dark Constellation ("Dark" Netflix style)
- Deep black/dark blue background
- Nodes glow faintly (like stars)
- Surname clusters get colored "nebula" regions
- Curved "orbit" lines for generations
- Optional: time-travel-style loops for recombinations
- Best for: complex trees, finding patterns, showing off

---

## 📐 Layout Algorithm

### Basic Fan Pedigree Rule
- Root person gets full angle span (360° circle or 180° fan)
- Each generation doubles wedges
- Parent wedges split their parent's angle

### Weighted Split (Better)
- Weight wedge size by "known ancestors in this branch"
- Missing branches visibly shrink
- Dense branches get more space
- Shows data density at a glance

### Wedge Content (per person)
```
┌─────────────────────┐
│ SURNAME, Given      │
│ B: 1847 | D: 1923   │
│ M: 1869             │
│ Mom's age: 24       │
└─────────────────────┘
```

---

## 🔍 Zoom Behaviors

### Semantic Zoom Levels

| Zoom Level | What Shows | Use Case |
|------------|------------|----------|
| **Full** | Name + B/D/M + mother's age | Reading individual records |
| **Compact** | Surname + years (e.g., "Smith 1847-1923") | Scanning |
| **Glyph** | Colored dots only | Overview, pattern finding |
| **Aggregate** | Branch summary (known/unknown counts, avg mother age, earliest year) | Big picture |

### Fractal Collapse (on scroll out)
As you zoom out:
1. Labels shrink → abbreviate → become dots
2. Dots can encode: lineage color, certainty, density
3. Eventually wedges become "branch summary blocks"
4. Feels like zooming out on a fractal coastline

### Fan-Split Zoom (click to expand branch)
- Click any wedge (ancestor branch)
- That wedge animates to fill the entire fan/circle
- Their ancestors now fill the view
- Breadcrumbs show path back to root

**Implementation:**
```typescript
// Global angle domain
let angleDomain = [0, 2 * Math.PI]; // full circle

// On wedge click:
function focusWedge(wedge: Wedge) {
  const [a0, a1] = wedge.angleSpan;
  animateDomain(angleDomain, [a0, a1]);
  // All nodes re-render with remapped angles
}
```

---

## 🗺️ Place-Based Features

### Place Hierarchy (North America focus)

```
Country
└── Region (New England, Mid-Atlantic, Upper South, etc.)
    └── State/Province
        └── County/District
            └── Town/Settlement
                └── Site (parish, fort, ship)
```

### Place Normalization
- Parse comma-separated place strings
- Map abbreviations (VA → Virginia, Mass → Massachusetts)
- Handle historical variants ("Mass Bay Colony" → Massachusetts)
- Store both `raw` and `normalized`

### Person Place Timeline
For each person, track events:
- Birth location
- Marriage location(s)
- Death location
- Residence events (census, land, tax, military)

```typescript
interface PlaceEvent {
  yearRange: [number, number]; // fuzzy range
  placeRaw: string;           // original from GEDCOM
  placeNorm: PlaceHierarchy;  // standardized
  geo?: [lat, lng];           // optional coordinates
  eventType: 'birth' | 'marriage' | 'death' | 'residence' | 'census' | 'immigration';
}
```

---

## 🌌 Nebula Regions (Place Clustering)

When user selects a place + time window:
1. Fade non-matching wedges
2. Draw soft "nebula" halos behind matching wedges
3. Color = region (Mid-Atlantic = blue-green, Upper South = warm orange, etc.)
4. Optional: migration arrows between rings where place changes

### Migration Spine (per branch)
For each wedge/branch, compute:
- Most common place per generation
- "First divergence point" (when dominant place changes)
- Directional pattern (East → Inland → West)

### Split Point Markers
- Mark thin glyph on wedge ring where branch "moves"
- Creates visual "fracture points" in the tree
- Shows when families went west, moved south, etc.

---

## 🔗 Recombination Detection

### The Problem
"Someone from original Penn colony moved to Virginia and married a lady I'm also related to - but I have NO way to tell."

### The Solution
For each marriage:
1. Check if spouse A and spouse B share a common ancestor (within 8-11 generations)
2. If yes, record:
   - MRCA (Most Recent Common Ancestor) person(s)
   - Relationship distance ("4th cousins")
   - Where/when the marriage happened

### Recombination Chords
- Draw faint curved chord between the two wedge sectors that reconnect
- On hover: show MRCA and marriage event
- "Dark" Netflix style: these become the time-loop-looking curves

### UI Display
```
┌─────────────────────────────────────────┐
│ ⚠️ Branch Recombination Detected        │
│                                         │
│ Marriage: John Smith & Mary Jones, 1823 │
│           Lancaster County, PA          │
│                                         │
│ Shared Ancestor: William Smith (1698)   │
│ Relationship: 4th cousins               │
│                                         │
│ Branches split: Generation 5 (PA)       │
│ Branches rejoined: Generation 3 (PA)    │
└─────────────────────────────────────────┘
```

---

## 🏗️ Data Model

### Person (enhanced)
```typescript
interface Person {
  id: string;
  name: {
    given: string;
    surname: string;
    display: string;
  };
  sex?: 'M' | 'F' | 'X';
  
  // Dates (store raw + computed year)
  birth?: { raw: string; year?: number; place?: PlaceEvent };
  death?: { raw: string; year?: number; place?: PlaceEvent };
  
  // Family links
  parents?: { fatherId?: string; motherId?: string };
  spouses: Array<{ spouseId: string; familyId: string }>;
  
  // Place timeline
  placeEvents: PlaceEvent[];
  
  // Computed fields
  generationIndex?: number;
  motherAgeAtBirth?: number;
  lineageSignature?: string; // path from root
}
```

### Family
```typescript
interface Family {
  id: string;
  husbandId?: string;
  wifeId?: string;
  childrenIds: string[];
  marriage?: { raw: string; year?: number; place?: PlaceEvent };
  
  // Recombination detection
  isRecombination?: boolean;
  sharedAncestorId?: string;
  relationshipDistance?: number;
}
```

### Branch Summary (computed per wedge)
```typescript
interface BranchSummary {
  wedgeId: string;
  rootAncestorId: string;
  
  // Counts
  knownCount: number;
  unknownCount: number;
  totalPossible: number;
  completeness: number; // percentage
  
  // Place summary
  dominantPlaces: Array<{ place: string; count: number; generations: number[] }>;
  migrationSpine: Array<{ gen: number; place: string }>;
  firstDivergenceGen?: number;
  
  // Stats
  avgMotherAge?: number;
  earliestYear?: number;
  latestYear?: number;
  
  // Recombinations
  recombinationsWith: string[]; // other wedge IDs
}
```

---

## 🖥️ Component Architecture

```
src/
├── components/
│   ├── RadialPedigree/
│   │   ├── RadialPedigreeCanvas.tsx    # Main canvas renderer
│   │   ├── WedgeRenderer.tsx           # Individual wedge drawing
│   │   ├── ZoomController.tsx          # Mouse/touch zoom handling
│   │   ├── ThemePicker.tsx             # Theme selection
│   │   ├── BranchFocusBreadcrumbs.tsx  # Navigation when zoomed into branch
│   │   ├── SemanticZoomManager.tsx     # Controls detail level
│   │   └── RecombinationChords.tsx     # The "Dark"-style connection lines
│   │
│   ├── PlaceExplorer/
│   │   ├── PlaceFilter.tsx             # Select place + time window
│   │   ├── MigrationLens.tsx           # Highlights migration patterns
│   │   ├── NebulaOverlay.tsx           # The colored region halos
│   │   └── PlaceTimeline.tsx           # Person's movement over time
│   │
│   └── common/
│       ├── PersonCard.tsx
│       ├── RecombinationAlert.tsx
│       └── BranchSummaryPanel.tsx
│
├── lib/
│   ├── radial-layout.ts         # Wedge angle calculations
│   ├── ancestor-builder.ts      # Build 11-gen ancestor set
│   ├── place-normalizer.ts      # Parse/normalize place strings
│   ├── recombination-detector.ts # Find shared ancestors in marriages
│   └── migration-analyzer.ts    # Compute migration patterns
│
└── types/
    ├── gedcom.ts
    ├── organizations.ts
    └── radial-pedigree.ts       # New types for this feature
```

---

## 📅 Build Phases

### Phase 1: Data Foundation (reuse existing GED modules)
- [ ] Import GEDCOM (already done!)
- [ ] Normalize persons/families
- [ ] Compute birthYear/deathYear/marriageYear (fuzzy parsing)
- [ ] Compute motherAgeAtBirth
- [ ] Build 11-generation ancestor set from root person

### Phase 2: Basic Radial Wheel
- [ ] Even-split wedge layout (simple first)
- [ ] Render rings + wedges
- [ ] Basic labels (name + years)
- [ ] Theme: Classic B&W

### Phase 3: Semantic Zoom
- [ ] Zoom levels: Full → Compact → Glyph → Aggregate
- [ ] Performance: cull labels outside zoom threshold
- [ ] Smooth transitions

### Phase 4: Fan-Split Zoom
- [ ] Click wedge to focus
- [ ] Angle domain remapping
- [ ] Breadcrumb navigation
- [ ] Animation

### Phase 5: Themes
- [ ] Parchment Heritage
- [ ] Color Wheel Backdrop
- [ ] Dark Constellation

### Phase 6: Place Features
- [ ] Place normalization
- [ ] Person place timelines
- [ ] Place filter panel
- [ ] Nebula overlay

### Phase 7: Migration Patterns
- [ ] Branch migration spine
- [ ] Split point markers
- [ ] Migration arrows

### Phase 8: Recombination Detection
- [ ] MRCA finder
- [ ] Chord renderer
- [ ] Recombination alerts

---

## 🎨 Visual References

| Style | Reference | Key Features |
|-------|-----------|--------------|
| Parchment Fan | "Larsen Family" image | Warm texture, serif text, color segments |
| Clean B&W | "B&W Circle Pedigree" | Print-friendly, minimal |
| Color Wheel | "Family History" wall art | Rainbow backdrop, clear segments |
| Constellation | "Dark" Netflix tree | Black bg, glowing nodes, Venn-like clusters |
| Dense Fan | "Butts Family" | Half-circle, detailed text, many generations |
| Extended Grid | Large box diagram | For descendants/cousins view (separate mode) |

---

## 💡 Key Insights

1. **Radial = ancestors only** - Keep the wheel focused on direct ancestors (max 4k nodes). Use a separate view for descendants/cousins.

2. **Place is as important as lineage** - The "where" tells the story of migration, settlement, and reconnection.

3. **Recombination is the hidden story** - When branches marry back together, that's the most interesting part of genealogy.

4. **Semantic zoom is essential** - 4k nodes can't all have readable labels. Let detail emerge as you zoom.

5. **Themes aren't just cosmetic** - Different themes serve different purposes (print, display, analysis, presentation).

---

## 🚀 MVP Definition

**Minimum Viable Radial Pedigree:**
1. Import GEDCOM
2. Pick root person
3. Build 11-gen ancestor set
4. Render basic fan/wheel with names + years
5. Click to see person details
6. One theme (Autumn Heritage)

Everything else is enhancement.

---

*Document created: January 2026*
*Family Tree Memory Maker v2.0 "Autumn Heritage"*
