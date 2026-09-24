/* Title screen: Continue / Levels / Settings (+ Quit inside the Android app). */
import { Component, ICONS, attachRipple, pad2, escapeHtml } from './dom.js';
import { LEVELS } from '../levels/levels.js';

export class MenuScreen extends Component {
  constructor(app) {
    super(`
      <section class="screen menu" aria-label="Main menu">
        <div class="menu-inner">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true"><i></i></div>
            <h1 class="brand-title">LUMINA</h1>
            <p class="brand-sub">LIGHT THE PATH</p>
          </div>
          <div class="menu-actions">
            <button class="btn btn-primary" data-act="play">
              <span class="btn-label" data-ref="playLabel">Begin</span>
              <span class="btn-meta" data-ref="playMeta"></span>
            </button>
            <button class="btn btn-ghost" data-act="levels">${ICONS.grid}<span>Levels</span></button>
            <button class="btn btn-ghost" data-act="settings">${ICONS.settings}<span>Settings</span></button>
            <button class="btn btn-ghost btn-quiet" data-act="quit" hidden>${ICONS.exit}<span>Quit</span></button>
          </div>
          <div class="menu-progress">
            <div class="progress-track"><i data-ref="bar"></i></div>
            <p data-ref="progress"></p>
          </div>
        </div>
      </section>`);
    this.app = app;
    this.el.querySelectorAll('.btn').forEach(attachRipple);
    this.el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      app.audio.tap();
      if (act === 'play') app.continueGame();
      if (act === 'levels') app.goLevels();
      if (act === 'settings') app.openSettings();
      if (act === 'quit') app.quit();
    });
    this.hide();
  }

  refresh() {
    const s = this.app.storage;
    const idx = this.app.continueIndex();
    const lvl = LEVELS[idx];
    const fresh = s.completedCount() === 0 && !s.getSession(idx);
    const allDone = s.completedCount() >= LEVELS.length;
    this.$('[data-ref="playLabel"]').textContent = fresh ? 'Begin' : allDone ? 'Play Again' : 'Continue';
    this.$('[data-ref="playMeta"]').textContent = `Level ${pad2(lvl.number)} · ${lvl.name}`;
    const stars = s.totalStars(), max = LEVELS.length * 3;
    this.$('[data-ref="bar"]').style.width = `${(s.completedCount() / LEVELS.length) * 100}%`;
    this.$('[data-ref="progress"]').innerHTML =
      `<span class="star-inline">${ICONS.star}</span>${stars} / ${max} · ${escapeHtml(s.completedCount())} of ${LEVELS.length} sanctuaries`;
    this.$('[data-act="quit"]').hidden = !this.app.canQuit;
  }

  show() { this.refresh(); super.show(); }
}
