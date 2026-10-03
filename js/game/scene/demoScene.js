/* Ambient scene shown behind the menus: mirrors sweep on their own. */
export const DEMO_SCENE = {
  emitters: [{ x: 90, y: 880, dx: 1, dy: 0 }],
  mirrors: [
    { x: 560, y: 880, a: -45, sweep: 9, speed: 0.00042 },
    { x: 560, y: 430, a: 45, sweep: 7, speed: 0.00031 },
    { x: 240, y: 430, a: 135, sweep: 0, speed: 0 }
  ],
  crystals: [{ x: 240, y: 700 }, { x: 400, y: 430 }],
  obstacles: []
};
