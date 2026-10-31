// Home's Now building panel: hovering speeds the skater up from where it is, instead of jumping to another point in the loop.
// Changing animation-duration in CSS would remap the elapsed time onto the new clock; playbackRate keeps the current frame.
(() => {
  const panel = document.querySelector('.now');
  const svg = panel && panel.querySelector('.skate-svg');
  if (!svg) return;
  // The ground rushes by much faster than the skater speeds up, so hovering feels like picking up speed
  const ground = svg.querySelector('.sk-ground');
  const rate = (r, g) => {
    for (const a of svg.getAnimations({ subtree: true })) a.updatePlaybackRate(a.effect.target === ground ? g : r);
  };
  panel.addEventListener('mouseenter', () => rate(18.8 / 15, 3));
  panel.addEventListener('mouseleave', () => rate(1, 1));
})();
