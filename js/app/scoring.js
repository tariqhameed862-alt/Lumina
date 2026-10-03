/* Scoring rules, isolated so they're trivial to tune (and to unit-test).
   3★ at or under par (fewest mirrors that must be turned) · 2★ up to 2× par · 1★ otherwise. */
export const starsFor = (moves, par) => (moves <= par ? 3 : moves <= par * 2 ? 2 : 1);
