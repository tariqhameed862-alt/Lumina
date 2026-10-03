/* Settings: sound, vibration, graphics quality, reset progress (tap twice to confirm). */
import { Component, ICONS } from './dom.js';
import { resolveQuality } from '../core/Quality.js';

export class SettingsOverlay extends Component {
  constructor(app) {
    super(`
      <section class="overlay settings" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="panel">
          <button class="pill panel-close" data-act="close" aria-label="Close settings">${ICONS.close}</button>
          <h2 class="panel-title">Settings</h2>
          <div class="setting-list">
            <label class="setting">
              <span class="setting-icon">${ICONS.soundOn}</span>
              <span class="setting-text"><b>Sound</b><small>Chimes, clicks and music</small></span>
              <input type="checkbox" class="toggle" data-setting="sound">
            </label>
            <label class="setting">
              <span class="setting-icon">${ICONS.haptic}</span>
              <span class="setting-text"><b>Vibration</b><small>Haptic taps on snap and win</small></span>
              <input type="checkbox" class="toggle" data-setting="haptics">
            </label>
            <label class="setting">
              <span class="setting-icon">${ICONS.fx}</span>
              <span class="setting-text"><b>High-detail effects</b><small>Extra glow &amp; bloom — turn off on older phones</small></span>
              <input type="checkbox" class="toggle" data-setting="quality">
            </label>
          </div>
          <button class="btn btn-danger" data-act="reset"><span data-ref="resetLabel">Reset Progress</span></button>
          <p class="footnote">Lumina · Light the Path · v1.0</p>
        </div>
      </section>`);
    this.app = app;
    this.confirming = false;
    this.el.addEventListener('change', (e) => {
      const key = e.target.dataset.setting;
      if (!key) return;
      // Sound/haptics are plain booleans; quality is stored as 'high'|'low' (the
      // toggle just pins whatever 'auto' would otherwise have picked).
      const value = key === 'quality' ? (e.target.checked ? 'high' : 'low') : e.target.checked;
      app.toggleSetting(key, value);
      app.audio.tap();
    });
    this.el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) { if (e.target === this.el) app.closeSettings(); return; }
      if (act === 'close') { app.audio.tap(); app.closeSettings(); }
      if (act === 'reset') this._reset();
    });
    this.hide();
  }

  _reset() {
    const label = this.$('[data-ref="resetLabel"]');
    if (!this.confirming) {
      this.confirming = true;
      label.textContent = 'Tap again to erase all progress';
      this.$('[data-act="reset"]').classList.add('armed');
      clearTimeout(this._t);
      this._t = setTimeout(() => this._disarm(), 3500);
      return;
    }
    this._disarm();
    this.app.resetProgress();
    label.textContent = 'Progress erased';
    setTimeout(() => { if (!this.confirming) label.textContent = 'Reset Progress'; }, 1600);
  }

  _disarm() {
    this.confirming = false;
    this.$('[data-ref="resetLabel"]').textContent = 'Reset Progress';
    this.$('[data-act="reset"]').classList.remove('armed');
  }

  show() {
    const st = this.app.storage.settings;
    this.$('[data-setting="sound"]').checked = st.sound;
    this.$('[data-setting="haptics"]').checked = st.haptics;
    this.$('[data-setting="quality"]').checked = resolveQuality(st.quality) !== 'low';
    this._disarm();
    super.show();
  }
}
