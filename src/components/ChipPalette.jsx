import React from "react";

const CHIPS = [1, 5, 10, 25];

export default function ChipPalette() {
  const onDragStart = (e, c) => {
    e.dataTransfer.setData("chipValue", c.toString());
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setDragImage(e.target, 26, 26);
  };

  return (
    <div className="chips">
      <h3>Chips</h3>
      <div className="chip-row">
        {CHIPS.map((c) => (
          <button
            key={c}
            className="chip"
            draggable
            onDragStart={(e) => onDragStart(e, c)}
            title={`Drag ${c}`}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="hint">Drag a chip onto the table. Right-click to remove.</p>
    </div>
  );
}
