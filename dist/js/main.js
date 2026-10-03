/* Entry point. All the real work lives in js/app/App.js (screen flow) and the modules it wires together. */
import { App } from './app/App.js';

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
