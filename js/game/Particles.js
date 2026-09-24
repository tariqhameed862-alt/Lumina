/* Fixed-size spark pool: never allocates after construction. */
import { MAX_PARTICLES, CRYSTAL_R } from '../config.js';

export class Particles {
  constructor(size = MAX_PARTICLES) {
    this.pool = Array.from({ length: size }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1 }));
  }

  clear() { for (const p of this.pool) p.active = false; }

  spawn(x, y, burst = false) {
    for (const p of this.pool) {
      if (p.active) continue;
      const a = Math.random() * Math.PI * 2;
      const sp = burst ? 0.05 + Math.random() * 0.09 : 0.008 + Math.random() * 0.025;
      const r = burst ? 10 : CRYSTAL_R * (0.3 + Math.random() * 0.7);
      p.active = true;
      p.x = x + Math.cos(a) * r;
      p.y = y + Math.sin(a) * r;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp - (burst ? 0.02 : 0.018);
      p.max = p.life = (burst ? 1100 : 1500) + Math.random() * 900;
      p.size = 5 + Math.random() * 7;
      return true;
    }
    return false;
  }

  update(dt) {
    const drag = Math.pow(0.985, dt / 16.667);
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      p.vx *= drag;
      p.vy = p.vy * drag - 0.00002 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
}
