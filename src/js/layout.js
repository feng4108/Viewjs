View(function(toolbox){
	var globalLogger = toolbox.get("Logger").globalLogger,
		util = toolbox.get("util"),
		resolution = toolbox.get("resolution");

	var attr$view_container = "data-view-container";

	/** 蓝图宽高比。默认为 iPhone5 的宽高比。用于在PC环境下布局 */
	var expectedWidthHeightRatio = 320 / 568;

	/** 视口尺寸发生变化时是否自动布局 */
	var autoReLayoutWhenResize = true;

	/** 布局发生变化时要执行的方法 */
	var layoutChangeListeners = [];

	/* 是否已经完成初始化 */
	var isInitialized = false;

	/** 空方法 */
	var emptyFunc = function doNothing(){};

	var obj = {};
	var docEle = document.documentElement;

	/**
	 * 查找View容器
	 * View容器是声明了attr$view_container属性的元素。如果没有元素声明该属性，则返回document.body
	 */
	var getViewContainerObj = function(){
		var obj = docEle.querySelector("[" + attr$view_container + "]");
		return obj || document.body || docEle;
	};

	/**
	 * 获取布局宽度
	 */
	var getLayoutWidth = function(){
		var containerObj = getViewContainerObj();
		var style = util.getComputedStyle(containerObj);
		var paddingLeft = Number(style.paddingLeft.replace(/px/, "")),
			paddingRight = Number(style.paddingRight.replace(/px/, ""));
		if(isNaN(paddingLeft))
			paddingLeft = 0;
		if(isNaN(paddingRight))
			paddingRight = 0;
		return containerObj.clientWidth - paddingLeft - paddingRight;
	};

	/**
	 * 获取布局高度
	 */
	var getLayoutHeight = function(){
		var containerObj = getViewContainerObj();
		var style = util.getComputedStyle(containerObj);
		var paddingTop = Number(style.paddingTop.replace(/px/, "")),
			paddingBottom = Number(style.paddingBottom.replace(/px/, ""));
		if(isNaN(paddingTop))
			paddingTop = 0;
		if(isNaN(paddingBottom))
			paddingBottom = 0;
		return containerObj.clientHeight - paddingTop - paddingBottom;
	};

	/**
	 * 获取浏览器宽度
	 */
	var getBrowserWidth = function(){
		return window.innerWidth || docEle.clientWidth;
	};

	/**
	 * 获取浏览器高度
	 */
	var getBrowserHeight = function(){
		return window.innerHeight || docEle.clientHeight;
	};

	/**
	 * 判断当前布局方向是否是竖屏方向
	 */
	var isLayoutPortrait = function(){
		return getLayoutWidth() <= getLayoutHeight();
	};

	/**
	 * 判断当前布局方向是否是横屏方向
	 */
	var isLayoutLandscape = function(){
		return !isLayoutPortrait();
	};

	/**
	 * 判断当前浏览器方向是否是竖屏方向
	 */
	var isBrowserPortrait = function(){
		return getBrowserWidth() <= getBrowserHeight();
	};

	/**
	 * 判断当前浏览器方向是否是横屏方向
	 */
	var isBrowserLandscape = function(){
		return !isBrowserPortrait();
	};

	/**
	 * 获取当前布局尺寸的宽高比
	 */
	var getLayoutWidthHeightRatio = function(){
		return getBrowserWidth() / getBrowserHeight();
	};

	/**
	 * 获取当前浏览器窗口尺寸的宽高比
	 */
	var getBrowserWidthHeightRatio = function(){
		return getBrowserWidth() / getBrowserHeight();
	};

	/**
	 * 获取蓝图的宽高比（用于在PC横屏布局下以手机版面布局）
	 */
	var getExpectedWidthHeightRatio = function(){
		return expectedWidthHeightRatio;
	};

	/**
	 * 设置蓝图的宽高比
	 * @param {Number} ratio 蓝图的宽高比
	 */
	var setExpectedWidthHeightRatio = function(ratio){
		expectedWidthHeightRatio = ratio;
		return obj;
	};

	/**
	 * 以手机版式下的竖屏模式（宽小于高）进行布局。this：视图容器DOM元素
	 * @param {Number} width 布局空间的宽度
	 * @param {Number} height 布局空间的高度
	 */
	var layoutAsMobilePortrait_dft = function(width, height){
		var viewContainerObj = this;
		var s = viewContainerObj.style;

		s.width = width + "px";
		s.height = height + "px";
	};
	var layoutAsMobilePortrait = layoutAsMobilePortrait_dft;

	/**
	 * 以手机版式下的横屏模式（宽大于高）进行布局。this：视图容器DOM元素
	 * @param {Number} width 布局空间的宽度
	 * @param {Number} height 布局空间的高度
	 */
	var layoutAsMobileLandscape_dft = layoutAsMobilePortrait;
	var layoutAsMobileLandscape = layoutAsMobileLandscape_dft;

	/**
	 * 以平板版式下的竖屏模式（宽小于高）进行布局。this：视图容器DOM元素
	 * @param {Number} width 布局空间的宽度
	 * @param {Number} height 布局空间的高度
	 */
	var layoutAsTabletPortrait_dft = layoutAsMobilePortrait;
	var layoutAsTabletPortrait = layoutAsTabletPortrait_dft;

	/**
	 * 以平板版式下的横屏模式（宽大于高）进行布局。this：视图容器DOM元素
	 * @param {Number} width 布局空间的宽度
	 * @param {Number} height 布局空间的高度
	 */
	var layoutAsTabletLandscape_dft = layoutAsMobileLandscape;
	var layoutAsTabletLandscape = layoutAsTabletLandscape_dft;

	/**
	 * 以PC版式下的竖屏模式（宽小于高）进行布局。this：视图容器DOM元素
	 * @param {Number} width 布局空间的宽度
	 * @param {Number} height 布局空间的高度
	 */
	var layoutAsPcPortrait_dft = layoutAsMobilePortrait;
	var layoutAsPcPortrait = layoutAsPcPortrait_dft;

	/**
	 * 以PC版式下的横屏模式（宽大于高）进行布局。this：视图容器DOM元素
	 * @param {Number} width 布局空间的宽度
	 * @param {Number} height 布局空间的高度
	 */
	var layoutAsPcLandscape_dft = layoutAsMobileLandscape;
	var layoutAsPcLandscape = layoutAsPcLandscape_dft;

	/**
	 * 以手机版式进行布局（自动判断横竖屏）
	 */
	var layoutAsMobile = function(){
		var width = getBrowserWidth(), height = getBrowserHeight();
		var f = isBrowserLandscape()? layoutAsMobileLandscape: layoutAsMobilePortrait;
		util.try2Call(f, getViewContainerObj(), width, height);
	};

	/**
	 * 以平板版式进行布局（自动判断横竖屏）
	 */
	var layoutAsTablet = function(){
		var width = getBrowserWidth(), height = getBrowserHeight();
		var f = isBrowserLandscape()? layoutAsTabletLandscape: layoutAsTabletPortrait;
		util.try2Call(f, getViewContainerObj(), width, height);
	};

	/**
	 * 以PC版式进行布局（自动判断横竖屏）
	 */
	var layoutAsPC = function(){
		var width = getBrowserWidth(), height = getBrowserHeight();
		if(isBrowserPortrait())
			util.try2Call(layoutAsPcPortrait, getViewContainerObj(), width, height);
		else if(layoutAsPcLandscape === layoutAsPcLandscape_dft){/* 没有指定自定义的PC横屏布局办法，则以蓝图手机版式布局 */
			width = height * expectedWidthHeightRatio;
			util.try2Call(layoutAsMobilePortrait, getViewContainerObj(), width, height);
		}else
			util.try2Call(layoutAsPcLandscape, getViewContainerObj(), width, height);
	};

	/**
	 * 添加“布局发生改变”事件监听器
	 */
	var addLayoutChangeListener = function(listener){
		if(layoutChangeListeners.indexOf(listener) !== -1)
			return;

		layoutChangeListeners.push(listener);
		return obj;
	};

	/**
	 * 移除“布局发生改变”事件监听器
	 */
	var removeLayoutChangeListener = function(listener){
		var index = layoutChangeListeners.indexOf(listener);
		if(index === -1)
			return;

		layoutChangeListeners.splice(index, 1);
		return obj;
	};

	/**
	 * 根据初始化时设置的各个模式下的浏览方式，结合设备当前的浏览方向和设备类型自动进行布局
	 * @param {Boolean} [async=true] 是否以异步的方式完成布局
	 */
	var doLayout = (function(){
		var width = getLayoutWidth(),
			height = getLayoutHeight();

		return function(async){
			if(arguments.length < 1)
				async = true;

			if(util.env.isPc)
				layoutAsPC();
			else if(util.env.isTablet)
				layoutAsTablet();
			else
				layoutAsMobile();

			var newWidth = getLayoutWidth(),
				newHeight = getLayoutHeight();
			var browserWidth = getBrowserWidth(),
				browserHeight = getBrowserHeight();

			var ifLayoutChanges = Math.abs(width - newWidth) >= 0.1 || Math.abs(height - newHeight) >= 0.1;
			if(ifLayoutChanges){
				var action = function(){
					//globalLogger.debug("Layout changes. Layout: {} * {}, browser: {} * {}", newWidth, newHeight, browserWidth, browserHeight);
					for(var i = 0; i < layoutChangeListeners.length; i++){
						var cb = layoutChangeListeners[i];
						if(typeof cb != "function")
							continue;

						util.try2Call(cb, null, newWidth, newHeight, browserWidth, browserHeight);
					}
				};

				if(async)
					setTimeout(action, 0);
				else
					action();
			}

			return obj;
		};
	})();

	/**
	 * 初始化
	 * @param {Object} ops 初始化参数
	 * @param {Boolean} [ops.autoReLayoutWhenResize=true] 当视口尺寸发生变化时，是否自动重新布局
	 * @param {Function} [ops.layoutAsMobilePortrait] 手机以竖屏方式使用应用时的布局方式
	 * @param {Function} [ops.layoutAsMobileLandscape] 手机以横屏方式使用应用时的布局方式
	 * @param {Function} [ops.layoutAsTabletPortrait] 平板以竖屏方式使用应用时的布局方式
	 * @param {Function} [ops.layoutAsTabletLandscape] 平板以横屏方式使用应用时的布局方式
	 * @param {Function} [ops.layoutAsPcPortrait] PC桌面以竖屏方式使用应用时的布局方式
	 * @param {Function} [ops.layoutAsPcLandscape] PC桌面以横屏方式使用应用时的布局方式
	 */
	var init = function(ops){
		if(isInitialized){
			globalLogger.warn("Layout was initialized already");
			return obj;
		}

		isInitialized = true;
		ops = util.setDftValue(ops, {
			autoReLayoutWhenResize: true,

			layoutAsMobilePortrait: layoutAsMobilePortrait,
			layoutAsMobileLandscape: layoutAsMobileLandscape,
			layoutAsTabletLandscape: layoutAsTabletLandscape,
			layoutAsTabletPortrait: layoutAsTabletPortrait,
			layoutAsPcPortrait: layoutAsPcPortrait,
			layoutAsPcLandscape: layoutAsPcLandscape
		});

		autoReLayoutWhenResize = !!ops.autoReLayoutWhenResize;
		if(autoReLayoutWhenResize)
			resolution.addChangeListener(function(changeAspects){
				/**
				 * height-: 暂不处理虚拟键盘弹出，导致浏览窗口变小的现象（对于固定显示在底部的元素，处理后效果较差，效果等同于绝对定位）
				 * height+: 高度变大时，有可能是因为虚拟键盘弹出导致窗口变小，而后键盘收回窗口随即变大，此时也不应该执行布局动作，否则就间接地响应了 height-
				 */
				if(
					changeAspects.indexOf("height-") !== -1
					||
					changeAspects.indexOf("height+") !== -1 && getLayoutHeight() >= getBrowserHeight()
				)
					return;

				doLayout(false);
			});

		if(typeof ops.layoutAsMobilePortrait === "function")
			layoutAsMobilePortrait = ops.layoutAsMobilePortrait;
		if(typeof ops.layoutAsMobileLandscape === "function")
			layoutAsMobileLandscape = ops.layoutAsMobileLandscape;
		if(typeof ops.layoutAsTabletPortrait === "function")
			layoutAsTabletPortrait = ops.layoutAsTabletPortrait;
		if(typeof ops.layoutAsTabletLandscape === "function")
			layoutAsTabletLandscape = ops.layoutAsTabletLandscape;
		if(typeof ops.layoutAsPcPortrait === "function")
			layoutAsPcPortrait = ops.layoutAsPcPortrait;
		if(typeof ops.layoutAsPcLandscape === "function")
			layoutAsPcLandscape = ops.layoutAsPcLandscape;

		return obj;
	};

	var extend = util.setDftValue;
	extend(obj, {
		getLayoutWidth: getLayoutWidth,
		getLayoutHeight: getLayoutHeight,
		getBrowserWidth: getBrowserWidth,
		getBrowserHeight: getBrowserHeight,
		isLayoutPortrait: isLayoutPortrait,
		isLayoutLandscape: isLayoutLandscape,
		isBrowserPortrait: isBrowserPortrait,
		isBrowserLandscape: isBrowserLandscape,
		getLayoutWidthHeightRatio: getLayoutWidthHeightRatio,
		getBrowserWidthHeightRatio: getBrowserWidthHeightRatio,
		getExpectedWidthHeightRatio: getExpectedWidthHeightRatio,
		setExpectedWidthHeightRatio: setExpectedWidthHeightRatio,

		init: init,
		doLayout: doLayout,

		addLayoutChangeListener: addLayoutChangeListener,
		removeLayoutChangeListener: removeLayoutChangeListener
	});

	Object.freeze && Object.freeze(obj);

	toolbox.set("layout", obj);
})