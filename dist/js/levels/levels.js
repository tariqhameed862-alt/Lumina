/* Back-compat shim: older imports (and tools/verify-levels.mjs) still say './levels/levels.js'.
   The data now lives one-file-per-chapter in ./chapters/, assembled by ./index.js. */
export { CHAPTERS, LEVELS } from './index.js';
