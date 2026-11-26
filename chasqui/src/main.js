import { TICKS_PER_SECOND } from './engine/constants.js';
import { Game } from './game/game.js';
import { Input } from './input/input.js';
import { Renderer } from './render/renderer.js';
import { Sfx } from './audio/sfx.js';

const canvas = document.getElementById('screen');
const stage = document.getElementById('stage');
const renderer = new Renderer(canvas);
const input = new Input();
const sfx = new Sfx();

let mode = 'title';
let game = null;
let frame = 0;

function fit() {
  renderer.resize(stage.clientWidth, stage.clientHeight);
}
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 200));

function startGame() {
  game = new Game();
  mode = 'playing';
  window.__game = game; // facilita testes automatizados
}

// Ganchos para testes automatizados no navegador.
window.__debug = {
  setGame(g) {
    game = g;
    mode = 'playing';
    window.__game = g;
  },
};

function onPress() {
  sfx.unlock();
  if (mode === 'title') startGame();
  else if (game && (game.phase === 'won' || game.phase === 'timeUp') && game.phaseTicks > 60) startGame();
}
input.onAnyPress = onPress;
input.attachKeyboard();
input.attachGroup(document.getElementById('pad-left'));
input.attachGroup(document.getElementById('pad-right'));
canvas.addEventListener('pointerdown', onPress);

const STEP = 1000 / TICKS_PER_SECOND;
let last = performance.now();
let acc = 0;

function loop(now) {
  acc += Math.min(250, now - last);
  last = now;
  while (acc >= STEP) {
    acc -= STEP;
    frame++;
    if (mode === 'playing' && game) {
      game.step(input.state());
      for (const e of game.world.drainEvents()) sfx.play(e);
    }
  }
  if (mode === 'title') renderer.drawTitle(frame);
  else renderer.drawGame(game, frame);
  requestAnimationFrame(loop);
}

document.addEventListener('visibilitychange', () => {
  last = performance.now();
  acc = 0;
});

fit();
requestAnimationFrame(loop);
