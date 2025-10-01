import React, { useEffect, useRef, useState } from "react";
import "./App.css";

/* ===== Drag & Drop (react-dnd) ===== */
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
const ItemTypes = { CHIP: "chip" };

/* ---------- Draggable Chips ---------- */
function DraggableChip({ value, color }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CHIP,
    item: { value },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));
  return (
    <div
      ref={drag}
      className={`chip ${color}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      title={`Drag ${value} onto the bet circle`}
    >
      {value}
    </div>
  );
}

/* ---------- Bet Drop Zone ---------- */
function BetZone({ bet, setBet }) {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.CHIP,
    drop: (item) => setBet((prev) => prev + item.value),
  }));

  const dec = (amt) => setBet((prev) => Math.max(0, prev - amt));

  return (
    <div ref={drop} className="bet-zone">
      <p>Next Bet</p>
      <p style={{ fontSize: "1.4rem" }}>{bet}</p>
      <div className="bet-adjust">
        <button onClick={() => dec(25)}>-25</button>
        <button onClick={() => dec(50)}>-50</button>
        <button onClick={() => dec(100)}>-100</button>
      </div>
    </div>
  );
}

/* ======== Blackjack helpers ======== */
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function buildDeck() {
  const deck = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({ rank: r, suit: s, id: `${r}${s}` });
    }
  }
  return deck;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i=a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function cardValue(rank) {
  if (rank === "A") return 11;
  if (["K","Q","J"].includes(rank)) return 10;
  return parseInt(rank, 10);
}
function handTotal(cards) {
  let total = 0, aces = 0;
  for (const c of cards) {
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

/* ---------- Visual primitives ---------- */
function Table({ children }) {
  return <div className="table">{children}</div>;
}
function Card({ card, faceUp = true }) {
  if (!faceUp) return <div className="card back" />;

  if (!card || !card.rank || !card.suit) {
    return <div className="card back" />;
  }

  const isRed = card.suit === "♥" || card.suit === "♦";

  return (
    <div className={`card ${isRed ? "red" : ""}`}>
      <div className="pips top">{card.rank}{card.suit}</div>
      <div className="pips bot">{card.rank}{card.suit}</div>
    </div>
  );
}
function Hand({ title, cards, hideHole = false }) {
  let total = handTotal(cards);
  if (hideHole) total = "?";

  return (
    <div className="hand">
      <div className="hand-title">
        {title} · <span className="total">{total}</span>
      </div>
      <div className="cards">
        {cards.map((c, i) => (
          <Card key={c.key} card={c} faceUp={!(hideHole && i === 1)} />
        ))}
      </div>
    </div>
  );
}

/* ===== stable unique ids for dealt cards ===== */
let GLOBAL_CARD_ID = 0;

/* ============ Game ============ */
export default function App() {
  const START_BANKROLL = 1000;

  const shoeRef = useRef(shuffle(buildDeck()));
  const [shoe, setShoe] = useState(shoeRef.current);

  const [bankroll, setBankroll] = useState(START_BANKROLL);
  const [bet, setBet] = useState(25);

  const [playerHands, setPlayerHands] = useState([]);
  const [handBets, setHandBets] = useState([]);
  const [currentHand, setCurrentHand] = useState(0);
  const [dealer, setDealer] = useState([]);

  const [inRound, setInRound] = useState(false);
  const [message, setMessage] = useState("Drag chips to the bet circle, then play!");

  const nextTimer = useRef(null);

  // 🎶 Jazz Music
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  useEffect(() => {
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying]);

  function take(n = 1) {
    if (shoeRef.current.length < n) {
      shoeRef.current = shuffle(buildDeck());
    }
    const chunk = shoeRef.current.slice(0, n).map((c) => ({
      ...c,
      key: `card-${GLOBAL_CARD_ID++}`,
    }));
    shoeRef.current = shoeRef.current.slice(n);
    setShoe(shoeRef.current);
    return chunk;
  }

  function dealRound() {
    if (nextTimer.current) { clearTimeout(nextTimer.current); nextTimer.current = null; }

    // ✅ allow negative bankroll, just keep playing
    if (bet <= 0) {
      setMessage("Place a valid bet to continue.");
      setInRound(false);
      return;
    }

    const d = [take(1)[0], take(1)[0]];
    const p = [take(1)[0], take(1)[0]];

    setDealer(d);
    setPlayerHands([p]);
    setHandBets([bet]);
    setCurrentHand(0);
    setBankroll((prev) => prev - bet);
    setInRound(true);
    setMessage("Your move!");
  }

  function scheduleNextRound() {
    nextTimer.current = setTimeout(() => {
      dealRound();
    }, 1600);
  }

  function resolveVsDealer() {
    let d = dealer;
    while (handTotal(d) < 17) {
      d = [...d, take(1)[0]];
    }
    setDealer(d);

    const dTotal = handTotal(d);
    let wins = 0, losses = 0, pushes = 0;

    playerHands.forEach((h, idx) => {
      const wager = handBets[idx];
      const pTotal = handTotal(h);

      if (pTotal > 21) {
        losses++;
      } else if (dTotal > 21 || pTotal > dTotal) {
        wins++;
        setBankroll((prev) => prev + wager * 2);
      } else if (pTotal === dTotal) {
        pushes++;
        setBankroll((prev) => prev + wager);
      } else {
        losses++;
      }
    });

    setMessage(`Result — W:${wins}  L:${losses}  P:${pushes}`);
    setInRound(false);
    scheduleNextRound();
  }

  function playerHit() {
    if (!inRound) return;

    setPlayerHands((hands) => {
      const copy = hands.map((h, idx) =>
        idx === currentHand ? [...h, take(1)[0]] : h
      );

      const thisHand = copy[currentHand];
      const total = handTotal(thisHand);

      // auto-advance on bust or 21
      if (total > 21) {
        setMessage("Bust!");
        setTimeout(resolveVsDealer, 800);
      } else if (total === 21) {
        setMessage("21! Standing...");
        setTimeout(resolveVsDealer, 800);
      }

      return copy;
    });
  }

  function playerStand() {
    if (!inRound) return;
    resolveVsDealer();
  }

  // start first round
  useEffect(() => { dealRound(); }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="layout">
        <h1 className="title">Vram's Blackjack Table</h1>

        {/* 🎶 Jazz Music */}
        <audio ref={audioRef} src="/jazz.mp3" loop />
        <button 
          className="music-btn"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? "🎶 Pause Jazz" : "🎵 Play Jazz"}
        </button>

        {/* status */}
        <div className="status">
          <div>Bet: {bet} • Bankroll: {bankroll}</div>
          <div className="msg">{message}</div>
          <div className="helper-tip">
             Drag your chips to the bet circle to add, or use buttons to remove them.
          </div>
        </div>

        {/* chips */}
        <div className="chips">
          <DraggableChip value={25} color="red" />
          <DraggableChip value={50} color="blue" />
          <DraggableChip value={100} color="green" />
        </div>

        {/* table */}
        <Table>
          <Hand title="Dealer" cards={dealer} hideHole={inRound} />
          <BetZone bet={bet} setBet={setBet} />
          <Hand title="Player" cards={playerHands[0] || []} />
        </Table>

        {/* actions */}
        <div className="controls">
          <button className="hit" onClick={playerHit} disabled={!inRound}>
            Hit
          </button>
          <button className="stand" onClick={playerStand} disabled={!inRound}>
            Stand
          </button>
        </div>

        <p className="disclaimer">
          Some cards may be blank. I call it <strong>mystery cards</strong>. Good luck!
        </p>
      </div>
    </DndProvider>
  );
}
