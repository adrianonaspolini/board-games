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

  /**
   * Grupo de botões para uma mão. Cada dedo ativa o botão sob ele e pode
   * deslizar para outro botão do mesmo grupo sem levantar (ex.: de ▲ para
   * Ação durante um pulo). Vários dedos ao mesmo tempo também funcionam.
   */
  attachGroup(el) {
    const keys = [...el.querySelectorAll('[data-key]')];
    const fingers = new Map(); // pointerId -> nome da tecla (ou null)

    const keyAt = (x, y) => {
      for (const k of keys) {
        const r = k.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return k.dataset.key;
      }
      return null;
    };
    const update = () => {
      const held = new Set(fingers.values());
      for (const k of keys) {
        const name = k.dataset.key;
        const on = held.has(name);
        k.classList.toggle('on', on);
        if (name === 'action') this.actionTouch = on;
        else this.pad[name] = on;
      }
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      capture(el, e.pointerId);
      fingers.set(e.pointerId, keyAt(e.clientX, e.clientY));
      update();
      this.onAnyPress?.();
    });
    el.addEventListener('pointermove', (e) => {
      if (!fingers.has(e.pointerId)) return;
      const k = keyAt(e.clientX, e.clientY);
      if (k !== fingers.get(e.pointerId)) {
        fingers.set(e.pointerId, k);
        update();
      }
    });
    const end = (e) => {
      fingers.delete(e.pointerId);
      update();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}
