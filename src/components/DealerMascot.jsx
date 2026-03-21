import React from "react";

export default function DealerMascot({ pose }) {
  const src = pose === "dealing" ? "/images/d2.png" : "/images/d1.png";
  const alt = pose === "dealing" ? "Dealer dealing cards" : "Dealer";

  return (
    <div className="dealer-mascot">
      <img
        src={src}
        alt={alt}
        className={`dealer-mascot-img${pose === "dealing" ? " dealer-mascot-img--dealing" : ""}`}
      />
    </div>
  );
}
