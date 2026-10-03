/* Brute-force level solver: tries every 15° orientation of every rotatable mirror. */
import { castAll } from '../js/game/RayCaster.js';
import { DEG, boardBounds } from '../js/config.js';

// Same wall margin the live game uses (js/config.js) — keeps "solvable" identical
// between this brute-force verifier and actual gameplay.
export const SOLVE_BOUNDS = boardBounds();
const STEPS = 12; // 0°..165° — a mirror is symmetric under 180°

function runtime(def) {
  return {
    emitters: def.emitters.map(e => ({ ...e })),
    mirrors: def.mirrors.map(m => ({ x: m.x, y: m.y, angle: m.a * DEG, fixed: !!m.fixed, a0: m.a })),
    obstacles: def.obstacles.map(o => ({ ...o })),
    crystals: def.crystals.map(c => ({ x: c.x, y: c.y, lit: false }))
  };
}

const mod180 = a => ((a % 180) + 180) % 180;

/** Is the level already solved in its starting layout? */
export function solvedAtStart(def) {
  const r = runtime(def);
  return castAll(r.emitters, r.mirrors, r.obstacles, r.crystals, SOLVE_BOUNDS, []) === r.crystals.length;
}

/**
 * Returns { solutions, total, par, example } where par is the fewest mirrors
 * that must be turned away from their starting angle to win.
 */
export function solve(def) {
  const r = runtime(def);
  const rot = r.mirrors.filter(m => !m.fixed);
  const n = rot.length;
  const total = STEPS ** n;
  const beams = [];
  let solutions = 0, par = Infinity, example = null;
  const digits = new Array(n).fill(0);
  for (let idx = 0; idx < total; idx++) {
    let v = idx;
    for (let i = 0; i < n; i++) {
      digits[i] = v % STEPS;
      v = (v / STEPS) | 0;
      rot[i].angle = digits[i] * 15 * DEG;
    }
    if (castAll(r.emitters, r.mirrors, r.obstacles, r.crystals, SOLVE_BOUNDS, beams) === r.crystals.length) {
      solutions++;
      let changed = 0;
      for (let i = 0; i < n; i++) if (mod180(digits[i] * 15) !== mod180(rot[i].a0)) changed++;
      if (changed < par) { par = changed; example = digits.map(d => d * 15); }
    }
  }
  return { solutions, total, par: par === Infinity ? null : par, example };
}
