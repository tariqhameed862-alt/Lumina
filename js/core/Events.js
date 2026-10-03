/* Tiny publish/subscribe bus. Lets Game announce "a crystal woke up" without knowing
   that Iri, the audio engine or the camera shake want to react to it. */
export class Events {
  constructor() { this.map = new Map(); }

  on(name, fn) {
    if (!this.map.has(name)) this.map.set(name, new Set());
    this.map.get(name).add(fn);
    return () => this.map.get(name)?.delete(fn);
  }

  emit(name, payload) {
    const set = this.map.get(name);
    if (set) for (const fn of set) fn(payload);
  }
}
