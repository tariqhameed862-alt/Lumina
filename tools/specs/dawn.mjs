/* Chapter spec: dawn — em: emitters · path: rotatable path mirrors · fixed: locked path mirrors ·
   decoy: off-path mirrors · cr: crystals · obs: obsidian blocks. */
export default {
  id: 'dawn', title: 'Dawn', subtitle: 'First light',
  handmade: {
    horizon: {
      emitters: [{ x: 90, y: 260, dx: 1, dy: 0 }],
      mirrors: [{ x: 400, y: 260, a: 105 }],
      crystals: [{ x: 400, y: 960 }],
      obstacles: []
    },
    reflection: {
      emitters: [{ x: 120, y: 1060, dx: 0, dy: -1 }],
      mirrors: [{ x: 120, y: 250, a: 30 }, { x: 680, y: 250, a: 150 }],
      crystals: [{ x: 120, y: 650 }, { x: 380, y: 770 }],
      obstacles: []
    }
  },
  levels: [
    { name: 'Horizon', handmade: 'horizon', hint: 'Touch & rotate mirrors to guide the light' },
    { name: 'Reflection', handmade: 'reflection', hint: 'Light passes through crystals — chain them together' },
    { name: 'Ember', em: 1, path: 2, cr: 1 },
    { name: 'Meridian', em: 1, path: 2, cr: 2 },
    { name: 'Anchor', em: 1, path: 1, fixed: 1, cr: 2, hint: 'Gilded mirrors are fixed in place' },
    { name: 'Lattice', em: 1, path: 3, cr: 2 },
    { name: 'Whisper', em: 1, path: 2, decoy: 1, cr: 2, hint: 'Not every mirror is needed' },
    { name: 'Constellation', em: 1, path: 3, cr: 3 }
  ]
}
