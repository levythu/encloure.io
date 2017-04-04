var Effect={};
$(function() {

    var entities={};
    var ct=0;

    function SparkFlake(x, y, sx, sy, color) {
        this.x=x;
        this.y=y;
        this.sx=Math.abs(sx);
        this.dx=sx>0?1:-1;
        this.sy=Math.abs(sy);
        this.dy=sy>0?1:-1;
        this.color=color;
        this.size=Math.random()*4+2;
        this.f=3;
    }
    SparkFlake.prototype.onRender=function(canvas) {
        canvas.fillStyle=this.color;
        canvas.fillRect(this.x, this.y, this.size, this.size);
        this.x+=this.dx*this.sx;
        this.y+=this.dy*this.sy;
        this.sx=Math.max(0, this.sx-this.f);
        this.sy=Math.max(0, this.sy-this.f);
        if (this.sx==0 && this.sy==0) {
            delete entities[this.id];
        }
    }

    // From Hex to RGB, credit to http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    function Debris(x, y, w, h, color) {
        this.x=x;
        this.y=y;
        this.a=0;
        this.w=w;
        this.h=h;
        this.color=hexToRgb(color);
        this.color.a=1;
        this.sx=Math.random()*16-8;
        this.sy=Math.random()*16-8;
        this.sa=Math.random()*6-3;
        this.frameToLive=Math.random()*30+10;
        this.salpha=1/this.frameToLive;
    }
    Debris.prototype.onRender=function(canvas) {
        canvas.save();
        canvas.translate(this.x+this.w/2,this.y+this.h/2);
        canvas.rotate(this.a);
        canvas.fillStyle="rgba("+this.color.r+","+this.color.g+","+this.color.b+","+this.color.a+")";
        canvas.fillRect(-1*this.w/2, -1*this.h/2, this.w, this.h);
        canvas.restore();
        this.x+=this.sx;
        this.y+=this.sy;
        this.a+=this.sa;
        this.color.a=Math.max(this.color.a-this.salpha, 0);
        this.frameToLive--;
        if (this.frameToLive<=0) {
            delete entities[this.id];
        }
    }



    Effect.Add=function(entity) {
        ct++;
        entity.id=ct;
        entities[ct]=entity;
    };
    Effect.Render=function(canvas) {
        for (var i in entities) {
            entities[i].onRender(canvas);
        }
    };


    Effect.SparkFlake=SparkFlake;
    Effect.Debris=Debris;
    Effect._e=entities;

});
