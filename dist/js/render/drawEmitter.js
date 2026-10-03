/* Brushed-platinum "light forge" emitter: chamfered housing, focusing iris, breathing aperture. */
import { SPR, roundRectPath, chamferPath } from './assets.js';
import { drawEmitterEyes } from './drawFaces.js';

export function drawEmitters(ctx, game, env) {
  for (let i = 0; i < game.emitters.length; i++) drawEmitter(ctx, game.emitters[i], env, i, game);
}

function drawEmitter(ctx, e, env, i, game) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.globalAlpha = env.a(0.7);
  ctx.drawImage(SPR.shadow, -46, 10, 92, 30);
  ctx.globalAlpha = env.a(1);
  ctx.translate(0, -Math.max(0, e.bounce) * 28);          // happy hop when Iri speaks (spring in Game.update)
  const angle = Math.atan2(e.dy, e.dx);
  ctx.rotate(angle);

  const pulse = 0.5 + 0.5 * env.motion * Math.sin(env.time * 0.004 + i * 1.7);

  // Outward "heartbeat" ring — the forge breathing, reads as alive even before it fires.
  if (env.highFX) {
    const ringT = (env.time * 0.00055 + i * 0.37) % 1;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = env.a((1 - ringT) * 0.28 * env.motion);
    ctx.beginPath();
    ctx.arc(30, 0, 6 + ringT * 26, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(165,243,252,0.9)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = env.a(1);
  }

  // Chamfered housing (faceted, not a flat pill) for a forged/machined feel.
  chamferPath(ctx, -30, -15, 56, 30, 6);
  ctx.fillStyle = env.gr.emitter;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.lineWidth = 0.5;
  for (let y = -13.5, k = 0; y < 15; y += 1.8, k++) {
    ctx.beginPath();
    ctx.moveTo(-30, y);
    ctx.lineTo(26, y + 0.3);
    ctx.strokeStyle = k % 2 ? 'rgba(255,255,255,0.13)' : 'rgba(15,23,42,0.09)';
    ctx.stroke();
  }
  // top rim specular
  const rim = ctx.createLinearGradient(0, -15, 0, -6);
  rim.addColorStop(0, 'rgba(255,255,255,0.5)');
  rim.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rim;
  ctx.fillRect(-30, -15, 56, 9);
  ctx.restore();
  chamferPath(ctx, -30, -15, 56, 30, 6);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-11, -15); ctx.lineTo(-11, 15);
  ctx.strokeStyle = 'rgba(15,23,42,0.4)';
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-9.8, -15); ctx.lineTo(-9.8, 15);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Focusing iris (three-leaf aperture ring) in place of the old plain rivet.
  ctx.save();
  ctx.translate(-21, 0);
  ctx.beginPath();
  ctx.arc(0, 0, 4.4, 0, Math.PI * 2);
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.rotate(env.time * 0.0007);
  ctx.strokeStyle = 'rgba(165,243,252,0.55)';
  ctx.lineWidth = 0.7;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, (k * 2 * Math.PI) / 3, (k * 2 * Math.PI) / 3 + 1.7);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#CFFAFE';
  ctx.fill();
  ctx.restore();

  roundRectPath(ctx, 21, -10, 11, 20, 3.5);
  ctx.fillStyle = '#1E293B';
  ctx.fill();
  ctx.strokeStyle = 'rgba(226,232,240,0.65)';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Aperture nozzle: layered rings that iris slightly open/closed with the pulse.
  ctx.globalCompositeOperation = 'lighter';
  const gs = 44 + pulse * 20;
  ctx.globalAlpha = env.a(0.5 + pulse * 0.32);
  ctx.drawImage(SPR.cyan, 31 - gs / 2, -gs / 2, gs, gs);
  ctx.globalAlpha = env.a(1);
  ctx.globalCompositeOperation = 'source-over';

  const or = 6.5 + pulse * 0.6;
  ctx.beginPath();
  ctx.arc(31, 0, or, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(165,243,252,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(31, 0, or - 2.4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(240,253,250,0.6)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  const ps = 5.5 * (1 + 0.14 * pulse);
  ctx.beginPath();
  ctx.moveTo(31 - ps, 0);
  ctx.lineTo(31, -ps);
  ctx.lineTo(31 + ps, 0);
  ctx.lineTo(31, ps);
  ctx.closePath();
  ctx.fillStyle = '#F0FDFA';
  ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = env.a(0.8);
  ctx.beginPath();
  ctx.arc(31, 0, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = env.a(1);
  if (!game.demo) drawEmitterEyes(ctx, e, game, env, angle);
  ctx.restore();
}
