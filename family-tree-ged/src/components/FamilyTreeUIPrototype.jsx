// src/components/FamilyTreeUIPrototype.jsx
const { useState, useMemo, useRef } = React;

function PersonCard({ pid, people, childToParents, onFocus }) {
  const p = people[pid];
  if (!p) return null;
  const parents = childToParents[pid] || [];
      return (
        <div className="person is-interactive" tabIndex={0} role="button" onClick={() => onFocus?.(pid)} data-ix="person:focus">
          <div className="person__name">{p.name || pid}</div>
          <div className="person__meta">
            <span className="badge">{p.sex || "?"}</span>
            {p.surname ? <span className="badge badge--muted">{p.surname}</span> : null}
          </div>
          {parents.length > 0 && (
            <div className="person__parents">
              Parents:{" "}
              {parents.map((pp, idx) => (
                <button key={pp} className="link is-interactive" onClick={(e) => { e.stopPropagation(); onFocus?.(pp); }} data-ix="parent:focus">
                  {people[pp]?.name || pp}{idx < parents.length - 1 ? ", " : ""}
                </button>
              ))}
            </div>
          )}
        </div>
      );
}

function TreeList({ roots, people, childToParents, families, onFocus }) {
  // Build children-by-parent map
  const childrenByParent = useMemo(() => {
    const map = {};
    for (const fam of Object.values(families)) {
      const kids = fam.children || [];
      const parents = [fam.husb, fam.wife].filter(Boolean);
      for (const parent of parents) {
        map[parent] = map[parent] || new Set();
        for (const kid of kids) map[parent].add(kid);
      }
    }
    return map;
  }, [families]);

  const renderSubtree = (pid, depth = 0) => {
    const kids = Array.from(childrenByParent[pid] || []);
    return (
      <li key={`${pid}-${depth}`}>
        <PersonCard pid={pid} people={people} childToParents={childToParents} onFocus={onFocus} />
        {kids.length > 0 && (
          <ul className="tree">
            {kids.map(k => renderSubtree(k, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul className="tree tree--root">
      {roots.map(r => renderSubtree(r))}
    </ul>
  );
}

window.FamilyTreeUIPrototype = function FamilyTreeUIPrototype() {
  const [ged, setGed] = useState(() => window.StorageUtils.loadLocal("ft:ged-last"));
  const [cloudOpen, setCloudOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focus, setFocus] = useState(null);
  const inputRef = useRef(null);

  const stats = useMemo(() => {
    if (!ged) return { people: 0, families: 0, roots: 0 };
    return {
      people: Object.keys(ged.people).length,
      families: Object.keys(ged.families).length,
      roots: ged.roots.length
    };
  }, [ged]);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = window.parseGedcom(String(reader.result || ""));
      setGed(parsed);
      window.StorageUtils.saveLocal("ft:ged-last", parsed);
    };
    reader.readAsText(file);
  }

  function onSaveLocal() {
    if (!ged) return alert("Nothing to save yet.");
    
    // Simulate the 4-light progress states
    const button = document.querySelector('[data-ix="save:click"]');
    const stageText = button?.querySelector('[data-stage-live]');
    
    // Stage 1: Ready
    button?.setAttribute('data-stage', '1');
    if (stageText) stageText.textContent = 'Ready';
    
    setTimeout(() => {
      // Stage 2: Set
      button?.setAttribute('data-stage', '2');
      if (stageText) stageText.textContent = 'Set';
      
      setTimeout(() => {
        // Stage 3: Go
        button?.setAttribute('data-stage', '3');
        if (stageText) stageText.textContent = 'Go';
        
        setTimeout(() => {
          // Stage 4: Done
          button?.setAttribute('data-stage', '4');
          if (stageText) stageText.textContent = 'Done';
          
          const ok = window.StorageUtils.saveLocal("ft:ged-last", ged);
          alert(ok ? "Saved locally." : "Local save failed.");
          
          // Reset to idle after completion
          setTimeout(() => {
            button?.setAttribute('data-stage', '0');
            if (stageText) stageText.textContent = 'Idle';
          }, 1000);
        }, 800);
      }, 600);
    }, 400);
  }

  function onChooseCloud(providerId) {
    setCloudOpen(false);
    alert(`Pretend-upload to: ${providerId}. Replace this with your actual API call.`);
  }

  const changelog = [
    { title: "Add Change Log drawer", when: "2025-09-29", author: "You & Don", detail: "Minimal drawer; entries hard-coded for now." },
    { title: "Add Save to Cloud stub", when: "2025-09-29", author: "You & Don", detail: "Opens provider picker. Wire up later." },
    { title: "GEDCOM upload + parse", when: "2025-09-29", author: "You & Don", detail: "Parses INDI/FAM basics, renders tree." }
  ];

  return (
    <div className="wrap">
      <header className="topbar">
        <h1>Family Tree GED — Prototype</h1>
            <div className="actions">
              <label className="btn is-interactive" tabIndex="0" data-ix="import:file">
                <input ref={inputRef} type="file" accept=".ged,text/plain" onChange={onFile} hidden />
                <span className="btn__label">Import GEDCOM</span>
              </label>
              <button className="btn has-lights is-interactive" data-stage="0" onClick={onSaveLocal} data-ix="save:click" aria-live="polite">
                <span className="btn__label">Save Local</span>
                <span className="btn__lights" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
                <span className="sr-only" data-stage-live>Idle</span>
              </button>
              <button className="btn is-interactive" onClick={() => setCloudOpen(true)} data-ix="cloud:open">Save to Cloud…</button>
              <button className="btn btn--ghost is-interactive" onClick={() => setDrawerOpen(true)} data-ix="changelog:open">Change Log</button>
            </div>
      </header>

      <main className="grid">
        <section>
          <h2>Overview</h2>
          <div className="stats">
            <div className="stat"><div className="stat__num">{stats.people}</div><div className="stat__label">People</div></div>
            <div className="stat"><div className="stat__num">{stats.families}</div><div className="stat__label">Families</div></div>
            <div className="stat"><div className="stat__num">{stats.roots}</div><div className="stat__label">Roots</div></div>
          </div>

          <IconDevNote
            type="question"
            title="Dev note: What's our canonical ID?"
            note="Using GEDCOM xrefs (@I1@, @F1@) as IDs. If you want stable UUIDs, we can generate and map them."
          />
          <IconDevNote
            type="idea"
            title="Idea: Focus mode"
            note="When you click a person, filter the tree to their ancestors/descendants; add breadcrumbs to pop back."
          />

          {!ged && (
            <div className="empty">
              <p>Import a <code>.ged</code> file to begin. A tiny sample is in <code>/public/sample.ged</code>.</p>
              <button className="btn is-interactive" onClick={() => inputRef.current?.click()} data-ix="import:choose">Choose File…</button>
            </div>
          )}
        </section>

        <section>
          <h2>Tree</h2>
          {ged ? (
            <>
              {focus && (
                <div className="focus">
                  <span>Focus: </span>
                  <strong>{ged.people[focus]?.name || focus}</strong>
                  <button className="btn btn--ghost is-interactive" onClick={() => setFocus(null)} data-ix="focus:clear">Clear</button>
                </div>
              )}
              <TreeList
                roots={focus ? [focus] : ged.roots}
                people={ged.people}
                childToParents={ged.childToParents}
                families={ged.families}
                onFocus={setFocus}
              />
            </>
          ) : (
            <p className="muted">No tree yet.</p>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>Local-only prototype. No build step. Pure static HTML + React via CDN.</span>
      </footer>

      <CloudPickerModal open={cloudOpen} onClose={() => setCloudOpen(false)} onChoose={onChooseCloud} />
      <ChangeLogDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} entries={changelog} />
    </div>
  );
};