/* Iri's brain: decides WHEN to talk (cooldowns, priorities, idle nudges, once-per-level jokes)
   and WHAT to say (see lines.js / quips.js). No DOM in here — the speech bubble is js/ui/IriBubble.js. */
import { LINES } from './lines.js';
import { QUIPS } from './quips.js';

const GAP_MS = 2600;                  // minimum silence between two normal-priority lines
const IDLE_STEPS = [[14000, 'idle1'], [17000, 'idle2'], [20000, 'idle3']];
const UNDO_WINDOW_MS = 9000;

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class Iri {
  /**
   * @param bubble   object with show({text, mood, duration}) / hide()
   * @param opts.enabled   start muted or not (Settings → Iri chatter)
   * @param opts.isPlaying () => bool  true while a level is live (drives idle nudges)
   * @param opts.onSpeak   () => void  fired on each line (the emitter does a happy bounce)
   */
  constructor(bubble, { enabled = true, isPlaying = () => false, onSpeak = null } = {}) {
    this.bubble = bubble;
    this.enabled = enabled;
    this.isPlaying = isPlaying;
    this.onSpeak = onSpeak;
    this.lastSpoke = 0;
    this.lastIndex = {};              // pool key -> last index used (avoid immediate repeats)
    this.flags = {};                  // once-per-level jokes
    this.undoTimes = [];
    this.idleStep = 0;
    this._idleTimer = 0;
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) { this.bubble.hide(); clearTimeout(this._idleTimer); }
  }

  /* ---------- core ---------- */
  _pick(key) {
    const pool = LINES[key];
    if (!pool?.length) return null;
    let i = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && i === this.lastIndex[key]) i = (i + 1) % pool.length;
    this.lastIndex[key] = i;
    return pool[i];
  }

  /** Speak from a pool. priority: 0 idle chatter · 1 reaction · 2 always heard. Returns true if spoken. */
  say(key, { priority = 1, chance = 1 } = {}) {
    const line = this._pick(key);
    return line ? this._speak(line, priority, chance) : false;
  }

  _speak([mood, text], priority = 1, chance = 1) {
    if (!this.enabled) return false;
    const now = performance.now();
    if (priority < 2 && now - this.lastSpoke < GAP_MS) return false;
    if (chance < 1 && Math.random() > chance) return false;
    this.lastSpoke = now;
    this.bubble.show({ text, mood, duration: Math.min(5600, 1900 + text.length * 48) });
    this.onSpeak?.();
    return true;
  }

  /** A line for the victory card (returned, not bubbled). null if chatter is off. */
  winLine(stars, { seconds, par, isLast }) {
    if (!this.enabled) return null;
    // "Suspiciously quick": a 3-star solve of a real puzzle (par 3+) in under 9 seconds.
    const key = isLast ? 'finale' : (stars === 3 && par >= 3 && seconds < 9) ? 'winFast' : `win${stars}`;
    return this._pick(key);
  }

  /* ---------- flow ---------- */
  menu({ fresh, allDone }) {
    this.say(allDone ? 'menuDone' : fresh ? 'menuFresh' : 'menuBack', { priority: 2 });
  }
  poke() { this.say('menuPoke', { priority: 1 }); }

  levelStart(level, { repeat }) {
    this.flags = {};
    this.undoTimes = [];
    this.bubble.hide();
    const quip = QUIPS[level.name];
    // First visit gets the level's own quip; revisits get a short "again?" line only sometimes.
    clearTimeout(this._quipTimer);
    if (!repeat && quip) this._quipTimer = setTimeout(() => { if (this.isPlaying()) this._speak(quip, 2); }, 1700);
    else if (repeat) this._quipTimer = setTimeout(() => { if (this.isPlaying()) this.say('levelRepeat', { priority: 1, chance: 0.4 }); }, 1700);
    this.resetIdle();
  }

  pause() { this.say('pause', { priority: 2 }); clearTimeout(this._idleTimer); }
  resume() { this.say('resume', { priority: 2 }); this.resetIdle(); }
  restart() { this.say('restart', { priority: 2 }); this.flags = {}; this.undoTimes = []; this.resetIdle(); }

  /* ---------- in-level reactions ---------- */
  touch() { this.idleStep = 0; this.resetIdle(); }

  undo() {
    const now = performance.now();
    this.undoTimes = this.undoTimes.filter((t) => now - t < UNDO_WINDOW_MS);
    this.undoTimes.push(now);
    this.say(this.undoTimes.length >= 3 ? 'undoMany' : 'undoOnce', { priority: 1, chance: this.undoTimes.length >= 3 ? 1 : 0.5 });
    this.touch();
  }

  dizzy() { if (!this.flags.dizzy) this.flags.dizzy = this.say('dizzy', { priority: 1 }); }

  overPar() { if (!this.flags.overPar) this.flags.overPar = this.say('overPar', { priority: 1 }); }

  blocked() {
    const now = performance.now();
    if (now - (this.flags.blockedAt || 0) < 14000) return;
    if (this.say('blocked', { priority: 1 })) this.flags.blockedAt = now;
  }

  /** delta > 0: a crystal just woke; < 0: one fell asleep again. */
  crystals({ lit, total, delta }) {
    if (delta > 0) {
      if (lit === total) return;                                  // the win celebration takes over
      if (!this.flags.woke) { if (this.say('firstWake', { priority: 1 })) this.flags.woke = true; }
      else if (lit === total - 1 && total >= 3) this.say('lastOne', { priority: 1 });
      else this.say('wakeMore', { priority: 1, chance: 0.5 });
    } else if (lit > 0) {
      this.say('lostOne', { priority: 1, chance: 0.6 });
    }
  }

  /* ---------- idle nudges ---------- */
  resetIdle() {
    clearTimeout(this._idleTimer);
    if (!this.enabled) return;
    const step = IDLE_STEPS[Math.min(this.idleStep, IDLE_STEPS.length - 1)];
    this._idleTimer = setTimeout(() => {
      if (!this.isPlaying()) return;
      this.say(step[1], { priority: 0 });
      if (this.idleStep < IDLE_STEPS.length - 1) { this.idleStep++; this.resetIdle(); }
    }, step[0]);
  }
}
