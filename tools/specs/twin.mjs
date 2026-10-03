/* Chapter spec: twin — em: emitters · path: rotatable path mirrors · fixed: locked path mirrors ·
   decoy: off-path mirrors · cr: crystals · obs: obsidian blocks. */
export default {
  id: 'twin', title: 'Twin Suns', subtitle: 'Two lights, one harmony',
  handmade: {},
  levels: [
    { name: 'Binary', em: 2, path: 2, cr: 2, hint: 'Two suns — every crystal must shine' },
    { name: 'Confluence', em: 2, path: 3, cr: 3 },
    { name: 'Solstice', em: 2, path: 3, cr: 3, obs: 1 },
    { name: 'Equinox', em: 2, path: 3, fixed: 1, cr: 3, obs: 1 },
    { name: 'Aurora', em: 2, path: 4, cr: 4, obs: 1 },
    { name: 'Parallax', em: 2, path: 3, decoy: 1, cr: 3, obs: 2 },
    { name: 'Zenith', em: 2, path: 4, fixed: 1, cr: 4, obs: 2 },
    { name: 'Sanctuary', em: 2, path: 5, cr: 4, obs: 2 }
  ]
}
