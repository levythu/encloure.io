// This is a duo-end source. Be careful not to be NodeJs-specified (require any package)
// or Browser-specified (use DOM or jQuery)

// NewMap(int width, int height)    gets a map
// map.Set(int x, int y, int value) sets a value to map
// map.Get(int x, int y)            gets a value from map
// map.Show()                       print the map to console
// map.FloodFill({} dict)           perform a floodfill and mark all district
//                                  surrounded by the trailing of ids in the dict as enclosed.

(function() {
    var constant={
        NO_OCCUPATION: -1,  // used to set a cell for empty
        NOT_DECIDED: -100,  // not used outside

         // i+DIM_GAP*k is treated all as player i. To be precise, i is the enclosed
         // district, i+DIM_GAP is the un enclosed trailing, the further numbers
         // are reserved.
        DIM_GAP: 100000,
    };
    function NewMap(width, height) {
        var map={};
        var colorRever={};

        // save constants
        for (var i in constant) map[i]=constant[i];

        // initiate map
        map.c=[];
        map._r=colorRever;

        for (var i=0; i<width; i++) {
            var t=[];
            for (var j=0; j<height; j++) {
                t.push(map.NO_OCCUPATION);
            }
            map.c.push(t);
        }
        // membership functions

        map.Set=function(x, y, v) {
            var p=x*height+y;
            var oldv=map.c[x][y];
            if (v===oldv) return;
            if (v>=0) {
                var c=v%map.DIM_GAP;
                if (!(c in colorRever)) {
                    colorRever[c]={
                        xmin: x,
                        xmax: x,
                        ymin: y,
                        ymax: y,
                        elems: {},
                    };
                } else {
                    if (x<colorRever[c].xmin) colorRever[c].xmin=x;
                    if (x>colorRever[c].xmax) colorRever[c].xmax=x;
                    if (y<colorRever[c].ymin) colorRever[c].ymin=y;
                    if (y>colorRever[c].ymax) colorRever[c].ymax=y;
                }
                if (c===v)  // is base color
                    colorRever[c].elems[p]=map.NO_OCCUPATION;
                else
                    colorRever[c].elems[p]=map.c[x][y];
            }
            var oldv=map.c[x][y];
            if (oldv>=0) {
                var c=v%map.DIM_GAP;
                delete colorRever[c].elems[p];
            }

            map.c[x][y]=v;
        }

        map.Get=function(x, y) {
            return map.c[x][y];
        }

        map.Show=function() {
            for (var i=0; i<width; i++) {
                var t=""
                for (var j=0; j<height; j++) {
                    t+=map.c[i][j]+"\t";
                }
                console.log(t);
            }
        }

        // FloodFill
        var cros=[[1, 0], [-1, 0], [0, 1], [0, -1]];
        var diag=[[1, 1], [-1, 1], [1, -1], [-1, -1]];
        map.FloodFill=function(colorId) {
            console.log(colorId);
            var singleRever=colorRever[colorId];
            if (singleRever==null) return;
            var round=map.NOT_DECIDED;
            var record={};
            var blanks=[];
            var blanksHead=0;
            var visitMap={};
            for (var i=singleRever.xmin; i<=singleRever.xmax; i++) {
                var p=i*height;
                for (var j=singleRever.ymin; j<=singleRever.ymax; j++) {
                    if (map.c[i][j]==map.NO_OCCUPATION) blanks.push(p+j);
                }
            }
            while (true) {
                while (blanksHead<blanks.length && (blanks[blanksHead] in visitMap)) blanksHead++;
                if (blanksHead==blanks.length) break;
                var p=blanks[blanksHead++];
                round--;
                record[round]=true;
                var stack=[[Math.floor(p/height), p%height]];
                while (stack.length>0) {
                    var src=stack.pop();
                    visitMap[src[0]*height+src[1]]=round;
                    if (record[round]) {
                        for (var i=0; i<cros.length; i++) {
                            var tx=src[0]+cros[i][0];
                            var ty=src[1]+cros[i][1];
                            if (tx<singleRever.xmin || ty<singleRever.ymin || tx>singleRever.xmax || ty>singleRever.ymax) {
                                record[round]=false;
                                break;
                            }
                        }
                    }
                    for (var i=0; i<cros.length; i++) {
                        var tx=src[0]+cros[i][0];
                        var ty=src[1]+cros[i][1];
                        if (tx<singleRever.xmin || ty<singleRever.ymin || tx>singleRever.xmax || ty>singleRever.ymax) {
                            continue;
                        }
                        var p=tx*height+ty;
                        if (map.c[tx][ty]==map.NO_OCCUPATION && (!(p in visitMap))) {
                            visitMap[p]=round;
                            stack.push([tx, ty]);
                        }
                    }
                }
            }
            console.log(visitMap);
            for (var i=singleRever.xmin; i<=singleRever.xmax; i++) {
                var p=i*height;
                for (var j=singleRever.ymin; j<=singleRever.ymax; j++) {
                    if (map.c[i][j]>=0) {
                        var numid=map.c[i][j]%map.DIM_GAP;
                        if (numid==colorId) map.Set(i, j, colorId);
                    } else {
                        if (record[visitMap[p+j]]===true) map.Set(i, j, numid);
                    }
                }
            }
        }

        return map;
    }

    if (typeof window !== 'undefined') {
        if (!("_extension" in window)) window._extension={};
        window._extension.NewMap=NewMap;
    }
    // Server-side export
    if ( typeof module !== 'undefined' ) {
        module.exports = NewMap;
    }

})();
