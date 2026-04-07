import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HandController from '../HandController';

// Mock @mediapipe/tasks-vision
vi.mock('@mediapipe/tasks-vision', () => {
  const mockHandLandmarker = {
    detectForVideo: vi.fn(() => ({
      landmarks: [],
      handedness: [],
    })),
    close: vi.fn(),
  };

  return {
    FilesetResolver: {
      forVisionTasks: vi.fn(() => Promise.resolve({})),
    },
    HandLandmarker: {
      createFromOptions: vi.fn(() => Promise.resolve(mockHandLandmarker)),
      HAND_CONNECTIONS: [],
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

  // Mock fetch for loadConfig
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok: false }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  // Clean up DOM elements
  const video = document.getElementById('hand-tracking-video');
  if (video) video.remove();
  const canvas = document.getElementById('hand-tracking-debug');
  if (canvas) canvas.remove();
});

describe('HandController', () => {
  let controller;
  let play;

  beforeEach(() => {
    play = makeMockPlay();
    controller = new HandController(play);
  });

  afterEach(() => {
    controller.destroy();
  });

  it('starts inactive', () => {
    expect(controller.active).toBe(false);
  });

  it('loads default config when handControls.json is missing', async () => {
    await controller.loadConfig();
    expect(controller.config.detectionInterval).toBe(66);
    expect(controller.config.pinchThreshold).toBe(0.06);
    expect(controller.config.smoothing).toBe(0.3);
  });

  it('loads custom config from handControls.json', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ smoothing: 0.5, pinchThreshold: 0.08 }),
      }),
    );
    await controller.loadConfig();
    expect(controller.config.smoothing).toBe(0.5);
    expect(controller.config.pinchThreshold).toBe(0.08);
    // Defaults preserved
    expect(controller.config.detectionInterval).toBe(66);
  });

  describe('stop', () => {
    it('does not error when stopping while inactive', () => {
      expect(() => controller.stop()).not.toThrow();
    });
  });

  describe('gesture detection', () => {
    // Create fake landmarks (21 points)
    function makeLandmarks() {
      const lm = [];
      for (let i = 0; i < 21; i++) {
        lm.push({ x: 0.5, y: 0.5, z: 0 });
      }
      return lm;
    }

    it('detects pinch when thumb and index are close', () => {
      const lm = makeLandmarks();
      // Thumb tip (4) and index tip (8) very close
      lm[4] = { x: 0.5, y: 0.5, z: 0 };
      lm[8] = { x: 0.52, y: 0.52, z: 0 };
      expect(controller._isPinching(lm)).toBe(true);
    });

    it('does not detect pinch when thumb and index are far', () => {
      const lm = makeLandmarks();
      lm[4] = { x: 0.2, y: 0.2, z: 0 };
      lm[8] = { x: 0.8, y: 0.8, z: 0 };
      expect(controller._isPinching(lm)).toBe(false);
    });

    it('detects open hand when all fingers extended', () => {
      const lm = makeLandmarks();
      // Tips above (lower y) their MCPs
      // Index: tip=8, mcp=5
      lm[8] = { x: 0.5, y: 0.2, z: 0 };
      lm[5] = { x: 0.5, y: 0.5, z: 0 };
      // Middle: tip=12, mcp=9
      lm[12] = { x: 0.5, y: 0.2, z: 0 };
      lm[9] = { x: 0.5, y: 0.5, z: 0 };
      // Ring: tip=16, mcp=13
      lm[16] = { x: 0.5, y: 0.2, z: 0 };
      lm[13] = { x: 0.5, y: 0.5, z: 0 };
      // Pinky: tip=20, mcp=17
      lm[20] = { x: 0.5, y: 0.2, z: 0 };
      lm[17] = { x: 0.5, y: 0.5, z: 0 };

      expect(controller._detectGesture(lm)).toBe('open');
    });

    it('detects fist when all fingers curled', () => {
      const lm = makeLandmarks();
      // Tips below (higher y) their MCPs
      lm[8] = { x: 0.5, y: 0.8, z: 0 };
      lm[5] = { x: 0.5, y: 0.5, z: 0 };
      lm[12] = { x: 0.5, y: 0.8, z: 0 };
      lm[9] = { x: 0.5, y: 0.5, z: 0 };
      lm[16] = { x: 0.5, y: 0.8, z: 0 };
      lm[13] = { x: 0.5, y: 0.5, z: 0 };
      lm[20] = { x: 0.5, y: 0.8, z: 0 };
      lm[17] = { x: 0.5, y: 0.5, z: 0 };

      expect(controller._detectGesture(lm)).toBe('fist');
    });

    it('returns null for ambiguous gestures', () => {
      const lm = makeLandmarks();
      // Only 2 fingers extended, 2 curled
      lm[8] = { x: 0.5, y: 0.2, z: 0 };
      lm[5] = { x: 0.5, y: 0.5, z: 0 };
      lm[12] = { x: 0.5, y: 0.2, z: 0 };
      lm[9] = { x: 0.5, y: 0.5, z: 0 };
      lm[16] = { x: 0.5, y: 0.8, z: 0 };
      lm[13] = { x: 0.5, y: 0.5, z: 0 };
      lm[20] = { x: 0.5, y: 0.8, z: 0 };
      lm[17] = { x: 0.5, y: 0.5, z: 0 };

      expect(controller._detectGesture(lm)).toBeNull();
    });
  });

  describe('_trackFinger', () => {
    it('calls moveEmitter with mapped coordinates', () => {
      const lm = [];
      for (let i = 0; i < 21; i++) {
        lm.push({ x: 0.5, y: 0.5, z: 0 });
      }
      // Index tip at center of video → should map to center of screen
      lm[8] = { x: 0.5, y: 0.5, z: 0 };

      controller._trackFinger(lm);
      expect(play.moveEmitter).toHaveBeenCalled();
      const [x, y, duration, ease] = play.moveEmitter.mock.calls[0];
      expect(x).toBeCloseTo(640, -1); // center of 1280
      expect(y).toBeCloseTo(360, -1); // center of 720
      expect(duration).toBe(0.15);
      expect(ease).toBe('none');
    });

    it('applies smoothing on subsequent calls', () => {
      const lm = [];
      for (let i = 0; i < 21; i++) {
        lm.push({ x: 0.5, y: 0.5, z: 0 });
      }

      // First call — no smoothing (sets initial position)
      lm[8] = { x: 0.5, y: 0.5, z: 0 };
      controller._trackFinger(lm);

      // Second call — with smoothing, position should not jump fully
      lm[8] = { x: 0.0, y: 0.0, z: 0 };
      controller._trackFinger(lm);

      const [x2, y2] = play.moveEmitter.mock.calls[1];
      // With smoothing 0.3, new position should be between old and new
      // oldX=640, newX=1280 (normX=1-0=1, screenX=1280)
      // smoothed = 640 * 0.3 + 1280 * 0.7 = 192 + 896 = 1088
      expect(x2).toBeGreaterThan(640);
      expect(x2).toBeLessThan(1280);
    });
  });

  describe('_processResults', () => {
    it('triggers newChaos on pinch', () => {
      const lm = [];
      for (let i = 0; i < 21; i++) {
        lm.push({ x: 0.5, y: 0.5, z: 0 });
      }
      // Pinch: thumb and index very close
      lm[4] = { x: 0.5, y: 0.5, z: 0 };
      lm[8] = { x: 0.51, y: 0.51, z: 0 };

      const results = { landmarks: [lm], handedness: [] };
      controller._processResults(results, performance.now());

      expect(play.newChaos).toHaveBeenCalledWith(play);
    });

    it('triggers zoom on open hand gesture', () => {
      const lm = [];
      for (let i = 0; i < 21; i++) {
        lm.push({ x: 0.5, y: 0.5, z: 0 });
      }
      // All 4 fingers extended: tips well above MCPs
      lm[5] = { x: 0.3, y: 0.6, z: 0 };  // index MCP
      lm[8] = { x: 0.3, y: 0.2, z: 0 };  // index tip (extended)
      lm[9] = { x: 0.4, y: 0.6, z: 0 };  // middle MCP
      lm[12] = { x: 0.4, y: 0.2, z: 0 }; // middle tip (extended)
      lm[13] = { x: 0.5, y: 0.6, z: 0 }; // ring MCP
      lm[16] = { x: 0.5, y: 0.2, z: 0 }; // ring tip (extended)
      lm[17] = { x: 0.6, y: 0.6, z: 0 }; // pinky MCP
      lm[20] = { x: 0.6, y: 0.2, z: 0 }; // pinky tip (extended)
      // Thumb far from index (no pinch)
      lm[4] = { x: 0.1, y: 0.3, z: 0 };  // thumb tip

      // Verify gesture detection works
      expect(controller._detectGesture(lm)).toBe('open');
      expect(controller._isPinching(lm)).toBe(false);

      const results = { landmarks: [lm], handedness: [] };
      // Use a large timestamp to ensure gesture cooldown (800ms) has elapsed from 0
      controller._processResults(results, 10000);

      expect(play.goZoom).toHaveBeenCalled();
    });

    it('does nothing when no landmarks detected', () => {
      const results = { landmarks: [], handedness: [] };
      controller._processResults(results, performance.now());

      expect(play.moveEmitter).not.toHaveBeenCalled();
      expect(play.newChaos).not.toHaveBeenCalled();
      expect(play.goZoom).not.toHaveBeenCalled();
    });

    it('respects pinch cooldown', () => {
      const lm = [];
      for (let i = 0; i < 21; i++) {
        lm.push({ x: 0.5, y: 0.5, z: 0 });
      }
      lm[4] = { x: 0.5, y: 0.5, z: 0 };
      lm[8] = { x: 0.51, y: 0.51, z: 0 };

      const now = performance.now();
      const results = { landmarks: [lm], handedness: [] };

      controller._processResults(results, now);
      expect(play.newChaos).toHaveBeenCalledTimes(1);

      // Immediately again — should be on cooldown
      controller._processResults(results, now + 10);
      expect(play.newChaos).toHaveBeenCalledTimes(1);

      // After cooldown
      controller._processResults(results, now + 600);
      expect(play.newChaos).toHaveBeenCalledTimes(2);
    });
  });

  describe('_distance', () => {
    it('computes euclidean distance', () => {
      const d = controller._distance(
        { x: 0, y: 0, z: 0 },
        { x: 3, y: 4, z: 0 },
      );
      expect(d).toBeCloseTo(5);
    });

    it('handles 3D distance', () => {
      const d = controller._distance(
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1 },
      );
      expect(d).toBeCloseTo(Math.sqrt(3));
    });
  });

  describe('destroy', () => {
    it('cleans up without errors', () => {
      expect(() => controller.destroy()).not.toThrow();
      expect(controller.active).toBe(false);
    });
  });
});
