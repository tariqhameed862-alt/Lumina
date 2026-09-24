/* Pure ray-casting. No DOM — shared by the game and the Node level tools. */
import { MAX_BOUNCES, MIRROR_HALF, CRYSTAL_R, SELF_GUARD, EMITTER_MUZZLE } from '../config.js';

// Ray (ox,oy)+t(dx,dy) vs segment (ax,ay)+u(ex,ey). Returns t, or Infinity if no hit.
function raySeg(ox, oy, dx, dy, ax, ay, ex, ey) {
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-9) return Infinity;
  const wx = ax - ox, wy = ay - oy;
  const t = (wx * ey - wy * ex) / denom;
  const u = (wx * dy - wy * dx) / denom;
  return (t > 1e-4 && u >= 0 && u <= 1) ? t : Infinity;
}

function segHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const vx = bx - ax, vy = by - ay;
  const L2 = vx * vx + vy * vy;
  let t = L2 > 0 ? ((cx - ax) * vx + (cy - ay) * vy) / L2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const px = ax + vx * t - cx, py = ay + vy * t - cy;
  return px * px + py * py <= r * r;
}

export function createBeam() {
  return { pts: [], bounces: 0, endType: 'wall', ex: 0, ey: 0 };
}

/** Trace one emitter's beam. Marks crystals it passes through as lit. */
export function castBeam(e, mirrors, obstacles, crystals, bounds, beam) {
  const pts = beam.pts;
  pts.length = 0;
  let ox = e.x + e.dx * EMITTER_MUZZLE, oy = e.y + e.dy * EMITTER_MUZZLE;
  let dx = e.dx, dy = e.dy;
  pts.push(ox, oy);
  beam.bounces = 0;
  beam.endType = 'wall';
  let last = null;

  for (let guard = 0; guard < MAX_BOUNCES + 2; guard++) {
    let tMin = Infinity, hitMirror = null, hitObstacle = false, hex = 0, hey = 0;

    for (let i = 0; i < mirrors.length; i++) {
      const m = mirrors[i];
      if (m === last) continue;
      const cx = Math.cos(m.angle) * MIRROR_HALF, cy = Math.sin(m.angle) * MIRROR_HALF;
      const t = raySeg(ox, oy, dx, dy, m.x - cx, m.y - cy, cx * 2, cy * 2);
      if (t < tMin) { tMin = t; hitMirror = m; hitObstacle = false; hex = cx * 2; hey = cy * 2; }
    }
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      let t = raySeg(ox, oy, dx, dy, o.x, o.y, o.w, 0);
      if (t < tMin) { tMin = t; hitMirror = null; hitObstacle = true; }
      t = raySeg(ox, oy, dx, dy, o.x + o.w, o.y, 0, o.h);
      if (t < tMin) { tMin = t; hitMirror = null; hitObstacle = true; }
      t = raySeg(ox, oy, dx, dy, o.x, o.y + o.h, o.w, 0);
      if (t < tMin) { tMin = t; hitMirror = null; hitObstacle = true; }
      t = raySeg(ox, oy, dx, dy, o.x, o.y, 0, o.h);
      if (t < tMin) { tMin = t; hitMirror = null; hitObstacle = true; }
    }
    const tx = dx > 1e-9 ? (bounds.x1 - ox) / dx : dx < -1e-9 ? (bounds.x0 - ox) / dx : Infinity;
    const ty = dy > 1e-9 ? (bounds.y1 - oy) / dy : dy < -1e-9 ? (bounds.y0 - oy) / dy : Infinity;
    const tw = Math.max(0, Math.min(tx, ty));
    if (tw < tMin) { tMin = tw; hitMirror = null; hitObstacle = false; }

    const hx = ox + dx * tMin, hy = oy + dy * tMin;
    for (let i = 0; i < crystals.length; i++) {
      const c = crystals[i];
      if (!c.lit && segHitsCircle(ox, oy, hx, hy, c.x, c.y, CRYSTAL_R)) c.lit = true;
    }
    pts.push(hx, hy);

    if (hitMirror) {
      if (beam.bounces >= MAX_BOUNCES) { beam.endType = 'absorbed'; beam.ex = hx; beam.ey = hy; return beam; }
      const len = Math.hypot(hex, hey);
      let nx = -hey / len, ny = hex / len;
      if (dx * nx + dy * ny > 0) { nx = -nx; ny = -ny; }   // two-sided mirror
      const d = dx * nx + dy * ny;
      dx -= 2 * d * nx;                                     // R = D − 2(D·N)N
      dy -= 2 * d * ny;
      const dl = Math.hypot(dx, dy);
      dx /= dl; dy /= dl;
      ox = hx + nx * SELF_GUARD;
      oy = hy + ny * SELF_GUARD;
      last = hitMirror;
      beam.bounces++;
      continue;
    }
    beam.endType = hitObstacle ? 'obstacle' : 'wall';
    beam.ex = hx; beam.ey = hy;
    return beam;
  }
  return beam;
}

/** Trace every emitter. `beams` is reused between frames to avoid allocation. */
export function castAll(emitters, mirrors, obstacles, crystals, bounds, beams) {
  for (let i = 0; i < crystals.length; i++) crystals[i].lit = false;
  while (beams.length < emitters.length) beams.push(createBeam());
  beams.length = emitters.length;
  for (let i = 0; i < emitters.length; i++) castBeam(emitters[i], mirrors, obstacles, crystals, bounds, beams[i]);
  let lit = 0;
  for (let i = 0; i < crystals.length; i++) if (crystals[i].lit) lit++;
  return lit;
}
