import * as PIXI from 'pixi.js';
import Scene from './Scene';
import gsap from 'gsap';
import * as particles from 'pixi-particles';
import {PixiChaosStar} from '../builders/PixiChaosStar';
import Assets from '../core/AssetManager';
import keyboardjs from 'keyboardjs';

export default class Play extends Scene {
  async onCreated() {
    this.currentTexture;
    this.moveSpeed = 0.5;
    this.movePad = 100;
    //const particleName = 'thanaterosMagenta';

    // create a sprite with the gamepad asset as texture and add it to the stage
    /* const sprite = PIXI.Sprite.from(particleName);

    this.addChild(sprite);
    sprite.anchor.set(0.5);
    
    sprite.scale.x = sprite.scale.y = 0.7;
    gsap.to(sprite.scale, { x: 0.8, y: 0.8, duration: 1, repeat: -1, yoyo: true, ease: "power2.out" }); */

    this.pixiChaosStar = new PixiChaosStar(256,256,false);
    //this.addChild(this.pixiChaosStar);
    
    //////////
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
        "alpha": {
          "start": 1,
          "end": 0
        },
        "scale": {
          "start": 0.1,
          "end": 1.5,
          "minimumScaleMultiplier": 1
        },
        "color": {
          "start": "#e4f9ff",
          "end": "#3fcbff"
        },
        "speed": {
          "start": 100,
          "end": 5,
          "minimumSpeedMultiplier": 1
        },
        "acceleration": {
          "x": 0,
          "y": 0
        },
        "maxSpeed": 0,
        "startRotation": {
          "min": 0,
          "max": 360
        },
        "noRotation": false,
        "rotationSpeed": {
          "min": 1,
          "max": 100
        },
        "lifetime": {
          "min": 0.4,
          "max": 8
        },
        "blendMode": "normal",
        "frequency": 0.011,
        "emitterLifetime": -1,
        "maxParticles": 20000,
        "pos": {
          "x": 0,
          "y": 0
        },
        "addAtBack": false,
        "spawnType": "circle",
        "spawnCircle": {
          "x": 0,
          "y": 0,
          "r": 0
        }
      }
    );

    // Calculate the current time
    this.elapsed = Date.now();

    // Start emitting
    this.emitter.emit = true;

    // Start the update
    this.update();  

    //mouse function 
    const canvas = document.getElementsByTagName("canvas")[0];
    canvas.addEventListener('mousemove', (e) =>
    {
        if (!this.emitter) return;
        let goX = (e.offsetX -viewport.lastViewport.x)/window.viewport.lastViewport.scaleX;
        let goY = (e.offsetY -viewport.lastViewport.y)/window.viewport.lastViewport.scaleY;
        gsap.to(this.emitter.spawnPos, { x:goX, y:goY, duration: 2, ease: "power2.out", onComplete:this.completeEmitterTween()});

    });
    canvas.addEventListener('touchmove', (e) =>
    {
        if (!this.emitter) return;
        e.offsetX = e.touches[0].pageX - e.touches[0].target.offsetLeft;     
        e.offsetY = e.touches[0].pageY - e.touches[0].target.offsetTop;

        let goX = (e.offsetX -viewport.lastViewport.x)/window.viewport.lastViewport.scaleX;
        let goY = (e.offsetY -viewport.lastViewport.y)/window.viewport.lastViewport.scaleY;

        gsap.to(this.emitter.spawnPos, { x:goX, y:goY, duration: 2, ease: "power2.out", onComplete:this.completeEmitterTween()});

    });
    canvas.addEventListener('mouseout', (e) =>
    {
        if (!this.emitter) return;
        let goX = (window.innerWidth/2 -viewport.lastViewport.x)/window.viewport.lastViewport.scaleX;
        let goY = (window.innerHeight/2 -viewport.lastViewport.y)/window.viewport.lastViewport.scaleY;
        gsap.to(this.emitter.spawnPos, { x:goX, y:goY, duration: 2, ease: "power2.out", onComplete:this.completeEmitterTween()});
    });
    canvas.addEventListener('mousedown', (e) =>
    {
        if (!this.emitter) return;
        this.newChaos();
    });
    /////////////
    keyboardjs.bind('r', (e) => {
      if (!this.emitter) return;
      let goX = (Math.random()*window.innerWidth -viewport.lastViewport.x)/window.viewport.lastViewport.scaleX;
      let goY = (Math.random()*window.innerHeight -viewport.lastViewport.y)/window.viewport.lastViewport.scaleY;
      gsap.to(this.emitter.spawnPos, { x:goX, y:goY, duration: 2, ease: "power2.out", onComplete:this.completeEmitterTween()});
      viewport.animate({
             time: 500,                     // time to animate
        //     position: [300,300],                 // position to move viewport
             scale: 0.5,                    // scale to change zoom(scale.x = scale.y)
        //     ease: 'linear',                 // easing function to use
        //     callbackOnComplete: null,       // callback when animate is complete
             removeOnInterrupt: true,	   // removes this plugin if interrupted by any user input
         })
    });
    keyboardjs.bind('space', (e) => {
      if (!this.emitter) return;
        this.newChaos();
    });
    keyboardjs.bind('left', (e) => {
      if (!this.emitter) return;
      let go = this.emitter.spawnPos.x-this.movePad;
      gsap.to(this.emitter.spawnPos, { x:go, duration: this.moveSpeed, ease: "power2.out", onComplete:this.completeEmitterTween()});
    });
    keyboardjs.bind('right', (e) => {
      if (!this.emitter) return;
      let go = this.emitter.spawnPos.x+this.movePad;
      gsap.to(this.emitter.spawnPos, { x:go, duration: this.moveSpeed, ease: "power2.out", onComplete:this.completeEmitterTween()});
    });
    keyboardjs.bind('up', (e) => {
      if (!this.emitter) return;
      let go = this.emitter.spawnPos.y-this.movePad;
      gsap.to(this.emitter.spawnPos, { y:go, duration: this.moveSpeed, ease: "power2.out", onComplete:this.completeEmitterTween()});
    });
    keyboardjs.bind('down', (e) => {
      if (!this.emitter) return;
      let go = this.emitter.spawnPos.y+this.movePad;
      gsap.to(this.emitter.spawnPos, { y:go, duration: this.moveSpeed, ease: "power2.out", onComplete:this.completeEmitterTween()});
    });
    //
    keyboardjs.bind('right + up', (e) => {
      if (!this.emitter) return;
      let goX = this.emitter.spawnPos.x+this.movePad;
      let goY = this.emitter.spawnPos.y-this.movePad;
      gsap.to(this.emitter.spawnPos, { x:goX, y:goY, duration: this.moveSpeed, ease: "power2.out", onComplete:this.completeEmitterTween()});
    });
    keyboardjs.bind('right + down', (e) => {
      if (!this.emitter) return;
      let goX = this.emitter.spawnPos.x+this.movePad;
      let goY = this.emitter.spawnPos.y+this.movePad;
      gsap.to(this.emitter.spawnPos, { x:goX, y:goY, duration: this.moveSpeed, ease: "power2.out", onComplete:this.completeEmitterTween()});
    });
    keyboardjs.bind('left + up', (e) => {
      if (!this.emitter) return;
      let goX = this.emitter.spawnPos.x-this.movePad;
      let goY = this.emitter.spawnPos.y-this.movePad;
      gsap.to(this.emitter.spawnPos, { x:goX, y:goY, duration: this.moveSpeed, ease: "power2.out", onComplete:this.completeEmitterTween()});
    });
    keyboardjs.bind('left + down', (e) => {
      if (!this.emitter) return;
      let goX = this.emitter.spawnPos.x-this.movePad;
      let goY = this.emitter.spawnPos.y+this.movePad;
      gsap.to(this.emitter.spawnPos, { x:goX, y:goY, duration: this.moveSpeed, ease: "power2.out", onComplete:this.completeEmitterTween()});
    });
    

  }

  completeEmitterTween (){
    //just burocracy
    this.emitter.rotate(this.emitter.rotation);

    gsap.killTweensOf(this.newChaos);
    gsap.delayedCall(0.5,this.newChaos,[this])
  }

  newChaos (_this){
    _this = _this!=null ? _this : this 
    _this.emitter.particleImages = [_this.getRandomPixiCaostarTexture()];
  }

  // Update function every frame
  update (){

    // Update the next frame
    requestAnimationFrame(this.update.bind(this));

    let now = Date.now();

    // The emitter requires the elapsed
    // number of seconds since the last update
    this.emitter.update((now - this.elapsed) * 0.001);
    this.elapsed = now;

    // Should re-render the PIXI Stage
    // renderer.render(stage);
  }

  getRandomTexture(){
    let textureArraySize = Object.keys(Assets.textures).length;
    let assetBaseName = 'texture'
    let texture = `${assetBaseName}${Math.floor(Math.random() * textureArraySize) + 1}`;
    this.currentTexture = PIXI.Texture.from(texture);
    return this.currentTexture
  }

  getRandomPixiCaostarTexture(){
    return this.pixiChaosStar.getRandomPixiCaostarTexture(this.getRandomTexture())
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
