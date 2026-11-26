// Física compartilhada por herói e guardas: andar no chão, cair e aterrissar.

import {
  GRAVITY, HALF_WIDTH, HAND_REACH, HURT_FALL, MAX_FALL_SPEED, SAFE_FALL, TH, TW,
} from '../engine/constants.js';
import { colOf, floorY, moveHorizontal } from '../engine/level.js';
import { T } from '../engine/tiles.js';

/** Estados em que o personagem está apoiado no chão. */
export const GROUND_STATES = new Set([
  'stand', 'turn', 'startRun', 'run', 'stopRun', 'bump', 'step', 'stepEdge',
  'crouch', 'land', 'drink', 'standJumpPrep', 'idle', 'gasp',
  'fight', 'advance', 'retreat', 'strike', 'parry', 'hurt', 'blocked',
]);

export const AIR_STATES = new Set(['jump', 'fall']);

export function setState(ch, state) {
  ch.state = state;
  ch.t = 0;
}

export function isGrounded(ch) {
  return GROUND_STATES.has(ch.state);
}

/** Move no andar atual, respeitando paredes e portões. */
export function walk(world, ch, dx) {
  const res = moveHorizontal(world.level, ch.x, dx, ch.row, world.isGateClosed);
  ch.x = res.x;
  return res.blocked;
}

/** Começa a cair a partir da posição atual. */
export function startFall(ch, vx = 0, vy = 0) {
  ch.vx = vx;
  ch.vy = vy;
  ch.fallStartY = ch.y;
  setState(ch, 'fall');
}

/** Se não houver piso sob o personagem, ele começa a cair. */
export function checkGround(world, ch) {
  if (!world.level.floorAt(colOf(ch.x), ch.row)) {
    startFall(ch, ch.dir * 0.6, 0);
    return false;
  }
  return true;
}

/**
 * Um passo de física no ar (pulo ou queda).
 * `canGrab` permite agarrar bordas ao passar por elas.
 * Retorna 'landed' | 'grabbed' | 'out' | null.
 */
export function airStep(world, ch, canGrab) {
  const level = world.level;
  const prevY = ch.y;
  ch.vy = Math.min(ch.vy + GRAVITY, MAX_FALL_SPEED);
  ch.y += ch.vy;

  if (ch.state === 'fall') ch.vx *= 0.94;
  if (ch.vx !== 0) {
    const bodyRow = Math.floor((ch.y - 30) / TH);
    const feetRow = Math.floor((ch.y - 4) / TH);
    let x = ch.x + ch.vx;
    let blocked = false;
    for (const r of new Set([bodyRow, feetRow])) {
      const res = moveHorizontal(level, ch.x, ch.vx, r, world.isGateClosed);
      if (res.blocked) blocked = true;
      x = ch.vx > 0 ? Math.min(x, res.x) : Math.max(x, res.x);
    }
    ch.x = x;
    if (blocked) {
      ch.vx = 0;
      if (ch.state === 'jump') ch.state = 'fall';
      world.emit('bump');
    }
  }

  if (ch.vy > -0.5 && canGrab) {
    // As mãos alcançam uma borda próxima (um pouco acima ou abaixo delas)?
    const hands = ch.y - HAND_REACH;
    const k = Math.round(hands / TH) - 1;
    const ly = floorY(k);
    const c = colOf(ch.x);
    const edgeCol = c + ch.dir;
    const xe = ch.dir > 0 ? (c + 1) * TW : c * TW;
    const towardEdge = (xe - ch.x) * ch.dir; // distância até a borda à frente
    // Não alcança bordas muito acima do ponto de onde pulou.
    const reachable = ly >= ch.fallStartY - TH / 2;
    if (reachable && hands >= ly - 20 && hands <= ly + 24 && towardEdge >= -2 && towardEdge <= 18 &&
        !level.floorAt(c, k) && !level.isWall(c, k) && level.floorAt(edgeCol, k)) {
      hangFrom(ch, k, edgeCol, xe, -ch.dir);
      return 'grabbed';
    }
  }

  if (ch.vy > 0) {
    const k = Math.floor(ch.y / TH) - 1;
    const ly = floorY(k);
    if (prevY < ly && ly <= ch.y) {
      const c = colOf(ch.x);
      const dir = Math.sign(ch.vx) || ch.dir;
      const toes = colOf(ch.x + dir * HALF_WIDTH);
      if (level.floorAt(c, k)) {
        ch.y = ly;
        ch.row = k;
        return 'landed';
      }
      if (toes !== c && level.floorAt(toes, k) && !level.isWall(toes, k)) {
        // Só a ponta do pé alcançou a borda: puxa o corpo para cima do piso.
        ch.x = dir > 0 ? toes * TW + 2 : (toes + 1) * TW - 2;
        ch.y = ly;
        ch.row = k;
        return 'landed';
      }
    }
  }

  if (ch.y > level.rows * TH + TH) return 'out';
  return null;
}

/** Pendura o personagem na borda (xe) do piso da célula (edgeCol, k). */
export function hangFrom(ch, k, edgeCol, xe, side) {
  // side: lado do vão em relação à borda (-1 = à esquerda, +1 = à direita).
  ch.dir = -side;
  ch.x = xe + side * 7;
  ch.y = floorY(k) + HAND_REACH;
  ch.vx = 0;
  ch.vy = 0;
  ch.hang = { k, edgeCol, xe };
  ch.dropQueued = false;
  ch.climbQueued = false;
  setState(ch, 'hang');
}

/** Classifica uma queda pela distância: 'safe' | 'hurt' | 'fatal'. */
export function fallSeverity(distance) {
  if (distance <= SAFE_FALL) return 'safe';
  if (distance <= HURT_FALL) return 'hurt';
  return 'fatal';
}

/** O personagem está sobre espinhos? */
export function onSpikes(world, ch) {
  return world.level.tile(colOf(ch.x), ch.row) === T.SPIKES;
}
