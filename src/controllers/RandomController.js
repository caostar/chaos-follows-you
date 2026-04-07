/**
 * RandomController — Autonomous mode that simulates organic user interaction.
 *
 * Reads its configuration from /randomControls.json at startup (and can reload it).
 * All timing, weights, zoom bounds, and movement parameters come from that file
 * so the artist can tweak aesthetics without touching code.
 */
export default class RandomController {
  constructor(play) {
    this.play = play;
    this.active = false;
    this.config = null;
    this._timeout = null;
    this._paused = false;
  }

  async loadConfig() {
    const resp = await fetch('/randomControls.json');
    this.config = await resp.json();
    return this.config;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this._scheduleNext();
  }

  stop() {
    this.active = false;
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
  }

  _scheduleNext() {
    if (!this.active || !this.config) return;

    const { rhythm, pause } = this.config;
    let delay = this._rand(rhythm.interval.min, rhythm.interval.max) * 1000;

    // Chance of a contemplative pause
    if (Math.random() < pause.chance) {
      delay += this._rand(pause.duration.min, pause.duration.max) * 1000;
    }

    this._timeout = setTimeout(() => {
      if (!this.active) return;
      this._act();
      this._scheduleNext();
    }, delay);
  }

  _act() {
    const { movement, shapeChange, zoom } = this.config;
    const totalWeight = movement.weight + shapeChange.weight + zoom.weight;
    const roll = Math.random() * totalWeight;

    if (roll < movement.weight) {
      this._move();
    } else if (roll < movement.weight + shapeChange.weight) {
      this._changeShape();
    } else {
      this._zoom();
    }
  }

  _move() {
    const { movement } = this.config;
    const duration = this._rand(movement.duration.min, movement.duration.max);

    const x = this.play.getRandomEmitterX();
    const y = this.play.getRandomEmitterY();
    this.play.moveEmitter(x, y, duration, movement.ease);
  }

  _changeShape() {
    this.play.newChaos(this.play);
  }

  _zoom() {
    const { zoom } = this.config;
    const currentScale = window.viewport.lastViewport?.scaleX || 1;

    // Decide direction: inBias controls how often it zooms in vs out (0=always out, 1=always in)
    // Override when near bounds to prevent hitting limits
    const inBias = zoom.inBias ?? 0.5;
    let direction;
    if (currentScale <= zoom.minScale * 1.5) {
      direction = 'in';
    } else if (currentScale >= zoom.maxScale * 0.7) {
      direction = 'out';
    } else {
      direction = Math.random() < inBias ? 'in' : 'out';
    }

    const factor = direction === 'in'
      ? this._rand(zoom.inFactor.min, zoom.inFactor.max)
      : this._rand(zoom.outFactor.min, zoom.outFactor.max);

    let targetScale = direction === 'in'
      ? currentScale * factor
      : currentScale / factor;

    // Clamp to bounds
    targetScale = Math.max(zoom.minScale, Math.min(zoom.maxScale, targetScale));

    const duration = this._rand(zoom.duration.min, zoom.duration.max);

    // Random target position
    const randX = Math.random() * window.innerWidth;
    const randY = Math.random() * window.innerHeight;
    const spawnX = this.play.emitter.spawnPos.x;
    const spawnY = this.play.emitter.spawnPos.y;

    const viewX = randX - spawnX * targetScale;
    const viewY = randY - spawnY * targetScale;

    this.play.newChaos(this.play);
    this.play.goZoom(viewX, viewY, targetScale, duration);
  }

  _rand(min, max) {
    return Math.random() * (max - min) + min;
  }
}
