View(function(toolbox){
	var globalLogger = toolbox.get("Logger").globalLogger;

	/**
	 * 设定参数默认值
	 * @param {Object} ops 要设定默认值的目标
	 * @param {Object} dftOps 提供的默认值配置
	 * @param {Boolean} [overrideNull=false] 如果键已经存在且取值为null，是否使用默认值覆盖null值
	 */
	var setDftValue = function(ops, dftOps, overrideNull){
		if(arguments.length < 3)
			overrideNull = false;

		ops = ops || {};
		dftOps = dftOps || {};

		/* 参数不存在时，从默认参数中读取并赋值 */
		for(var p in dftOps)
			if(!(p in ops) || (p in ops && null == ops[p] && overrideNull))
				ops[p] = dftOps[p];

		return ops;
	};

	/**
	 * 为指定的对象附加指定名称的只读的属性
	 * @param {Object} obj 目标对象
	 * @param {String} name 属性名称
	 * @param {*} val 属性取值
	 */
	var defineReadOnlyProperty = function(obj, name, val){
		Object.defineProperty(obj, name, {value: val, configurable: false, writable: false, enumerable: true});
	};

	/**
	 * 尝试调用指定的方法
	 * @param {Function} func 待执行的方法
	 * @param {Object} ctx 方法执行时的this上下文
	 * @param {Arguments} args 方法参数列表对象
	 */
	var try2Apply = function(func, ctx, args){
		if(null == func || typeof func !== "function")
			return;

		try{
			func.apply(ctx, args);
		}catch(e){
			var isError = e instanceof Error || (e != null && typeof e === "object" && "stack" in e);
			var s = "Error occured while executing function: {}. {}" + (isError? " stack:\n{}": "");
			globalLogger.error(s, func.name, e, isError? e.stack: null);
		}
	};

	/**
	 * 尝试调用指定的方法
	 * @param {Function} func 待执行的方法
	 * @param {Object} [ctx] 方法执行时的this上下文
	 * @param {*} args... 方法参数列表
	 */
	var try2Call = function(func, ctx, args){
		if(null == func || typeof func !== "function")
			return undefined;
		
		try{
			var len = arguments.length;

			if(len === 1)
				return func();
			else if(len === 2)
				return func.call(ctx);
			else if(len === 3)
				return func.call(ctx, arguments[2]);
			else if(len === 4)
				return func.call(ctx, arguments[2], arguments[3]);
			else if(len === 5)
				return func.call(ctx, arguments[2], arguments[3], arguments[4]);
			else if(len === 6)
				return func.call(ctx, arguments[2], arguments[3], arguments[4], arguments[5]);
			else if(len === 7)
				return func.call(ctx, arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
			else{
				var tmp = "", index = 2;
				for(var i = index; i < arguments.length; i++)
					tmp += ",arguments[" + i + "]";

				var rst;
				eval("rst = func.call(ctx" + tmp + ")");
				return rst;
			}
		}catch(e){
			console.error("Error occurred while executing function: " + func.name, e.stack || e);
			console.error(func);
			return undefined;
		}
	};

	/**
	 * 判断给定的字符串是否是空字符串
	 * @param {String} str 要判断的字符串
	 * @param {Boolean} [trim=false] 是否在判断前执行前后空白符号的裁剪操作
	 */
	var isEmptyString = function(str, trim){
		if(arguments.length < 2)
			trim = false;

		if(null === str || undefined === str)
			return true;

		str = String(str);
		if(trim)
			str = str.trim();

		return str.length === 0;
	};

	/**
	 * 判断给定的对象是否是null或undefined
	 */
	var isNullOrUndefined = function(t){
		return null === t || undefined === t;
	};

	/**
	 * 判断给定的两个字符串是否相同
	 * @param {String} a 字符串1
	 * @param {String} b 字符串2
	 * @param {Boolean} [caseSensitive=true] 是否区分大小写
	 * @param {Boolean} [trim=true] 是否在判断前执行前后空白符号的裁剪操作
	 */
	var ifStringEquals = function(a, b, caseSensitive, trim){
		if(arguments.length < 4)
			trim = true;
		if(arguments.length < 3)
			caseSensitive = true;

		if(isNullOrUndefined(a)){
			if(isNullOrUndefined(b))
				return true;
			return false;
		}else{
			if(isNullOrUndefined(b))
				return false;

			if(trim){
				a = String(a).trim();
				b = String(b).trim();
			}
			if(!caseSensitive){
				a = a.toLowerCase();
				b = b.toLowerCase();
			}

			return a === b;
		}
	};

	/**
	 * 以“不区分大小写”的方式判断给定的两个字符串是否相同
	 * @param {String} a 字符串1
	 * @param {String} b 字符串2
	 * @param {Boolean} [trim=true] 是否在判断前执行前后空白符号的裁剪操作
	 */
	var ifStringEqualsIgnoreCase = function(a, b, trim){
		if(arguments.length < 3)
			trim = true;

		return ifStringEquals(a, b, false, trim);
	};

	/**
	 * 生成随机字符串
	 * @param {String} prefix 前缀
	 */
	var randomString = (function(){
		var alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

		return function(prefix){
			if(arguments.length < 1)
				prefix = "";
			
			var len = 10;

			var str = "";
			while(len-- > 0){
				var index = Math.floor(Math.random() * alphabet.length);
				str += alphabet.charAt(index);
			}

			return prefix + str;
		};
	})();

	/**
	 * 为给定的字符串进行URI编码
	 */
	var xEncodeURIComponent = function(t){
		return encodeURIComponent(String(t)).replace(/\+/gm, "%2B");
	};

	/**
	 * 获取唯一字符串
	 */
	var getUniqueString = (function(){
		var i = 0;

		return function(){
			var n = Date.now();
			var s = n.toString(36);
			var p = "00" + (i++).toString(36);
			p = p.substring(p.length - 2);

			return (s + p).toUpperCase();
		};
	})();

	/**
	 * 根据给定的URL获取对应的目录位置
	 * @param {String} url url。/a/abc -> /a/； http://a.com/abc/ -> http://a.com/abc/
	 */
	var getURLFolder = function(url){
		if(/\/$/.test(url))
			return url;

		var r = /(?<!(?:http|https|ftp):\/?)\//gi, tmp, lastMatch = null;
		while((tmp = r.exec(url)) != null)
			lastMatch = tmp;

		if(null == lastMatch){
			if(/^(?:http|https|ftp):/i.test(url))
				return url + "/";
			else
				return "/";
		}

		return url.substring(0, lastMatch.index + 1);
	};

	/**
	 * 获取元素的运行时样式
	 * @param {HTMLElement} obj 要获取样式的元素
	 * @returns {*}
	 */
	var getComputedStyle = function(obj){
		if(window.getComputedStyle){
			return window.getComputedStyle(obj);
		}else{
			return obj.currentStyle;
		}
	};

	/** 设备环境信息组件 */
	var env = (function() {
		var ua = navigator.userAgent;
		var obj = {};

		var refresh = function(){
			ua = navigator.userAgent;

			obj.isUC = /(?:UCWEB|UCBrowser)/.test(ua);
			obj.isSafari = /(?:Safari)/.test(ua);
			obj.isOpera = /(?:Opera Mini)/.test(ua);
			obj.isTencent = /(?:MQQBrowser|QQ|MicroMessenger)/.test(ua);
			obj.isTencentMiniProgram = obj.isTencent && (/(?:miniprogram)/i.test(ua) || window["__wxjs_environment"] === 'miniprogram');

			obj.isIOS = /(?:Mac OS)/.test(ua);
			obj.isAndroid = /(?:Android)/.test(ua);
			obj.isWindowsPhone = /(?:Windows Phone)/.test(ua);

			obj.isIPad = obj.isIOS && /(?:iPad)/.test(ua);
			obj.isIPhone = obj.isIOS && /(?:iPhone)/.test(ua);

			obj.isTablet = /(?:Tablet|PlayBook)/.test(ua) || obj.isIPad;
			obj.isMobile = (/(?:Mobile)/.test(ua) && !obj.isIPad) || obj.isWindowsPhone;
			obj.isPc = !obj.isMobile && !obj.isTablet;

			obj.isHistoryPushPopSupported = ("pushState" in history) && (typeof history.pushState === "function");

			return obj;
		};

		obj.refresh = refresh;

		refresh();
		return obj;
	})();

	/**
	 * 从给定的字符串中解析参数
	 * @param {String} str 形如：a=1&b=2的字符串
	 * @returns {Object}
	 */
	var parseParams = function(str){
		if(isEmptyString(str, true))
			return null;

		var options = null;
		var kvPairs = str.split(/\s*&\s*/);
		if(0 !== kvPairs.length){
			options = {};
			kvPairs.forEach(function(pair){
				var s = pair.split(/\s*=\s*/);
				options[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
			});
		}

		return options;
	};

	/**
	 * 移除焦点
	 */
	var blurInputs = function(){
		var inputObjs = document.querySelectorAll("input, select, textarea, *[contentEditable]");
		for(var i = 0; i < inputObjs.length; i++)
			inputObjs[i].blur();
	};

	/**
	 * 判断给定的对象是否包含指定名称的样式类
	 */
	var hasClass = function(obj, clazz){
		if(isEmptyString(clazz, true))
			return false;

		if(obj.classList && obj.classList.contains)
			return obj.classList.contains(clazz);

		return new RegExp("\\b" + clazz + "\\b", "gim").test(obj.className);
	};

	/**
	 * 为指定的对象添加样式类
	 */
	var addClass = function(obj, clazz){
		if(isEmptyString(clazz, true) || hasClass(obj, clazz))
			return;

		if(obj.classList && obj.classList.add){
			obj.classList.add(clazz);
			return;
		}

		obj.className = (obj.className.trim() + " " + clazz).trim();
	};

	/**
	 * 为指定的对象删除样式类
	 */
	var removeClass = function(obj, clazz){
		if(isEmptyString(clazz, true) || !hasClass(obj, clazz))
			return;

		if(obj.classList && obj.classList.remove){
			obj.classList.remove(clazz);
			return;
		}

		clazz = String(clazz).toLowerCase();
		var arr = obj.className.split(/\s+/), str = "";
		for(var i = 0; i < arr.length; i++){
			var tmp = arr[i];
			if(isEmptyString(tmp, true))
				continue;

			if(tmp.toLowerCase() === clazz)
				continue;

			str += " " + tmp;
		}
		if(str.length > 0)
			str = str.substring(1);
		obj.className = str.trim();
	};

	/**
	 * 为指定的对象切换样式类
	 * @param {HTMLElement} obj DOM元素
	 * @param {String} clazz 样式类名称
	 * @returns {Boolean} 切换后是否含有此样式类
	 */
	var toggleClass = function(obj, clazz){
		if(hasClass(obj, clazz)){
			removeClass(obj, clazz);
			return false;
		}else{
			addClass(obj, clazz);
			return true;
		}
	};

	/**
	 * 判断给定的字符串是否以另外一个字符串开头
	 * @param {String} target 要判断的目标字符串
	 * @param {String} str
	 * @returns {boolean}
	 */
	var startsWith = function(target, str){
		if(null === str || undefined === str)
			return false;

		str = String(str);
		var len = str.length;

		if(this.length < len)
			return false;

		return target.substring(0, len) === str;
	};

	/**
	 * 判断浏览器是否支持Promise
	 * @returns {boolean}
	 */
	var isPromiseSupported = function(){
		return typeof Promise !== 'undefined' && null != Promise && typeof Promise.resolve === "function";
	};

	/**
	 * 合法的内部方法调用器
	 * @param {Function} func 待执行的方法
	 * @param {Object} ctx 方法执行时的this上下文
	 * @param {Arguments} args 方法参数列表对象
	 * @returns {*}
	 */
	var applyInternally = function(func, ctx, args){
		return func.apply(ctx, args);
	};

	/**
	 * 合法的内部方法调用器
	 * @param {Function} func 待执行的方法
	 * @param {Object} [ctx] 方法执行时的this上下文
	 * @param {*} args... 方法参数列表
	 */
	var callInternally = function(func, ctx, args){
		var len = arguments.length;

		if(len === 1)
			return func();
		else if(len === 2)
			return func.call(ctx);
		else if(len === 3)
			return func.call(ctx, arguments[2]);
		else if(len === 4)
			return func.call(ctx, arguments[2], arguments[3]);
		else if(len === 5)
			return func.call(ctx, arguments[2], arguments[3], arguments[4]);
		else if(len === 6)
			return func.call(ctx, arguments[2], arguments[3], arguments[4], arguments[5]);
		else if(len === 7)
			return func.call(ctx, arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
		else{
			var tmp = "", index = 2;
			for(var i = index; i < arguments.length; i++)
				tmp += ",arguments[" + i + "]";

			var rst;
			eval("rst = func.call(ctx" + tmp + ")");
			return rst;
		}
	};

	/**
	 * 将给定的方法标记为“仅插件内部可以合法调用”
	 * @param {Function} fn 待调用的方法
	 * @returns {Function} 包装后的新方法
	 */
	var markAsInternalCallableOnly = function(fn){
		return function(){
			var caller = arguments.callee.caller;
			if(caller !== callInternally && caller !== applyInternally)
				throw new Error("Illegal function call, only internal valid caller is permitted");

			return fn.apply(this, arguments);
		};
	};

	/**
	 * 异步加载文件内容
	 * @param {String} url 目标文件路径
	 * @param {Object} [ops] 控制选项
	 * @param {Function} [ops.onsuccess] 加载成功时要执行的回调方法
	 * @param {Function} [ops.onerror] 加载失败时要执行的回调方法
	 * @param {Function} [ops.oncomplete] 加载完成时要执行的回调方法
	 */
	var getFile = function(url, ops){
		ops = ops || {};

		var xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

		xhr.onreadystatechange = function(){
			if(this.readyState !== 4)
				return;

			ops.oncomplete && ops.oncomplete(this.responseText, this.status);

			if(this.status === 200){
				ops.onsuccess && ops.onsuccess.call(window, this.responseText);
			}else
				ops.onerror && ops.onerror.call(window, this.responseText, this.status);
		};
		xhr.send();
	};


	toolbox.set("util", {
		setDftValue: setDftValue,
		defineReadOnlyProperty: defineReadOnlyProperty,
		try2Apply: try2Apply,
		try2Call: try2Call,
		isEmptyString: isEmptyString,
		isNullOrUndefined: isNullOrUndefined,
		startsWith: startsWith,
		ifStringEquals: ifStringEquals,
		ifStringEqualsIgnoreCase: ifStringEqualsIgnoreCase,
		randomString: randomString,
		xEncodeURIComponent: xEncodeURIComponent,
		getUniqueString: getUniqueString,
		getURLFolder: getURLFolder,
		getComputedStyle: getComputedStyle,
		parseParams: parseParams,
		blurInputs: blurInputs,
		isPromiseSupported: isPromiseSupported,
		getFile: getFile,

		hasClass: hasClass,
		addClass: addClass,
		removeClass: removeClass,
		toggleClass: toggleClass,

		callInternally: callInternally,
		applyInternally: applyInternally,
		markAsInternalCallableOnly: markAsInternalCallableOnly,

		env: env
	});
})