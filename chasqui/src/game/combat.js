// Combate: golpes de maça (corpo a corpo), pedras de funda e esquiva.

import { setState } from './physics.js';

export const STRIKE_REACH = 48;
export const MIN_REACH = 6;
const PARRY_WINDOW = 16;

/** Está abaixado, esquivando (estado 'parry')? Funciona contra maça e pedras. */
export function isDodging(ch) {
  return ch.state === 'parry' && ch.t <= PARRY_WINDOW;
}

/** Aplica um acerto: tira vida, empurra e pode derrubar. */
export function applyHit(world, target, fromDir) {
  target.hp = Math.max(0, target.hp - 1);
  target.flash = 12;
  world.emit('hit');
  if (target.hp <= 0) {
    if (target.kind === 'hero') world.killHero(world.lastHitCause ?? 'stone');
    else {
      setState(target, 'dead');
      world.emit('guardDown');
    }
  } else {
    target.dir = -fromDir || target.dir;
    setState(target, 'hurt');
  }
}

/** Inimigos possíveis de quem ataca. */
function opponentsOf(world, attacker) {
  return attacker.kind === 'hero' ? world.guards : [world.hero];
}

/**
 * Resolve o golpe de maça de `attacker` no quadro de impacto.
 * Retorna 'hit' | 'dodged' | 'miss'.
 */
export function tryStrikeHit(world, attacker) {
  for (const target of opponentsOf(world, attacker)) {
    if (target.state === 'dead' || target.row !== attacker.row) continue;
    const dx = target.x - attacker.x;
    if (Math.sign(dx) !== attacker.dir) continue;
    const dist = Math.abs(dx);
    if (dist < MIN_REACH || dist > STRIKE_REACH) continue;
    if (!world.clearLine(attacker.x, target.x, attacker.row)) continue;

    if (isDodging(target)) {
      world.emit('whoosh');
      return 'dodged';
    }
    world.lastHitCause = 'mace';
    applyHit(world, target, attacker.dir);
    world.lastHitCause = null;
    return 'hit';
  }
  world.emit('whoosh');
  return 'miss';
}
