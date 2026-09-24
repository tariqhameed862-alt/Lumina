/* One level's live simulation: mirrors, light, crystals, win detection. Knows nothing about the DOM. */
import {
  DEG, SNAP_STEP, SNAP_THRESHOLD, SPRING_K, SPRING_D, DRAG_SMOOTH,
  WIN_HOLD_MS, SPARK_INTERVAL
} from '../config.js';
import { castAll } from './RayCaster.js';
import { Particles } from './Particles.js';

const lerpK = (f, dt) => 1 - Math.pow(1 - f, dt / 16.667);

// Ambient scene shown behind the menus: mirrors sweep on their own.
const DEMO = {
  emitters: [{ x: 90, y: 880, dx: 1, dy: 0 }],
  mirrors: [
    { x: 560, y: 880, a: -45, sweep: 9, speed: 0.00042 },
    { x: 560, y: 430, a: 45, sweep: 7, speed: 0.00031 },
    { x: 240, y: 430, a: 135, sweep: 0, speed: 0 }
  ],
  crystals: [{ x: 240, y: 700 }, { x: 400, y: 430 }],
  obstacles: []
};

export class Game {
  constructor({ audio, haptics }) {
    this.audio = audio;
    this.haptics = haptics;
    this.particles = new Particles();
    this.level = null;
    this.active = false;       // a level (or demo) is loaded
    this.demo = false;
    this.paused = false;
    this.emitters = []; this.mirrors = []; this.crystals = []; this.obstacles = []; this.beams = [];
    this.moves = 0; this.winTimer = 0; this.won = false;
    this.harmony = 0; this.intro = 0; this.time = 0;
    this.onWin = null;         // ({ moves, bounces }) => void
    this.onMove = null;        // (moves) => void
  }

  /* ---------- Loading ---------- */
  _build(def) {
    this.emitters = def.emitters.map(e => ({ ...e }));
    this.mirrors = def.mirrors.map(m => ({
      x: m.x, y: m.y, angle: m.a * DEG, goal: m.a * DEG, vel: 0, target: null,
      fixed: !!m.fixed, dragId: null, dial: 0, needle: 0, hover: false, pulse: 0,
      sweep: (m.sweep || 0) * DEG, speed: m.speed || 0, base: m.a * DEG
    }));
    this.crystals = def.crystals.map((c, i) => ({
      x: c.x, y: c.y, lit: false, wasLit: false, glow: 0, asm: 0, orb: i * 0.7, shock: 0,
      lastSpark: 0, lastChime: -1e9, phase: i * 1.3 + c.x * 0.01
    }));
    this.obstacles = def.obstacles.map(o => ({ ...o }));
    this.beams = [];
    this.moves = 0; this.winTimer = 0; this.won = false;
    this.harmony = 0; this.intro = 0; this.paused = false;
    this.particles.clear();
    this.active = true;
  }

  load(level, session = null) {
    this.level = level;
    this.demo = false;
    this._build(level);
    if (session && Array.isArray(session.angles) && session.angles.length === this.mirrors.length) {
      this.mirrors.forEach((m, i) => { if (!m.fixed) { m.angle = m.goal = session.angles[i] * DEG; } });
      this.moves = session.moves || 0;
    }
    this._settleCrystals();
  }

  loadDemo() {
    this.level = null;
    this.demo = true;
    this._build(DEMO);
    this._settleCrystals();
  }

  restart() { if (this.level) this.load(this.level); }

  _settleCrystals() {
    castAll(this.emitters, this.mirrors, this.obstacles, this.crystals, { x0: -99, y0: -99, x1: 899, y1: 1299 }, this.beams);
    for (const c of this.crystals) { c.wasLit = c.lit; c.glow = c.asm = c.lit ? 1 : 0; }
  }

  snapshot() {
    return {
      index: this.level?.index ?? 0,
      angles: this.mirrors.map(m => Math.round((m.target ?? m.goal) / DEG * 100) / 100),
      moves: this.moves
    };
  }

  get interactive() { return this.active && !this.demo && !this.paused && !this.won; }
  get totalBounces() { return this.beams.reduce((s, b) => s + b.bounces, 0); }

  /* ---------- Mirror interaction (called by Input) ---------- */
  grab(m) {
    m.target = null;
    m.goal = m.angle;
    m.vel = 0;
  }

  release(m, startAngle) {
    if (Math.abs(m.goal - startAngle) > 0.5 * DEG) {
      this.moves++;
      this.onMove?.(this.moves);
    }
    const nearest = Math.round(m.goal / SNAP_STEP) * SNAP_STEP;
    if (Math.abs(m.goal - nearest) <= SNAP_THRESHOLD) {
      m.target = nearest;
      m.pulse = 1;
      this.audio.snap();
      this.haptics.snap();
    } else {
      m.target = m.goal;
    }
  }

  /* ---------- Simulation ---------- */
  update(dt, bounds) {
    if (!this.active) return;
    this.time += dt;
    this.intro += (1 - this.intro) * lerpK(0.06, dt);

    const kDrag = lerpK(DRAG_SMOOTH, dt);
    for (const m of this.mirrors) {
      if (this.demo && m.sweep) {
        m.angle = m.base + Math.sin(this.time * m.speed) * m.sweep;
      } else if (m.dragId !== null) {
        const prev = m.angle;
        m.angle += (m.goal - m.angle) * kDrag;
        m.vel = (m.angle - prev) / Math.max(dt, 1);
      } else if (m.target !== null) {
        const steps = Math.max(1, Math.ceil(dt / 8));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          m.vel += ((m.target - m.angle) * SPRING_K - m.vel * SPRING_D) * h;
          m.angle += m.vel * h;
        }
        if (Math.abs(m.target - m.angle) < 0.0004 && Math.abs(m.vel) < 0.00002) {
          m.angle = m.goal = m.target; m.vel = 0; m.target = null;
        }
      }
      m.dial += ((m.dragId !== null ? 1 : 0) - m.dial) * lerpK(0.18, dt);
      m.pulse = Math.max(0, m.pulse - dt / 380);
    }

    castAll(this.emitters, this.mirrors, this.obstacles, this.crystals, bounds, this.beams);

    let allLit = this.crystals.length > 0;
    let chainIndex = 0;
    for (const c of this.crystals) {
      if (c.lit && !c.wasLit && this.time - c.lastChime > 180) {
        if (!this.demo) this.audio.chime(1 + 0.06 * chainIndex);
        c.lastChime = this.time;
        if (c.glow < 0.5) c.shock = 1;
      }
      if (c.lit) chainIndex++;
      c.wasLit = c.lit;
      c.shock = Math.max(0, c.shock - dt / 750);
      c.glow += ((c.lit ? 1 : 0) - c.glow) * lerpK(c.lit ? 0.22 : 0.1, dt);
      c.asm += ((c.lit ? 1 : 0) - c.asm) * lerpK(c.lit ? 0.1 : 0.05, dt);
      c.orb += (0.0003 + 0.0014 * c.asm) * dt;
      if (c.lit && this.time - c.lastSpark >= SPARK_INTERVAL) {
        c.lastSpark = this.time;
        this.particles.spawn(c.x, c.y, false);
      }
      if (!c.lit) allLit = false;
    }
    this.harmony += ((allLit ? 1 : 0) - this.harmony) * lerpK(0.06, dt);

    if (!this.demo && !this.won && !this.paused) {
      if (allLit) {
        this.winTimer += dt;
        if (this.winTimer >= WIN_HOLD_MS) this._win();
      } else {
        this.winTimer = 0;
      }
    }
    this.particles.update(dt);
  }

  _win() {
    this.won = true;
    for (const m of this.mirrors) m.dragId = null;
    this.audio.victory();
    this.haptics.win();
    for (const c of this.crystals) for (let i = 0; i < 6; i++) this.particles.spawn(c.x, c.y, true);
    this.onWin?.({ moves: this.moves, bounces: this.totalBounces });
  }
}
