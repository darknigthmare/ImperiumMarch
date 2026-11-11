/** Original procedural sound design. No remote audio or third-party samples. */
export class AudioEngine {
  constructor() { this.context = null; this.master = null; this.volume = 0.55; this.lastStep = -1; }
  async unlock() {
    try {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio) return;
      if (!this.context) {
        this.context = new Audio();
        this.master = this.context.createGain();
        this.master.gain.value = this.volume * 0.34;
        this.master.connect(this.context.destination);
        this.noise = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
        const channel = this.noise.getChannelData(0);
        // Reproducible pinkish machinery texture, unrelated to gameplay RNG.
        let value = 0, seed = 6147;
        for (let i = 0; i < channel.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; value = (value + (seed / 4294967296 * 2 - 1) * .09) / 1.09; channel[i] = value * 3; }
      }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* Audio is optional; denial must never stop a mission. */ }
  }
  setVolume(value) { this.volume = Math.max(0, Math.min(1, value)); if (this.master) this.master.gain.setTargetAtTime(this.volume * .34, this.context.currentTime, .05); }
  tone(freq, end, length, level = .5, type = 'sine', delay = 0) {
    if (!this.context || this.context.state !== 'running' || !this.volume) return;
    const c = this.context, t = c.currentTime + delay, osc = c.createOscillator(), gain = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(Math.max(8, end), t + length);
    gain.gain.setValueAtTime(.001, t); gain.gain.linearRampToValueAtTime(level, t + .008); gain.gain.exponentialRampToValueAtTime(.001, t + length);
    osc.connect(gain).connect(this.master); osc.start(t); osc.stop(t + length + .02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  hiss(length, level = .3, cutoff = 800, delay = 0) {
    if (!this.context || this.context.state !== 'running' || !this.volume) return;
    const c = this.context, t = c.currentTime + delay, source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    source.buffer = this.noise; filter.type = 'lowpass'; filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(level, t); gain.gain.exponentialRampToValueAtTime(.001, t + length);
    source.connect(filter).connect(gain).connect(this.master); source.start(t); source.stop(t + length + .02);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  event(type) {
    if (type === 'shot') { this.tone(125, 35, .12, .48, 'triangle'); this.hiss(.07, .5, 2800); }
    if (type === 'rocket') { this.hiss(.5, .65, 1600); this.tone(90, 28, .4, .55); }
    if (type === 'step') { this.tone(60, 19, .34, .72); this.hiss(.2, .4, 480); this.tone(180, 75, .08, .12, 'triangle', .05); }
    if (type === 'hit') { this.hiss(.11, .26, 3800); this.tone(250, 74, .15, .18, 'triangle'); }
    if (type === 'explosion') { this.hiss(.6, .65, 850); this.tone(85, 17, .65, .6); }
    if (type === 'reload') { this.hiss(.08, .22, 2400); this.hiss(.07, .28, 1700, .25); }
    if (['objective', 'decision', 'radio'].includes(type)) { this.tone(570, 570, .08, .065); this.tone(850, 850, .1, .045, 'sine', .1); }
    if (type === 'overheat') { this.tone(310, 230, .35, .18, 'triangle'); this.hiss(.7, .17, 3000); }
    if (type === 'victory') { [220, 277, 330].forEach((f, i) => this.tone(f, f, .8, .07, 'sine', i * .12)); }
    if (type === 'defeat') { this.tone(155, 48, 1.5, .16, 'triangle'); }
  }
}
