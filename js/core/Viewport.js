/* High-DPI canvas + 800x1200 virtual coordinate system, centred and uniformly scaled. */
import { W, H } from '../config.js';

export class Viewport {
  constructor(canvas, stage) {
    this.canvas = canvas;
    this.stage = stage;
    this.cssW = 1; this.cssH = 1;
    this.dpr = 1; this.scale = 1;
    this.offX = 0; this.offY = 0;
    this.bounds = { x0: 0, y0: 0, x1: W, y1: H };  // visible area in logical units (beam walls)
    this.listeners = [];
    this._timer = 0;

    const later = (ms) => () => { clearTimeout(this._timer); this._timer = setTimeout(() => this.resize(), ms); };
    window.addEventListener('resize', later(120));
    window.addEventListener('orientationchange', later(260));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', later(120));
    this.resize();
  }

  onResize(fn) { this.listeners.push(fn); }

  resize() {
    const r = this.stage.getBoundingClientRect();
    this.cssW = Math.max(1, r.width);
    this.cssH = Math.max(1, r.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(this.cssW * this.dpr);
    this.canvas.height = Math.round(this.cssH * this.dpr);
    this.scale = Math.min(this.cssW / W, this.cssH / H);
    this.offX = (this.cssW - W * this.scale) / 2;
    this.offY = (this.cssH - H * this.scale) / 2;
    const m = 40;
    this.bounds.x0 = -this.offX / this.scale - m;
    this.bounds.y0 = -this.offY / this.scale - m;
    this.bounds.x1 = (this.cssW - this.offX) / this.scale + m;
    this.bounds.y1 = (this.cssH - this.offY) / this.scale + m;
    for (const fn of this.listeners) fn(this);
  }

  /** Pointer/touch event → logical board coordinates. */
  toLogical(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this.offX) / this.scale,
      y: (e.clientY - rect.top - this.offY) / this.scale
    };
  }

  /** Device-pixel scale for the board transform. */
  get px() { return this.scale * this.dpr; }
}
