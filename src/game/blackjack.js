export const SUITS = ["♠", "♥", "♦", "♣"];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

let GLOBAL_CARD_ID = 0;

export function buildDeck() {
  const deck = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({ rank: r, suit: s, id: `${r}${s}` });
    }
  }
  return deck;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cardValue(rank) {
  if (rank === "A") return 11;
  if (["K", "Q", "J"].includes(rank)) return 10;
  return parseInt(rank, 10);
}

export function handTotal(cards) {
  let total = 0;
  let aces = 0;
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

export function withCardKeys(cards) {
  return cards.map((c) => ({
    ...c,
    key: `card-${GLOBAL_CARD_ID++}`,
  }));
}

export function takeFromShoe(shoeRef, n = 1) {
  if (shoeRef.current.length < n) {
    shoeRef.current = shuffle(buildDeck());
  }
  const raw = shoeRef.current.slice(0, n);
  shoeRef.current = shoeRef.current.slice(n);
  return withCardKeys(raw);
}

export function isBlackjack(cards) {
  return cards.length === 2 && handTotal(cards) === 21;
}

/** Same rank, or any two 10-value cards (10/J/Q/K) for split. */
export function pairForSplit(c1, c2) {
  if (!c1 || !c2) return false;
  if (c1.rank === c2.rank) return true;
  const tens = new Set(["10", "J", "Q", "K"]);
  return tens.has(c1.rank) && tens.has(c2.rank);
}

export const CHIP_ORDER = [100, 50, 25];

export const CHIP_COLORS = {
  25: "red",
  50: "blue",
  100: "green",
};

/** Rebuild a chip stack from a total for display (greedy largest-first). */
export function chipsForAmount(total) {
  let t = Math.max(0, Math.floor(total));
  const stack = [];
  for (const d of CHIP_ORDER) {
    while (t >= d) {
      stack.push({
        value: d,
        color: CHIP_COLORS[d],
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      });
      t -= d;
    }
  }
  return stack;
}

export function sumStack(stack) {
  return stack.reduce((s, c) => s + c.value, 0);
}
