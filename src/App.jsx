import React, { useMemo, useState, useRef } from "react";
import "./App.css";
import RouletteWheel from "./components/RouletteWheel";
import BettingBoard from "./components/BettingBoard";
import ChipPalette from "./components/ChipPalette";
import Controls from "./components/Controls";
import CasinoIOU from "./components/CasinoIOU";   // NEW COMPONENT
import {
  WHEEL_ORDER,
  SEGMENT_ANGLE,
  numberColor,
  colorName,
  isWinningForSpot,
  PAYOUTS,
} from "./utils/roulette";

export default function App() {
  const [balance, setBalance] = useState(100);
  const [casinoDebt, setCasinoDebt] = useState(0);
  const [chipsOnBoard, setChipsOnBoard] = useState({});
  const [rotationDeg, setRotationDeg] = useState(0);
  const [winningNumber, setWinningNumber] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);
  const [showIOU, setShowIOU] = useState(false);

  // audio refs
  const spinAudioRef = useRef(null);
  const jazzRef = useRef(null);
  const [isJazzPlaying, setIsJazzPlaying] = useState(false);

  const totalBet = useMemo(
    () =>
      Object.values(chipsOnBoard).reduce(
        (sum, arr) => sum + arr.reduce((s, c) => s + c.value, 0),
        0
      ),
    [chipsOnBoard]
  );

  const canSpin = !spinning && totalBet > 0 && balance > 0;

  // ---------- Chip placement ----------
  const placeChip = (spotId, chipValue) => {
    if (spinning) return;
    if (balance < chipValue) {
      setShowIOU(true);
      return;
    }

    setChipsOnBoard((prev) => {
      const arr = prev[spotId] ? [...prev[spotId]] : [];
      const id = `${spotId}:${Date.now()}:${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      arr.push({ id, value: chipValue, idx: arr.length });
      return { ...prev, [spotId]: arr };
    });
    setBalance((b) => b - chipValue);
  };

  const removeOneChip = (spotId) => {
    if (spinning) return;
    const arr = chipsOnBoard[spotId];
    if (!arr || arr.length === 0) return;

    const popped = arr[arr.length - 1];
    setChipsOnBoard((prev) => {
      const next = { ...prev };
      next[spotId] = arr.slice(0, -1);
      if (next[spotId].length === 0) delete next[spotId];
      return next;
    });
    setBalance((b) => b + popped.value);
  };

  const clearAllBets = () => {
    if (spinning) return;
    const refund = totalBet;
    setChipsOnBoard({});
    setBalance((b) => b + refund);
  };

  // ---------- Spin flow ----------
  const spinWheel = () => {
    if (!canSpin) {
      if (balance <= 0) setShowIOU(true);
      return;
    }

    setSpinning(true);
    setWinningNumber(null);

    // play spin sound
    if (spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current.play();
      setTimeout(() => {
        if (spinAudioRef.current) spinAudioRef.current.pause();
      }, 8000);
    }

    // pick winning number
    const win = Math.floor(Math.random() * 37);
    setWinningNumber(win);

    // compute final wheel rotation
    const idx = WHEEL_ORDER.indexOf(win);
    const extraTurns = 6 + Math.floor(Math.random() * 3);
    const endDeg =
      extraTurns * 360 + idx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    setRotationDeg((prev) => prev + endDeg);
  };

  const onSpinEnd = () => {
    if (winningNumber === null) return;

    let winnings = 0;
    for (const [spotId, chips] of Object.entries(chipsOnBoard)) {
      const won = isWinningForSpot(spotId, winningNumber);
      if (!won) continue;

      const payoutMult = PAYOUTS[spotId] ?? PAYOUTS.STRAIGHT;
      for (const chip of chips) {
        winnings += chip.value * payoutMult;
      }
    }

    let message = "";
    if (winnings > 0) {
      setBalance((b) => b + winnings);
      message = `${winningNumber} ${colorName(
        winningNumber
      )} WINNER +${winnings}`;
    } else {
      message = `${winningNumber} ${colorName(
        winningNumber
      )} LOST -${totalBet}`;
    }

    setResultMessage(message);
    setTimeout(() => setResultMessage(null), 4000);

    setSpinning(false);
  };

  const readyNext = () => {
    setChipsOnBoard({});
    setWinningNumber(null);
  };

  // ---------- Jazz controls ----------
  const toggleJazz = () => {
    if (!jazzRef.current) return;
    if (isJazzPlaying) {
      jazzRef.current.pause();
      setIsJazzPlaying(false);
    } else {
      jazzRef.current.currentTime = 0;
      jazzRef.current.play();
      setIsJazzPlaying(true);
    }
  };

  // ---------- Casino IOU ----------
  const borrowFromCasino = (amount) => {
    if (casinoDebt + amount > 5000) return;
    setCasinoDebt((d) => d + amount);
    setBalance((b) => b + amount);
    setShowIOU(false);
  };

  return (
    <div className="App">
      <header className="topbar">
        <h1 className="title">Vram's Roulette Table</h1>
        <div className="bank">
          <span className="label">Balance:</span>
          <span className="value">{balance} chips</span>
          {casinoDebt > 0 && (
            <span className="debt">CASINO: -{casinoDebt}</span>
          )}
        </div>
      </header>

      <div className="layout">
        <section className="left">
          <RouletteWheel
            rotationDeg={rotationDeg}
            spinning={spinning}
            winningNumber={winningNumber}
            onSpinEnd={onSpinEnd}
          />
          <Controls
            canSpin={canSpin}
            onSpin={spinWheel}
            onReady={readyNext}
            onClear={clearAllBets}
            spinning={spinning}
            totalBet={totalBet}
          />

          <button onClick={toggleJazz} className="jazz-btn">
            {isJazzPlaying ? "Stop Music" : "Play Music"}
          </button>
        </section>

        <section className="right">
          <ChipPalette />
          <BettingBoard
            numberColor={numberColor}
            chipsOnBoard={chipsOnBoard}
            onDropChip={(spotId, chipValue) => placeChip(spotId, chipValue)}
            onRightClickSpot={removeOneChip}
            winningNumber={winningNumber}
          />
        </section>
      </div>

      {/* Audio elements */}
      <audio ref={spinAudioRef} src="/roulette.mp3" preload="auto" />
      <audio ref={jazzRef} src="/jazz.mp3" preload="auto" loop />

      {/* Popup message */}
      {resultMessage && <div className="popup">{resultMessage}</div>}

      {/* IOU Popup */}
      {showIOU && (
        <CasinoIOU
          debt={casinoDebt}
          onBorrow={borrowFromCasino}
          onClose={() => setShowIOU(false)}
        />
      )}
    </div>
  );
}
