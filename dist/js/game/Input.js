/* Pointer input: multi-touch mirror rotation with zero-jump angular delta tracking. */
import { HIT_RADIUS } from '../config.js';

const wrapPi = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

export class Input {
  constructor(canvas, viewport, game) {
    this.canvas = canvas;
    this.viewport = viewport;
    this.game = game;
    this.drags = new Map();     // pointerId -> drag state
    this.onInteract = null;     // fired on any touch of the board

    canvas.addEventListener('pointerdown', (e) => this._down(e));
    canvas.addEventListener('pointermove', (e) => this._move(e));
    canvas.addEventListener('pointerup', (e) => this._up(e));
    canvas.addEventListener('pointercancel', (e) => this._up(e));
    canvas.addEventListener('lostpointercapture', (e) => this._up(e));
    canvas.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && !this.drags.size) for (const m of this.game.mirrors) m.hover = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Drop every active drag (pause, win, level change). */
  cancelAll() {
    for (const [id, d] of this.drags) {
      d.m.dragId = null;
      d.m.target = d.m.goal;
      try { this.canvas.releasePointerCapture(id); } catch (err) { /* ignore */ }
    }
    this.drags.clear();
    for (const m of this.game.mirrors) m.hover = false;
    this.canvas.style.cursor = 'default';
  }

  _find(p) {
    let best = null, bd = HIT_RADIUS;
    for (const m of this.game.mirrors) {
      if (m.fixed || m.dragId !== null) continue;
      const d = Math.hypot(p.x - m.x, p.y - m.y);
      if (d <= bd) { bd = d; best = m; }
    }
    return best;
  }

  _down(e) {
    if (!this.game.interactive) return;
    this.onInteract?.();
    const p = this.viewport.toLogical(e);
    const m = this._find(p);
    if (!m) return;
    e.preventDefault();
    try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const raw = Math.atan2(p.y - m.y, p.x - m.x);
    this.game.grab(m);
    m.dragId = e.pointerId;
    m.needle = Math.atan2(m.y - p.y, m.x - p.x);
    // deltaAngle = touch angle − mirror angle, so the mirror never jumps on touch
    this.drags.set(e.pointerId, { m, deltaAngle: raw - m.angle, lastRaw: raw, unwrapped: raw, start: m.angle });
    this.canvas.style.cursor = 'grabbing';
  }

  _move(e) {
    const d = this.drags.get(e.pointerId);
    if (!d) {
      if (e.pointerType === 'mouse' && !this.drags.size) {
        const m = this.game.interactive ? this._find(this.viewport.toLogical(e)) : null;
        for (const mm of this.game.mirrors) mm.hover = (mm === m);
        this.canvas.style.cursor = m ? 'grab' : 'default';
      }
      return;
    }
    e.preventDefault();
    const m = d.m;
    const samples = (typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length)
      ? e.getCoalescedEvents() : [e];
    let q = null;
    for (const s of samples) {
      q = this.viewport.toLogical(s);
      if (Math.hypot(q.x - m.x, q.y - m.y) < 4) continue;   // unstable right at the pivot
      const raw = Math.atan2(q.y - m.y, q.x - m.x);
      d.unwrapped += wrapPi(raw - d.lastRaw);
      d.lastRaw = raw;
    }
    m.goal = d.unwrapped - d.deltaAngle;
    if (q && Math.hypot(q.x - m.x, q.y - m.y) > 6) m.needle = Math.atan2(m.y - q.y, m.x - q.x);
  }

  _up(e) {
    const d = this.drags.get(e.pointerId);
    if (!d) return;
    this.drags.delete(e.pointerId);
    try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    d.m.dragId = null;
    if (!this.game.won) this.game.release(d.m, d.start);
    this.canvas.style.cursor = this.drags.size ? 'grabbing' : 'default';
  }
}
