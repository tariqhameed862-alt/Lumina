/* Chapter tabs + level grid with stars, locks and the "play next" highlight. */
import { Component, ICONS, pad2, escapeHtml } from './dom.js';
import { CHAPTERS, LEVELS } from '../levels/index.js';

export class LevelSelectScreen extends Component {
  constructor(app) {
    super(`
      <section class="screen levels" aria-label="Level select">
        <header class="screen-head">
          <button class="pill" data-act="back" aria-label="Back to menu">${ICONS.back}</button>
          <div class="head-title">
            <h2>Sanctuaries</h2>
            <p data-ref="total"></p>
          </div>
          <span class="pill-spacer"></span>
        </header>
        <nav class="chapter-tabs" role="tablist" data-ref="tabs"></nav>
        <div class="chapter-intro" data-ref="intro"></div>
        <div class="level-scroll"><div class="level-grid" data-ref="grid"></div></div>
      </section>`);
    this.app = app;
    this.chapter = 0;
    this.el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act]');
      if (!t) return;
      const act = t.dataset.act;
      if (act === 'back') { app.audio.tap(); app.goMenu(); }
      if (act === 'tab') { app.audio.tap(); this.chapter = +t.dataset.ch; this.render(); }
      if (act === 'level') {
        const i = +t.dataset.i;
        if (!app.storage.isUnlocked(i)) {
          t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake');
          app.haptics.vibrate(15);
          return;
        }
        app.audio.tap();
        app.startLevel(i, { resume: true });
      }
    });
    this.hide();
  }

  render() {
    const s = this.app.storage;
    const next = s.nextToPlay();
    this.$('[data-ref="total"]').innerHTML =
      `<span class="star-inline">${ICONS.star}</span>${s.totalStars()} / ${LEVELS.length * 3}`;

    this.$('[data-ref="tabs"]').innerHTML = CHAPTERS.map((ch, ci) => {
      const lv = LEVELS.filter(l => l.chapter === ci);
      const stars = lv.reduce((a, l) => a + s.stars(l.index), 0);
      const locked = !s.isUnlocked(lv[0].index);
      return `<button class="chapter-tab ${ci === this.chapter ? 'on' : ''} ${locked ? 'locked' : ''}" role="tab"
                aria-selected="${ci === this.chapter}" data-act="tab" data-ch="${ci}">
                <span class="tab-num">${['I', 'II', 'III', 'IV', 'V'][ci] || ci + 1}</span>
                <span class="tab-name">${escapeHtml(ch.title)}</span>
                <span class="tab-stars">${locked ? ICONS.lock : `${stars}/${lv.length * 3}`}</span>
              </button>`;
    }).join('');

    const ch = CHAPTERS[this.chapter];
    this.$('[data-ref="intro"]').innerHTML =
      `<span class="intro-title">${escapeHtml(ch.title)}</span><span class="intro-sub">${escapeHtml(ch.subtitle)}</span>`;

    this.$('[data-ref="grid"]').innerHTML = LEVELS.filter(l => l.chapter === this.chapter).map((l) => {
      const unlocked = s.isUnlocked(l.index);
      const stars = s.stars(l.index);
      const isNext = l.index === next && !s.isCompleted(l.index);
      const resumable = !!s.getSession(l.index);
      const starRow = [0, 1, 2].map(k => `<i class="${k < stars ? 'on' : ''}">${ICONS.star}</i>`).join('');
      return `<button class="level-tile ${unlocked ? '' : 'locked'} ${isNext ? 'next' : ''} ${stars ? 'done' : ''}"
                data-act="level" data-i="${l.index}" aria-label="Level ${l.number} ${escapeHtml(l.name)}${unlocked ? '' : ' (locked)'}">
                ${unlocked
                  ? `<span class="tile-num">${pad2(l.number)}</span>
                     <span class="tile-name">${escapeHtml(l.name)}</span>
                     <span class="tile-stars">${starRow}</span>
                     ${resumable ? '<span class="tile-badge">Resume</span>' : ''}`
                  : `<span class="tile-lock">${ICONS.lock}</span><span class="tile-num dim">${pad2(l.number)}</span>`}
              </button>`;
    }).join('');
  }

  /** Opens on the chapter holding the next level to play unless one is given. */
  show(chapter) {
    this.chapter = chapter ?? LEVELS[this.app.storage.nextToPlay()].chapter;
    this.render();
    super.show();
  }
}
