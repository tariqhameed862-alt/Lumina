/* Iri's speech bubble: little flame avatar + typewriter text with tiny voice blips.
   Purely presentational — js/personality/Iri.js decides what to say and when. */
import { Component } from './dom.js';
import { Motion } from '../core/Motion.js';

const AVATAR = `
<svg class="iri-flame" viewBox="0 0 48 56" aria-hidden="true">
  <defs>
    <radialGradient id="iriG" cx="50%" cy="62%" r="60%"><stop offset="0" stop-color="#FFF7D6"/><stop offset=".5" stop-color="#FBBF24"/><stop offset="1" stop-color="#F97316"/></radialGradient>
  </defs>
  <path class="body" d="M24 3c2 9 12 14 12 27 0 10-6 22-12 22S12 40 12 30C12 22 18 20 20 12c2 3 3 5 4-9z" fill="url(#iriG)"/>
  <g class="eyes"><ellipse cx="19" cy="32" rx="2.6" ry="3.2" fill="#1e1b4b"/><ellipse cx="29" cy="32" rx="2.6" ry="3.2" fill="#1e1b4b"/>
    <circle cx="19.8" cy="31" r=".9" fill="#fff"/><circle cx="29.8" cy="31" r=".9" fill="#fff"/></g>
  <g class="lids"><path d="M15.5 32h7M25.5 32h7" stroke="#1e1b4b" stroke-width="1.8" stroke-linecap="round"/></g>
  <path class="mouth m-happy" d="M19 39q5 5 10 0" stroke="#7c2d12" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <ellipse class="mouth m-panic" cx="24" cy="41" rx="3" ry="3.6" fill="#7c2d12"/>
  <path class="mouth m-sad" d="M19 42q5-4 10 0" stroke="#7c2d12" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path class="mouth m-smug" d="M19 40q6 3 10-1" stroke="#7c2d12" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path class="mouth m-proud" d="M18 38q6 8 12 0z" fill="#7c2d12"/>
  <path class="mouth m-sleepy" d="M21 40h6" stroke="#7c2d12" stroke-width="1.8" stroke-linecap="round"/>
  <circle class="blush" cx="14" cy="38" r="2.6" fill="#fb7185" opacity=".55"/><circle class="blush" cx="34" cy="38" r="2.6" fill="#fb7185" opacity=".55"/>
</svg>`;

const MOODS = ['happy', 'panic', 'sad', 'smug', 'proud', 'sleepy'];

export class IriBubble extends Component {
  constructor(app) {
    super(`
      <div class="iri" role="status" aria-live="polite" aria-hidden="true">
        <div class="iri-avatar">${AVATAR}</div>
        <div class="iri-card"><span class="iri-name">IRI</span><p class="iri-text" data-ref="text"></p></div>
      </div>`);
    this.app = app;
    this._type = 0;
    this._hideT = 0;
    // Tapping the avatar pokes her (the UI root is click-through, but the bubble opts in).
    this.$('.iri-avatar').addEventListener('click', () => { app.audio.squeak(); app.iri.poke(); });
  }

  show({ text, mood = 'happy', duration = 3000 }) {
    clearInterval(this._type);
    clearTimeout(this._hideT);
    const el = this.el;
    MOODS.forEach((m) => el.classList.remove('mood-' + m));
    el.classList.add('mood-' + (MOODS.includes(mood) ? mood : 'happy'));
    el.removeAttribute('aria-hidden');
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    this.visible = true;

    const out = this.$('[data-ref="text"]');
    if (Motion.reduced) { out.textContent = text; }
    else {
      out.textContent = '';
      let i = 0;
      this._type = setInterval(() => {
        i += 1;
        out.textContent = text.slice(0, i);
        if (i % 2 === 0 && text[i - 1] !== ' ') this.app.audio.voice(text.charCodeAt(i - 1));
        if (i >= text.length) clearInterval(this._type);
      }, 26);
    }
    this._hideT = setTimeout(() => this.hide(), duration + (Motion.reduced ? 0 : text.length * 26));
  }

  hide() {
    clearInterval(this._type);
    clearTimeout(this._hideT);
    const el = this.el;
    el.classList.remove('show');
    el.setAttribute('aria-hidden', 'true');
    this.visible = false;
  }
}
