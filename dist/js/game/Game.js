/* One level's live simulation: mirrors, light, crystals, win detection. Knows nothing about the DOM.
   It announces what happens on `game.events` (crystal, blocked, dizzy, overPar, undo, snap, win) and
   never talks to Iri directly — see js/personality/ for who listens.
   Split by concern:  entities.js · mirrorPhysics.js · crystalLogic.js · scene/demoScene.js · fx/ */
import { DEG, SNAP_STEP, SNAP_THRESHOLD, WIN_HOLD_MS, UNDO_DEPTH, boardBounds } from '../config.js';
import { castAll } from './RayCaster.js';
import { Particles } from './Particles.js';
import { Events } from '../core/Events.js';
import { Shake } from './fx/Shake.js';
import { spring } from './fx/spring.js';
import { makeEmitter, makeMirror, makeCrystal } from './entities.js';
import { stepMirror } from './mirrorPhysics.js';
import { stepCrystals } from './crystalLogic.js';
import { DEMO_SCENE } from './scene/demoScene.js';
import { THEMES } from '../render/themes.js';

// Same wall margin as Viewport.js and tools/solver.mjs — used only for the synchronous
// "settle" cast on load, before the real viewport-derived bounds are available.
const SETTLE_BOUNDS = boardBounds();
const lerpK = (f, dt) => 1 - Math.pow(1 - f, dt / 16.667);
const DIZZY_RADIANS = Math.PI * 4;      // two full turns in a single drag

export class Game {
  constructor({ audio, haptics }) {
    this.audio = audio;
    this.haptics = haptics;
    this.events = new Events();
    this.particles = new Particles();
    this.shake = new Shake();
    this.theme = THEMES.menu;
    this.level = null;
    this.active = false;       // a level (or demo) is loaded
    this.demo = false;
    this.paused = false;
    this.emitters = []; this.mirrors = []; this.crystals = []; this.obstacles = []; this.beams = [];
    this.moves = 0; this.winTimer = 0; this.won = false;
    this.harmony = 0; this.intro = 0; this.time = 0; this.flash = 0;
    this.litCount = 0; this.blockedCount = 0;
    this.history = [];         // undo stack: { mirror, angle }
    this.onWin = null;         // ({ moves, bounces }) => void
    this.onMove = null;        // (moves) => void
  }

  /* ---------- Loading ---------- */
  _build(def) {
    this.emitters = def.emitters.map(makeEmitter);
    this.mirrors = def.mirrors.map(makeMirror);
    this.crystals = def.crystals.map(makeCrystal);
    this.obstacles = def.obstacles.map(o => ({ ...o }));
    this.beams = [];
    this.moves = 0; this.winTimer = 0; this.won = false;
    this.harmony = 0; this.intro = 0; this.paused = false; this.flash = 0;
    this.litCount = 0; this.blockedCount = 0;
    this.history = [];
    this.particles.clear();
    this.active = true;
  }

  load(level, session = null) {
    this.level = level;
    this.demo = false;
    this.theme = THEMES[level.chapterId] || THEMES.menu;
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
    this.theme = THEMES.menu;
    this._build(DEMO_SCENE);
    this._settleCrystals();
  }

  restart() { if (this.level) this.load(this.level); }

  _settleCrystals() {
    castAll(this.emitters, this.mirrors, this.obstacles, this.crystals, SETTLE_BOUNDS, this.beams);
    for (const c of this.crystals) {
      c.wasLit = c.lit; c.glow = c.asm = c.lit ? 1 : 0; c.lid = c.lit ? 0 : 1; c.litSince = -1e9;
    }
    this.litCount = this.crystals.filter(c => c.lit).length;
    this.blockedCount = this.beams.filter(b => b.endType === 'obstacle').length;
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

  /** Make every emitter do a happy hop (Iri just spoke). */
  bounceEmitters() { for (const e of this.emitters) e.bouncev += 0.009; }

  /* ---------- Mirror interaction (called by Input) ---------- */
  grab(m) {
    m.target = null;
    m.goal = m.angle;
    m.vel = 0;
    m.spin = 0;
    this.events.emit('grab', m);
  }

  release(m, startAngle) {
    if (Math.abs(m.goal - startAngle) > 0.5 * DEG) {
      this._pushHistory(m, startAngle);
      this.moves++;
      this.onMove?.(this.moves);
      if (this.level && this.moves === this.level.par + 3) this.events.emit('overPar');
    }
    const nearest = Math.round(m.goal / SNAP_STEP) * SNAP_STEP;
    if (Math.abs(m.goal - nearest) <= SNAP_THRESHOLD) {
      m.target = nearest;
      m.pulse = 1;
      m.sqv += 0.012;                    // squash & stretch on the snap
      this.audio.snap();
      this.audio.boing(1 + (Math.random() - 0.5) * 0.25);
      this.haptics.snap();
      this.events.emit('snap', m);
    } else {
      m.target = m.goal;
    }
  }

  /* ---------- Undo ---------- */
  _pushHistory(m, startAngle) {
    this.history.push({ mirror: m, angle: startAngle });
    if (this.history.length > UNDO_DEPTH) this.history.shift();
  }

  get canUndo() { return this.interactive && this.history.length > 0; }

  /** Reverts the most recent completed rotation. Returns false if there's nothing to undo
   *  or the mirror at the top of the stack is mid-drag (wait for it to be released). */
  undo() {
    if (!this.interactive || !this.history.length) return false;
    const last = this.history[this.history.length - 1];
    if (last.mirror.dragId !== null) return false;
    this.history.pop();
    last.mirror.target = last.angle;
    last.mirror.goal = last.angle;
    last.mirror.pulse = 0.6;
    last.mirror.sqv += 0.008;
    this.moves = Math.max(0, this.moves - 1);
    this.onMove?.(this.moves);
    this.audio.snap(0.8);
    this.audio.squeak();
    this.haptics.snap();
    this.events.emit('undo');
    return true;
  }

  /* ---------- Simulation ---------- */
  update(dt, bounds) {
    if (!this.active) return;
    this.time += dt;
    this.intro += (1 - this.intro) * lerpK(0.06, dt);
    this.shake.update(dt);
    this.flash = Math.max(0, this.flash - dt / 900);

    for (const m of this.mirrors) {
      stepMirror(m, dt, { demo: this.demo, time: this.time });
      if (m.dragId !== null && m.spin > DIZZY_RADIANS) { m.spin = 0; this.events.emit('dizzy'); }
    }
    for (const e of this.emitters) {
      spring(e, 'bounce', 'bouncev', dt);
      e.blinkAt -= dt;
      if (e.blinkAt <= 0) { e.blink = 1; e.blinkAt = 1800 + Math.random() * 3600; }
      e.blink = Math.max(0, e.blink - dt / 130);
    }

    castAll(this.emitters, this.mirrors, this.obstacles, this.crystals, bounds, this.beams);

    const { allLit, litCount } = stepCrystals(this, dt);
    this.harmony += ((allLit ? 1 : 0) - this.harmony) * lerpK(0.06, dt);

    if (!this.demo) {
      if (litCount !== this.litCount) {
        const delta = Math.sign(litCount - this.litCount);
        this.litCount = litCount;
        this.events.emit('crystal', { lit: litCount, total: this.crystals.length, delta });
      }
      const blocked = this.beams.filter(b => b.endType === 'obstacle').length;
      if (blocked > this.blockedCount) this.events.emit('blocked');
      this.blockedCount = blocked;
    }

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
    this.audio.pop();
    this.audio.giggle(5);
    this.haptics.win();
    this.shake.add(0.55);
    this.flash = 1;
    const n = this.theme.confetti.length;
    this.crystals.forEach((c, i) => {
      c.cheerAt = this.time + 120 + i * 140;
      for (let k = 0; k < 6; k++) this.particles.spawn(c.x, c.y, true);
      this.particles.confetti(c.x, c.y, 18, n);
    });
    this.events.emit('win');
    this.onWin?.({ moves: this.moves, bounces: this.totalBounces });
  }
}
