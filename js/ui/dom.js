/* Tiny DOM helpers + the inline SVG icon set used across screens. */

/** Build an element from an HTML string (single root). */
export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const pad2 = (n) => String(n).padStart(2, '0');

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const svg = (body, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

export const ICONS = {
  pause: svg('<path d="M9 6v12M15 6v12"/>'),
  play: svg('<path d="M8 5.5v13l10.5-6.5z"/>'),
  restart: svg('<path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3"/><path d="M3.5 4.2v4.6h4.6"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  next: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  grid: svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
  home: svg('<path d="M4 11l8-6.5 8 6.5"/><path d="M6.5 9.5V19h11V9.5"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 6.5l2.1 1.2M17.7 16.3l2.1 1.2M4.2 17.5l2.1-1.2M17.7 7.7l2.1-1.2"/>'),
  soundOn: svg('<path d="M4 9.2v5.6h3.8L13 19V5L7.8 9.2H4z"/><path d="M16.4 8.8a4.6 4.6 0 0 1 0 6.4"/><path d="M18.9 6.3a8.2 8.2 0 0 1 0 11.4"/>'),
  soundOff: svg('<path d="M4 9.2v5.6h3.8L13 19V5L7.8 9.2H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>'),
  haptic: svg('<rect x="8" y="3.5" width="8" height="17" rx="2"/><path d="M4.5 8.5v7M19.5 8.5v7"/>'),
  lock: svg('<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  exit: svg('<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 16l-4-4 4-4M6 12h9.5"/>'),
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.9 6.4.7-4.8 4.3 1.3 6.3L12 16.9 6.4 20l1.3-6.3L2.9 9.4l6.4-.7z" fill="currentColor"/></svg>'
};

export const SIGIL = `
<svg class="sigil" viewBox="0 0 64 64" fill="none" aria-hidden="true">
  <defs><linearGradient id="sgGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBBF24"/><stop offset="1" stop-color="#22D3EE"/></linearGradient></defs>
  <path d="M32 4 L60 32 L32 60 L4 32 Z" stroke="url(#sgGrad)" stroke-width="1.2"/>
  <path d="M32 14 L50 32 L32 50 L14 32 Z" stroke="url(#sgGrad)" stroke-width="1" opacity="0.6"/>
  <path d="M32 4 V60 M4 32 H60" stroke="url(#sgGrad)" stroke-width="0.6" opacity="0.4"/>
  <circle cx="32" cy="32" r="4" fill="#FDE68A"/>
</svg>`;

/** Ripple feedback on a button. */
export function attachRipple(btn) {
  btn.addEventListener('pointerdown', (e) => {
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size / 2) + 'px';
    s.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(s);
    setTimeout(() => s.remove(), 750);
  });
}

/** Base class: a screen/overlay with an element, show/hide via the `.active` class. */
export class Component {
  constructor(html) {
    this.el = h(html);
    this.visible = false;
  }
  mount(parent) { parent.appendChild(this.el); return this; }
  $(sel) { return this.el.querySelector(sel); }
  show() {
    this.visible = true;
    this.el.classList.add('active');
    this.el.removeAttribute('aria-hidden');
    this.el.inert = false;
  }
  hide() {
    this.visible = false;
    this.el.classList.remove('active');
    this.el.setAttribute('aria-hidden', 'true');
    this.el.inert = true;
  }
}
