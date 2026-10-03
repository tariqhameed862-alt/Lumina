/* Full-screen narrative beat: chapter intros/outros, played between levels.
   A short paged "visual novel" textbox in the same glass-panel language as the
   other overlays — speaker tag, one paragraph at a time, dot progress, skip. */
import { Component, ICONS, SIGIL, attachRipple } from './dom.js';

export class StoryOverlay extends Component {
  constructor(app) {
    super(`
      <section class="overlay story" role="dialog" aria-modal="true" aria-label="Story">
        <div class="panel story-panel">
          <button class="pill panel-close" data-act="skip" aria-label="Skip">${ICONS.close}</button>
          ${SIGIL}
          <p class="eyebrow story-speaker" data-ref="speaker"></p>
          <p class="story-text" data-ref="text"></p>
          <div class="story-dots" data-ref="dots"></div>
          <button class="btn btn-primary row" data-act="next">
            <span data-ref="cta">Continue</span>${ICONS.next}
          </button>
        </div>
      </section>`);
    this.app = app;
    this.pages = [];
    this.page = 0;
    this.cta = 'Continue';
    this.onDone = null;
    attachRipple(this.$('.btn'));
    this.el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      app.audio.tap();
      if (act === 'next') this._advance();
      if (act === 'skip') this._finish();
    });
    this.hide();
  }

  /** Shows `beat` ({ speaker, pages, cta }) page by page, then calls `onDone` once
   *  the player continues past the last page or taps skip. */
  play(beat, onDone) {
    this.pages = beat.pages;
    this.page = 0;
    this.cta = beat.cta || 'Continue';
    this.onDone = onDone;
    this.$('[data-ref="speaker"]').textContent = beat.speaker;
    this._renderDots();
    this._renderPage();
    super.show();
  }

  _renderDots() {
    this.$('[data-ref="dots"]').innerHTML = this.pages.map(() => '<i></i>').join('');
  }

  _renderPage() {
    const text = this.$('[data-ref="text"]');
    text.classList.remove('in');
    void text.offsetWidth;
    text.textContent = this.pages[this.page];
    text.classList.add('in');
    const last = this.page === this.pages.length - 1;
    this.$('[data-ref="cta"]').textContent = last ? this.cta : 'Continue';
    [...this.$('[data-ref="dots"]').children].forEach((d, i) => d.classList.toggle('on', i === this.page));
  }

  /** Public equivalent of tapping the skip button — used by App.back() so Escape /
   *  the Android back button always resolves a pending story beat instead of
   *  leaving its onDone callback (and whatever it was gating) stuck forever. */
  skip() { this._finish(); }

  _advance() {
    if (this.page < this.pages.length - 1) { this.page++; this._renderPage(); }
    else this._finish();
  }

  _finish() {
    super.hide();
    const cb = this.onDone;
    this.onDone = null;
    cb?.();
  }
}
