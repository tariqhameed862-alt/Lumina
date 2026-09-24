/* Brushed-platinum emitter with a pulsating core prism. */
import { SPR, roundRectPath } from './assets.js';

export function drawEmitters(ctx, game, env) {
  for (let i = 0; i < game.emitters.length; i++) drawEmitter(ctx, game.emitters[i], env, i);
}

function drawEmitter(ctx, e, env, i) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.globalAlpha = env.a(0.7);
  ctx.drawImage(SPR.shadow, -46, 10, 92, 30);
  ctx.globalAlpha = env.a(1);
  ctx.rotate(Math.atan2(e.dy, e.dx));

  roundRectPath(ctx, -30, -15, 56, 30, 9);
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
  ctx.restore();
  roundRectPath(ctx, -30, -15, 56, 30, 9);
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
  ctx.beginPath();
  ctx.arc(-21, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#64748B';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  roundRectPath(ctx, 22, -9, 10, 18, 3);
  ctx.fillStyle = '#1E293B';
  ctx.fill();
  ctx.strokeStyle = 'rgba(226,232,240,0.65)';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  const pulse = 0.5 + 0.5 * Math.sin(env.time * 0.004 + i * 1.7);
  ctx.globalCompositeOperation = 'lighter';
  const gs = 40 + pulse * 18;
  ctx.globalAlpha = env.a(0.55 + pulse * 0.35);
  ctx.drawImage(SPR.cyan, 30 - gs / 2, -gs / 2, gs, gs);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = env.a(1);
  const ps = 5.5 * (1 + 0.14 * pulse);
  ctx.beginPath();
  ctx.moveTo(30 - ps, 0);
  ctx.lineTo(30, -ps);
  ctx.lineTo(30 + ps, 0);
  ctx.lineTo(30, ps);
  ctx.closePath();
  ctx.fillStyle = '#F0FDFA';
  ctx.fill();
  ctx.restore();
}
