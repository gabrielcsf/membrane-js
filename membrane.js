var DoubleWeakMap = function() {
  this.map = new WeakMap();
  this.a = [];
  this.b = [];
};

DoubleWeakMap.prototype = {
  get: function(obj) {
    var wo = this.map.get(obj);
    if (wo)
      return wo;
    for (var i = 0; i < this.a.length; i++) {
      if (obj === this.a[i])
        return this.b[i];
    }
    return undefined;
  },
  set: function(obj, val) {
    try {
      return this.map.set(obj, val);
    } catch(e) {
      console.log("DoubleWeakMap set catch: " + e);
      for (var i = 0; i < this.a.length; i++) {
        if (obj === this.a[i]) {
          this.b[i] = val;
          return this;
        }
      }
      this.a.push(obj);
      this.b.push(val);
      return this;
    }
  },
  has: function(obj) {
    return this.map.has(obj) || this.a.filter(function(o) { return o === obj; }).length > 0;
  },
  getOrCreate: function(obj, def) {
    var result = this.get(obj);
    if (result === undefined) {
      this.set(obj, def);
      return def;
    }
    return result;
  }
};

// used to handle special cases of get trap
var whitelist =  {
    // WeakMap: { // ES-Harmony proposal as currently implemented by FF6.0a1
    //   prototype: {              
    //     //'delete': t
    //   }
    // },      
    Object: {           
      prototype: {              
        __defineGetter__: false,
        __defineSetter__: false,
        __lookupGetter__: false,
        __lookupSetter__: false,

        toString: true, 
        valueOf: false,
        hasOwnProperty: true,
        isPrototypeOf: true,
        propertyIsEnumerable: true
      },            
      getPrototypeOf: true,
      getOwnPropertyDescriptor: true,
      getOwnPropertyNames: true,
      create: true,
      defineProperty: true,
      defineProperties: true,
      seal: true,
      freeze: false,
      preventExtensions: false,
      isSealed: true,
      isFrozen: false,
      isExtensible: false,
      keys: true
    },

    Array: {
      prototype: {
        concat: true,
        join: true,
        pop: true,
        push: true,
        reverse: true,
        shift: true,
        slice: true,
        sort: true,
        splice: true,
        unshift: true,
        indexOf: true,
        lastIndexOf: true,
        every: true,
        some: true,
        forEach: true,
        map: true,
        filter: true,
        reduce: true,
        reduceRight: true,
      },
      isArray:true
    },
    String: {
      prototype: { // these String prototype functions when called on dry objectrue, toString() is implicitly called on the dry objectrue, which is already handled.
        substr: true, // ES5 Appendix B
        anchor: true, // Harmless whatwg
        big: true, // Harmless whatwg
        blink: true, // Harmless whatwg
        bold: true, // Harmless whatwg
        fixed: true, // Harmless whatwg
        fontcolor: true, // Harmless whatwg
        fontsize: true, // Harmless whatwg
        italics: true, // Harmless whatwg
        link: true, // Harmless whatwg
        small: true, // Harmless whatwg
        strike: true, // Harmless whatwg
        sub: true, // Harmless whatwg
        sup: true, // Harmless whatwg
        trimLeft: true, // non-standard
        trimRight: true, // non-standard
        valueOf: true,
        charAt: true,
        charCodeAt: true,
        concat: true,
        indexOf: true,
        lastIndexOf: true,
        localeCompare: true,
        match: true,
        replace: true,
        search: true,
        slice: true,
        split: true,
        substring: true,
        startsWith: true,
        endsWith: true,
        toLowerCase: true,
        toLocaleLowerCase: true,
        toUpperCase: true,
        toLocaleUpperCase: true,
        trim: true,
      },
      fromCharCode: true
    },
    Boolean: {
      prototype: { // these function prototype when called on dry object does not automatically call valueOf or toString of dry object
        valueOf: false
      }
    },
    Number: {
      prototype: {
        valueOf: false,
        toFixed: false,
        toExponential: false,
        toPrecision: false
      },
    },
    Math: {
      abs: true,
      acos: true,
      asin: true,
      atan: true,
      atan2: true,
      ceil: true,
      cos: true,
      exp: true,
      floor: true,
      log: true,
      max: true,
      min: true,
      pow: true,
      random: true, // questionable
      round: true,
      sin: true,
      sqrt: true,
      tan: true
    },
    Date: { // no-arg Date constructor is questionable
      prototype: {
        // Note: coordinate this list with maintanence of repairES5.js
        getYear: true, // ES5 Appendix B
        setYear: true, // ES5 Appendix B
        toGMTString: true, // ES5 Appendix B2dsd
        toDateString: true,
        toTimeString: true,
        toLocaleString: true,
        toLocaleDateString: true,
        toLocaleTimeString: true,
        valueOf: true,
        getTime: true,
        getFullYear: true,
        getUTCFullYear: true,
        getMonth: true,
        getUTCMonth: true,
        getDate: true,
        getUTCDate: true,
        getDay: true,
        getUTCDay: true,
        getHours: true,
        getUTCHours: true,
        getMinutes: true,
        getUTCMinutes: true,
        getSeconds: true,
        getUTCSeconds: true,
        getMilliseconds: true,
        getUTCMilliseconds: true,
        getTimezoneOffset: true,
        setTime: true,
        setFullYear: true,
        setUTCFullYear: true,
        setMonth: true,
        setUTCMonth: true,
        setDate: true,
        setUTCDate: true,
        setHours: true,
        setUTCHours: true,
        setMinutes: true,
        setUTCMinutes: true,
        setSeconds: true,
        setUTCSeconds: true,
        setMilliseconds: true,
        setUTCMilliseconds: true,
        toUTCString: true,
        toISOString: true,
        toJSON: true
      },
      parse: true,
      UTC: true,
    },
    JSON: {
      parse: true,
      stringify: true
    },        
    Function:{
      prototype:{
        // toString:true,
        call:true,
        apply:true,
        bind:true
      }
    }         
};

// used to handle special cases of apply trap
var specialFunctions = [  
    clearInterval,  
    clearTimeout,
    setTimeout,
    setInterval,
    eval,
    Object,
    Function,
    Array,
    String, 
    Number,
    Boolean,
    RegExp,
    Date,
    Error,
    Uint32Array,
    Symbol, 
    Promise,
    Promise.resolve,
    Function.prototype.toString,        
];

var mapUnwrapped2Wrapped = new DoubleWeakMap(); // store map from original objects to wrapped ones
var mapWrapped2Unwrapped = new DoubleWeakMap(); // store map from wrapped objects to original ones

var membrane = {};
membrane.create = function(){};
membrane.debug = true;
membrane.context = [];
membrane.whiteList = new WeakMap();
membrane.nativePrototypes = new WeakMap();
membrane.functionCalls = new Map(); 

membrane.setupWhiteList = function() {
  //We whitelist only built-in prototype functions and some built-in functions from 'window'
  var whiteListedObject; 
  Object.keys(whitelist).forEach(function(e1) {       
    whiteListedObject = eval(e1);     
    if (typeof whitelist[e1] === "object") {
      Object.keys(whitelist[e1]).forEach(function(e2) {
        try {
          whiteListedObject = eval(e1 + "." + e2);
        }
        catch(ex) { console.log("setupWhiteList catch(ex): " + e1 + " " + e2); }
        if (e2 !== "prototype") {
          if (whitelist[e1][e2]) {               
            try {
              membrane.whiteList.set(whiteListedObject, {});
            } catch(ee) { console.log("setupWhiteList catch(ee1): " + e1 + " " + e2); }
          }             
        }           
        if (typeof whitelist[e1][e2] === "object") {
          Object.keys(whitelist[e1][e2]).forEach(function(e3) {               
            whiteListedObject = eval(e1 + "." + e2 + "." + e3);
            if (whitelist[e1][e2][e3]) {                 
              try {
                membrane.whiteList.set(whiteListedObject, {});
              } catch(ee) { console.log("setupWhiteList catch(ee2): " + e1 + " " + e2 + " " + e3); }
            }
          });
        }
      });
    }     
  }); 
}
membrane.setupWhiteList();

membrane.setupNativePrototypes = function() {
  ["Function", "Object", "Array", "String", "Number", "Boolean", "RegExp", "Error"].forEach(function(elem) {        
    var wrappedElem = membrane.create(elem);

    if (elem.prototype != undefined) {
      if (!membrane.isWrapped(elem.prototype.constructor)) {        
        elem.prototype.constructor = wrappedElem;
      }      
      membrane.nativePrototypes.set(elem.prototype, {});
    }
  });
}
membrane.setupNativePrototypes();
 
// checks if an object is a primitive or not
// should be private (public now for testing purposes)
membrane.isPrimitive = function(obj) {
  return Object(obj) !== obj;
}

// checks if an object is wrapped with a proxy or not
// should be private (public now for testing purposes)
membrane.isWrapped = function(obj) {
  return mapWrapped2Unwrapped.has(obj);
}

// process object values: return unwrapped primitives, native function references, and unwrapped objects when necessary
membrane.processObjectValue = function(obj) {

  if (membrane.isPrimitive(obj)) return obj; 

  if (membrane.whiteList.has(obj)){
    if (membrane.debug) { console.log("[DEBUG] Returning object from whitelist"); }            
    return obj;
  }

  // special objects/functions should not be wrapped (get trap will throw TypeError in these cases)
  var specialFunction = undefined;
  specialFunctions.forEach(function(elem) {
    if (elem == obj) {
      specialFunction = obj;
    }
  });
  if (specialFunction) {
    if (membrane.debug) console.log("[DEBUG] Returning unwrapped special function: " + specialFunction);
    return specialFunction;
  }

  var unwrappedObj = mapWrapped2Unwrapped.get(obj);
  if (unwrappedObj) { // original object is wrapped            
    if (!membrane.nativePrototypes.has(unwrappedObj)) { // prototypes should always be wrapped
      return unwrappedObj;
    }
  }
  return undefined;
}

// used when getOwnPropertyDescriptor trap is triggered
membrane.sync = function(obj, objCopy, property) {
try {
    var objDesc = Object.getOwnPropertyDescriptor(obj, property);
    var objCopyDesc = Object.getOwnPropertyDescriptor(objCopy, property);
    if (!objCopyDesc && objCopyDesc.configurable) {           
      if (objDesc.get || objDesc.set) {
        Object.defineProperty(objCopy, property, {configurable:true, get:(objDesc.get ? Function.prototype.bind.call(objDesc.get,obj) : undefined), set:(objDesc.set ? Function.prototype.bind.call(objDesc.set,obj) : undefined), enumerable:objDesc.enumerable});
      } else {
        Object.defineProperty(objCopy, property, {configurable:true, writable:true, value:objDesc.value, enumerable:objDesc.enumerable});
      }
    } else {
      objCopy[n] = obj[n]; // TODO: check this, it was obj[e]
    }
  }
  catch(e) { // if there is a typeError here, it is possible that we are dealing with some built-in object, try to sync all properties
    var objProps = Object.getOwnPropertyNames(obj);
    objProps.forEach(function(e) {
      var objDesc = Object.getOwnPropertyDescriptor(obj,e);
      var objCopyDesc = Object.getOwnPropertyDescriptor(objCopy, e);
      if (!objCopyDesc && objCopyDesc.configurable) {           
        if (objDesc.get || objDesc.set) {
          Object.defineProperty(objCopy, e, {configurable:true, get:(objDesc.get ? Function.prototype.bind.call(objDesc.get,obj) : undefined), set:(objDesc.set ? Function.prototype.bind.call(objDesc.set,obj) : undefined), enumerable:objDesc.enumerable});
        } else {
          Object.defineProperty(objCopy, e, {configurable:true, writable:true, value:objDesc.value, enumerable:objDesc.enumerable});
        }
      }
      else {
        objCopy[e] = obj[e];
      }
    });
  }
}


membrane.getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
membrane.defineProperty = Object.defineProperty;

membrane.isEmptyObject = function(obj){
    return typeof obj === "Object" && Object.keys(obj).length === 0;
};

membrane.create = function(initTarget, moduleName) {

  function contextifyFunctioncall(functionCall, context) {
    return functionCall + "@" + context;
  } 

  if (membrane.isWrapped(initTarget)) {
    return initTarget;
  }

  var wrap = function(obj, objectName) {
  
    if (membrane.isPrimitive(obj)) return obj; // primitives are passed through

    // TODO: handle special functions, native objects
    // var objectToBeWrapped = obj;
    // handleSpecialCases(objectToBeWrapped);

    var objectToWrap = obj; //shadow object used as the target object for an object
    // var objProto = obj.__proto__;

    // if (typeof obj === "object") {
    //   console.log(">>> setting prototype: object is an object");           
    //   objectToWrap.__proto__ = objProto ? mapWrapped2Unwrapped.get(objProto) : objProto;          
    // }
    // else if (typeof obj === "function") {
    //     console.log(">>> setting prototype: object is a function");
    //     objectToWrap.prototype = obj.prototype;
    //     if (objectToWrap.prototype) {
    //       objectToWrap.prototype = mapWrapped2Unwrapped.get(objectToWrap.prototype);            
    //     }   
    //     objectToWrap.__proto__ = objProto ? mapWrapped2Unwrapped.get(objProto) : objProto;        
    // }
    // else {
    //   console.log('[ERROR]!!! object is weird, typeof is weird ' + typeof(obj) + "\n");
    // }

    // // In fact , Proxy does not automatically forward these operations when used directly
    // // like 'proxy.valueOf()', but it does automatically forward these operations when used implicitly (coercion)
    // // like 'proxy == true', so we have to declare those opeations on shadow object
    // var objDesc = Object.getOwnPropertyDescriptor(obj, "toString");
    // if (!objDesc) {
    //   objDesc = { enumerable:false };
    // }

    // Object.defineProperty(objectToWrap, "toString", {
    //   enumerable: objDesc.enumerable,
    //   configurable: true,
    //   writable: true,
    //   value: function() {
    //     return obj.toString();
    //   }
    // });

    // // have to define this because firefox Proxy will call valueOf of objectToWrap,
    // // which trigger a lot of calls through objectToWrap.__proto__ which is a proxy.
    // objDesc = Object.getOwnPropertyDescriptor(obj, "valueOf");
    // if (!objDesc) {
    //   objDesc = { enumerable:false };
    // }

    // Object.defineProperty(objectToWrap, "valueOf", {
    //   enumerable: objDesc.enumerable,
    //   configurable: true,
    //   writable: true,
    //   value: function() {    
    //     return obj.valueOf();
    //   }
    // });      

    var wrappedTarget = new Proxy(objectToWrap, {
      // list of traps
      // extracted from: http://www.ecma-international.org/ecma-262/6.0/#sec-proxy-object-internal-methods-and-internal-slots
      getPrototypeOf: function(target) {
        if (membrane.debug) console.log("[DEBUG] trap: getPrototypeOf");
        return Reflect.getPrototypeOf(target);
      },
      setPrototypeOf: function(target, prototype) {
        if (membrane.debug) console.log("[DEBUG] trap: setPrototypeOf");
        return Reflect.setPrototypeOf(target, prototype);
      },
      isExtensible: function(target) {
        if (membrane.debug) console.log("[DEBUG] trap: isExtensible");
        return Reflect.isExtensible(target);
      },
      preventExtensions: function(target) {
        if (membrane.debug) console.log("[DEBUG] trap: preventExtensions");
        return Reflect.preventExtensions(target);
      },
      getOwnPropertyDescriptor: function(target, prop) {
        if (membrane.debug) console.log("[DEBUG] trap: getOwnPropertyDescriptor");
        //membrane.sync(obj, objectToWrap, prop);
        var result = Reflect.getOwnPropertyDescriptor(target, prop);
        return result;
      },
      defineProperty: function(target, property, descriptor) {
        if (membrane.debug) console.log("[DEBUG] trap: defineProperty");
        return membrane.defineProperty(target, property, descriptor);
      },
      has: function(target, prop) {
        if (membrane.debug) console.log("[DEBUG] trap: has");
        return Reflect.has(target, prop);
      },
      set: function(target, property, value, receiver) {
        if (membrane.debug) console.log("[DEBUG] trap: set");
        return Reflect.set(target, property, value, receiver);
      },
      deleteProperty: function(target, property) {
        if (membrane.debug) console.log("[DEBUG] trap: deleteProperty");
        return Reflect.deleteProperty(target, property);  
      },
      ownKeys: function(target) {
        if (membrane.debug) console.log("[DEBUG] trap: ownKeys");
        return Reflect.ownKeys(target);  
      },
      construct: function(target, argumentsList, newTarget) {
        if (membrane.debug) console.log("[DEBUG] trap: construct");

        // getting current context from the stack
        var currentMembraneContext = membrane.context[membrane.context.length-1];
        var currentContext = currentMembraneContext ? currentMembraneContext : "<mainContext>";

        if (membrane.debug) console.log("[DEBUG] Calling function (apply trap): " + objectName + " from context " + currentContext);

        // pushing new function context to stack
        membrane.context.push(objectName);

        // account for function call (objectName) in the current context
        var counter = membrane.functionCalls.get(contextifyFunctioncall(objectName, currentContext));
        counter = counter ? counter+ 1 : 1;
        membrane.functionCalls.set(contextifyFunctioncall(objectName, currentContext), counter);

        var constructedTarget = Reflect.construct(target, argumentsList, newTarget);

        membrane.context.pop();

        return wrap(constructedTarget, String(objectName));
      },
      // get trap (used to intercept properties access)
      get: function(target, propertyName, receiver) {
          var result = target[propertyName];

          var processedObj = membrane.processObjectValue(target);
          if (processedObj != undefined) return processedObj[propertyName];

          // read-only/non-configurable objects cannot be wrapped (get trap will throw TypeError in these cases)
          if (!membrane.isPrimitive(target)) {
            var targetDesc = membrane.getOwnPropertyDescriptor(target, propertyName);
            if (targetDesc && targetDesc.configurable != undefined) {
              if (targetDesc.configurable == false) {
                return result;
              }
            }
          }
          return wrap(result, String(objectName) + "." + String(propertyName));
      },
      // apply trap (used to intercept function calls)
      apply : function (target, thisArg, argumentsList) {
        // getting current context from the stack
        var currentMembraneContext = membrane.context[membrane.context.length-1];
        var currentContext = currentMembraneContext ? currentMembraneContext : "<mainContext>";

        if (membrane.debug) console.log("[DEBUG] Calling function (apply trap): " + objectName + " from context " + currentContext);

        // pushing new function context to stack
        membrane.context.push(objectName);

        // account for function call (objectName) in the current context
        var counter = membrane.functionCalls.get(contextifyFunctioncall(objectName, currentContext));
        counter = counter ? counter+ 1 : 1;
        membrane.functionCalls.set(contextifyFunctioncall(objectName, currentContext), counter);

        // proceeding with function call
        var fCall, originalThisArg, originalTarget;

        // var processedTarget = membrane.processObjectValue(target);
        var processedThisArg = membrane.processObjectValue(thisArg);

        // target = processedTarget == undefined ? target : processedTarget;
        thisArg = processedThisArg == undefined ? thisArg  : processedThisArg;


        // TODO: move this to handleSpecialCases function
        // special cases: Function.prototype.toString cannot be called with Reflect.apply API 
        if (target == Function.prototype.toString) {
          fCall = Function.prototype.toString.apply(obj);
        } else {
          fCall = target.apply(thisArg, argumentsList);
        }
        // pop function context from stack
        membrane.context.pop();

        // return the function call result
        return fCall;
      }
    });

    mapWrapped2Unwrapped.set(wrappedTarget, obj);
    mapUnwrapped2Wrapped.set(obj, wrappedTarget);

    return wrappedTarget;
  }

  return wrap(initTarget, moduleName);
}

module.exports = membrane;


