import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game.js';
import { WALKTHROUGHS } from './walkthroughs.js';
import { hold } from './helpers.js';

describe('jogo', () => {
  it('morrer reinicia a fase e o relógio continua', () => {
    const g = new Game();
    const t0 = g.ticksLeft;
    // corre direto para os espinhos
    for (let i = 0; i < 400 && g.deaths === 0; i++) g.step({ right: true });
    expect(g.deaths).toBe(1);
    expect(g.world.hero.state).toBe('stand');
    expect(g.ticksLeft).toBeLessThan(t0);
  });

  it('o tempo acabar encerra o jogo', () => {
    const g = new Game({ timeLimit: 2 });
    for (let i = 0; i < 200; i++) g.step({});
    expect(g.phase).toBe('timeUp');
  });

  it('vencer todas as fases em sequência', () => {
    const g = new Game();
    for (let n = 0; n < g.levels.length; n++) {
      expect(g.levelIndex).toBe(n);
      WALKTHROUGHS[n](g.world);
      // o roteiro avança o mundo diretamente; o jogo percebe a vitória
      g.step({});
      if (n < g.levels.length - 1) {
        expect(g.phase).toBe('levelDone');
        for (let i = 0; i < 130; i++) g.step({});
      }
    }
    expect(g.phase).toBe('won');
    expect(g.maxHp).toBe(4); // bebeu a poção grande da fase 3
    hold(g.world, '', 1);
  });
});
