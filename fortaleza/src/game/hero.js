// O herói: máquina de estados dirigida pelos 5 comandos
// (esquerda, direita, cima, baixo, ação).

import { RUN_SPEED, TW } from '../engine/constants.js';
import { cellCenterX, colOf, floorY } from '../engine/level.js';
import { T } from '../engine/tiles.js';
import { tryStrikeHit } from './combat.js';
import {
  airStep, checkGround, fallSeverity, hangFrom, isGrounded, onSpikes,
  setState, startFall, walk,
} from './physics.js';

export function createHero(c, r, { hp = 3, maxHp = 3 } = {}) {
  return {
    kind: 'hero',
    x: cellCenterX(c),
    y: floorY(r),
    row: r,
    dir: 1,
    state: 'stand',
    t: 0,
    vx: 0,
    vy: 0,
    hp,
    maxHp,
    fallStartY: 0,
    hang: null,
    deathCause: null,
    flash: 0,
    jumpLanding: false,
  };
}

const ENGAGE_DISTANCE = 110;
const DISENGAGE_DISTANCE = 150;

export function killHero(world, h, cause) {
  if (h.state === 'dead') return;
  h.hp = 0;
  h.deathCause = cause;
  h.vx = 0;
  h.vy = 0;
  setState(h, 'dead');
  world.emit('death');
}

export function hurtHero(world, h, amount = 1) {
  h.hp = Math.max(0, h.hp - amount);
  h.flash = 12;
  world.emit('hurt');
  return h.hp <= 0;
}

/** Guarda com quem o herói luta (mesmo andar, perto e sem parede no meio). */
export function engagedGuard(world, h, distance = ENGAGE_DISTANCE) {
  let best = null;
  for (const g of world.guards) {
    if (g.state === 'dead' || g.state === 'fall' || g.row !== h.row) continue;
    const d = Math.abs(g.x - h.x);
    if (d > distance || !world.clearLine(h.x, g.x, h.row)) continue;
    if (!best || d < Math.abs(best.x - h.x)) best = g;
  }
  return best;
}

function forwardHeld(h, inp) {
  return h.dir > 0 ? inp.right : inp.left;
}

function backHeld(h, inp) {
  return h.dir > 0 ? inp.left : inp.right;
}

/** Distância até a borda do piso à frente (Infinity se o piso continua). */
function distanceToEdge(world, h) {
  const level = world.level;
  const c = colOf(h.x);
  const next = c + h.dir;
  const edgeX = h.dir > 0 ? (c + 1) * TW : c * TW;
  if (level.floorAt(next, h.row) && !level.isWall(next, h.row) && !world.isGateClosed(next, h.row)) {
    return Infinity;
  }
  // Paredes e portões param o passo antes; vãos deixam a ponta do pé na borda.
  const margin = level.floorAt(next, h.row) || level.isWall(next, h.row) ? 7 : 2;
  return Math.max(0, Math.abs(edgeX - h.x) - margin);
}

function landOn(world, h) {
  const distance = h.y - h.fallStartY;
  const severity = fallSeverity(distance);
  world.touchFloor(h);
  if (onSpikes(world, h) && (h.jumpLanding || distance > 8)) {
    killHero(world, h, 'spikes');
    return;
  }
  if (severity === 'fatal') {
    killHero(world, h, 'fall');
    return;
  }
  h.vx = 0;
  h.vy = 0;
  setState(h, 'land');
  h.landHard = severity === 'hurt';
  world.emit(severity === 'safe' ? 'land' : 'landHard');
  if (severity === 'hurt' && hurtHero(world, h)) killHero(world, h, 'fall');
}

/** Tenta pular para agarrar a borda acima. Retorna true se houver borda. */
function findLedgeAbove(world, h) {
  const level = world.level;
  const c = colOf(h.x);
  const k = h.row - 1;
  if (k < 0 || level.floorAt(c, k) || level.isWall(c, k)) return null;
  for (const dir of [h.dir, -h.dir]) {
    const xe = dir > 0 ? (c + 1) * TW : c * TW;
    if (level.floorAt(c + dir, k) && Math.abs(h.x - xe) <= 30) {
      return { k, edgeCol: c + dir, xe, dir };
    }
  }
  return null;
}

/** Procura uma borda para descer (à frente ou atrás). */
function findLedgeBelow(world, h) {
  const level = world.level;
  const c = colOf(h.x);
  for (const side of [h.dir, -h.dir]) {
    const hole = c + side;
    const xe = side > 0 ? (c + 1) * TW : c * TW;
    if (!level.floorAt(hole, h.row) && !level.isWall(hole, h.row) &&
        Math.abs(h.x - xe) <= 18 && h.row + 1 < level.rows + 1) {
      return { k: h.row, edgeCol: c, xe, side };
    }
  }
  return null;
}

function tryEnterFight(world, h) {
  const g = engagedGuard(world, h);
  if (!g) return false;
  h.dir = Math.sign(g.x - h.x) || h.dir;
  h.vx = 0;
  setState(h, 'fight');
  world.emit('draw');
  return true;
}

/** Atualiza o herói por um tick. `inp` = teclas seguradas, `pressed` = recém-apertadas. */
export function updateHero(world, h, inp, pressed) {
  h.t++;
  if (h.flash > 0) h.flash--;
  const level = world.level;

  switch (h.state) {
    case 'dead':
    case 'enter':
      if (h.state === 'enter' && h.t >= 45) world.finishLevel();
      return;

    case 'stand':
    case 'idle': {
      if (tryEnterFight(world, h)) return;
      if (pressed.up) {
        const c = colOf(h.x);
        if (level.tile(c, h.row) === T.EXIT && world.exitOpen >= 1) {
          h.x = cellCenterX(c);
          setState(h, 'enter');
          world.emit('exit');
          return;
        }
        if (forwardHeld(h, inp)) {
          setState(h, 'standJumpPrep');
          return;
        }
        const ledge = findLedgeAbove(world, h);
        h.ledge = ledge;
        if (ledge) h.dir = ledge.dir;
        setState(h, 'jumpUp');
        world.emit('jump');
        return;
      }
      if (pressed.down) {
        const ledge = findLedgeBelow(world, h);
        if (ledge) {
          h.ledge = ledge;
          h.dir = -ledge.side;
          setState(h, 'climbDown');
          return;
        }
        setState(h, 'crouch');
        return;
      }
      if (pressed.action && !inp.left && !inp.right) {
        const c = colOf(h.x);
        const tile = level.tile(c, h.row);
        if (tile === T.POTION || tile === T.BIG_POTION) {
          h.potion = tile;
          setState(h, 'drink');
          return;
        }
      }
      if (forwardHeld(h, inp)) {
        setState(h, inp.action ? 'step' : 'startRun');
        if (h.state === 'step') h.stepLeft = Math.min(11, distanceToEdge(world, h));
        if (h.state === 'step' && h.stepLeft < 0.5) setState(h, 'stepEdge');
        return;
      }
      if (backHeld(h, inp)) {
        setState(h, 'turn');
      }
      return;
    }

    case 'turn':
      if (h.t >= 7) {
        h.dir = -h.dir;
        setState(h, 'stand');
      }
      return;

    case 'step': {
      const amount = Math.min(1, h.stepLeft);
      if (amount > 0) {
        walk(world, h, amount * h.dir);
        h.stepLeft -= amount;
      }
      if (h.t >= 12) setState(h, 'stand');
      checkGround(world, h);
      return;
    }

    case 'stepEdge':
      if (h.t >= 14) setState(h, 'stand');
      return;

    case 'startRun':
    case 'run':
    case 'stopRun': {
      if (tryEnterFight(world, h)) return;
      let speed = RUN_SPEED;
      if (h.state === 'startRun') {
        speed = RUN_SPEED * Math.min(1, 0.3 + h.t * 0.14);
        if (h.t >= 6) h.state = 'run';
      } else if (h.state === 'stopRun') {
        speed = RUN_SPEED * Math.max(0, 1 - h.t / 8);
        if (h.t >= 8) {
          setState(h, backHeld(h, inp) ? 'turn' : 'stand');
          return;
        }
      } else if (pressed.up) {
        h.vx = 3.2 * h.dir;
        h.vy = -4.4;
        h.fallStartY = h.y;
        h.jumpLanding = true;
        setState(h, 'jump');
        world.emit('jump');
        return;
      } else if (!forwardHeld(h, inp)) {
        setState(h, 'stopRun');
      }
      const blocked = walk(world, h, speed * h.dir);
      if (blocked) {
        setState(h, 'bump');
        world.emit('bump');
        return;
      }
      if (!checkGround(world, h)) {
        h.vx = speed * h.dir * 0.8;
        return;
      }
      if (onSpikes(world, h) && speed > 1) killHero(world, h, 'spikes');
      return;
    }

    case 'bump':
      if (h.t >= 10) setState(h, 'stand');
      return;

    case 'crouch':
      if (!inp.down && h.t >= 4) setState(h, 'stand');
      return;

    case 'land':
      if (h.t >= (h.landHard ? 18 : 7)) setState(h, 'stand');
      return;

    case 'drink':
      if (h.t === 22) {
        const c = colOf(h.x);
        if (h.potion === T.BIG_POTION) {
          h.maxHp += 1;
          h.hp = h.maxHp;
        } else {
          h.hp = Math.min(h.maxHp, h.hp + 1);
        }
        level.setTile(c, h.row, T.FLOOR);
        world.emit('potion');
      }
      if (h.t >= 40) setState(h, 'stand');
      return;

    case 'standJumpPrep':
      if (h.t >= 6) {
        h.vx = 2.5 * h.dir;
        h.vy = -3.7;
        h.fallStartY = h.y;
        h.jumpLanding = true;
        setState(h, 'jump');
        world.emit('jump');
      }
      return;

    case 'jumpUp': {
      const ledge = h.ledge;
      if (ledge && h.t >= 8) {
        hangFrom(h, ledge.k, ledge.edgeCol, ledge.xe, -ledge.dir);
        world.touchEdge(h);
        return;
      }
      if (!ledge && h.t === 9) {
        world.bumpCeiling(colOf(h.x), h.row - 1);
      }
      if (h.t >= 22) setState(h, 'stand');
      return;
    }

    case 'climbDown':
      if (h.t >= 16) {
        const l = h.ledge;
        hangFrom(h, l.k, l.edgeCol, l.xe, l.side);
        world.touchEdge(h);
      }
      return;

    case 'hang': {
      const hang = h.hang;
      if (!level.floorAt(hang.edgeCol, hang.k)) {
        // A borda desabou.
        startFall(h, 0, 0);
        h.fallStartY = h.y + 10;
        h.jumpLanding = false;
        return;
      }
      if (pressed.down) h.dropQueued = true;
      if (pressed.up) h.climbQueued = true;
      if (h.t < 6) return;
      if (inp.up || h.climbQueued) {
        h.climbQueued = false;
        h.dropQueued = false;
        setState(h, 'climbUp');
        return;
      }
      if (inp.down || h.dropQueued) {
        h.dropQueued = false;
        startFall(h, 0, 0);
        h.fallStartY = h.y + 10;
        h.jumpLanding = false;
      }
      return;
    }

    case 'climbUp':
      if (h.t >= 24) {
        const { k, xe } = h.hang;
        h.x = xe + h.dir * 9;
        h.row = k;
        h.y = floorY(k);
        h.hang = null;
        setState(h, 'stand');
        world.touchFloor(h);
      }
      return;

    case 'jump':
    case 'fall': {
      const res = airStep(world, h, inp.action);
      if (res === 'landed') landOn(world, h);
      else if (res === 'grabbed') {
        h.jumpLanding = false;
        world.touchEdge(h);
        world.emit('grab');
      } else if (res === 'out') killHero(world, h, 'fall');
      return;
    }

    // ---- Combate -------------------------------------------------------
    case 'fight': {
      const g = engagedGuard(world, h, DISENGAGE_DISTANCE);
      if (!g) {
        setState(h, 'stand');
        return;
      }
      h.dir = Math.sign(g.x - h.x) || h.dir;
      if (pressed.action) {
        setState(h, 'strike');
        world.emit('swing');
      } else if (pressed.up) {
        setState(h, 'parry');
      } else if (forwardHeld(h, inp)) {
        setState(h, 'advance');
      } else if (backHeld(h, inp)) {
        setState(h, 'retreat');
      }
      return;
    }

    case 'advance': {
      const g = engagedGuard(world, h, DISENGAGE_DISTANCE);
      if (!g || Math.abs(g.x - h.x) > 22) walk(world, h, h.dir * 1.1);
      if (h.t >= 9) setState(h, 'fight');
      checkGround(world, h);
      return;
    }

    case 'retreat':
      walk(world, h, -h.dir * 1.1);
      if (h.t >= 9) setState(h, 'fight');
      checkGround(world, h);
      return;

    case 'strike':
      if (h.t === 10) tryStrikeHit(world, h);
      if (h.t >= 22) setState(h, 'fight');
      return;

    case 'parry':
      if (h.t >= 4 && pressed.action) {
        setState(h, 'strike');
        h.t = 3; // contra-ataque mais rápido depois de defender
        world.emit('swing');
        return;
      }
      if (h.t >= 16) setState(h, 'fight');
      return;

    case 'hurt':
      if (h.t <= 8) walk(world, h, -h.dir * 1.2);
      if (h.t >= 14) setState(h, 'fight');
      checkGround(world, h);
      return;

    case 'blocked':
      if (h.t <= 6) walk(world, h, -h.dir * 0.8);
      if (h.t >= 12) setState(h, 'fight');
      checkGround(world, h);
      return;

    default:
      throw new Error(`Estado desconhecido: ${h.state}`);
  }
}

/** Verifica perigos que dependem do tempo (lâminas). */
export function checkHeroHazards(world, h) {
  if (h.state === 'dead' || !isGrounded(h)) return;
  const c = colOf(h.x);
  if (world.level.tile(c, h.row) === T.BLADE && world.bladeDeadly(c, h.row)) {
    killHero(world, h, 'blade');
  }
}

