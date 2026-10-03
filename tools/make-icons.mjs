/* Writes icons/emblem.svg and icons/app-icon.svg from js/ui/BrandMark.js (single source of truth).
   Run:  node tools/make-icons.mjs      PNGs (180/192/512) are rendered separately by tools/render-icons.py-style scripts. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { brandMarkSvg } from '../js/ui/BrandMark.js';

mkdirSync(new URL('../icons/', import.meta.url), { recursive: true });

const emblem = brandMarkSvg({ animated: false, uid: 'e' }).trim();
writeFileSync(new URL('../icons/emblem.svg', import.meta.url), emblem + '\n');

// App icon: dark rounded tile + the emblem scaled in, so it reads at 48px on a home screen.
const inner = brandMarkSvg({ animated: false, uid: 'a', rays: false }).trim()
  .replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const app = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lumina">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14223f"/><stop offset="1" stop-color="#070b14"/></linearGradient>
    <radialGradient id="tileGlow" cx="50%" cy="48%" r="55%"><stop offset="0" stop-color="#F59E0B" stop-opacity=".35"/><stop offset="1" stop-color="#F59E0B" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#tile)"/>
  <rect width="128" height="128" rx="28" fill="url(#tileGlow)"/>
  <rect x=".75" y=".75" width="126.5" height="126.5" rx="27.3" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="1.5"/>
  <g transform="translate(64 64) scale(1.2) translate(-64 -64)">${inner}</g>
</svg>
`;
writeFileSync(new URL('../icons/app-icon.svg', import.meta.url), app);
console.log('wrote icons/emblem.svg, icons/app-icon.svg');
