/* Frame composer: clears, then draws every layer in order under the board transform. */
import { SPR, buildGradients } from './assets.js';
import { buildGrid, drawGrid, drawObstacles } from './drawBoard.js';
import { drawBeams } from './drawBeam.js';
import { drawMirrors, drawDials } from './drawMirror.js';
import { drawEmitters } from './drawEmitter.js';
import { drawCrystalBase, drawCrystals, drawCrystalGlare } from './drawCrystal.js';

export class Renderer {
  constructor(canvas, viewport) {
    this.canvas = canvas;
    this.viewport = viewport;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.grid = document.createElement('canvas');
    this.gr = buildGradients(this.ctx);
    this.sceneAlpha = 0;          // dims the board behind menus
    this.targetAlpha = 1;
    this.interacted = false;      // for the level-1 teaching pulse
    viewport.onResize(() => buildGrid(this.grid, viewport));
    buildGrid(this.grid, viewport);
  }

  /** Fade the whole board (e.g. 0.45 behind the menu, 1 while playing). */
  setSceneAlpha(a) { this.targetAlpha = a; }

  render(game, dt) {
    const { ctx, viewport: vp } = this;
    this.sceneAlpha += (this.targetAlpha - this.sceneAlpha) * (1 - Math.pow(0.9, dt / 16.667));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const fade = game.intro * this.sceneAlpha;
    drawGrid(ctx, this.grid, vp, game.time, Math.max(fade, 0.6 * this.sceneAlpha));
    if (!game.active) return;

    const px = vp.px;
    ctx.setTransform(px, 0, 0, px, vp.offX * vp.dpr, vp.offY * vp.dpr);
    const env = { px, time: game.time, gr: this.gr, interacted: this.interacted, a: (v) => v * fade };

    drawObstacles(ctx, game, env);
    drawCrystalBase(ctx, game, env);
    drawBeams(ctx, game, env);
    drawCrystals(ctx, game, env);
    drawMirrors(ctx, game, env);
    drawEmitters(ctx, game, env);
    drawCrystalGlare(ctx, game, env);
    this._particles(game, env);
    drawDials(ctx, game, env);
    ctx.globalAlpha = 1;
  }

  _particles(game, env) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of game.particles.pool) {
      if (!p.active) continue;
      const t = 1 - p.life / p.max;
      ctx.globalAlpha = env.a(Math.sin(Math.PI * t) * 0.9);
      ctx.drawImage(SPR.amber, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }
}
