import React from "react";
import Card from "./Card.jsx";
import { handTotal } from "../game/blackjack.js";

export default function Hand({ title, cards, hideHole = false, animateLast = false, isActive = false }) {
  let total = handTotal(cards);
  if (hideHole) total = "?";

  return (
    <div className={`hand ${isActive ? "hand--active" : ""}`}>
      <div className="hand-title">
        {title} · <span className="total">{total}</span>
      </div>
      <div className="cards">
        {cards.map((c, i) => (
          <Card
            key={c.key}
            card={c}
            faceUp={!(hideHole && i === 1)}
            dealAnimate={animateLast && i === cards.length - 1 && !(hideHole && i === 1)}
          />
        ))}
      </div>
    </div>
  );
}
