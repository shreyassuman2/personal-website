// Home's Now building panel: hover or keyboard focus puts the skater in fast mode (.is-fast in main.css), and touch
// screens, which can't hover, get one fast run when the panel first scrolls into view.
// Speed changes go through playbackRate rather than animation-duration in CSS: a new duration would remap the elapsed
// time onto the new clock and jump to another point in the loop, while playbackRate keeps the current frame.
(() => {
  const panel = document.querySelector('.now');
  const svg = panel && panel.querySelector('.skate-svg');
  if (!svg) return;
  // The ground rushes by much faster than the skater speeds up, so fast mode feels like picking up speed
  const ground = svg.querySelector('.sk-ground');
  // Speed lines (.sk-speed) only exist in fast mode and run on their own clocks, so they're left alone
  const rate = (r, g) => {
    for (const a of svg.getAnimations({ subtree: true })) {
      const t = a.effect.target;
      if (!t.closest('.sk-speed')) a.updatePlaybackRate(t === ground ? g : r);
    }
  };
  // At rest the home skater runs a touch faster than About's
  const rest = 1.15;
  rate(rest, rest);

  // Fast while any reason holds: the pointer is over it, it has keyboard focus, or the touch-screen preview is running
  const reasons = new Set();
  const set = (reason, on) => {
    on ? reasons.add(reason) : reasons.delete(reason);
    const fast = reasons.size > 0;
    if (fast === panel.classList.contains('is-fast')) return;
    panel.classList.toggle('is-fast', fast);
    fast ? rate(1.7, 6) : rate(rest, rest);
  };
  panel.addEventListener('mouseenter', () => set('hover', true));
  panel.addEventListener('mouseleave', () => set('hover', false));
  panel.addEventListener('focus', () => set('focus', panel.matches(':focus-visible')));
  panel.addEventListener('blur', () => set('focus', false));

  if (matchMedia('(hover: none)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const seen = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      seen.disconnect();
      set('preview', true);
      setTimeout(() => set('preview', false), 3000);
    }, { threshold: 0.6 });
    seen.observe(panel);
  }
})();
