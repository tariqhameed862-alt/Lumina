/* Pause menu: resume, restart, level select, main menu + quick sound/haptics toggles. */
import { Component, ICONS, attachRipple, pad2 } from './dom.js';

export class PauseOverlay extends Component {
  constructor(app) {
    super(`
      <section class="overlay pause" role="dialog" aria-modal="true" aria-label="Paused">
        <div class="panel">
          <p class="eyebrow" data-ref="level"></p>
          <h2 class="panel-title">Paused</h2>
          <div class="stack">
            <button class="btn btn-primary" data-act="resume">${ICONS.play}<span>Resume</span></button>
            <button class="btn btn-ghost" data-act="restart">${ICONS.restart}<span>Restart Level</span></button>
            <button class="btn btn-ghost" data-act="levels">${ICONS.grid}<span>Level Select</span></button>
            <button class="btn btn-ghost" data-act="menu">${ICONS.home}<span>Main Menu</span></button>
          </div>
          <div class="quick-toggles">
            <button class="pill" data-act="sound" aria-label="Toggle sound"></button>
            <button class="pill" data-act="haptics" aria-label="Toggle vibration">${ICONS.haptic}</button>
          </div>
          <p class="footnote">Your progress on this level is saved.</p>
        </div>
      </section>`);
    this.app = app;
    this.el.querySelectorAll('.btn').forEach(attachRipple);
    this.el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) { if (e.target === this.el) app.resume(); return; }
      app.audio.tap();
      if (act === 'resume') app.resume();
      if (act === 'restart') app.restart();
      if (act === 'levels') app.goLevels();
      if (act === 'menu') app.goMenu();
      if (act === 'sound') { app.toggleSetting('sound'); this.refresh(); }
      if (act === 'haptics') { app.toggleSetting('haptics'); this.refresh(); }
    });
    this.hide();
  }

  refresh() {
    const st = this.app.storage.settings;
    const sound = this.$('[data-act="sound"]');
    sound.innerHTML = st.sound ? ICONS.soundOn : ICONS.soundOff;
    sound.classList.toggle('muted', !st.sound);
    sound.setAttribute('aria-pressed', String(st.sound));
    const hap = this.$('[data-act="haptics"]');
    hap.classList.toggle('muted', !st.haptics);
    hap.setAttribute('aria-pressed', String(st.haptics));
  }

  show(level) {
    this.$('[data-ref="level"]').textContent = `LEVEL ${pad2(level.number)} // ${level.name.toUpperCase()}`;
    this.refresh();
    super.show();
  }
}
