/**
 * Created by aser on 16/9/20.
 */
var require = function (uri, callback) {

    var els = [], urls = [],htmlHead=document.getElementsByTagName("head")[0];
    callback = typeof callback == "function" ? callback : function () {

    }
    //debugger;
    Object.prototype.toString.call(uri) == "[object Array]" ? urls = uri : urls.push(uri);

    function init(uri) {
        var el = document.createElement("script");

        "onload" in el ? el.onload = onLoad : el.onreadystatechange = function () {
            ("loaded" == this.readyState || "complete" == this.readyState) && onLoad();
        }

        el.type = "text/javascript";
        el.src = uri;
        htmlHead.appendChild(el);
        return el;
    }

    function onLoad(el) {
        els.push(el);
        els.length == urls.length ? callback.call() : !0;
    }

    void function ready(){

        for(var i in urls){
            init(urls[i]);
        }
    }();

}