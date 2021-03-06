View(function(toolbox){
	var globalLogger = toolbox.get("Logger").globalLogger;

	var NOT_SUPPLIED = {};

	/**
	 * 视图配置
	 * @param {String} _name 配置项名称
	 * @param {String} viewId 关联的视图编号
	 * @param {String} viewNamespace 视图隶属的命名空间
	 */
	var ViewConfiguration = function ViewConfiguration(_name, viewId, viewNamespace){
		var name = _name,/* 配置项名称 */
			value = NOT_SUPPLIED,/* 配置项取值 */
			application;/* 配置项应用方法 */

		/**
		 * 获取配置项名称
		 */
		this.getName = function(){
			return name;
		};

		/**
		 * 获取配置项取值
		 * @param {*} [dftValue] 配置值没有指定时的默认值
		 */
		this.getValue = function(dftValue){
			if(NOT_SUPPLIED === value){
				if(arguments.length < 1)
					return undefined;

				return dftValue;
			}else
				return value;
		};

		/**
		 * 设置配置项取值
		 * @param {*} _value 要设定的配置项取值
		 * @param {Boolean} [ifOverride=false] 如果已经设置过配置项取值，是否使用新取值覆盖既有取值。如果配置项取值尚未设置过，则无论是否覆盖，均执行赋值动作
		 * @returns {ViewConfiguration}
		 */
		this.setValue = function(_value, ifOverride){
			if(arguments.length < 2)
				ifOverride = false;

			if(ifOverride || NOT_SUPPLIED === value)
				value = _value;

			return this;
		};

		/**
		 * 获取配置的应用方法
		 */
		this.getApplication = function(){
			return application;
		};

		/**
		 * 设置配置的应用方法
		 * @param {Function} _application 应用方法
		 * @returns {ViewConfiguration}
		 */
		this.setApplication = function(_application){
			if(typeof _application != "function"){
				globalLogger.warn("Application action should be of type: 'Function'");
				return this;
			}
			
			application = _application;
			return this;
		};

		/**
		 * 应用配置。其中this指向的上下文为当前的配置项
		 * @returns {ViewConfiguration}
		 */
		this.apply = function(){
			if(typeof application == "function"){
				var v = NOT_SUPPLIED === value? undefined: value;

				try{
					application.call(this, v);
				}catch(e){
					globalLogger.error("Fail to apply configuration: {} = {} for view of id: '{}' namespace: '{}'\n{}", _name, String(v), viewId, viewNamespace, e);
					
					if(e instanceof Error)
						console.error(e, e.stack);
					else
						console.error(e);
				}
			}
			
			return this;
		};

		/**
		 * 将配置以"data-viewconfig_[name]=[value]"的方式附加至视图的DOM元素上
		 * @returns {ViewConfiguration}
		 */
		this.reflectToDom = function(){
			if(null == viewId || "" === viewId.trim())
				return this;

			if(!View.ifExists(viewId, viewNamespace)){
				globalLogger.warn("No view of id '{}' in namespace: '{}' found to reflect config: {}={}", viewId, viewNamespace, this.getName(), this.getValue());
				return this;
			}

			if(typeof this.getValue() === "function" || Array.isArray(this.getValue)){
				globalLogger.warn("Invalid value to reflect to dom:");
				console.warn(this.getValue());
				return this;
			}

			var viewObj = View.ofId(viewId, viewNamespace).getDomElement();
			viewObj.setAttribute("data-viewconfig_" + this.getName(), String(this.getValue()));
			return this;
		};

		Object.freeze(this);
	};

	toolbox.set("ViewConfiguration", ViewConfiguration);
})