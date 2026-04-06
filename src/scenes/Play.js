import * as PIXI from 'pixi.js';
import Scene from './Scene';
import gsap from 'gsap';
import { Emitter, upgradeConfig } from '@pixi/particle-emitter';
import { PixiChaosStar } from '../builders/PixiChaosStar';
import Assets from '../core/AssetManager';
import keyboardjs from 'keyboardjs';

// Old v4 config (without textures — we inject those at runtime)
const oldConfig = {
  alpha: { start: 1, end: 0 },
  scale: { start: 0.1, end: 1.5, minimumScaleMultiplier: 1 },
  color: { start: '#e4f9ff', end: '#3fcbff' },
  speed: { start: 100, end: 5, minimumSpeedMultiplier: 1 },
  acceleration: { x: 0, y: 0 },
  maxSpeed: 0,
  startRotation: { min: 0, max: 360 },
  noRotation: false,
  rotationSpeed: { min: 1, max: 100 },
  lifetime: { min: 0.4, max: 8 },
  blendMode: 'normal',
  frequency: 0.011,
  emitterLifetime: -1,
  maxParticles: 20000,
  pos: { x: 0, y: 0 },
  addAtBack: false,
  spawnType: 'circle',
  spawnCircle: { x: 0, y: 0, r: 0 },
};

export default class Play extends Scene {
  async onCreated() {
    this.currentTexture = null;
    this.moveSpeed = 0.5;
    this.movePad = 100;

    this.pixiChaosStar = new PixiChaosStar(256, 256, false);

    // Get our first chaos star texture
    const initialTexture = this.getRandomPixiCaostarTexture();

    // Convert old v4 config to v5, passing the real texture
    const emitterConfig = upgradeConfig(oldConfig, [initialTexture]);

    this.emitter = new Emitter(this, emitterConfig);

    // Store reference to the texture behavior so we can swap textures at runtime
    this._textureBehavior = this.emitter.initBehaviors.find(
      (b) => b.constructor?.name?.includes('Texture'),
    );

    this.elapsed = Date.now();
    this.emitter.emit = true;
    this.update();

    // mouse/touch/keyboard setup
    const canvas = document.querySelector('canvas');

    canvas.addEventListener('mousemove', (e) => {
      if (!this.emitter) return;
      const goX = (e.offsetX - viewport.lastViewport.x) / window.viewport.lastViewport.scaleX;
      const goY = (e.offsetY - viewport.lastViewport.y) / window.viewport.lastViewport.scaleY;
      this.moveEmitter(goX, goY);
    });
    canvas.addEventListener('touchmove', (e) => {
      if (!this.emitter) return;
      e.offsetX = e.touches[0].pageX - e.touches[0].target.offsetLeft;
      e.offsetY = e.touches[0].pageY - e.touches[0].target.offsetTop;
      const goX = (e.offsetX - viewport.lastViewport.x) / window.viewport.lastViewport.scaleX;
      const goY = (e.offsetY - viewport.lastViewport.y) / window.viewport.lastViewport.scaleY;
      this.moveEmitter(goX, goY);
    });
    canvas.addEventListener('mouseout', (e) => {
      if (!this.emitter) return;
      const goX = (window.innerWidth / 2 - viewport.lastViewport.x) / window.viewport.lastViewport.scaleX;
      const goY = (window.innerHeight / 2 - viewport.lastViewport.y) / window.viewport.lastViewport.scaleY;
      this.moveEmitter(goX, goY);
    });
    canvas.addEventListener('mousedown', (e) => {
      if (!this.emitter) return;
      this.newChaos();
    });

    keyboardjs.bind('r', () => this.moveEmitterRandomly());
    keyboardjs.bind('t', () => this.moveEmitterRandomly(true));
    keyboardjs.bind('z', () => this.goRandZoom('in'));
    keyboardjs.bind('x', () => this.goRandZoom('out'));
    keyboardjs.bind('space', () => { if (this.emitter) this.newChaos(); });
    keyboardjs.bind('left', () => this.goArrowMove('left', null));
    keyboardjs.bind('right', () => this.goArrowMove('right', null));
    keyboardjs.bind('up', () => this.goArrowMove(null, 'up'));
    keyboardjs.bind('down', () => this.goArrowMove(null, 'down'));
    keyboardjs.bind('right + up', () => this.goArrowMove('right', 'up'));
    keyboardjs.bind('right + down', () => this.goArrowMove('right', 'down'));
    keyboardjs.bind('left + up', () => this.goArrowMove('left', 'up'));
    keyboardjs.bind('left + down', () => this.goArrowMove('left', 'down'));
  }

  goRandZoom(inOrOut) {
    const zoomFactor = (Math.random() * 5 + 1);
    let zoom;

    let randX = (Math.random() * window.innerWidth);
    let randY = (Math.random() * window.innerHeight);

    if (inOrOut == 'in') {
      zoom = viewport.lastViewport.scaleX * zoomFactor;
    } else {
      zoom = viewport.lastViewport.scaleX / zoomFactor;
    }

    randX -= this.emitter.spawnPos.x * zoom;
    randY -= this.emitter.spawnPos.y * zoom;

    let randX2 = (Math.random() * window.innerWidth);
    let randY2 = (Math.random() * window.innerHeight);

    const goX = (randX2 - randX) / zoom;
    const goY = (randY2 - randY) / zoom;
    this.moveEmitter(goX, goY);
    this.newChaos();

    this.goZoom(randX, randY, zoom);
  }

  goZoom(x, y, scale) {
    if (!this.emitter) return;
    gsap.to(viewport.scale, { x: scale, y: scale, duration: 2, ease: 'power2.out' });
    gsap.to(viewport.position, { x, y, duration: 2, ease: 'power2.out' });
  }

  getRandomEmitterX() {
    return (Math.random() * window.innerWidth - viewport.lastViewport.x) / window.viewport.lastViewport.scaleX;
  }

  getRandomEmitterY() {
    return (Math.random() * window.innerHeight - viewport.lastViewport.y) / window.viewport.lastViewport.scaleY;
  }

  moveEmitterRandomly(changeAtFirstMove) {
    if (changeAtFirstMove) this.newChaos(this);
    this.moveEmitter(this.getRandomEmitterX(), this.getRandomEmitterY());
  }

  moveEmitter(x, y) {
    if (!this.emitter) return;

    let goX = x || this.emitter.spawnPos.x;
    let goY = y || this.emitter.spawnPos.y;

    if (x === 0) goX = 0;
    if (y === 0) goY = 0;

    gsap.to(this.emitter.spawnPos, { x: goX, y: goY, duration: 2, ease: 'power2.out', onComplete: this.completeEmitterTween() });
  }

  goArrowMove(dirX, dirY) {
    this.moveEmitter(this.getXYDirectNextMove(dirX), this.getXYDirectNextMove(dirY));
  }

  getXYDirectNextMove(direction) {
    switch (direction) {
      case 'left': return this.emitter.spawnPos.x - this.movePad;
      case 'right': return this.emitter.spawnPos.x + this.movePad;
      case 'down': return this.emitter.spawnPos.y + this.movePad;
      case 'up': return this.emitter.spawnPos.y - this.movePad;
      default: return null;
    }
  }

  completeEmitterTween() {
    this.emitter.rotate(this.emitter.rotation);
    gsap.killTweensOf(this.newChaos);
    gsap.delayedCall(0.5, this.newChaos, [this]);
  }

  newChaos(_this) {
    _this = _this != null ? _this : this;
    const newTexture = _this.getRandomPixiCaostarTexture();
    // In v5, update the textures array on the live behavior instance
    if (_this._textureBehavior) {
      _this._textureBehavior.textures = [newTexture];
    }
  }

  update() {
    requestAnimationFrame(this.update.bind(this));
    const now = Date.now();
    this.emitter.update((now - this.elapsed) * 0.001);
    this.elapsed = now;
  }

  getRandomTexture() {
    const textureArraySize = Object.keys(Assets.textures).length;
    const assetBaseName = 'texture';
    const texture = `${assetBaseName}${Math.floor(Math.random() * textureArraySize) + 1}`;
    this.currentTexture = PIXI.Texture.from(texture);
    return this.currentTexture;
  }

  getRandomPixiCaostarTexture() {
    return this.pixiChaosStar.getRandomPixiCaostarTexture(this.getRandomTexture());
  }

  onResize(width, height) { // eslint-disable-line no-unused-vars
  }
}
