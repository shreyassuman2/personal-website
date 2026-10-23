// Live poker card on the about page: pick two hands, get exact all-in equities, then watch a random runout.
// The CSS demo (.pk) stays the default; this builds a .pk-live view beside it in the same style.
// Cards are ints 0–51: rank * 4 + suit, ranks 0–12 = 2..A, suits ♠ ♥ ♦ ♣.

const RANKS = '23456789TJQKA';
const SUITS = '♠♥♦♣';
const NAMES = ['Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];
const PLURAL = ['twos', 'threes', 'fours', 'fives', 'sixes', 'sevens', 'eights', 'nines', 'tens', 'jacks', 'queens', 'kings', 'aces'];

const rankOf = (c) => c >> 2;
const suitOf = (c) => c & 3;
const isRed = (c) => suitOf(c) === 1 || suitOf(c) === 2;
const label = (c) => (rankOf(c) === 8 ? '10' : RANKS[rankOf(c)]) + SUITS[suitOf(c)];

/* ---------- Hand evaluator ----------
   score(cards) ranks the best 5 of 7 as one comparable int: category << 26 | primary << 22 | secondary << 18 | kickers.
   Kickers are a bitmask of ranks; two masks with the same number of bits compare correctly as plain ints. */
const counts = new Int8Array(13);
const suitMask = new Int32Array(4);

function popcount(m) { let n = 0; while (m) { m &= m - 1; n++; } return n; }
function topBits(m, k) {
  let out = 0;
  for (let r = 12; r >= 0 && k > 0; r--) if (m & (1 << r)) { out |= 1 << r; k--; }
  return out;
}
// Highest rank of a five-in-a-row in the mask, or -1. The ace also plays low (A-2-3-4-5 is five-high).
function straightHigh(m) {
  const m2 = (m << 1) | ((m >> 12) & 1);
  for (let h = 13; h >= 4; h--) if (((m2 >> (h - 4)) & 31) === 31) return h - 1;
  return -1;
}

function score(cards) {
  counts.fill(0); suitMask.fill(0);
  let mask = 0;
  for (let i = 0; i < 7; i++) {
    const r = cards[i] >> 2;
    counts[r]++; suitMask[cards[i] & 3] |= 1 << r; mask |= 1 << r;
  }
  // With 7 cards a flush can't share the hand with quads or a full house, so it's safe to check first
  for (let s = 0; s < 4; s++) {
    const m = suitMask[s];
    if (popcount(m) >= 5) {
      const sf = straightHigh(m);
      return sf >= 0 ? (8 << 26) | (sf << 22) : (5 << 26) | topBits(m, 5);
    }
  }
  let quad = -1, trips = -1, trips2 = -1, pair1 = -1, pair2 = -1;
  for (let r = 12; r >= 0; r--) {
    const k = counts[r];
    if (k === 4) quad = r;
    else if (k === 3) { if (trips < 0) trips = r; else if (trips2 < 0) trips2 = r; }
    else if (k === 2) { if (pair1 < 0) pair1 = r; else if (pair2 < 0) pair2 = r; }
  }
  if (quad >= 0) return (7 << 26) | (quad << 22) | topBits(mask & ~(1 << quad), 1);
  if (trips >= 0 && (trips2 >= 0 || pair1 >= 0)) return (6 << 26) | (trips << 22) | (Math.max(trips2, pair1) << 18);
  const st = straightHigh(mask);
  if (st >= 0) return (4 << 26) | (st << 22);
  if (trips >= 0) return (3 << 26) | (trips << 22) | topBits(mask & ~(1 << trips), 2);
  if (pair2 >= 0) return (2 << 26) | (pair1 << 22) | (pair2 << 18) | topBits(mask & ~(1 << pair1) & ~(1 << pair2), 1);
  if (pair1 >= 0) return (1 << 26) | (pair1 << 22) | topBits(mask & ~(1 << pair1), 3);
  return topBits(mask, 5);
}

function handName(v) {
  const cat = v >> 26, p = (v >> 22) & 15, q = (v >> 18) & 15;
  switch (cat) {
    case 8: return p === 12 ? 'Royal flush' : 'Straight flush';
    case 7: return `Four ${PLURAL[p]}`;
    case 6: return `Full house, ${PLURAL[p]} full`;
    case 5: return 'Flush';
    case 4: return `${NAMES[p]}-high straight`;
    case 3: return `Three ${PLURAL[p]}`;
    case 2: return `Two pair, ${PLURAL[p]} and ${PLURAL[q]}`;
    case 1: return `Pair of ${PLURAL[p]}`;
    default: return `${NAMES[31 - Math.clz32(v & 0x1fff)]} high`;
  }
}
// Preflop shorthand: QQ, AKs, AKo
function startingHand(a, b) {
  const [hi, lo] = rankOf(a) >= rankOf(b) ? [a, b] : [b, a];
  const ranks = RANKS[rankOf(hi)] + RANKS[rankOf(lo)];
  return rankOf(a) === rankOf(b) ? ranks : ranks + (suitOf(a) === suitOf(b) ? 's' : 'o');
}

/* ---------- Equity: exact enumeration of every remaining board ---------- */
const heroCards = new Int8Array(7);
const villCards = new Int8Array(7);

// Hero's share of the pot (wins + half of ties) over every way to finish the board.
// Preflop is 1.7M boards, so it yields to the page between outer loops and reports progress.
async function equity(hero, vill, board, onProgress) {
  const used = new Set([...hero, ...vill, ...board]);
  const deck = [];
  for (let c = 0; c < 52; c++) if (!used.has(c)) deck.push(c);
  heroCards[0] = hero[0]; heroCards[1] = hero[1];
  villCards[0] = vill[0]; villCards[1] = vill[1];
  board.forEach((c, i) => { heroCards[2 + i] = c; villCards[2 + i] = c; });

  const need = 5 - board.length;
  let share = 0, total = 0;
  const at = 2 + board.length;
  const showdown = () => {
    const h = score(heroCards), v = score(villCards);
    share += h > v ? 2 : h === v ? 1 : 0;
    total += 2;
  };
  const deal = (start, depth) => {
    if (depth === need) { showdown(); return; }
    for (let i = start; i < deck.length; i++) {
      heroCards[at + depth] = villCards[at + depth] = deck[i];
      deal(i + 1, depth + 1);
    }
  };
  if (need === 0) showdown();
  else {
    for (let i = 0; i <= deck.length - need; i++) {
      heroCards[at] = villCards[at] = deck[i];
      deal(i + 1, 1);
      if (need === 5) { onProgress?.(i / (deck.length - need)); await new Promise((r) => setTimeout(r)); }
    }
  }
  return share / total;
}

/* ---------- View ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (x) => `${Math.round(x * 100)}%`;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function fillCard(node, c) {
  node.textContent = label(c);
  node.classList.toggle('red', isRed(c));
}
// The same held-frame drop as the CSS deal: three frames, each held ~80ms
function dropIn(node) {
  if (reduce.matches) return;
  node.animate([
    { opacity: 0.3, transform: 'translateY(-0.5rem)', offset: 0, easing: 'steps(1, end)' },
    { opacity: 0.7, transform: 'translateY(-0.2rem)', offset: 1 / 3, easing: 'steps(1, end)' },
    { opacity: 1, transform: 'none', offset: 2 / 3 },
    { opacity: 1, transform: 'none', offset: 1 },
  ], { duration: 240, fill: 'backwards' });
}

function build(card) {
  const fig = card.querySelector('.interest-fig');
  const demo = fig.querySelector('.pk');
  const toggle = card.querySelector('.pk-toggle');
  if (!demo || !toggle) return;

  const live = el('div', 'pk pk-live');
  live.hidden = true;

  const head = el('div', 'pk-row pk-head');
  const street = el('span', 'pk-street', 'Pick 4 cards');
  head.append(street, el('span', 'pk-col', 'Equity'));

  const seats = [];  // four hole-card buttons: hero 0–1, villain 2–3
  const rows = ['Hero', 'Villain'].map((who, r) => {
    const row = el('div', 'pk-row');
    const holes = el('div', 'pk-cards');
    for (let i = 0; i < 2; i++) {
      const b = el('button', 'pk-card pk-seat');
      b.type = 'button';
      b.setAttribute('aria-label', `${who} card ${i + 1}: empty`);
      holes.append(b); seats.push(b);
    }
    const type = el('span', 'pk-pct pk-type', '');
    const eq = el('span', 'pk-pct', '');
    row.append(el('span', 'pk-who', who), holes, type, eq);
    return { row, type, eq };
  });

  const boardEl = el('div', 'pk-board');
  const slots = Array.from({ length: 5 }, () => {
    const s = el('span', 'pk-slot');
    boardEl.append(s);
    return s;
  });
  const bar = el('div', 'pk-bar');
  const barFill = el('span');
  bar.append(barFill);

  // 52-card picker: one row per suit
  const picker = el('div', 'pk-picker');
  picker.setAttribute('aria-label', 'Deck');
  const deckBtns = [];
  for (let s = 0; s < 4; s++) for (let r = 12; r >= 0; r--) {
    const c = r * 4 + s;
    const b = el('button', 'pk-pick' + (isRed(c) ? ' red' : ''), label(c));
    b.type = 'button';
    b.dataset.card = c;
    picker.append(b); deckBtns[c] = b;
  }

  const controls = el('div', 'pk-controls');
  const again = el('button', 'card-btn', 'Deal again');
  const reset = el('button', 'card-btn', 'New hands');
  again.type = reset.type = 'button';
  controls.append(again, reset);
  controls.hidden = true;

  const status = el('p', 'pk-status');
  status.setAttribute('aria-live', 'polite');

  live.append(head, rows[0].row, rows[1].row, boardEl, bar, picker, controls, status);
  fig.append(live);

  const picks = [null, null, null, null];
  const cache = new Map();
  let run = 0;  // bumps on every new deal or reset, so a stale runout stops itself

  const setBar = (x) => { barFill.style.transform = `scaleX(${x})`; };
  const setEq = (h) => { rows[0].eq.textContent = pct(h); rows[1].eq.textContent = `${100 - Math.round(h * 100)}%`; };
  const clearBoard = () => slots.forEach((s) => s.replaceChildren());
  const setWinner = (r) => rows.forEach((x, i) => x.row.classList.toggle('pk-winner', i === r));

  function render() {
    picks.forEach((c, i) => {
      const seat = seats[i];
      const who = i < 2 ? 'Hero' : 'Villain';
      if (c == null) {
        seat.textContent = ''; seat.classList.remove('red'); seat.classList.add('pk-empty');
        seat.setAttribute('aria-label', `${who} card ${(i % 2) + 1}: empty`);
      } else {
        fillCard(seat, c); seat.classList.remove('pk-empty');
        seat.setAttribute('aria-label', `${who} card ${(i % 2) + 1}: ${label(c)}, tap to change`);
      }
    });
    const next = picks.indexOf(null);
    seats.forEach((s, i) => s.classList.toggle('pk-next', i === next));
    deckBtns.forEach((b, c) => { b.disabled = picks.includes(c); });
    const left = picks.filter((c) => c == null).length;
    if (left) street.textContent = `Pick ${left} card${left > 1 ? 's' : ''}`;
  }

  function startPicking() {
    run++;
    picker.hidden = false; controls.hidden = true;
    clearBoard(); setWinner(-1); setBar(0);
    rows.forEach((r) => { r.type.textContent = ''; r.eq.textContent = ''; });
    status.textContent = '';
    render();
  }

  async function deal() {
    const id = ++run;
    const hero = picks.slice(0, 2), vill = picks.slice(2);
    picker.hidden = true; controls.hidden = true;
    clearBoard(); setWinner(-1);
    street.textContent = 'Preflop';
    rows[0].type.textContent = startingHand(...hero);
    rows[1].type.textContent = startingHand(...vill);

    const key = [...hero].sort().join() + '|' + [...vill].sort().join();
    let pre = cache.get(key);
    if (pre == null) {
      rows.forEach((r) => { r.eq.textContent = '…'; });
      status.textContent = 'Running every possible board…';
      pre = await equity(hero, vill, [], (f) => { if (id === run) setBar(f); });
      if (id !== run) return;
      cache.set(key, pre);
    }
    setEq(pre); setBar(pre);
    status.textContent = `${pct(pre)} vs ${100 - Math.round(pre * 100)}% before the flop, over all 1,712,304 boards.`;

    // A random runout from what's left of the deck
    const used = new Set(picks);
    const deck = [];
    for (let c = 0; c < 52; c++) if (!used.has(c)) deck.push(c);
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const board = deck.slice(0, 5);

    const streets = [['Flop', 3], ['Turn', 4], ['River', 5]];
    for (const [name, n] of streets) {
      await wait(1400);
      if (id !== run) return;
      const shown = slots.filter((s) => s.firstChild).length;
      for (let i = shown; i < n; i++) {
        const c = el('span', 'pk-card');
        fillCard(c, board[i]);
        slots[i].append(c);
        dropIn(c);
        if (i < n - 1) await wait(160);
        if (id !== run) return;
      }
      street.textContent = name;
      const seen = board.slice(0, n);
      rows[0].type.textContent = madeHand(hero, seen);
      rows[1].type.textContent = madeHand(vill, seen);
      const eq = await equity(hero, vill, seen);
      if (id !== run) return;
      setEq(eq); setBar(eq);
      if (n === 5) {
        setWinner(eq === 1 ? 0 : eq === 0 ? 1 : -1);
        status.textContent = eq === 1 ? 'Hero wins.' : eq === 0 ? 'Villain wins.' : 'Split pot.';
      } else status.textContent = '';
    }
    controls.hidden = false;
  }

  // Tapping a hole card frees it and goes back to picking, stopping any runout
  seats.forEach((s, i) => s.addEventListener('click', () => { picks[i] = null; startPicking(); }));
  picker.addEventListener('click', (e) => {
    const b = e.target.closest('.pk-pick');
    if (!b || b.disabled) return;
    const next = picks.indexOf(null);
    if (next < 0) return;
    picks[next] = Number(b.dataset.card);
    render();
    if (!picks.includes(null)) deal();
  });
  again.addEventListener('click', deal);
  reset.addEventListener('click', () => { picks.fill(null); startPicking(); });

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const on = live.hidden;
    live.hidden = !on; demo.hidden = on;
    card.classList.toggle('is-live', on);
    toggle.textContent = on ? 'Back to the demo' : 'Pick your own hands';
    toggle.setAttribute('aria-expanded', String(on));
    if (on) startPicking(); else run++;
  });
}

// Best made hand from the hole cards and the board so far. With 6 cards, score every 5-card subset.
function madeHand(hole, seen) {
  const cards = [...hole, ...seen];
  if (cards.length === 7) return handName(score(cards));
  if (cards.length === 5) return handName(scoreFive(cards));
  let best = -1;
  for (let skip = 0; skip < 6; skip++) best = Math.max(best, scoreFive(cards.filter((_, i) => i !== skip)));
  return handName(best);
}
// Five-card version of score(), same encoding
function scoreFive(five) {
  const c = new Int8Array(13);
  let mask = 0;
  const suits = new Set();
  for (const x of five) { c[rankOf(x)]++; mask |= 1 << rankOf(x); suits.add(suitOf(x)); }
  const flush = suits.size === 1;
  const st = popcount(mask) === 5 ? straightHigh(mask) : -1;
  if (flush && st >= 0) return (8 << 26) | (st << 22);
  let quad = -1, trips = -1, pair1 = -1, pair2 = -1;
  for (let r = 12; r >= 0; r--) {
    if (c[r] === 4) quad = r;
    else if (c[r] === 3) trips = r;
    else if (c[r] === 2) { if (pair1 < 0) pair1 = r; else pair2 = r; }
  }
  if (quad >= 0) return (7 << 26) | (quad << 22) | (mask & ~(1 << quad));
  if (trips >= 0 && pair1 >= 0) return (6 << 26) | (trips << 22) | (pair1 << 18);
  if (flush) return (5 << 26) | mask;
  if (st >= 0) return (4 << 26) | (st << 22);
  if (trips >= 0) return (3 << 26) | (trips << 22) | (mask & ~(1 << trips));
  if (pair2 >= 0) return (2 << 26) | (pair1 << 22) | (pair2 << 18) | (mask & ~(1 << pair1) & ~(1 << pair2));
  if (pair1 >= 0) return (1 << 26) | (pair1 << 22) | (mask & ~(1 << pair1));
  return mask;
}

document.querySelectorAll('.interest').forEach((card) => { if (card.querySelector('.pk')) build(card); });
