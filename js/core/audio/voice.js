/* Iri's "voice": a tiny pitched blip per pair of letters, like a talking-animal sound. Pure Web Audio, no files. */

export function voiceBlip(engine, charCode = 100) {
  if (!engine.ready) return;
  const c = engine.ctx, t = c.currentTime;
  const o = c.createOscillator();
  o.type = 'triangle';
  const base = 520 + (charCode % 12) * 38;              // deterministic per letter → sounds like syllables
  o.frequency.setValueAtTime(base, t);
  o.frequency.exponentialRampToValueAtTime(base * 1.12, t + 0.05);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.045, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  o.connect(g); g.connect(engine.master);
  o.start(t); o.stop(t + 0.09);
}
