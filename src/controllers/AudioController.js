/**
 * AudioController — Drives visual chaos from audio input.
 *
 * Three input modes:
 *   - stream: plays an internet radio stream (default: icecast2.ufpel.edu.br/live)
 *   - file: plays a user-uploaded audio file
 *   - mic: captures microphone input
 *
 * Uses audiomotion-analyzer for FFT analysis, then maps frequency bands
 * to visual actions on the Play scene (move, shape change, zoom).
 *
 * Reads optional thresholds from /audioControls.json at startup.
 */
import AudioMotionAnalyzer from 'audiomotion-analyzer';

const DEFAULT_CONFIG = {
  defaultStream: 'https://icecast2.ufpel.edu.br/live',
  thresholds: {
    // For stream/file mode, bass drives the main reaction
    bass: 0.63,
    mid: 0.7,
    treble: 0.8,
    // For mic mode, overall energy is more useful (mic is noisy)
    micEnergy: 0.1,
  },
  actions: {
    // What happens when audio threshold is crossed
    move: { weight: 50 },        // move emitter
    shapeChange: { weight: 40 }, // new chaos star
    zoomIn: { weight: 5 },      // zoom in
    zoomOut: { weight: 5 },     // zoom out
  },
  // Minimum ms between visual reactions (prevents seizure-speed flickering)
  reactionCooldown: 80,
  // How much bass amplitude influences move distance (0-1)
  bassMoveFactor: 0.5,
  // Sustained energy zoom: if average energy stays high for N frames, zoom in
  sustainedZoom: {
    enabled: true,
    frames: 60,        // ~1 second of sustained energy
    threshold: 0.5,    // average energy above this triggers zoom
    zoomFactor: 1.3,
    duration: 3.0,
  },
};

export default class AudioController {
  constructor(play) {
    this.play = play;
    this.active = false;
    this.mode = null; // 'stream' | 'file' | 'mic'
    this.config = { ...DEFAULT_CONFIG };

    this._audioEl = null;
    this._analyzer = null;
    this._micStream = null;
    this._lastReactionTime = 0;
    this._energyHistory = [];
    this._destroyed = false;
  }

  /**
   * Load optional config from /audioControls.json.
   * Falls back to DEFAULT_CONFIG if file doesn't exist.
   */
  async loadConfig() {
    try {
      const resp = await fetch('/audioControls.json');
      if (resp.ok) {
        const json = await resp.json();
        this.config = this._mergeDeep(DEFAULT_CONFIG, json);
      }
    } catch {
      // Use defaults
    }
    return this.config;
  }

  /**
   * Start audio reactivity.
   * @param {'stream'|'file'|'mic'} mode
   * @param {string|File} [source] - URL for stream, File object for file mode
   */
  async start(mode, source) {
    // Stop any previous session and wait for it to fully settle
    if (this.active) {
      this.stop();
    }

    // Cancel any pending play promise from a previous session
    this._playId = (this._playId || 0) + 1;
    const currentPlayId = this._playId;

    this.mode = mode;
    console.log(`[AudioMode] Starting (${mode})`);

    // Create audio element if needed
    if (!this._audioEl) {
      this._audioEl = document.createElement('audio');
      this._audioEl.crossOrigin = 'anonymous';
      this._audioEl.id = 'audio-controller-el';
      document.body.appendChild(this._audioEl);
    }

    // Create analyzer if needed (reuse across sessions)
    if (!this._analyzer) {
      // We need a container for audiomotion (even though we don't use its canvas)
      let container = document.getElementById('audio-analyzer-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'audio-analyzer-container';
        container.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
        document.body.appendChild(container);
      }

      this._analyzer = new AudioMotionAnalyzer(container, {
        source: this._audioEl,
        showBgColor: false,
        useCanvas: false,
        onCanvasDraw: () => this._onFrame(),
      });
    }

    try {
      if (mode === 'stream') {
        const url = source || this.config.defaultStream;
        await this._loadAndPlay(url, currentPlayId);
        console.log(`[AudioMode] Playing stream: ${url}`);
      } else if (mode === 'file') {
        let src;
        if (source instanceof File) {
          src = URL.createObjectURL(source);
        } else if (typeof source === 'string') {
          src = source;
        }
        await this._loadAndPlay(src, currentPlayId);
        console.log('[AudioMode] Playing file');
      } else if (mode === 'mic') {
        await this._startMic();
        console.log('[AudioMode] Microphone active');
      }
    } catch (err) {
      // Ignore AbortError from stale play requests (user switched modes quickly)
      if (err.name === 'AbortError') {
        console.log('[AudioMode] Previous play request cancelled (switching modes)');
        return;
      }
      console.error('[AudioMode] Failed to start:', err);
      this.stop();
      throw err;
    }

    // If another start() was called while we were awaiting, bail out
    if (this._playId !== currentPlayId) return;

    this.active = true;
    this._lastReactionTime = 0;
    this._energyHistory = [];
  }

  /**
   * Load a source into the audio element and play it, handling the
   * race condition where pause() interrupts a pending play() promise.
   */
  async _loadAndPlay(src, playId) {
    const audio = this._audioEl;

    // Fully reset the element before loading new source
    audio.pause();
    audio.removeAttribute('src');
    audio.load(); // Forces the element to reset its state

    // Small yield to let the browser process the reset
    await new Promise((r) => setTimeout(r, 50));

    // Bail if a newer start() call happened during the yield
    if (this._playId !== playId) return;

    audio.src = src;

    // Wait for enough data to play
    await new Promise((resolve, reject) => {
      const onCanPlay = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(audio.error || new Error('Audio load failed')); };
      const cleanup = () => {
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
      };
      audio.addEventListener('canplay', onCanPlay, { once: true });
      audio.addEventListener('error', onError, { once: true });
    });

    // Bail if a newer start() call happened while loading
    if (this._playId !== playId) return;

    await audio.play();
  }

  stop() {
    if (!this.active && !this._micStream) return;

    console.log(`[AudioMode] Stopped (was ${this.mode})`);

    // Bump playId to invalidate any in-flight start() calls
    this._playId = (this._playId || 0) + 1;

    // Stop microphone stream
    if (this._micStream) {
      this._micStream.getTracks().forEach((t) => t.stop());
      this._micStream = null;
    }

    // Stop audio playback
    if (this._audioEl) {
      this._audioEl.pause();
      this._audioEl.removeAttribute('src');
      this._audioEl.load();
    }

    // After mic mode, the analyzer's internal source graph is broken —
    // disconnectInput() removes the mic but doesn't reconnect the audio element.
    // An HTMLMediaElement can only ever be connected to ONE MediaElementSourceNode,
    // so we must destroy both the analyzer AND the audio element, then let them
    // be recreated fresh together on the next start().
    if (this._analyzer && this.mode === 'mic') {
      try {
        this._analyzer.disconnectInput();
      } catch {
        // May already be disconnected
      }
      this._analyzer.volume = 1;
      this._analyzer.destroy();
      this._analyzer = null;
      // Also destroy the audio element — it's permanently bound to the old AudioContext
      if (this._audioEl) {
        this._audioEl.pause();
        this._audioEl.removeAttribute('src');
        this._audioEl.remove();
        this._audioEl = null;
      }
    }

    this.active = false;
    this.mode = null;
    this._energyHistory = [];
  }

  destroy() {
    this.stop();
    this._destroyed = true;

    if (this._analyzer) {
      this._analyzer.destroy();
      this._analyzer = null;
    }

    if (this._audioEl) {
      this._audioEl.remove();
      this._audioEl = null;
    }

    const container = document.getElementById('audio-analyzer-container');
    if (container) container.remove();
  }

  /**
   * Get current frequency band energies.
   * @returns {{ bass: number, lowMid: number, mid: number, highMid: number, treble: number, energy: number } | null}
   */
  getBands() {
    if (!this._analyzer || !this.active) return null;
    return {
      bass: this._analyzer.getEnergy('bass'),
      lowMid: this._analyzer.getEnergy('lowMid'),
      mid: this._analyzer.getEnergy('mid'),
      highMid: this._analyzer.getEnergy('highMid'),
      treble: this._analyzer.getEnergy('treble'),
      energy: this._analyzer.getEnergy(),
    };
  }

  // --- Private ---

  async _startMic() {
    if (!navigator.mediaDevices) {
      throw new Error('MediaDevices API not available');
    }

    this._micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    const micSource = this._analyzer.audioCtx.createMediaStreamSource(this._micStream);
    this._analyzer.connectInput(micSource);
    // Mute output to prevent feedback loop
    this._analyzer.volume = 0;
  }

  /**
   * Called on every animation frame by audiomotion-analyzer.
   * This is the heart of audio → visual mapping.
   */
  _onFrame() {
    if (!this.active || this._destroyed) return;

    const now = Date.now();
    if (now - this._lastReactionTime < this.config.reactionCooldown) return;

    const bands = this.getBands();
    if (!bands) return;

    const { thresholds } = this.config;

    // Determine if we should react
    let shouldReact = false;
    if (this.mode === 'mic') {
      shouldReact = bands.energy > thresholds.micEnergy;
    } else {
      shouldReact = bands.bass > thresholds.bass;
    }

    // Track energy history for sustained zoom
    this._energyHistory.push(bands.energy);
    const maxHistory = this.config.sustainedZoom.frames;
    if (this._energyHistory.length > maxHistory) {
      this._energyHistory.shift();
    }

    // Sustained high energy → zoom
    if (this.config.sustainedZoom.enabled && this._energyHistory.length >= maxHistory) {
      const avgEnergy = this._energyHistory.reduce((a, b) => a + b, 0) / this._energyHistory.length;
      if (avgEnergy > this.config.sustainedZoom.threshold) {
        this._sustainedZoomIn();
        this._energyHistory = []; // Reset after zooming
      }
    }

    if (!shouldReact) return;

    this._lastReactionTime = now;
    this._react(bands);
  }

  /**
   * Pick a visual action based on the audio bands and configured weights.
   */
  _react(bands) {
    const { actions } = this.config;

    // Build weighted action list
    const candidates = [
      { type: 'move', weight: actions.move.weight },
      { type: 'shapeChange', weight: actions.shapeChange.weight },
      { type: 'zoomIn', weight: actions.zoomIn.weight },
      { type: 'zoomOut', weight: actions.zoomOut.weight },
    ];

    // Mid-range energy boosts shape changes
    if (bands.mid > (this.config.thresholds.mid || 0.7)) {
      candidates.find((c) => c.type === 'shapeChange').weight *= 2;
    }

    // Treble boosts zoom
    if (bands.treble > (this.config.thresholds.treble || 0.8)) {
      candidates.find((c) => c.type === 'zoomIn').weight *= 3;
    }

    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    const roll = Math.random() * totalWeight;

    let cumulative = 0;
    for (const candidate of candidates) {
      cumulative += candidate.weight;
      if (roll < cumulative) {
        this._dispatch(candidate.type, bands);
        return;
      }
    }
  }

  _dispatch(actionType, bands) {
    switch (actionType) {
      case 'move':
        this._move(bands);
        break;
      case 'shapeChange':
        this.play.newChaos(this.play);
        break;
      case 'zoomIn':
        this._zoom('in', bands);
        break;
      case 'zoomOut':
        this._zoom('out', bands);
        break;
    }
  }

  _move(bands) {
    // Bass amplitude influences how far the emitter moves
    const x = this.play.getRandomEmitterX();
    const y = this.play.getRandomEmitterY();
    // Higher bass = faster move (shorter duration)
    const bassDuration = 2.0 - bands.bass * this.config.bassMoveFactor * 1.5;
    const duration = Math.max(0.3, bassDuration);
    this.play.moveEmitter(x, y, duration, 'power2.out');
  }

  _zoom(direction, bands) {
    const currentScale = window.viewport?.lastViewport?.scaleX || 1;
    const factor = 1 + bands.bass * 0.5; // Subtle: 1.0–1.5x based on bass

    let targetScale;
    if (direction === 'in') {
      targetScale = currentScale * factor;
    } else {
      targetScale = currentScale / factor;
    }

    const randX = Math.random() * window.innerWidth;
    const randY = Math.random() * window.innerHeight;
    const spawnX = this.play.emitter.spawnPos.x;
    const spawnY = this.play.emitter.spawnPos.y;

    const viewX = randX - spawnX * targetScale;
    const viewY = randY - spawnY * targetScale;

    this.play.goZoom(viewX, viewY, targetScale, 2);
  }

  _sustainedZoomIn() {
    const { sustainedZoom } = this.config;
    const currentScale = window.viewport?.lastViewport?.scaleX || 1;
    const targetScale = currentScale * sustainedZoom.zoomFactor;

    const spawnX = this.play.emitter.spawnPos.x;
    const spawnY = this.play.emitter.spawnPos.y;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const viewX = cx - spawnX * targetScale;
    const viewY = cy - spawnY * targetScale;

    this.play.newChaos(this.play);
    this.play.goZoom(viewX, viewY, targetScale, sustainedZoom.duration);
  }

  _mergeDeep(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._mergeDeep(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}
