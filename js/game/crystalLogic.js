/* Per-frame crystal behaviour: glow/assembly easing, wake-up & fall-asleep reactions, blinking,
   pupils that follow the action, yawning, and the victory dance. */
import { SPARK_INTERVAL } from '../config.js';
import { spring } from './fx/spring.js';

const lerpK = (f, dt) => 1 - Math.pow(1 - f, dt / 16.667);
const rand = (a, b) => a + Math.random() * (b - a);

/** Where a crystal's eyes should look: the mirror being dragged, else the closest mirror. */
function lookTarget(c, game) {
  let best = null, bd = Infinity;
  for (const m of game.mirrors) {
    const d = Math.hypot(m.x - c.x, m.y - c.y) - (m.dragId !== null ? 9999 : 0);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}

/** Returns { allLit, litCount }. Emits nothing itself — Game turns changes into events. */
export function stepCrystals(game, dt) {
  const { time, demo } = game;
  let allLit = game.crystals.length > 0, litCount = 0, chainIndex = 0;

  for (const c of game.crystals) {
    /* --- wake-up / fall-asleep edges --- */
    if (c.lit && !c.wasLit) {
      c.litSince = time;
      if (time - c.lastChime > 180) {
        if (!demo) {
          game.audio.chime(1 + 0.06 * chainIndex);
          game.audio.yawn();
        }
        c.lastChime = time;
        if (c.glow < 0.5) c.shock = 1;
      }
      c.sqv += 0.011;               // stretch up as it wakes
      c.yawn = 1;
    } else if (!c.lit && c.wasLit && !demo && time - c.litSince > 650) {
      game.audio.sigh();            // only a real "went back to sleep", not a beam sweeping past
      c.sqv -= 0.006;
    }
    if (c.lit) { chainIndex++; litCount++; }
    c.wasLit = c.lit;

    /* --- glow / assembly (unchanged feel) --- */
    c.shock = Math.max(0, c.shock - dt / 750);
    c.glow += ((c.lit ? 1 : 0) - c.glow) * lerpK(c.lit ? 0.22 : 0.1, dt);
    c.asm += ((c.lit ? 1 : 0) - c.asm) * lerpK(c.lit ? 0.1 : 0.05, dt);
    c.orb += (0.0003 + 0.0014 * c.asm) * dt;
    if (c.lit && time - c.lastSpark >= SPARK_INTERVAL) {
      c.lastSpark = time;
      game.particles.spawn(c.x, c.y, false);
    }
    if (!c.lit) allLit = false;

    /* --- personality --- */
    spring(c, 'sq', 'sqv', dt);
    c.yawn = Math.max(0, c.yawn - dt / 950);

    // blinking (awake) / eyelids following the glow
    c.blinkAt -= dt;
    if (c.blinkAt <= 0) { c.blink = 1; c.blinkAt = rand(2200, 5200); }
    c.blink = Math.max(0, c.blink - dt / 140);
    const lidTarget = c.lit ? Math.max(c.blink, c.yawn * 0.7) : 1;
    c.lid += (lidTarget - c.lid) * lerpK(0.35, dt);

    // pupils
    const m = c.lit ? lookTarget(c, game) : null;
    const tx = m ? Math.max(-1, Math.min(1, (m.x - c.x) / 220)) : 0;
    const ty = m ? Math.max(-1, Math.min(1, (m.y - c.y) / 220)) : 0;
    c.lx += (tx - c.lx) * lerpK(0.12, dt);
    c.ly += (ty - c.ly) * lerpK(0.12, dt);

    // victory dance
    if (game.won && time >= c.cheerAt) {
      c.cheer += (1 - c.cheer) * lerpK(0.15, dt);
      if (time - (c._hop || 0) > 620) { c._hop = time; c.sqv += 0.008; }
    }
  }
  return { allLit, litCount };
}
