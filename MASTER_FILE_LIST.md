# 📁 Master File List - Family Tree Memory Maker v2.2

## Current Status: Phase 3 Complete ✅

---

## ✅ PHASE 1: Quick Wins (DONE - DEPLOYED)

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

## ✅ PHASE 2: Core Fixes (DONE - APPLIED)

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

## ✅ PHASE 3: Auth & UI Updates (CURRENT - IN PACKAGE)

| File | Location | Status | Purpose |
|------|----------|--------|---------|
| `AuthContext.tsx` | `/src/contexts/` | 📦 In Package | Stale closure fix for Code Health blip |
| `import-gedcom-modal.tsx` | `/src/components/modals/` | 📦 In Package | Actual generation count (not 999) |
| `preferences-modal.tsx` | `/src/components/modals/` | 📦 In Package | Dev mode support + root person setting |
| `location-list.tsx` | `/src/components/` | 📦 In Package | Inline expandable + timeline + death info |
| `dev-tools.tsx` wishlist | `/src/components/` | 📝 Manual | Updated wishlist with ✅/⏳/📋 sections |

**Features:**
- ✅ Code Health blip FIXED (useRef for stale closure)
- ✅ Import shows actual generation count (~X gen)
- ✅ Preferences works in Dev Mode
- ✅ Default Root Person setting
- ✅ Inline expandable location cards
- ✅ Pin icon rotates on expand
- ✅ Death info displayed
- ✅ Lineage timeline to root person
- ✅ Updated wishlist organization

---

## 📋 PHASE 4: Maps & Media (TO BE BUILT)

| File | Location | Status | Purpose |
|------|----------|--------|---------|
| `map-tree-view.tsx` | `/src/components/` | 🔲 Planned | Replace Google Maps with MapLibre |
| `tree-filters.tsx` | `/src/components/` | 🔲 Planned | Better search, state/country filters |
| `quick-add-person-modal.tsx` | `/src/components/modals/` | 🔲 Planned | Add death fields, notes button |
| `mediaImporter.ts` | `/src/utils/` | 🔲 Planned | Import Ancestry-tools media |
| `import-media-modal.tsx` | `/src/components/modals/` | 🔲 Planned | UI for media import |

---

## 📁 Current File Structure

```
Family-Tree-Memory-Maker/
├── index.html                          ← Phase 1 ✅
├── public/
│   ├── favicon.ico                     
│   └── favicon.svg                     ← Phase 1 ✅
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.tsx          ← Phase 2 ✅
│   │   ├── person-card.tsx             ← Phase 1 ✅
│   │   ├── circular-tree-view.tsx      ← Phase 1 ✅
│   │   ├── location-list.tsx           ← Phase 3 📦
│   │   ├── notes-popup.tsx             ← Phase 2 ✅
│   │   ├── dev-tools.tsx               ← Phase 3 📝 (wishlist manual)
│   │   ├── map-tree-view.tsx           ← Phase 4 🔲
│   │   └── modals/
│   │       ├── import-gedcom-modal.tsx ← Phase 3 📦
│   │       ├── preferences-modal.tsx   ← Phase 3 📦
│   │       └── quick-add-person-modal.tsx ← Phase 4 🔲
│   ├── contexts/
│   │   └── AuthContext.tsx             ← Phase 3 📦
│   └── utils/
│       └── mediaImporter.ts            ← Phase 4 🔲
├── supabase/
│   └── migrations/
│       └── 20260107_add_genealogy_tables.sql ← Phase 2 ✅
└── ...
```

---

## 🔧 Phase 3 Install Commands

```powershell
cd ~\OneDrive\Desktop\"AI Repo Clones"\"Family Tree Memory Maker"

# All Phase 3 files
Copy-Item ~\Downloads\phase3-package\src\contexts\AuthContext.tsx .\src\contexts\ -Force
Copy-Item ~\Downloads\phase3-package\src\components\modals\import-gedcom-modal.tsx .\src\components\modals\ -Force
Copy-Item ~\Downloads\phase3-package\src\components\modals\preferences-modal.tsx .\src\components\modals\ -Force
Copy-Item ~\Downloads\phase3-package\src\components\location-list.tsx .\src\components\ -Force

npm run dev
```

---

## 🗺️ Feature → File Quick Reference

| Feature | Primary File(s) | Phase |
|---------|-----------------|-------|
| 11 generations | circular-tree-view.tsx | 1 ✅ |
| Compact cards | person-card.tsx | 1 ✅ |
| Full/half/quarter fan | circular-tree-view.tsx | 1 ✅ |
| Code Health blip fix | AuthContext.tsx | 3 📦 |
| Actual gen count | import-gedcom-modal.tsx | 3 📦 |
| Dev mode preferences | preferences-modal.tsx | 3 📦 |
| Default root person | preferences-modal.tsx | 3 📦 |
| Inline location expand | location-list.tsx | 3 📦 |
| Timeline/lineage | location-list.tsx | 3 📦 |
| Death info display | location-list.tsx | 3 📦 |
| MapLibre maps | map-tree-view.tsx | 4 🔲 |
| Media import | mediaImporter.ts | 4 🔲 |

---

*Last updated: January 2026 - Phase 3*
