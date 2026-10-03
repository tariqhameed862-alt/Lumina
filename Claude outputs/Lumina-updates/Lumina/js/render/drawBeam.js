/* Light beam: double-pass bloom, bright core, flowing energy, reflection flashes, impact rings. */
import { SPR } from './assets.js';

export function drawBeams(ctx, game, env) {
  const h = game.harmony;
  const rgb = `${Math.round(34 + 26 * h)},${Math.round(211 + 31 * h)},${Math.round(238 - 52 * h)}`;
  for (const beam of game.beams) drawBeam(ctx, beam, rgb, h, env);
}

function drawBeam(ctx, beam, rgb, h, env) {
  const p = beam.pts;
  if (p.length < 4) return;
  ctx.save();
  ctx.globalAlpha = env.a(1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);

  ctx.globalCompositeOperation = 'lighter';
  if (env.highFX) {
    // shadowBlur is the single most expensive thing this renderer does — it's
    // real cost on budget Android WebViews, so the low-FX path skips it entirely
    // and leans on a wider, softer flat stroke instead.
    ctx.shadowColor = `rgba(${rgb},0.45)`;
    ctx.shadowBlur = 22 * env.px;
    ctx.strokeStyle = `rgba(${rgb},0.14)`;
    ctx.lineWidth = 13;
    ctx.stroke();
    ctx.shadowBlur = 14 * env.px;
    ctx.strokeStyle = `rgba(${rgb},0.45)`;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  } else {
    ctx.strokeStyle = `rgba(${rgb},0.22)`;
    ctx.lineWidth = 15;
    ctx.stroke();
    ctx.strokeStyle = `rgba(${rgb},0.5)`;
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = h > 0.5 ? '#F0FDF9' : '#F0FDFA';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.globalCompositeOperation = 'lighter';
  ctx.setLineDash([3, 30]);
  ctx.lineDashOffset = -env.time * 0.1 * env.motion;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 2; i < p.length - 2; i += 2) {
    const f = 26 + 4 * env.motion * Math.sin(env.time * 0.006 + i);
    ctx.globalAlpha = env.a(0.9);
    ctx.drawImage(SPR.cyan, p[i] - f / 2, p[i + 1] - f / 2, f, f);
  }
  ctx.globalAlpha = env.a(0.7);
  ctx.drawImage(SPR.cyan, p[0] - 18, p[1] - 18, 36, 36);

  if (beam.endType === 'obstacle' || beam.endType === 'absorbed') {
    for (let k = 0; k < 2; k++) {
      const ph = ((env.time + k * 550) % 1100) / 1100;
      ctx.globalAlpha = env.a((1 - ph) * 0.65);
      ctx.beginPath();
      ctx.arc(beam.ex, beam.ey, 4 + ph * 24, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgb},0.9)`;
      ctx.lineWidth = 1.4 * (1 - ph) + 0.3;
      ctx.stroke();
    }
    ctx.globalAlpha = env.a(0.9);
    ctx.drawImage(SPR.cyan, beam.ex - 16, beam.ey - 16, 32, 32);
  }
  ctx.restore();
}
