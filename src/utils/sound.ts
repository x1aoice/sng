// Web Audio API physical acoustic synthesizer for authentic casino poker effects
// Procedural sample-accurate physical modeling for table knocks, chip clatters, and card mucks

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  // Cached sample-accurate acoustic buffers
  private checkBuffer: AudioBuffer | null = null;
  private foldBuffer: AudioBuffer | null = null;
  private raiseBuffer: AudioBuffer | null = null;
  private allInBuffer: AudioBuffer | null = null;
  private callBuffer: AudioBuffer | null = null;
  private dealBuffer: AudioBuffer | null = null;
  private flipBuffer: AudioBuffer | null = null;

  private initCtx(): AudioContext | null {
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
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private playBuffer(buf: AudioBuffer | null, gainVal: number = 1.0) {
    if (!this.enabled || !buf) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const source = ctx.createBufferSource();
    source.buffer = buf;
    if (gainVal !== 1.0) {
      const gain = ctx.createGain();
      gain.gain.value = gainVal;
      source.connect(gain);
      gain.connect(ctx.destination);
    } else {
      source.connect(ctx.destination);
    }
    source.start();
  }

  // =========================================================================
  // 1. Table Knuckle Knock ("敲桌子过牌声" - 真实指关节敲击实木台面 笃笃)
  // =========================================================================
  private getCheckBuffer(ctx: AudioContext): AudioBuffer {
    if (this.checkBuffer) return this.checkBuffer;

    const sr = ctx.sampleRate;
    const duration = 0.26;
    const totalSamples = Math.floor(sr * duration);
    const audioBuf = ctx.createBuffer(1, totalSamples, sr);
    const data = audioBuf.getChannelData(0);

    const addKnock = (startSample: number, amp: number, f1: number, f2: number, f3: number) => {
      const len = Math.floor(sr * 0.085);
      for (let i = 0; i < len; i++) {
        const idx = startSample + i;
        if (idx >= totalSamples) break;
        const t = i / sr;
        // Bone-to-wood transient impulse
        const click = (Math.random() * 2 - 1) * Math.exp(-t / 0.0022) * 0.45;
        // Wood table plate modal resonances
        const m1 = Math.sin(2 * Math.PI * f1 * t) * Math.exp(-t / 0.048) * 0.45;
        const m2 = Math.sin(2 * Math.PI * f2 * t) * Math.exp(-t / 0.026) * 0.32;
        const m3 = Math.sin(2 * Math.PI * f3 * t) * Math.exp(-t / 0.014) * 0.18;
        // Sub-bass heavy table feel
        const sub = Math.sin(2 * Math.PI * 65 * t) * Math.exp(-t / 0.045) * 0.22;
        data[idx] += amp * (click + m1 + m2 + m3 + sub);
      }
    };

    // Knock 1: Primary knuckle impact at 0ms
    addKnock(0, 0.88, 96, 198, 330);
    // Knock 2: Secondary bounce at 115ms (slightly higher pitch, slightly softer)
    addKnock(Math.floor(sr * 0.115), 0.65, 106, 215, 360);

    this.checkBuffer = audioBuf;
    return audioBuf;
  }

  public playCheck() {
    const ctx = this.initCtx();
    if (!ctx) return;
    this.playBuffer(this.getCheckBuffer(ctx));
  }

  // =========================================================================
  // 2. Card Muck Slide ("真实弃牌声" - 纸牌轻快滑过绒布台面 唰嚓)
  // =========================================================================
  private getFoldBuffer(ctx: AudioContext): AudioBuffer {
    if (this.foldBuffer) return this.foldBuffer;

    const sr = ctx.sampleRate;
    const duration = 0.22;
    const totalSamples = Math.floor(sr * duration);
    const audioBuf = ctx.createBuffer(1, totalSamples, sr);
    const data = audioBuf.getChannelData(0);

    const addSlide = (
      startOffset: number,
      dur: number,
      startFreq: number,
      endFreq: number,
      amp: number
    ) => {
      const n = Math.floor(sr * dur);
      let state = 0;
      for (let i = 0; i < n; i++) {
        const idx = startOffset + i;
        if (idx >= totalSamples) break;
        const progress = i / n;
        // Velocity curve of a thrown card decelerating
        const env = Math.pow(Math.sin(progress * Math.PI), 0.72) * (1 - progress * 0.3);
        const freq = startFreq + (endFreq - startFreq) * progress;
        const alpha = (2 * Math.PI * freq) / sr;
        // Granular cloth texture simulation
        state += alpha * (Math.random() * 2 - 1 - state);
        data[idx] += amp * env * state;
      }
    };

    // Card 1 slide
    addSlide(0, 0.14, 3400, 850, 0.58);
    // Card 2 trailing slide (brushes against card 1)
    addSlide(Math.floor(sr * 0.030), 0.12, 4100, 1100, 0.45);

    // Subtle felt landing stop
    const landStart = Math.floor(sr * 0.05);
    const landLen = Math.floor(sr * 0.05);
    for (let i = 0; i < landLen; i++) {
      const idx = landStart + i;
      if (idx >= totalSamples) break;
      const t = i / sr;
      data[idx] += 0.18 * Math.sin(2 * Math.PI * 130 * t) * Math.exp(-t / 0.02);
    }

    this.foldBuffer = audioBuf;
    return audioBuf;
  }

  public playFold() {
    const ctx = this.initCtx();
    if (!ctx) return;
    this.playBuffer(this.getFoldBuffer(ctx));
  }

  // =========================================================================
  // 3. Heavy Clay Chip Stack Push ("真实加注声" - 整叠黏土筹码推池 哗啦咔哒)
  // =========================================================================
  private getRaiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.raiseBuffer) return this.raiseBuffer;

    const sr = ctx.sampleRate;
    const duration = 0.28;
    const totalSamples = Math.floor(sr * duration);
    const audioBuf = ctx.createBuffer(1, totalSamples, sr);
    const data = audioBuf.getChannelData(0);

    // 1. Heavy stack landing thud on table
    const thudLen = Math.floor(sr * 0.08);
    for (let i = 0; i < thudLen; i++) {
      const t = i / sr;
      const thump = Math.sin(2 * Math.PI * (140 - 65 * (t / 0.08)) * t) * Math.exp(-t / 0.028) * 0.42;
      const sub = Math.sin(2 * Math.PI * 72 * t) * Math.exp(-t / 0.035) * 0.32;
      data[i] += thump + sub;
    }

    // 2. Cascading clay chip disc collisions (dry, dense ceramic clatter)
    const chipHits = [
      { delay: 0.000, freq: 3600, amp: 0.34 },
      { delay: 0.015, freq: 4600, amp: 0.42 },
      { delay: 0.032, freq: 3900, amp: 0.38 },
      { delay: 0.052, freq: 4900, amp: 0.32 },
      { delay: 0.075, freq: 4200, amp: 0.26 },
      { delay: 0.102, freq: 3700, amp: 0.20 },
    ];

    chipHits.forEach(({ delay, freq, amp }) => {
      const start = Math.floor(sr * delay);
      const hitLen = Math.floor(sr * 0.035);
      for (let i = 0; i < hitLen; i++) {
        const idx = start + i;
        if (idx >= totalSamples) break;
        const t = i / sr;
        // Dry ceramic ring
        const ring = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / 0.007);
        // Sharp edge snap
        const click = (Math.random() * 2 - 1) * Math.exp(-t / 0.002) * 0.45;
        data[idx] += amp * (ring + click);
      }
    });

    this.raiseBuffer = audioBuf;
    return audioBuf;
  }

  public playRaise() {
    const ctx = this.initCtx();
    if (!ctx) return;
    this.playBuffer(this.getRaiseBuffer(ctx));
  }

  // =========================================================================
  // 4. All-in Massive Chip Shove ("全下巨额推池声")
  // =========================================================================
  private getAllInBuffer(ctx: AudioContext): AudioBuffer {
    if (this.allInBuffer) return this.allInBuffer;

    const sr = ctx.sampleRate;
    const duration = 0.38;
    const totalSamples = Math.floor(sr * duration);
    const audioBuf = ctx.createBuffer(1, totalSamples, sr);
    const data = audioBuf.getChannelData(0);

    // Heavy dual stack table thud
    const thudLen = Math.floor(sr * 0.12);
    for (let i = 0; i < thudLen; i++) {
      const t = i / sr;
      const thump = Math.sin(2 * Math.PI * (120 - 55 * (t / 0.12)) * t) * Math.exp(-t / 0.045) * 0.55;
      const sub = Math.sin(2 * Math.PI * 55 * t) * Math.exp(-t / 0.06) * 0.45;
      data[i] += thump + sub;
    }

    // Extended rolling cascade of 9 chip impacts
    const chipHits = [
      { delay: 0.000, freq: 3400, amp: 0.35 },
      { delay: 0.018, freq: 4800, amp: 0.40 },
      { delay: 0.035, freq: 3800, amp: 0.36 },
      { delay: 0.055, freq: 5100, amp: 0.34 },
      { delay: 0.080, freq: 4300, amp: 0.30 },
      { delay: 0.110, freq: 3600, amp: 0.28 },
      { delay: 0.140, freq: 4900, amp: 0.25 },
      { delay: 0.175, freq: 4100, amp: 0.22 },
      { delay: 0.210, freq: 3500, amp: 0.18 },
    ];

    chipHits.forEach(({ delay, freq, amp }) => {
      const start = Math.floor(sr * delay);
      const hitLen = Math.floor(sr * 0.035);
      for (let i = 0; i < hitLen; i++) {
        const idx = start + i;
        if (idx >= totalSamples) break;
        const t = i / sr;
        const ring = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / 0.007);
        const click = (Math.random() * 2 - 1) * Math.exp(-t / 0.002) * 0.45;
        data[idx] += amp * (ring + click);
      }
    });

    this.allInBuffer = audioBuf;
    return audioBuf;
  }

  public playAllIn() {
    const ctx = this.initCtx();
    if (!ctx) return;
    this.playBuffer(this.getAllInBuffer(ctx));
  }

  // =========================================================================
  // 5. Call Chips ("跟注轻巧两枚筹码碰入底池声 - 叮嗒")
  // =========================================================================
  private getCallBuffer(ctx: AudioContext): AudioBuffer {
    if (this.callBuffer) return this.callBuffer;

    const sr = ctx.sampleRate;
    const duration = 0.18;
    const totalSamples = Math.floor(sr * duration);
    const audioBuf = ctx.createBuffer(1, totalSamples, sr);
    const data = audioBuf.getChannelData(0);

    const clinks = [
      { delay: 0.000, freq: 3900, amp: 0.38 },
      { delay: 0.036, freq: 4700, amp: 0.32 },
    ];

    clinks.forEach(({ delay, freq, amp }) => {
      const start = Math.floor(sr * delay);
      const hitLen = Math.floor(sr * 0.035);
      for (let i = 0; i < hitLen; i++) {
        const idx = start + i;
        if (idx >= totalSamples) break;
        const t = i / sr;
        const ring = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / 0.008);
        const click = (Math.random() * 2 - 1) * Math.exp(-t / 0.002) * 0.4;
        data[idx] += amp * (ring + click);
      }
    });

    this.callBuffer = audioBuf;
    return audioBuf;
  }

  public playCall() {
    const ctx = this.initCtx();
    if (!ctx) return;
    this.playBuffer(this.getCallBuffer(ctx));
  }

  public playChip() {
    this.playCall();
  }

  // =========================================================================
  // 6. Card Deal ("发牌从发牌靴滑出掠过绒布声")
  // =========================================================================
  private getDealBuffer(ctx: AudioContext): AudioBuffer {
    if (this.dealBuffer) return this.dealBuffer;

    const sr = ctx.sampleRate;
    const duration = 0.10;
    const totalSamples = Math.floor(sr * duration);
    const audioBuf = ctx.createBuffer(1, totalSamples, sr);
    const data = audioBuf.getChannelData(0);

    let state = 0;
    for (let i = 0; i < totalSamples; i++) {
      const progress = i / totalSamples;
      const env = Math.pow(Math.sin(progress * Math.PI), 0.65) * (1 - progress * 0.25);
      const freq = 2900 - 1800 * progress;
      const alpha = (2 * Math.PI * freq) / sr;
      state += alpha * (Math.random() * 2 - 1 - state);
      data[i] = 0.55 * env * state;
    }

    this.dealBuffer = audioBuf;
    return audioBuf;
  }

  public playCardDeal() {
    const ctx = this.initCtx();
    if (!ctx) return;
    this.playBuffer(this.getDealBuffer(ctx));
  }

  // =========================================================================
  // 7. Card Flip ("公共牌翻出落台轻弹声")
  // =========================================================================
  private getFlipBuffer(ctx: AudioContext): AudioBuffer {
    if (this.flipBuffer) return this.flipBuffer;

    const sr = ctx.sampleRate;
    const duration = 0.12;
    const totalSamples = Math.floor(sr * duration);
    const audioBuf = ctx.createBuffer(1, totalSamples, sr);
    const data = audioBuf.getChannelData(0);

    let state = 0;
    for (let i = 0; i < totalSamples; i++) {
      const progress = i / totalSamples;
      const env = Math.exp(-progress * 18);
      const freq = 2600 - 1600 * progress;
      const alpha = (2 * Math.PI * freq) / sr;
      state += alpha * (Math.random() * 2 - 1 - state);
      const thud = Math.sin(2 * Math.PI * 140 * (i / sr)) * Math.exp(-progress * 22);
      data[i] = 0.5 * env * state + 0.3 * thud;
    }

    this.flipBuffer = audioBuf;
    return audioBuf;
  }

  public playCardFlip() {
    const ctx = this.initCtx();
    if (!ctx) return;
    this.playBuffer(this.getFlipBuffer(ctx));
  }

  // =========================================================================
  // 8. Win Fanfare ("底池收池胜利音效")
  // =========================================================================
  public playWin() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });

    // Cascading chip collection clatter
    setTimeout(() => {
      this.playRaise();
    }, 180);
  }
}

export const sound = new SoundManager();
