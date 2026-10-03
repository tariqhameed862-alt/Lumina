/* One mirror's motion per frame: demo sweep · finger-follow while dragged · critically-damped snap spring after release. */
import { SPRING_K, SPRING_D, DRAG_SMOOTH } from '../config.js';
import { spring } from './fx/spring.js';

const lerpK = (f, dt) => 1 - Math.pow(1 - f, dt / 16.667);

export function stepMirror(m, dt, { demo, time }) {
  if (demo && m.sweep) {
    m.angle = m.base + Math.sin(time * m.speed) * m.sweep;
  } else if (m.dragId !== null) {
    const prev = m.angle;
    m.angle += (m.goal - m.angle) * lerpK(DRAG_SMOOTH, dt);
    m.vel = (m.angle - prev) / Math.max(dt, 1);
    m.spin += Math.abs(m.angle - prev);
  } else if (m.target !== null) {
    const steps = Math.max(1, Math.ceil(dt / 8));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      m.vel += ((m.target - m.angle) * SPRING_K - m.vel * SPRING_D) * h;
      m.angle += m.vel * h;
    }
    if (Math.abs(m.target - m.angle) < 0.0004 && Math.abs(m.vel) < 0.00002) {
      m.angle = m.goal = m.target; m.vel = 0; m.target = null;
    }
  }
  m.dial += ((m.dragId !== null ? 1 : 0) - m.dial) * lerpK(0.18, dt);
  m.pulse = Math.max(0, m.pulse - dt / 380);
  spring(m, 'sq', 'sqv', dt);
}
