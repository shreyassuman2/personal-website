// Home's Now building panel: hovering speeds the skater up from where it is, instead of jumping to another point in the loop.
// Changing animation-duration in CSS would remap the elapsed time onto the new clock; playbackRate keeps the current frame.
(() => {
  const panel = document.querySelector('.now');
  const svg = panel && panel.querySelector('.skate-svg');
  if (!svg) return;
  // The ground rushes by much faster than the skater speeds up, so hovering feels like picking up speed
  const ground = svg.querySelector('.sk-ground');
  // Speed lines (.sk-speed) only exist on hover and run on their own clocks, so they're left alone
  const rate = (r, g) => {
    for (const a of svg.getAnimations({ subtree: true })) {
      const t = a.effect.target;
      if (!t.closest('.sk-speed')) a.updatePlaybackRate(t === ground ? g : r);
    }
  };
  // At rest the home skater runs a touch faster than About's
  const rest = 1.15;
  rate(rest, rest);
  panel.addEventListener('mouseenter', () => rate(1.7, 6));
  panel.addEventListener('mouseleave', () => rate(rest, rest));
})();
