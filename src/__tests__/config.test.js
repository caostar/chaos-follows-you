import { describe, it, expect } from 'vitest';
import config from '../config';

describe('config', () => {
  it('has view configuration', () => {
    expect(config.view).toBeDefined();
    expect(config.view.backgroundColor).toBe(0x000000);
    expect(config.view.antialias).toBe(true);
    expect(config.view.centerOnResize).toBe(true);
  });

  it('has game configuration with viewport interactions', () => {
    expect(config.game).toBeDefined();
    expect(config.game.drag).toBe(true);
    expect(config.game.pinch).toBe(true);
    expect(config.game.wheel).toBe(true);
    expect(config.game.decelerate).toBe(true);
  });

  it('has scene configuration', () => {
    expect(config.scenes.Splash).toBeDefined();
    expect(config.scenes.Splash.hideDelay).toBe(0);
  });

  it('has world dimensions', () => {
    expect(config.game.width).toBe(1000);
    expect(config.game.height).toBe(500);
  });
});
