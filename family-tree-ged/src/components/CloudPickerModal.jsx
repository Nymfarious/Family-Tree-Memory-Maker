// src/components/CloudPickerModal.jsx
window.CloudPickerModal = function CloudPickerModal({ open, onClose, onChoose }) {
  if (!open) return null;
  const providers = [
    { id: "generic", name: "Generic Cloud (stub)" },
    { id: "supabase", name: "Supabase (wire later)" },
    { id: "drive", name: "Google Drive (API later)" },
    { id: "dropbox", name: "Dropbox (API later)" },
  ];
  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>Save to Cloud</h2>
        <p>Select a provider (this is a stub you can swap for the real thing):</p>
            <ul className="picker">
              {providers.map(p => (
                <li key={p.id}>
                  <button className="btn is-interactive" onClick={() => onChoose?.(p.id)}>{p.name}</button>
                </li>
              ))}
            </ul>
            <div className="modal__actions">
              <button className="btn btn--ghost is-interactive" onClick={onClose}>Close</button>
            </div>
      </div>
    </div>
  );
};