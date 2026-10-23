// Chess puzzles on the about page: the tactic animation stays the default; "Try a puzzle" swaps in a
// playable board in the same style. Each puzzle is a fixed line, checked with python-chess: White's move
// is the only one that mates in time at every step, and Black's replies are forced.
// Wrapped in a function so its names don't collide with poker.js, which shares the page's global scope.
(() => {
  const PUZZLES = [
    { name: 'Back-rank mate', goal: 'White mates in 1', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1', line: ['d1d8'] },
    { name: 'Arabian mate', goal: 'White mates in 1', fen: '7k/R6p/5N2/8/8/8/5PPP/6K1', line: ['a7h7'] },
    { name: 'Smothered mate', goal: 'White mates in 2', fen: '5r1k/6pp/7N/8/2Q5/8/5PPP/6K1', line: ['c4g8', 'f8g8', 'h6f7'] },
    { name: "Boden's mate", goal: 'White mates in 2', fen: '2kr4/pp1n4/2n5/8/4QB2/8/5PPP/5BK1', line: ['e4c6', 'b7c6', 'f1a6'] },
  ];

  // The same 8x8 pixel pieces as the tactic animation (layouts/_partials/chess.html)
  const SPRITES = {
    r: ['.#.##.#.', '.######.', '..####..', '..####..', '..####..', '..####..', '.######.', '.######.'],
    k: ['...##...', '.######.', '...##...', '.######.', '########', '.######.', '..####..', '.######.'],
    b: ['...##...', '..#.##..', '..##.#..', '..####..', '...##...', '..####..', '..####..', '.######.'],
    n: ['...##...', '..####..', '.######.', '##.####.', '...####.', '..#####.', '.#######', '.#######'],
    p: ['........', '........', '...##...', '..####..', '...##...', '..####..', '.######.', '.######.'],
    q: ['#..##..#', '#.####.#', '.######.', '.######.', '..####..', '..####..', '.######.', '.######.'],
  };
  const NAMES = { r: 'rook', k: 'king', b: 'bishop', n: 'knight', p: 'pawn', q: 'queen' };
  const svgFor = (t) => {
    let rects = '';
    SPRITES[t].forEach((row, y) => [...row].forEach((c, x) => {
      if (c === '#') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }));
    return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  };

  // Squares are 0–63 from a8 to h1, matching the board's DOM order
  const FILES = 'abcdefgh';
  const sqName = (i) => FILES[i % 8] + (8 - Math.floor(i / 8));
  const sqIndex = (s) => (8 - Number(s[1])) * 8 + FILES.indexOf(s[0]);
  function parse(fen) {
    const board = [];
    for (const ch of fen) {
      if (ch === '/') continue;
      if (/\d/.test(ch)) for (let i = 0; i < Number(ch); i++) board.push(null);
      else board.push({ t: ch.toLowerCase(), w: ch === ch.toUpperCase() });
    }
    return board;
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function build(card) {
    const fig = card.querySelector('.interest-fig');
    const demo = fig.querySelector('.kt-board');
    const toggle = card.querySelector('.kt-toggle');
    if (!demo || !toggle) return;

    const live = el('div', 'kt-live');
    live.hidden = true;
    const head = el('p', 'kt-head');
    const wrap = el('div', 'kt-board');
    const ranks = el('div', 'kt-ranks');
    for (let r = 8; r >= 1; r--) ranks.append(el('span', null, r));
    const grid = el('div', 'kt kt-play');
    const squares = [];
    for (let i = 0; i < 64; i++) {
      const sq = el('button', 'kt-sq' + ((Math.floor(i / 8) + i) % 2 ? ' d' : ''));
      sq.type = 'button';
      sq.dataset.i = i;
      grid.append(sq); squares.push(sq);
    }
    const files = el('div', 'kt-files');
    for (const f of FILES) files.append(el('span', null, f));
    // .kt boards sit in the first cell of a .kt-stack, as in the animation
    const stack = el('div', 'kt-stack');
    stack.append(grid);
    wrap.append(ranks, stack, files);

    const status = el('p', 'kt-status');
    status.setAttribute('aria-live', 'polite');
    const controls = el('div', 'kt-controls');
    const retry = el('button', 'card-btn', 'Retry');
    const next = el('button', 'card-btn', 'Next puzzle');
    retry.type = next.type = 'button';
    controls.append(retry, next);

    live.append(head, wrap, status, controls);
    fig.append(live);

    let n = 0, board, step, selected, done, timer;

    function render() {
      squares.forEach((sq, i) => {
        const p = board[i];
        sq.innerHTML = p ? `<span class="kt-pc${p.w ? ' w' : ''}">${svgFor(p.t)}</span>` : '';
        sq.setAttribute('aria-label', sqName(i) + (p ? `, ${p.w ? 'white' : 'black'} ${NAMES[p.t]}` : ''));
        sq.classList.toggle('kt-sel', i === selected);
      });
    }
    function move(uci) {
      const from = sqIndex(uci.slice(0, 2)), to = sqIndex(uci.slice(2, 4));
      board[to] = board[from]; board[from] = null;
      squares.forEach((sq) => sq.classList.remove('kt-last', 'kt-mate'));
      squares[from].classList.add('kt-last'); squares[to].classList.add('kt-last');
    }
    function load(i) {
      clearTimeout(timer);
      n = i; const p = PUZZLES[n];
      board = parse(p.fen); step = 0; selected = null; done = false;
      squares.forEach((sq) => sq.classList.remove('kt-last', 'kt-mate', 'kt-miss'));
      head.textContent = `Puzzle ${n + 1}/${PUZZLES.length} · ${p.goal}`;
      status.textContent = 'Click a white piece, then where it goes.';
      render();
    }

    grid.addEventListener('click', (e) => {
      const sq = e.target.closest('.kt-sq');
      if (!sq || done || step % 2) return;
      const i = Number(sq.dataset.i);
      const p = board[i];
      if (p && p.w) { selected = i === selected ? null : i; render(); return; }
      if (selected == null) return;
      const p0 = PUZZLES[n];
      const tried = sqName(selected) + sqName(i);
      if (tried !== p0.line[step]) {
        // Wrong move: flash the target square and let them try again
        selected = null; render();
        sq.classList.remove('kt-miss'); void sq.offsetWidth; sq.classList.add('kt-miss');
        status.textContent = 'Not quite. Try again.';
        return;
      }
      selected = null;
      move(tried); step++; render();
      if (step === p0.line.length) {
        done = true;
        const king = board.findIndex((x) => x && x.t === 'k' && !x.w);
        squares[king].classList.add('kt-mate');
        status.textContent = `Checkmate: ${p0.name}.`;
        return;
      }
      status.textContent = 'Good. Black replies…';
      timer = setTimeout(() => {
        move(p0.line[step]); step++; render();
        status.textContent = 'Your move.';
      }, 700);
    });
    retry.addEventListener('click', () => load(n));
    next.addEventListener('click', () => load((n + 1) % PUZZLES.length));

    toggle.hidden = false;
    const note = card.querySelector('.kt-note');
    if (note) note.hidden = false;
    toggle.addEventListener('click', () => {
      const on = live.hidden;
      live.hidden = !on; demo.hidden = on;
      card.classList.toggle('is-live', on);
      toggle.textContent = on ? 'Back to the demo' : 'Try a puzzle';
      toggle.setAttribute('aria-expanded', String(on));
      if (on) load(n); else clearTimeout(timer);
    });
  }

  document.querySelectorAll('.interest').forEach((card) => { if (card.querySelector('.kt-board')) build(card); });
})();
