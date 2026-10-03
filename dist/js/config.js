/* Global tuning constants. Pure data — safe to import from Node tools. */

export const W = 800;                 // logical board width
export const H = 1200;                // logical board height
export const DEG = Math.PI / 180;

// Single source of truth for the "beam wall" used to terminate a ray that hits nothing.
// Game.js, Viewport.js and tools/solver.mjs all derive their bounds from this so the
// live game, the level generator and the brute-force verifier always agree on what
// "solvable" means. See WALL_MARGIN below.
export const WALL_MARGIN = 40;
export const boardBounds = (margin = WALL_MARGIN) => ({
  x0: -margin, y0: -margin, x1: W + margin, y1: H + margin
});

// Light
export const MAX_BOUNCES = 12;
export const SELF_GUARD = 0.05;       // px nudge off a mirror after reflecting
export const EMITTER_MUZZLE = 32;     // beam starts this far in front of the emitter

// Pieces
export const MIRROR_HALF = 38;        // 76px long
export const MIRROR_HALF_W = 7;       // 14px thick
export const HIT_RADIUS = 52;         // touch zone around a mirror pivot
export const CRYSTAL_R = 24;

// Rotation feel
export const SNAP_STEP = 15 * DEG;
export const SNAP_THRESHOLD = 6 * DEG;
export const SNAP_LERP = 0.2;         // per-frame snap pull at 60fps
export const SPRING_K = Math.pow(-Math.log(1 - SNAP_LERP) / 16.667, 2); // stiffness / ms²
export const SPRING_D = 2 * Math.sqrt(SPRING_K);                        // critical damping
export const DRAG_SMOOTH = 0.5;       // per-frame follow factor while dragging

// Win + effects
export const WIN_HOLD_MS = 350;
export const MAX_PARTICLES = 220;      // sparks + win confetti share this pool
export const SPARK_INTERVAL = 100;

// Persistence
export const SAVE_KEY = 'lumina_save_v1';
export const LEGACY_KEY = 'lumina_unlocked_level';
export const SAVE_VERSION = 1;        // bump + add a step in Storage.migrate() when the shape changes

// Undo
export const UNDO_DEPTH = 20;
