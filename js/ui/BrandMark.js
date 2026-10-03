/* The Lumina emblem: a faceted crystal lantern with Iri's flame asleep... well, awake, inside it.
   A cyan beam strikes it from the left and leaves as warm gold on the right (the game in one picture).
   Built from maths rather than hand-typed points so the facets stay exact at any size.
   `brandMarkSvg({ animated })` -> inline <svg> string (the menu uses animated; tools/make-icons.mjs uses static). */

const C = 64;                                            // viewBox centre
const pt = (r, deg) => [C + r * Math.cos(deg * Math.PI / 180), C + r * Math.sin(deg * Math.PI / 180)];
const f = (n) => Math.round(n * 100) / 100;
const str = (p) => `${f(p[0])},${f(p[1])}`;

const OUTER = Array.from({ length: 8 }, (_, k) => pt(45, 22.5 + k * 45));
const INNER = Array.from({ length: 8 }, (_, k) => pt(22, 22.5 + k * 45));

function facets() {
  let out = '';
  for (let k = 0; k < 8; k++) {
    const k2 = (k + 1) % 8;
    const mid = 22.5 + (k + 0.5) * 45;                  // light comes from the upper-left
    const b = 0.5 + 0.5 * Math.cos((mid - 225) * Math.PI / 180);
    out += `<polygon class="bm-facet" style="--d:${k}" points="${str(OUTER[k])} ${str(OUTER[k2])} ${str(INNER[k2])} ${str(INNER[k])}" fill="rgba(186,230,253,${f(0.05 + 0.26 * b)})" stroke="rgba(253,230,138,.5)" stroke-width=".8" stroke-linejoin="round"/>`;
  }
  return out;
}

function rays() {
  let out = '';
  for (let k = 0; k < 24; k++) {
    const long = k % 3 === 0;
    const a = pt(long ? 52 : 54, k * 15), b = pt(long ? 61 : 58, k * 15);
    out += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${long ? '#FDE68A' : '#67E8F9'}" stroke-opacity="${long ? .9 : .5}" stroke-width="${long ? 1.6 : 1}" stroke-linecap="round"/>`;
  }
  return out;
}

export function brandMarkSvg({ animated = true, uid = 'bm', rays: withRays = true } = {}) {
  const cls = (c) => (animated ? ` class="${c}"` : '');
  return `
<svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lumina emblem">
  <defs>
    <radialGradient id="${uid}Glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FBBF24" stop-opacity=".55"/><stop offset=".55" stop-color="#F59E0B" stop-opacity=".12"/><stop offset="1" stop-color="#F59E0B" stop-opacity="0"/></radialGradient>
    <radialGradient id="${uid}Flame" cx="50%" cy="64%" r="62%"><stop offset="0" stop-color="#FFFBEB"/><stop offset=".45" stop-color="#FCD34D"/><stop offset="1" stop-color="#F97316"/></radialGradient>
    <linearGradient id="${uid}Glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e3a5f" stop-opacity=".95"/><stop offset="1" stop-color="#0b1426" stop-opacity=".95"/></linearGradient>
    <linearGradient id="${uid}Rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#22D3EE"/></linearGradient>
    <linearGradient id="${uid}BeamIn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22D3EE" stop-opacity="0"/><stop offset="1" stop-color="#CFFAFE"/></linearGradient>
    <linearGradient id="${uid}BeamOut" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#FBBF24" stop-opacity="0"/></linearGradient>
  </defs>

  <circle cx="64" cy="64" r="62" fill="url(#${uid}Glow)"/>
  ${withRays ? `<g${cls('bm-rays')}>${rays()}</g>` : ''}

  <!-- beams: cyan in from the left, gold out to the right -->
  <rect x="0" y="62.2" width="22" height="3.6" rx="1.8" fill="url(#${uid}BeamIn)"/>
  <rect x="106" y="62.2" width="22" height="3.6" rx="1.8" fill="url(#${uid}BeamOut)"/>

  <!-- the lantern crystal -->
  <g${cls('bm-gem')}>
    <polygon points="${OUTER.map(str).join(' ')}" fill="url(#${uid}Glass)" stroke="url(#${uid}Rim)" stroke-width="2" stroke-linejoin="round"/>
    ${facets()}
    <polygon points="${INNER.map(str).join(' ')}" fill="rgba(2,6,23,.55)" stroke="rgba(253,230,138,.7)" stroke-width=".9" stroke-linejoin="round"/>
  </g>

  <!-- Iri -->
  <g transform="translate(64 65.5) scale(.82) translate(-24 -28)"><g${cls('bm-flame')}>
    <path d="M24 3c2 9 12 14 12 27 0 10-6 22-12 22S12 40 12 30C12 22 18 20 20 12c2 3 3 5 4-9z" fill="url(#${uid}Flame)"/>
    <ellipse cx="19" cy="32" rx="2.5" ry="3.1" fill="#1e1b4b"/><ellipse cx="29" cy="32" rx="2.5" ry="3.1" fill="#1e1b4b"/>
    <circle cx="19.8" cy="31" r=".9" fill="#fff"/><circle cx="29.8" cy="31" r=".9" fill="#fff"/>
    <path d="M19.5 38.5q4.5 4.2 9 0" stroke="#7c2d12" stroke-width="1.7" stroke-linecap="round" fill="none"/>
    <circle cx="14.2" cy="37.5" r="2.3" fill="#fb7185" opacity=".55"/><circle cx="33.8" cy="37.5" r="2.3" fill="#fb7185" opacity=".55"/>
  </g></g>

  <!-- glint -->
  <g transform="translate(91 35)"><g${cls('bm-glint')}><path d="M0-7L1.6-1.6 7 0 1.6 1.6 0 7-1.6 1.6-7 0-1.6-1.6z" fill="#fff"/></g></g>
</svg>`;
}

export const BRAND_MARK = brandMarkSvg({ animated: true, uid: 'bmMenu' });
