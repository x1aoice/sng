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
      { delay: 0, gain: 0.45, pitch: 135 },
      { delay: 0.108, gain: 0.35, pitch: 148 },
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

  // 2. Play realistic card muck / fold whoosh ("弃牌滑入废牌堆声 - 唰嚓")
  public playFold() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Distinct 2-card discard slide across the felt
    const cards = [
      { delay: 0, gain: 0.36, startFreq: 3600, endFreq: 950, duration: 0.12 },
      { delay: 0.035, gain: 0.30, startFreq: 4200, endFreq: 1100, duration: 0.10 },
    ];

    cards.forEach(({ delay, gain: fGain, startFreq, endFreq, duration }) => {
      const startTime = t + delay;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Asymmetrical envelope: quick crisp friction attack, smooth friction tail
        const progress = i / bufferSize;
        const env = Math.pow(Math.sin(progress * Math.PI), 0.85);
        data[i] = (Math.random() * 2 - 1) * env;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(startFreq, startTime);
      filter.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
      filter.Q.setValueAtTime(2.4, startTime);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(fGain, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      noise.start(startTime);
    });

    // Soft muffled card landing stop
    const stopOsc = ctx.createOscillator();
    const stopGain = ctx.createGain();
    stopOsc.type = 'sine';
    stopOsc.frequency.setValueAtTime(220, t + 0.04);
    stopOsc.frequency.exponentialRampToValueAtTime(70, t + 0.11);

    stopGain.gain.setValueAtTime(0.14, t + 0.04);
    stopGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    stopOsc.connect(stopGain);
    stopGain.connect(ctx.destination);
    stopOsc.start(t + 0.04);
    stopOsc.stop(t + 0.11);
  }

  // 3. Play heavy chip stack push / raise ("加注重注推筹码声 - 哗啦咔哒")
  public playRaise() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // A. Heavy chip stack landing on felt table (punchy physical thud)
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    const thudFilter = ctx.createBiquadFilter();

    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(155, now);
    thudOsc.frequency.exponentialRampToValueAtTime(65, now + 0.09);

    thudFilter.type = 'lowpass';
    thudFilter.frequency.setValueAtTime(450, now);

    thudGain.gain.setValueAtTime(0.36, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    thudOsc.connect(thudFilter);
    thudFilter.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.09);

    // Sub-frequency weight
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    subGain.gain.setValueAtTime(0.26, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.08);

    // B. Rich cascade of multiple clay chips clattering and settling
    const stackClatters = [
      { delay: 0.000, freq: 3500, gain: 0.22 },
      { delay: 0.018, freq: 4400, gain: 0.26 },
      { delay: 0.038, freq: 3800, gain: 0.20 },
      { delay: 0.062, freq: 5000, gain: 0.18 },
      { delay: 0.086, freq: 4100, gain: 0.14 },
    ];

    stackClatters.forEach(({ delay, freq, gain: clinkGain }) => {
      const t = now + delay;

      // Ceramic high ring
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const highFilter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.93, t + 0.04);

      highFilter.type = 'highpass';
      highFilter.frequency.setValueAtTime(2200, t);

      oscGain.gain.setValueAtTime(clinkGain, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(highFilter);
      highFilter.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);

      // Clay chip edge snap
      const snapSize = Math.floor(ctx.sampleRate * 0.02);
      const snapBuf = ctx.createBuffer(1, snapSize, ctx.sampleRate);
      const snapData = snapBuf.getChannelData(0);
      for (let i = 0; i < snapSize; i++) {
        snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.0035));
      }
      const snapNoise = ctx.createBufferSource();
      snapNoise.buffer = snapBuf;

      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(freq * 0.75, t);
      snapFilter.Q.setValueAtTime(4.0, t);

      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(clinkGain * 0.9, t);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      snapNoise.connect(snapFilter);
      snapFilter.connect(sGain);
      sGain.connect(ctx.destination);
      snapNoise.start(t);
    });

    // C. Felt sliding friction of the chip stack
    const slideSize = Math.floor(ctx.sampleRate * 0.08);
    const slideBuf = ctx.createBuffer(1, slideSize, ctx.sampleRate);
    const slideData = slideBuf.getChannelData(0);
    for (let i = 0; i < slideSize; i++) {
      slideData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
    }
    const slideNoise = ctx.createBufferSource();
    slideNoise.buffer = slideBuf;

    const slideFilter = ctx.createBiquadFilter();
    slideFilter.type = 'bandpass';
    slideFilter.frequency.setValueAtTime(2200, now);
    slideFilter.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    slideFilter.Q.setValueAtTime(2.0, now);

    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0.18, now);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    slideNoise.connect(slideFilter);
    slideFilter.connect(slideGain);
    slideGain.connect(ctx.destination);
    slideNoise.start(now);
  }

  // 4. Play all-in shove ("全下全推池震撼声")
  public playAllIn() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    // Trigger powerful raise clatter immediately
    this.playRaise();

    // Layer with secondary rolling cascade 60ms later for massive chip stack splash
    setTimeout(() => {
      if (!this.enabled || !this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      [
        { delay: 0.000, freq: 4800, gain: 0.24 },
        { delay: 0.025, freq: 3600, gain: 0.20 },
        { delay: 0.050, freq: 5200, gain: 0.16 },
      ].forEach(({ delay, freq, gain: clinkGain }) => {
        const t = now + delay;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.04);

        oscGain.gain.setValueAtTime(clinkGain, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.04);
      });
    }, 60);
  }

  // 5. Play call ("跟注轻筹码入池声 - 叮嗒")
  public playCall() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 2 crisp clay chip clinks matching the bet
    const clinks = [
      { delay: 0, freq: 3900, gain: 0.20 },
      { delay: 0.032, freq: 4600, gain: 0.16 },
    ];

    clinks.forEach(({ delay, freq, gain: clinkGain }) => {
      const t = now + delay;

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, t + 0.035);

      oscGain.gain.setValueAtTime(clinkGain, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.035);
    });
  }

  // General chip sound alias
  public playChip() {
    this.playCall();
  }

  // 6. Play crisp card sliding out of deck / shoe ("发牌滑过绒布声")
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

  // 7. Play card flip / turn onto felt ("翻牌轻扣桌面声")
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

  // 8. Play win fanfare / chime ("底池结算胜利音效")
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
      this.playRaise();
    }, 180);
  }

  // 9. Play countdown tick ("思考时间倒计时秒针音效")
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
