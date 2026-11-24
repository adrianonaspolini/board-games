// O mundo de uma fase: mapa, herói, guardas e armadilhas. Lógica pura,
// avançada em passos fixos por `step(input)`.

import { TH, TW } from '../engine/constants.js';
import { Level, cellCenterX, colOf, floorY } from '../engine/level.js';
import { createRng } from '../engine/rng.js';
import { T } from '../engine/tiles.js';
import { createGuard, updateGuard } from './guard.js';
import { checkHeroHazards, createHero, killHero, updateHero } from './hero.js';
import { checkGround, isGrounded } from './physics.js';

const key = (c, r) => `${c},${r}`;

export const GATE_OPEN_TICKS = 360;
export const GATE_PASSABLE = 0.75;
export const LOOSE_SHAKE_TICKS = 22;
export const BLADE_PERIOD = 120;
export const BLADE_CLOSED = 14;

export const EMPTY_INPUT = Object.freeze({
  left: false, right: false, up: false, down: false, action: false,
});

export class World {
  /**
   * @param {object} def definição da fase
   * @param {object} [opts] { seed, hp, maxHp }
   */
  constructor(def, opts = {}) {
    this.level = new Level(def);
    this.rng = createRng(opts.seed ?? 7);
    this.tick = 0;
    this.status = 'playing'; // 'playing' | 'dead' | 'won'
    this.events = [];
    this.prevInput = EMPTY_INPUT;
    this.deadTicks = 0;
    this.isGateClosed = (c, r) => {
      const g = this.gates.get(key(c, r));
      return !!g && g.open < GATE_PASSABLE;
    };

    const [start] = this.level.find(T.START);
    if (!start) throw new Error(`${def.name}: falta o ponto de partida (S)`);
    this.hero = createHero(start[0], start[1], { hp: opts.hp ?? 3, maxHp: opts.maxHp ?? 3 });
    this.hero.dir = def.startDir ?? 1;

    const guardDefs = def.guards ?? [];
    this.guards = this.level.find(T.GUARD).map(([c, r], i) => {
      const gd = guardDefs[i] ?? {};
      return createGuard(c, r, gd);
    });

    this.gates = new Map();
    for (const [c, r] of this.level.find(T.GATE)) {
      this.gates.set(key(c, r), { c, r, open: 0, hold: 0, slam: false });
    }
    this.plates = new Map();
    for (const ch of [T.PLATE, T.CLOSER, T.EXIT_PLATE]) {
      for (const [c, r] of this.level.find(ch)) {
        this.plates.set(key(c, r), { c, r, type: ch, down: false, rubble: false, gates: [] });
      }
    }
    for (const link of def.links ?? []) {
      const plate = this.plates.get(key(...link.plate));
      if (!plate) throw new Error(`${def.name}: placa inexistente em ${link.plate}`);
      for (const g of link.gates) {
        if (!this.gates.has(key(...g))) throw new Error(`${def.name}: portão inexistente em ${g}`);
        plate.gates.push(key(...g));
      }
    }
    for (const plate of this.plates.values()) {
      if (plate.type !== T.EXIT_PLATE && plate.gates.length === 0) {
        throw new Error(`${def.name}: placa em ${plate.c},${plate.r} sem portão ligado`);
      }
    }
    this.loose = new Map();
    this.debris = [];
    this.rubble = [];
    this.spikes = new Map();
    for (const [c, r] of this.level.find(T.SPIKES)) this.spikes.set(key(c, r), { c, r, ext: 0, idle: 0 });
    this.exitOpen = 0;
    this.exitOpening = false;
  }

  emit(name) {
    this.events.push(name);
  }

  /** Eventos acumulados desde a última chamada (para som e efeitos). */
  drainEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }

  /** Nenhuma parede ou portão fechado entre x0 e x1 no andar r. */
  clearLine(x0, x1, r) {
    const a = colOf(Math.min(x0, x1));
    const b = colOf(Math.max(x0, x1));
    for (let c = a; c <= b; c++) {
      if (this.level.isWall(c, r)) return false;
      if (this.isGateClosed(c, r) && c !== a && c !== b) return false;
    }
    return true;
  }

  bladeDeadly(c) {
    return (this.tick + c * 37) % BLADE_PERIOD < BLADE_CLOSED;
  }

  killHero(cause) {
    killHero(this, this.hero, cause);
  }

  finishLevel() {
    this.status = 'won';
  }

  /** Um personagem pisou numa célula (aterrissou, subiu, chegou andando). */
  touchFloor(ch) {
    const c = colOf(ch.x);
    if (this.level.tile(c, ch.row) === T.LOOSE) this.shakeLoose(c, ch.row);
  }

  /** O herói se pendurou na borda de uma célula. */
  touchEdge(ch) {
    if (!ch.hang) return;
    const { edgeCol, k } = ch.hang;
    if (this.level.tile(edgeCol, k) === T.LOOSE) this.shakeLoose(edgeCol, k);
  }

  /** O herói bateu a cabeça no teto (piso da célula de cima). */
  bumpCeiling(c, r) {
    if (this.level.tile(c, r) === T.LOOSE) this.shakeLoose(c, r);
  }

  shakeLoose(c, r) {
    const k = key(c, r);
    if (!this.loose.has(k)) {
      this.loose.set(k, { c, r, t: 0 });
      this.emit('rumble');
    }
  }

  step(input = EMPTY_INPUT) {
    this.tick++;
    const prev = this.prevInput;
    const pressed = {
      left: input.left && !prev.left,
      right: input.right && !prev.right,
      up: input.up && !prev.up,
      down: input.down && !prev.down,
      action: input.action && !prev.action,
    };
    this.prevInput = { ...input };

    const h = this.hero;
    if (this.status === 'playing') {
      updateHero(this, h, input, pressed);
      if (isGrounded(h)) {
        this.touchFloor(h);
        checkGround(this, h);
      }
    }
    for (const g of this.guards) {
      updateGuard(this, g);
      if (isGrounded(g)) {
        this.touchFloor(g);
        checkGround(this, g);
      }
    }
    this.updateTraps();
    checkHeroHazards(this, h);

    if (h.state === 'dead' && this.status === 'playing') {
      this.deadTicks++;
      if (this.deadTicks >= 100) this.status = 'dead';
    }
  }

  updateTraps() {
    const level = this.level;
    const chars = [this.hero, ...this.guards].filter((ch) => isGrounded(ch) && ch.state !== 'dead');
    const deadOnFloor = [this.hero, ...this.guards].filter((ch) => ch.state === 'dead' && ch.vy === 0);

    // Placas
    for (const plate of this.plates.values()) {
      const occupied = plate.rubble || [...chars, ...deadOnFloor].some(
        (ch) => ch.row === plate.r && colOf(ch.x) === plate.c,
      );
      if (occupied && !plate.down) this.emit('click');
      plate.down = occupied;
      if (!occupied) continue;
      if (plate.type === T.EXIT_PLATE) {
        if (!this.exitOpening) this.emit('exitOpening');
        this.exitOpening = true;
      }
      for (const gk of plate.gates) {
        const gate = this.gates.get(gk);
        if (plate.type === T.PLATE) {
          if (gate.hold === 0 && gate.open < 1) this.emit('gate');
          gate.hold = GATE_OPEN_TICKS;
          gate.slam = false;
        } else {
          if (gate.open > 0 && !gate.slam) this.emit('slam');
          gate.hold = 0;
          gate.slam = true;
        }
      }
    }

    // Portões
    for (const gate of this.gates.values()) {
      if (gate.hold > 0) {
        gate.open = Math.min(1, gate.open + 1 / 45);
        // Só conta o tempo depois de totalmente aberto e sem ninguém na placa.
        if (gate.open >= 1) gate.hold--;
      } else if (gate.open > 0) {
        gate.open = Math.max(0, gate.open - (gate.slam ? 1 / 8 : 1 / 100));
        if (gate.open === 0) gate.slam = false;
      }
    }

    if (this.exitOpening) this.exitOpen = Math.min(1, this.exitOpen + 1 / 90);

    // Pisos soltos
    for (const [k, lf] of this.loose) {
      lf.t++;
      if (lf.t >= LOOSE_SHAKE_TICKS) {
        this.loose.delete(k);
        level.setTile(lf.c, lf.r, T.EMPTY);
        this.debris.push({ x: cellCenterX(lf.c), y: floorY(lf.r), vy: 0, c: lf.c });
        this.emit('crumble');
      }
    }
    for (const d of this.debris) {
      const prevY = d.y;
      d.vy = Math.min(d.vy + 0.35, 9);
      d.y += d.vy;
      const k = Math.floor(d.y / TH) - 1;
      const ly = floorY(k);
      // Acerta a cabeça do herói no caminho?
      const h = this.hero;
      if (!d.hitHero && h.state !== 'dead' && Math.abs(h.x - d.x) < TW * 0.6 &&
          prevY < h.y - 40 && d.y >= h.y - 40 && isGrounded(h)) {
        d.hitHero = true;
        h.hp -= 1;
        h.flash = 12;
        this.emit('hurt');
        if (h.hp <= 0) this.killHero('debris');
      }
      if (prevY < ly && ly <= d.y && level.floorAt(d.c, k)) {
        d.done = true;
        this.emit('crash');
        const plate = this.plates.get(key(d.c, k));
        if (plate) plate.rubble = true;
        if (level.tile(d.c, k) === T.LOOSE) this.shakeLoose(d.c, k);
        this.rubble.push({ c: d.c, r: k });
      } else if (d.y > level.rows * TH + TH) {
        d.done = true;
      }
    }
    this.debris = this.debris.filter((d) => !d.done);

    // Espinhos (só visual: saem quando o herói se aproxima)
    const h = this.hero;
    for (const sp of this.spikes.values()) {
      const near = Math.abs(colOf(h.x) - sp.c) <= 1 && Math.abs(Math.round(h.y / TH) - 1 - sp.r) <= 0;
      if (near) {
        if (sp.ext === 0) this.emit('spikes');
        sp.ext = Math.min(1, sp.ext + 0.25);
        sp.idle = 0;
      } else if (sp.ext > 0 && ++sp.idle > 60) {
        sp.ext = Math.max(0, sp.ext - 0.1);
      }
    }
  }

  /** Sala (tela) onde o herói está. */
  heroRoom() {
    const h = this.hero;
    const bodyY = h.state === 'hang' || h.state === 'climbUp' ? h.y - 40 : h.y - 20;
    return {
      rx: Math.floor(h.x / (TW * 10)),
      ry: Math.max(0, Math.floor(bodyY / (TH * 3))),
    };
  }
}
