/* Effects quality. shadowBlur and layered additive glow are the most expensive things
   this renderer does — cheap on a desktop GPU, but a real cost on the budget Android
   WebViews a lot of Play Store installs happen on. 'auto' picks a sane default from
   rough device signals; the player can always override it in Settings. */

function autoDetect() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;      // Chrome/Android only; undefined elsewhere → treated as fine
  const dpr = Math.min(window.devicePixelRatio || 1, 4);
  if (cores <= 4 || mem <= 3 || dpr > 2.5) return 'low';
  return 'high';
}

/** 'auto' | 'high' | 'low' -> 'high' | 'low' */
export function resolveQuality(setting) {
  if (setting === 'high' || setting === 'low') return setting;
  return autoDetect();
}
