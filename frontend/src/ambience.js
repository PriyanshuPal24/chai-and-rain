const rand = (a, b) => a + Math.random() * (b - a);

// Web Audio ambience: rain on plastic, distant tyres in puddles, boiling and pouring chai.
class Ambience {
  constructor() {
    this.ctx = null;
    this.wantRain = false;
    this.rainOn = false;
    this.gen = 0;
    this.volume = 0.7;
  }

  setVolume(v) {
    this.volume = v;
    if (this.ctx) this._applyRain();
  }

  setRain(on) {
    this.wantRain = on;
    if (this.ctx) this._applyRain();
  }

  // Browsers only allow audio after a user gesture.
  unlock() {
    if (!this.ctx) this._init();
    this.ctx.resume();
    this._applyRain();
  }

  order() {
    this.unlock();
    const t = this.ctx.currentTime;
    this._boil(t + 0.05);
    this._pour(t + 2.3);
  }

  thunder() {
    if (!this.ctx || !this.rainOn) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.brown;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1.2 * (this.volume / 0.7), t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    s.connect(this._filter("lowpass", 240)).connect(g).connect(this.buses.fx);
    s.start(t, rand(0, 0.5), 3.2);
  }

  _init() {
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const comp = ctx.createDynamicsCompressor();
    const master = ctx.createGain();
    master.connect(comp).connect(ctx.destination);
    const bus = (v) => { const g = ctx.createGain(); g.gain.value = v; g.connect(master); return g; };
    this.buses = { rain: bus(0), amb: bus(0), fx: bus(1) };

    this.white = this._noise(4, "white");
    this.brown = this._noise(4, "brown");

    const out = this.buses.rain;
    this._loop(this.brown).connect(this._filter("lowpass", 900)).connect(this._gain(0.9)).connect(out);
    const hiss = this._gain(0.12);
    this._loop(this.white).connect(this._filter("bandpass", 5000, 0.4)).connect(hiss).connect(out);
    // Slow gusts so the downpour breathes.
    setInterval(() => hiss.gain.setTargetAtTime(rand(0.07, 0.2), ctx.currentTime, 1.2), 3000);
  }

  _applyRain() {
    const t = this.ctx.currentTime;
    this.buses.rain.gain.setTargetAtTime(this.wantRain ? this.volume : 0, t, 0.1);
    this.buses.amb.gain.setTargetAtTime(this.wantRain ? this.volume * 0.85 : 0, t, 0.1);
    if (this.wantRain === this.rainOn) return;
    this.rainOn = this.wantRain;
    this.gen += 1;
    if (this.rainOn) {
      this._patter(this.gen);
      this._scheduleVehicle(this.gen, 2500);
    }
  }

  _noise(seconds, type) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (type === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }

  _loop(buffer) {
    const s = this.ctx.createBufferSource();
    s.buffer = buffer; s.loop = true;
    s.start(0, Math.random() * 3);
    return s;
  }

  _filter(type, freq, q = 1) {
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    return f;
  }

  _gain(v) { const g = this.ctx.createGain(); g.gain.value = v; return g; }

  _burst(dest, t, dur, { buf = this.white, type = "bandpass", freq = 2000, q = 1, peak = 0.2 }) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(this._filter(type, freq, q)).connect(g).connect(dest);
    s.start(t, rand(0, 3.5), dur + 0.02);
  }

  _blip(dest, t, f0, f1, dur, peak) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // Droplets striking the plastic sheet overhead.
  _patter(gen) {
    if (gen !== this.gen) return;
    this._burst(this.buses.rain, this.ctx.currentTime, 0.03, {
      freq: rand(1200, 4000), q: rand(3, 8), peak: rand(0.05, 0.25),
    });
    setTimeout(() => this._patter(gen), rand(12, 55));
  }

  _scheduleVehicle(gen, delay) {
    setTimeout(() => {
      if (gen !== this.gen) return;
      this._vehicle();
      this._scheduleVehicle(gen, rand(5000, 13000));
    }, delay);
  }

  _vehicle() {
    const ctx = this.ctx, t = ctx.currentTime, dur = rand(3, 5), mid = t + dur / 2;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const pan = ctx.createStereoPanner();
    pan.pan.setValueAtTime(-0.9 * dir, t);
    pan.pan.linearRampToValueAtTime(0.9 * dir, t + dur);
    pan.connect(this.buses.amb);

    const whoosh = ctx.createBufferSource();
    whoosh.buffer = this.brown; whoosh.loop = true;
    const bp = this._filter("bandpass", 250, 1.2);
    bp.frequency.setValueAtTime(250, t);
    bp.frequency.exponentialRampToValueAtTime(900, mid);
    bp.frequency.exponentialRampToValueAtTime(300, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, mid);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    whoosh.connect(bp).connect(g).connect(pan);
    whoosh.start(t, rand(0, 3), dur + 0.1);

    const eng = ctx.createOscillator();
    eng.type = "sawtooth";
    eng.frequency.setValueAtTime(rand(48, 60), t);
    eng.frequency.linearRampToValueAtTime(rand(62, 80), mid);
    eng.frequency.linearRampToValueAtTime(rand(44, 56), t + dur);
    const eg = ctx.createGain();
    eg.gain.setValueAtTime(0.0001, t);
    eg.gain.linearRampToValueAtTime(0.07, mid);
    eg.gain.linearRampToValueAtTime(0.0001, t + dur);
    eng.connect(this._filter("lowpass", 220)).connect(eg).connect(pan);
    eng.start(t); eng.stop(t + dur + 0.1);

    // Tyre hitting a puddle at closest approach.
    this._burst(pan, mid - 0.15, 0.6, { freq: 1600, q: 0.7, peak: 0.35 });
    this._burst(pan, mid - 0.1, 0.9, { type: "highpass", freq: 3500, peak: 0.15 });
  }

  _boil(t) {
    const out = this.buses.fx, dur = 2.6;
    const rumble = this.ctx.createBufferSource();
    rumble.buffer = this.brown; rumble.loop = true;
    const rg = this.ctx.createGain();
    rg.gain.setValueAtTime(0.0001, t);
    rg.gain.linearRampToValueAtTime(0.35, t + dur * 0.8);
    rg.gain.linearRampToValueAtTime(0.0001, t + dur);
    rumble.connect(this._filter("lowpass", 450)).connect(rg).connect(out);
    rumble.start(t, 0, dur + 0.1);

    const steam = this.ctx.createBufferSource();
    steam.buffer = this.white; steam.loop = true;
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.linearRampToValueAtTime(0.08, t + dur * 0.9);
    sg.gain.linearRampToValueAtTime(0.0001, t + dur);
    steam.connect(this._filter("highpass", 4500)).connect(sg).connect(out);
    steam.start(t, 0, dur + 0.1);

    // Bubbles get denser as the milk comes to a boil.
    let bt = 0;
    while (bt < dur - 0.1) {
      const f0 = rand(180, 520);
      this._blip(out, t + bt, f0, f0 * rand(1.5, 2.4), rand(0.04, 0.09), rand(0.08, 0.2));
      bt += Math.max(0.025, rand(0.16, 0.3) * (1 - (bt / dur) * 0.85));
    }
  }

  _pour(t) {
    const out = this.buses.fx, dur = 2.4;
    const stream = this.ctx.createBufferSource();
    stream.buffer = this.white; stream.loop = true;
    const bp = this._filter("bandpass", 1200, 0.8);
    bp.frequency.setValueAtTime(1200, t);
    bp.frequency.linearRampToValueAtTime(2600, t + dur); // pitch climbs as the glass fills
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.15);
    g.gain.setValueAtTime(0.4, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    stream.connect(bp).connect(g).connect(out);
    stream.start(t, 0, dur + 0.1);

    for (let bt = 0; bt < dur; bt += rand(0.05, 0.12)) {
      const f = 260 + (bt / dur) * 500;
      this._blip(out, t + bt, f, f * 1.3, 0.07, 0.05);
    }

    // Fizz and the splash of hot tea settling.
    for (let ft = 0; ft < dur + 1.5; ft += rand(0.01, 0.05)) {
      const fade = 1 - Math.max(0, ft - dur) / 1.5;
      this._burst(out, t + ft, 0.02, { type: "highpass", freq: 6500, peak: rand(0.03, 0.12) * fade });
    }
    this._burst(out, t + 0.05, 0.4, { freq: 900, q: 0.6, peak: 0.25 });

    // Spoon tinks the glass.
    this._blip(out, t + dur + 0.2, 3100, 3000, 0.7, 0.07);
    this._blip(out, t + dur + 0.2, 4700, 4600, 0.5, 0.04);
  }
}

export const ambience = new Ambience();
