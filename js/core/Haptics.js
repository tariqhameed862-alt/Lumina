/* Vibration. Uses the Capacitor Haptics plugin when the game runs as an Android app, else navigator.vibrate. */

export class Haptics {
  constructor(enabled = true) { this.enabled = enabled; }

  get native() { return window.Capacitor?.Plugins?.Haptics || null; }

  vibrate(pattern) {
    if (!this.enabled) return;
    const n = this.native;
    if (n) {
      const ms = Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern;
      try { ms <= 15 ? n.impact({ style: 'LIGHT' }) : n.vibrate({ duration: ms }); } catch (e) { /* ignore */ }
      return;
    }
    if ('vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
    }
  }

  snap() { this.vibrate(10); }
  win() { this.vibrate([30, 50, 40]); }
}
