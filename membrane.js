var assert = require('assert')

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
    // return this.map.has(obj);
    return this.map.has(obj) || membrane.original.array_filter.call(this.a, function(o) { return o === obj; }).length > 0;
  },
  getOrCreate: function(obj, def) {
    var result = this.get(obj);
    if (result === undefined) {
      this.set(obj, def);
      return def;
    }
    return result;
  },
  print: function() {

  }
};

// used to handle special cases of get trap
var whitelist =  {
    WeakMap: { // ES-Harmony proposal as currently implemented by FF6.0a1
      prototype: {              
        'delete': true
      }
    },      
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
        valueOf: false,
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
        getYear: false, // ES5 Appendix B
        setYear: false, // ES5 Appendix B
        toGMTString: false, // ES5 Appendix B2dsd
        toDateString: false,
        toTimeString: false,
        toLocaleString: false,
        toLocaleDateString: false,
        toLocaleTimeString: false,
        valueOf: false,
        getTime: false,
        getFullYear: false,
        getUTCFullYear: false,
        getMonth: false,
        getUTCMonth: false,
        getDate: false,
        getUTCDate: false,
        getDay: false,
        getUTCDay: false,
        getHours: false,
        getUTCHours: false,
        getMinutes: false,
        getUTCMinutes: false,
        getSeconds: false,
        getUTCSeconds: false,
        getMilliseconds: false,
        getUTCMilliseconds: false,
        getTimezoneOffset: false,
        setTime: false,
        setFullYear: false,
        setUTCFullYear: false,
        setMonth: false,
        setUTCMonth: false,
        setDate: false,
        setUTCDate: false,
        setHours: false,
        setUTCHours: false,
        setMinutes: false,
        setUTCMinutes: false,
        setSeconds: false,
        setUTCSeconds: false,
        setMilliseconds: false,
        setUTCMilliseconds: false,
        toUTCString: false,
        toISOString: false,
        toJSON: false
      },
      parse: true,
      UTC: true,
      now: false,
    },
    JSON: {
      parse: true,
      stringify: true
    },        
    Function:{
      prototype:{
        toString: true,
        call: true,
        apply: true,
        bind: true
      }
    },
    // Promise:{
    //   prototype:{
    //     then: true
    //   }
    // }
};
var membrane = {};
membrane.debug = false;
membrane.trapsDebug = false;
membrane.contextDebug = false;
membrane.functionCallsDebug = true;

membrane.mainContext = "currentModule"; 
membrane.context = [];
membrane.context.push(membrane.mainContext);
membrane.functionCalls = new Map(); 
membrane.mapUnwrapped2Wrapped = new DoubleWeakMap(); // store map from original objects to wrapped ones
membrane.mapWrapped2Unwrapped = new DoubleWeakMap(); // store map from wrapped objects to original ones


// functions/objects that need special handling
membrane.whiteList = new WeakMap();
membrane.specialFunctionsMap = new WeakMap();

membrane.original = {
  // some references to original prototype functions used by the membrane
  error: Error,
  object: Object,
  functionPrototypeBind: Function.prototype.bind,
  getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
  getOwnPropertyNames: Object.getOwnPropertyNames,
  defineProperty: Object.defineProperty,
  getPrototypeOf: Object.getPrototypeOf,
  keys: Object.keys,
  functionToString: Function.prototype.toString,
  functionCall: Function.prototype.call,
  objectToString: Object.prototype.toString,
  objectCreate: Object.create,
  objectHasOwnProperty:  Object.prototype.hasOwnProperty,
  objectSeal: Object.seal,
  freeze: Object.freeze,
  preventExtensions: Object.preventExtensions,
  isArray:  Array.isArray,
  array_filter: Array.prototype.filter,
  array_slice: Array.prototype.slice,
  array_foreach: Array.prototype.forEach,
  array_map: Array.prototype.map,
  string_split: String.prototype.split,
  originalString: String,
  originalEval: eval,
};

membrane.specialFunctions = {
  clearInterval : global.clearInterval,  
  clearTimeout : global.clearTimeout,
  setTimeout: global.setTimeout,
  setInterval: global.setInterval,
  eval: global.eval,
  Function: global.Function,
  Array: global.Array,
  Object: global.Object,
  String: global.String, 
  Number: global.Number, 
  Boolean: global.Boolean,
  RegExp: global.RegExp,
  Date: global.Date,
  Error: global.Error,
  Uint8ClampedArray: global.Uint8ClampedArray,
  Uint8Array: global.Uint8Array,  
  Uint16Array: global.Uint16Array,
  Uint32Array: global.Uint32Array,
  Int8Array: global.Int8Array,
  Int16Array: global.Int16Array,
  Int32Array: global.Int32Array,
  Float32Array: global.Float32Array,
  Float64Array: global.Float64Array,
  Promise: global.Promise,
  pResolve: global.Promise.resolve,
  functionToString: global.Function.prototype.toString,        
};

membrane.handleSpecialBuiltinFunction = function(obj, args, thisValue, objectName, callerContext, calleeContext, trap) {
  var result;
  
  if (obj === membrane.specialFunctions.functionToString) {
    if (membrane.trapsDebug) console.log("[DEBUG-handleSpecialBuiltinFunction]: functionToString")

    thisValue = membrane.getUnwrappedIfNotPrimitive(thisValue);
    for (var i = 0; i < args.length; i++) {           
      if (!membrane.isPrimitive(args[i])) {
        args[i] = membrane.getUnwrapped(args[i]);                   
      }
    } 
    result = membrane.specialFunctions.functionToString.apply(thisValue, args);      
    return result;
  } 

  if (obj === membrane.specialFunctions.Array) {    
    if (membrane.trapsDebug) console.log("[DEBUG-handleSpecialBuiltinFunction]: Array object")
    result = obj.apply(thisValue, args);  
    return result;              
  } 

  if (obj === membrane.specialFunctions.setTimeout || obj === membrane.specialFunctions.setInterval) {
    for (i = 0; i < args.length; i++) {           
      args[i] = membrane.processSetValue(args[i], obj, objectName+"["+i+"]", callerContext, calleeContext);
    }
    result = obj.apply(thisValue, args);           
    return result;              
  }

  // native constructors, should return a wet value. don't know about wetness of args
  // this list is getting longer and includes methods, maybe we should separate it
  if (obj === membrane.specialFunctions.Date || obj === membrane.specialFunctions.Object ||
    obj === membrane.specialFunctions.String || obj === membrane.specialFunctions.Number ||
    obj === membrane.specialFunctions.Boolean || obj === membrane.specialFunctions.RegExp ||
    obj === membrane.specialFunctions.Error || obj == membrane.specialFunctions.Uint32Array ||
    obj === membrane.specialFunctions.Promise || obj === membrane.specialFunctions.Function) {

    if (trap === "apply")
      return obj.apply(thisValue, args);
    else if (trap === "construct")
      return membrane.makeConstructor(obj, args)();
  }
  throw Error("Not supported: " + String(obj));
}

membrane.makeConstructor = function(obj, args) {
  //setup parameters
  var paras = "";
  for (var i = 0; i < args.length; i++) {
    paras = paras + "args[" + i + "],";
  }
  var code = "new obj(" + paras.slice(0, paras.length - 1) + ");";
  return function() {
    return eval(code);
  };
}

// checks if an object is a primitive (number, string, null, undefined) or not
membrane.isPrimitive = function(obj) {
  return Object(obj) !== obj;
}

// checks if an object is empty (TODO: rethink need of this function)
membrane.isEmptyObject = function(obj) {
    return typeof obj === "Object" && Object.keys(obj).length === 0;
};

// handle get operations results (can be used in any trap that behaves like a get operation)
membrane.processGetValue = function(result, objectName, callerContext, calleeContext) {
  if (membrane.debug) console.log("[DEBUG-processGetValue] Begin");
  if (membrane.isPrimitive(result)) {
    if (membrane.debug) { console.log("[DEBUG-processGetValue] Returning primitive result: " + result); }            
    return result;
  }

  if (membrane.whiteList.has(result)) {
    if (membrane.debug) { console.log("[DEBUG-processGetValue] Returning result from whitelist"); }            
    return result;
  }

  var unwrappedResult = membrane.getUnwrapped(result);
  if (membrane.isProxy(unwrappedResult)) {
    if (membrane.debug) { console.log("[DEBUG-processGetValue] Returning unwrapped result "); }            
    return unwrappedResult;
  } else {
    if (membrane.debug) { console.log("[DEBUG-processGetValue] Creating membrane around unwrapped result"); }            
    return membrane.create(result, objectName);
  }
}

// handle get operations results (can be used in any trap that behaves like a set operation)
membrane.processSetValue = function(value, obj, objectName, callerContext, calleeContext) {
  if (membrane.debug) console.log("[DEBUG-processSetValue] Begin");
  var finalValue = value;
  if (!membrane.isPrimitive(value)) {
    if (membrane.debug) console.log("[DEBUG-processSetValue] Value is not primitive");

    if (membrane.whiteList.has(value)) {
      if (membrane.debug) { console.log("[DEBUG-processGetValue] Returning result from whitelist"); }            
      return value;
    }
    if (membrane.debug) console.log("[DEBUG-processSetValue] Checking if value is wrapped");
    var unwrappedValue = membrane.mapWrapped2Unwrapped.get(value);
    if (unwrappedValue) { // was wrapped already
      if (membrane.debug) console.log("[DEBUG-processSetValue] Checking if value is wrapped -> Result: value was already wrapped");
      return finalValue;
    } 
    else {
      if (membrane.debug) console.log("[DEBUG-processSetValue] Checking if value is wrapped -> Result: False");
      if (membrane.debug) console.log("[DEBUG-processSetValue] Value is now wrapped by " + callerContext);
      finalValue = membrane.create(value, callerContext + ".function");
    }
  }
  return finalValue;
}

membrane.enterContext = function(objectName) {
  var currentMembraneContext = membrane.context[membrane.context.length-1];
  var currentContext = currentMembraneContext ? currentMembraneContext : membrane.mainContext;

  if (membrane.functionCallsDebug) {
    console.log("[DEBUG] Calling function/constructor: " + objectName + "@" + currentContext);
    //console.log("ctx: " + membrane.context);
  }

  // pushing new function context to stack
  membrane.context.push(objectName);

  // account for function call (objectName) in the current context
  var counter = membrane.functionCalls.get(membrane.contextifyFunctioncall(objectName, currentContext));
  counter = counter ? counter+ 1 : 1;
  membrane.functionCalls.set(membrane.contextifyFunctioncall(objectName, currentContext), counter);
}

membrane.exitContext = function() {
  membrane.context.pop();
}

membrane.currentContext = function() { return membrane.context[membrane.context.length-1]; }

// checks if an object is wrapped with a proxy or not
membrane.isProxy = function(obj) {
  return membrane.isPrimitive(obj) ? false : membrane.mapWrapped2Unwrapped.has(obj);
}

membrane.getWrapped = function(obj) {
  if (obj && membrane.mapUnwrapped2Wrapped.has(obj)) {
    return membrane.mapUnwrapped2Wrapped.get(obj);
  }
  return null;
}

// unwraps an object and returns a non-proxied reference of it
membrane.getUnwrapped = function(obj) {
  var uw = membrane.mapWrapped2Unwrapped.get(obj);
  return uw ? uw : obj;
}

membrane.getUnwrappedIfNotPrimitive = function(obj) {
  if (membrane.isPrimitive(obj)) {
    return obj;
  }
  return membrane.getUnwrapped(obj);
}

// wraps an object and returns a proxied reference of it
membrane.wrap = function(obj, objectName) {
  var wrappedObj;

  if (membrane.isPrimitive(obj)) return obj;

  var objectToWrap = obj;  

  wrappedObj = new Proxy(objectToWrap, {
    // list of traps
    // extracted from: http://www.ecma-international.org/ecma-262/6.0/#sec-proxy-object-internal-methods-and-internal-slots
    getPrototypeOf: function(target) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap] trap: getPrototypeOf");
      return Reflect.getPrototypeOf(target);
    },
    setPrototypeOf: function(target, prototype) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: setPrototypeOf");
      return Reflect.setPrototypeOf(target, prototype);
    },
    isExtensible: function(target) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: isExtensible");
      return Reflect.isExtensible(target);
    },
    preventExtensions: function(target) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: preventExtensions");
      return Reflect.preventExtensions(target);
    },
    getOwnPropertyDescriptor: function(target, prop) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: getOwnPropertyDescriptor");
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty: function(target, property, descriptor) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: defineProperty");
      //TODO: processSetValue (delegate package error)
      // when setting a value that is already a proxy, should check whether it is configurable/writable and decide to unwrap it or not

      // if (membrane.isProxy(descriptor)) {
      //   if (membrane.debug) console.log("[DEBUG] descriptor is wrapped");
      //   descriptor = membrane.getUnwrapped(descriptor);
      // }
      // descriptor.value = membrane.processSetValue(descriptor.value, obj, "", membrane.currentContext, membrane.currentContext);
      return membrane.original.defineProperty(target, property, descriptor);

      // return wrappedObj;
    },
    has: function(target, prop) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: has");
      return Reflect.has(target, prop);
    },
    set: function(target, property, value, receiver) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: set");
      return Reflect.set(target, property, value, receiver);
    },
    deleteProperty: function(target, property) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: deleteProperty");
      return Reflect.deleteProperty(target, property);  
    },
    ownKeys: function(target) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: ownKeys");
      return Reflect.ownKeys(target);  
    },
    // get trap (used to intercept properties access)
    get: function(target, propertyName, receiver) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: get " + propertyName);  

      // [TODO] check caller context and callee context?
      var callerContext = membrane.currentContext();
      callerContext = callerContext.split('.')[0];
      var calleeContext = objectName;
      calleeContext = calleeContext.split('.')[0];
      
      var result = obj[propertyName];
      
      // read-only/non-configurable objects cannot be wrapped (get trap will throw TypeError in these cases)
      if (!membrane.isPrimitive(obj)) {
        var targetDesc = membrane.original.getOwnPropertyDescriptor(obj, propertyName);
        if (targetDesc && targetDesc.configurable != undefined) {
          if (targetDesc.configurable == false) {
            if (membrane.isProxy(result)) {
              return result;
            }
            return membrane.getUnwrappedIfNotPrimitive(result);
          }
        }
      }
      result = membrane.processGetValue(result, String(objectName) + "." + String(propertyName), callerContext, calleeContext);     
      return result;
    },
    // apply trap (used to intercept function calls)
    apply: function (target, thisArg, argumentsList) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: apply ");
      var result, functionCallresult;

      // [TODO] check caller context and callee context?
      var callerContext = membrane.currentContext();
      callerContext = callerContext.split('.')[0];
      var calleeContext = objectName;
      calleeContext = calleeContext.split('.')[0];
      if (membrane.contextDebug) console.log("[DEBUG-context] caller: " + callerContext + " ---- " + "callee: " + calleeContext);

      // // handle special functions [TODO] rethink need
      if (membrane.specialFunctionsMap.has(obj)) {
          // policy check (if necessary in this function call)
          if (membrane.debug) console.log("[DEBUG]: Handling special function (apply): " + membrane.specialFunctionsMap.get(obj)); 

          result = membrane.handleSpecialBuiltinFunction(obj, argumentsList, thisArg, objectName, callerContext, calleeContext, "apply");
          return result;
      }

      // var isNativeFunction = membrane.original.functionToString.call(obj).includes("[native code]");

      // handle argumentsList (wrap or unwrap it before calling function)
      for (var i = 0; i < argumentsList.length; i++) {
        // if (!isNativeFunction && (typeof argumentsList[i] === "function")) {
        if (typeof argumentsList[i] === "function") {
          if (membrane.debug) console.log(">>> Processing function parameter..");
          argumentsList[i] = membrane.processSetValue(argumentsList[i], obj, objectName+"["+i+"]", callerContext, calleeContext);
        } else {
          argumentsList[i] = membrane.getUnwrappedIfNotPrimitive(argumentsList[i]);
        }
      }

      // // handle argumentsList (wrap or unwrap it before calling function)
      // // native functions are always unwrapped before calling
      // if (!isNativeFunction) {
      //   thisArg = membrane.processSetValue(thisArg, obj, "[this]."+objectName, callerContext, calleeContext);
      // } else {
        thisArg = membrane.getUnwrappedIfNotPrimitive(thisArg);
      // }

      membrane.enterContext(objectName);
      functionCallresult = obj.apply(thisArg, argumentsList);
      membrane.exitContext();

      result = membrane.processGetValue(functionCallresult, String(objectName), callerContext, calleeContext);
      return result;
    },
    construct: function(target, argumentsList, newTarget) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: construct");
      var result, constructorResult;

      var callerContext = membrane.currentContext();
      callerContext = callerContext.split('.')[0];
      var calleeContext = objectName;
      calleeContext = calleeContext.split('.')[0];
      if (membrane.contextDebug) console.log("[DEBUG-context] caller: " + callerContext + " ---- " + "callee: " + calleeContext);

      // handle special functions [TODO] rethink need
      if (membrane.specialFunctionsMap.has(obj)) {
          // policy check (if necessary in this function call)
          if (membrane.debug) console.log("[DEBUG]: Handling special function (construct-trap): ");

          result = membrane.handleSpecialBuiltinFunction(obj, argumentsList, null, objectName, callerContext, calleeContext, "construct");
          // result = membrane.getUnwrappedIfNotPrimitive(result);
          return result;
      }

      // handle argumentsList (wrap or unwrap it before calling function)
      for (var i = 0; i < argumentsList.length; i++) {
        argumentsList[i] = membrane.processSetValue(argumentsList[i], obj, objectName+"["+i+"]", callerContext, calleeContext);
      }

      newTarget = membrane.getUnwrappedIfNotPrimitive(newTarget);

      membrane.enterContext(objectName);
      constructorResult = Reflect.construct(obj, argumentsList, newTarget);
      membrane.exitContext();

      result = membrane.processGetValue(constructorResult, String(objectName), callerContext, calleeContext);
      return result;
    },
  });

  return wrappedObj;
}

membrane.contextifyFunctioncall = function(functionCall, context) {
  return functionCall + "@" + context;
} 

membrane.create = function(target, moduleName="defaultModuleName") {
  var wrappedTarget;

  if (membrane.isProxy(target)) return target;

  // wrappedTarget = membrane.getWrapped(target);
  // if (wrappedTarget) return wrappedTarget;

  wrappedTarget = membrane.wrap(target, moduleName);

  membrane.mapWrapped2Unwrapped.set(wrappedTarget, target);
  membrane.mapUnwrapped2Wrapped.set(target, wrappedTarget);

  return wrappedTarget;
}

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
        catch(ex) { console.log("[DEBUG] setupWhiteList catch(ex): " + e1 + " " + e2); }
        if (e2 !== "prototype") {
          if (whitelist[e1][e2]) {               
            try {
              membrane.whiteList.set(whiteListedObject, {});
            } catch(ee) { console.log("[DEBUG] setupWhiteList catch(ee1): " + e1 + " " + e2); }
          }             
        }           
        if (typeof whitelist[e1][e2] === "object") {
          Object.keys(whitelist[e1][e2]).forEach(function(e3) {               
            whiteListedObject = eval(e1 + "." + e2 + "." + e3);
            if (whitelist[e1][e2][e3]) {                 
              try {
                membrane.whiteList.set(whiteListedObject, {});
              } catch(ee) { console.log("[DEBUG] setupWhiteList catch(ee2): " + e1 + " " + e2 + " " + e3); }
            }
          });
        }
      });
    }     
  }); 
}

membrane.setupBuiltinFunctions = function() {
  // used to handle special cases of apply/construct trap
  Object.keys(membrane.specialFunctions).forEach(function(k) {
    membrane.specialFunctionsMap.set(membrane.specialFunctions[k], k);
  });

  var object = Function.prototype;     
  ["toString"].forEach(function(name) {
    // reuse desc to avoid reiterating prop attributes
    var desc = membrane.original.getOwnPropertyDescriptor(object, name);
    var existingMethod = desc.value;   
    if (typeof existingMethod === "function") { 
      desc.value = membrane.create(existingMethod, "Function.prototype.toString(built-in)");
      membrane.original.defineProperty(object, name, desc);
      membrane.whiteList.set(object[name], {});
    }      
  });
}

membrane.setupWhiteList();
membrane.setupBuiltinFunctions();

var fooModule = {};
fooModule.foo = function(x) {
    console.log("foo");
    x();
    var y = x;
    console.log("foo-end");
    return y;
}

var barModule = {};
barModule.barrr = function() {
  return barModule.bar;
}
barModule.bar = function() {
  console.log("callback");
}

var bazModule = {};
bazModule.baz = function(x) { return x(); };

bazModule.main = function() {
    var fooMembrane = membrane.create(fooModule, "fooModule");
    var barMembrane = membrane.create(barModule, "barModule");

    var w = bazModule.baz(-----.barrr);
    var z = fooMembrane.foo(w); 
    z(); // implicit call to barModule.bar
    w(); // another implicit call to barModule.bar
}
var bazMemebrane = membrane.create(bazModule, "bazModule");
bazMemebrane.main();
console.log(membrane.functionCalls);

module.exports = membrane;


