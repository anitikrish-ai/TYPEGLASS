/**
 * LiquidType Procedural Audio Synthesizer
 * 100% offline, zero external dependencies, Web Audio API powered.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volume = 0.65;
    this.profile = 'liquid'; // 'liquid' | 'mechanical' | 'thock' | 'membrane' | 'arcade'
    this.initialized = false;
  }

  init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(percent) {
    this.volume = Math.max(0, Math.min(1, percent / 100));
  }

  setMuted(muted) {
    this.isMuted = !!muted;
  }

  setProfile(profile) {
    this.profile = profile || 'liquid';
  }

  playKeyPress(key = '') {
    if (this.isMuted || this.volume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);

    // Profile specific synthesizers
    switch (this.profile) {
      case 'liquid': {
        // High quality droplet / liquid glass tap
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        
        // Randomize pitch slightly for organic variation
        const baseFreq = 800 + (Math.random() * 120 - 60);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, t + 0.045);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(4.0, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.28 * this.volume, t + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

        osc.connect(filter);
        filter.connect(gain);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      }

      case 'mechanical': {
        // Snappy clicky switch (like Cherry Blue)
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2200, t);
        osc.frequency.exponentialRampToValueAtTime(350, t + 0.025);

        // Noise transient
        const bufferSize = this.ctx.sampleRate * 0.015;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 3000;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35 * this.volume, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

        gain.gain.setValueAtTime(0.25 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        osc.connect(gain);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        osc.start(t);
        noise.start(t);
        osc.stop(t + 0.035);
        break;
      }

      case 'thock': {
        // Deep, creamy lubricated mechanical switch
        const osc = this.ctx.createOscillator();
        const baseFreq = 220 + (Math.random() * 30 - 15);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.04);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.4 * this.volume, t + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

        osc.connect(filter);
        filter.connect(gain);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      }

      case 'membrane': {
        // Quiet soft cushion
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.03);

        gain.gain.setValueAtTime(0.12 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.035);
        break;
      }

      case 'arcade': {
        // Retro 8-bit blip
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        const notes = [440, 523.25, 587.33, 659.25, 783.99];
        const note = notes[Math.floor(Math.random() * notes.length)];
        osc.frequency.setValueAtTime(note, t);

        gain.gain.setValueAtTime(0.08 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.045);
        break;
      }
    }
  }

  playError() {
    if (this.isMuted || this.volume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(95, t + 0.09);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    gain.gain.setValueAtTime(0.22 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  playSuccess() {
    if (this.isMuted || this.volume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  playAchievement() {
    if (this.isMuted || this.volume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const chords = [
      { freq: 440, delay: 0 },
      { freq: 554.37, delay: 0.08 },
      { freq: 659.25, delay: 0.16 },
      { freq: 880, delay: 0.24 },
      { freq: 1108.73, delay: 0.32 },
      { freq: 1318.51, delay: 0.40 }
    ];

    chords.forEach(({ freq, delay }) => {
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22 * this.volume, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  playUI() {
    if (this.isMuted || this.volume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.03);

    gain.gain.setValueAtTime(0.08 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }
}

export const soundManager = new SoundEngine();
