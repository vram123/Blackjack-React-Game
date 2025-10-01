import React, { useEffect, useRef, useState } from "react";
import { WHEEL_ORDER, numberColor } from "../utils/roulette";

const RADIUS = 150;
const INNER = 90;
const TEXT_R = 120;

export default function RouletteWheel({
  rotationDeg,
  spinning,
  winningNumber,
  onSpinEnd,
}) {
  const wheelRef = useRef(null);
  const [ballAngle, setBallAngle] = useState(0);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const handler = () => onSpinEnd && onSpinEnd();
    el.addEventListener("transitionend", handler);
    return () => el.removeEventListener("transitionend", handler);
  }, [onSpinEnd]);

  // Ball effect
  useEffect(() => {
    let ballTimer;
    if (spinning) {
      // ball starts orbiting
      let angle = 0;
      ballTimer = setInterval(() => {
        angle = (angle + 15) % 360;
        setBallAngle(angle);
      }, 50);
    } else if (winningNumber !== null) {
      // ball lands in correct pocket
      const idx = WHEEL_ORDER.indexOf(winningNumber);
      const angle =
        (idx + 0.5) * (360 / WHEEL_ORDER.length) - 90; // align with pocket
      setBallAngle(angle);
    }
    return () => clearInterval(ballTimer);
  }, [spinning, winningNumber]);

  const sliceAngle = 360 / WHEEL_ORDER.length;

  return (
    <div className="wheel-wrap">
      
      <div
        ref={wheelRef}
        className={`wheel-svg ${spinning ? "is-spinning" : ""}`}
        style={{ transform: `rotate(${rotationDeg}deg)` }}
      >
        <svg viewBox="-170 -170 340 340">
          {WHEEL_ORDER.map((num, i) => {
            const start = (i * sliceAngle - 90) * (Math.PI / 180);
            const end = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);
            const x1 = RADIUS * Math.cos(start);
            const y1 = RADIUS * Math.sin(start);
            const x2 = RADIUS * Math.cos(end);
            const y2 = RADIUS * Math.sin(end);
            const largeArc = sliceAngle > 180 ? 1 : 0;
            const color =
              num === 0
                ? "#1a8f3a"
                : numberColor(num) === "red"
                ? "#c9252b"
                : "#222";

            return (
              <path
                key={num}
                d={`M${x1},${y1} A${RADIUS},${RADIUS} 0 ${largeArc} 1 ${x2},${y2} L${
                  INNER * Math.cos(end)
                },${INNER * Math.sin(end)} A${INNER},${INNER} 0 ${largeArc} 0 ${
                  INNER * Math.cos(start)
                },${INNER * Math.sin(start)} Z`}
                fill={color}
                stroke="#0e141c"
                strokeWidth="1.5"
              />
            );
          })}

          {WHEEL_ORDER.map((num, i) => {
            const angle = (i + 0.5) * sliceAngle - 90;
            const rad = (angle * Math.PI) / 180;
            const x = TEXT_R * Math.cos(rad);
            const y = TEXT_R * Math.sin(rad);
            return (
              <text
                key={`t${num}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="#e6edf8"
                transform={`rotate(${angle + 90} ${x} ${y})`}
              >
                {num}
              </text>
            );
          })}

          {/* Ball */}
          <circle
            cx={110 * Math.cos((ballAngle * Math.PI) / 180)}
            cy={110 * Math.sin((ballAngle * Math.PI) / 180)}
            r="8"
            fill="white"
            stroke="black"
          />
        </svg>
      </div>

      {winningNumber !== null && (
        <div className="result-tag">
          Result: <b>{winningNumber}</b>
        </div>
      )}
    </div>
  );
}
