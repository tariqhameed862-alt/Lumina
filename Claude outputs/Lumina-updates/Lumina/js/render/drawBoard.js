/* Micro-dot alignment grid and obsidian monoliths. */
import { W, H } from '../config.js';
import { SPR, chamferPath, smoothstep } from './assets.js';

/** Grid is pre-rendered at device resolution whenever the viewport changes. */
export function buildGrid(canvas, viewport) {
  const gw = Math.max(1, Math.ceil(W * viewport.px));
  const gh = Math.max(1, Math.ceil(H * viewport.px));
  canvas.width = gw;
  canvas.height = gh;
  const g = canvas.getContext('2d');
  g.setTransform(gw / W, 0, 0, gh / H, 0, 0);
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#ffffff';
  for (let y = 40; y < H; y += 40) {
    for (let x = 40; x < W; x += 40) {
      const d = Math.max(Math.abs(x - W / 2) / (W / 2), Math.abs(y - H / 2) / (H / 2));
      const fall = 1 - smoothstep(0.62, 1.0, d);
      if (fall <= 0.01) continue;
      const major = x % 200 === 0 && y % 200 === 0;
      g.globalAlpha = (major ? 1 : 0.55) * fall;
      g.beginPath();
      g.arc(x, y, major ? 1.7 : 1.25, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

export function drawGrid(ctx, gridCanvas, viewport, time, alpha, motion = 1) {
  const breathe = 0.055 + 0.02 * motion * Math.sin(time * 0.0011);
  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  ctx.globalAlpha = breathe * alpha;
  ctx.drawImage(gridCanvas, viewport.offX, viewport.offY, W * viewport.scale, H * viewport.scale);
  ctx.globalAlpha = 1;
}

export function drawObstacles(ctx, game, env) {
  for (const o of game.obstacles) {
    if (!o.grad) {
      o.grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      o.grad.addColorStop(0, '#18233b');
      o.grad.addColorStop(0.45, '#0F172A');
      o.grad.addColorStop(1, '#090e1a');
    }
    ctx.save();
    ctx.globalAlpha = env.a(0.9);
    ctx.drawImage(SPR.shadow, o.x - 40, o.y + o.h - 30, o.w + 80, 80);
    ctx.globalAlpha = env.a(1);
    chamferPath(ctx, o.x, o.y, o.w, o.h, 18);
    ctx.fillStyle = o.grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(o.x + 20, o.y + 1.5);
    ctx.lineTo(o.x + o.w - 20, o.y + 1.5);
    ctx.strokeStyle = 'rgba(226,232,240,0.14)';
    ctx.stroke();

    // neon laser-etched grooves
    const breathe = 0.75 + 0.25 * env.motion * Math.sin(env.time * 0.0016);
    ctx.globalCompositeOperation = 'lighter';
    if (env.highFX) {
      ctx.shadowColor = 'rgba(34,211,238,0.85)';
      ctx.shadowBlur = 10 * env.px;
    }
    ctx.globalAlpha = env.a(breathe);
    chamferPath(ctx, o.x + 10, o.y + 10, o.w - 20, o.h - 20, 11);
    ctx.strokeStyle = env.highFX ? 'rgba(34,211,238,0.6)' : 'rgba(34,211,238,0.8)';
    ctx.lineWidth = env.highFX ? 1.2 : 1.6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = env.a(0.5 * breathe);
    ctx.beginPath();
    if (o.h >= o.w) {
      const cx = o.x + o.w / 2;
      ctx.moveTo(cx, o.y + 34); ctx.lineTo(cx, o.y + o.h - 34);
      for (let yy = o.y + 60; yy < o.y + o.h - 50; yy += 40) { ctx.moveTo(cx - 8, yy); ctx.lineTo(cx + 8, yy); }
    } else {
      const cy = o.y + o.h / 2;
      ctx.moveTo(o.x + 34, cy); ctx.lineTo(o.x + o.w - 34, cy);
      for (let xx = o.x + 60; xx < o.x + o.w - 50; xx += 40) { ctx.moveTo(xx, cy - 8); ctx.lineTo(xx, cy + 8); }
    }
    ctx.strokeStyle = 'rgba(34,211,238,0.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }
}
