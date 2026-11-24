// Controles: um direcional virtual (8 direções) e um botão de ação.
// O teclado (setas + espaço/shift) funciona também, para jogar no computador.

function capture(el, id) {
  try {
    el.setPointerCapture(id);
  } catch {
    // Alguns navegadores recusam a captura; o toque continua funcionando.
  }
}

export class Input {
  constructor() {
    this.pad = { left: false, right: false, up: false, down: false };
    this.actionTouch = false;
    this.keys = new Set();
    this.onAnyPress = null;
  }

  state() {
    const k = this.keys;
    return {
      left: this.pad.left || k.has('ArrowLeft'),
      right: this.pad.right || k.has('ArrowRight'),
      up: this.pad.up || k.has('ArrowUp'),
      down: this.pad.down || k.has('ArrowDown'),
      action: this.actionTouch || k.has(' ') || k.has('Shift'),
    };
  }

  attachKeyboard(target = window) {
    const handled = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Shift']);
    target.addEventListener('keydown', (e) => {
      if (!handled.has(e.key)) return;
      e.preventDefault();
      this.keys.add(e.key);
      this.onAnyPress?.();
    });
    target.addEventListener('keyup', (e) => this.keys.delete(e.key));
    target.addEventListener('blur', () => this.keys.clear());
  }

  /** Direcional: a direção vem do ângulo do dedo em relação ao centro. */
  attachDpad(el) {
    const active = new Map();
    const update = () => {
      const p = { left: false, right: false, up: false, down: false };
      for (const d of active.values()) Object.keys(p).forEach((k) => { p[k] ||= d[k]; });
      this.pad = p;
      for (const k of ['left', 'right', 'up', 'down']) el.classList.toggle(`on-${k}`, p[k]);
    };
    const dirFrom = (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dead = r.width * 0.12;
      if (Math.hypot(dx, dy) < dead) return { left: false, right: false, up: false, down: false };
      // 8 setores: diagonais a cada 45°.
      const a = Math.atan2(dy, dx);
      const sector = Math.round(a / (Math.PI / 4)); // -4..4
      return {
        right: [-1, 0, 1].includes(sector),
        down: [1, 2, 3].includes(sector),
        left: [3, 4, -4, -3].includes(sector),
        up: [-3, -2, -1].includes(sector),
      };
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      capture(el, e.pointerId);
      active.set(e.pointerId, dirFrom(e));
      update();
      this.onAnyPress?.();
    });
    el.addEventListener('pointermove', (e) => {
      if (!active.has(e.pointerId)) return;
      active.set(e.pointerId, dirFrom(e));
      update();
    });
    const end = (e) => {
      active.delete(e.pointerId);
      update();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
  }

  attachAction(el) {
    const ids = new Set();
    const update = () => {
      this.actionTouch = ids.size > 0;
      el.classList.toggle('on', this.actionTouch);
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      capture(el, e.pointerId);
      ids.add(e.pointerId);
      update();
      this.onAnyPress?.();
    });
    const end = (e) => {
      ids.delete(e.pointerId);
      update();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
  }
}
