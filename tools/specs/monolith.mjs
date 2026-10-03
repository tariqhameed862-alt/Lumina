/* Chapter spec: monolith — em: emitters · path: rotatable path mirrors · fixed: locked path mirrors ·
   decoy: off-path mirrors · cr: crystals · obs: obsidian blocks. */
export default {
  id: 'monolith', title: 'Monoliths', subtitle: 'Shadows stand tall',
  handmade: {
    monolith: {
      emitters: [{ x: 80, y: 600, dx: 1, dy: 0 }],
      mirrors: [{ x: 200, y: 600, a: 15 }, { x: 200, y: 300, a: 75 }, { x: 650, y: 300, a: 120 }],
      crystals: [{ x: 650, y: 600 }, { x: 420, y: 300 }],
      obstacles: [{ x: 340, y: 430, w: 140, h: 340 }]
    }
  },
  levels: [
    { name: 'Monolith', handmade: 'monolith', hint: 'Obsidian absorbs light — route around it' },
    { name: 'Obelisk', em: 1, path: 2, cr: 2, obs: 1 },
    { name: 'Shadowline', em: 1, path: 3, cr: 2, obs: 1 },
    { name: 'Keystone', em: 1, path: 2, fixed: 1, cr: 3, obs: 1 },
    { name: 'Colonnade', em: 1, path: 3, cr: 3, obs: 2 },
    { name: 'Eclipse', em: 1, path: 3, decoy: 1, cr: 2, obs: 1 },
    { name: 'Labyrinth', em: 1, path: 4, cr: 3, obs: 2 },
    { name: 'Citadel', em: 1, path: 3, fixed: 1, decoy: 1, cr: 3, obs: 2 }
  ]
}
