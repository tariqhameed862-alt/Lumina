/* Damped spring on `o[key]` with velocity `o[vkey]` — the engine behind every squash, stretch and bounce.
   Kick it by adding to the velocity (e.g. `c.sqv += 0.01`); it overshoots, wobbles and settles by itself. */
const K = 0.0009;    // stiffness per ms²
const D = 0.028;     // damping per ms  (≈ 0.47 of critical: a couple of visible wobbles)

export function spring(o, key, vkey, dt) {
  const steps = Math.max(1, Math.ceil(dt / 8));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    o[vkey] += (-K * o[key] - D * o[vkey]) * h;
    o[key] += o[vkey] * h;
  }
  if (Math.abs(o[key]) < 0.0005 && Math.abs(o[vkey]) < 0.00005) { o[key] = 0; o[vkey] = 0; }
}
