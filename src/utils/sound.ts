// Authentic studio-recorded casino poker sound manager

type SoundKey =
  | 'check'
  | 'fold'
  | 'raise'
  | 'all_in'
  | 'call'
  | 'deal_player'
  | 'deal_board'
  | 'win';

const SOUND_FILES: Record<SoundKey, string> = {
  check: '/sounds/check.mp3',
  fold: '/sounds/fold.mp3',
  raise: '/sounds/raise.mp3',
  all_in: '/sounds/all_in.mp3',
  call: '/sounds/bet.mp3',
  deal_player: '/sounds/deal_player.mp3',
  deal_board: '/sounds/deal_board.mp3',
  win: '/sounds/win.mp3',
};

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private buffers: Map<SoundKey, AudioBuffer> = new Map();
  private loading: Set<SoundKey> = new Set();

  constructor() {
    // Eagerly preload real audio assets in browser
    if (typeof window !== 'undefined') {
      // Listen for first user interaction to resume AudioContext
      const unlock = () => {
        this.initCtx();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
  }

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
    if (this.ctx) {
      this.preloadAll();
    }
    return this.ctx;
  }

  private preloadAll() {
    (Object.keys(SOUND_FILES) as SoundKey[]).forEach((key) => {
      this.loadSound(key);
    });
  }

  private async loadSound(key: SoundKey): Promise<AudioBuffer | null> {
    if (this.buffers.has(key)) {
      return this.buffers.get(key)!;
    }
    if (this.loading.has(key)) return null;

    const ctx = this.ctx;
    if (!ctx) return null;

    this.loading.add(key);
    try {
      const url = SOUND_FILES[key];
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      this.buffers.set(key, audioBuf);
      return audioBuf;
    } catch {
      // Failed to decode or fetch, fallback will handle via HTMLAudioElement
      return null;
    } finally {
      this.loading.delete(key);
    }
  }

  private playSound(key: SoundKey, volume: number = 1.0) {
    if (!this.enabled) return;
    const ctx = this.initCtx();

    if (ctx && this.buffers.has(key)) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = this.buffers.get(key)!;
        if (volume !== 1.0) {
          const gain = ctx.createGain();
          gain.gain.value = volume;
          source.connect(gain);
          gain.connect(ctx.destination);
        } else {
          source.connect(ctx.destination);
        }
        source.start(0);
        return;
      } catch {
        // Fallback to HTML5 audio below
      }
    }

    // Direct HTML5 Audio fallback
    if (typeof Audio !== 'undefined') {
      try {
        const audio = new Audio(SOUND_FILES[key]);
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.play().catch(() => {});
      } catch {
        // Audio playback restricted
      }
    }

    // Trigger background buffer load for future plays
    if (ctx && !this.buffers.has(key)) {
      this.loadSound(key);
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // 1. Authentic knuckle knock on table
  public playCheck() {
    this.playSound('check', 1.0);
  }

  // 2. Authentic card discard into muck
  public playFold() {
    this.playSound('fold', 0.95);
  }

  // 3. Authentic heavy chip stack raise
  public playRaise() {
    this.playSound('raise', 1.0);
  }

  // 4. Authentic dramatic all-in shove
  public playAllIn() {
    this.playSound('all_in', 1.0);
  }

  // 5. Authentic chip bet / call
  public playCall() {
    this.playSound('call', 0.85);
  }

  public playChip() {
    this.playCall();
  }

  // 6. Authentic card deal slide
  public playCardDeal() {
    this.playSound('deal_player', 0.9);
  }

  // 7. Authentic board card reveal / tap
  public playCardFlip() {
    this.playSound('deal_board', 0.9);
  }

  // 8. Authentic win fanfare
  public playWin() {
    this.playSound('win', 1.0);
  }
}

export const sound = new SoundManager();
