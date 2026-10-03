/* All sound is synthesised with the Web Audio API — no audio files.
   Core cues live here; the cartoon effects and Iri's voice are in ./audio/. */
import * as humor from './audio/humorSfx.js';
import { voiceBlip } from './audio/voice.js';

export class AudioEngine {
  constructor(enabled = true) {
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.enabled = enabled;
  }

  /** Must run inside a user gesture (autoplay policy). Safe to call repeatedly. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.85 : 0;
      this.master.connect(this.ctx.destination);
      const len = Math.ceil(this.ctx.sampleRate * 0.03);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(on ? 0.85 : 0, t, 0.03);
    }
  }

  get ready() { return !!this.ctx && this.enabled && this.ctx.state === 'running'; }

  /** Tactile mechanical click: 14ms band-passed noise. */
  snap(gain = 1.4) {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 850; bp.Q.value = 6;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.014);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + 0.02);
  }

  /** Soft UI tap. */
  tap() { this.snap(0.55); }

  /** Crystal resonance: F#5 + C#6. `pitch` shifts it for chained crystals. */
  chime(pitch = 1) {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    for (const [f, amp, dur] of [[739.99, 0.16, 1.7], [1108.73, 0.10, 1.25]]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * pitch;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    }
  }

  /** Star reveal on the victory screen. */
  star(i) {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const f = [987.77, 1174.66, 1479.98][i] || 1479.98;   // B5 D6 F#6
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f * 0.98, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 1);
  }

  /** Major-9th pad (C4 G4 D5 E5) with a low-pass filter opening over 1.4s.
   *  Guarded against re-entry: rapid replay-and-win spamming would otherwise
   *  stack several ~5s decaying chords on top of each other. */
  victory() {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    if (this._victoryUntil && t < this._victoryUntil) return;
    this._victoryUntil = t + 1.2;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(160, t);
    lp.frequency.exponentialRampToValueAtTime(3400, t + 1.4);
    const bus = c.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.linearRampToValueAtTime(1, t + 0.35);
    bus.gain.setValueAtTime(1, t + 1.6);
    bus.gain.exponentialRampToValueAtTime(0.0001, t + 4.8);
    lp.connect(bus); bus.connect(this.master);
    [261.63, 392.0, 587.33, 659.25].forEach((f, i) => {
      for (const [type, det, amp] of [['sawtooth', -6, 0.028], ['sawtooth', 6, 0.028], ['triangle', 0, 0.05]]) {
        const o = c.createOscillator();
        o.type = type; o.frequency.value = f; o.detune.value = det;
        const g = c.createGain();
        g.gain.value = amp * (i === 0 ? 1.1 : 1);
        o.connect(g); g.connect(lp);
        o.start(t + i * 0.035); o.stop(t + 5);
      }
    });
    const sub = c.createOscillator();
    sub.type = 'sine'; sub.frequency.value = 130.81;
    const sg = c.createGain();
    sg.gain.value = 0.09;
    sub.connect(sg); sg.connect(bus);
    sub.start(t); sub.stop(t + 5);
  }

  /* ---------- Personality cues (see ./audio/) ---------- */
  boing(pitch) { humor.boing(this, pitch); }
  yawn() { humor.yawn(this); }
  squeak() { humor.squeak(this); }
  sigh() { humor.sigh(this); }
  giggle(count) { humor.giggle(this, count); }
  pop() { humor.pop(this); }
  voice(charCode) { voiceBlip(this, charCode); }
}
