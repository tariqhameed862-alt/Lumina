/* App controller: owns the systems and the screen flow
   menu ⇄ levels ⇄ play (+ pause / victory / settings overlays). */
import { LEVELS, CHAPTERS } from './levels/levels.js';
import { Storage } from './core/Storage.js';
import { Viewport } from './core/Viewport.js';
import { AudioEngine } from './core/Audio.js';
import { Haptics } from './core/Haptics.js';
import { Game } from './game/Game.js';
import { Input } from './game/Input.js';
import { Renderer } from './render/Renderer.js';
import { MenuScreen } from './ui/MenuScreen.js';
import { LevelSelectScreen } from './ui/LevelSelectScreen.js';
import { HUD } from './ui/HUD.js';
import { PauseOverlay } from './ui/PauseOverlay.js';
import { VictoryOverlay } from './ui/VictoryOverlay.js';
import { SettingsOverlay } from './ui/SettingsOverlay.js';

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
    this.game = new Game({ audio: this.audio, haptics: this.haptics });
    this.input = new Input(canvas, this.viewport, this.game);

    this.menu = new MenuScreen(this).mount(uiRoot);
    this.levels = new LevelSelectScreen(this).mount(uiRoot);
    this.hud = new HUD(this).mount(uiRoot);
    this.pauseOverlay = new PauseOverlay(this).mount(uiRoot);
    this.victory = new VictoryOverlay(this).mount(uiRoot);
    this.settings = new SettingsOverlay(this).mount(uiRoot);

    this.screen = null;
    this.levelIndex = 0;
    this._victoryTimer = 0;

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
  }

  goMenu() {
    this._saveSession();
    this._closeOverlays();
    this.input.cancelAll();
    this.game.loadDemo();
    this._setScreen('menu');
  }

  goLevels() {
    this._saveSession();
    this._closeOverlays();
    this.input.cancelAll();
    if (!this.game.demo) this.game.loadDemo();
    this._setScreen('levels');
  }

  continueIndex() {
    const s = this.storage;
    const last = Math.min(Math.max(0, s.data.lastLevel || 0), LEVELS.length - 1);
    return s.isUnlocked(last) ? last : s.nextToPlay();
  }

  continueGame() { this.startLevel(this.continueIndex(), { resume: true }); }

  startLevel(i, { resume = false } = {}) {
    if (!this.storage.isUnlocked(i)) return;
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

  next() {
    if (this.levelIndex + 1 < LEVELS.length) this.startLevel(this.levelIndex + 1);
    else this.goLevels();
  }

  openSettings() { this.settings.show(); }
  closeSettings() { this.settings.hide(); }

  /** Android back / Escape: close the top-most thing. */
  back() {
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

window.LuminaApp = new App();
