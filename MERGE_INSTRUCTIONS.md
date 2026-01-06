# 🔧 Family Tree Memory Maker - Merge Instructions

## v2.0 "Autumn Heritage" Enhancement Package

This package adds:
- ✅ Enhanced Person types (organizations, military, immigration, places)
- ✅ 40+ Lineage Societies database (DAR, SAR, Mayflower, DRT, etc.)
- ✅ Place normalization utilities (for radial pedigree migration tracking)
- ✅ Radial Pedigree planning doc

---

## 📁 Files to Merge

### 1. REPLACE: `src/types/gedcom.ts`
**Action:** Replace your existing 1KB file with the new 8KB version

```bash
# Backup first (optional)
cp src/types/gedcom.ts src/types/gedcom.ts.backup

# Then replace with the new file
cp merge-files/types/gedcom.ts src/types/
```

**What's new:**
- Enhanced Person interface (organizations, military, immigration, placeEvents)
- Family interface with recombination detection
- PlaceHierarchy and PlaceEvent types
- RadialWedge and BranchSummary types for radial pedigree
- Helper functions (isPerson, getDisplayName, getLifespan)

---

### 2. ADD: `src/types/organizations.ts`
**Action:** Add this new file

```bash
cp merge-files/types/organizations.ts src/types/
```

**What's in it:**
- LINEAGE_SOCIETIES array (25+ societies with requirements)
- FRATERNAL_ORGANIZATIONS array (15+ orders)
- Helper functions (getOrganizationById, getOrganizationsByCategory)
- CATEGORY_LABELS for UI display

---

### 3. ADD: `src/lib/place-normalizer.ts`
**Action:** Add this new file

```bash
cp merge-files/lib/place-normalizer.ts src/lib/
```

**What's in it:**
- `normalizePlace()` - Parse "Boston, MA, USA" into hierarchy
- US state abbreviations and full names
- US regions (New England, Mid-Atlantic, etc.)
- Country variants mapping
- `extractYear()` - Parse dates like "ABT 1820"
- `calculateMotherAge()` - For radial pedigree display

---

## 🔗 Update Imports

After adding the files, you may need to update imports in components that use Person:

```typescript
// Old import (if any)
import { Person } from '@/types/gedcom';

// Still works! The Person interface is enhanced, not renamed
```

For organizations:
```typescript
// New import
import { LINEAGE_SOCIETIES, getOrganizationById } from '@/types/organizations';
```

For place utilities:
```typescript
// New import
import { normalizePlace, getRegion, extractYear } from '@/lib/place-normalizer';
```

---

## ✅ Verify the Merge

After copying files, run:

```bash
# Check for TypeScript errors
npm run typecheck

# Or just run the dev server
npm run dev
```

If you see type errors, it's likely because:
1. Some component expects the old minimal Person type
2. Import paths need updating

---

## 🚀 Next Steps (After Merge)

### Enhance Person Editor Modal
Add an "Organizations" tab to `src/components/modals/person-editor-modal.tsx`:
- Show current memberships
- Add new membership (select from LINEAGE_SOCIETIES)
- Mark qualifying ancestors

### Enhance Circular Tree View
Update `src/components/circular-tree-view.tsx` to:
- Support 11 generations (currently may be limited)
- Add semantic zoom levels
- Add theme switching

### Add Organizations Panel
Create `src/components/organizations-panel.tsx`:
- Browse all societies
- View qualifying ancestors in tree
- Track your memberships

---

## 📌 Files NOT Changed

These files are **not touched** by this merge:
- All auth/Supabase code
- `code-health-*.tsx` (keep for MDT)
- `ai-workspace.tsx`
- `flowchart-library.tsx`
- All existing modals (just enhanced)
- App.tsx, main.tsx, etc.

---

## 📋 What's in the Planning Doc

See `docs/RADIAL_PEDIGREE_PLAN.md` for:
- 11-generation scope breakdown
- Semantic zoom levels (full → compact → glyph → aggregate)
- Fan-split zoom behavior
- Place nebula overlays
- Migration pattern tracking
- Recombination detection (when branches marry back together)
- Theme specifications (Classic, Parchment, Color Wheel, Constellation)
- Build phases

---

*Family Tree Memory Maker v2.0 "Autumn Heritage"*
