// Duelos de espada: alcance, defesa e dano.

import { setState } from './physics.js';

export const STRIKE_REACH = 48;
export const MIN_REACH = 6;
const PARRY_WINDOW = 12;

/** Defensor está com a guarda alta, virado para o atacante? */
function isParrying(defender, attacker) {
  const facing = Math.sign(attacker.x - defender.x) === defender.dir;
  return defender.state === 'parry' && defender.t <= PARRY_WINDOW && facing;
}

/** Inimigos possíveis de quem ataca. */
function opponentsOf(world, attacker) {
  return attacker.kind === 'hero' ? world.guards : [world.hero];
}

/**
 * Resolve o golpe de `attacker` no quadro de impacto.
 * Retorna 'hit' | 'parried' | 'miss'.
 */
export function tryStrikeHit(world, attacker) {
  for (const target of opponentsOf(world, attacker)) {
    if (target.state === 'dead' || target.row !== attacker.row) continue;
    const dx = target.x - attacker.x;
    if (Math.sign(dx) !== attacker.dir) continue;
    const dist = Math.abs(dx);
    if (dist < MIN_REACH || dist > STRIKE_REACH) continue;
    if (!world.clearLine(attacker.x, target.x, attacker.row)) continue;

    if (isParrying(target, attacker)) {
      setState(attacker, 'blocked');
      world.emit('clang');
      return 'parried';
    }
    target.hp = Math.max(0, target.hp - 1);
    target.flash = 12;
    world.emit('hit');
    if (target.hp <= 0) {
      if (target.kind === 'hero') world.killHero('sword');
      else {
        setState(target, 'dead');
        world.emit('guardDown');
      }
    } else {
      target.dir = -attacker.dir;
      setState(target, 'hurt');
    }
    return 'hit';
  }
  world.emit('whoosh');
  return 'miss';
}
