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
    Effect._e=entities;

});
