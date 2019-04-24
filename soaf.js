/**
 * View Model
 * @param {props} @paramType [object] @Desc SOAF properties
 * 			@param {id} @paramType [string]
 * 								@Desc Area id to bind
 * 			@param {data} @paramType [object or function]
 * 									@Desc The object where the bound elements are stored,
 * 					  							Possible to set initial value of element,
* 					  							Setted to the default value set here when resetting,
 * 					  							The methods in this object refer to the SOAF itself
 * 			@param {exp} @paramType [object or function]
 * 								  @Desc  Expression method object,
 * 					 	         			 The methods in this object refer to the SOAF itself
 * 			@param {handler}  @paramType [object or function]
 * 										 @Desc Event handler object,
 * 						  	             			The methods in this object refer to the SOAF itself
 * 			@param {method}  @paramType [object or function]
 * 										 @Desc Custom method object,
 * 						  				 			The methods in this object refer to the SOAF itself
 * 			@param {bindNm}  @paramType [string]
 * 										 @Desc The name of the attribute to be targeted for the binding
 * 			@param {vBindNm} @paramType [string]
 * 										 @Desc The name of the attribute to be targeted for the view-only binding
 * 			@param {ignoreWatchTagNames}  @paramType [array<string>]
 * 															 @Desc Detect node additions and deletions
 * 			
 * 			Page hook eventListerners, It is called in the following order
 * 			@param {pageLoading} @paramType [function] 
 * 											  @Desc document loading eventListener
 * 			@param {contentLoadedBefore} @paramType [function] 
 * 														  @Desc document DOMContentLoaded eventListener
 * 			@param {contentLoaded} @paramType [function] 
 * 												  @Desc document.readystatechange.interactive eventListener
 * 			@param {pageLoadedBefore} @paramType [function] 
 * 													   @Desc document.readystatechange.complete eventListener
 * 			@param {pageLoaded} @paramType [function] 
 * 											  @Desc window.load eventListener
 * 			@param {pageUnLoadBefore} @paramType [function] 
 * 													   @Desc window.beforeunload eventListener
 * 			@param {pageUnLoad} @paramType [function] 
 * 											  @Desc window.unload eventListener
 * 
 * @deafultMethod
 * 			@method {getData} @paramType [undefined or string or array],
 * 										  Returns data that matches the name passed as an argument,
 *										  Return all data if no arguments
 * 			@method {setData} @paramType [object],
 * 										  Set binding data
 * 			@method {clear} @paramType [undefined],
 * 									  Empty the value of all elements
 * 			@method {reset} @paramType [undefined],
 * 									  Initialize all element values
 * 
 * 개선점 : 전역 공통함수들의 편의성 개선, component별 데이터를 공유할 수 있는 방법
 * 
 * 
 */
function SOAF(props){

	if(!(this instanceof SOAF))
		throw 'SOAF: The "new" operator was not declared';
	
	 if(props == undefined || props.id == undefined)
		 throw 'SOAF: "id" is required';
	
	this.props = props;
	
	this.id = this.props.id;
	this.self = document.getElementById(this.props.id)
	this.callee = {};
	
	if(this.self == undefined)
		throw 'SOAF: Could not find the element that corresponds to id in the document: "' + this.id + '"';
	
	delete this.props.id;
	
	//Add page hook eventHandler & trigger
	new HookComponent(this).init();
	//Set binding
	new BindingComponent(this).init()
											 .setCallee(this.callee);
	//Restrict property of this(SOAF)  
	new RestrictProperty(this).notUpdate(['id'])
										 .freeze([this.callee])
										 .notAccess(['$data', 'events'])
	
	return this.callee;
	
}

/**
 * @param {_} @paramType [object] @Desc The object to which the hook component applies
 *  		@prop {id} @paramType [string] @Desc self id
 * 			@prop {props} @paramType [object] @Desc page hook eventListeners
 */
function HookComponent(_){
	
	this.caller = _;
	this.id = _.id;
	this.self = _.self;
	
	this.hookEvents = {}; //assign custom events
	this.state = _.state = {}; //page hook event state data that can be called from the parent component : can be setting  between page hook eventListeners
	this.eventListeners = _.props;
	
	this.evtNmLst = ['pageLoading', 'contentLoadedBefore', 'contentLoaded', 'pageLoadedBefore', 'pageLoaded', 'pageUnLoadBefore', 'pageUnLoad'];
	
	this.init = function(){
		//hooking
		this.createPageHookEvent(); //create custom page event 
		this.createPageHookEventListener(); //create custom page eventListener
		this.createDomLifeCycleEventListener(); //create dom life cycle eventListener settings that trigger custom page event
		
	},
		
	this.createPageHookEvent = function(__param){
		for(var i=0, evtNm; evtNm=this.evtNmLst[i]; i++){
			this.hookEvents[evtNm] = new CustomEvent(evtNm);
		}
	},
		
	this.createPageHookEventListener = function(){
		for(var evtNm in this.hookEvents){
			if(this.eventListeners[evtNm] != undefined)
				this.addHookEventListener(this.eventListeners[evtNm], evtNm);
		}
	},
		
	this.addHookEventListener = function(eventListener, evtNm){
		this.self.addEventListener(evtNm, function(event){
			var stateData = { event : event, data : this.state };
			var tempStateData = eventListener(stateData);
			for(var key in tempStateData)
				this.state[key] = tempStateData[key];
		}.bind(this));
	},
		
	this.createDomLifeCycleEventListener = function(){

		for(var i=0, evtNm; evtNm=this.evtNmLst[i]; i++){
			switch(evtNm){
				case 'loading' : 
					this.self.dispatchEvent(this.hookEvents.pageLoading);
					break;
					
				case 'DOMContentLoaded' : 
					document.addEventListener(evtNm, function(event) {
					  	this.self.dispatchEvent(this.hookEvents.contentLoaded);
						  	
					  	document.removeEventListener(evtNm, arguments.calle);
					}.bind(this));
					break;
					
				case 'readystatechange' : 
					document.addEventListener(evtNm, function(e){
						if( document.readyState === 'interactive' ) this.self.dispatchEvent(this.hookEvents.contentLoadedBefore);
						if( document.readyState === 'complete' ) this.self.dispatchEvent(this.hookEvents.pageLoadedBefore);
						
						document.removeEventListener(evtNm, arguments.calle);
					}.bind(this));
					break;
					
				case 'load' : 
					window.addEventListener(evtNm, function(e){
						this.self.dispatchEvent(this.hookEvents.pageLoaded);
						
						window.removeEventListener(evtNm, arguments.calle);
					}.bind(this));
					break;
					
				case 'beforeunload' : 
					window.addEventListener(evtNm, function(event) {
						this.self.dispatchEvent(this.hookEvents.pageUnLoadBefore);
							
						window.removeEventListener(evtNm, arguments.calle);
					}.bind(this));
					break;
					
				case 'unload' : 
					window.addEventListener(evtNm, function(event) {
						this.self.dispatchEvent(this.hookEvents.pageUnLoad);
						
						window.removeEventListener(evtNm, arguments.calle);
					}.bind(this));
					break;
			}
		}
		
	}
};

/**
 * @param {_} @paramType [object] @Desc The object to which the binding component applies, Caller object of a BindingComponent
 *  		@prop {id} @paramType [string] @Desc self id
 * 			@prop {data} @paramType [object] @Desc The object to assign the data
 * @param {param} @paramType [object] @Desc Selective parameter
 * 			@param {bindNm} @paramType [string] @Desc The name of the attribute to be targeted for the binding
 * 			@param {vBindNm} @paramType [string] @Desc The name of the attribute to be targeted for the view-only binding
 * 			@param {ignoreWatchTagNames} @paramType [array<string>] @Desc Detect node additions and deletions
 */
function BindingComponent(_, param){
	 
	//init BindingComponent this
	this.constructor = function(__, param){
		
		this.bindElements = {};
		this.vBindElements = {};
		this.resetData = {};
		
		this.caller = __;
		this.callee = __.callee; //Assign new objects for later use as callees
		this.id = __.id;
		this.self = __.self;
		
		//prop's methods convert to object
		var getProp = function(propNm){
			var prop = this.caller.props[propNm] == undefined 
							  ? {} 
							  : typeof this.caller.props[propNm] == 'function' 
							      ? this.caller.props[propNm].call(this.caller) 
							      : this.caller.props[propNm];
			return prop||{};
		}.bind(this);
		
		this.$data = {};
		this.data = __.data = getProp('data');
		this.exp = getProp('exp');
		this.handler = getProp('handler');
		this.method = getProp('method');
		
		param = param !=undefined 
					   ? param 
					   : {};
		this.bindNm = param.bindNm||'bind'; //bind target element property name
		this.vBindNm = param.vBindNm||'v-bind'; //view-only bind target element property name
		this.ignoreWatchTagNames = param.ignoreWatchTagNames||['OPTION']; //tag names that DOMObserver ignore
		
	}.apply(this, [_, param]);
	
	this.setCallee = function(callee){
		callee.$ = {};
		this.setDefaultMethods(callee.$);
		this.setCustomMethods(callee.$);
	};
	
	//initialize binding component
	this.init = function(){
		this.refreshBindingElements();
		
		this.initBindElements();

		this.initBindObject();
		
		this.createDOMObserver();
		
		this.initEventHandler();
		this.initMethods();
		
		//setting init data to form
		this.caller.reset(); 
		
		return this;
	};
	
	/**
	 * refresh propertiy list : this.bindingElements and this.vBindElements
	 */
	this.refreshBindingElements = function(){
		this.initBindingElements();
		this.setBindingElements();
		this.initVBindingElements();
		this.setVBindingElements();
	};
		
	this.initBindingElements = function(){
		this.foreachBindingElements(this.bindNm, function(el){
			if(el.hasAttribute(this.bindNm) && el.getAttribute(this.bindNm) == '' && el.id != undefined)
				el.setAttribute(this.bindNm, el.id);
			
			el.$value = '';
			var key = el.getAttribute(this.bindNm);
			this.bindElements[key] = [];
			
		}.bind(this));
	};
		
	this.setBindingElements = function(){
		this.foreachBindingElements(this.bindNm, function(el){
			var key = el.getAttribute(this.bindNm);
			this.bindElements[key].push(el);
		}.bind(this));
	};
		
	this.initVBindingElements = function(){
		this.foreachBindingElements(this.vBindNm, function(el){
			if(el.hasAttribute(this.bindNm))
				return;
			
			if(el.hasAttribute(this.vBindNm) && el.getAttribute(this.vBindNm) == '' && el.id != undefined)
				el.setAttribute(this.vBindNm, el.id);
			
			el.$value = '';
			
			var key = el.getAttribute(this.vBindNm);
			this.vBindElements[key] = [];
		}.bind(this));
	};
		
	this.setVBindingElements = function(){
		this.foreachBindingElements(this.vBindNm, function(el){
			if(el.hasAttribute(this.bindNm))
				return;
			
			var key = el.getAttribute(this.vBindNm);
			this.vBindElements[key].push(el);
		}.bind(this));
	};
		
	this.foreachBindingElements = function(propertyNm, callBack){
		var elements = document.getElementById(this.id).querySelectorAll('['+propertyNm+']');
		for(var i=0, el; el=elements[i]; i++){
			callBack(el);
		}
	};
	
	/**
	 * setting input event listeners for this.bindElements and this.vBindElements and define its properties
	 */
	this.initBindElements = function(){
		var bindElements = this.bindElements;
		for(var arr in bindElements){
			for(var i=0, el; el=bindElements[arr][i]; i++){
				el.removeEventListener('focusin', this.editBeginEventListener);
				el.addEventListener('focusin', this.editBeginEventListener);
				
				el.removeEventListener('input', this.editEventListener);
				el.addEventListener('input', this.editEventListener);
				
				el.removeEventListener('focusout', this.editEndEventListener);
				el.addEventListener('focusout', this.editEndEventListener);
			}
		}
	};
	
	this.editBeginEventListener = function(event){
		var el = event.target;
		
	   	//set origin value to input
		el.value = el.$value;
	}.bind(this)
	
	this.editEventListener = function(event){
		var el = event.target;
		
		//assign origin value
	   	var value = el.$value = el.value;
	   	
   		var key = el.getAttribute(this.bindNm);
	   	if(el.type === 'checkbox' && !el.checked)
	   		value = '';
	   	
	   	//set origin value to proxyDataObject
	   	this.data[key] = value;
	}.bind(this)
		
	this.editEndEventListener = function(event, el){
		var el = event.target;
		var key = el.getAttribute(this.bindNm);
		
	   	//set origin value to proxyDataObject
		this.data[key] = el.value;
	}.bind(this);
	
	/**
	 *  binding this.bindingElements and this.vBindingElements to Object 
     */
	this.initBindObject = function(){
		var bindElements = this.bindElements;
		
		var keyObject = {};
		Object.assign(keyObject, this.bindElements);
		Object.assign(keyObject, this.vBindElements);
		
		for(var key in keyObject){
			this.data[key] = this.data[key]||'';
		}
		for(var key in this.data){
			this.$data['_$'+key] = this.data[key]||'';
			this.resetData[key] = this.data[key]||'';
		}
		
		this.defineBindObjectProperties();
	};
	
	this.defineBindObjectProperties = function(){
		for(var key in this.data){
			this.defineBindProperty(key);
		}
	};
	
	this.defineBindProperty = function(key){
		Object.defineProperty(this.data, key, {
	    	enumerable: true,
			get: function(){
	    		return this.$data['_$'+key];
	    	}.bind(this),
  			set: function(v) {
  				//입력받은 값을 바인딩 데이터 Object에 매핑
  				this.$data['_$'+key] = v;
  				
  				//바인딩 데이터 Object에 세팅된 입력값을 dom element에 매핑
  				this.setValueBindElement(this.bindElements, key);
  				this.setValueBindElement(this.vBindElements, key);
  			}.bind(this)
		});
	}.bind(this);
	
	this.setValueBindElement = function(targetElements, key){
		if(targetElements[key] == undefined)
			return false;
		
		for(var i=0, el; el=targetElements[key][i]; i++){

			var v = this.data[key];
			
			el.$value = v;
			
			//현재 요소에 표현속성이 있다면, 속성값 = 함수명인 표현식을 호출하여 값 세팅
			if(el.hasAttribute('exp'))
				v = this.callExp(el, v);
			
			switch (el.tagName){
			case 'INPUT': case 'SELECT': case 'TEXTAREA':
				if(el.type === 'radio' || el.type === 'checkbox')
					el.value == v 
					  ? el.checked = true 
					  : el.checked = false;
				else{
					el.value = v;
				}
				break;
			default:
				el.innerHTML = v;
				break;
			}
		}
	};
	
	this.callExp = function(el, v){
		var expNm = el.getAttribute('exp');

		if(expNm == undefined)
			this.throwException('Specify attributes correctly : exp', el);
		
		if(this.exp[expNm] == undefined)
			this.throwException(expNm + ' is not define exp handler in BindingComponent', el);

		if(this.exp[expNm] != undefined)
			v = this.callFunction(this.exp[expNm], [v])||'';
		
		return v;
	};
	
	/**
	 * create observer for detect node insert and node remove
	 */
	this.createDOMObserver = function(){
		this.self.addEventListener('DOMNodeInserted', function(event){
			this.domNodeDetectHandler(event, this.addBindNodeEventListener);
		}.bind(this));
		
        this.self.addEventListener('DOMNodeRemoved', function(event){
        	this.domNodeDetectHandler(event, this.removeBindNodeEventListener);
        }.bind(this));
	};
	
	this.domNodeDetectHandler = function(event, callBack){
		var ignoreWatchTagNames = this.ignoreWatchTagNames;
		for(var i=0, tagNm; tagNm=ignoreWatchTagNames[i]; i++){
			if(event.target.tagName == undefined || event.target.tagName === tagNm) 
				return false;
		}

		this.refreshBindingElements();
		this.initEventHandler();
		
		callBack(event);
		
		this.caller.reset();
	};
	
	//테스트 필요
	this.addBindNodeEventListener = function(event){
		var addData = this.searchBindNodes(event.target);
		
		if(addData != undefined){
			for(var key in addData){
				//data객체에 존재하지 않는 key라면 생성 
				if(!this.data.hasOwnProperty(key)){
					this.data[key] = '';
					this.$data['_$'+key] = '';
					this.resetData[key] = '';
					this.defineBindProperty(this, key);
				}
			}
		}
	};
	
	//테스트 필요
	this.removeBindNodeEventListener = function(event){
		var removeData = this.searchBindNodes(event.target);
		
		for(var key in removeData){
			//key를 가진 bind elements가 더이상 없다면 data객체에서 삭제 
			if(!this.bindElements.hasOwnProperty(key) && !this.vBindElements.hasOwnProperty(key)){
				delete this.data[key];
				delete this.$data['_$'+key];
				delete this.resetData[key];
			}
		}
		
	};
	
	this.searchBindNodes = function(parentNode){
		var newData = {};
		this.dfsSearchNodes(parentNode, function(node){
			if(typeof node.getAttribute === 'function'){
				var bindNm = node.getAttribute(this.bindNm);
				var vBindNm = node.getAttribute(this.vBindNm);
				var key = bindNm != undefined 
							     ? bindNm 
							     : vBindNm;
	
				if(key != undefined)
					newData[key] = node;
				
			}
		}.bind(this));
		
		return Object.keys(newData).length > 0  
				    ? newData 
				    : null;
	};
	
	this.dfsSearchNodes = function(parentNode, callBack){
		for(var i=0, node; node=parentNode.childNodes[i]; i++){
			callBack(node);
			this.dfsSearchNodes(node, callBack);
		}	
	};
	
	/**
	 * setting custom eventHandlers
	 */
	this.initEventHandler = function(el){
		this.dfsSearchNodes(this.self, function(el){
			if(el.attributes == undefined) 
				return false;
			
			var attributes = el.attributes;
			for(var i=0, attr; attr=attributes[i]; i++){
				if(!!attr.localName.match(/^\@.*$/)){
					
					if(this.handler[attr.value] == undefined) 
						this.throwException(attr.value + ' is not define event handler in BindingComponent', el);
						
					var eventNm = attr.localName.replace('@', '');
					var handlerNm = attr.value;
					
					var handler = function(event){
						this.callFunction(this.handler[handlerNm], [event]);
					}.bind(this);
					
					el.removeEventListener(eventNm, handler);
					el.addEventListener(eventNm, handler);
				}
			}
		}.bind(this));
	};
	
	this.callFunction = function(func, param, target){
		return func.apply(this.caller, param);
	};
	
	/**
	 * setting custom methods
	 */
	this.initMethods = function(){
		this.setDefaultMethods(this.caller);
		this.setCustomMethods(this.caller);
	};
	
	this.setDefaultMethods = function(target){
		//바인딩 Object의 요소들을 새 object에 담아 반환
		target.getData = function(keys){
			var obj = {};
			if(typeof keys === 'string'){
				obj[keys] = this.data[keys];
			}
			else if(typeof keys === 'object' && Array.isArray(keys)){
				for(var i in keys)
					obj[keys[i]] = this.data[keys[i]];
			}
			else{
				for(var key in this.data) 
					obj[key] = this.data[key];
			}
			return obj;
		}.bind(target);
			
		//바인딩 Object에 값 세팅
		target.setData = function(newData){
			for(var key in newData)
				this.data[key] = newData[key];
		}.bind(this);
		
		//바인딩 Object 초기화
		target.clear = function(){
			for(var key in this.data)
				this.data[key] = '';
		}.bind(target);
			
		target.reset = function(){
			for(var key in this.resetData)
				this.data[key] = this.resetData[key];
		}.bind(this);
	};
	
	this.setCustomMethods = function(target){
		for(var methodNm in this.method){
			target[methodNm] == undefined 
			  ? target[methodNm] = this.method[methodNm].bind(this.callee) 
			  : this.throwException('already exists the same method name : ' + methodNm);
		}
	};
	
	this.throwException = function(msg, object){
		if(object != undefined) console.log(object);
		throw 'SOAF(' + this.id + '): ' + msg;
	};
	
	this.deduplicate = function(object){
		if(typeof object === 'object'){
			//array
			if(Array.isArray(object)){ 
				return object.filter(function(el, idx, array){
					return array.indexOf(el) === idx ;
				});
			}
			// object
			else{ 
				var newObject = {};
				for(var key in object){
					if(newObject.hasOwnProperty(key) === false)
						newObject[key] = object[key];
				}
				return newObject;
			}
		}
	};
	
}

function RestrictProperty(_){
	
	if(!(this instanceof RestrictProperty))
		throw 'RestrictProperty: The "new" operator was not declared';
	
	this.caller = _;
	
	this.notAccess = function(restrictionPropertyNames){
		this.definePropertiesRestriction(restrictionPropertyNames, {
			enumerable: false,
			get: function(){}
		});
		return this;
	};
	
	this.notUpdate = function(restrictionPropertyNames){
		this.definePropertiesRestriction(restrictionPropertyNames, {
			writable: false,
			configurable: false
		});
		return this;
	};
	
	this.freeze = function(restrictionObjects){
		for(var i=0, obj; obj=restrictionObjects[i]; i++){
			Object.freeze(obj);
		}
		return this;
	}
	
 	this.definePropertyRestriction = function(propNm, props){
		Object.defineProperty(this.caller, propNm, props);
	};
	
 	this.definePropertiesRestriction = function(propNms, props){
		for(var i=0, propNm; propNm=propNms[i]; i++){
			Object.defineProperty(this.caller, propNm, props);
		}
	};
	
}

(function pollyfill(){
	
	//Object.assign
	if (typeof Object.assign != 'function') {
		  // Must be writable: true, enumerable: false, configurable: true
		  Object.defineProperty(Object, "assign", {
		    value: function assign(target, varArgs) { // .length of function is 2
		      'use strict';
		      if (target == null) { // TypeError if undefined or null
		        throw new TypeError('Cannot convert undefined or null to object');
		      }

		      var to = Object(target);

		      for (var index = 1; index < arguments.length; index++) {
		        var nextSource = arguments[index];

		        if (nextSource != null) { // Skip over if undefined or null
		          for (var nextKey in nextSource) {
		            // Avoid bugs when hasOwnProperty is shadowed
		            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
		              to[nextKey] = nextSource[nextKey];
		            }
		          }
		        }
		      }
		      return to;
		    },
		    writable: true,
		    configurable: true
		  });
		}
	
	//CustomEvent
	 if ( typeof window.CustomEvent != "function" ){
		 function CustomEvent ( event, params ) {
			 
	    	params = params || { bubbles: false, cancelable: false, detail: null };
	    	var evt = document.createEvent( 'CustomEvent' );
	    	evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
	    	return evt;
	   }

	  	CustomEvent.prototype = window.Event.prototype;
	  	window.CustomEvent = CustomEvent;
	 }
	  
}());
