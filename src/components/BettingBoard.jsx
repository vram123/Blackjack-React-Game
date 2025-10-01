import React, { useMemo } from "react";
import { OUTSIDE_SPOTS, columnOf, dozenOf } from "../utils/roulette";

const rows = {
  top: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  mid: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  low: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
};

export default function BettingBoard({
  numberColor,
  chipsOnBoard,
  onDropChip,
  onRightClickSpot,
  winningNumber,
}) {
  const allNumbers = useMemo(
    () => [...rows.top, ...rows.mid, ...rows.low],
    []
  );

  const handleDrop = (e, spotId) => {
    e.preventDefault();
    const chipValue = parseInt(e.dataTransfer.getData("chipValue"), 10);
    if (!chipValue) return;
    onDropChip(spotId, chipValue);
  };

  const allowDrop = (e) => e.preventDefault();

  const renderChips = (spotId) => {
    const arr = chipsOnBoard[spotId] || [];
    return arr.map((c, i) => (
      <div
        key={c.id}
        className="chip placed"
        style={{
          transform: `translate(${i * 3}px, ${-i * 3}px)`,
        }}
      >
        {c.value}
      </div>
    ));
  };

  const cellClass = (n) =>
    `cell ${numberColor(n)} ${winningNumber === n ? "win" : ""}`;

  return (
    <div className="board" onDragOver={allowDrop}>
      <div className="zero-col">
        <button
          className={`cell zero ${winningNumber === 0 ? "win" : ""}`}
          onContextMenu={(e) => {
            e.preventDefault();
            onRightClickSpot("0");
          }}
          onDrop={(e) => handleDrop(e, "0")}
        >
          0
          <div className="chip-stack">{renderChips("0")}</div>
        </button>
      </div>

      <div className="grid">
        {["top", "mid", "low"].map((rowKey) => (
          <div className="row" key={rowKey}>
            {rows[rowKey].map((n) => (
              <div
                key={n}
                className={cellClass(n)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRightClickSpot(String(n));
                }}
                onDrop={(e) => handleDrop(e, String(n))}
              >
                {n}
                <div className="chip-stack">{renderChips(String(n))}</div>
              </div>
            ))}
          </div>
        ))}

        {/* Columns (2:1) */}
        <div className="columns">
          {["COL1", "COL2", "COL3"].map((id, idx) => (
            <div
              key={id}
              className="cell column"
              onContextMenu={(e) => {
                e.preventDefault();
                onRightClickSpot(id);
              }}
              onDrop={(e) => handleDrop(e, id)}
            >
              {idx + 1}st Col
              <div className="chip-stack">{renderChips(id)}</div>
            </div>
          ))}
        </div>

        {/* Dozens */}
        <div className="dozens">
          {["DOZEN1", "DOZEN2", "DOZEN3"].map((id, i) => (
            <div
              key={id}
              className="cell dozen"
              onContextMenu={(e) => {
                e.preventDefault();
                onRightClickSpot(id);
              }}
              onDrop={(e) => handleDrop(e, id)}
            >
              {i === 0 ? "1st 12" : i === 1 ? "2nd 12" : "3rd 12"}
              <div className="chip-stack">{renderChips(id)}</div>
            </div>
          ))}
        </div>

        {/* Even-money */}
        <div className="even-money">
          {OUTSIDE_SPOTS.map((s) => (
            <div
              key={s.id}
              className={`cell even ${s.className}`}
              onContextMenu={(e) => {
                e.preventDefault();
                onRightClickSpot(s.id);
              }}
              onDrop={(e) => handleDrop(e, s.id)}
            >
              {s.label}
              <div className="chip-stack">{renderChips(s.id)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
