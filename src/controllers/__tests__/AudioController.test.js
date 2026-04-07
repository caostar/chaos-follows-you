import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AudioController from '../AudioController';

// Mock audiomotion-analyzer
vi.mock('audiomotion-analyzer', () => {
  return {
    default: class MockAudioMotionAnalyzer {
      constructor(container, opts) {
        this._opts = opts;
        this._connected = false;
        this.volume = 1;
        this.audioCtx = {
          createMediaStreamSource: vi.fn(() => ({ connect: vi.fn() })),
        };
      }

      getEnergy(band) {
        const values = {
          bass: 0.7,
          lowMid: 0.4,
          mid: 0.5,
          highMid: 0.3,
          treble: 0.2,
          undefined: 0.45, // overall energy
        };
        return values[band] ?? 0.45;
      }

      connectInput(source) {
        this._connected = true;
      }

      disconnectInput() {
        this._connected = false;
      }

      destroy() {}
    },
  };
});

function makeMockPlay() {
  return {
    emitter: { spawnPos: { x: 100, y: 100 } },
    moveEmitter: vi.fn(),
    newChaos: vi.fn(),
    goZoom: vi.fn(),
    getRandomEmitterX: vi.fn(() => 200),
    getRandomEmitterY: vi.fn(() => 300),
  };
}

// Mock DOM APIs
beforeEach(() => {
  globalThis.window = globalThis.window || {};
  globalThis.window.viewport = {
    lastViewport: { scaleX: 1, scaleY: 1, x: 0, y: 0 },
    scale: { x: 1, y: 1 },
  };
  globalThis.window.innerWidth = 1280;
  globalThis.window.innerHeight = 720;

  // Mock document.createElement for audio element and container div
  const origCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = origCreate(tag);
    if (tag === 'audio') {
      el.play = vi.fn(() => Promise.resolve());
      el.pause = vi.fn();
      el.load = vi.fn();
      // When src is set, immediately fire canplay so _loadAndPlay resolves
      let srcValue = '';
      Object.defineProperty(el, 'src', {
        get() { return srcValue; },
        set(v) {
          srcValue = v;
          if (v) {
            setTimeout(() => el.dispatchEvent(new Event('canplay')), 0);
          }
        },
      });
    }
    return el;
  });

  // Mock fetch for loadConfig
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false, // Simulate missing config file → uses defaults
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  // Clean up any DOM elements created during tests
  const panel = document.getElementById('audio-analyzer-container');
  if (panel) panel.remove();
  const audioEl = document.getElementById('audio-controller-el');
  if (audioEl) audioEl.remove();
});

describe('AudioController', () => {
  let controller;
  let play;

  beforeEach(() => {
    play = makeMockPlay();
    controller = new AudioController(play);
  });

  afterEach(() => {
    controller.destroy();
  });

  it('starts inactive', () => {
    expect(controller.active).toBe(false);
    expect(controller.mode).toBeNull();
  });

  it('loads default config when audioControls.json is missing', async () => {
    await controller.loadConfig();
    expect(controller.config.defaultStream).toBe('https://icecast2.ufpel.edu.br/live');
    expect(controller.config.thresholds.bass).toBe(0.63);
  });

  it('loads custom config from audioControls.json', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ thresholds: { bass: 0.5 } }),
      }),
    );
    await controller.loadConfig();
    expect(controller.config.thresholds.bass).toBe(0.5);
    // Other defaults should remain
    expect(controller.config.defaultStream).toBe('https://icecast2.ufpel.edu.br/live');
  });

  describe('start/stop', () => {
    it('starts in stream mode', async () => {
      await controller.start('stream', 'http://example.com/stream');
      expect(controller.active).toBe(true);
      expect(controller.mode).toBe('stream');
    });

    it('starts in file mode with URL string', async () => {
      await controller.start('file', 'http://example.com/song.mp3');
      expect(controller.active).toBe(true);
      expect(controller.mode).toBe('file');
    });

    it('stops and resets state', async () => {
      await controller.start('stream');
      controller.stop();
      expect(controller.active).toBe(false);
      expect(controller.mode).toBeNull();
    });

    it('does not error when stopping while inactive', () => {
      expect(() => controller.stop()).not.toThrow();
    });

    it('restarts cleanly when switching modes', async () => {
      await controller.start('stream');
      expect(controller.mode).toBe('stream');
      await controller.start('file', 'http://example.com/song.mp3');
      expect(controller.mode).toBe('file');
      expect(controller.active).toBe(true);
    });
  });

  describe('getBands', () => {
    it('returns null when inactive', () => {
      expect(controller.getBands()).toBeNull();
    });

    it('returns band data when active', async () => {
      await controller.start('stream');
      const bands = controller.getBands();
      expect(bands).toHaveProperty('bass');
      expect(bands).toHaveProperty('lowMid');
      expect(bands).toHaveProperty('mid');
      expect(bands).toHaveProperty('highMid');
      expect(bands).toHaveProperty('treble');
      expect(bands).toHaveProperty('energy');
    });
  });

  describe('_react', () => {
    it('dispatches move action', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1); // Low roll → move
      const bands = { bass: 0.8, lowMid: 0.4, mid: 0.3, highMid: 0.2, treble: 0.1, energy: 0.5 };
      controller._react(bands);
      expect(play.moveEmitter).toHaveBeenCalled();
      vi.spyOn(Math, 'random').mockRestore();
    });

    it('dispatches shapeChange action', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.6); // Mid roll → shapeChange
      const bands = { bass: 0.5, lowMid: 0.4, mid: 0.3, highMid: 0.2, treble: 0.1, energy: 0.4 };
      controller._react(bands);
      expect(play.newChaos).toHaveBeenCalledWith(play);
      vi.spyOn(Math, 'random').mockRestore();
    });

    it('dispatches zoom action on high roll', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.98); // Very high → zoom
      const bands = { bass: 0.5, lowMid: 0.4, mid: 0.3, highMid: 0.2, treble: 0.1, energy: 0.4 };
      controller._react(bands);
      expect(play.goZoom).toHaveBeenCalled();
      vi.spyOn(Math, 'random').mockRestore();
    });

    it('boosts shapeChange weight when mid is high', () => {
      // With mid > 0.7, shapeChange weight doubles (40 → 80)
      // New total: 50 + 80 + 5 + 5 = 140
      // shapeChange range: 50-130 out of 140 → 35.7%-92.9%
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // Should now hit shapeChange
      const bands = { bass: 0.5, lowMid: 0.4, mid: 0.8, highMid: 0.2, treble: 0.1, energy: 0.4 };
      controller._react(bands);
      expect(play.newChaos).toHaveBeenCalledWith(play);
      vi.spyOn(Math, 'random').mockRestore();
    });
  });

  describe('_move', () => {
    it('calls moveEmitter with shorter duration for higher bass', () => {
      const lowBass = { bass: 0.2, energy: 0.3 };
      const highBass = { bass: 0.9, energy: 0.7 };

      controller._move(lowBass);
      const durationLow = play.moveEmitter.mock.calls[0][2];

      controller._move(highBass);
      const durationHigh = play.moveEmitter.mock.calls[1][2];

      expect(durationHigh).toBeLessThan(durationLow);
    });
  });

  describe('_onFrame', () => {
    it('respects reaction cooldown', async () => {
      await controller.start('stream');

      // Manually trigger two frames in rapid succession
      controller._lastReactionTime = Date.now();
      controller._onFrame();

      // Should not have reacted (cooldown not elapsed)
      expect(play.moveEmitter).not.toHaveBeenCalled();
      expect(play.newChaos).not.toHaveBeenCalled();
    });

    it('does not react when inactive', () => {
      controller._onFrame();
      expect(play.moveEmitter).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('cleans up everything', async () => {
      await controller.start('stream');
      controller.destroy();
      expect(controller.active).toBe(false);
      expect(controller._analyzer).toBeNull();
    });
  });

  describe('_mergeDeep', () => {
    it('deep merges nested objects', () => {
      const target = { a: { b: 1, c: 2 }, d: 3 };
      const source = { a: { b: 10 }, e: 5 };
      const result = controller._mergeDeep(target, source);
      expect(result).toEqual({ a: { b: 10, c: 2 }, d: 3, e: 5 });
    });

    it('does not mutate target', () => {
      const target = { a: { b: 1 } };
      const source = { a: { b: 2 } };
      controller._mergeDeep(target, source);
      expect(target.a.b).toBe(1);
    });
  });
});
