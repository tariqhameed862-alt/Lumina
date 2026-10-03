/* Floating light motes behind the board: slow upward drift, twinkle, two-depth parallax.
   Tinted per chapter from themes.js. ~30 drawImage calls; halves on low-FX; freezes under prefers-reduced-motion. */
import { W, H } from '../config.js';

const spriteCache = new Map();
function moteSprite(rgb) {
  let s = spriteCache.get(rgb);
  if (s) return s;
  s = document.createElement('canvas');
  s.width = s.height = 48;
  const g = s.getContext('2d');
  const gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
  gr.addColorStop(0, `rgba(${rgb},1)`);
  gr.addColorStop(0.25, `rgba(${rgb},0.55)`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
  spriteCache.set(rgb, s);
  return s;
}

// Deterministic field (positions are 0..1 fractions of the visible area) so it doesn't reshuffle on every load.
const MOTES = Array.from({ length: 72 }, (_, i) => {
  const r = (n) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };
  return { fx: r(1), fy: r(2), d: 0.35 + r(3) * 0.65, ph: r(4) * 6.28, sp: 0.6 + r(5) * 0.8, c: Math.floor(r(6) * 6) };
});

export function drawAmbient(ctx, env) {
  // Fill the WHOLE visible area (not just the 800x1200 board) so wide desktop windows never look empty.
  const b = env.bounds || { x0: 0, y0: 0, x1: W, y1: H };
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const areaBoost = Math.min(2.1, (bw * bh) / (W * H));
  const count = Math.min(MOTES.length, Math.round((env.highFX ? 34 : 14) * areaBoost));
  const dust = env.theme.dust;
  const T = env.time * env.motion;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i++) {
    const m = MOTES[i];
    const y = b.y0 + (((m.fy * bh - T * 0.010 * m.d * m.sp) % bh) + bh) % bh;
    const x = b.x0 + m.fx * bw + Math.sin(T * 0.0004 * m.sp + m.ph) * 26 * m.d;
    const edge = Math.min(1, (y - b.y0) / 140, (b.y1 - y) / 140);        // fade in/out at top & bottom
    const tw = env.motion ? 0.55 + 0.45 * Math.sin(T * 0.0021 * m.sp + m.ph * 3) : 0.7;
    const size = 12 + 30 * m.d;
    ctx.globalAlpha = env.a(0.35 * m.d * tw * edge);
    ctx.drawImage(moteSprite(dust[m.c % dust.length]), x - size / 2, y - size / 2, size, size);
  }
  ctx.restore();
}
