/* Stitches the per-chapter files together in play order.
   To add a chapter: create js/levels/chapters/<id>.js (see tools/specs/), import it here,
   add it to CHAPTERS, then add its story (js/story/chapters/), theme (js/render/themes.js)
   and level quips (js/personality/quips.js). */
import dawn from './chapters/dawn.js';
import monolith from './chapters/monolith.js';
import twin from './chapters/twin.js';

export const CHAPTERS = [dawn, monolith, twin];

/** Flat list with chapter info, in play order. */
export const LEVELS = CHAPTERS.flatMap((ch, ci) =>
  ch.levels.map((lvl, li) => ({ ...lvl, chapter: ci, chapterId: ch.id, indexInChapter: li })));
LEVELS.forEach((l, i) => { l.index = i; l.number = i + 1; });
