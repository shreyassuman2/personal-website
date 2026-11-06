// Project demo video: start it muted (the only way browsers allow autoplay) unless the visitor prefers reduced motion,
// and show a Sound on button that unmutes it. The button hides once sound is on, whether from it or the player's own controls.
(() => {
  const video = document.querySelector('.cover-video video');
  const btn = document.querySelector('.sound-on');
  if (!video || !btn) return;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(() => {});
  btn.hidden = false;
  btn.addEventListener('click', () => {
    video.muted = false;
    video.volume = 1;
    video.play().catch(() => {});
  });
  video.addEventListener('volumechange', () => { btn.hidden = !video.muted; });
})();
