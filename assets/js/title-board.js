// The mini board after a project title: click (or Enter/Space) replays its kickflip; scrolling down sends it rolling off.
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

  // Scrolling down sends the board rolling off (.tb.is-gone in main.css); back at the top it rolls in again.
  // The title flinches left a frame as the board pushes off it.
  const title = board.closest('h1');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const kick = { easing: 'steps(1, end)' };
  addEventListener('scroll', () => {
    if (still.matches) return;
    const gone = board.classList.contains('is-gone');
    if (!gone && scrollY > 24) {
      board.classList.add('is-gone');
      board.blur();
      title.animate([{ transform: 'none', ...kick }, { transform: 'translateX(-0.05em)', ...kick }, { transform: 'none' }],
        { duration: 180, delay: 200 });
    } else if (gone && scrollY < 4) {
      board.classList.remove('is-gone');
    }
  }, { passive: true });
})();
