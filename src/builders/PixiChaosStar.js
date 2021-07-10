import * as PIXI from 'pixi.js';

export class PixiChaosStar extends PIXI.Container {
  constructor(_starWidth, _starHeight, _isvector) {
    super();
    this.isvector = _isvector;
    this.starWidth = _starWidth;
    this.starHeight = _starHeight;
    //
    this.theStarGraphic = new PIXI.Graphics();
    this.starBMP = new PIXI.Sprite();

    // this.isvector ? this.addChild(this.theStarGraphic) : this.addChild(this.starBMP);
    // this.changeStarTexture ();
    this.getRandomValues();
  }

  drawStar(context, angle, barWidth, barLength, arrowTopSharpness, arrowBottonSharpness, arrowWidth, circleSize, _color) {
    context.clear();
    const sizeLimit = (barLength + arrowTopSharpness + circleSize) * 2;

    context.beginFill(_color || 0xFFFFFF, 1);

    // the beggining of the arrow, touching the circle
    const arrowStartPoint = Math.sqrt(Math.pow(circleSize, 2) - Math.pow(barWidth / 2, 2));

    // difference between the start and end width of the arrow
    const topDiff = Math.random() * 15 - 5;
    // let topDiff = 0;

    // a rotation of all arrows
    // let angleDiff = Math.random()*10-5;
    const angleDiff = 0;

    // says if arrows should have diffent sizes, and if it should be the even points or the odds
    const differentArrows = Math.random() < 0.5;
    const differentArrowsEven = Math.random() < 0.5;
    // let differentArrows = false;
    // let differentArrowsEven = false;
    //
    // goes to the beggining of the arrow, touching the circle

    context.lineTo(getRotatedX((-barWidth / 2), (-arrowStartPoint), angle), getRotatedY((-barWidth / 2), (-arrowStartPoint), angle));
    //
    function drawPoint(numStar) {
      let barLengthChanger = 0;

      if ((isEven(numStar) == differentArrowsEven) && differentArrows) {
        barLengthChanger = barLength / 2.5;
      }

      context.lineTo(getRotatedX((-barWidth / 2 - topDiff), (-arrowStartPoint - (barLength - barLengthChanger)), angle + angleDiff), getRotatedY((-barWidth / 2 - topDiff), (-arrowStartPoint - (barLength - barLengthChanger)), angle + angleDiff));

      context.lineTo(getRotatedX((-arrowWidth / 2), (-arrowStartPoint - (barLength - barLengthChanger) + arrowBottonSharpness), angle + angleDiff), getRotatedY((-arrowWidth / 2), (-arrowStartPoint - (barLength - barLengthChanger) + arrowBottonSharpness), angle + angleDiff));

      context.lineTo(getRotatedX((0), (-arrowStartPoint - (barLength - barLengthChanger) - arrowTopSharpness), angle + angleDiff), getRotatedY((0), (-arrowStartPoint - (barLength - barLengthChanger) - arrowTopSharpness), angle + angleDiff));

      context.lineTo(getRotatedX((arrowWidth / 2), (-arrowStartPoint - (barLength - barLengthChanger) + arrowBottonSharpness), angle + angleDiff), getRotatedY((arrowWidth / 2), (-arrowStartPoint - (barLength - barLengthChanger) + arrowBottonSharpness), angle + angleDiff));

      context.lineTo(getRotatedX((barWidth / 2 + topDiff), (-arrowStartPoint - (barLength - barLengthChanger)), angle + angleDiff), getRotatedY((barWidth / 2 + topDiff), (-arrowStartPoint - (barLength - barLengthChanger)), angle + angleDiff));

      context.lineTo(getRotatedX((barWidth / 2), (-arrowStartPoint), angle), getRotatedY((barWidth / 2), (-arrowStartPoint), angle));
    }

    drawPoint(1);
    for (let i = 2; i <= 8; i++) {
      angle += 45;
      context.lineTo(getRotatedX((-barWidth / 2), (-arrowStartPoint), angle), getRotatedY((-barWidth / 2), (-arrowStartPoint), angle));
      drawPoint(i);
    }
    //
    angle += 45;
    context.lineTo(getRotatedX((-barWidth / 2), (-arrowStartPoint), angle), getRotatedY((-barWidth / 2), (-arrowStartPoint), angle));

    context.endFill();

    function getRotatedX(px, py, degreeAngle) {
      let newX;
      const theta = (Math.PI / 180) * degreeAngle;

      newX = Math.cos(theta) * px - Math.sin(theta) * py;

      return newX;
    }
    function getRotatedY(px, py, degreeAngle) {
      let newY;
      const theta = (Math.PI / 180) * degreeAngle;

      newY = Math.sin(theta) * px + Math.cos(theta) * py;

      return newY;
    }
    function isEven(n) {
      return (n % 2 == 0);
    }
  }

  createCaostar(baseSize, angle, barWidth, barLength, arrowTopSharpness, arrowBottonSharpness, arrowWidth, circleSize, globalColor, texture) {
    this.drawStar(this.theStarGraphic, angle, barWidth * baseSize, barLength * baseSize, arrowTopSharpness * baseSize, arrowBottonSharpness * baseSize, arrowWidth * baseSize, circleSize, globalColor);
    this.theStarGraphic.width = this.starWidth;
    this.theStarGraphic.height = this.starHeight;
    if (!this.isvector) {
      this.changeStarTexture(texture);
    }
    // end of function
  }
  //
  // UNDER BUG
  changeStarTexture(texture) {
    // https://stackoverflow.com/questions/64720629/pixijs-rendertexture-anti-aliasing
    // renderTextureSprite.filters = [new PIXI.filters.FXAAFilter()];
    // cache the graphich as bitmap
    this.addChild(this.starBMP);
    this.addChild(this.theStarGraphic);
    this.starBMP.x = -this.starWidth / 2;
    this.starBMP.y = -this.starHeight / 2;
    this.starBMP.width = this.starWidth;
    this.starBMP.height = this.starHeight;

    this.starBMP.texture = texture;
    this.starBMP.mask = this.theStarGraphic;
    //
    this.starTexture = renderer.generateTexture(this, PIXI.SCALE_MODES.LINEAR, window.devicePixelRatio || 1);
  }

  //
  getRandomValues(texture) {
    const _baseSize = Math.random() * 25 + 15;
    //
    const _barWidth = Number(Math.random());
    //
    const _barLength = Math.random() * 5 + 3.2;
    //
    // let _arrowTopSharpness = Math.random()*1+1;
    const _arrowTopSharpness = Math.random() * 2 + 1;
    //
    // let _arrowBottonSharpness = Math.random()*1;
    const _arrowBottonSharpness = Math.random() * 3;
    //
    // let _arrowWidth = Math.random()*1.5+1;
    const _arrowWidth = Math.random() * 3 + 2;
    //
    const _circleSize = Math.random() * 30 + 25;
    //
    const _globalColor = Math.floor(Math.random() * 16777215);
    //

    this.createCaostar(_baseSize, 0, _barWidth, _barLength, _arrowTopSharpness, _arrowBottonSharpness, _arrowWidth, _circleSize, _globalColor, texture);
  }
  //
  getRandomPixiCaostarTexture(randomTexture) {
    this.getRandomValues(randomTexture);

    return this.starTexture;
  }
  //
}
