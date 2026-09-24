/* In-game overlay: pause, level title, move counter, restart, hint and the level intro card. */
import { Component, ICONS, pad2, escapeHtml } from './dom.js';

export class HUD extends Component {
  constructor(app) {
    super(`
      <section class="screen hud" aria-label="Game">
        <header class="hud-top">
          <div class="hud-left">
            <button class="pill" data-act="pause" aria-label="Pause">${ICONS.pause}</button>
            <div class="level-info" data-ref="info">
              <span class="level-label" data-ref="label"></span>
              <span class="level-moves" data-ref="moves"></span>
            </div>
          </div>
          <button class="pill" data-act="restart" aria-label="Restart level">${ICONS.restart}</button>
        </header>
        <div class="level-card" data-ref="card" aria-hidden="true">
          <span class="card-chapter" data-ref="cardChapter"></span>
          <span class="card-num" data-ref="cardNum"></span>
          <span class="card-name" data-ref="cardName"></span>
        </div>
        <div class="hint gone" data-ref="hint"><span data-ref="hintText"></span></div>
      </section>`);
    this.app = app;
    this.level = null;
    this._cardTimer = 0;
    this.el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      app.audio.tap();
      if (act === 'pause') app.pause();
      if (act === 'restart') app.restart();
    });
    this.hide();
  }

  setLevel(level, chapterTitle, moves, { intro = true } = {}) {
    this.level = level;
    const info = this.$('[data-ref="info"]');
    info.classList.add('swap');
    setTimeout(() => {
      this.$('[data-ref="label"]').textContent = `LEVEL ${pad2(level.number)} // ${level.name.toUpperCase()}`;
      this.setMoves(moves);
      info.classList.remove('swap');
    }, 200);

    const hint = this.$('[data-ref="hint"]');
    if (level.hint) {
      this.$('[data-ref="hintText"]').textContent = level.hint;
      hint.classList.remove('gone');
    } else {
      hint.classList.add('gone');
    }

    const card = this.$('[data-ref="card"]');
    clearTimeout(this._cardTimer);
    card.classList.remove('show');
    if (intro) {
      this.$('[data-ref="cardChapter"]').textContent = chapterTitle;
      this.$('[data-ref="cardNum"]').textContent = pad2(level.number);
      this.$('[data-ref="cardName"]').innerHTML = escapeHtml(level.name);
      void card.offsetWidth;
      card.classList.add('show');
      this._cardTimer = setTimeout(() => card.classList.remove('show'), 1500);
    }
  }

  setMoves(moves) {
    if (!this.level) return;
    const over = moves > this.level.par;
    const el = this.$('[data-ref="moves"]');
    el.textContent = `MOVES ${moves} · PAR ${this.level.par}`;
    el.classList.toggle('over', over);
  }

  dismissHint() { this.$('[data-ref="hint"]').classList.add('gone'); }
}
