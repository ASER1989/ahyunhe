/**
 * Created by aser on 16/11/18.
 * 工作原理:根据节点上的时间设定,添加或移除指定样式名称,实现动画效果
 * 属性说明
 * @data-move 当前节点需要执行动画
 * @data-delay 延迟时间,以毫秒为单位
 * @data-cls 需要添加的样式
 * @data-delCls 需要移除的样式
 */
var move = function () {

    var that = this,
      $ = selectorInit(),
      type = typeInit();

    var threads = [];

    void function init() {
        that.Els = $("[data-move='true']");
        that.stime = +new Date();//开始时间

        that.Els.forEach(function (item) {
            var time = item.attr("data-delay") || 0;
            var cls = item.attr("data-cls");
            var delcls = item.attr("data-delCls");

            (cls || delcls) && threads.push(new thread(function () {
                cls && item.addClass(cls);
                delcls && item.removeClass(delcls);
            }, time));
        });
    }();


    var start = function () {
        threads.forEach(function (item) {
            item.start();
        });
    }

    /**
     * 工具类
     * **/
    function selectorInit() {
        var $ = function (n) {
            return document.querySelectorAll(n);
        };
        /**
         * 获取属性值
         * @n string
         * **/
        HTMLElement.prototype.attr = function (n) {
            return this.getAttribute(n);
        }
        /**
         * 添加样式
         * @n string||array
         * **/
        HTMLElement.prototype.addClass = function (n) {
            var el = this;
            var ns = n.split(",");
            type.isArray(ns) ? (void function () {
                ns.forEach(function (i) {
                    el.classList.add(i);
                });
            }()) : el.classList.add(n);

            return el;
        }

        /**
         * 移除样式
         * @n string||array
         * **/
        HTMLElement.prototype.removeClass = function (n) {
            var el = this;
            var ns = n.split(",");
            if (type.isArray(ns)) {
                ns.forEach(function (i) {
                    el.classList.remove(i);
                })
            } else {
                el.classList.remove(i);
            }
            return el;
        }

        NodeList.prototype.forEach=Array.prototype.forEach=function(fn){
            var callback=function(obj,item,i){
                var res = fn.call(obj,item,i);
                return res==null?true:res;
            }
            for(var i =0;i<this.length && callback(this[i],this[i],i);i++){


            }
        }
        return $;
    }

    function typeInit() {
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
        return type;
    }

    function thread(fn, time) {
        var timer = null;

        function start() {
            timer = setTimeout(fn, time);
        }

        function end() {
            clearTimeout(timer);
        }

        return {
            start: start,
            end: end
        }
    }

    return {
        start: start
    }

}