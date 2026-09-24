/* Level complete: animated stars, stats, and Levels / Replay / Next. */
import { Component, ICONS, SIGIL, attachRipple, pad2 } from './dom.js';

export class VictoryOverlay extends Component {
  constructor(app) {
    super(`
      <section class="overlay victory" role="dialog" aria-modal="true" aria-labelledby="vicTitle">
        <div class="card">
          ${SIGIL}
          <h2 class="badge" id="vicTitle">SANCTUARY RESTORED</h2>
          <p class="sub" data-ref="sub"></p>
          <div class="stars-row" data-ref="stars">
            <i>${ICONS.star}</i><i class="mid">${ICONS.star}</i><i>${ICONS.star}</i>
          </div>
          <div class="tags" data-ref="tags"></div>
          <div class="chips">
            <div class="chip"><span class="v" data-ref="moves">0</span><span class="k" data-ref="movesK">Moves</span></div>
            <div class="chip"><span class="v" data-ref="bounces">0</span><span class="k">Bounces</span></div>
          </div>
          <div class="victory-actions">
            <button class="icon-btn" data-act="levels" aria-label="Level select">${ICONS.grid}</button>
            <button class="icon-btn" data-act="replay" aria-label="Replay level">${ICONS.restart}</button>
            <button class="cta" data-act="next"><span data-ref="nextLabel">Next Level</span>${ICONS.next}</button>
          </div>
        </div>
      </section>`);
    this.app = app;
    this.timers = [];
    attachRipple(this.$('.cta'));
    this.el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      app.audio.tap();
      if (act === 'levels') app.goLevels();
      if (act === 'replay') app.replay();
      if (act === 'next') app.next();
    });
    this.hide();
  }

  show({ level, stars, moves, bounces, result, isLast, chapterDone, chapterTitle }) {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.$('[data-ref="sub"]').textContent = `LEVEL ${pad2(level.number)} // ${level.name.toUpperCase()}`;
    this.$('[data-ref="moves"]').textContent = moves;
    this.$('[data-ref="movesK"]').textContent = `Moves · Par ${level.par}`;
    this.$('[data-ref="bounces"]').textContent = bounces;
    this.$('[data-ref="nextLabel"]').textContent = isLast ? 'Finale' : 'Next Level';

    const tags = [];
    if (stars === 3) tags.push('<span class="tag gold">Perfect Path</span>');
    if (result.newBestMoves) tags.push('<span class="tag">New Best</span>');
    if (chapterDone) tags.push(`<span class="tag cyan">${chapterTitle} Complete</span>`);
    this.$('[data-ref="tags"]').innerHTML = tags.join('');

    const starEls = [...this.$('[data-ref="stars"]').children];
    starEls.forEach(s => s.classList.remove('on'));
    super.show();
    starEls.forEach((s, i) => {
      if (i >= stars) return;
      this.timers.push(setTimeout(() => {
        s.classList.add('on');
        this.app.audio.star(i);
        this.app.haptics.vibrate(8);
      }, 520 + i * 260));
    });
  }

  hide() {
    this.timers?.forEach(clearTimeout);
    super.hide();
  }
}
