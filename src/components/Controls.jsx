import React from "react";

export default function Controls({
  canSpin,
  onSpin,
  onReady,
  onClear,
  spinning,
  totalBet,
}) {
  return (
    <div className="controls">
      <button className="btn primary" onClick={onSpin} disabled={!canSpin}>
        {spinning ? "Spinning..." : "Spin Wheel"}
      </button>
      <button className="btn" onClick={onReady} disabled={spinning}>
        Ready (Next Round)
      </button>
      <button className="btn ghost" onClick={onClear} disabled={spinning || totalBet === 0}>
        Clear Bets
      </button>
      <div className="bet-info">
        Current Bet: <b>{totalBet}</b> chips
      </div>
    </div>
  );
}
