/* Sapphire mirrors (rotatable), gilded mirrors (fixed) and the rotation dial. */
import { MIRROR_HALF, MIRROR_HALF_W, HIT_RADIUS, SNAP_STEP, SNAP_THRESHOLD } from '../config.js';
import { SPR, roundRectPath } from './assets.js';
export { drawMirrorEyes } from './drawFaces.js';

export function drawMirrors(ctx, game, env) {
  const teach = game.level?.index === 0 && !env.interacted;
  for (const m of game.mirrors) {
    const active = m.dragId !== null;
    ctx.save();
    ctx.translate(m.x, m.y);

    if (!m.fixed && !game.demo) {
      const zone = teach ? 0.05 + 0.04 * Math.sin(env.time * 0.004) : 0.025;
      ctx.globalAlpha = env.a(m.hover ? 0.09 : zone);
      ctx.beginPath();
      ctx.arc(0, 0, HIT_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.globalAlpha = env.a(0.55);
    ctx.drawImage(SPR.shadow, -48, 14, 96, 26);
    ctx.rotate(m.angle);
    ctx.scale(1 - 0.22 * m.sq, 1 + 0.9 * m.sq);      // squash & stretch on snap (spring in mirrorPhysics.js)
    ctx.globalAlpha = env.a(1);

    if (active || m.hover || m.pulse > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = env.a(active ? 0.55 : m.hover ? 0.3 : m.pulse * 0.7);
      roundRectPath(ctx, -MIRROR_HALF - 3, -MIRROR_HALF_W - 3, MIRROR_HALF * 2 + 6, MIRROR_HALF_W * 2 + 6, 7);
      ctx.strokeStyle = 'rgba(34,211,238,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    roundRectPath(ctx, -MIRROR_HALF, -MIRROR_HALF_W, MIRROR_HALF * 2, MIRROR_HALF_W * 2, 4.5);
    ctx.fillStyle = m.fixed ? env.gr.fixedFill : env.gr.mirrorFill;
    ctx.fill();
    ctx.strokeStyle = m.fixed ? env.gr.fixedBorder : env.gr.mirrorBorder;
    ctx.lineWidth = m.fixed ? 1.8 : 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-MIRROR_HALF + 5, -MIRROR_HALF_W + 2.3);
    ctx.lineTo(MIRROR_HALF - 5, -MIRROR_HALF_W + 2.3);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-MIRROR_HALF + 6, MIRROR_HALF_W - 2);
    ctx.lineTo(MIRROR_HALF - 6, MIRROR_HALF_W - 2);
    ctx.strokeStyle = 'rgba(15,23,42,0.5)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-MIRROR_HALF + 3, 0);
    ctx.lineTo(MIRROR_HALF - 3, 0);
    ctx.strokeStyle = m.fixed ? 'rgba(254,243,199,0.5)' : 'rgba(224,242,254,0.45)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    if (m.fixed) {
      // bolted ends: this mirror cannot turn
      for (const bx of [-MIRROR_HALF + 7, MIRROR_HALF - 7]) {
        ctx.beginPath();
        ctx.arc(bx, 0, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = '#78350F';
        ctx.fill();
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.rect(-3, -3, 6, 6);
      ctx.fillStyle = '#FBBF24';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = '#0F172A';
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawDials(ctx, game, env) {
  for (const m of game.mirrors) {
    if (m.dial < 0.01) continue;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.globalAlpha = env.a(m.dial);

    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(34,211,238,0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const t = i * SNAP_STEP;
      const len = i % 6 === 0 ? 9 : i % 2 === 0 ? 6 : 4;
      const c = Math.cos(t), s = Math.sin(t);
      ctx.moveTo(c * 67, s * 67);
      ctx.lineTo(c * (67 + len), s * (67 + len));
    }
    ctx.strokeStyle = 'rgba(34,211,238,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const nearest = Math.round(m.angle / SNAP_STEP) * SNAP_STEP;
    const inZone = Math.abs(m.angle - nearest) <= SNAP_THRESHOLD;
    ctx.beginPath();
    for (const t of [m.angle, m.angle + Math.PI]) {
      const c = Math.cos(t), s = Math.sin(t);
      ctx.moveTo(c * 60, s * 60);
      ctx.lineTo(c * 78, s * 78);
    }
    ctx.strokeStyle = inZone ? 'rgba(253,230,138,0.9)' : 'rgba(165,243,252,0.6)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    const nc = Math.cos(m.needle), ns = Math.sin(m.needle);
    const grad = ctx.createLinearGradient(nc * 10, ns * 10, nc * 86, ns * 86);
    grad.addColorStop(0, 'rgba(34,211,238,0)');
    grad.addColorStop(1, 'rgba(165,243,252,0.95)');
    ctx.beginPath();
    ctx.moveTo(nc * 10, ns * 10);
    ctx.lineTo(nc * 86, ns * 86);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.drawImage(SPR.cyan, nc * 86 - 11, ns * 86 - 11, 22, 22);
    ctx.restore();
  }
}
