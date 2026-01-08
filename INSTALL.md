# 🚀 Phase 3 Package - Family Tree Memory Maker v2.2

## What's Included

### 1. **AuthContext Fix** (Code Health Blip)
- Fixes stale closure bug causing page blip on Code Health
- Uses `useRef` to track initialization state properly

### 2. **Import Modal - Actual Generation Count**
- No more "999 generations" message!
- Scans GEDCOM to calculate actual generation count
- Shows file stats: people count, estimated generations, year range
- Button shows "Import All (~X gen)" with real number

### 3. **Preferences Modal - Dev Mode Support**
- Clear "Dev Mode Active" indicator when enabled
- All local settings work normally
- Cloud storage buttons disabled with "Needs Auth" label
- Helpful message explaining dev mode limitations

### 4. **Location List - Inline Expandable**
- Click pin icon to expand people list INSIDE the card
- Pin icon rotates 90° when expanded
- Full birth AND death info for each person
- Lineage timeline back to root person

### 5. **Default Root Person Setting**
- New "Default Root Person" section in Preferences
- Search and select any person as your "home base"
- Location views show lineage paths to this person

### 6. **Dev Wishlist Updates**
- Organized into: ✅ Completed, ⏳ In Progress, 📋 Planned
- Add to dev-tools.tsx manually (see WISHLIST_SECTION.tsx)

---

## 📁 Files

```
phase3-package/
├── INSTALL.md (this file)
├── WISHLIST_SECTION.tsx (manual merge into dev-tools.tsx)
└── src/
    ├── contexts/
    │   └── AuthContext.tsx         ← Code Health blip fix
    └── components/
        ├── location-list.tsx        ← Inline expandable + timeline
        └── modals/
            ├── import-gedcom-modal.tsx  ← Actual gen count
            └── preferences-modal.tsx    ← Dev mode support + root person
```

---

## 🚀 Install Commands

```powershell
cd ~\OneDrive\Desktop\"AI Repo Clones"\"Family Tree Memory Maker"

# AuthContext (Code Health fix)
Copy-Item ~\Downloads\phase3-package\src\contexts\AuthContext.tsx .\src\contexts\ -Force

# Import modal (actual generation count)
Copy-Item ~\Downloads\phase3-package\src\components\modals\import-gedcom-modal.tsx .\src\components\modals\ -Force

# Preferences modal (dev mode support + root person)
Copy-Item ~\Downloads\phase3-package\src\components\modals\preferences-modal.tsx .\src\components\modals\ -Force

# Location list (inline expand + timeline)
Copy-Item ~\Downloads\phase3-package\src\components\location-list.tsx .\src\components\ -Force

# Test
npm run dev
```

---

## 📋 Manual Steps

### 1. Update Wishlist in dev-tools.tsx

Open `src/components/dev-tools.tsx` and:

1. Add imports at top:
```tsx
import { CheckCircle, Clock, ListTodo } from "lucide-react";
```

2. Replace lines ~1021-1067 (the wishlist section) with content from `WISHLIST_SECTION.tsx`

### 2. Pass `people` to PreferencesModal

Find where `<PreferencesModal>` is rendered in `family-tree-app.tsx` and add the `people` prop:

```tsx
<PreferencesModal 
  open={prefsOpen} 
  onClose={() => setPrefsOpen(false)}
  people={people}  // ← ADD THIS
/>
```

### 3. Pass props to LocationList

Where you render `<LocationList>`, add the new props:

```tsx
<LocationList
  people={people}
  childToParents={childToParents}  // ← ADD
  defaultRootPerson={/* from localStorage */}  // ← ADD (optional)
  onPersonClick={handlePersonClick}
  onLocationClick={handleLocationClick}
/>
```

To get defaultRootPerson from localStorage:
```tsx
const savedFilters = JSON.parse(localStorage.getItem('tree-filter-preferences') || '{}');
const defaultRootPerson = savedFilters.defaultRootPerson;
```

---

## 🧪 Testing

### Test Import Modal
1. Load any GEDCOM file
2. In the import dialog, should see:
   - File stats (people count, ~X generations, year range)
   - Button says "Import All (~X gen)" not "Import All"

### Test Preferences in Dev Mode
1. Go to Settings → Enable Dev Mode
2. Open Preferences
3. Should see:
   - Yellow "Dev Mode Active" banner
   - Cloud storage buttons disabled with "Needs Auth"
   - All other settings work normally

### Test Location Expandable
1. Load GEDCOM
2. Go to locations view
3. Click on a location card
4. Should expand inline (not separate panel)
5. Each person shows birth + death info

### Test Root Person / Timeline
1. Open Preferences
2. In "Default Root Person" section, select someone
3. Go to locations, expand a card
4. Each person should show lineage path to your root person

---

## ✅ Summary

| Fix | File | Status |
|-----|------|--------|
| Code Health blip | AuthContext.tsx | ✅ |
| 999 generations | import-gedcom-modal.tsx | ✅ |
| Dev mode preferences | preferences-modal.tsx | ✅ |
| Inline location expand | location-list.tsx | ✅ |
| Root person setting | preferences-modal.tsx | ✅ |
| Timeline/lineage | location-list.tsx | ✅ |
| Death info display | location-list.tsx | ✅ |
| Wishlist update | WISHLIST_SECTION.tsx | 📋 Manual |

---

*Phase 3 Complete - January 2026*
