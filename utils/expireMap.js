(function(){
    function Exmap(expTimeInMS, checkTimeInMS)
    {
        var that=this;

        if (expTimeInMS==undefined)
            return undefined;
        if (checkTimeInMS==undefined)
            checkTimeInMS=10*expTimeInMS;
        this.exptime=expTimeInMS;
        this.checktime=checkTimeInMS;
        this.innermap={};
        this.approxCount=0;

        this.checker=setInterval(function() {
            var nt=Date.now();
            for (k in that.innermap) {
                if (that.innermap[k][1]+that.exptime<nt)
                {
                    delete that.innermap[k];
                    that.approxCount--;
                }
            }
        }, this.checktime);
    }
    Exmap.prototype.Set=function(k, v) {
        if (! (k in this.innermap))
            this.approxCount++;
        this.innermap[k]=[v, Date.now()];
    };
    Exmap.prototype.Get=function(k) {
        if (! (k in this.innermap)) {
            return undefined;
        }
        var obj=this.innermap[k];
        if (obj[1]+this.exptime<Date.now())
        {
            delete this.innermap[k];
            this.approxCount--;
            return undefined;
        }
        return obj[0];
    };
    Exmap.prototype.Stop=function() {
        clearInterval(this.checker);
    };
    Exmap.prototype.Has=function(k) {
        if (! (k in this.innermap)) {
            return false;
        }
        var obj=this.innermap[k];
        if (obj[1]+this.exptime<Date.now())
        {
            delete this.innermap[k];
            this.approxCount--;
            return false;
        }
        return true;
    };

    function GetNewWarppedExmap(expTimeInMS, checkTimeInMS) {
        var original=new Exmap(expTimeInMS, checkTimeInMS);
        return new Proxy(original, {
            get: function(target, key) {
                return target.Get(key);
            },
            set: function(target, key, value, receiver) {
                target.Set(key, value);
                return true;
            },
            deleteProperty: function(target, key) {
                target.Set(key, undefined);
                return true;
            },
            has: function(target, key) {
                return target.Has(key);
            },
        });
    }

    if ( typeof module !== 'undefined' ) {
        module.exports.Exmap=Exmap;
        module.exports.NewExmap=GetNewWarppedExmap;
    }
    if (typeof window !== 'undefined') {
        if (!("_extension" in window)) window._extension={};
        window._extension.Exmap=Exmap;
        window._extension.NewExmap=GetNewWarppedExmap;
    }
})();
