/* Story registry: one narrator — Iri, the last burning mote of the First Light —
   guiding the player (the "Lightkeeper") through the Vale's three chapters.
   Each chapter's text lives in its own file under ./chapters/, keyed by CHAPTERS[i].id
   from js/levels/index.js, so this stays data, not logic. */
import dawn from './chapters/dawn.js';
import monolith from './chapters/monolith.js';
import twin from './chapters/twin.js';

export const STORY = { dawn, monolith, twin };
