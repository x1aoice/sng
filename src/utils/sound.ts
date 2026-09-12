// Web Audio API procedural sound synthesizer for authentic casino poker effects

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // 1. Play realistic poker table knuckle knock ("敲桌子过牌声" - 笃笃 double tap)
  public playCheck() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Classic humanized double knuckle tap on felt-covered wood table
    const taps = [
      { delay: 0, gain: 0.42, pitch: 135 },
      { delay: 0.108, gain: 0.32, pitch: 148 },
    ];

    taps.forEach(({ delay, gain: tapGain, pitch }) => {
      const t = now + delay;

      // A. Knuckle bone impact click (transient felt strike)
      const bufferSize = Math.floor(ctx.sampleRate * 0.02);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.0035));
      }
      const clickNoise = ctx.createBufferSource();
      clickNoise.buffer = buffer;

      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(1300, t);
      clickFilter.Q.setValueAtTime(3.0, t);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(tapGain * 0.75, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

      clickNoise.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickNoise.start(t);

      // B. Solid wooden table body resonance
      const woodOsc = ctx.createOscillator();
      const woodGain = ctx.createGain();
      const woodFilter = ctx.createBiquadFilter();

      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(pitch * 1.45, t);
      woodOsc.frequency.exponentialRampToValueAtTime(pitch, t + 0.02);
      woodOsc.frequency.exponentialRampToValueAtTime(pitch * 0.65, t + 0.075);

      woodFilter.type = 'lowpass';
      woodFilter.frequency.setValueAtTime(460, t);
      woodFilter.frequency.exponentialRampToValueAtTime(170, t + 0.07);

      woodGain.gain.setValueAtTime(tapGain, t);
      woodGain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

      woodOsc.connect(woodFilter);
      woodFilter.connect(woodGain);
      woodGain.connect(ctx.destination);

      woodOsc.start(t);
      woodOsc.stop(t + 0.075);

      // C. Heavy table felt sub-thud for deep physical presence
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(80, t);
      subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.06);

      subGain.gain.setValueAtTime(tapGain * 0.55, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start(t);
      subOsc.stop(t + 0.06);
    });
  }

  // 2. Play authentic ceramic clay poker chip clatter ("筹码清脆碰撞声")
  public playChip() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Realistic clay chip stack slide & collision (3 rapid micro-clinks)
    const clinks = [
      { delay: 0, freq: 3900, gain: 0.16 },
      { delay: 0.024, freq: 4700, gain: 0.13 },
      { delay: 0.052, freq: 3300, gain: 0.15 },
    ];

    clinks.forEach(({ delay, freq, gain: clinkGain }) => {
      const t = now + delay;

      // High ceramic resonant tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const highFilter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, t + 0.035);

      highFilter.type = 'highpass';
      highFilter.frequency.setValueAtTime(2200, t);

      oscGain.gain.setValueAtTime(clinkGain, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(highFilter);
      highFilter.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.035);

      // Micro chip body snap
      const snapSize = Math.floor(ctx.sampleRate * 0.018);
      const snapBuf = ctx.createBuffer(1, snapSize, ctx.sampleRate);
      const snapData = snapBuf.getChannelData(0);
      for (let i = 0; i < snapSize; i++) {
        snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.003));
      }
      const snapNoise = ctx.createBufferSource();
      snapNoise.buffer = snapBuf;

      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(freq * 0.72, t);
      snapFilter.Q.setValueAtTime(4.0, t);

      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(clinkGain * 0.85, t);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);

      snapNoise.connect(snapFilter);
      snapFilter.connect(sGain);
      sGain.connect(ctx.destination);
      snapNoise.start(t);
    });
  }

  // 3. Play crisp card sliding out of deck / shoe ("发牌滑过绒布声")
  public playCardDeal() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.075);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.024));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(850, t + 0.075);
    filter.Q.setValueAtTime(2.8, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  // 4. Play card flip / turn onto felt ("翻牌轻扣桌面声")
  public playCardFlip() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Card snap friction
    const bufferSize = Math.floor(ctx.sampleRate * 0.038);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2500, t);
    filter.frequency.exponentialRampToValueAtTime(1050, t + 0.038);
    filter.Q.setValueAtTime(2.2, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);

    // Soft felt landing thump
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.04);

    oscGain.gain.setValueAtTime(0.14, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  // 5. Play card muck / fold whoosh ("弃牌滑入废牌堆声")
  public playFold() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Two cards sliding across felt into muck
    [0, 0.032].forEach((delay) => {
      const startTime = t + delay;
      const bufferSize = Math.floor(ctx.sampleRate * 0.085);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.028));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1900, startTime);
      filter.frequency.exponentialRampToValueAtTime(600, startTime + 0.08);
      filter.Q.setValueAtTime(1.8, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.16, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(startTime);
    });
  }

  // 6. Play win fanfare / chime ("底池结算胜利音效")
  public playWin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.38);
    });

    // Cascade chip collecting sound
    setTimeout(() => {
      this.playChip();
    }, 180);
  }

  // 7. Play countdown tick ("思考时间倒计时秒针音效")
  public playTick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.025);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.025);
  }
}

export const sound = new SoundManager();
