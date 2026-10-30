// The mini board after a project title: click (or Enter/Space) replays its kickflip from the start.
(() => {
  const board = document.querySelector('.tb');
  if (!board) return;
  board.removeAttribute('aria-hidden');
  board.setAttribute('role', 'button');
  board.setAttribute('tabindex', '0');
  board.setAttribute('aria-label', 'Replay the kickflip');
  const replay = () => {
    for (const a of board.getAnimations({ subtree: true })) { a.currentTime = 0; a.play(); }
  };
  board.addEventListener('click', replay);
  board.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay(); }
  });
})();
