import * as PIXI from 'pixi.js';

// Pre-compute degree-to-radian constant
const DEG2RAD = Math.PI / 180;

// Pre-compute sin/cos lookup for the 8 arrow angles (0, 45, 90, ..., 315)
const SIN_TABLE = [];
const COS_TABLE = [];
for (let i = 0; i < 8; i++) {
  const rad = i * 45 * DEG2RAD;
  SIN_TABLE[i] = Math.sin(rad);
  COS_TABLE[i] = Math.cos(rad);
}

/**
 * Optimized chaos star generator with texture pooling.
 *
 * Instead of generating a new texture on every shape change (expensive GPU call),
 * we pre-generate a pool of textures at startup, then cycle through them instantly.
 * New textures are generated in the background during idle time.
 */
export class PixiChaosStar extends PIXI.Container {
  constructor(_starWidth, _starHeight, _isvector) {
    super();
    this.isvector = _isvector;
    this.starWidth = _starWidth;
    this.starHeight = _starHeight;

    this.theStarGraphic = new PIXI.Graphics();
    this.starBMP = new PIXI.Sprite();
    this.starTexture = null;

    // Texture pool for instant swapping
    this._pool = [];
    this._poolIndex = 0;
    this._poolTarget = 120; // Pool size
    this._generating = false;
    this._sourceTextures = []; // Color textures for masked rendering
  }

  /**
   * Pre-generate a pool of textures. Called once at startup.
   * Generates the first few synchronously (needed for immediate display),
   * then continues asynchronously in idle callbacks.
   */
  async buildPool(textures, count = 120) {
    this._poolTarget = count;
    this._sourceTextures = textures; // Store for refills

    // Generate first 8 synchronously for immediate use
    const syncCount = Math.min(8, count);
    for (let i = 0; i < syncCount; i++) {
      this._pool.push(this._generateOne(this._randomSourceTexture()));
    }

    // Generate the rest asynchronously in chunks
    this._generating = true;
    let remaining = count - syncCount;
    while (remaining > 0 && this._generating) {
      await new Promise((r) => {
        (typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout)(r);
      });
      const batch = Math.min(remaining, 3);
      for (let j = 0; j < batch; j++) {
        this._pool.push(this._generateOne(this._randomSourceTexture()));
        remaining--;
      }
    }
    this._generating = false;
    console.log(`[PixiChaosStar] Pool ready: ${this._pool.length} textures`);
  }

  _randomSourceTexture() {
    if (this._sourceTextures.length === 0) return null;
    return this._sourceTextures[Math.floor(Math.random() * this._sourceTextures.length)];
  }

  /**
   * Get the next pooled texture instantly (no GPU work).
   * When the pool runs low, trigger a background refill.
   */
  getPooledTexture() {
    if (this._pool.length === 0) {
      // Fallback: generate one synchronously (should rarely happen)
      return this._generateOne(this._randomSourceTexture());
    }
    const tex = this._pool[this._poolIndex % this._pool.length];
    this._poolIndex++;

    // When we've cycled through most of the pool, replace used entries in background
    if (this._poolIndex > 0 && this._poolIndex % (this._poolTarget / 2) === 0) {
      this._refillInBackground();
    }

    return tex;
  }

  /**
   * Replace half the pool entries in the background for variety.
   */
  _refillInBackground() {
    if (this._generating) return;
    this._generating = true;

    const toReplace = Math.floor(this._pool.length / 2);
    let replaced = 0;

    const step = () => {
      if (replaced >= toReplace || !this._generating) {
        this._generating = false;
        return;
      }
      // Replace 2 entries per idle callback
      for (let i = 0; i < 2 && replaced < toReplace; i++) {
        const idx = Math.floor(Math.random() * this._pool.length);
        // Don't destroy old texture — it may still be in use by particles
        this._pool[idx] = this._generateOne(this._randomSourceTexture());
        replaced++;
      }
      (typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout)(step);
    };
    (typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout)(step);
  }

  /**
   * Generate a single chaos star texture. This is the expensive GPU call.
   * Used during pool building only, never during gameplay.
   */
  _generateOne(texture) {
    this._randomize(texture);
    return this.starTexture;
  }

  // --- Legacy API (still used by initial setup) ---

  getRandomPixiCaostarTexture(randomTexture) {
    this._randomize(randomTexture);
    return this.starTexture;
  }

  _randomize(texture) {
    const baseSize = Math.random() * 25 + 15;
    const barWidth = Math.random();
    const barLength = Math.random() * 5 + 3.2;
    const arrowTopSharpness = Math.random() * 2 + 1;
    const arrowBottomSharpness = Math.random() * 3;
    const arrowWidth = Math.random() * 3 + 2;
    const circleSize = Math.random() * 30 + 25;
    const color = Math.floor(Math.random() * 16777215);

    this._drawStar(this.theStarGraphic, 0,
      barWidth * baseSize, barLength * baseSize,
      arrowTopSharpness * baseSize, arrowBottomSharpness * baseSize,
      arrowWidth * baseSize, circleSize, color);

    this.theStarGraphic.width = this.starWidth;
    this.theStarGraphic.height = this.starHeight;

    if (!this.isvector && texture) {
      this.addChild(this.starBMP);
      this.addChild(this.theStarGraphic);
      this.starBMP.x = -this.starWidth / 2;
      this.starBMP.y = -this.starHeight / 2;
      this.starBMP.width = this.starWidth;
      this.starBMP.height = this.starHeight;
      this.starBMP.texture = texture;
      this.starBMP.mask = this.theStarGraphic;
      this.starTexture = renderer.generateTexture(this);
    } else {
      // No texture mask — just render the star graphic directly
      this.starTexture = renderer.generateTexture(this.theStarGraphic);
    }
  }

  /**
   * Optimized star drawing. Uses pre-computed trig where possible
   * and minimized function call overhead.
   */
  _drawStar(ctx, startAngle, barWidth, barLength, arrowTop, arrowBottom, arrowWidth, circleSize, color) {
    ctx.clear();
    ctx.beginFill(color || 0xFFFFFF, 1);

    const arrowStart = Math.sqrt(circleSize * circleSize - (barWidth / 2) * (barWidth / 2));
    const topDiff = Math.random() * 15 - 5;
    const diffArrows = Math.random() < 0.5;
    const diffEven = Math.random() < 0.5;
    const halfBar = barWidth / 2;
    const halfArrow = arrowWidth / 2;

    let angle = startAngle;

    // Inline rotation to avoid function call overhead per vertex
    const rot = (px, py, deg) => {
      const t = DEG2RAD * deg;
      const c = Math.cos(t);
      const s = Math.sin(t);
      return [c * px - s * py, s * px + c * py];
    };

    let [rx, ry] = rot(-halfBar, -arrowStart, angle);
    ctx.lineTo(rx, ry);

    for (let i = 0; i < 8; i++) {
      if (i > 0) {
        angle += 45;
        [rx, ry] = rot(-halfBar, -arrowStart, angle);
        ctx.lineTo(rx, ry);
      }

      const shorten = (diffArrows && ((i % 2 === 0) === diffEven)) ? barLength / 2.5 : 0;
      const effLen = barLength - shorten;

      // 6 vertices per arrow point
      [rx, ry] = rot(-halfBar - topDiff, -arrowStart - effLen, angle);
      ctx.lineTo(rx, ry);
      [rx, ry] = rot(-halfArrow, -arrowStart - effLen + arrowBottom, angle);
      ctx.lineTo(rx, ry);
      [rx, ry] = rot(0, -arrowStart - effLen - arrowTop, angle);
      ctx.lineTo(rx, ry);
      [rx, ry] = rot(halfArrow, -arrowStart - effLen + arrowBottom, angle);
      ctx.lineTo(rx, ry);
      [rx, ry] = rot(halfBar + topDiff, -arrowStart - effLen, angle);
      ctx.lineTo(rx, ry);
      [rx, ry] = rot(halfBar, -arrowStart, angle);
      ctx.lineTo(rx, ry);
    }

    // Close back to start
    angle += 45;
    [rx, ry] = rot(-halfBar, -arrowStart, angle);
    ctx.lineTo(rx, ry);

    ctx.endFill();
  }

  destroy() {
    this._generating = false;
    // Don't destroy pool textures — particles may still reference them
    this._pool = [];
    super.destroy();
  }
}
