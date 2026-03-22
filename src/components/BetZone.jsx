import React from "react";
import { useDrop } from "react-dnd";
import { ItemTypes } from "./DraggableChip.jsx";
import { chipsForAmount, sumStack } from "../game/blackjack.js";

export default function BetZone({
  betStack,
  setBetStack,
  betLocked = false,
  onBetBlocked,
  nextHandNote = false,
}) {
  const betTotal = sumStack(betStack);

  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.CHIP,
      drop: (item) => {
        if (betLocked) {
          onBetBlocked?.();
          return;
        }
        setBetStack((prev) => [
          ...prev,
          { value: item.value, color: item.color, id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` },
        ]);
      },
    }),
    [betLocked, setBetStack, onBetBlocked]
  );

  const dec = (amt) => {
    if (betLocked) {
      onBetBlocked?.();
      return;
    }
    setBetStack((prev) => chipsForAmount(Math.max(0, sumStack(prev) - amt)));
  };

  return (
    <div ref={drop} className={`bet-zone ${betLocked ? "bet-zone--locked" : ""}`}>
      <p>Bet</p>
      <p className="bet-total">{betTotal}</p>
      <p className="bet-drop-hint">
        {betLocked
          ? "Bet locked during play"
          : nextHandNote
            ? "Note: This bet is for your next game."
            : "Drop chips here"}
      </p>
      <div className="bet-adjust">
        <button type="button" disabled={betLocked} onClick={() => dec(25)}>
          -25
        </button>
        <button type="button" disabled={betLocked} onClick={() => dec(50)}>
          -50
        </button>
        <button type="button" disabled={betLocked} onClick={() => dec(100)}>
          -100
        </button>
      </div>
    </div>
  );
}
