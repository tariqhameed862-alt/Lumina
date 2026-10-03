/* Cartoon sound effects, all synthesised. Each function takes the AudioEngine as its first argument. */

/** Rubber "boing" — a pitch sweep with wobble. Used when a mirror snaps or a crystal is startled. */
export function boing(engine, pitch = 1) {
  if (!engine.ready) return;
  const c = engine.ctx, t = c.currentTime;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(190 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(520 * pitch, t + 0.07);
  o.frequency.exponentialRampToValueAtTime(150 * pitch, t + 0.34);
  const lfo = c.createOscillator(), lg = c.createGain();
  lfo.frequency.value = 26; lg.gain.value = 22 * pitch;
  lfo.connect(lg); lg.connect(o.frequency);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.16, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
  o.connect(g); g.connect(engine.master);
  o.start(t); lfo.start(t); o.stop(t + 0.4); lfo.stop(t + 0.4);
}

/** Sleepy crystal yawn: a slow, falling, breathy "aaah" through a moving low-pass. */
export function yawn(engine) {
  if (!engine.ready) return;
  const c = engine.ctx, t = c.currentTime;
  const o = c.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(330, t);
  o.frequency.linearRampToValueAtTime(400, t + 0.22);
  o.frequency.exponentialRampToValueAtTime(170, t + 0.85);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 3;
  lp.frequency.setValueAtTime(500, t);
  lp.frequency.linearRampToValueAtTime(1500, t + 0.25);
  lp.frequency.exponentialRampToValueAtTime(260, t + 0.85);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.09, t + 0.22);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  o.connect(lp); lp.connect(g); g.connect(engine.master);
  o.start(t); o.stop(t + 0.95);
}

/** Tiny squeak (poking Iri, a startled crystal). */
export function squeak(engine) {
  if (!engine.ready) return;
  const c = engine.ctx, t = c.currentTime;
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(900, t);
  o.frequency.exponentialRampToValueAtTime(1700, t + 0.06);
  o.frequency.exponentialRampToValueAtTime(1200, t + 0.13);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.09, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o.connect(g); g.connect(engine.master);
  o.start(t); o.stop(t + 0.18);
}

/** Sad little "aww" — a crystal falling back asleep. */
export function sigh(engine) {
  if (!engine.ready) return;
  const c = engine.ctx, t = c.currentTime;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(260, t + 0.4);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.07, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  o.connect(g); g.connect(engine.master);
  o.start(t); o.stop(t + 0.5);
}

/** Bright rising arpeggio of giggly blips — a crystal waking up happy, or a three-star win. */
export function giggle(engine, count = 4) {
  if (!engine.ready) return;
  const c = engine.ctx, t = c.currentTime;
  for (let i = 0; i < count; i++) {
    const o = c.createOscillator();
    o.type = 'square';
    const f = 660 * Math.pow(1.122, i * 2 + (i % 2));
    o.frequency.setValueAtTime(f, t + i * 0.065);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t + i * 0.065);
    g.gain.linearRampToValueAtTime(0.04, t + i * 0.065 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.065 + 0.055);
    o.connect(g); g.connect(engine.master);
    o.start(t + i * 0.065); o.stop(t + i * 0.065 + 0.07);
  }
}

/** Party-popper "pop" for the confetti burst. */
export function pop(engine) {
  if (!engine.ready) return;
  const c = engine.ctx, t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = engine.noise;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 900;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  src.connect(hp); hp.connect(g); g.connect(engine.master);
  src.start(t); src.stop(t + 0.04);
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(320, t);
  o.frequency.exponentialRampToValueAtTime(80, t + 0.12);
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.linearRampToValueAtTime(0.22, t + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  o.connect(og); og.connect(engine.master);
  o.start(t); o.stop(t + 0.16);
}
