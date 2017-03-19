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
        var blanks={};
        var map={};

        // save constants
        for (var i in constant) map[i]=constant[i];

        // initiate map
        map.c=[];
        map._b=blanks;
        for (var i=0; i<width; i++) {
            var t=[];
            for (var j=0; j<height; j++) {
                t.push(map.NO_OCCUPATION);
                blanks[i*height+j]=true;
            }
            map.c.push(t);
        }
        // membership functions

        map.Set=function(x, y, v) {
            var p=x*height+y;
            if (v===map.NO_OCCUPATION) {
                blanks[p]=true;
            } else {
                delete blanks[p];
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
        map.FloodFill=function(triggeredIdNumList={}) {
            var round=map.NOT_DECIDED;
            var record={};
            while (true) {
                var p=null;
                for (var i in blanks) {
                    p=i;
                    break;
                }
                if (p==null) {
                    break;
                }
                round--;
                record[round]=map.NOT_DECIDED;
                var stack=[[Math.floor(p/height), p%height]];
                while (stack.length>0) {
                    var src=stack.pop();
                    map.Set(src[0], src[1], round);
                    if (record[round]!=-1) {
                        for (var i=0; i<cros.length; i++) {
                            var tx=src[0]+cros[i][0];
                            var ty=src[1]+cros[i][1];
                            if (tx<0 || ty<0 || tx>=width || ty>=height) {
                                record[round]=map.NO_OCCUPATION;
                                break;
                            }
                            if (map.c[tx][ty]<0) continue;
                            if (record[round]>=0 && record[round]!=map.c[tx][ty]%map.DIM_GAP) {
                                record[round]=map.NO_OCCUPATION;
                                break;
                            }
                            record[round]=map.c[tx][ty]%map.DIM_GAP;
                        }
                    }
                    for (var i=0; i<cros.length; i++) {
                        var tx=src[0]+cros[i][0];
                        var ty=src[1]+cros[i][1];
                        if (tx<0 || ty<0 || tx>=width || ty>=height) {
                            break;
                        }
                        if (map.c[tx][ty]==map.NO_OCCUPATION) {
                            map.Set(tx, ty, round);
                            stack.push([tx, ty]);
                        }
                    }
                }
            }
            for (var i=0; i<width; i++) {
                for (var j=0; j<height; j++) {
                    if (map.c[i][j]>=0) {
                        var numid=map.c[i][j]%map.DIM_GAP;
                        if (numid in triggeredIdNumList) map.c[i][j]=numid;
                    } else {
                        var numid=record[map.c[i][j]];
                        if (numid in triggeredIdNumList) map.Set(i, j, numid);
                        else map.Set(i, j, map.NO_OCCUPATION);
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
