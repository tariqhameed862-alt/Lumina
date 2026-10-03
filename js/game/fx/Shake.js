/* Trauma-based screen shake (the classic "squared trauma" model): add(0.5) for a thump, add(0.2) for a nudge.
   The renderer reads x / y / rot each frame; it decays on its own and does nothing under prefers-reduced-motion. */
import { Motion } from '../../core/Motion.js';

export class Shake {
  constructor() { this.trauma = 0; this.t = 0; }

  add(amount) { if (!Motion.reduced) this.trauma = Math.min(1, this.trauma + amount); }

  update(dt) {
    this.t += dt;
    this.trauma = Math.max(0, this.trauma - dt / 650);
  }

  get power() { return this.trauma * this.trauma; }
  get x() { return this.power * 16 * Math.sin(this.t * 0.061); }
  get y() { return this.power * 16 * Math.sin(this.t * 0.053 + 1.7); }
  get rot() { return this.power * 0.018 * Math.sin(this.t * 0.047 + 0.6); }
}
