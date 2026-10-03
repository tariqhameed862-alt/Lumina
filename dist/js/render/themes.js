/* Per-chapter look. Everything colourful about a chapter is here: beam colour, background glow, dust motes,
   confetti palette, obsidian etching. Chapter ids match js/levels/chapters/*.js.
   Colours are RGB triplets (for canvas rgba strings) or CSS colours (for the DOM background variables). */

export const THEMES = {
  /* Menus / level select — warm-cyan default */
  menu: {
    beam: [34, 211, 238], beamWin: [60, 242, 186], accent: '34,211,238',
    dust: ['253,230,138', '165,243,252'], confetti: ['#FBBF24', '#22D3EE', '#F472B6', '#A78BFA', '#34D399'],
    bgA: 'rgba(34, 211, 238, 0.06)', bgB: '#0c121c', bgC: '#05070b', tint: '226,232,240'
  },
  /* Dawn — sunrise coral & gold against plum */
  dawn: {
    beam: [34, 211, 238], beamWin: [253, 224, 71], accent: '251,146,60',
    dust: ['253,186,116', '253,230,138', '251,113,133'], confetti: ['#FB923C', '#FDE047', '#FB7185', '#22D3EE', '#FFFFFF'],
    bgA: 'rgba(251, 113, 133, 0.22)', bgB: '#1a0f1f', bgC: '#07040a', tint: '254,215,170'
  },
  /* Monoliths — violet twilight, neon magenta beam */
  monolith: {
    beam: [167, 139, 250], beamWin: [244, 114, 182], accent: '192,132,252',
    dust: ['196,181,253', '244,114,182', '129,140,248'], confetti: ['#A78BFA', '#F472B6', '#38BDF8', '#FDE68A', '#FFFFFF'],
    bgA: 'rgba(139, 92, 246, 0.24)', bgB: '#120d24', bgC: '#050310', tint: '221,214,254'
  },
  /* Twin Suns — teal night with orange sun-glow */
  twin: {
    beam: [45, 212, 191], beamWin: [251, 191, 36], accent: '45,212,191',
    dust: ['94,234,212', '251,191,36', '253,186,116'], confetti: ['#2DD4BF', '#FBBF24', '#FB923C', '#F0ABFC', '#FFFFFF'],
    bgA: 'rgba(251, 146, 60, 0.22)', bgB: '#07171a', bgC: '#020809', tint: '204,251,241'
  }
};

/** Push a theme's background colours into CSS variables (read by #stage in css/base.css). */
export function applyThemeToDom(theme, root = document.getElementById('stage')) {
  if (!root) return;
  root.style.setProperty('--bg-a', theme.bgA);
  root.style.setProperty('--bg-b', theme.bgB);
  root.style.setProperty('--bg-c', theme.bgC);
  root.style.setProperty('--accent-rgb', theme.accent);
}
