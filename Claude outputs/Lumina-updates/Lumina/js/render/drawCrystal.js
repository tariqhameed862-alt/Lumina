/* Crystal "Sun Shrine": ground sigil (under the beam) → orbiting shards + faceted gem (over the beam)
   → god rays, corona, glint, activation shockwave and hold-to-win arc (additive glare). */
import { WIN_HOLD_MS } from '../config.js';
import { SPR, trianglePath } from './assets.js';

const GEM_R = 22, GEM_TABLE = 10;
const OFF_DARK = [15, 23, 42], OFF_LIGHT = [71, 85, 105];
const ON_DARK = [180, 83, 9], ON_LIGHT = [254, 243, 199];

const mixRgb = (a, b, t) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

export function drawCrystalBase(ctx, game, env) {
  const T = env.time * env.motion;   // idle decorative motion only — respects prefers-reduced-motion
  for (const c of game.crystals) {
    const g = c.glow;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.globalAlpha = env.a(0.75);
    ctx.drawImage(SPR.shadow, -40, 18, 80, 26);

    const breathe = 0.5 + 0.5 * Math.sin(T * 0.0022 + c.phase);
    ctx.rotate(T * 0.00012 + c.phase);
    ctx.globalAlpha = env.a(1);
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(148,163,184,${0.1 + 0.08 * breathe * (1 - g)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.setLineDash([2, 7]);
    ctx.strokeStyle = `rgba(148,163,184,${0.08 + 0.1 * g})`;
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12;
      const len = i % 6 === 0 ? 7 : 3.5;
      const cs = Math.cos(a), sn = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cs * 44, sn * 44);
      ctx.lineTo(cs * (44 - len), sn * (44 - len));
      ctx.strokeStyle = i / 24 < g ? 'rgba(253,230,138,0.85)' : 'rgba(148,163,184,0.22)';
      ctx.lineWidth = i % 6 === 0 ? 1.5 : 1;
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const a = i * 2.0944 - Math.PI / 2;
      ctx.save();
      ctx.translate(Math.cos(a) * 50, Math.sin(a) * 50);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-3.5, 0); ctx.lineTo(0, -2.2); ctx.lineTo(3.5, 0); ctx.lineTo(0, 2.2);
      ctx.closePath();
      ctx.fillStyle = g > 0.5 ? '#FBBF24' : 'rgba(148,163,184,0.45)';
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}

function drawShard(ctx, r, a, g, env) {
  ctx.save();
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(r - 7, 0);
  ctx.lineTo(r + 1, -4.2);
  ctx.lineTo(r + 10, 0);
  ctx.lineTo(r + 1, 4.2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(51,65,85,0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(148,163,184,0.5)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  if (g > 0.01) {
    const ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * g;
    ctx.fillStyle = env.gr.shard;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,251,235,0.8)';
    ctx.stroke();
    ctx.globalAlpha = ga;
  }
  ctx.beginPath();
  ctx.moveTo(r - 5, 0);
  ctx.lineTo(r + 8, 0);
  ctx.strokeStyle = `rgba(255,255,255,${0.15 + 0.35 * g})`;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();
}

function drawFacets(ctx, dark, light, stroke, lightAng, shimmer) {
  const out = [], inn = [];
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4 + Math.PI / 8;
    out.push([Math.cos(a) * GEM_R, Math.sin(a) * GEM_R]);
    inn.push([Math.cos(a) * GEM_TABLE, Math.sin(a) * GEM_TABLE]);
  }
  for (let k = 0; k < 8; k++) {
    const k2 = (k + 1) % 8;
    const mid = (k + 0.5) * Math.PI / 4 + Math.PI / 8;
    const b = 0.5 + 0.5 * Math.cos(mid - lightAng);
    ctx.beginPath();
    ctx.moveTo(out[k][0], out[k][1]);
    ctx.lineTo(out[k2][0], out[k2][1]);
    ctx.lineTo(inn[k2][0], inn[k2][1]);
    ctx.lineTo(inn[k][0], inn[k][1]);
    ctx.closePath();
    ctx.fillStyle = mixRgb(dark, light, b * 0.85);
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
  ctx.beginPath();
  inn.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = mixRgb(dark, light, 0.72 + 0.2 * shimmer);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.beginPath();
  out.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.lineWidth = 1.1;
  ctx.stroke();
}

export function drawCrystals(ctx, game, env) {
  const T = env.time * env.motion;
  for (const c of game.crystals) {
    const g = c.glow, asm = c.asm;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.globalAlpha = env.a(1);

    const r = 50 - 19 * easeOutBack(Math.min(1, asm));
    for (let i = 0; i < 3; i++) {
      const wobble = (1 - asm) * 3 * Math.sin(T * 0.002 + i * 2 + c.phase);
      drawShard(ctx, r + wobble, c.orb + i * 2.0944, g, env);
    }

    const lightAng = -2.35 + 0.45 * Math.sin(T * 0.0009 + c.phase);
    const shimmer = 0.5 + 0.5 * Math.sin(T * 0.004 + c.phase);
    ctx.translate(0, Math.sin(T * 0.0018 + c.phase) * 1.2);
    ctx.rotate(c.phase * 0.3);
    drawFacets(ctx, OFF_DARK, OFF_LIGHT, 'rgba(148,163,184,0.38)', lightAng, 0);
    if (g > 0.01) {
      ctx.globalAlpha = env.a(g);
      drawFacets(ctx, ON_DARK, ON_LIGHT, 'rgba(255,251,235,0.6)', lightAng, shimmer);
      ctx.rotate(T * 0.0012);
      ctx.beginPath();
      trianglePath(ctx, 8.5, -Math.PI / 2);
      trianglePath(ctx, 8.5, Math.PI / 2);
      ctx.strokeStyle = 'rgba(120,53,15,0.55)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawCrystalGlare(ctx, game, env) {
  const T = env.time * env.motion;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const c of game.crystals) {
    const g = c.glow;
    if (g > 0.01) {
      const pulse = 1 + 0.06 * Math.sin(T * 0.004 + c.phase);
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(T * 0.00025 + c.phase);
      ctx.globalAlpha = env.a(g * 0.5);
      const rs = 250 * pulse;
      ctx.drawImage(SPR.rays, -rs / 2, -rs / 2, rs, rs);
      if (env.highFX) {
        // Secondary counter-rotating ray layer — extra draw call, only on high FX.
        ctx.rotate(-T * 0.0006);
        ctx.globalAlpha = env.a(g * 0.28);
        ctx.drawImage(SPR.rays, -rs * 0.35, -rs * 0.35, rs * 0.7, rs * 0.7);
      }
      ctx.restore();

      const s = 170 * pulse;
      ctx.globalAlpha = env.a(g * 0.75);
      ctx.drawImage(SPR.corona, c.x - s / 2, c.y - s / 2, s, s);
      ctx.globalAlpha = env.a(g * 0.22);
      ctx.drawImage(SPR.amber, c.x - 16, c.y - 16, 32, 32);

      const gl = Math.pow(Math.max(0, Math.sin(T * 0.0025 + c.phase * 2)), 6) * g;
      if (gl > 0.02) {
        const gx = c.x - 8, gy = c.y - 9, L = 6 + 10 * gl;
        ctx.globalAlpha = env.a(gl);
        ctx.beginPath();
        ctx.moveTo(gx - L, gy); ctx.lineTo(gx + L, gy);
        ctx.moveTo(gx, gy - L); ctx.lineTo(gx, gy + L);
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.drawImage(SPR.amber, gx - 7, gy - 7, 14, 14);
      }
    }

    if (c.shock > 0) {
      const e = 1 - Math.pow(c.shock, 3);
      ctx.globalAlpha = env.a(c.shock * 0.85);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 26 + e * 120, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(253,230,138,0.9)';
      ctx.lineWidth = 3 * c.shock + 0.4;
      ctx.stroke();
      ctx.globalAlpha = env.a(c.shock * 0.5);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 26 + e * 75, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(165,243,252,0.8)';
      ctx.lineWidth = 1.5 * c.shock;
      ctx.stroke();
      const fs = 40 + 90 * c.shock;
      ctx.globalAlpha = env.a(c.shock * 0.7);
      ctx.drawImage(SPR.amber, c.x - fs / 2, c.y - fs / 2, fs, fs);
    }

    if (game.winTimer > 0 && !game.won) {
      const prog = Math.min(1, game.winTimer / WIN_HOLD_MS);
      ctx.globalAlpha = env.a(0.9);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 44, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
      ctx.strokeStyle = 'rgba(253,230,138,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
}
