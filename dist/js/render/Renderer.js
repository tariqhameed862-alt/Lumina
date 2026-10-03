/* Frame composer: clears, then draws every layer in order under the board transform.
   Layers back→front:  grid · dust motes · obsidian · crystal sigils/snores · beams · crystals+faces ·
   mirrors · mirror eyes · emitters · glare · particles · dials · win flash.   Each lives in its own draw*.js. */
import { W, H } from '../config.js';
import { SPR, buildGradients } from './assets.js';
import { buildGrid, drawGrid, drawObstacles } from './drawBoard.js';
import { drawAmbient } from './drawAmbient.js';
import { drawBeams } from './drawBeam.js';
import { drawMirrors, drawDials, drawMirrorEyes } from './drawMirror.js';
import { drawEmitters } from './drawEmitter.js';
import { drawCrystalBase, drawCrystals, drawCrystalGlare } from './drawCrystal.js';
import { drawParticles } from './drawParticles.js';
import { applyThemeToDom } from './themes.js';
import { Motion } from '../core/Motion.js';

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
    this.highFX = true;           // set via setQuality(); gates shadowBlur / extra glow layers
    this._theme = null;
    viewport.onResize(() => buildGrid(this.grid, viewport));
    buildGrid(this.grid, viewport);
  }

  /** Fade the whole board (e.g. 0.45 behind the menu, 1 while playing). */
  setSceneAlpha(a) { this.targetAlpha = a; }

  /** 'high' | 'low' — see js/core/Quality.js. */
  setQuality(level) { this.highFX = level !== 'low'; }

  render(game, dt) {
    const { ctx, viewport: vp } = this;
    if (game.theme !== this._theme) { this._theme = game.theme; applyThemeToDom(game.theme); }
    this.sceneAlpha += (this.targetAlpha - this.sceneAlpha) * (1 - Math.pow(0.9, dt / 16.667));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const fade = game.intro * this.sceneAlpha;
    const motion = Motion.reduced ? 0 : 1;
    drawGrid(ctx, this.grid, vp, game.time, Math.max(fade, 0.6 * this.sceneAlpha), motion);
    if (!game.active) return;

    const px = vp.px;
    ctx.setTransform(px, 0, 0, px, vp.offX * vp.dpr, vp.offY * vp.dpr);
    const env = {
      px, time: game.time, gr: this.gr, interacted: this.interacted, a: (v) => v * fade,
      highFX: this.highFX, motion, theme: game.theme, bounds: vp.bounds
    };

    // Ambient motes sit still on the un-shaken plane (a cheap parallax against the shaking board).
    drawAmbient(ctx, env);

    const sh = game.shake;
    if (sh.trauma > 0.001) {
      ctx.translate(W / 2 + sh.x, H / 2 + sh.y);
      ctx.rotate(sh.rot);
      ctx.translate(-W / 2, -H / 2);
    }

    drawObstacles(ctx, game, env);
    drawCrystalBase(ctx, game, env);
    drawBeams(ctx, game, env);
    drawCrystals(ctx, game, env);
    drawMirrors(ctx, game, env);
    drawMirrorEyes(ctx, game, env);
    drawEmitters(ctx, game, env);
    drawCrystalGlare(ctx, game, env);
    drawParticles(ctx, game, env);
    drawDials(ctx, game, env);
    ctx.globalAlpha = 1;

    if (game.flash > 0.01) this._flash(game, vp);
  }

  /** Brief additive burst of the chapter's accent colour over the whole screen on victory. */
  _flash(game, vp) {
    const { ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1;
    const cx = this.canvas.width / 2, cy = this.canvas.height * 0.46;
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cx, cy) * 1.3);
    const f = game.flash * game.flash;
    gr.addColorStop(0, `rgba(${game.theme.accent},${0.42 * f})`);
    gr.addColorStop(1, `rgba(${game.theme.accent},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }
}
