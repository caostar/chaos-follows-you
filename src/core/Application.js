import { Sprite, Application, Assets as PixiAssets } from 'pixi.js';
import config from '../config';
import Game from '../Game';
import { Viewport } from 'pixi-viewport';
import { center } from './utils';
import Assets from './AssetManager';

/**
 * Game entry point. Holds the game's viewport and responsive background
 * All configurations are described in src/config.js
 */
export default class GameApplication extends Application {
  constructor() {
    super(config.view);

    this.config = config;
    Assets.renderer = this.renderer;
    window.renderer = this.renderer;

    this.setupViewport();
    this.initGame();
  }

  async initGame() {
    await this.createBackground();

    this.game = new Game();
    this.viewport.addChild(this.game);

    center(this.viewport, this.config.view);
    this.onResize();

    this.game.start();
  }

  setupViewport() {
    const viewport = new Viewport({
      screenWidth: this.config.view.width,
      screenHeight: this.config.view.height,
      worldWidth: this.config.game.width,
      worldHeight: this.config.game.height,
      events: this.renderer.events,
    });

    this.renderer.runners.resize.add({
      resize: this.onResize.bind(this),
    });
    document.body.appendChild(this.view);

    this.stage.addChild(viewport);

    if (!this.isTouchDevice()) viewport.drag();
    if (this.config.game.pinch) viewport.pinch();
    if (this.config.game.wheel) viewport.wheel();
    if (this.config.game.decelerate) viewport.decelerate();

    this.viewport = viewport;
    window.viewport = viewport;
  }

  onResize(width = this.config.view.width, height = this.config.view.height) {
    if (this.background) {
      center(this.background, { width, height });
    }
    if (this.game) {
      this.game.onResize(width, height);
    }

    if (this.config.view.centerOnResize && this.viewport) {
      this.viewport.x = width / 2;
      this.viewport.y = height / 2;
    }
  }

  isTouchDevice() {
    return (('ontouchstart' in window)
       || (navigator.maxTouchPoints > 0)
       || (navigator.msMaxTouchPoints > 0));
  }

  async createBackground() {
    const images = { background: Assets.images.background };

    await Assets.load({ images });

    const sprite = Sprite.from('background');

    this.stage.addChildAt(sprite, 0);
    this.background = sprite;
  }
}
