// Pixel-art gaussian splat behind a project page's header (front matter splat: true; canvas in layouts/page.html).
// It draws Spectra's ring buffer as a 3D ring on a turntable: around the ring is time (one slot per FFT snapshot),
// outward is frequency (low inside, high outside), up is loudness. A write head travels around the ring replacing
// the oldest snapshot, so the newest slot glows and older ones dim.
// Each cell is a 3D gaussian projected to a 2D ellipse (EWA splatting), blended nearest first at a quarter of the
// screen's resolution, then snapped to three 6-colour ramps (warm, violet, ice) with ordered dithering.
// CSS scales it up with hard pixels. Decorative only: it sits behind the text, takes no input, and fades out as
// the page scrolls down.
(() => {
  const canvas = document.querySelector('.splat-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const PX = 3; // one drawn pixel covers 3x3 CSS pixels
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Colour ramps, dark to bright. Low frequencies use warm, mids violet, highs ice
  const RAMPS = [
    ['#0a0a0a', '#2e0707', '#7d1111', '#ff2a2a', '#ff9d8c', '#f6ece6'],
    ['#0a0a0a', '#1c0b2e', '#4a1f7a', '#9a4dff', '#c9a6ff', '#f1eaff'],
    ['#0a0a0a', '#071a2e', '#114a7d', '#2aa8ff', '#8cd6ff', '#e6f6ff'],
  ].map(r => r.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))));
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

  // The ring: T snapshots around the circle, each with F log-spaced frequency bins
  const F = 14, T = 56, R_IN = 0.5, R_OUT = 1.3;
  const ring = Array.from({ length: T }, () => new Float32Array(F));
  // A slow chord loop (Am, F, C, G) as fundamentals in Hz; every chord is struck, then decays
  const CHORDS = [[110, 130.8, 164.8], [87.3, 110, 130.8], [130.8, 164.8, 196], [98, 123.5, 146.8]];
  const binOf = hz => Math.log2(hz / 70) / Math.log2(1800 / 70) * (F - 1);
  let step = 0, head = 0;
  function push() {
    const s = ring[head = (head + 1) % T];
    s.fill(0);
    const chord = CHORDS[Math.floor(step / 9) % CHORDS.length];
    const env = 0.35 + 0.65 * Math.exp(-(step % 9) / 3.5);
    for (const f0 of chord) {
      for (let h = 1; h <= 8; h++) {
        const b = binOf(f0 * h);
        if (b > F - 0.5) break;
        const i = Math.round(b);
        if (i >= 0) s[i] += env * (0.75 / Math.sqrt(h)) * (0.75 + 0.25 * Math.sin(step * 0.7 + h * 2 + f0));
      }
    }
    for (let i = 0; i < F; i++) s[i] = Math.min(1, s[i] * 0.62 + 0.03 * Math.random());
    step++;
  }
  for (let i = 0; i < T; i++) push();

  // Framebuffers: brightness, brightness-weighted coolness (which ramp), and remaining transparency
  // sized to the canvas's box, so they are rebuilt when the window resizes
  let W, H, col, cool, trans, img, focal, cx, cy;
  const dist = 3.5, pitch = 0.52;
  let yaw = 0.6;
  let scrollFade = 1, drawnFade = 1; // 1 at the top of the page, 0 once scrolled away; and the value last drawn
  function resize() {
    W = canvas.width = Math.max(1, Math.round(canvas.clientWidth / PX));
    H = canvas.height = Math.max(1, Math.round(canvas.clientHeight / PX));
    col = new Float32Array(W * H); cool = new Float32Array(W * H); trans = new Float32Array(W * H);
    img = ctx.createImageData(W, H);
    const wide = W * PX >= 800;
    focal = Math.min(H * 1.2, W * (wide ? 0.5 : 1.1));
    cx = W * (wide ? 0.76 : 0.5); // beside the title on wide screens, behind it on phones
    cy = H * 0.42;
  }

  function render() {
    col.fill(0); cool.fill(0); trans.fill(1);
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    // Rotation world -> camera: pitch about x after yaw about y
    const R = [
      [cyw, 0, syw],
      [sp * syw, cp, -sp * cyw],
      [-cp * syw, sp, cp * cyw],
    ];
    const up = [R[0][1], R[1][1], R[2][1]]; // world up, seen from the camera

    const drawn = [];
    for (let k = 0; k < T; k++) {
      const th = (k / T) * Math.PI * 2, ct = Math.cos(th), st = Math.sin(th);
      const age = (head - k + T) % T; // 0 = just written
      const fade = (1 - 0.55 * age / T) + (age < 2 ? 0.45 : 0);
      // This slot's outward and along-the-ring directions, seen from the camera
      const er = [R[0][0] * ct + R[0][2] * st, R[1][0] * ct + R[1][2] * st, R[2][0] * ct + R[2][2] * st];
      const et = [-R[0][0] * st + R[0][2] * ct, -R[1][0] * st + R[1][2] * ct, -R[2][0] * st + R[2][2] * ct];
      for (let i = 0; i < F; i++) {
        const m = ring[k][i];
        const loud = m > 0.07;
        const r = R_IN + (R_OUT - R_IN) * i / (F - 1);
        const h = loud ? m * 0.95 : 0.012; // quiet cells stay as dim floor dots so the disc still reads
        const wx = r * ct, wy = -0.2 + h / 2, wz = r * st;
        const x = R[0][0] * wx + R[0][1] * wy + R[0][2] * wz;
        const y = R[1][0] * wx + R[1][1] * wy + R[1][2] * wz;
        const z = R[2][0] * wx + R[2][1] * wy + R[2][2] * wz + dist;
        // Camera-space covariance: the sum of (scale * axis)(scale * axis)^T over the splat's three axes
        const sr = loud ? 0.024 : 0.014, sa = loud ? r * 0.042 : 0.014, sy = loud ? Math.max(0.02, h * 0.36) : 0.008;
        const S = [0, 0, 0, 0, 0, 0]; // xx xy xz yy yz zz
        for (const [a, s] of [[er, sr], [et, sa], [up, sy]]) {
          const q = s * s;
          S[0] += q * a[0] * a[0]; S[1] += q * a[0] * a[1]; S[2] += q * a[0] * a[2];
          S[3] += q * a[1] * a[1]; S[4] += q * a[1] * a[2]; S[5] += q * a[2] * a[2];
        }
        // Through the projection's Jacobian (u = f x / z, v = -f y / z) to a 2D ellipse
        const j0 = focal / z, j2 = -focal * x / (z * z), k1 = -focal / z, k2 = focal * y / (z * z);
        const A = j0 * j0 * S[0] + 2 * j0 * j2 * S[2] + j2 * j2 * S[5] + 0.25; // + 0.25: no splat thinner than a pixel
        const B = j0 * k1 * S[1] + j0 * k2 * S[2] + j2 * k1 * S[4] + j2 * k2 * S[5];
        const C = k1 * k1 * S[3] + 2 * k1 * k2 * S[4] + k2 * k2 * S[5] + 0.25;
        const det = A * C - B * B;
        if (det <= 0) continue;
        const mid = (A + C) / 2, rad = Math.ceil(3 * Math.sqrt(mid + Math.sqrt(Math.max(0.1, mid * mid - det))));
        const hue = i / (F - 1);
        drawn.push({
          u: cx + focal * x / z, v: cy - focal * y / z, z, ia: C / det, ib: -B / det, ic: A / det, r: rad,
          a: loud ? Math.min(0.95, 0.5 + 0.7 * m) : 0.5,
          c: (loud ? 0.34 + 0.9 * m : 0.15) * fade * (1.25 - 0.1 * z), // a little dimmer with distance
          k: hue,
        });
      }
    }
    drawn.sort((p, q) => p.z - q.z); // nearest first

    for (const g of drawn) {
      const x0 = Math.max(0, Math.floor(g.u - g.r)), x1 = Math.min(W - 1, Math.ceil(g.u + g.r));
      const y0 = Math.max(0, Math.floor(g.v - g.r)), y1 = Math.min(H - 1, Math.ceil(g.v + g.r));
      for (let py = y0; py <= y1; py++) {
        const dy = py + 0.5 - g.v;
        for (let px = x0; px <= x1; px++) {
          const o = py * W + px;
          if (trans[o] < 0.01) continue;
          const dx = px + 0.5 - g.u;
          const power = -0.5 * (g.ia * dx * dx + 2 * g.ib * dx * dy + g.ic * dy * dy);
          if (power < -4.5) continue;
          const w = trans[o] * Math.min(0.99, g.a * Math.exp(power));
          col[o] += w * g.c;
          cool[o] += w * g.c * g.k;
          trans[o] -= w;
        }
      }
    }

    // Quantize: pick the ramp and the shade, each with a 4x4 Bayer threshold
    const d = img.data, n = RAMPS[0].length - 1;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const o = py * W + px;
      const s = Math.min(1, col[o]) * scrollFade * n;
      let i = Math.floor(s);
      if (s - i > BAYER[(py & 3) * 4 + (px & 3)]) i++;
      const rc = col[o] > 0 ? Math.min(2, cool[o] / col[o] * 2) : 0;
      let ri = Math.floor(rc);
      if (rc - ri > BAYER[((py + 2) & 3) * 4 + ((px + 1) & 3)]) ri++;
      const [r, g, b] = RAMPS[Math.min(2, ri)][Math.min(n, i)];
      d[o * 4] = r; d[o * 4 + 1] = g; d[o * 4 + 2] = b; d[o * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    drawnFade = scrollFade;
  }

  resize();

  // Fade out with scroll, in the pixel style: scrollFade goes 1 -> 0 over the first 60% of the canvas height and
  // scales the brightness before it is snapped to the palette, so the ring steps down through its shades and
  // breaks up into dither patterns, dimmest parts first. Scroll events can fire many times per frame, so the
  // update waits for the next frame
  let fadeQueued = false;
  function updateFade() {
    fadeQueued = false;
    scrollFade = Math.max(0, 1 - scrollY / (canvas.offsetHeight * 0.6));
    if (still) render(); // no animation loop to pick the change up
  }
  addEventListener('scroll', () => {
    if (!fadeQueued) { fadeQueued = true; requestAnimationFrame(updateFade); }
  }, { passive: true });
  updateFade();

  if (still) {
    addEventListener('resize', () => { resize(); render(); });
    return;
  }
  addEventListener('resize', resize);

  let visible = true, last = 0, lastPush = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = t - last;
    if (!visible || dt < 1000 / 24) return; // 24 fps reads as pixel art and saves battery
    if (scrollFade === 0 && drawnFade === 0) return; // already drawn blank
    last = t;
    yaw += Math.min(dt, 100) * 0.00025;
    if (t - lastPush > 80) { push(); lastPush = t; }
    render();
  }
  requestAnimationFrame(frame);
})();
