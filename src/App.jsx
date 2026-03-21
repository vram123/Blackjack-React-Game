import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import {
  buildDeck,
  shuffle,
  handTotal,
  takeFromShoe,
  isBlackjack,
  chipsForAmount,
  sumStack,
  pairForSplit,
} from "./game/blackjack.js";
import { delay } from "./utils/delay.js";

import DraggableChip from "./components/DraggableChip.jsx";
import BetZone from "./components/BetZone.jsx";
import Table from "./components/Table.jsx";
import Hand from "./components/Hand.jsx";
import DealerMascot from "./components/DealerMascot.jsx";
import SettingsModal from "./components/SettingsModal.jsx";

const START_BANKROLL = 1000;
const MAX_IOU = 5000;

const TIMING = {
  DEAL_STAGGER: 620,
  HIT_DELAY: 720,
  DEALER_DRAW: 780,
  BETWEEN_ROUNDS: 2600,
  AFTER_21: 950,
};

let hasBootstrappedGame = false;

function useSyncedRef(value) {
  const r = useRef(value);
  useEffect(() => {
    r.current = value;
  }, [value]);
  return r;
}

export default function App() {
  const shoeRef = useRef(shuffle(buildDeck()));

  const [bankroll, setBankroll] = useState(START_BANKROLL);
  const [betStack, setBetStack] = useState(() => chipsForAmount(25));

  const [playerHands, setPlayerHands] = useState([]);
  const [handBets, setHandBets] = useState([]);
  const [currentHand, setCurrentHand] = useState(0);
  const [dealer, setDealer] = useState([]);

  const [inRound, setInRound] = useState(false);
  const [isInitialDeal, setIsInitialDeal] = useState(false);
  const [message, setMessage] = useState("Drag chips to the bet circle, then play!");
  /** Set after each finished hand until the next deal (or tip dismissed). */
  const [roundEnd, setRoundEnd] = useState(null);

  const [iou, setIou] = useState(0);
  const [showLoanPopup, setShowLoanPopup] = useState(false);
  const [loanAmount, setLoanAmount] = useState(250);
  const [mustContinue, setMustContinue] = useState(false);

  const nextTimer = useRef(null);
  const dealingRef = useRef(false);

  /** True while a new hand is being dealt (locks bet changes). */
  const [isDealing, setIsDealing] = useState(false);
  /** True while dealer is drawing after stand / 21 (locks bet changes). */
  const [isResolving, setIsResolving] = useState(false);

  const [dealerPose, setDealerPose] = useState("idle");
  const [animatePlayerLast, setAnimatePlayerLast] = useState(false);
  const [animateDealerLast, setAnimateDealerLast] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jazzEnabled, setJazzEnabled] = useState(() => {
    try {
      const v = localStorage.getItem("bj-jazz");
      return v === null ? true : v === "true";
    } catch {
      return true;
    }
  });

  const jazzRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem("bj-jazz", jazzEnabled ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [jazzEnabled]);

  useEffect(() => {
    const el = jazzRef.current;
    if (!el) return;
    if (jazzEnabled) el.play().catch(() => {});
    else el.pause();
  }, [jazzEnabled]);

  const playerHandsRef = useSyncedRef(playerHands);
  const handBetsRef = useSyncedRef(handBets);
  const dealerRef = useSyncedRef(dealer);

  const dealRoundRef = useRef(async () => {});
  const resolveVsDealerRef = useRef(async () => {});

  const pull = useCallback((n = 1) => takeFromShoe(shoeRef, n), []);

  const playShuffleSound = useCallback(() => {
    const a = new Audio("/sounds/shuffle-cards.mp3");
    a.volume = 0.55;
    a.play().catch(() => {});
  }, []);

  const flashPlayerAnimate = useCallback(async () => {
    setAnimatePlayerLast(true);
    await delay(480);
    setAnimatePlayerLast(false);
  }, []);

  const flashDealerAnimate = useCallback(async () => {
    setAnimateDealerLast(true);
    await delay(480);
    setAnimateDealerLast(false);
  }, []);

  const scheduleNextRound = useCallback(() => {
    if (nextTimer.current) clearTimeout(nextTimer.current);
    playShuffleSound();
    nextTimer.current = setTimeout(() => {
      dealRoundRef.current?.();
    }, TIMING.BETWEEN_ROUNDS);
  }, [playShuffleSound]);

  /**
   * @param {"win"|"lose"|"push"} result
   * @param {string} subtitle
   * @param {{ profit?: number, loss?: number, returned?: number }} [money]
   */
  const finishRound = useCallback((result, subtitle, money = {}) => {
    setMessage(subtitle);
    setRoundEnd({
      result,
      tipHandled: false,
      profit: money.profit ?? null,
      loss: money.loss ?? null,
      returned: money.returned ?? null,
    });
  }, []);

  const onBetBlocked = useCallback(() => {
    setMessage("Can't bet while a hand is in play.");
  }, []);

  const resolvePayouts = useCallback(
    (finalDealer, hands, bets) => {
      const dTotal = handTotal(finalDealer);
      let bankDelta = 0;
      let totalProfit = 0;
      let totalLoss = 0;
      let totalReturned = 0;
      let wins = 0;
      let losses = 0;
      let pushes = 0;

      hands.forEach((h, idx) => {
        const wager = bets[idx] ?? 0;
        const pTotal = handTotal(h);
        if (pTotal > 21) {
          losses++;
          totalLoss += wager;
          return;
        }
        if (dTotal > 21 || pTotal > dTotal) {
          wins++;
          bankDelta += wager * 2;
          totalProfit += wager;
        } else if (pTotal === dTotal) {
          pushes++;
          bankDelta += wager;
          totalReturned += wager;
        } else {
          losses++;
          totalLoss += wager;
        }
      });

      setBankroll((prev) => prev + bankDelta);

      const net = totalProfit - totalLoss;
      const subtitle = `Hands — W:${wins}  L:${losses}  P:${pushes}`;
      if (net > 0) {
        finishRound("win", subtitle, { profit: net });
      } else if (net < 0) {
        finishRound("lose", subtitle, { loss: -net });
      } else if (totalReturned > 0) {
        finishRound("push", subtitle, { returned: totalReturned });
      } else {
        finishRound("push", `${subtitle} — even.`, {});
      }
    },
    [finishRound]
  );

  /** After stand, 21, or bust: play next split hand or resolve dealer. */
  const completeHandAfterStand = useCallback(
    async (fromIdx, snapshotHands = null) => {
      const hands = snapshotHands ?? playerHandsRef.current;
      if (fromIdx < hands.length - 1) {
        const nextIdx = fromIdx + 1;
        const nextHand = hands[nextIdx];
        if (nextHand.length === 1) {
          setDealerPose("dealing");
          await delay(TIMING.HIT_DELAY);
          const [card] = pull(1);
          setPlayerHands((h) =>
            h.map((hh, i) => (i === nextIdx ? [...hh, card] : hh))
          );
          await flashPlayerAnimate();
        }
        setCurrentHand(nextIdx);
        setDealerPose("idle");
        setMessage(`Hand ${nextIdx + 1} — your move!`);
      } else {
        setDealerPose("idle");
        setTimeout(() => resolveVsDealerRef.current(), TIMING.AFTER_21);
      }
    },
    [pull, flashPlayerAnimate]
  );

  const resolveVsDealer = useCallback(async () => {
    setIsResolving(true);
    try {
      setInRound(false);
      setIsInitialDeal(false);

      let d = [...dealerRef.current];
      setDealerPose("dealing");
      await delay(400);

      while (handTotal(d) < 17) {
        await delay(TIMING.DEALER_DRAW);
        const [card] = pull(1);
        d = [...d, card];
        setDealer(d);
        await flashDealerAnimate();
      }

      setDealerPose("idle");

      const hands = playerHandsRef.current;
      const bets = handBetsRef.current;
      resolvePayouts(d, hands, bets);
      scheduleNextRound();
    } finally {
      setIsResolving(false);
    }
  }, [pull, resolvePayouts, scheduleNextRound, flashDealerAnimate]);

  const dealRound = useCallback(async () => {
    if (dealingRef.current) return;
    if (nextTimer.current) {
      clearTimeout(nextTimer.current);
      nextTimer.current = null;
    }

    const wager = sumStack(betStack);
    if (bankroll < wager || wager <= 0) {
      if (iou < MAX_IOU) {
        setShowLoanPopup(true);
      } else {
        setMessage("You're out of chips and reached IOU limit! Game over.");
      }
      setInRound(false);
      setIsInitialDeal(false);
      return;
    }

    dealingRef.current = true;
    setIsDealing(true);
    setRoundEnd(null);
    setInRound(false);
    setIsInitialDeal(true);
    setPlayerHands([[]]);
    setDealer([]);
    setMessage("Dealing…");
    setDealerPose("dealing");

    await delay(TIMING.DEAL_STAGGER);

    const [p1] = pull(1);
    setPlayerHands([[p1]]);
    await flashPlayerAnimate();
    await delay(TIMING.DEAL_STAGGER);

    const [d1] = pull(1);
    setDealer([d1]);
    await flashDealerAnimate();
    await delay(TIMING.DEAL_STAGGER);

    const [p2] = pull(1);
    setPlayerHands([[p1, p2]]);
    await flashPlayerAnimate();
    await delay(TIMING.DEAL_STAGGER);

    const [d2] = pull(1);
    setDealer([d1, d2]);
    await flashDealerAnimate();
    await delay(320);

    setHandBets([wager]);
    setCurrentHand(0);
    setBankroll((prev) => prev - wager);

    const pFinal = [p1, p2];
    const dFinal = [d1, d2];
    const pBJ = isBlackjack(pFinal);
    const dBJ = isBlackjack(dFinal);

    if (pBJ || dBJ) {
      setIsInitialDeal(false);
      setInRound(false);
      setDealerPose("idle");

      if (pBJ && dBJ) {
        setBankroll((prev) => prev + wager);
        finishRound("push", "Both have blackjack — bet returned.", { returned: wager });
      } else if (pBJ) {
        const profit = Math.floor((wager * 3) / 2);
        setBankroll((prev) => prev + wager + profit);
        finishRound("win", "Blackjack — paid 3:2.", { profit });
      } else {
        finishRound("lose", "Dealer has blackjack.", { loss: wager });
      }

      dealingRef.current = false;
      setIsDealing(false);
      scheduleNextRound();
      return;
    }

    setIsInitialDeal(false);
    setInRound(true);
    setDealerPose("idle");
    setMessage("Your move!");
    dealingRef.current = false;
    setIsDealing(false);
  }, [bankroll, betStack, iou, pull, scheduleNextRound, finishRound]);

  useEffect(() => {
    dealRoundRef.current = dealRound;
  }, [dealRound]);

  useEffect(() => {
    resolveVsDealerRef.current = resolveVsDealer;
  }, [resolveVsDealer]);

  useEffect(() => {
    if (hasBootstrappedGame) return;
    hasBootstrappedGame = true;
    void (async () => {
      playShuffleSound();
      await delay(520);
      dealRoundRef.current?.();
    })();
  }, [playShuffleSound]);

  const playerHit = async () => {
    if (!inRound || dealingRef.current) return;

    const idx = currentHand;

    setDealerPose("dealing");
    await delay(TIMING.HIT_DELAY);
    const [card] = pull(1);

    const base = playerHands[idx] || [];
    const newHand = [...base, card];
    const total = handTotal(newHand);
    const updatedHands = playerHands.map((h, i) => (i === idx ? newHand : h));

    setPlayerHands(updatedHands);

    await delay(20);
    await flashPlayerAnimate();

    const multi = updatedHands.length > 1;

    if (total > 21) {
      setMessage(`Hand ${idx + 1} busts.`);
      setDealerPose("idle");
      await completeHandAfterStand(idx, updatedHands);
    } else if (total === 21) {
      setMessage(multi ? `Hand ${idx + 1} — 21.` : "21! Dealer plays…");
      setDealerPose("idle");
      await completeHandAfterStand(idx, updatedHands);
    } else {
      setMessage(multi ? `Hand ${idx + 1} — your move!` : "Your move!");
      setDealerPose("idle");
    }
  };

  const playerStand = async () => {
    if (!inRound || dealingRef.current) return;
    const idx = currentHand;
    await completeHandAfterStand(idx);
  };

  const playerDouble = async () => {
    if (!inRound || dealingRef.current) return;
    const h = playerHands[currentHand];
    if (!h || h.length !== 2) return;

    const idx = currentHand;
    const wager = handBets[idx];
    if (bankroll < wager) {
      setMessage("Not enough bankroll to double.");
      return;
    }

    setBankroll((b) => b - wager);
    setHandBets((bets) => bets.map((x, i) => (i === idx ? x * 2 : x)));

    setDealerPose("dealing");
    await delay(TIMING.HIT_DELAY);
    const [card] = pull(1);

    setPlayerHands((hands) =>
      hands.map((hh, i) => (i === idx ? [...hh, card] : hh))
    );

    await flashPlayerAnimate();

    const newHand = [...h, card];
    const total = handTotal(newHand);
    const updatedHands = playerHands.map((hh, i) => (i === idx ? newHand : hh));

    if (total > 21) {
      setMessage(`Hand ${idx + 1} busts after double.`);
      setDealerPose("idle");
      await completeHandAfterStand(idx, updatedHands);
    } else {
      setMessage(
        playerHands.length > 1 ? "Doubled — next hand or dealer." : "Double — dealer plays…"
      );
      setDealerPose("idle");
      await completeHandAfterStand(idx, updatedHands);
    }
  };

  const playerSplit = async () => {
    if (!inRound || dealingRef.current) return;
    if (playerHands.length !== 1) return;
    const h = playerHands[0];
    if (!h || h.length !== 2) return;
    if (!pairForSplit(h[0], h[1])) return;

    const wager = handBets[0];
    if (bankroll < wager) {
      setMessage("Not enough chips to split.");
      return;
    }

    const [c1, c2] = h;
    setBankroll((b) => b - wager);
    setHandBets([wager, wager]);
    setPlayerHands([[c1], [c2]]);
    setCurrentHand(0);

    setDealerPose("dealing");
    await delay(TIMING.HIT_DELAY);
    const [card] = pull(1);
    setPlayerHands((hands) => {
      const nh = [...hands];
      nh[0] = [c1, card];
      return nh;
    });
    await flashPlayerAnimate();
    setDealerPose("idle");
    setMessage("Split! Play hand 1 — your move.");
  };

  const hideDealerHole = (inRound || isInitialDeal) && dealer.length > 1;

  const canDouble =
    inRound &&
    playerHands[currentHand]?.length === 2 &&
    bankroll >= handBets[currentHand];

  const canSplit =
    inRound &&
    playerHands.length === 1 &&
    playerHands[0]?.length === 2 &&
    pairForSplit(playerHands[0][0], playerHands[0][1]) &&
    bankroll >= handBets[0];

  const betTotal = sumStack(betStack);
  const betLocked = inRound || isInitialDeal || isDealing || isResolving;
  /** After a hand ends, allow stacking chips for the next deal even if overlay is open. */
  const betAdjustLocked = betLocked && !roundEnd;

  const tipDealer = (amount) => {
    if (!roundEnd || roundEnd.tipHandled) return;
    if (bankroll < amount) {
      setMessage("Not enough chips for that tip.");
      return;
    }
    setBankroll((b) => b - amount);
    setRoundEnd((re) =>
      re ? { ...re, tipHandled: true, tipAmount: amount } : null
    );
  };

  const skipTip = () => {
    setRoundEnd((re) => (re ? { ...re, tipHandled: true } : null));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="layout">
        <header className="top-bar">
          <h1 className="title">Vram's Blackjack Table</h1>
          <div className="top-actions">
            <button type="button" className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
              ⚙
            </button>
          </div>
        </header>

        <audio ref={jazzRef} src="/sounds/jazz.mp3" loop />

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          jazzEnabled={jazzEnabled}
          onJazzChange={setJazzEnabled}
        />

        {!roundEnd && (
          <div className="status">
            <div className="msg">{message}</div>
          </div>
        )}

        <div className="dealer-mascot-slot" aria-hidden="true">
          <DealerMascot pose={dealerPose} />
        </div>

        {roundEnd && (
          <div
            className="round-end-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="round-outcome-title"
            aria-live="polite"
          >
            <div className="round-end-inner">
              <p id="round-outcome-title" className={`outcome outcome-${roundEnd.result}`}>
                {roundEnd.result === "win" && "You win!"}
                {roundEnd.result === "lose" && "Dealer wins."}
                {roundEnd.result === "push" && "Push"}
              </p>
              <p className="round-end-detail">{message}</p>
              {roundEnd.profit != null && roundEnd.profit > 0 && (
                <p className="round-end-money win">Net win: +{roundEnd.profit} chips</p>
              )}
              {roundEnd.loss != null && roundEnd.loss > 0 && (
                <p className="round-end-money lose">Lost: {roundEnd.loss} chips</p>
              )}
              {roundEnd.returned != null && roundEnd.returned > 0 && (
                <p className="round-end-money push">Bet returned: {roundEnd.returned} chips</p>
              )}
              {!roundEnd.tipHandled && (
                <div className="tip-block">
                  <span className="tip-label">Tip the dealer?</span>
                  <div className="tip-buttons">
                    {[5, 25, 50].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="tip-btn"
                        onClick={() => tipDealer(amt)}
                        disabled={bankroll < amt}
                      >
                        Tip {amt}
                      </button>
                    ))}
                    <button type="button" className="tip-skip" onClick={skipTip}>
                      No tip
                    </button>
                  </div>
                </div>
              )}
              {roundEnd.tipHandled && roundEnd.tipAmount > 0 && (
                <p className="tip-thanks">Thanks for the tip!</p>
              )}
            </div>
          </div>
        )}

        <Table>
          <div className="table-inner">
            <div className="dealer-area">
              <div className="dealer-hand-wrap">
                <Hand title="Dealer" cards={dealer} hideHole={hideDealerHole} animateLast={animateDealerLast} />
              </div>
            </div>

            <div className="felt-center">
              <div className="felt-bet-pile" aria-hidden="true">
                {betStack.map((c, i) => (
                  <div
                    key={c.id ?? `${c.value}-${i}`}
                    className={`felt-chip chip-${c.color}`}
                    style={{
                      zIndex: i,
                      transform: `translate(${i * 4}px, ${-i * 5}px)`,
                    }}
                  >
                    <span>{c.value}</span>
                  </div>
                ))}
              </div>
              <div className="felt-bet-amount">{betTotal > 0 ? betTotal : "—"}</div>
            </div>

            <div className="player-hands">
              {playerHands.map((h, i) => (
                <Hand
                  key={`ph-${i}`}
                  title={playerHands.length > 1 ? `Player ${i + 1}` : "Player"}
                  cards={h}
                  animateLast={animatePlayerLast && i === currentHand}
                  isActive={i === currentHand}
                />
              ))}
            </div>
          </div>
        </Table>

        <div className="player-dock">
          <div className="dock-section dock-chips">
            <p className="dock-label">Chips</p>
            <div className="chips">
              <DraggableChip value={25} color="red" disabled={betAdjustLocked} />
              <DraggableChip value={50} color="blue" disabled={betAdjustLocked} />
              <DraggableChip value={100} color="green" disabled={betAdjustLocked} />
            </div>
          </div>

          <BetZone
            betStack={betStack}
            setBetStack={setBetStack}
            betLocked={betAdjustLocked}
            onBetBlocked={onBetBlocked}
          />

          <div className="dock-section dock-money">
            <p className="dock-label">Bankroll</p>
            <p className="dock-value">{Math.max(bankroll, 0)}</p>
            {iou > 0 && <p className="dock-iou">IOU: {iou}</p>}
          </div>

          <div className="dock-section dock-actions">
            <p className="dock-label">Play</p>
            <div className="controls">
              <button type="button" className="hit" onClick={playerHit} disabled={!inRound}>
                Hit
              </button>
              <button type="button" className="stand" onClick={playerStand} disabled={!inRound}>
                Stand
              </button>
              <button type="button" className="double" onClick={playerDouble} disabled={!canDouble}>
                Double
              </button>
              <button type="button" className="split" onClick={playerSplit} disabled={!canSplit}>
                Split
              </button>
            </div>
          </div>
        </div>

        <p className="helper-tip">
          Drag chips onto the bet circle to add amounts; use −25 / −50 / −100 to lower the bet. Shuffle plays each round.
        </p>

        {showLoanPopup && (
          <div className="loan-popup">
            <div className="loan-content">
              <h2>Casino Credit</h2>
              <p>You can borrow up to 5,000 chips.</p>
              <p>Borrowed so far: {iou}</p>

              <input
                type="range"
                min="250"
                max={MAX_IOU - iou}
                step="250"
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseInt(e.target.value, 10))}
                className="loan-slider"
              />
              <p>Borrow Amount: {loanAmount}</p>

              <div className="loan-actions">
                <button
                  type="button"
                  className="borrow"
                  onClick={() => {
                    setIou((prev) => prev + loanAmount);
                    setBankroll((prev) => prev + loanAmount);
                    setMessage(`Borrowed ${loanAmount} chips from Casino.`);
                    setMustContinue(true);
                  }}
                >
                  Borrow
                </button>
                <button type="button" className="cancel" onClick={() => setMustContinue(true)}>
                  Cancel
                </button>
              </div>

              {mustContinue && (
                <button
                  type="button"
                  className="continue"
                  onClick={() => {
                    setShowLoanPopup(false);
                    setMustContinue(false);
                    void (async () => {
                      playShuffleSound();
                      await delay(520);
                      dealRoundRef.current?.();
                    })();
                  }}
                >
                  Continue Playing
                </button>
              )}
            </div>
          </div>
        )}

        <p className="disclaimer">Good luck!</p>
      </div>
    </DndProvider>
  );
}
