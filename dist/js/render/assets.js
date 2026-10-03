/* Pre-rendered sprites, cached gradients and small path helpers shared by the draw modules. */
import { MIRROR_HALF, MIRROR_HALF_W } from '../config.js';

function makeSprite(size, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

function makeRays() {
  const size = 256, h = size / 2, c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(h, h, 8, h, h, h);
  gr.addColorStop(0, 'rgba(253,230,138,0.9)');
  gr.addColorStop(0.35, 'rgba(251,191,36,0.35)');
  gr.addColorStop(1, 'rgba(251,191,36,0)');
  g.fillStyle = gr;
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, w = i % 2 ? 0.05 : 0.09;
    g.beginPath();
    g.moveTo(h, h);
    g.lineTo(h + Math.cos(a - w) * h, h + Math.sin(a - w) * h);
    g.lineTo(h + Math.cos(a + w) * h, h + Math.sin(a + w) * h);
    g.closePath();
    g.fill();
  }
  return c;
}

export const SPR = {
  amber: makeSprite(128, [[0, 'rgba(255,251,235,1)'], [0.14, 'rgba(253,230,138,0.95)'], [0.4, 'rgba(251,191,36,0.3)'], [1, 'rgba(251,191,36,0)']]),
  corona: makeSprite(256, [[0, 'rgba(251,191,36,0.55)'], [0.22, 'rgba(251,191,36,0.28)'], [0.5, 'rgba(245,158,11,0.09)'], [1, 'rgba(245,158,11,0)']]),
  cyan: makeSprite(128, [[0, 'rgba(240,253,250,1)'], [0.16, 'rgba(165,243,252,0.85)'], [0.45, 'rgba(34,211,238,0.22)'], [1, 'rgba(34,211,238,0)']]),
  shadow: makeSprite(128, [[0, 'rgba(0,0,0,0.6)'], [0.55, 'rgba(0,0,0,0.22)'], [1, 'rgba(0,0,0,0)']]),
  rays: makeRays()
};

/** Gradients in local (translated/rotated) space — build once, reuse every frame. */
export function buildGradients(ctx) {
  const lin = (x0, y0, x1, y1, stops) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [o, c] of stops) g.addColorStop(o, c);
    return g;
  };
  return {
    mirrorFill: lin(0, -MIRROR_HALF_W, 0, MIRROR_HALF_W, [
      [0, 'rgba(191,219,254,0.62)'], [0.3, 'rgba(96,165,250,0.36)'], [0.5, 'rgba(59,130,246,0.30)'],
      [0.72, 'rgba(30,64,175,0.46)'], [1, 'rgba(15,23,42,0.78)']]),
    mirrorBorder: lin(-MIRROR_HALF, 0, MIRROR_HALF, 0, [
      [0, '#94A3B8'], [0.22, '#F8FAFC'], [0.5, '#CBD5E1'], [0.78, '#F1F5F9'], [1, '#64748B']]),
    fixedFill: lin(0, -MIRROR_HALF_W, 0, MIRROR_HALF_W, [
      [0, 'rgba(254,243,199,0.55)'], [0.35, 'rgba(217,119,6,0.30)'], [0.6, 'rgba(146,64,14,0.45)'], [1, 'rgba(41,24,8,0.85)']]),
    fixedBorder: lin(-MIRROR_HALF, 0, MIRROR_HALF, 0, [
      [0, '#92400E'], [0.22, '#FDE68A'], [0.5, '#D97706'], [0.78, '#FEF3C7'], [1, '#78350F']]),
    emitter: lin(0, -15, 0, 15, [
      [0, '#F1F5F9'], [0.22, '#CBD5E1'], [0.47, '#8B98AB'], [0.53, '#A5B1C2'], [0.8, '#E2E8F0'], [1, '#64748B']]),
    shard: lin(0, -4, 0, 4, [[0, '#FEF3C7'], [0.5, '#FBBF24'], [1, '#B45309']])
  };
}

export function roundRectPath(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
}

export function chamferPath(c, x, y, w, h, k) {
  c.beginPath();
  c.moveTo(x + k, y);
  c.lineTo(x + w - k, y);
  c.lineTo(x + w, y + k);
  c.lineTo(x + w, y + h - k);
  c.lineTo(x + w - k, y + h);
  c.lineTo(x + k, y + h);
  c.lineTo(x, y + h - k);
  c.lineTo(x, y + k);
  c.closePath();
}

export function trianglePath(c, r, rot) {
  c.moveTo(Math.cos(rot) * r, Math.sin(rot) * r);
  c.lineTo(Math.cos(rot + 2.0944) * r, Math.sin(rot + 2.0944) * r);
  c.lineTo(Math.cos(rot + 4.1888) * r, Math.sin(rot + 4.1888) * r);
  c.closePath();
}

export function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
