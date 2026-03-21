import React from "react";

export default function Card({ card, faceUp = true, dealAnimate = false }) {
  if (!faceUp) return <div className="card back" />;

  if (!card || !card.rank || !card.suit) {
    return <div className="card back" />;
  }

  const isRed = card.suit === "♥" || card.suit === "♦";

  return (
    <div className={`card ${isRed ? "red" : ""} ${dealAnimate ? "deal-in" : ""}`}>
      <div className="pips top">
        {card.rank}
        {card.suit}
      </div>
      <div className="pips bot">
        {card.rank}
        {card.suit}
      </div>
    </div>
  );
}
