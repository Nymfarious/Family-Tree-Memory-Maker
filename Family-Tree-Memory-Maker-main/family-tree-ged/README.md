# Family Tree Memory Maker (No-build, Static)

This is a zero-build static prototype to visualize GEDCOMs and test UI concepts:
- GEDCOM upload + basic parse (INDI: NAME/SEX/FAMC/FAMS; FAM: HUSB/WIFE/CHIL)
- Simple tree view with focus mode
- Save Local (localStorage)
- "Save to Cloud…" modal (stub providers)
- Change Log drawer
- Dev-only notes (red `?`, 💡 ideas)

## Run
Open `index.html` in a browser. That's it.

> Uses React 18 via CDN + Babel Standalone for JSX. Not for production, but great for quick iteration.

## Files
- `index.html` — loads everything (includes scripts and mounts React)
- `src/styles.css` — styles
- `src/utils/storage.js` — localStorage utilities
- `src/components/GedcomParser.js` — GEDCOM file parser
- `src/components/IconDevNote.jsx` — developer note component
- `src/components/CloudPickerModal.jsx` — cloud provider selection modal
- `src/components/ChangeLogDrawer.jsx` — changelog sidebar
- `src/components/FamilyTreeUIPrototype.jsx` — main family tree component
- `src/App.jsx` — root application component
- `public/sample.ged` — tiny sample file

## Roadmap (next)
- Replace Babel-in-browser with a proper bundler (Vite) and split real files
- Real cloud save targets (Supabase, Drive, Dropbox, etc.)
- Focus mode enhancements: ancestors/descendants toggles, breadcrumbs
- Person details panel; edit mode; photos
- Import validation and error reporting (line numbers, tags)
- Printable PDF cards for individuals

## Notes
Minimal parser: it's intentionally small to keep the prototype lightweight. If you need more GEDCOM coverage, we can extend tags or swap for a library later.