import * as PIXI from 'pixi.js';
import Scene from './Scene';
import gsap from 'gsap';
import { Emitter, upgradeConfig } from '@pixi/particle-emitter';
import { PixiChaosStar } from '../builders/PixiChaosStar';
import Assets from '../core/AssetManager';
import keyboardjs from 'keyboardjs';
import RandomController from '../controllers/RandomController';
import AudioController from '../controllers/AudioController';
import AudioPanel from '../ui/AudioPanel';
import HandController from '../controllers/HandController';
import HandPanel from '../ui/HandPanel';
import ControlsPanel from '../ui/ControlsPanel';

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
  maxParticles: 5000,
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

    // Store reference to the texture behavior so we can swap textures at runtime.
    // Match by property (has .textures array) instead of constructor.name,
    // because class names get mangled by minification in production builds.
    this._textureBehavior = this.emitter.initBehaviors.find(
      (b) => Array.isArray(b.textures),
    );

    this.elapsed = Date.now();
    this.emitter.emit = true;
    this._lastAutoShape = Date.now();
    // Bind update once (not per-frame) to avoid garbage generation
    this._boundUpdate = this.update.bind(this);
    this._boundUpdate();

    // --- Pre-generate texture pool (async, non-blocking) ---
    const allTextures = Object.keys(Assets.textures).map((key) =>
      PIXI.Texture.from(key),
    );
    this.pixiChaosStar.buildPool(allTextures, 120);

    // --- Random mode setup ---
    this.randomController = new RandomController(this);
    await this.randomController.loadConfig();
    this._lastInteraction = Date.now();
    this._randomModeForced = false;
    this._inactivityCheck = setInterval(() => this._checkInactivity(), 1000);

    // --- Audio mode setup ---
    this.audioController = new AudioController(this);
    await this.audioController.loadConfig();
    this.audioPanel = new AudioPanel(this.audioController);

    // --- Hand tracking setup ---
    this.handController = new HandController(this);
    await this.handController.loadConfig();
    this.handPanel = new HandPanel(this.handController);

    // --- Controls panel ---
    this.controlsPanel = new ControlsPanel({
      random: this.randomController,
      audio: this.audioController,
      hand: this.handController,
    });

    // --- Input setup ---
    const canvas = document.querySelector('canvas');

    canvas.addEventListener('mousemove', (e) => {
      if (!this.emitter) return;
      this._onUserInteraction();
      const goX = (e.offsetX - viewport.lastViewport.x) / window.viewport.lastViewport.scaleX;
      const goY = (e.offsetY - viewport.lastViewport.y) / window.viewport.lastViewport.scaleY;
      this.moveEmitter(goX, goY);
    });
    canvas.addEventListener('touchmove', (e) => {
      if (!this.emitter) return;
      this._onUserInteraction();
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
      this._onUserInteraction();
      this.newChaos();
    });

    keyboardjs.bind('r', () => { this._onUserInteraction(); this.moveEmitterRandomly(); });
    keyboardjs.bind('t', () => { this._onUserInteraction(); this.moveEmitterRandomly(true); });
    keyboardjs.bind('z', () => { this._onUserInteraction(); this.goRandZoom('in'); });
    keyboardjs.bind('x', () => { this._onUserInteraction(); this.goRandZoom('out'); });
    keyboardjs.bind('space', () => { if (this.emitter) { this._onUserInteraction(); this.newChaos(); } });
    keyboardjs.bind('left', () => { this._onUserInteraction(); this.goArrowMove('left', null); });
    keyboardjs.bind('right', () => { this._onUserInteraction(); this.goArrowMove('right', null); });
    keyboardjs.bind('up', () => { this._onUserInteraction(); this.goArrowMove(null, 'up'); });
    keyboardjs.bind('down', () => { this._onUserInteraction(); this.goArrowMove(null, 'down'); });
    keyboardjs.bind('right + up', () => { this._onUserInteraction(); this.goArrowMove('right', 'up'); });
    keyboardjs.bind('right + down', () => { this._onUserInteraction(); this.goArrowMove('right', 'down'); });
    keyboardjs.bind('left + up', () => { this._onUserInteraction(); this.goArrowMove('left', 'up'); });
    keyboardjs.bind('left + down', () => { this._onUserInteraction(); this.goArrowMove('left', 'down'); });

    // Toggle random mode
    const toggleKey = this.randomController.config?.toggleKey || 'a';
    keyboardjs.bind(toggleKey, () => {
      this._randomModeForced = !this._randomModeForced;
      if (this._randomModeForced) {
        console.log('[Mode] Random mode toggled ON (manual)');
        this.randomController.start();
      } else {
        console.log('[Mode] Random mode toggled OFF (manual)');
        this.randomController.stop();
      }
    });

    // Toggle audio panel
    keyboardjs.bind('m', () => {
      this.audioPanel.toggle();
    });

    // Toggle hand tracking panel
    keyboardjs.bind('h', () => {
      this.handPanel.toggle();
    });

    // Toggle hand tracking debug video overlay
    keyboardjs.bind('d', () => {
      if (this.handController.active) {
        this.handController.toggleDebug();
      }
    });

    // Toggle controls panel
    keyboardjs.bind('g', () => {
      this.controlsPanel.toggle();
    });

    // Browser fullscreen toggle
    keyboardjs.bind('f', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Hide all UI (panels, debug button, cursor)
    this._uiHidden = false;
    keyboardjs.bind('q', () => {
      this._uiHidden = !this._uiHidden;
      if (this._uiHidden) {
        this.audioPanel.hide();
        this.handPanel.hide();
        this.controlsPanel.hide();
        // Hide hand debug expand button
        const expandBtn = document.getElementById('hand-debug-expand');
        if (expandBtn) expandBtn.style.display = 'none';
        // Hide cursor
        document.body.style.cursor = 'none';
        console.log('[Mode] All UI hidden');
      } else {
        this.audioPanel.show();
        this.handPanel.show();
        this.controlsPanel.show();
        // Restore hand debug expand button if debug is active
        const expandBtn = document.getElementById('hand-debug-expand');
        if (expandBtn && this.handController._debugVisible) expandBtn.style.display = 'block';
        // Restore cursor
        document.body.style.cursor = '';
        console.log('[Mode] All UI shown');
      }
    });
  }

  _onUserInteraction() {
    this._lastInteraction = Date.now();
    // Stop random mode if it was auto-triggered (not forced)
    if (this.randomController.active && !this._randomModeForced) {
      console.log('[Mode] Random mode stopped (user interaction)');
      this.randomController.stop();
    }
  }

  _checkInactivity() {
    if (this._randomModeForced) return;
    if (!this.randomController.config?.enabled) return;

    // Don't auto-start random mode if any other mode is active
    if (this.audioController.active) return;
    if (this.handController.active) return;

    const timeout = (this.randomController.config?.inactivityTimeout || 30) * 1000;
    const idle = Date.now() - this._lastInteraction;

    if (idle >= timeout && !this.randomController.active) {
      console.log(`[Mode] Random mode auto-started (${Math.round(idle / 1000)}s inactivity)`);
      this.randomController.start();
    }
  }

  _clampZoom(scale) {
    const cfg = this.randomController.config?.zoom;
    if (!cfg) return scale;
    return Math.max(cfg.minScale, Math.min(cfg.maxScale, scale));
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

    zoom = this._clampZoom(zoom);

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

  goZoom(x, y, scale, duration = 2) {
    if (!this.emitter) return;
    scale = this._clampZoom(scale);
    // Kill existing zoom tweens to prevent stacking/fighting
    gsap.killTweensOf(viewport.scale);
    gsap.killTweensOf(viewport.position);
    gsap.to(viewport.scale, { x: scale, y: scale, duration, ease: 'power2.out' });
    gsap.to(viewport.position, { x, y, duration, ease: 'power2.out' });
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

  moveEmitter(x, y, duration = 2, ease = 'power2.out') {
    if (!this.emitter) return;

    let goX = x || this.emitter.spawnPos.x;
    let goY = y || this.emitter.spawnPos.y;

    if (x === 0) goX = 0;
    if (y === 0) goY = 0;

    // Kill any existing move tween to prevent stacking
    gsap.killTweensOf(this.emitter.spawnPos);
    gsap.to(this.emitter.spawnPos, { x: goX, y: goY, duration, ease });
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

  /**
   * Swap to a new chaos star texture. Uses the pre-generated pool —
   * no GPU work, instant texture swap.
   */
  newChaos(_this) {
    _this = _this != null ? _this : this;
    const newTexture = _this.pixiChaosStar.getPooledTexture();
    if (newTexture && _this._textureBehavior) {
      _this._textureBehavior.textures = [newTexture];
    }
    // Safety: ensure emitter never stops
    if (_this.emitter && !_this.emitter.emit) {
      _this.emitter.emit = true;
    }
  }

  update() {
    requestAnimationFrame(this._boundUpdate);
    const now = Date.now();
    this.emitter.update((now - this.elapsed) * 0.001);
    this.elapsed = now;

    // Auto-swap shape every ~3 seconds to keep visuals fresh,
    // regardless of which modes are active. Uses the pool so it's free.
    if (now - this._lastAutoShape > 3000) {
      this._lastAutoShape = now;
      this.newChaos(this);
    }
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
