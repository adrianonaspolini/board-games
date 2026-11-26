// Batedores do exército rival: ficam de tocaia e atacam quando o chasqui
// chega perto. Há dois tipos: com maça (corpo a corpo) e com funda.

import { cellCenterX, colOf, floorY } from '../engine/level.js';
import { T, isCrumbly } from '../engine/tiles.js';
import { tryStrikeHit } from './combat.js';
import { airStep, checkGround, fallSeverity, setState, walk } from './physics.js';

export function createGuard(c, r, { hp = 3, skill = 0.3, dir = -1, weapon = 'maca' } = {}) {
  return {
    kind: 'guard',
    x: cellCenterX(c),
    y: floorY(r),
    row: r,
    dir,
    state: 'idle',
    t: 0,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    skill,
    weapon, // 'maca' | 'funda'
    cooldown: 30,
    fallStartY: 0,
    flash: 0,
    parryDecided: false,
  };
}

const ENGAGE = 170;
const IDEAL_MIN = 24;
const IDEAL_MAX = 40;

/** O guarda pode pisar na célula? (evita vãos e armadilhas) */
function safeToStand(world, x, row) {
  const c = colOf(x);
  const tile = world.level.tile(c, row);
  return world.level.floorAt(c, row) && tile !== T.SPIKES && tile !== T.BLADE && !isCrumbly(tile);
}

/** Decide se o batedor se abaixa para desviar de uma pedra que vem vindo. */
function tryDodge(world, g) {
  if (!['fight', 'advance', 'retreat'].includes(g.state)) return false;
  const incoming = world.projectiles.find((p) => p.owner === 'hero' && p.row === g.row &&
    !p.passed.has(g) && Math.sign(g.x - p.x) === Math.sign(p.vx) && Math.abs(g.x - p.x) < 40);
  if (!incoming) {
    g.parryDecided = false;
    return false;
  }
  if (g.parryDecided) return false;
  g.parryDecided = true;
  if (world.rng() < g.skill) {
    setState(g, 'parry');
    return true;
  }
  return false;
}

export function updateGuard(world, g) {
  g.t++;
  if (g.flash > 0) g.flash--;
  const h = world.hero;
  if (tryDodge(world, g)) return;

  switch (g.state) {
    case 'dead':
      return;

    case 'fall': {
      const res = airStep(world, g, false);
      if (res === 'landed') {
        world.touchFloor(g);
        const sev = fallSeverity(g.y - g.fallStartY);
        if (sev === 'fatal' || (sev === 'hurt' && --g.hp <= 0)) {
          g.hp = 0;
          setState(g, 'dead');
          world.emit('guardDown');
        } else {
          setState(g, 'idle');
          world.emit('land');
        }
      } else if (res === 'out') {
        g.hp = 0;
        setState(g, 'dead');
      }
      return;
    }

    case 'hurt':
      if (g.t <= 8) walk(world, g, -g.dir * 1.2);
      if (g.t >= 14) setState(g, 'fight');
      checkGround(world, g);
      return;

    case 'blocked':
      if (g.t <= 6) walk(world, g, -g.dir * 0.8);
      if (g.t >= 12) setState(g, 'fight');
      checkGround(world, g);
      return;

    case 'strike':
      if (g.t === 11) {
        if (g.weapon === 'funda') world.throwStone(g);
        else tryStrikeHit(world, g);
      }
      if (g.t >= 24) setState(g, 'fight');
      return;

    case 'parry':
      if (g.t >= 20) setState(g, 'fight');
      return;

    case 'advance':
    case 'retreat': {
      const step = (g.state === 'advance' ? 1 : -1) * g.dir * 1.0;
      if (safeToStand(world, g.x + step * 8, g.row)) walk(world, g, step);
      if (g.t >= 8) setState(g, 'fight');
      return;
    }

    default:
      break;
  }

  // 'idle' e 'fight': decidir o que fazer.
  const engaged = h.state !== 'dead' && h.row === g.row &&
    Math.abs(h.x - g.x) <= ENGAGE && world.clearLine(g.x, h.x, g.row) &&
    !['jump', 'fall', 'hang', 'climbUp', 'climbDown', 'jumpUp'].includes(h.state);
  if (!engaged) {
    if (g.state !== 'idle') setState(g, 'idle');
    return;
  }
  if (g.state === 'idle') {
    setState(g, 'fight');
    world.emit('draw');
  }
  g.dir = Math.sign(h.x - g.x) || g.dir;
  const dist = Math.abs(h.x - g.x);

  if (g.cooldown > 0) {
    g.cooldown--;
    return;
  }
  const [near, far] = g.weapon === 'funda' ? [70, 140] : [IDEAL_MIN, IDEAL_MAX];
  if (dist > far) {
    setState(g, 'advance');
  } else if (dist < near) {
    setState(g, 'retreat');
  } else if (world.rng() < 0.05 + 0.05 * g.skill) {
    setState(g, 'strike');
    world.emit('swing');
    g.cooldown = Math.round((g.weapon === 'funda' ? 70 : 40) - 20 * g.skill);
  }
}
