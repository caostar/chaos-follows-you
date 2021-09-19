import * as PIXI from 'pixi.js';
import Scene from './Scene';
import gsap from 'gsap';
import * as particles from 'pixi-particles';
import { PixiChaosStar } from '../builders/PixiChaosStar';
import Assets from '../core/AssetManager';
import keyboardjs from 'keyboardjs';

export default class Play extends Scene {
  async onCreated() {
    this.currentTexture;
    this.moveSpeed = 0.5;
    this.movePad = 100;
    // const particleName = 'thanaterosMagenta';

    // create a sprite with the gamepad asset as texture and add it to the stage
    /* const sprite = PIXI.Sprite.from(particleName);

    this.addChild(sprite);
    sprite.anchor.set(0.5);

    sprite.scale.x = sprite.scale.y = 0.7;
    gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 1, repeat: -1, yoyo: true, ease: "power2.out" }); */

    this.pixiChaosStar = new PixiChaosStar(256, 256, false);
    // this.addChild(this.pixiChaosStar);

    // ////////
    // Create a new emitter
    // note: if importing library like "import * as particles from 'pixi-particles'"
    // or "const particles = require('pixi-particles')", the PIXI namespace will
    // not be modified, and may not exist - use "new particles.Emitter()", or whatever
    // your imported namespace is
    this.emitter = new particles.Emitter(

      // The PIXI.Container to put the emitter in
      // if using blend modes, it's important to put this
      // on top of a bitmap, and not use the root stage Container
      this,

      // The collection of particle images to use
      [this.getRandomPixiCaostarTexture()],

      // Emitter configuration, edit this to change the look
      // of the emitter
      {
        alpha: {
          start: 1,
          end: 0,
        },
        scale: {
          start: 0.1,
          end: 1.5,
          minimumScaleMultiplier: 1,
        },
        color: {
          start: '#e4f9ff',
          end: '#3fcbff',
        },
        speed: {
          start: 100,
          end: 5,
          minimumSpeedMultiplier: 1,
        },
        acceleration: {
          x: 0,
          y: 0,
        },
        maxSpeed: 0,
        startRotation: {
          min: 0,
          max: 360,
        },
        noRotation: false,
        rotationSpeed: {
          min: 1,
          max: 100,
        },
        lifetime: {
          min: 0.4,
          max: 8,
        },
        blendMode: 'normal',
        frequency: 0.011,
        emitterLifetime: -1,
        maxParticles: 20000,
        pos: {
          x: 0,
          y: 0,
        },
        addAtBack: false,
        spawnType: 'circle',
        spawnCircle: {
          x: 0,
          y: 0,
          r: 0,
        },
      },
    );

    // Calculate the current time
    this.elapsed = Date.now();

    // Start emitting
    this.emitter.emit = true;

    // Start the update
    this.update();

    // mouse function
    const canvas = document.getElementsByTagName('canvas')[0];

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
    // ///////////
    // random move
    keyboardjs.bind('r', (e) => {
      this.moveEmitterRandomly();
    });
    // zoom in
    keyboardjs.bind('z', (e) => {
      this.goRandZoom('in');
    });
    // zoom out
    keyboardjs.bind('x', (e) => {
      this.goRandZoom('out');
    });
    keyboardjs.bind('space', (e) => {
      if (!this.emitter) return;
      this.newChaos();
    });
    keyboardjs.bind('left', (e) => {
      this.goArrowMove('left', null);
    });
    keyboardjs.bind('right', (e) => {
      this.goArrowMove('right', null);
    });
    keyboardjs.bind('up', (e) => {
      this.goArrowMove(null, 'up');
    });
    keyboardjs.bind('down', (e) => {
      this.goArrowMove(null, 'down');
    });
    //
    keyboardjs.bind('right + up', (e) => {
      this.goArrowMove('right', 'up');
    });
    keyboardjs.bind('right + down', (e) => {
      this.goArrowMove('right', 'down');
    });
    keyboardjs.bind('left + up', (e) => {
      this.goArrowMove('left', 'up');
    });
    keyboardjs.bind('left + down', (e) => {
      this.goArrowMove('left', 'down');
    });
  }

  goRandZoom(inOrOut) {
    const zoomFactor = (Math.random() * 4 + 1);
    let zoom;

    let randX = (Math.random() * window.innerWidth - window.innerWidth/2);
    let randY = (Math.random() * window.innerHeight - window.innerHeight/2);
    if(inOrOut == "in"){
      zoom = viewport.lastViewport.scaleX * zoomFactor;
      randX /= zoomFactor;
    }else{
      zoom = viewport.lastViewport.scaleX / zoomFactor;
      randX *= zoomFactor;
    }
    console.log(viewport.lastViewport,viewport.center);
    console.log(randX,randY);
    console.log("windowsize: ", window.innerWidth,window.innerHeight)
    console.log("emitter pos: ", this.emitter.spawnPos.x,this.emitter.spawnPos.y)

    this.goZoom(randX, randY, zoom, this.moveEmitterRandomly);
  }

  goZoom(x, y, scale, callbackOnComplete) {
    if (!this.emitter) return;
    viewport.animate({
      time: 2000, // time to animate
      position: { x, y }, // position to move viewport
      scale, // scale to change zoom(scale.x = scale.y)
      ease: 'easeOutCirc', // easing function to use
      callbackOnComplete: callbackOnComplete.bind(this),       // callback when animate is complete
      removeOnInterrupt: true, // removes this plugin if interrupted by any user input
    });
  }

  getRandomEmitterX() {
    return (Math.random() * window.innerWidth - viewport.lastViewport.x) / window.viewport.lastViewport.scaleX;
  }
  getRandomEmitterY() {
    return (Math.random() * window.innerHeight - viewport.lastViewport.y) / window.viewport.lastViewport.scaleY;
  }

  moveEmitterRandomly() {
    this.moveEmitter(this.getRandomEmitterX(), this.getRandomEmitterY());
  }

  moveEmitter(x, y) {
    if (!this.emitter) return;

    let goX = x || this.emitter.spawnPos.x;
    let goY = y || this.emitter.spawnPos.y;

    if (x === 0)goX = 0;
    if (y === 0)goY = 0;

    gsap.to(this.emitter.spawnPos, { x: goX, y: goY, duration: 2, ease: 'power2.out', onComplete: this.completeEmitterTween() });
  }

  goArrowMove(dirX, dirY) {
    this.moveEmitter(this.getXYDirectNextMove(dirX), this.getXYDirectNextMove(dirY));
    if (!this.emitter) return;
  }

  getXYDirectNextMove(direction) {
    let answer;

    switch (direction) {
      case 'left':
        answer = this.emitter.spawnPos.x - this.movePad;
        break;
      case 'right':
        answer = this.emitter.spawnPos.x + this.movePad;
        break;
      case 'down':
        answer = this.emitter.spawnPos.y + this.movePad;
        break;
      case 'up':
        answer = this.emitter.spawnPos.y - this.movePad;
        break;
      default:
        answer = null;
    }

    return answer;
  }

  completeEmitterTween() {
    // just burocracy
    this.emitter.rotate(this.emitter.rotation);

    gsap.killTweensOf(this.newChaos);
    gsap.delayedCall(0.5, this.newChaos, [this]);
  }

  newChaos(_this) {
    _this = _this != null ? _this : this;
    _this.emitter.particleImages = [_this.getRandomPixiCaostarTexture()];
  }

  // Update function every frame
  update() {
    // Update the next frame
    requestAnimationFrame(this.update.bind(this));

    const now = Date.now();

    // The emitter requires the elapsed
    // number of seconds since the last update
    this.emitter.update((now - this.elapsed) * 0.001);
    this.elapsed = now;

    // Should re-render the PIXI Stage
    // renderer.render(stage);
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

  /**
   * Hook called by the application when the browser window is resized.
   * Use this to re-arrange the game elements according to the window size
   *
   * @param  {Number} width  Window width
   * @param  {Number} height Window height
   */
  onResize(width, height) { // eslint-disable-line no-unused-vars

  }
}
