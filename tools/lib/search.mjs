/*
 * Level search engine: builds candidate levels backwards from a guaranteed solution,
 * brute-force solves each one, and keeps the tightest puzzle. Chapter *specs* live in
 * tools/specs/*.mjs; the writer lives in tools/generate-levels.mjs.
 */
import { solve, solvedAtStart, SOLVE_BOUNDS } from '../solver.mjs';

const PLAY = { x0: 90, x1: 710, y0: 210, y1: 1100 };
const CLEAR = { mirror: 58, crystal: 46, emitter: 40 };   // beam clearance from item centers

/* ---------- Helpers ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const snap = (v, s) => Math.round(v / s) * s;
const mod180 = a => ((a % 180) + 180) % 180;
const mod360 = a => ((a % 360) + 360) % 360;
const dirOf = th => [Math.cos(th * Math.PI / 180), Math.sin(th * Math.PI / 180)];

function distPtSeg(px, py, s) {
  const vx = s.x1 - s.x0, vy = s.y1 - s.y0;
  const L2 = vx * vx + vy * vy;
  let t = L2 ? ((px - s.x0) * vx + (py - s.y0) * vy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(s.x0 + vx * t - px, s.y0 + vy * t - py);
}
function exitDist(x, y, th, R) {
  const [dx, dy] = dirOf(th);
  const tx = dx > 1e-9 ? (R.x1 - x) / dx : dx < -1e-9 ? (R.x0 - x) / dx : Infinity;
  const ty = dy > 1e-9 ? (R.y1 - y) / dy : dy < -1e-9 ? (R.y0 - y) / dy : Infinity;
  return Math.max(0, Math.min(tx, ty));
}
const inPlay = (x, y, m = 0) => x >= PLAY.x0 + m && x <= PLAY.x1 - m && y >= PLAY.y0 + m && y <= PLAY.y1 - m;
function segHitsRect(s, r, pad) {
  const len = Math.hypot(s.x1 - s.x0, s.y1 - s.y0), n = Math.max(2, Math.ceil(len / 6));
  for (let i = 0; i <= n; i++) {
    const x = s.x0 + (s.x1 - s.x0) * i / n, y = s.y0 + (s.y1 - s.y0) * i / n;
    if (x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad) return true;
  }
  return false;
}
function distPtRect(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

/* ---------- Candidate builder ---------- */
function buildCandidate(spec, rnd) {
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const range = (a, b) => a + rnd() * (b - a);
  const items = [];      // {x,y,kind}
  const segs = [];       // solution segments {x0,y0,x1,y1,path}
  const emitters = [], mirrors = [], crystals = [], obstacles = [];

  const clearOf = (s, ignore) => items.every(it => ignore.includes(it) || distPtSeg(it.x, it.y, s) >= CLEAR[it.kind]);
  const farFromItems = (x, y, d) => items.every(it => Math.hypot(it.x - x, it.y - y) >= d);
  const farFromSegs = (x, y, d) => segs.every(s => distPtSeg(x, y, s) >= d);

  // Emitters on distinct sides
  const sides = ['left', 'right', 'bottom', 'top'].sort(() => rnd() - 0.5).slice(0, spec.em);
  for (const side of sides) {
    let e;
    for (let k = 0; k < 40; k++) {
      if (side === 'left') e = { x: 80, y: snap(range(280, 1040), 20), dx: 1, dy: 0 };
      if (side === 'right') e = { x: 720, y: snap(range(280, 1040), 20), dx: -1, dy: 0 };
      if (side === 'bottom') e = { x: snap(range(140, 660), 20), y: 1090, dx: 0, dy: -1 };
      if (side === 'top') e = { x: snap(range(140, 660), 20), y: 230, dx: 0, dy: 1 };
      if (farFromItems(e.x, e.y, 160)) break;
    }
    emitters.push(e);
    items.push({ x: e.x, y: e.y, kind: 'emitter' });
  }

  // Split path mirrors across emitters (each gets at least one)
  const perEm = new Array(spec.em).fill(1);
  const totalPath = spec.path + (spec.fixed || 0);
  for (let i = spec.em; i < totalPath; i++) perEm[i % spec.em]++;

  const finals = [];   // final open segment per path
  for (let p = 0; p < spec.em; p++) {
    const e = emitters[p];
    let x = e.x + e.dx * 32, y = e.y + e.dy * 32;
    let th = mod360(Math.atan2(e.dy, e.dx) * 180 / Math.PI);
    let prevItem = items[p];
    for (let k = 0; k < perEm[p]; k++) {
      let ok = false;
      for (let tries = 0; tries < 60 && !ok; tries++) {
        const maxD = Math.min(560, exitDist(x, y, th, PLAY) - 30);
        if (maxD < 180) return null;
        const d = snap(range(180, maxD), 20);
        const px = Math.round(x + Math.cos(th * Math.PI / 180) * d);
        const py = Math.round(y + Math.sin(th * Math.PI / 180) * d);
        if (!inPlay(px, py)) continue;
        if (!farFromItems(px, py, 140) || !farFromSegs(px, py, 60)) continue;
        const seg = { x0: x, y0: y, x1: px, y1: py, path: p };
        if (!clearOf(seg, [prevItem])) continue;
        const turn = pick([-120, -90, -90, -60, 60, 90, 90, 120]);
        const th2 = mod360(th + turn);
        const room = exitDist(px, py, th2, PLAY);
        if (room < (k === perEm[p] - 1 ? 240 : 260)) continue;
        const item = { x: px, y: py, kind: 'mirror' };
        items.push(item);
        segs.push(seg);
        mirrors.push({ x: px, y: py, sol: mod180(th + turn / 2), fixed: false, path: p });
        x = px; y = py; th = th2; prevItem = item;
        ok = true;
      }
      if (!ok) return null;
    }
    const L = exitDist(x, y, th, SOLVE_BOUNDS);
    const [dx, dy] = dirOf(th);
    const fin = { x0: x, y0: y, x1: x + dx * L, y1: y + dy * L, path: p, th };
    if (!clearOf(fin, [prevItem])) return null;
    segs.push(fin);
    finals.push({ seg: fin, from: prevItem });
  }

  // Crystals: one on each path's final segment, the rest on inner segments
  const placeOn = (seg, tMin, tMax) => {
    const len = Math.hypot(seg.x1 - seg.x0, seg.y1 - seg.y0);
    for (let k = 0; k < 40; k++) {
      const t = range(tMin, Math.min(tMax, len - 40)) / len;
      if (t <= 0) return false;
      const cx = Math.round(seg.x0 + (seg.x1 - seg.x0) * t), cy = Math.round(seg.y0 + (seg.y1 - seg.y0) * t);
      if (!inPlay(cx, cy, 10) || !farFromItems(cx, cy, 120)) continue;
      crystals.push({ x: cx, y: cy });
      items.push({ x: cx, y: cy, kind: 'crystal' });
      return true;
    }
    return false;
  };
  for (const f of finals) if (!placeOn(f.seg, 150, 540)) return null;
  const inner = segs.filter(s => !finals.some(f => f.seg === s));
  let extra = spec.cr - finals.length;
  for (let k = 0; k < 80 && extra > 0; k++) {
    const s = pick(inner);
    const len = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
    if (len < 260) continue;
    if (placeOn(s, len * 0.35, len * 0.65)) extra--;
  }
  if (extra > 0) return null;

  // Lock some path mirrors (never the last mirror of a path — keeps the finish interactive)
  let fixedLeft = spec.fixed || 0;
  const lockable = mirrors.filter((m, i) => mirrors.slice(i + 1).some(n => n.path === m.path));
  while (fixedLeft > 0 && lockable.length) {
    const m = lockable.splice(Math.floor(rnd() * lockable.length), 1)[0];
    m.fixed = true;
    fixedLeft--;
  }
  if (fixedLeft > 0) return null;

  // Decoys: far enough from every beam that no orientation can touch it
  for (let d = 0; d < (spec.decoy || 0); d++) {
    let ok = false;
    for (let k = 0; k < 200 && !ok; k++) {
      const x = snap(range(PLAY.x0 + 20, PLAY.x1 - 20), 20), y = snap(range(PLAY.y0 + 40, PLAY.y1 - 20), 20);
      if (!farFromItems(x, y, 150) || !farFromSegs(x, y, 70)) continue;
      mirrors.push({ x, y, sol: null, fixed: false, decoy: true });
      items.push({ x, y, kind: 'mirror' });
      ok = true;
    }
    if (!ok) return null;
  }

  // Obsidian blocks: must not touch the solution; prefer ones that cut off shortcuts
  const rot = mirrors.filter(m => !m.fixed);
  const altLines = [];
  for (const m of rot) for (const c of crystals) altLines.push({ x0: m.x, y0: m.y, x1: c.x, y1: c.y });
  for (const e of emitters) {
    const L = exitDist(e.x, e.y, Math.atan2(e.dy, e.dx) * 180 / Math.PI, PLAY);
    altLines.push({ x0: e.x, y0: e.y, x1: e.x + e.dx * L, y1: e.y + e.dy * L });
  }
  for (let o = 0; o < (spec.obs || 0); o++) {
    let best = null, bestScore = -1;
    for (let k = 0; k < 220; k++) {
      const tall = rnd() < 0.55;
      const w = tall ? snap(range(80, 140), 20) : snap(range(160, 300), 20);
      const h = tall ? snap(range(160, 320), 20) : snap(range(80, 120), 20);
      const r = { x: snap(range(PLAY.x0, PLAY.x1 - w), 20), y: snap(range(PLAY.y0 + 20, PLAY.y1 - h), 20), w, h };
      if (segs.some(s => segHitsRect(s, r, 26))) continue;
      if (items.some(it => distPtRect(it.x, it.y, r) < (it.kind === 'mirror' ? 64 : 50))) continue;
      if (obstacles.some(q => !(r.x > q.x + q.w + 60 || q.x > r.x + r.w + 60 || r.y > q.y + q.h + 60 || q.y > r.y + r.h + 60))) continue;
      const score = altLines.filter(l => segHitsRect(l, r, 0)).length;
      if (score > bestScore) { bestScore = score; best = r; }
    }
    if (!best) return null;
    obstacles.push(best);
  }

  // Starting angles: every free mirror starts clearly wrong
  const outMirrors = mirrors.map(m => {
    if (m.fixed) return { x: m.x, y: m.y, a: m.sol, fixed: true };
    let a;
    for (let k = 0; k < 30; k++) {
      a = snap(range(0, 180), 15) % 180;
      if (m.sol === null) break;
      const diff = Math.abs(mod180(a - m.sol));
      if (Math.min(diff, 180 - diff) >= 30) break;
    }
    return { x: m.x, y: m.y, a };
  });

  const pathLen = segs.reduce((s, g) => s + Math.min(900, Math.hypot(g.x1 - g.x0, g.y1 - g.y0)), 0);
  return { emitters, mirrors: outMirrors, crystals, obstacles, pathLen };
}

/* ---------- Search ---------- */
export function generate(spec, seedBase) {
  let best = null;
  const want = spec.path >= 4 ? 4 : 8;   // candidates to compare
  let found = 0;
  for (let seed = seedBase; seed < seedBase + 6000 && found < want; seed++) {
    const cand = buildCandidate(spec, mulberry32(seed));
    if (!cand) continue;
    if (solvedAtStart(cand)) continue;
    const res = solve(cand);
    if (!res.solutions || !res.par) continue;
    found++;
    const ratio = res.solutions / res.total;
    const score = ratio * 1000 - cand.pathLen / 4000;
    if (!best || score < best.score) best = { ...cand, par: res.par, solutions: res.solutions, total: res.total, score, seed };
  }
  return best;
}

