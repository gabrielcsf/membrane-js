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
        toString: true,
        call: true,
        apply: true,
        bind: true
      }
    },

};

// // used to handle special cases of apply trap
// var specialFunctions = [  
//     clearInterval,  
//     clearTimeout,
//     setTimeout,
//     setInterval,
//     eval,
//     Object,
//     Function,
//     Array,
//     String, 
//     Number,
//     Boolean,
//     RegExp,
//     Date,
//     Error,
//     Uint32Array,
//     Symbol, 
//     Promise,
//     Promise.resolve,
//     Function.prototype.toString,        
// ];

var mapUnwrapped2Wrapped = new DoubleWeakMap(); // store map from original objects to wrapped ones
var mapWrapped2Unwrapped = new DoubleWeakMap(); // store map from wrapped objects to original ones

var membrane = {};
membrane.create = function(){};
membrane.isWrapped = function(){};

membrane.debug = true;
membrane.trapsDebug = true;
membrane.contextDebug = true;

membrane.context = [];
membrane.context.push("<mainContext>");
membrane.functionCalls = new Map(); 

// functions/objects that need special handling
membrane.whiteList = new WeakMap();
membrane.nativePrototypes = new WeakMap();

// reference to Object functions 
membrane.getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
membrane.defineProperty = Object.defineProperty;

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
membrane.setupWhiteList();

// checks if an object is a primitive (number, string, null, undefined) or not
membrane.isPrimitive = function(obj) {
  return Object(obj) !== obj;
}

// checks if an object is empty (TODO: rethink need of this function)
membrane.isEmptyObject = function(obj) {
    return typeof obj === "Object" && Object.keys(obj).length === 0;
};

// handle get operations results (can be used in any trap that behaves like a get operation)
membrane.processGetValue = function(result, objectName) {

  if (membrane.isPrimitive(result)) {
    if (membrane.debug) { console.log("[DEBUG-processGetValue] Returning primitive object: " + JSON.stringify(result)); }            
    return result;
  }

  if (membrane.whiteList.has(result)){
    if (membrane.debug) { console.log("[DEBUG-processGetValue] Returning object from whitelist"); }            
    return result;
  }

  if (membrane.debug) { console.log("[DEBUG-processGetValue] Returning wrapped object: "); }           
  return membrane.create(result, objectName);
}

// handle get operations results (can be used in any trap that behaves like a get operation)
membrane.processSetValue = function(result) {
  console.log(">>>>>> [TODO: implement processSetValue]");
  return result;
}

membrane.enterContext = function(objectName) {
  var currentMembraneContext = membrane.context[membrane.context.length-1];
  var currentContext = currentMembraneContext ? currentMembraneContext : "<mainContext>";

  if (membrane.contextDebug) console.log("[DEBUG] Calling function (apply trap): " + objectName + " from context " + currentContext);

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

membrane.currentContext = function() { return ""; }

// checks if an object is wrapped with a proxy or not
membrane.isWrapped = function(obj) {
  return mapWrapped2Unwrapped.has(obj);
}

membrane.getWrapped = function(obj) {
  if (obj && mapUnwrapped2Wrapped.has(obj)) {
    return mapUnwrapped2Wrapped.get(obj);
  }
  return obj;
}

// unwraps an object and returns a non-proxied reference of it
membrane.getUnwrapped = function(obj) {
  if (obj && mapWrapped2Unwrapped.has(obj)) {
    return mapWrapped2Unwrapped.get(obj);
  }
  return obj;
}

membrane.getUnwrappedIfNotPrimitive = function(obj) {
  return membrane.isPrimitive(obj) ? obj : membrane.getUnwrapped(obj);
}

// wraps an object and returns a proxied reference of it
membrane.wrap = function(obj, objectName) {
  var wrappedObj;

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
      return membrane.defineProperty(target, property, descriptor);
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
    construct: function(target, argumentsList, newTarget) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap]: construct");
      return Reflect.construct(target, argumentsList, newTarget);
    },
    // get trap (used to intercept properties access)
    get: function(target, propertyName, receiver) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap] get: " + String(propertyName));

      var result = target[propertyName];
      result = membrane.processGetValue(result, String(objectName) + "." + String(propertyName));     

      // read-only/non-configurable objects cannot be wrapped (get trap will throw TypeError in these cases)
      if (!membrane.isPrimitive(target)) {
        var targetDesc = membrane.getOwnPropertyDescriptor(target, propertyName);
        if (targetDesc && targetDesc.configurable != undefined) {
          if (targetDesc.configurable == false) {
            return result;
          }
        }
      }

      return result;
    },
    // apply trap (used to intercept function calls)
    apply : function (target, thisArg, argumentsList) {
      if (membrane.trapsDebug) console.log("[DEBUG-trap] apply " + String(target));
      var result, functionCallresult;

      // // handle special functions
      // // TODO: rethink need

      var isNativeFunction = Function.prototype.toString.call(target).includes("[native code]");
      
      // handle argumentsList (wrap or unwrap it before calling function)
      for (var i = 0; i < argumentsList.length; i++) {
        if (!isNativeFunction && (typeof argumentsList[i] === "function")) {
          argumentsList[i] = membrane.processSetValue(argumentsList[i]);
        } else {
          argumentsList[i] = membrane.getUnwrappedIfNotPrimitive(argumentsList[i])
        }
      }

      // handle argumentsList (wrap or unwrap it before calling function)
      // native functions are always unwrapped before calling
      if (!isNativeFunction) {
        thisArg = membrane.processSetValue(thisArg);
      } else {
        thisArg = membrane.getUnwrappedIfNotPrimitive(thisArg)
      }

      membrane.enterContext(objectName);

      functionCallresult = target.apply(thisArg, argumentsList);

      membrane.exitContext();

      result = membrane.processGetValue(functionCallresult, String(objectName));
      return result;
    }
  });

  return wrappedObj;
}

membrane.contextifyFunctioncall = function(functionCall, context) {
  return functionCall + "@" + context;
} 

membrane.create = function(initTarget, moduleName) {
  if (membrane.isWrapped(initTarget)) {
    return membrane.getWrapped(initTarget);
  }

  var wrappedTarget = membrane.wrap(initTarget, moduleName);

  mapWrapped2Unwrapped.set(wrappedTarget, initTarget);
  mapUnwrapped2Wrapped.set(initTarget, wrappedTarget);

  return wrappedTarget;
}



// var fooModule = {};
// fooModule.foo = function(obj) {
//     console.log("foo");
//     console.log(JSON.stringify(obj));    
//     obj.toString = function() { return "a".toString() };
//     console.log("foo-end");
// }

// var barModule = {};

// var fooMembrane = membrane.create(fooModule, "fooModule");
// var barMembrane = membrane.create(barModule, "barModule");

// fooMembrane.foo(barMembrane); // barMembrane.bar returned and assigned to z
// console.log(barMembrane.toString());

module.exports = membrane;


