import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pixi.js before importing AssetManager
vi.mock('pixi.js', () => ({
  Assets: {
    resolver: { hasKey: vi.fn(() => false) },
    add: vi.fn(),
    load: vi.fn(() => Promise.resolve()),
  },
  Texture: {
    from: vi.fn((id) => ({ id })),
  },
}));

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    once: vi.fn((event, cb) => cb()),
  })),
}));

describe('AssetManager', () => {
  let AssetManager;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../AssetManager');
    AssetManager = mod.default;
  });

  it('is a singleton', async () => {
    const mod2 = await import('../AssetManager');
    expect(AssetManager).toBe(mod2.default);
  });

  it('has images, sounds, assets, and textures getters', () => {
    expect(AssetManager.images).toBeDefined();
    expect(AssetManager.sounds).toBeDefined();
    expect(AssetManager.assets).toBeDefined();
    expect(AssetManager.textures).toBeDefined();
  });

  it('scans assets directory and categorizes by extension', () => {
    const images = AssetManager.images;
    const allKeys = Object.keys(images);
    // All image keys should exist (from import.meta.glob)
    expect(allKeys.length).toBeGreaterThan(0);

    // All image values should be URL strings
    for (const url of Object.values(images)) {
      expect(typeof url).toBe('string');
    }
  });

  it('separates images from sounds', () => {
    const imageKeys = Object.keys(AssetManager.images);
    const soundKeys = Object.keys(AssetManager.sounds);

    // No overlap between images and sounds
    for (const key of imageKeys) {
      expect(soundKeys).not.toContain(key);
    }
  });

  it('textures can be set and retrieved', () => {
    const mockTextures = { texture1: 'url1', texture2: 'url2' };
    AssetManager.textures = mockTextures;
    expect(AssetManager.textures).toEqual(mockTextures);
  });

  it('prepareImages is a no-op that resolves', async () => {
    await expect(AssetManager.prepareImages()).resolves.toBeUndefined();
  });
});
