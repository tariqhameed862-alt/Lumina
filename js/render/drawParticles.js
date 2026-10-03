/* Draws the particle pool: additive amber sparks + tumbling paper confetti in the chapter's palette. */
import { SPR } from './assets.js';
import { KIND } from '../game/Particles.js';

export function drawParticles(ctx, game, env) {
  const pal = game.theme.confetti;
  ctx.save();
  // Sparks first (additive), then confetti (normal blend) so paper reads as solid.
  ctx.globalCompositeOperation = 'lighter';
  for (const p of game.particles.pool) {
    if (!p.active || p.kind !== KIND.SPARK) continue;
    const t = 1 - p.life / p.max;
    ctx.globalAlpha = env.a(Math.sin(Math.PI * t) * 0.9);
    ctx.drawImage(SPR.amber, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const p of game.particles.pool) {
    if (!p.active || p.kind !== KIND.CONFETTI) continue;
    const fade = Math.min(1, p.life / 500);
    ctx.globalAlpha = env.a(fade);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    // flutter: width oscillates as the paper flips in the air
    const flip = Math.abs(Math.cos(p.rot * 2.3));
    ctx.fillStyle = pal[p.color % pal.length];
    ctx.fillRect(-p.size / 2, -p.size * 0.28, p.size, p.size * 0.56 * (0.25 + 0.75 * flip));
    ctx.restore();
  }
  ctx.restore();
}
