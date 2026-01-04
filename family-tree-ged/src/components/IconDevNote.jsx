// src/components/IconDevNote.jsx
window.IconDevNote = function IconDevNote({ type = "question", title, note }) {
  const symbol = type === "question" ? "?" : "💡";
  const className = `dev-note dev-note--${type}`;
  return (
    <div className={className}>
      <div className="dev-note__icon" aria-hidden="true">{symbol}</div>
      <div className="dev-note__body">
        <div className="dev-note__title">{title}</div>
        {note && <div className="dev-note__text">{note}</div>}
      </div>
    </div>
  );
};