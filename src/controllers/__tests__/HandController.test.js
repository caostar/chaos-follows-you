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
    expect(controller.config.detectionInterval).toBe(50);
    expect(controller.config.pinchThreshold).toBe(0.07);
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
    expect(controller.config.detectionInterval).toBe(50);
  });

  describe('stop', () => {
    it('does not error when stopping while inactive', () => {
      expect(() => controller.stop()).not.toThrow();
    });
  });

  describe('gesture detection', () => {
    function makeLandmarks() {
      const lm = [];
      for (let i = 0; i < 21; i++) {
        lm.push({ x: 0.5, y: 0.5, z: 0 });
      }
      return lm;
    }

    it('detects pinch when thumb and index are close', () => {
      const lm = makeLandmarks();
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
  });

  describe('two-hand zoom', () => {
    function makeLandmarks() {
      const lm = [];
      for (let i = 0; i < 21; i++) {
        lm.push({ x: 0.5, y: 0.5, z: 0 });
      }
      return lm;
    }

    it('does not zoom on first two-hand frame (sets baseline)', () => {
      const hand1 = makeLandmarks();
      const hand2 = makeLandmarks();
      hand1[0] = { x: 0.3, y: 0.5, z: 0 }; // wrist
      hand2[0] = { x: 0.7, y: 0.5, z: 0 }; // wrist

      controller._handleTwoHandZoom(hand1, hand2, 10000);
      expect(play.goZoom).not.toHaveBeenCalled();
      expect(controller._prevHandDist).not.toBeNull();
    });

    it('zooms in when hands spread apart', () => {
      const hand1 = makeLandmarks();
      const hand2 = makeLandmarks();

      // Frame 1: baseline
      hand1[0] = { x: 0.4, y: 0.5, z: 0 };
      hand2[0] = { x: 0.6, y: 0.5, z: 0 };
      controller._handleTwoHandZoom(hand1, hand2, 10000);

      // Frame 2: hands spread further apart (after cooldown)
      hand1[0] = { x: 0.3, y: 0.5, z: 0 };
      hand2[0] = { x: 0.7, y: 0.5, z: 0 };
      controller._handleTwoHandZoom(hand1, hand2, 11000);

      expect(play.goZoom).toHaveBeenCalled();
      // Target scale should be > 1 (zooming in via random factor)
      const targetScale = play.goZoom.mock.calls[0][2];
      expect(targetScale).toBeGreaterThan(1);
    });

    it('zooms out when hands come together', () => {
      const hand1 = makeLandmarks();
      const hand2 = makeLandmarks();

      // Frame 1: baseline (hands far apart)
      hand1[0] = { x: 0.2, y: 0.5, z: 0 };
      hand2[0] = { x: 0.8, y: 0.5, z: 0 };
      controller._handleTwoHandZoom(hand1, hand2, 10000);

      // Frame 2: hands come closer (after cooldown)
      hand1[0] = { x: 0.35, y: 0.5, z: 0 };
      hand2[0] = { x: 0.65, y: 0.5, z: 0 };
      controller._handleTwoHandZoom(hand1, hand2, 11000);

      expect(play.goZoom).toHaveBeenCalled();
      const targetScale = play.goZoom.mock.calls[0][2];
      expect(targetScale).toBeLessThan(1);
    });

    it('ignores small movements below threshold', () => {
      const hand1 = makeLandmarks();
      const hand2 = makeLandmarks();

      // Frame 1: baseline
      hand1[0] = { x: 0.4, y: 0.5, z: 0 };
      hand2[0] = { x: 0.6, y: 0.5, z: 0 };
      controller._handleTwoHandZoom(hand1, hand2, 10000);

      // Frame 2: tiny movement (below threshold, after cooldown)
      hand1[0] = { x: 0.399, y: 0.5, z: 0 };
      hand2[0] = { x: 0.601, y: 0.5, z: 0 };
      controller._handleTwoHandZoom(hand1, hand2, 11000);

      expect(play.goZoom).not.toHaveBeenCalled();
    });

    it('resets when hands disappear', () => {
      const hand1 = makeLandmarks();
      const hand2 = makeLandmarks();
      hand1[0] = { x: 0.3, y: 0.5, z: 0 };
      hand2[0] = { x: 0.7, y: 0.5, z: 0 };
      controller._handleTwoHandZoom(hand1, hand2, 10000);
      expect(controller._prevHandDist).not.toBeNull();

      // No hands detected
      controller._processResults({ landmarks: [], handedness: [] }, 10100);
      expect(controller._prevHandDist).toBeNull();
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
      // Duration is detectionInterval * 1.5 / 1000 = 50 * 1.5 / 1000 = 0.075
      expect(duration).toBeCloseTo(0.075, 2);
      expect(ease).toBe('power2.out');
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

    it('zooms with two hands via processResults', () => {
      const lm1 = [];
      const lm2 = [];
      for (let i = 0; i < 21; i++) {
        lm1.push({ x: 0.5, y: 0.5, z: 0 });
        lm2.push({ x: 0.5, y: 0.5, z: 0 });
      }
      lm1[0] = { x: 0.4, y: 0.5, z: 0 }; // wrist 1
      lm2[0] = { x: 0.6, y: 0.5, z: 0 }; // wrist 2

      // Frame 1: baseline
      controller._processResults({ landmarks: [lm1, lm2], handedness: [] }, 10000);
      expect(play.goZoom).not.toHaveBeenCalled();

      // Frame 2: hands spread (after cooldown)
      lm1[0] = { x: 0.3, y: 0.5, z: 0 };
      lm2[0] = { x: 0.7, y: 0.5, z: 0 };
      controller._processResults({ landmarks: [lm1, lm2], handedness: [] }, 11000);
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
