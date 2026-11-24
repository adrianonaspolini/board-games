// Efeitos sonoros sintetizados com Web Audio (sem arquivos de áudio).

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.last = new Map();
  }

  /** Precisa ser chamado num gesto do usuário (toque/tecla). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }

  tone(freq, dur, { type = 'square', vol = 0.3, slide = 0, delay = 0 } = {}) {
    const c = this.ctx;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  noise(dur, { vol = 0.3, freq = 1200, q = 1, delay = 0 } = {}) {
    const c = this.ctx;
    const t0 = c.currentTime + delay;
    const len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    // Evita repetir o mesmo som muitas vezes no mesmo instante.
    const now = this.ctx.currentTime;
    if (now - (this.last.get(name) ?? -1) < 0.05) return;
    this.last.set(name, now);
    switch (name) {
      case 'jump': this.noise(0.12, { freq: 900, vol: 0.15 }); break;
      case 'land': this.noise(0.08, { freq: 220, vol: 0.4 }); break;
      case 'landHard':
        this.noise(0.15, { freq: 160, vol: 0.6 });
        this.tone(180, 0.2, { type: 'sawtooth', vol: 0.15, slide: -80 });
        break;
      case 'bump': this.noise(0.08, { freq: 300, vol: 0.35 }); break;
      case 'grab': this.noise(0.05, { freq: 2000, vol: 0.12 }); break;
      case 'hurt': this.tone(220, 0.18, { type: 'sawtooth', vol: 0.2, slide: -100 }); break;
      case 'death':
        this.tone(330, 0.6, { type: 'triangle', vol: 0.3, slide: -250 });
        this.tone(247, 0.8, { type: 'triangle', vol: 0.2, slide: -180, delay: 0.25 });
        break;
      case 'swing':
      case 'whoosh': this.noise(0.12, { freq: 2600, vol: 0.12, q: 2 }); break;
      case 'clang':
        this.tone(1450, 0.25, { type: 'square', vol: 0.12 });
        this.tone(2170, 0.2, { type: 'triangle', vol: 0.12 });
        break;
      case 'hit':
        this.noise(0.1, { freq: 700, vol: 0.4 });
        this.tone(150, 0.12, { type: 'square', vol: 0.15, slide: -60 });
        break;
      case 'draw': this.tone(1800, 0.25, { type: 'triangle', vol: 0.08, slide: 600 }); break;
      case 'guardDown': this.tone(200, 0.5, { type: 'sawtooth', vol: 0.15, slide: -140 }); break;
      case 'click': this.tone(900, 0.04, { vol: 0.15 }); break;
      case 'gate': this.noise(0.5, { freq: 500, vol: 0.12, q: 4 }); break;
      case 'slam': this.noise(0.2, { freq: 250, vol: 0.5 }); break;
      case 'rumble': this.noise(0.3, { freq: 120, vol: 0.25 }); break;
      case 'crumble': this.noise(0.25, { freq: 400, vol: 0.3 }); break;
      case 'crash': this.noise(0.3, { freq: 200, vol: 0.55 }); break;
      case 'spikes': this.tone(2400, 0.08, { type: 'triangle', vol: 0.1, slide: 800 }); break;
      case 'potion':
        for (let i = 0; i < 4; i++) this.tone(400 + i * 120, 0.08, { type: 'sine', vol: 0.2, delay: i * 0.07 });
        break;
      case 'exitOpening': this.noise(1.2, { freq: 150, vol: 0.2, q: 2 }); break;
      case 'exit':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', vol: 0.2, delay: i * 0.12 }));
        break;
      default: break;
    }
  }
}
