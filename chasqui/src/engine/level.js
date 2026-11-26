import { HALF_WIDTH, ROOM_COLS, ROOM_ROWS, TH, TW } from './constants.js';
import { T, isKnownTile, tileHasFloor } from './tiles.js';

/**
 * Mapa de uma fase: grade de células, mais o estado mutável das armadilhas.
 * Não depende de DOM.
 */
export class Level {
  /**
   * @param {object} def definição: { name, map: string[], links, guards, time? }
   */
  constructor(def) {
    this.def = def;
    this.name = def.name;
    this.rows = def.map.length;
    this.cols = def.map[0].length;
    if (this.rows % ROOM_ROWS || this.cols % ROOM_COLS) {
      throw new Error(`${def.name}: o mapa deve ter múltiplos de ${ROOM_COLS}x${ROOM_ROWS} células`);
    }
    this.cells = def.map.map((line, r) => {
      if (line.length !== this.cols) throw new Error(`${def.name}: linha ${r} com tamanho errado`);
      return [...line].map((ch, c) => {
        if (!isKnownTile(ch)) throw new Error(`${def.name}: bloco desconhecido '${ch}' em (${c},${r})`);
        return ch;
      });
    });
  }

  inside(c, r) {
    return c >= 0 && r >= 0 && c < this.cols && r < this.rows;
  }

  tile(c, r) {
    return this.inside(c, r) ? this.cells[r][c] : T.WALL;
  }

  setTile(c, r, ch) {
    if (this.inside(c, r)) this.cells[r][c] = ch;
  }

  isWall(c, r) {
    return this.tile(c, r) === T.WALL;
  }

  /** Existe piso para ficar em pé na célula (c, r)? */
  floorAt(c, r) {
    if (!this.inside(c, r)) return false;
    const ch = this.cells[r][c];
    if (ch === T.WALL) return false;
    return tileHasFloor(ch) || this.tile(c, r + 1) === T.WALL;
  }

  /** Procura células de um tipo. */
  find(ch) {
    const out = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) if (this.cells[r][c] === ch) out.push([c, r]);
    }
    return out;
  }
}

export const colOf = (x) => Math.floor(x / TW);
export const rowOfFeet = (y) => Math.round(y / TH) - 1;
export const floorY = (r) => (r + 1) * TH;
export const cellCenterX = (c) => c * TW + TW / 2;

/**
 * Move horizontalmente de x por dx no andar r, parando em paredes e em
 * portões fechados. `isGateClosed(c, r)` informa o estado dos portões.
 * Retorna { x, blocked }.
 */
export function moveHorizontal(level, x, dx, r, isGateClosed) {
  if (dx === 0) return { x, blocked: false };
  const dir = Math.sign(dx);
  const target = x + dx;
  const lead0 = x + dir * HALF_WIDTH;
  const lead1 = target + dir * HALF_WIDTH;
  const c0 = colOf(lead0);
  const c1 = colOf(lead1);
  for (let c = c0; dir > 0 ? c <= c1 : c >= c1; c += dir) {
    if (level.isWall(c, r)) {
      const edge = dir > 0 ? c * TW : (c + 1) * TW;
      if ((dir > 0 && lead1 > edge) || (dir < 0 && lead1 < edge)) {
        return { x: edge - dir * HALF_WIDTH, blocked: true };
      }
    }
    if (isGateClosed && isGateClosed(c, r)) {
      const bar = c * TW + TW / 2;
      const before = dir > 0 ? lead0 <= bar + 0.01 : lead0 >= bar - 0.01;
      const after = dir > 0 ? lead1 > bar : lead1 < bar;
      if (before && after) return { x: bar - dir * HALF_WIDTH, blocked: true };
    }
  }
  return { x: target, blocked: false };
}
