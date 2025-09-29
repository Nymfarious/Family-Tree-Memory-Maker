// src/components/IconDevNote.jsx
window.IconDevNote = function IconDevNote({ type = "question", title, note }) {
  const color = type === "question" ? "#ef4444" : "#f59e0b"; // red / amber
  const symbol = type === "question" ? "?" : "💡";
  return (
    <div className="dev-note" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="dev-note__icon" aria-hidden="true" style={{ color }}>{symbol}</div>
      <div className="dev-note__body">
        <div className="dev-note__title">{title}</div>
        {note && <div className="dev-note__text">{note}</div>}
      </div>
    </div>
  );
};