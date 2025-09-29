// src/components/ChangeLogDrawer.jsx
window.ChangeLogDrawer = function ChangeLogDrawer({ open, onClose, entries }) {
  return (
    <aside className={`drawer ${open ? "drawer--open" : ""}`} aria-hidden={!open}>
      <div className="drawer__header">
        <h3>Change Log</h3>
        <button className="btn btn--ghost" onClick={onClose}>Close</button>
      </div>
      <ol className="changelog">
        {(entries ?? []).map((e, i) => (
          <li key={i}>
            <div className="chg__title">{e.title}</div>
            <div className="chg__meta">{e.when} · {e.author}</div>
            {e.detail && <div className="chg__detail">{e.detail}</div>}
          </li>
        ))}
      </ol>
    </aside>
  );
};