/* Re-checks every level in js/levels/levels.js.  Run:  node tools/verify-levels.mjs */
import { LEVELS } from '../js/levels/levels.js';
import { solve, solvedAtStart } from './solver.mjs';

let failed = 0;
for (const lvl of LEVELS) {
  const res = solve(lvl);
  const problems = [];
  if (!res.solutions) problems.push('UNSOLVABLE');
  if (solvedAtStart(lvl)) problems.push('already solved at start');
  if (res.par !== lvl.par) problems.push(`par is ${res.par}, file says ${lvl.par}`);
  if (problems.length) failed++;
  console.log(`${String(lvl.number).padStart(2, '0')} ${lvl.name.padEnd(14)} ${problems.length ? '✗ ' + problems.join('; ') : `✓ par ${res.par}, example ${JSON.stringify(res.example)}`}`);
}
console.log(failed ? `\n${failed} level(s) failed` : `\nAll ${LEVELS.length} levels OK`);
process.exit(failed ? 1 : 0);
