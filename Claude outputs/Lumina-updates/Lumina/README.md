# Lumina: Light the Path

Minimalist light-reflection puzzle game. HTML5 Canvas + vanilla JS (ES modules), no libraries, no assets.

## Run

ES modules don't load from `file://`, so serve the folder:

```bash
python -m http.server 8765
```

Then open http://localhost:8765 (on a phone on the same Wi-Fi: `http://<your-PC-IP>:8765`).

## Game flow

Main menu → Level select (3 chapters × 8 levels) → Play → Pause / Victory → Next level.

- **Progress** is saved in `localStorage` (`lumina_save_v1`): stars, best moves and bounces per level, settings, story beats already seen, and the exact mirror angles of an unfinished level, so **Continue** resumes exactly where you left off (mid-level session first, otherwise the first incomplete level — replaying an earlier stage no longer moves this pointer).
- **Stars:** 3★ at or under par (fewest mirrors that must be turned), 2★ up to 2× par, 1★ otherwise.
- **Undo:** the HUD's undo button reverts the last completed rotation (up to `UNDO_DEPTH` moves).
- **Unlocking:** each level unlocks the next.
- **Story:** each chapter opens and closes with a short narrated beat (Iri, guiding the player through the Vale) — see `js/story/`.
- **Back:** Escape (desktop) or the Android back button (under Capacitor) closes the top-most screen, including an in-progress story beat.
- **Graphics quality:** Settings → High-detail effects toggles the shadowBlur/extra-glow render path; defaults to an auto device-based guess (`js/core/Quality.js`) for older/budget Android hardware.

## Structure

```
index.html              shell: canvas + #ui root, loads js/main.js
css/
  base.css              tokens, shell, screen/overlay transitions
  components.css        pills, buttons, toggles, chips, tags
  screens.css           menu, level select, HUD, pause, victory, settings
js/
  main.js               App controller: screen flow, win handling, saving, story hooks
  config.js             all tuning constants (incl. the shared board-bounds margin)
  core/
    Storage.js          versioned save data (+ migration from the prototype, + story/quality)
    Viewport.js         high-DPI canvas, 800×1200 virtual coords, resize
    Audio.js            Web Audio synthesis (snap, chime, stars, victory)
    Haptics.js          vibration (uses Capacitor Haptics when packaged)
    Motion.js           live prefers-reduced-motion flag for the canvas renderer
    Quality.js           effects-quality auto-detect ('auto' | 'high' | 'low')
  game/
    Game.js             level simulation: mirrors, springs, win timer, undo stack
    RayCaster.js        pure ray casting (shared with the Node tools)
    Input.js            multi-touch rotation, zero-jump delta tracking
    Particles.js        fixed 40-spark pool
  render/
    Renderer.js         frame composer
    assets.js           sprites, gradients, path helpers
    drawBoard.js        grid + obsidian blocks
    drawBeam.js         beam bloom, flow, impact rings
    drawMirror.js       sapphire / gilded mirrors + rotation dial
    drawEmitter.js      platinum emitter
    drawCrystal.js      "Sun Shrine" crystal
  ui/
    dom.js              helpers, icons, Component base class
    MenuScreen.js  LevelSelectScreen.js  HUD.js
    PauseOverlay.js  VictoryOverlay.js  SettingsOverlay.js  StoryOverlay.js
  story/
    content.js           narrative text, per chapter (intro/outro)
    Story.js             pure logic: which beat (if any) is due next
  levels/
    levels.js           AUTO-GENERATED level data
tools/
  generate-levels.mjs   builds levels from specs, brute-force verified
  verify-levels.mjs     re-checks every level is solvable
  solver.mjs            tries every 15° orientation of every mirror
legacy/
  lumina-single-file.html   the original one-file version
```

## Levels

Levels are generated backwards from a guaranteed solution, then decorated with fixed mirrors, decoys and obsidian blocks.
Every level is brute-force solved.

```bash
node tools/generate-levels.mjs   # edit the CHAPTERS specs in this file, then regenerate
node tools/verify-levels.mjs     # check all levels
```

Level pieces: `emitters` (x, y, dx, dy), `mirrors` (x, y, a° [, fixed]), `crystals` (x, y), `obstacles` (x, y, w, h), on an 800×1200 board.

## Story

Iri — the last burning fragment of the Vale's First Light — narrates a short beat when a chapter opens and again when it closes, keyed off `CHAPTERS[i].id` in `js/levels/levels.js` ('dawn' / 'monolith' / 'twin'). All text lives in `js/story/content.js` as plain data (speaker, an array of paragraph "pages", and a CTA label for the last page); `js/story/Story.js` is the pure-logic side that decides when a beat is due and records it as seen in the save file, and `js/ui/StoryOverlay.js` is the only piece that touches the DOM. To extend the story for a new chapter, add a `STORY[chapterId]` entry — the intro/outro hooks in `main.js` (`startLevel`, `next`, `goMenu`, `goLevels`) need no changes.
