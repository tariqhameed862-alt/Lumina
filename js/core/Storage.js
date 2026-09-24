/* Versioned save data in localStorage. Every write is wrapped: private mode / blocked storage never crashes the game. */
import { SAVE_KEY, LEGACY_KEY } from '../config.js';

const defaults = () => ({
  version: 1,
  levels: {},                     // index -> { stars, bestMoves, bestBounces, completedAt }
  settings: { sound: true, haptics: true },
  lastLevel: 0,                   // level to offer on "Continue"
  session: null                   // unfinished level: { index, angles:[deg], moves }
});

function readRaw(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function writeRaw(key, v) { try { localStorage.setItem(key, v); return true; } catch (e) { return false; } }
function removeRaw(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }

export class Storage {
  constructor(levelCount) {
    this.levelCount = levelCount;
    this.data = this.load();
  }

  load() {
    const d = defaults();
    const raw = readRaw(SAVE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          ...d, ...parsed,
          settings: { ...d.settings, ...(parsed.settings || {}) },
          levels: parsed.levels || {}
        };
      } catch (e) { /* corrupt save: fall through to defaults */ }
    }
    // Migrate the single-file prototype's "highest unlocked level" key
    const legacy = parseInt(readRaw(LEGACY_KEY), 10);
    if (Number.isFinite(legacy) && legacy > 1) {
      for (let i = 0; i < Math.min(legacy - 1, this.levelCount); i++) {
        d.levels[i] = { stars: 1, bestMoves: null, bestBounces: null, completedAt: Date.now() };
      }
      d.lastLevel = Math.min(legacy - 1, this.levelCount - 1);
    }
    return d;
  }

  save() { writeRaw(SAVE_KEY, JSON.stringify(this.data)); }

  /* ---- Levels ---- */
  record(i) { return this.data.levels[i] || null; }
  isCompleted(i) { return !!this.data.levels[i]; }
  stars(i) { return this.data.levels[i]?.stars || 0; }
  isUnlocked(i) { return i === 0 || this.isCompleted(i - 1) || this.isCompleted(i); }
  totalStars() { return Object.values(this.data.levels).reduce((s, r) => s + (r.stars || 0), 0); }
  completedCount() { return Object.keys(this.data.levels).length; }

  /** First level that is unlocked but not finished (or the last level). */
  nextToPlay() {
    for (let i = 0; i < this.levelCount; i++) if (!this.isCompleted(i)) return i;
    return this.levelCount - 1;
  }

  /** Store a win; keeps the best stars / moves / bounces. Returns what improved. */
  recordWin(i, { stars, moves, bounces }) {
    const prev = this.data.levels[i];
    const rec = {
      stars: Math.max(stars, prev?.stars || 0),
      bestMoves: prev?.bestMoves == null ? moves : Math.min(prev.bestMoves, moves),
      bestBounces: prev?.bestBounces == null ? bounces : Math.min(prev.bestBounces, bounces),
      completedAt: prev?.completedAt || Date.now()
    };
    this.data.levels[i] = rec;
    this.data.lastLevel = Math.min(i + 1, this.levelCount - 1);
    if (this.data.session?.index === i) this.data.session = null;
    this.save();
    return {
      firstClear: !prev,
      newStars: rec.stars > (prev?.stars || 0),
      newBestMoves: !!prev && prev.bestMoves != null && moves < prev.bestMoves
    };
  }

  /* ---- Mid-level session (resume exactly where the player left) ---- */
  saveSession(session) { this.data.session = session; this.data.lastLevel = session.index; this.save(); }
  getSession(i) { const s = this.data.session; return s && s.index === i ? s : null; }
  clearSession() { if (this.data.session) { this.data.session = null; this.save(); } }

  /* ---- Settings ---- */
  get settings() { return this.data.settings; }
  setSetting(key, value) { this.data.settings[key] = value; this.save(); }

  reset() {
    const settings = this.data.settings;
    this.data = { ...defaults(), settings };
    removeRaw(LEGACY_KEY);
    this.save();
  }
}
