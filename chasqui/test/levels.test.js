import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/game/levels/index.js';
import { World } from '../src/game/world.js';
import { WALKTHROUGHS } from './walkthroughs.js';

describe('fases', () => {
  it.each(LEVELS.map((l, i) => [i + 1, l]))('fase %i é válida', (_n, def) => {
    const w = new World(def);
    expect(w.hero).toBeTruthy();
    expect(w.level.find('E').length).toBe(1);
    expect(w.level.find('k').length).toBeGreaterThanOrEqual(1);
  });

  it.each(LEVELS.map((l, i) => [i + 1, l]))('fase %i pode ser vencida', (n, def) => {
    const w = new World(def);
    WALKTHROUGHS[n - 1](w);
    expect(w.status).toBe('won');
  });
});
