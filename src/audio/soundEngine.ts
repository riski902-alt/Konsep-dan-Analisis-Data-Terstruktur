import type { AudioSettings, TeamId } from '../types/game';

class RacingSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private idleOsc1: OscillatorNode | null = null;
  private idleOsc2: OscillatorNode | null = null;
  private idleFilter: BiquadFilterNode | null = null;
  private idleRunning = false;

  private musicTimer: number | null = null;
  private musicStep = 0;
  private isVictoryMusic = false;

  private settings: AudioSettings = {
    muted: false,
    musicEnabled: true,
    musicVolume: 0.28,
    engineVolume: 0.45,
    sfxVolume: 0.65,
  };

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.engineGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.engineGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyGains();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public updateSettings(next: AudioSettings): void {
    this.settings = { ...next };
    this.applyGains();
    if (!this.settings.musicEnabled || this.settings.muted) {
      this.stopMusicLoop();
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  private applyGains(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.engineGain || !this.sfxGain) {
      return;
    }
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.settings.muted ? 0 : 0.9, now, 0.03);
    this.musicGain.gain.setTargetAtTime(
      this.settings.musicEnabled ? this.settings.musicVolume : 0,
      now,
      0.04,
    );
    this.engineGain.gain.setTargetAtTime(this.settings.engineVolume, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.04);
  }

  public startEngineIdle(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.engineGain || this.idleRunning) return;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 210;
    filter.Q.value = 3.5;

    const subGain = ctx.createGain();
    subGain.gain.value = 0.16;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 54;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 108.5;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(subGain);
    subGain.connect(this.engineGain);

    osc1.start();
    osc2.start();

    this.idleOsc1 = osc1;
    this.idleOsc2 = osc2;
    this.idleFilter = filter;
    this.idleRunning = true;
  }

  public stopEngineIdle(): void {
    if (!this.idleRunning) return;
    try {
      this.idleOsc1?.stop();
      this.idleOsc2?.stop();
      this.idleOsc1?.disconnect();
      this.idleOsc2?.disconnect();
      this.idleFilter?.disconnect();
    } catch {
      // ignore
    }
    this.idleOsc1 = null;
    this.idleOsc2 = null;
    this.idleFilter = null;
    this.idleRunning = false;
  }

  public playEngineRevStart(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.engineGain) return;
    this.startEngineIdle();

    const now = ctx.currentTime;
    if (this.idleOsc1 && this.idleOsc2 && this.idleFilter) {
      this.idleOsc1.frequency.cancelScheduledValues(now);
      this.idleOsc2.frequency.cancelScheduledValues(now);
      this.idleFilter.frequency.cancelScheduledValues(now);

      this.idleOsc1.frequency.setValueAtTime(55, now);
      this.idleOsc1.frequency.exponentialRampToValueAtTime(145, now + 0.35);
      this.idleOsc1.frequency.exponentialRampToValueAtTime(62, now + 0.9);

      this.idleOsc2.frequency.setValueAtTime(110, now);
      this.idleOsc2.frequency.exponentialRampToValueAtTime(290, now + 0.35);
      this.idleOsc2.frequency.exponentialRampToValueAtTime(124, now + 0.9);

      this.idleFilter.frequency.setValueAtTime(220, now);
      this.idleFilter.frequency.exponentialRampToValueAtTime(950, now + 0.35);
      this.idleFilter.frequency.exponentialRampToValueAtTime(240, now + 0.9);
    }
  }

  public setCruiseMode(cruising: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.idleRunning) {
      this.startEngineIdle();
    }
    const now = ctx.currentTime;
    if (this.idleOsc1 && this.idleOsc2 && this.idleFilter) {
      this.idleOsc1.frequency.cancelScheduledValues(now);
      this.idleOsc2.frequency.cancelScheduledValues(now);
      this.idleFilter.frequency.cancelScheduledValues(now);

      const baseFreq = cruising ? 72 : 54;
      this.idleOsc1.frequency.setTargetAtTime(baseFreq, now, 0.25);
      this.idleOsc2.frequency.setTargetAtTime(baseFreq * 2.01, now, 0.25);
      this.idleFilter.frequency.setTargetAtTime(cruising ? 310 : 210, now, 0.25);
    }
  }

  public playCorrectAcceleration(team: TeamId): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.engineGain || !this.sfxGain) return;

    const now = ctx.currentTime;
    const panVal = team === 'lamacca' ? -0.45 : 0.45;

    // 1. High-speed sportbike turbo acceleration roar (Engine bus)
    const pannerEngine = ctx.createStereoPanner();
    pannerEngine.pan.value = panVal;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(295, now + 0.34);
    osc.frequency.setValueAtTime(215, now + 0.36); // quickshift!
    osc.frequency.exponentialRampToValueAtTime(410, now + 0.85);
    osc.frequency.exponentialRampToValueAtTime(82, now + 1.24);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.exponentialRampToValueAtTime(1650, now + 0.78);
    filter.Q.value = 1.7;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.01, now);
    env.gain.linearRampToValueAtTime(0.48, now + 0.07);
    env.gain.exponentialRampToValueAtTime(0.001, now + 1.26);

    osc.connect(filter);
    filter.connect(env);
    env.connect(pannerEngine);
    pannerEngine.connect(this.engineGain);
    osc.start(now);
    osc.stop(now + 1.28);

    // 2. Positive confirmation synth arpeggio (SFX bus)
    const notes = team === 'lamacca' ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 739.99, 880, 1174.66];
    notes.forEach((freq, idx) => {
      const sOsc = ctx.createOscillator();
      sOsc.type = 'triangle';
      sOsc.frequency.setValueAtTime(freq, now + idx * 0.06);

      const sEnv = ctx.createGain();
      sEnv.gain.setValueAtTime(0.001, now + idx * 0.06);
      sEnv.gain.linearRampToValueAtTime(0.24, now + idx * 0.06 + 0.02);
      sEnv.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);

      const sPan = ctx.createStereoPanner();
      sPan.pan.value = panVal;

      sOsc.connect(sEnv);
      sEnv.connect(sPan);
      sPan.connect(this.sfxGain!);
      sOsc.start(now + idx * 0.06);
      sOsc.stop(now + idx * 0.06 + 0.3);
    });

    // Subtle crowd cheer burst
    this.playCrowdCheer(0.45, 0.14);
  }

  public playWrongEffect(team: TeamId): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const panVal = team === 'lamacca' ? -0.45 : 0.45;
    const panner = ctx.createStereoPanner();
    panner.pan.value = panVal;

    // Gentle two-note descending cue (non-harsh)
    const freqs = [260, 195];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + i * 0.14);

      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = 520;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.01, now + i * 0.14);
      env.gain.linearRampToValueAtTime(0.22, now + i * 0.14 + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.22);

      osc.connect(flt);
      flt.connect(env);
      env.connect(panner);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.24);
    });

    panner.connect(this.sfxGain);
  }

  public playCountdownBeep(isGo: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    if (!isGo) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.01, now);
      env.gain.linearRampToValueAtTime(0.38, now + 0.015);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // GO! Bright chord + engine roar + stadium crowd!
      [880, 1108.73, 1318.51].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.01, now);
        env.gain.linearRampToValueAtTime(0.32, now + 0.02);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(env);
        env.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + 0.68);
      });
      this.playEngineRevStart();
      this.playCrowdCheer(1.1, 0.26);
    }
  }

  public playCrowdCheer(durationSec = 1.0, peakGain = 0.22): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 950;
    filter.Q.value = 0.85;

    const now = ctx.currentTime;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(peakGain, now + durationSec * 0.25);
    env.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    noise.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + durationSec + 0.05);
  }

  public startRaceMusic(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;
    this.stopMusicLoop();
    this.isVictoryMusic = false;
    if (!this.settings.musicEnabled || this.settings.muted) return;

    this.musicStep = 0;
    const stepMs = 120; // ~125 BPM 16th-note pulse
    const bassPattern = [
      110, 110, 220, 110, 130.81, 130.81, 196, 130.81,
      146.83, 146.83, 220, 146.83, 164.81, 146.83, 130.81, 98,
    ];
    const arpPattern = [
      440, 0, 523.25, 659.25, 0, 523.25, 587.33, 0,
      659.25, 0, 783.99, 659.25, 587.33, 523.25, 440, 392,
    ];

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.settings.musicEnabled || this.settings.muted || this.isVictoryMusic) {
        return;
      }
      const now = this.ctx.currentTime;
      const step = this.musicStep % 16;
      this.musicStep += 1;

      // Kick on 0, 4, 8, 12
      if (step % 4 === 0) {
        const kick = this.ctx.createOscillator();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(125, now);
        kick.frequency.exponentialRampToValueAtTime(42, now + 0.11);

        const kEnv = this.ctx.createGain();
        kEnv.gain.setValueAtTime(0.45, now);
        kEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

        kick.connect(kEnv);
        kEnv.connect(this.musicGain);
        kick.start(now);
        kick.stop(now + 0.14);
      }

      // Bass synth
      const bFreq = bassPattern[step];
      if (bFreq > 0) {
        const bass = this.ctx.createOscillator();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(bFreq, now);

        const bFlt = this.ctx.createBiquadFilter();
        bFlt.type = 'lowpass';
        bFlt.frequency.value = 480;

        const bEnv = this.ctx.createGain();
        bEnv.gain.setValueAtTime(0.18, now);
        bEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        bass.connect(bFlt);
        bFlt.connect(bEnv);
        bEnv.connect(this.musicGain);
        bass.start(now);
        bass.stop(now + 0.11);
      }

      // Melodic lead arp
      const aFreq = arpPattern[step];
      if (aFreq > 0) {
        const arp = this.ctx.createOscillator();
        arp.type = 'triangle';
        arp.frequency.setValueAtTime(aFreq, now);

        const aEnv = this.ctx.createGain();
        aEnv.gain.setValueAtTime(0.11, now);
        aEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        arp.connect(aEnv);
        aEnv.connect(this.musicGain);
        arp.start(now);
        arp.stop(now + 0.12);
      }
    }, stepMs);
  }

  public playVictoryFanfareAndTrophy(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || !this.musicGain) return;

    this.stopMusicLoop();
    this.stopEngineIdle();
    this.isVictoryMusic = true;

    const now = ctx.currentTime;

    // 1. Trophy sparkling chime (SFX bus)
    const chimeNotes = [1046.5, 1318.5, 1567.98, 2093.0];
    chimeNotes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.09);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.01, now + i * 0.09);
      env.gain.linearRampToValueAtTime(0.28, now + i * 0.09 + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.85);

      osc.connect(env);
      env.connect(this.sfxGain!);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.9);
    });

    // 2. Championship stadium crowd roar
    this.playCrowdCheer(2.4, 0.35);

    // 3. Triumphant Victory Fanfare Chords (Music bus)
    if (this.settings.musicEnabled && !this.settings.muted) {
      const chords: Array<{ t: number; dur: number; freqs: number[] }> = [
        { t: 0.0, dur: 0.25, freqs: [261.63, 329.63, 392.0, 523.25] },
        { t: 0.28, dur: 0.25, freqs: [261.63, 329.63, 392.0, 523.25] },
        { t: 0.56, dur: 0.25, freqs: [293.66, 369.99, 440.0, 587.33] },
        { t: 0.86, dur: 0.95, freqs: [392.0, 493.88, 587.33, 783.99] },
        { t: 1.88, dur: 1.6, freqs: [261.63, 329.63, 392.0, 523.25, 1046.5] },
      ];

      chords.forEach((ch) => {
        ch.freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + ch.t);

          const flt = ctx.createBiquadFilter();
          flt.type = 'lowpass';
          flt.frequency.value = 1800;

          const env = ctx.createGain();
          env.gain.setValueAtTime(0.01, now + ch.t);
          env.gain.linearRampToValueAtTime(0.14, now + ch.t + 0.04);
          env.gain.exponentialRampToValueAtTime(0.001, now + ch.t + ch.dur);

          osc.connect(flt);
          flt.connect(env);
          env.connect(this.musicGain!);
          osc.start(now + ch.t);
          osc.stop(now + ch.t + ch.dur + 0.05);
        });
      });
    }
  }

  public stopMusicLoop(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public dispose(): void {
    this.stopMusicLoop();
    this.stopEngineIdle();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundEngine = new RacingSoundEngine();
