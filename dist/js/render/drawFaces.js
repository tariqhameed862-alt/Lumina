/* Faces — the cheapest way to turn shapes into characters.
   crystalFace: sleepy → yawning → happy → dancing.   mirrorEyes: googly eyes that follow the light (grumpy brow when locked).
   emitterEyes: the light forge watches the nearest sleepy crystal.   All drawn with a handful of canvas primitives. */

const INK = '#2b1408';
const BLUSH = 'rgba(251,113,133,';

function closedEye(ctx, x, y, w, happy) {
  ctx.beginPath();
  if (happy) { ctx.moveTo(x - w, y + 1); ctx.quadraticCurveTo(x, y - w * 1.15, x + w, y + 1); }   // ^ ^ joyful
  else { ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y + w * 0.9, x + w, y); }                  // ︶ asleep
  ctx.stroke();
}

function dotEye(ctx, x, y, rx, ry, lx, ly) {
  ctx.beginPath();
  ctx.ellipse(x + lx * 1.2, y + ly * 1.0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  if (ry > 1.2) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + lx * 1.2 - rx * 0.32, y + ly - ry * 0.35, Math.max(0.7, rx * 0.34), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
  }
}

/** Sleeping crystals get floating "z z z"; called under the gem so they read as coming out of it. */
export function drawSnores(ctx, c, env) {
  const g = c.glow;
  if (g > 0.6) return;
  const T = env.time * env.motion;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 0; k < 3; k++) {
    const t = env.motion ? ((T * 0.00032 + k / 3 + c.phase * 0.17) % 1) : k / 3;
    ctx.globalAlpha = env.a(Math.sin(Math.PI * t) * 0.75 * (1 - g / 0.6));
    ctx.fillStyle = 'rgba(203,213,225,1)';
    ctx.font = `700 ${Math.round(9 + t * 9)}px system-ui, sans-serif`;
    ctx.fillText('z', 20 + t * 14 + Math.sin(t * 6 + k) * 2, -20 - t * 30);
  }
  ctx.restore();
}

/** The face itself. Local origin = gem centre; upright regardless of gem spin. */
export function drawCrystalFace(ctx, c, env) {
  const g = c.glow;
  const awake = g > 0.35;
  const cheer = c.cheer;
  const lid = Math.min(1, c.lid);
  ctx.save();
  ctx.globalAlpha = env.a(1);
  ctx.strokeStyle = awake ? INK : 'rgba(226,232,240,0.85)';
  ctx.fillStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';

  const ex = 6.6, ey = -2.2;
  if (cheer > 0.5) {                      // joyful ^ ^
    closedEye(ctx, -ex, ey, 3.3, true); closedEye(ctx, ex, ey, 3.3, true);
  } else if (lid > 0.72) {                // asleep / mid-blink
    closedEye(ctx, -ex, ey, 3.2, false); closedEye(ctx, ex, ey, 3.2, false);
  } else {                                // awake: dot eyes that follow the mirrors
    const ry = 3.6 * (1 - lid * 0.9), rx = 2.7;
    dotEye(ctx, -ex, ey, rx, ry, c.lx, c.ly);
    dotEye(ctx, ex, ey, rx, ry, c.lx, c.ly);
  }

  // cheeks
  if (awake) {
    ctx.fillStyle = BLUSH + (0.32 * g + 0.25 * cheer) + ')';
    ctx.beginPath(); ctx.arc(-11.5, 3.6, 3, 0, 6.283); ctx.arc(11.5, 3.6, 3, 0, 6.283); ctx.fill();
  }

  // mouth
  ctx.fillStyle = INK;
  ctx.lineWidth = 1.4;
  if (cheer > 0.5) {                      // big open grin
    ctx.beginPath(); ctx.moveTo(-5.5, 3.2); ctx.quadraticCurveTo(0, 12, 5.5, 3.2); ctx.closePath(); ctx.fill();
  } else if (c.yawn > 0.05 && awake) {    // mid-yawn "O"
    ctx.beginPath(); ctx.ellipse(0, 6, 3.2 * c.yawn + 1, 4.2 * c.yawn + 0.8, 0, 0, 6.283); ctx.fill();
  } else if (awake) {                     // content smile
    ctx.beginPath(); ctx.moveTo(-4, 4.8); ctx.quadraticCurveTo(0, 8.6, 4, 4.8); ctx.stroke();
  } else {                                // asleep: tiny breathing mouth
    const b = env.motion ? 0.5 + 0.5 * Math.sin(env.time * 0.0023 + c.phase) : 0.5;
    ctx.beginPath(); ctx.ellipse(0, 6.2, 1.5 + b * 0.8, 1 + b * 0.9, 0, 0, 6.283); ctx.stroke();
  }
  ctx.restore();
}

/** Googly eyes on a mirror's pivot: they follow the nearest crystal, squint while dragged, scowl if the mirror is locked. */
export function drawMirrorEyes(ctx, game, env) {
  if (game.demo) return;
  for (const m of game.mirrors) {
    let tx = 0, ty = 1, best = Infinity;
    for (const c of game.crystals) {
      const d = Math.hypot(c.x - m.x, c.y - m.y);
      if (d < best) { best = d; tx = (c.x - m.x) / d; ty = (c.y - m.y) / d; }
    }
    const dragged = m.dragId !== null;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.globalAlpha = env.a(0.95);
    for (const s of [-1, 1]) {
      const x = s * 5.6;
      if (dragged) {                                     // >  <  squint: "wheee"
        ctx.strokeStyle = m.fixed ? '#78350F' : '#0F172A';
        ctx.lineWidth = 1.7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - s * 3, -3.4); ctx.lineTo(x + s * 0.4, 0); ctx.lineTo(x - s * 3, 3.4); ctx.stroke();
        continue;
      }
      ctx.beginPath(); ctx.arc(x, 0, 4.1, 0, 6.283);
      ctx.fillStyle = '#F8FAFC'; ctx.fill();
      ctx.strokeStyle = m.fixed ? '#92400E' : '#334155'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(x + tx * 1.9, ty * 1.9, 1.9, 0, 6.283);
      ctx.fillStyle = '#0F172A'; ctx.fill();
    }
    if (m.fixed && !dragged) {                           // locked mirrors are permanently unimpressed
      ctx.strokeStyle = '#78350F'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-9, -6.2); ctx.lineTo(-2, -4); ctx.moveTo(9, -6.2); ctx.lineTo(2, -4); ctx.stroke();
    }
    ctx.restore();
  }
}

/** Emitter eyes — drawn in the emitter's rotated frame, so we undo the rotation to keep them upright. */
export function drawEmitterEyes(ctx, e, game, env, angle) {
  let tx = 0, ty = 0, best = Infinity;
  for (const c of game.crystals) {
    const d = Math.hypot(c.x - e.x, c.y - e.y);
    if (d < best && (!c.lit || best === Infinity)) { best = d; tx = (c.x - e.x) / d; ty = (c.y - e.y) / d; }
  }
  ctx.save();
  ctx.translate(5, 0);
  ctx.rotate(-angle);
  const open = 1 - e.blink;
  for (const s of [-1, 1]) {
    const x = s * 5.4;
    ctx.beginPath(); ctx.ellipse(x, 0, 3.5, 4.4 * Math.max(0.12, open), 0, 0, 6.283);
    ctx.fillStyle = '#F8FAFC'; ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,0.75)'; ctx.lineWidth = 0.9; ctx.stroke();
    if (open > 0.3) {
      ctx.beginPath(); ctx.arc(x + tx * 1.5, ty * 1.9, 1.7, 0, 6.283);
      ctx.fillStyle = '#0F172A'; ctx.fill();
    }
  }
  ctx.restore();
}
