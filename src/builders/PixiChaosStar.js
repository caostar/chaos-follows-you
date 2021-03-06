import * as PIXI from 'pixi.js';

export class PixiChaosStar extends PIXI.Container{
    constructor(_starWidth,_starHeight,_isvector){
        super()
        this.isvector = _isvector
        this.starWidth = _starWidth;
        this.starHeight = _starHeight;
        //
        this.theStarGraphic = new PIXI.Graphics();
        //
        this.starBMP = new PIXI.Sprite();
        this.dummy = new PIXI.Sprite();
        this.addChild(this.dummy);

        //this.isvector ? this.addChild(this.theStarGraphic) : this.addChild(this.starBMP);
        //this.changeStarTexture ();
        this.getRandomValues();
        
    }

    drawStar(context, angle, barWidth, barLength, arrowTopSharpness, arrowBottonSharpness, arrowWidth, circleSize, _color, texture) {
        context.clear();
        //context.beginFill(_color, 1);
        context.beginTextureFill({texture:texture});

        //the beggining of the arrow, touching the circle
        let arrowStartPoint = Math.sqrt( Math.pow(circleSize,2) - Math.pow(barWidth/2, 2) );

        //difference between the start and end width of the arrow
        let topDiff = Math.random()*15-5;
        //let topDiff = 0;					

        //a rotation of all arrows
        //let angleDiff = Math.random()*10-5;
        let angleDiff = 0;

        //says if arrows should have diffent sizes, and if it should be the even points or the odds
        let differentArrows = Math.random() < 0.5 ? true : false;
        let differentArrowsEven = Math.random() < 0.5 ? true : false;
        //					
        //goes to the beggining of the arrow, touching the circle
        context.lineTo( getRotatedX((-barWidth/2), (-arrowStartPoint), angle) , getRotatedY((-barWidth/2), (-arrowStartPoint), angle) );
        //
        function drawPoint(numStar){

            let barLengthChanger = 0;
            if((isEven(numStar) == differentArrowsEven) && differentArrows){
                barLengthChanger = barLength/2.5;
            }

            context.lineTo( getRotatedX((-barWidth/2-topDiff), (-arrowStartPoint - (barLength-barLengthChanger)), angle+angleDiff) , getRotatedY((-barWidth/2-topDiff), (-arrowStartPoint - (barLength-barLengthChanger)), angle+angleDiff) );

            context.lineTo( getRotatedX((-arrowWidth/2), (-arrowStartPoint - (barLength-barLengthChanger) + arrowBottonSharpness), angle+angleDiff) , getRotatedY((-arrowWidth/2), (-arrowStartPoint - (barLength-barLengthChanger) + arrowBottonSharpness), angle+angleDiff) );

            context.lineTo( getRotatedX((0), (-arrowStartPoint - (barLength-barLengthChanger) - arrowTopSharpness), angle+angleDiff) , getRotatedY((0), (-arrowStartPoint - (barLength-barLengthChanger) - arrowTopSharpness), angle+angleDiff) );

            context.lineTo( getRotatedX((arrowWidth/2), (-arrowStartPoint - (barLength-barLengthChanger) + arrowBottonSharpness), angle+angleDiff) , getRotatedY((arrowWidth/2), (-arrowStartPoint - (barLength-barLengthChanger) + arrowBottonSharpness), angle+angleDiff) );

            context.lineTo( getRotatedX((barWidth/2+topDiff), (-arrowStartPoint - (barLength-barLengthChanger)), angle+angleDiff) , getRotatedY((barWidth/2+topDiff), (-arrowStartPoint - (barLength-barLengthChanger)), angle+angleDiff) );

            context.lineTo( getRotatedX((barWidth/2), (-arrowStartPoint), angle) , getRotatedY((barWidth/2), (-arrowStartPoint), angle) );
        }

        drawPoint(1);
        for (let i=2;i<=8;i++)
        {
            angle+=45;
            context.lineTo( getRotatedX((-barWidth/2), (-arrowStartPoint), angle) , getRotatedY((-barWidth/2), (-arrowStartPoint), angle) );
            drawPoint(i);
        }
        //
        angle+=45;
        context.lineTo( getRotatedX((-barWidth/2), (-arrowStartPoint), angle) , getRotatedY((-barWidth/2), (-arrowStartPoint), angle) );
        
        context.endFill();
        
        function getRotatedX(px, py, degreeAngle){
            let newX;
            let theta = (Math.PI / 180) * degreeAngle;
            newX = Math.cos(theta) * px - Math.sin(theta) * py;
            return newX
        }
        function getRotatedY(px, py, degreeAngle){
            let newY;
            let theta = (Math.PI / 180) * degreeAngle;
            newY = Math.sin(theta) * px + Math.cos(theta) * py;
            return newY
        }
        function isEven(n){
            return (n % 2 == 0);
        }
					
    }

    createCaostar(baseSize, angle, barWidth, barLength, arrowTopSharpness, arrowBottonSharpness, arrowWidth, circleSize, globalColor,texture){

		this.drawStar(this.theStarGraphic, angle, barWidth*baseSize, barLength*baseSize, arrowTopSharpness*baseSize, arrowBottonSharpness*baseSize, arrowWidth*baseSize, circleSize, globalColor, texture);
        this.theStarGraphic.width = this.starWidth;
        this.theStarGraphic.height = this.starHeight;
		if(!this.isvector){
            if(texture){
                this.changeStarTexture(texture)
            };
            this.pushStarBitmap(texture);
        } 
    //end of function
    }
//
//UNDER BUG
    pushStarBitmap (texture){
        //this.starTexture.destroy(true);
        
        try{
            this.starTexture = renderer.generateTexture(this.theStarGraphic,PIXI.SCALE_MODES.LINEAR,window.devicePixelRatio || 1);
        }catch(error){
        }
        this.dummy.texture = this.starTexture;

        /* //this.starTexture = renderer.generateTexture(this.theStarGraphic,PIXI.SCALE_MODES.LINEAR,window.devicePixelRatio || 1);
        this.starTexture = renderer.generateTexture(this.starBMP,PIXI.SCALE_MODES.LINEAR,window.devicePixelRatio || 1);
        //https://www.pixiplayground.com/#/edit/XWQP2rDIDQgi7SO_tawZA
        this.dummy.texture = this.starTexture;
        //this.dummy.width = 1256;
        //this.dummy.height = 1256; */

    }
    changeStarTexture (texture){
        //this.addChild(this.starBMP);
        this.starBMP.texture = texture;
        this.starBMP.width = this.theStarGraphic.width;
        this.starBMP.height = this.theStarGraphic.height;
        this.starBMP.x = -this.theStarGraphic.width/2;
        this.starBMP.y = -this.theStarGraphic.height/2;
        //this.starBMP.width = this.theStarGraphic.width;
        //this.starBMP.height = this.theStarGraphic.height;
        //this.theStarGraphic.x = this.theStarGraphic.width/2;
        //this.theStarGraphic.y = this.theStarGraphic.height/2;
        //this.addChild(this.theStarGraphic);
        //this.starBMP.mask = this.theStarGraphic;
    }
    //
    getRandomValues(texture){
		let _baseSize = Math.random()*25+15;
		//
		let _barWidth = Math.random()*1; 
		//
		let _barLength = Math.random()*5+3.2; 
		//
		//let _arrowTopSharpness = Math.random()*1+1; 
		let _arrowTopSharpness = Math.random()*2+1; 
		//
		//let _arrowBottonSharpness = Math.random()*1; 
		let _arrowBottonSharpness = Math.random()*3; 
		//
		//let _arrowWidth = Math.random()*1.5+1;
		let _arrowWidth = Math.random()*3+2;
		//	
		let _circleSize = Math.random()*30+25;
		//
		let _globalColor = Math.floor(Math.random()*16777215);
		//
		this.createCaostar(_baseSize, 0, _barWidth, _barLength, _arrowTopSharpness, _arrowBottonSharpness,_arrowWidth, _circleSize, _globalColor, texture)
	}
    //
    getRandomPixiCaostarTexture(randomTexture){
        this.getRandomValues(randomTexture)
        return this.starTexture
    }
//

}