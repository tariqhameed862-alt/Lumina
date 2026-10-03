/* Live "prefers-reduced-motion" flag. The DOM screens already respect this via CSS
   transitions (see base.css); this is what lets the canvas renderer respect it too —
   otherwise idle decorative motion (grid breathing, crystal orbit, beam dash-flow)
   would keep animating regardless of the OS accessibility setting. */

const mq = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

export const Motion = { reduced: !!mq?.matches };

mq?.addEventListener?.('change', (e) => { Motion.reduced = e.matches; });
