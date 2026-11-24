// Sequência de fases, relógio e reinícios. Lógica pura.

import { TICKS_PER_SECOND, TIME_LIMIT_SECONDS } from '../engine/constants.js';
import { LEVELS } from './levels/index.js';
import { World } from './world.js';

export class Game {
  constructor({ levels = LEVELS, timeLimit = TIME_LIMIT_SECONDS, seed = 7 } = {}) {
    this.levels = levels;
    this.seed = seed;
    this.ticksLeft = timeLimit * TICKS_PER_SECOND;
    this.levelIndex = 0;
    this.maxHp = 3;
    this.deaths = 0;
    this.phase = 'playing'; // 'playing' | 'levelDone' | 'won' | 'timeUp'
    this.phaseTicks = 0;
    this.startLevel();
  }

  get level() {
    return this.levels[this.levelIndex];
  }

  startLevel() {
    this.world = new World(this.level, {
      seed: this.seed + this.levelIndex * 101 + this.deaths,
      hp: this.maxHp,
      maxHp: this.maxHp,
    });
    this.phase = 'playing';
    this.phaseTicks = 0;
  }

  get secondsLeft() {
    return Math.max(0, Math.ceil(this.ticksLeft / TICKS_PER_SECOND));
  }

  step(input) {
    this.phaseTicks++;
    if (this.phase !== 'playing') {
      if (this.phase === 'levelDone' && this.phaseTicks >= 120) {
        this.levelIndex++;
        this.startLevel();
      }
      return;
    }
    this.world.step(input);
    this.ticksLeft--;
    if (this.ticksLeft <= 0) {
      this.phase = 'timeUp';
      this.phaseTicks = 0;
      return;
    }
    if (this.world.status === 'dead') {
      this.deaths++;
      this.startLevel();
    } else if (this.world.status === 'won') {
      // A vida máxima conquistada (poção grande) continua nas fases seguintes.
      this.maxHp = this.world.hero.maxHp;
      this.phase = this.levelIndex + 1 >= this.levels.length ? 'won' : 'levelDone';
      this.phaseTicks = 0;
    }
  }
}
