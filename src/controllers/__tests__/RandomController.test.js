import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RandomController from '../RandomController';

const mockConfig = {
  enabled: true,
  toggleKey: 'a',
  inactivityTimeout: 30,
  zoom: {
    minScale: 0.05,
    maxScale: 50,
    inFactor: { min: 1.2, max: 3.0 },
    outFactor: { min: 1.2, max: 3.0 },
    duration: { min: 2.0, max: 5.0 },
    weight: 10,
    cooldown: 5.0,
  },
  movement: {
    duration: { min: 1.5, max: 4.0 },
    ease: 'power2.inOut',
    weight: 60,
    cooldown: 0.5,
  },
  shapeChange: {
    weight: 30,
    cooldown: 1.0,
  },
  pause: {
    chance: 0.15,
    duration: { min: 1.0, max: 4.0 },
  },
  rhythm: {
    interval: { min: 0.8, max: 3.0 },
  },
};

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

// Mock viewport on window
beforeEach(() => {
  globalThis.window = globalThis.window || {};
  globalThis.window.viewport = {
    lastViewport: { scaleX: 1, scaleY: 1, x: 0, y: 0 },
    scale: { x: 1, y: 1 },
  };
  globalThis.window.innerWidth = 1280;
  globalThis.window.innerHeight = 720;
});

describe('RandomController', () => {
  let controller;
  let play;

  beforeEach(() => {
    vi.useFakeTimers();
    play = makeMockPlay();
    controller = new RandomController(play);
    controller.config = mockConfig;
  });

  afterEach(() => {
    controller.stop();
    vi.useRealTimers();
  });

  it('starts inactive', () => {
    expect(controller.active).toBe(false);
  });

  it('becomes active on start()', () => {
    controller.start();
    expect(controller.active).toBe(true);
  });

  it('becomes inactive on stop()', () => {
    controller.start();
    controller.stop();
    expect(controller.active).toBe(false);
  });

  it('does not double-start', () => {
    controller.start();
    controller.start();
    expect(controller.active).toBe(true);
  });

  it('schedules actions after start', () => {
    controller.start();
    // Advance time past the max rhythm interval + max pause
    vi.advanceTimersByTime(8000);
    // At least one action should have fired
    const totalCalls = play.moveEmitter.mock.calls.length
      + play.newChaos.mock.calls.length
      + play.goZoom.mock.calls.length;
    expect(totalCalls).toBeGreaterThan(0);
  });

  it('stops scheduling after stop()', () => {
    controller.start();
    vi.advanceTimersByTime(1000);
    controller.stop();
    const callsBefore = play.moveEmitter.mock.calls.length
      + play.newChaos.mock.calls.length
      + play.goZoom.mock.calls.length;
    vi.advanceTimersByTime(10000);
    const callsAfter = play.moveEmitter.mock.calls.length
      + play.newChaos.mock.calls.length
      + play.goZoom.mock.calls.length;
    expect(callsAfter).toBe(callsBefore);
  });

  describe('_act', () => {
    it('calls _move when roll falls in movement range', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1); // 0.1 * 100 = 10, < movement.weight(60)
      controller._act();
      expect(play.moveEmitter).toHaveBeenCalled();
      vi.spyOn(Math, 'random').mockRestore();
    });

    it('calls _changeShape when roll falls in shapeChange range', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.7); // 0.7 * 100 = 70, between 60 and 90
      controller._act();
      expect(play.newChaos).toHaveBeenCalledWith(play);
      vi.spyOn(Math, 'random').mockRestore();
    });

    it('calls _zoom when roll falls in zoom range', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.95); // 0.95 * 100 = 95, > 90
      controller._act();
      expect(play.goZoom).toHaveBeenCalled();
      vi.spyOn(Math, 'random').mockRestore();
    });
  });

  describe('_zoom clamping', () => {
    it('clamps zoom in to maxScale', () => {
      window.viewport.lastViewport.scaleX = 45;
      controller._zoom();
      const zoomCall = play.goZoom.mock.calls[0];
      const scale = zoomCall[2]; // third arg is scale
      expect(scale).toBeLessThanOrEqual(mockConfig.zoom.maxScale);
    });

    it('clamps zoom out to minScale', () => {
      window.viewport.lastViewport.scaleX = 0.06;
      controller._zoom();
      const zoomCall = play.goZoom.mock.calls[0];
      const scale = zoomCall[2];
      expect(scale).toBeGreaterThanOrEqual(mockConfig.zoom.minScale);
    });

    it('biases zoom in when near minScale', () => {
      window.viewport.lastViewport.scaleX = 0.06; // <= minScale * 1.5
      // Multiple zoom calls should all zoom in (increase scale)
      for (let i = 0; i < 10; i++) {
        controller._zoom();
      }
      play.goZoom.mock.calls.forEach((call) => {
        expect(call[2]).toBeGreaterThanOrEqual(0.05);
      });
    });
  });

  describe('_move', () => {
    it('calls moveEmitter with random coordinates and configured duration/ease', () => {
      controller._move();
      expect(play.moveEmitter).toHaveBeenCalledWith(
        200, 300,
        expect.any(Number),
        mockConfig.movement.ease,
      );
      const duration = play.moveEmitter.mock.calls[0][2];
      expect(duration).toBeGreaterThanOrEqual(mockConfig.movement.duration.min);
      expect(duration).toBeLessThanOrEqual(mockConfig.movement.duration.max);
    });
  });

  describe('_rand', () => {
    it('returns value within range', () => {
      for (let i = 0; i < 100; i++) {
        const val = controller._rand(5, 10);
        expect(val).toBeGreaterThanOrEqual(5);
        expect(val).toBeLessThanOrEqual(10);
      }
    });
  });
});
