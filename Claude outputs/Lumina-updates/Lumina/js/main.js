/* App controller: owns the systems and the screen flow
   menu ⇄ levels ⇄ play (+ pause / victory / settings / story overlays). */
import { LEVELS, CHAPTERS } from './levels/levels.js';
import { Storage } from './core/Storage.js';
import { Viewport } from './core/Viewport.js';
import { AudioEngine } from './core/Audio.js';
import { Haptics } from './core/Haptics.js';
import { resolveQuality } from './core/Quality.js';
import { Game } from './game/Game.js';
import { Input } from './game/Input.js';
import { Renderer } from './render/Renderer.js';
import { Story } from './story/Story.js';
import { MenuScreen } from './ui/MenuScreen.js';
import { LevelSelectScreen } from './ui/LevelSelectScreen.js';
import { HUD } from './ui/HUD.js';
import { PauseOverlay } from './ui/PauseOverlay.js';
import { VictoryOverlay } from './ui/VictoryOverlay.js';
import { SettingsOverlay } from './ui/SettingsOverlay.js';
import { StoryOverlay } from './ui/StoryOverlay.js';

const SCENE_ALPHA = { menu: 0.3, levels: 0.18, play: 1 };

class App {
  constructor() {
    const stage = document.getElementById('stage');
    const canvas = document.getElementById('game');
    const uiRoot = document.getElementById('ui');

    this.storage = new Storage(LEVELS.length);
    this.audio = new AudioEngine(this.storage.settings.sound);
    this.haptics = new Haptics(this.storage.settings.haptics);
    this.viewport = new Viewport(canvas, stage);
    this.renderer = new Renderer(canvas, this.viewport);
    this.renderer.setQuality(resolveQuality(this.storage.settings.quality));
    this.game = new Game({ audio: this.audio, haptics: this.haptics });
    this.input = new Input(canvas, this.viewport, this.game);
    this.storyMgr = new Story(this.storage, LEVELS, CHAPTERS);

    this.menu = new MenuScreen(this).mount(uiRoot);
    this.levels = new LevelSelectScreen(this).mount(uiRoot);
    this.hud = new HUD(this).mount(uiRoot);
    this.pauseOverlay = new PauseOverlay(this).mount(uiRoot);
    this.victory = new VictoryOverlay(this).mount(uiRoot);
    this.settings = new SettingsOverlay(this).mount(uiRoot);
    this.story = new StoryOverlay(this).mount(uiRoot);

    this.screen = null;
    this.levelIndex = 0;
    this._victoryTimer = 0;
    this._pendingChapterDone = false;
    this._idleTick = 0;

    this.game.onMove = (moves) => this.hud.setMoves(moves);
    this.game.onWin = (r) => this._onWin(r);
    this.input.onInteract = () => { this.hud.dismissHint(); this.renderer.interacted = true; };

    // Audio can only start inside a user gesture
    window.addEventListener('pointerdown', () => this.audio.unlock(), { passive: true });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); this.back(); } });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('visibilitychange', () => {
      this._last = 0;
      if (document.hidden) { this._saveSession(); if (this.screen === 'play') this.pause(); }
    });
    window.addEventListener('pagehide', () => this._saveSession());

    // Android hardware back button when packaged with Capacitor
    const capApp = window.Capacitor?.Plugins?.App;
    if (capApp?.addListener) capApp.addListener('backButton', () => this.back());

    this.goMenu();
    this._last = 0;
    requestAnimationFrame((t) => this._frame(t));
  }

  get canQuit() { return !!window.Capacitor?.Plugins?.App?.exitApp; }
  get level() { return LEVELS[this.levelIndex]; }

  /* ---------- Main loop ---------- */
  _frame(now) {
    requestAnimationFrame((t) => this._frame(t));
    let dt = this._last ? now - this._last : 16.667;
    this._last = now;
    if (dt > 50) dt = 50;
    if (dt < 0) dt = 16.667;

    if (this.game.paused) {
      // Nothing changes while paused (mirrors can't move) except the purely ambient
      // motion visible behind the blurred pause panel. Simulating + redrawing that
      // at full 60fps is wasted battery for a screen no one's actively looking at,
      // so only run 1 frame in 3 and scale dt to keep the idle animation speed sane.
      this._idleTick++;
      if (this._idleTick % 3 !== 0) return;
      dt *= 3;
    } else {
      this._idleTick = 0;
    }

    this.game.update(dt, this.viewport.bounds);
    this.renderer.render(this.game, dt);
  }

  /* ---------- Screen flow ---------- */
  _setScreen(name) {
    this.screen = name;
    this.menu[name === 'menu' ? 'show' : 'hide']();
    if (name === 'levels') this.levels.show(); else this.levels.hide();
    if (name === 'play') this.hud.show(); else this.hud.hide();
    this.renderer.setSceneAlpha(SCENE_ALPHA[name]);
  }

  _closeOverlays() {
    clearTimeout(this._victoryTimer);
    this.pauseOverlay.hide();
    this.victory.hide();
    this.settings.hide();
    this.story.hide();
  }

  goMenu() {
    this._saveSession();
    this._closeOverlays();
    this.input.cancelAll();
    this.game.loadDemo();
    const beat = this.storyMgr.pendingOutroAnywhere();
    if (beat) { this.storyMgr.markSeen(beat); this.story.play(beat, () => this._setScreen('menu')); return; }
    this._setScreen('menu');
  }

  goLevels() {
    this._saveSession();
    this._closeOverlays();
    this.input.cancelAll();
    if (!this.game.demo) this.game.loadDemo();
    // Catches chapter-completion lore that "Next" would normally have shown, for
    // players who instead left the victory screen via Levels/Replay/back.
    const beat = this.storyMgr.pendingOutroAnywhere();
    if (beat) { this.storyMgr.markSeen(beat); this.story.play(beat, () => this._setScreen('levels')); return; }
    this._setScreen('levels');
  }

  /** First level with a genuinely unfinished session, else the frontier (first
   *  incomplete level). Deliberately does NOT read storage.data.lastLevel as the
   *  primary source — that field is touched by simply opening any level (including
   *  replaying an old one), so trusting it here made "Continue" jump backwards
   *  whenever a player revisited an earlier stage. */
  continueIndex() {
    const s = this.storage;
    return s.data.session ? s.data.session.index : s.nextToPlay();
  }

  continueGame() { this.startLevel(this.continueIndex(), { resume: true }); }

  startLevel(i, opts = {}) {
    if (!this.storage.isUnlocked(i)) return;
    const beat = this.storyMgr.pendingIntro(LEVELS[i]);
    if (beat) {
      this.storyMgr.markSeen(beat);
      this.story.play(beat, () => this._doStartLevel(i, opts));
      return;
    }
    this._doStartLevel(i, opts);
  }

  _doStartLevel(i, { resume = false } = {}) {
    this._closeOverlays();
    this.input.cancelAll();
    this.levelIndex = i;
    const session = resume ? this.storage.getSession(i) : null;
    if (!session) this.storage.clearSession();
    this.game.load(LEVELS[i], session);
    this.renderer.interacted = false;
    this.storage.data.lastLevel = i;
    this.storage.save();
    this._setScreen('play');
    this.hud.setLevel(this.level, CHAPTERS[this.level.chapter].title, this.game.moves);
  }

  pause() {
    if (this.screen !== 'play' || this.game.won || this.game.paused) return;
    this.game.paused = true;
    this.input.cancelAll();
    this._saveSession();
    this.pauseOverlay.show(this.level);
  }

  resume() {
    if (!this.game.paused) return;
    this.game.paused = false;
    this.pauseOverlay.hide();
  }

  restart() {
    if (this.screen !== 'play') return;
    this._closeOverlays();
    this.input.cancelAll();
    this.storage.clearSession();
    this.game.restart();
    this.hud.setLevel(this.level, CHAPTERS[this.level.chapter].title, 0, { intro: false });
  }

  replay() { this.startLevel(this.levelIndex); }

  /** Reverts the most recent completed mirror rotation, if any. */
  undo() {
    if (this.screen !== 'play') return;
    this.game.undo();
  }

  next() {
    const level = this.level;
    const chapterDone = this._pendingChapterDone;
    this._pendingChapterDone = false;
    const beat = this.storyMgr.pendingOutro(level, chapterDone);
    if (beat) {
      this.storyMgr.markSeen(beat);
      this.story.play(beat, () => this._afterNext());
      return;
    }
    this._afterNext();
  }

  _afterNext() {
    if (this.levelIndex + 1 < LEVELS.length) this.startLevel(this.levelIndex + 1);
    else this.goLevels();
  }

  openSettings() { this.settings.show(); }
  closeSettings() { this.settings.hide(); }

  /** Android back / Escape: close the top-most thing. */
  back() {
    if (this.story.visible) return this.story.skip();
    if (this.settings.visible) return this.closeSettings();
    if (this.victory.visible) return this.goLevels();
    if (this.pauseOverlay.visible) return this.resume();
    if (this.screen === 'play') return this.pause();
    if (this.screen === 'levels') return this.goMenu();
    if (this.screen === 'menu' && this.canQuit) return this.quit();
  }

  quit() {
    this._saveSession();
    window.Capacitor?.Plugins?.App?.exitApp?.();
  }

  /* ---------- Settings & progress ---------- */
  toggleSetting(key, value) {
    const v = value ?? !this.storage.settings[key];
    this.storage.setSetting(key, v);
    if (key === 'sound') this.audio.setEnabled(v);
    if (key === 'haptics') this.haptics.enabled = v;
    if (key === 'quality') this.renderer.setQuality(resolveQuality(v));
  }

  resetProgress() {
    this.storage.reset();
    if (this.screen === 'menu') this.menu.refresh();
  }

  _saveSession() {
    if (this.screen === 'play' && this.game.active && !this.game.demo && !this.game.won) {
      this.storage.saveSession(this.game.snapshot());
    }
  }

  /* ---------- Win ---------- */
  _onWin({ moves, bounces }) {
    const level = this.level;
    const stars = moves <= level.par ? 3 : moves <= level.par * 2 ? 2 : 1;
    const wasChapterDone = this._chapterComplete(level.chapter);
    const result = this.storage.recordWin(level.index, { stars, moves, bounces });
    const chapterDone = !wasChapterDone && this._chapterComplete(level.chapter);
    this._pendingChapterDone = chapterDone;
    this.input.cancelAll();
    this._victoryTimer = setTimeout(() => {
      if (this.screen !== 'play') return;
      this.victory.show({
        level, stars, moves, bounces, result,
        isLast: level.index === LEVELS.length - 1,
        chapterDone,
        chapterTitle: CHAPTERS[level.chapter].title
      });
    }, 850);
  }

  _chapterComplete(ci) {
    return LEVELS.filter(l => l.chapter === ci).every(l => this.storage.isCompleted(l.index));
  }
}

// A thrown constructor (canvas 2D context unavailable, a locked-down WebView, etc.)
// would otherwise leave a permanently blank screen with no explanation. Fail loud
// instead: log for anything watching the console/crash reports, and tell the player.
try {
  window.LuminaApp = new App();
} catch (err) {
  console.error('[Lumina] failed to start:', err);
  const ui = document.getElementById('ui');
  if (ui) {
    ui.innerHTML =
      '<div class="boot-error"><p>Lumina couldn’t start on this device.<br>' +
      'Try updating your browser and reloading.</p></div>';
  }
}
