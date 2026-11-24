import { EMPTY_INPUT, World } from '../src/game/world.js';

/** Monta um mundo a partir de linhas de mapa (completa até 10x3 com paredes). */
export function mk(rows, def = {}) {
  const cols = Math.ceil(Math.max(...rows.map((r) => r.length)) / 10) * 10;
  let map = rows.map((r) => r.padEnd(cols, 'W'));
  while (map.length % 3) map = ['W'.repeat(cols), ...map];
  return new World({ name: 'teste', ...def, map }, def.opts);
}

export const I = (keys = '') => ({
  ...EMPTY_INPUT,
  left: keys.includes('L'),
  right: keys.includes('R'),
  up: keys.includes('U'),
  down: keys.includes('D'),
  action: keys.includes('A'),
});

/** Segura as teclas por n ticks. */
export function hold(w, keys, n) {
  for (let i = 0; i < n; i++) w.step(I(keys));
}

/** Segura as teclas até a condição valer (ou falha após max ticks). */
export function until(w, keys, cond, max = 600) {
  for (let i = 0; i < max; i++) {
    if (cond(w)) return i;
    w.step(I(keys));
  }
  throw new Error(`condição não atingida; herói: ${JSON.stringify(summary(w))}`);
}

/** Espera o herói ficar parado em pé (ou em combate). */
export function settle(w, max = 200) {
  return until(w, '', (x) => ['stand', 'fight', 'hang', 'dead'].includes(x.hero.state), max);
}

export function summary(w) {
  const h = w.hero;
  return { state: h.state, x: Math.round(h.x), y: Math.round(h.y), row: h.row, hp: h.hp, col: Math.floor(h.x / 32) };
}

export const col = (w) => Math.floor(w.hero.x / 32);
