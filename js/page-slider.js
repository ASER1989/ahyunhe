/**
 * Created by aser on 16/8/5.
 */
;'use strict';
//define(['zepto'], function ($) {
//    return pageSlider($)
//});


var pageSlider = function ($) {
    var index = 1,
      pages,
      history = [],
      lastModel = null,
      preModel = null,
      transLock = false, //转场锁定
      rawUrl = new String(window.location).replace(/#[^#]+/, ""), //页面原始url
      hashLock = false, //hashchange事件触发锁
      isHistoryBack = false,
      loaderBox = document.createElement("div");
    loaderBox.isPre = false;

    var _Event = {
        onPageStart: null,
        onPageEnd: null
    };

    var type = new function () {
        return Object.prototype.toString;
    };

    type.isFunction = function (obj) {
        return this.call(obj) === "[object Function]";
    };
    type.isString = function (obj) {
        return this.call(obj) === "[object String]";
    };
    type.isBoolean = function (obj) {
        return this.call(obj) === "[object Boolean]";
    };
    type.isArray = function (obj) {
        return this.call(obj) === "[object Array]";
    }


    function _makeDiv(cls) {
        return "<div class='" + cls + "'></div>"
    }

    /**
     *事件监听
     **/
    function _eventListener(pages, eventName, callback) {
        //webkit支持webkitAnimationEnd这样的事件.A和E/S大写
        var isWebkit = 'WebkitAppearance' in document.documentElement.style || typeof document.webkitHidden != "undefined";
        eventName = isWebkit ? "webkit" + eventName.replace(/^a|s|e/g, function (matchs) {
            return matchs.toUpperCase();
        }) : eventName;

        pages.each(function (i, v) {

            $(v)[0].addEventListener(eventName, function () {
                if (type.isFunction(callback)) {
                    callback.call(this);
                }
            })
        })
    }

    function _pageEndcallBack() {

        var that = $(this);


        that.removeClass("slide");

        if (that.hasClass("out")) {
            that.addClass("hide");
        } else {
            that.removeClass("hide");
        }

        that.removeClass("out").removeClass("in").removeClass("reverse");

        if (type.isFunction(_Event.onPageEnd)) {
            _Event.onPageEnd.call(this);
        }
        transLock = false;
    }

    function _pageStartCallBack() {
        transLock = true;
        if (type.isFunction(_Event.onPageStart)) {
            _Event.onPageStart.call(this);
        }

    }

    function _modelEques(model1, model2) {
        if (model1 == null || model2 == null) {
            return false;
        }
        var res = true;
        res = model1.title == model2.title;
        res = model1.url == model2.url;
        res = model1.hasScript == model2.hasScript;

        if (model1.data && model1.data.length > 0) {
            for (var n in model1.data) {
                if (model1.data[n] != null || model2.data[n] != null) {
                    res = model1.data[n] == model2.data[n];
                }
                if (!res) {
                    break;
                }

            }
        }
        return res;
    }

    /**
     * 创建加载框
     * 使用loaderBox进行管理
     * */
    function _loading(text) {
        text = text || "Loading";

        var lodiv = document.createElement("div");
        var innerdiv = document.createElement("div");

        lodiv.classList.add("loader");

        innerdiv.classList.add("des");
        innerdiv.innerText = text;

        loaderBox.classList.add("loading");
        loaderBox.classList.add("hide");
        loaderBox.appendChild(lodiv);
        loaderBox.appendChild(innerdiv);

        document.body.appendChild(loaderBox);
    }

    /**
     * 加载新页面
     * url:页面地址
     * data:可以用于ajax的data
     * callback:回调
     * */
    function _loadPage(url, data, callback) {
        if (type.isFunction(data)) {
            callback = data;
            data = null;
        }
        if (!loaderBox.isPre)
            loaderBox.classList.remove("hide");

        var reqTime = (new Date()).getTime();
        $.ajax({
            url: url,
            type: "GET",
            data: data,
            success: function (data) {
                if (type.isFunction(callback)) {
                    var title = "";
                    data = data.replace(/\<[^>]DOCTYPE [^>]+\>/g, "");
                    data = data.replace(/\<meta [^>]+\>/g, "");
                    data = data.replace(/\<title\>[^<]{0,}\<\/title\>/, function (matches) {
                        title = matches.replace("<title>", "").replace("</title>", "");
                        return "";
                    });
                    data = data.replace(/\<[^>]{1,}data-remove[^>]{0,}\>[^>]{1,}\>/g, "");

                    var resTime = 1000 - ((new Date()).getTime() - reqTime);

                    callback.call(null, data, title);
                    setTimeout(function () {
                        loaderBox.classList.add("hide");
                    }, resTime > 0 ? resTime : 0);
                }
            }
        });
    }


    /**
     * 加载js文件,并创建一个随机函数名的函数
     * 函数内容为js内容
     * 最后执行该函数
     * 如果函数内包含ready方法,则执行ready()
     * */
    function _jsLoader(url, page, callback) {
        //return

        var jsname = url.replace('.html', '.js');
        $.get(jsname, function (data) {
            var fnName = roundName();
            data = "function " + fnName + "(){" + data + " ; if(typeof ready=='function'){ready();}};"
            data += fnName + "();";
            $(page).append("<script>" + data + "</script>");

            if (type.isFunction(callback)) {
                callback.call();
            }
        });

        function roundName() {
            var keys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
            var nl = (Math.random(0) * 7).toFixed(0);
            var fnName = "_page_";
            for (var i = 0; i < nl; i++) {
                fnName += keys[(Math.random(0) * 26).toFixed(0)];
            }

            return fnName;
        }

    }

    /**
     * 添加历史记录
     * */
    function _history(url, data, hasScript, title) {
        if (type.call(url) == "[object Object]") {
            hasScript = url.hasScript;
            data = url.data;
            title = url.title;
            url = url.url;
        }

        lastModel = {url: url, data: data, hasScript: hasScript, title: title};
        history.push({url: url, data: data, hasScript: hasScript, title: title});
    }

    /**
     * 新页面事件绑定
     * 为有data-page属性的元素添加事件绑定
     * **/
    function _newPageEventBind(custPage) {
        custPage.find("[data-page]").forEach(function (v, i) {
            var that = $(v);
            var link = that.attr("data-page");

            if (link.length > 0 && link != "goback()") {
                var hasScript = that.attr("data-hasScript");
                that.on("click", function () {
                    _transToPage(link, null, hasScript);
                });
            } else if (link == "goback()") {
                that.on("click", function () {
                    _goBack();
                });
            }

        });

    }

    /**
     * 跳转至新页面
     * 如果是后退后再次打开上次页面则直接使用上次加载的页面
     * (此处存在不准确判断 data==data ; 无法对对象进行对比.)
     * */
    function _transToPage(url, data, hasScript) {
        if (transLock) return;

        if (type.isBoolean(data)) {
            hasScript = data;
            data = null;
        }

        var nidx = index == 2 ? 0 : index + 1;

        if (lastModel && lastModel.url == url && lastModel.data == data && lastModel.hasScript == hasScript) {

            document.title = lastModel.title;
            $(pages[nidx]).removeClass("hide").addClass("slide in");
            //强制重绘 reflow
            loaderBox.offsetHeight = loaderBox.offsetHeight;
            $(pages[index]).addClass("slide out");

            index = nidx;

            _history(lastModel);
            _historyHandle(_makeHash(url));
            return;
        }

        _loadPage(url, data, function (res, title) {

            document.title = title;
            $(pages[nidx]).removeClass("hide").addClass("slide in").html("");
            //强制重绘 reflow
            loaderBox.offsetHeight = loaderBox.offsetHeight;
            $(pages[index]).addClass("slide out");


            $(pages[nidx]).html(res);

            _newPageEventBind($(pages[nidx]));
            index = nidx;


            if (hasScript)
                _jsLoader(url, pages[nidx]);

            _history(url, data, hasScript, title);
            _historyHandle(_makeHash(url));
        });


    }

    /**
     * 返回前一页面
     * 并预加载返回页面的上一页
     * */
    function _goBack() {

        if (transLock) return;

        if (history.length > 1) {
            lastModel = history.pop();
            var model = history[history.length - 1];

            var nidx = index == 0 ? 2 : index - 1;

            $(pages[index]).addClass("reverse out");
            $(pages[nidx]).removeClass("hide").addClass("slide reverse in");
            //强制重绘 reflow
            loaderBox.offsetHeight = loaderBox.offsetHeight;
            $(pages[index]).addClass("slide");

            document.title = model.title;
            index = nidx;

            if (history.length > 1) {
                var premodel = history[history.length - 2];
                var preidx = index == 0 ? 2 : index - 1;
                loaderBox.isPre = true;
                _preLoad(premodel, pages[preidx], function () {
                    loaderBox.isPre = false;
                });
            }
            if (!isHistoryBack) {
                window.history.back();
            }
            isHistoryBack = false;
            hashLock = true;
            return true
        }
        return false

    }

    function _makeHash(url) {
        var htmlname = url.toLowerCase().match(/[^\/]+\.html/);
        var res = (htmlname == null || htmlname.length == 0 || htmlname[0] == null) ? (+new Date()) : htmlname[0].replace(".html", "");
        return res;
    }

    function _historyHandle(hash) {
        hashLock = true;
        window.location = rawUrl + "#" + hash;

    }

    function _hashEventListener() {
        window.onhashchange = function () {

            if (!hashLock) {
                isHistoryBack = true;
                //if (history.length > 0 && window.location.hash == "#" + _makeHash(history[history.length-1].url))
                    _goBack();
                //return;
            }
            hashLock = false;
        }
    }

    /**
     * 预加载
     *
     * */
    function _preLoad(model, custPage) {
        if (model) {
            $(custPage).html("");
            preModel = model;
            if (type.isBoolean(model.data)) {
                model.hasScript = model.data;
                model.data = null;
            }

            _loadPage(model.url, model.data, function (res) {
                $(custPage).html(res);
                _newPageEventBind($(custPage));

                if (model.hasScript)
                    _jsLoader(model.url, custPage);
            });
        }
    }


    function _init(container, url, hasScript) {

        /**
         *容器初始化
         **/
        if (type.isString(container)) {
            container = $(container);
        }

        //创建page容器
        var div = _makeDiv("page") + _makeDiv("page") + _makeDiv("page");
        container.append(div);

        container.find(".page").addClass("hide").eq(1).removeClass("hide");
        //容器事件监听
        pages = container.find(".page");
        _eventListener(pages, 'animationstart', _pageStartCallBack);
        _eventListener(pages, 'animationend', _pageEndcallBack);

        /**
         * 加载新页面
         * */
        _loadPage(url, null, function (res, title) {

            $(pages[index]).html(res);
            _newPageEventBind($(pages[index]));

            document.title = title;

            if (hasScript) {
                _jsLoader(url, pages[index]);
            }

            _history(url, null, hasScript, title);
        });

        _hashEventListener();

    }

    /**
     * 文件预加载(仅限html,js,css等静态文件);
     * */

    var pre = {
        succCount: 0,
        failCount: 0,
        callback: null,
        allCount: 0,
        load: function (src) {
            var el = document.createElement("script");
            el.addEventListener("load", pre.success, false);
            el.addEventListener("error", pre.fail, false);
            el.src = src;

            document.body.appendChild(el);
        },
        success: function (e) {
            this.removeEventListener("load", pre.success);
            pre.succCount += 1;
            pre.succCount == pre.allCount && pre.callback(pre.succCount, pre.failCount);
        },
        fail: function (e) {
            this.removeEventListener("error", pre.fail);
            pre.failCount += 1;
            pre.succCount == pre.allCount && pre.callback(pre.succCount, pre.failCount);
        }
    }

    function pagePreLoad(uri, callback) {
        pre.callback = callback || function () {
          };
        pre.allCount = type.isArray(uri) ? uri.length : 1;

        type.isArray(uri) ? uri.forEach(function (v) {
            pre.load(v);
        }) : pre.load(v);


    }


    return {
        ready: function (options) {

            if (options.el && options.url) {
                _init(options.el, options.url, options.hasScript);
            }

            _Event.onPageEnd = options.onPageEnd;
            _Event.onPageStart = options.onPageStart;
            if (options.loader == true) {
                _loading();
            }


        },
        transToPage: _transToPage,
        go: _transToPage,
        goBack: _goBack,
        preLoad: pagePreLoad
    }
}

/**
 * html节点属性说明
 * *****************************************************
 *
 * data-page            : 点击跳转到对应页面
 * data-hasScript=true  : 加载与页面同名且同路径的js文件
 * data-remove          : 页面加载时不加载该节点
 *
 * *****************************************************
 * 框架特点说明:
 * 前进时,若加载对象等同于前一个页面对象,则不重新加载页面
 * 后退时,自动预加载一页
 *
 * *****************************************************
 * 最新bug修复说明:
 * 2016.8.26--由于转场一次对dom进行样式添加,浏览器没有间隔渲染,所以会出现两个页面只有一个页面有动画的bug,这时添加了强制回流(先执行上面的js代码)的代码,
 * 强制回流的属性包括:offsetTop, offsetLeft, offsetWidth, offsetHeight ,scrollTop, scrollLeft, scrollWidth,
 * scrollHeight,clientTop, clientLeft, clientWidth, clientHeight
 *
 * *****************************************************
 * 2016.11.21
 * 新增浏览器回退处理
 *
 * *****************************************************
 * 备注: 当前代码可优化度还很高!!!
 * */