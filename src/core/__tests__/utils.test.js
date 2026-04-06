import { describe, it, expect } from 'vitest';
import { fit, center } from '../utils';

function makeElement(w, h, sx = 1, sy = 1) {
  return {
    width: w,
    height: h,
    x: 0,
    y: 0,
    scale: { x: sx, y: sy },
  };
}

describe('fit', () => {
  it('scales element down to fit within bounds', () => {
    const el = makeElement(200, 100);
    fit(el, { width: 100, height: 100 });
    expect(el.scale.x).toBe(0.5);
    expect(el.scale.y).toBe(0.5);
  });

  it('does not upscale by default', () => {
    const el = makeElement(50, 50);
    fit(el, { width: 100, height: 100 });
    expect(el.scale.x).toBeLessThanOrEqual(1);
    expect(el.scale.y).toBeLessThanOrEqual(1);
  });

  it('allows upscaling when overscale is true', () => {
    const el = makeElement(50, 50);
    fit(el, { width: 100, height: 100 }, false, true);
    expect(el.scale.x).toBe(2);
    expect(el.scale.y).toBe(2);
  });

  it('stretches independently when ignoreRatio is true', () => {
    const el = makeElement(200, 100);
    fit(el, { width: 100, height: 200 }, true);
    expect(el.scale.x).toBe(0.5);
    expect(el.scale.y).toBe(2);
  });
});

describe('center', () => {
  it('centers element in both axes by default', () => {
    const el = makeElement(100, 50);
    center(el, { width: 400, height: 300 });
    expect(el.x).toBe(150);
    expect(el.y).toBe(125);
  });

  it('centers only horizontally', () => {
    const el = makeElement(100, 50);
    el.y = 42;
    center(el, { width: 400, height: 300 }, { horizontally: true, vertically: false });
    expect(el.x).toBe(150);
    expect(el.y).toBe(42);
  });

  it('centers only vertically', () => {
    const el = makeElement(100, 50);
    el.x = 42;
    center(el, { width: 400, height: 300 }, { horizontally: false, vertically: true });
    expect(el.x).toBe(42);
    expect(el.y).toBe(125);
  });
});
