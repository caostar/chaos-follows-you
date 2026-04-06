import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PIXI
const mockGraphics = {
  clear: vi.fn(),
  beginFill: vi.fn(),
  lineTo: vi.fn(),
  endFill: vi.fn(),
  width: 256,
  height: 256,
};

const mockSprite = {
  x: 0,
  y: 0,
  width: 256,
  height: 256,
  texture: null,
  mask: null,
};

const mockTexture = { id: 'test-texture' };

vi.mock('pixi.js', () => ({
  Container: class {
    constructor() {
      this.children = [];
    }
    addChild(child) {
      this.children.push(child);
      return child;
    }
  },
  Graphics: vi.fn(() => mockGraphics),
  Sprite: vi.fn(() => ({ ...mockSprite })),
  SCALE_MODES: { LINEAR: 1 },
}));

// Mock the global renderer
globalThis.renderer = {
  generateTexture: vi.fn(() => ({ isTexture: true })),
};

describe('PixiChaosStar', () => {
  let PixiChaosStar;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../PixiChaosStar');
    PixiChaosStar = mod.PixiChaosStar;
  });

  it('constructs with given dimensions', () => {
    const star = new PixiChaosStar(256, 256, false);
    expect(star.starWidth).toBe(256);
    expect(star.starHeight).toBe(256);
    expect(star.isvector).toBe(false);
  });

  it('constructs in vector mode', () => {
    const star = new PixiChaosStar(128, 128, true);
    expect(star.isvector).toBe(true);
  });

  describe('drawStar', () => {
    it('clears graphics and begins fill', () => {
      const star = new PixiChaosStar(256, 256, true);
      star.drawStar(mockGraphics, 0, 1, 5, 2, 1, 3, 30, 0xFFFFFF);

      expect(mockGraphics.clear).toHaveBeenCalled();
      expect(mockGraphics.beginFill).toHaveBeenCalledWith(0xFFFFFF, 1);
      expect(mockGraphics.endFill).toHaveBeenCalled();
    });

    it('draws 8 points (calls lineTo many times for the star shape)', () => {
      const star = new PixiChaosStar(256, 256, true);
      mockGraphics.lineTo.mockClear();
      star.drawStar(mockGraphics, 0, 1, 5, 2, 1, 3, 30, 0xFF0000);

      // 8 points × 7 lineTo calls per point + transitions = many calls
      // At minimum we expect 8 × 6 = 48 lineTo calls (6 vertices per arrow + 1 transition)
      expect(mockGraphics.lineTo.mock.calls.length).toBeGreaterThan(40);
    });

    it('uses custom color when provided', () => {
      const star = new PixiChaosStar(256, 256, true);
      star.drawStar(mockGraphics, 0, 1, 5, 2, 1, 3, 30, 0x00FF00);
      expect(mockGraphics.beginFill).toHaveBeenCalledWith(0x00FF00, 1);
    });

    it('defaults to white when no color provided', () => {
      const star = new PixiChaosStar(256, 256, true);
      star.drawStar(mockGraphics, 0, 1, 5, 2, 1, 3, 30, undefined);
      expect(mockGraphics.beginFill).toHaveBeenCalledWith(0xFFFFFF, 1);
    });
  });

  describe('getRandomPixiCaostarTexture', () => {
    it('returns a texture object', () => {
      const star = new PixiChaosStar(256, 256, false);
      const result = star.getRandomPixiCaostarTexture(mockTexture);
      expect(result).toBeDefined();
    });
  });
});
