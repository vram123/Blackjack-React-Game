import React from "react";

export default function SettingsModal({
  open,
  onClose,
  jazzEnabled,
  onJazzChange,
}) {
  if (!open) return null;

  return (
    <div
      className="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2 id="settings-title">Settings</h2>
          <button type="button" className="settings-close" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>
        <label className="settings-row">
          <span>Background jazz</span>
          <input
            type="checkbox"
            checked={jazzEnabled}
            onChange={(e) => onJazzChange(e.target.checked)}
          />
        </label>
        <p className="settings-hint">When off, the table is silent except for shuffle and card sounds.</p>
      </div>
    </div>
  );
}
