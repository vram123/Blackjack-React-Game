import React, { useState } from "react";
import "./CasinoIOU.css";

export default function CasinoIOU({ debt, onBorrow, onClose }) {
  const [sliderVal, setSliderVal] = useState(0);

  const maxBorrow = 5000 - debt;
  const maxSteps = maxBorrow / 250;

  return (
    <div className="iou-overlay">
      <div className="iou-box">
        <h2>💸 Casino Credit</h2>
        <p>
          Current Debt: <span className="red">-{debt}</span> / 5000
        </p>

        <input
          type="range"
          min="0"
          max={maxSteps}
          step="1"
          value={sliderVal}
          onChange={(e) => setSliderVal(parseInt(e.target.value))}
        />

        <p>
          Borrowing: <b>{sliderVal * 250}</b> chips
        </p>

        <div className="iou-buttons">
          <button
            onClick={() => {
              if (sliderVal > 0) onBorrow(sliderVal * 250);
            }}
          >
            Confirm Borrow
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
