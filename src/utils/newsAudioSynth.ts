// Web Audio API Synthesis Engine for Broadcast News Music
// Zero external dependencies, zero CORS errors, works 100% in browser!

export type NewsTrackType = 'breaking_pulse' | 'cyber_ticker' | 'investigation' | 'primetime_fanfare';

export interface NewsTrackInfo {
  id: NewsTrackType;
  name: string;
  tempo: number; // BPM
  description: string;
  vibeEmoji: string;
}

export const NEWS_TRACKS: NewsTrackInfo[] = [
  {
    id: 'breaking_pulse',
    name: '🚨 Breaking News Pulse',
    tempo: 124,
    description: 'Dramatic low-end urgency with rhythmic breaking news ticker pulse',
    vibeEmoji: '🚨',
  },
  {
    id: 'cyber_ticker',
    name: '⚡ High-Tech Live Wire',
    tempo: 132,
    description: 'Rapid electronic arpeggio with high-velocity broadcast synths',
    vibeEmoji: '⚡',
  },
  {
    id: 'investigation',
    name: '🔍 Deep Investigative Wire',
    tempo: 110,
    description: 'Tense atmospheric pad with cinematic heartbeat sub-drops',
    vibeEmoji: '🔍',
  },
  {
    id: 'primetime_fanfare',
    name: '🏆 Prime Time Global Desk',
    tempo: 120,
    description: 'Upbeat major-chord broadcast fanfare with punchy rhythm section',
    vibeEmoji: '🏆',
  },
];

class NewsAudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private timer: any = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private step: number = 0;
  private currentTrack: NewsTrackType = 'breaking_pulse';
  private volume: number = 0.6;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public setTrack(track: NewsTrackType) {
    const wasRunning = this.isRunning;
    if (wasRunning) {
      this.stop();
    }
    this.currentTrack = track;
    if (wasRunning) {
      this.start(track);
    }
  }

  public start(track: NewsTrackType = 'breaking_pulse') {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    this.currentTrack = track;
    this.isRunning = true;
    this.step = 0;

    const trackObj = NEWS_TRACKS.find((t) => t.id === track) || NEWS_TRACKS[0];
    const beatIntervalMs = (60 / trackObj.tempo / 4) * 1000; // 16th note steps

    this.timer = setInterval(() => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      this.triggerStep(this.step, this.currentTrack);
      this.step = (this.step + 1) % 16;
    }, beatIntervalMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public isPlayingNow(): boolean {
    return this.isRunning;
  }

  public getAnalyserData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(16);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  private triggerStep(step: number, track: NewsTrackType) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    switch (track) {
      case 'breaking_pulse':
        this.playBreakingPulse(step, now);
        break;
      case 'cyber_ticker':
        this.playCyberTicker(step, now);
        break;
      case 'investigation':
        this.playInvestigation(step, now);
        break;
      case 'primetime_fanfare':
        this.playPrimeTime(step, now);
        break;
    }
  }

  // TRACK 1: BREAKING NEWS PULSE
  private playBreakingPulse(step: number, now: number) {
    // Kick on beats 0, 4, 8, 12 + extra drive on 14
    if (step === 0 || step === 4 || step === 8 || step === 12 || step === 14) {
      this.playKick(now, step === 0 ? 1.0 : 0.85);
    }

    // Snare / clap on beats 4 and 12
    if (step === 4 || step === 12) {
      this.playSnare(now, 0.7);
    }

    // Hi-hat tick on every even 16th note
    if (step % 2 === 0) {
      this.playHat(now, step % 4 === 2 ? 0.35 : 0.2);
    }

    // Urgent bass arp (D minor notes: D2, F2, A2, C3)
    const notes = [73.42, 87.31, 110.0, 130.81, 73.42, 73.42, 87.31, 110.0];
    const freq = notes[step % notes.length];
    this.playSynthNote(now, freq, 0.12, 'sawtooth', 0.25, 450);
  }

  // TRACK 2: CYBER HIGH-TECH LIVE WIRE
  private playCyberTicker(step: number, now: number) {
    // Four on the floor kick
    if (step % 4 === 0) {
      this.playKick(now, 0.9);
    }
    // High-tech snappy clap on 4 and 12
    if (step === 4 || step === 12) {
      this.playSnare(now, 0.6);
    }
    // Fast 16th note metallic hi-hats
    this.playHat(now, step % 2 === 0 ? 0.25 : 0.15);

    // Fast bubbling synth lead (A minor / Pentatonic)
    const arpFreqs = [220, 261.63, 293.66, 329.63, 392.0, 440.0, 329.63, 261.63];
    const note = arpFreqs[step % arpFreqs.length];
    this.playSynthNote(now, note, 0.08, 'square', 0.2, 900);
  }

  // TRACK 3: DEEP INVESTIGATION
  private playInvestigation(step: number, now: number) {
    // Slow cinematic heartbeats on 0 and 8
    if (step === 0 || step === 8) {
      this.playSubDrop(now, 0.9);
    }
    // Subtle suspense tick on 2, 6, 10, 14
    if (step % 4 === 2) {
      this.playHat(now, 0.15);
    }
    // Dark ominous bass drone note on 0 and 8
    if (step === 0 || step === 8) {
      this.playSynthNote(now, 55, 0.8, 'sawtooth', 0.35, 280);
    }
  }

  // TRACK 4: PRIME TIME GLOBAL DESK
  private playPrimeTime(step: number, now: number) {
    if (step % 4 === 0) {
      this.playKick(now, 0.85);
    }
    if (step === 4 || step === 12) {
      this.playSnare(now, 0.8);
    }
    if (step % 2 === 0) {
      this.playHat(now, 0.25);
    }

    // Triumphant broadcast chords (C Major / G Major triad)
    if (step === 0 || step === 6 || step === 10) {
      const chord = step === 0 ? [261.63, 329.63, 392.0] : [293.66, 369.99, 440.0];
      chord.forEach((f) => {
        this.playSynthNote(now, f, 0.25, 'triangle', 0.18, 1200);
      });
    }
  }

  // SOUND PRIMITIVES
  private playKick(time: number, gainVal: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(gainVal * 0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.18);
  }

  private playSubDrop(time: number, gainVal: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.35);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.4);
  }

  private playSnare(time: number, gainVal: number) {
    if (!this.ctx || !this.masterGain) return;
    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.13);
  }

  private playHat(time: number, gainVal: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  private playSynthNote(
    time: number,
    freq: number,
    duration: number,
    type: OscillatorType,
    gainVal: number,
    cutoff: number
  ) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration + 0.01);
  }
}

export const newsAudioSynth = new NewsAudioEngine();
