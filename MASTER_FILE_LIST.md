# 📁 Master File List - Family Tree Memory Maker v2.2.4

## Current Status: Phase 4 Complete ✅

---

## ✅ PHASE 1: Quick Wins (v2.2.1 - DEPLOYED)

| File | Location | Status |
|------|----------|--------|
| `index.html` | `/` (root) | ✅ Deployed |
| `favicon.svg` | `/public/` | ✅ Deployed |
| `person-card.tsx` | `/src/components/` | ✅ Deployed |
| `circular-tree-view.tsx` | `/src/components/` | ✅ Deployed |
| `import-gedcom-modal.tsx` | `/src/components/modals/` | ✅ Deployed |

**Features:**
- ✅ 11 generations (was 7)
- ✅ Compact card mode
- ✅ Circular view options (full/half/quarter fan)
- ✅ New tree favicon
- ✅ Import All as default

---

## ✅ PHASE 2: Core Fixes (v2.2.2 - APPLIED)

| File | Location | Status |
|------|----------|--------|
| `ProtectedRoute.tsx` | `/src/components/` | ✅ Applied |
| `location-list.tsx` | `/src/components/` | ✅ Applied |
| `notes-popup.tsx` | `/src/components/` | ✅ Applied |
| `20260107_add_genealogy_tables.sql` | `/supabase/migrations/` | ✅ Applied |

**Features:**
- ✅ Code Health blip fix (initial)
- ✅ "+267 more locations" shows ALL
- ✅ Notes popup for people
- ✅ Supabase tables ready

---

## ✅ PHASE 3: Auth & UI Updates (v2.2.3 - APPLIED)

| File | Location | Status |
|------|----------|--------|
| `AuthContext.tsx` | `/src/contexts/` | ✅ Applied |
| `import-gedcom-modal.tsx` | `/src/components/modals/` | ✅ Applied |
| `preferences-modal.tsx` | `/src/components/modals/` | ✅ Applied |
| `location-list.tsx` | `/src/components/` | ✅ Applied |

**Features:**
- ✅ Code Health blip FIXED (useRef for stale closure)
- ✅ Import shows actual generation count (~X gen)
- ✅ Preferences works in Dev Mode
- ✅ Default Root Person setting
- ✅ Inline expandable location cards

---

## ✅ PHASE 4: Quick Add & Locations (v2.2.4 - CURRENT)

| File | Location | Status | Purpose |
|------|----------|--------|---------|
| `Settings.tsx` | `/src/pages/` | 📦 In Package | Version 2.2.4 + history |
| `quick-add-person-modal.tsx` | `/src/components/modals/` | 📦 In Package | Death fields + notes |
| `map-tree-view.tsx` | `/src/components/` | 📦 In Package | Integrated location panel |

**Features:**
- ✅ Version updated to 2.2.4
- ✅ Version history section in Settings
- ✅ Quick add: death date field
- ✅ Quick add: death place field
- ✅ Quick add: notes field
- ✅ Smart "deceased" suggestion for old birth years
- ✅ Map view: inline expandable location cards
- ✅ Map view: location search
- ✅ Map view: birth/death counts per location
- ✅ Map view: person death info display
- ✅ Map view: lineage timeline (if root person set)

---

## 📋 PHASE 5: Media & Maps (TO BE BUILT)

| File | Location | Status | Purpose |
|------|----------|--------|---------|
| `mediaImporter.ts` | `/src/utils/` | 🔲 Planned | Import Ancestry-tools media |
| `import-media-modal.tsx` | `/src/components/modals/` | 🔲 Planned | UI for media import |
| MapLibre integration | `/src/components/` | 🔲 Planned | Free interactive maps |
| Person photo attachment | `/src/components/` | 🔲 Planned | Attach photos to cards |

---

## 📁 Current File Structure

```
Family-Tree-Memory-Maker/
├── index.html                          ← Phase 1 ✅
├── public/
│   └── favicon.svg                     ← Phase 1 ✅
├── src/
│   ├── pages/
│   │   └── Settings.tsx                ← Phase 4 📦 (v2.2.4)
│   ├── contexts/
│   │   └── AuthContext.tsx             ← Phase 3 ✅
│   ├── components/
│   │   ├── ProtectedRoute.tsx          ← Phase 2 ✅
│   │   ├── person-card.tsx             ← Phase 1 ✅
│   │   ├── circular-tree-view.tsx      ← Phase 1 ✅
│   │   ├── location-list.tsx           ← Phase 3 ✅
│   │   ├── map-tree-view.tsx           ← Phase 4 📦
│   │   ├── notes-popup.tsx             ← Phase 2 ✅
│   │   └── modals/
│   │       ├── import-gedcom-modal.tsx ← Phase 3 ✅
│   │       ├── preferences-modal.tsx   ← Phase 3 ✅
│   │       └── quick-add-person-modal.tsx ← Phase 4 📦
│   └── utils/
│       └── mediaImporter.ts            ← Phase 5 🔲
└── supabase/
    └── migrations/
        └── 20260107_add_genealogy_tables.sql ← Phase 2 ✅
```

---

## 🔧 Phase 4 Install Commands

```powershell
cd ~\OneDrive\Desktop\"AI Repo Clones"\"Family Tree Memory Maker"

# Version update
Copy-Item ~\Downloads\phase4-package\src\pages\Settings.tsx .\src\pages\ -Force

# Quick add with death fields
Copy-Item ~\Downloads\phase4-package\src\components\modals\quick-add-person-modal.tsx .\src\components\modals\ -Force

# Integrated location panel
Copy-Item ~\Downloads\phase4-package\src\components\map-tree-view.tsx .\src\components\ -Force

npm run dev
```

---

## 📋 Optional Props Update

**For lineage in map view**, add `childToParents` to MapTreeView:

File: `src\components\family-tree-app.tsx` (~line 511)

```tsx
<MapTreeView
  people={ged.people}
  childToParents={ged.childToParents}  // ← ADD THIS
  onFocus={setFocus}
/>
```

---

## 🗺️ Feature → File Quick Reference

| Feature | Primary File(s) | Phase |
|---------|-----------------|-------|
| 11 generations | circular-tree-view.tsx | 1 ✅ |
| Compact cards | person-card.tsx | 1 ✅ |
| Full/half/quarter fan | circular-tree-view.tsx | 1 ✅ |
| Code Health blip fix | AuthContext.tsx | 3 ✅ |
| Actual gen count | import-gedcom-modal.tsx | 3 ✅ |
| Dev mode preferences | preferences-modal.tsx | 3 ✅ |
| Default root person | preferences-modal.tsx | 3 ✅ |
| **Version 2.2.4** | Settings.tsx | 4 📦 |
| **Quick add death fields** | quick-add-person-modal.tsx | 4 📦 |
| **Integrated location panel** | map-tree-view.tsx | 4 📦 |
| Media import | mediaImporter.ts | 5 🔲 |

---

## 📊 Version History

| Version | Phase | Build Date | Changes |
|---------|-------|------------|---------|
| **2.2.4** | **4** | **Jan 2026** | **Quick add death, integrated locations** |
| 2.2.3 | 3 | Jan 2026 | Auth blip fix, gen count, dev prefs, root person |
| 2.2.2 | 2 | Jan 2026 | ProtectedRoute fix, location list, notes |
| 2.2.1 | 1 | Jan 2026 | 11 generations, compact cards, fan views |
| 2.1.0 | - | Jan 2026 | Location cleanup, historical context |
| 2.0.0 | - | Dec 2025 | Major UI overhaul, circular views |

---

*Last updated: January 2026 - Phase 4 v2.2.4*
