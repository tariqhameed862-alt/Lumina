/* Fixed-size particle pool (never allocates after construction): amber sparks from lit crystals and win confetti. */
import { MAX_PARTICLES, CRYSTAL_R } from '../config.js';

export const KIND = { SPARK: 0, CONFETTI: 1 };

export class Particles {
  constructor(size = MAX_PARTICLES) {
    this.pool = Array.from({ length: size }, () => ({
      active: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1, rot: 0, vr: 0, color: 0
    }));
  }

  clear() { for (const p of this.pool) p.active = false; }

  _free() { for (const p of this.pool) if (!p.active) return p; return null; }

  spawn(x, y, burst = false) {
    const p = this._free();
    if (!p) return false;
    const a = Math.random() * Math.PI * 2;
    const sp = burst ? 0.05 + Math.random() * 0.09 : 0.008 + Math.random() * 0.025;
    const r = burst ? 10 : CRYSTAL_R * (0.3 + Math.random() * 0.7);
    p.active = true; p.kind = KIND.SPARK;
    p.x = x + Math.cos(a) * r;
    p.y = y + Math.sin(a) * r;
    p.vx = Math.cos(a) * sp;
    p.vy = Math.sin(a) * sp - (burst ? 0.02 : 0.018);
    p.max = p.life = (burst ? 1100 : 1500) + Math.random() * 900;
    p.size = 5 + Math.random() * 7;
    return true;
  }

  /** Paper-confetti burst: `n` little rectangles thrown up and out, tumbling as they fall. `colors` = palette length. */
  confetti(x, y, n, paletteLen = 5) {
    for (let i = 0; i < n; i++) {
      const p = this._free();
      if (!p) return;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const sp = 0.25 + Math.random() * 0.45;
      p.active = true; p.kind = KIND.CONFETTI;
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      p.rot = Math.random() * 6.28; p.vr = (Math.random() - 0.5) * 0.02;
      p.max = p.life = 1400 + Math.random() * 900;
      p.size = 6 + Math.random() * 6;
      p.color = Math.floor(Math.random() * paletteLen);
    }
  }

  update(dt) {
    const drag = Math.pow(0.985, dt / 16.667);
    const cdrag = Math.pow(0.992, dt / 16.667);
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      if (p.kind === KIND.CONFETTI) {
        p.vx *= cdrag;
        p.vy = p.vy * cdrag + 0.00075 * dt;      // gravity
        p.rot += p.vr * dt;
      } else {
        p.vx *= drag;
        p.vy = p.vy * drag - 0.00002 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
}
