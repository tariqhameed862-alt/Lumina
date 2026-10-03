/* Factories for the live objects in a level. Keeping "what fields does a crystal have?" in one place
   means Game, the renderers and the personality code all agree. */
import { DEG } from '../config.js';

const rand = (a, b) => a + Math.random() * (b - a);

export function makeEmitter(e) {
  return { ...e, bounce: 0, bouncev: 0, blink: 0, blinkAt: rand(1500, 4000) };
}

export function makeMirror(m) {
  return {
    x: m.x, y: m.y, angle: m.a * DEG, goal: m.a * DEG, vel: 0, target: null,
    fixed: !!m.fixed, dragId: null, dial: 0, needle: 0, hover: false, pulse: 0,
    sweep: (m.sweep || 0) * DEG, speed: m.speed || 0, base: m.a * DEG,
    sq: 0, sqv: 0,          // squash & stretch spring (kicked on snap)
    spin: 0                 // radians turned in the current drag (for the "dizzy" joke)
  };
}

export function makeCrystal(c, i) {
  return {
    x: c.x, y: c.y, lit: false, wasLit: false, glow: 0, asm: 0, orb: i * 0.7, shock: 0,
    lastSpark: 0, lastChime: -1e9, phase: i * 1.3 + c.x * 0.01,
    // personality
    sq: 0, sqv: 0,                       // squash & stretch
    lid: 1, blink: 0, blinkAt: rand(1200, 4200),   // eyelids: 1 = closed
    lx: 0, ly: 0,                        // pupil look offset (-1..1)
    yawn: 0,                             // 1 → 0 mouth-open stretch right after waking
    cheer: 0, cheerAt: Infinity,         // win dance
    litSince: 0                          // ms timestamp the crystal became lit (for the "went back to sleep" cue)
  };
}
