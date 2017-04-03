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
      console.log("catch: " + e);
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

var mapUnwrapped2Wrapped = new DoubleWeakMap(); // store map from original objects to wrapped ones
var mapWrapped2Unwrapped = new DoubleWeakMap(); // store map from wrapped objects to original ones

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

var membrane = {};
membrane.debug = true;
membrane.context = [];

membrane.functionCalls = new Map(); 

// should be private (public now for testing purposes)
membrane.isPrimitive = function(obj) {
  return Object(obj) !== obj;
}

// should be private (public now for testing purposes)
membrane.isWrapped = function(obj) {
  return mapWrapped2Unwrapped.has(obj);
}

// used when getOwnPropertyDescriptor trap is triggered
membrane.sync = function(obj, objCopy, property) {
try {
    var objDesc = Object.getOwnPropertyDescriptor(obj, property);
    var objCopyDesc = Object.getOwnPropertyDescriptor(objCopy, property);
    if (!objCopyDesc || objCopyDesc.configurable) {           
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
      if (!objCopyDesc || objCopyDesc.configurable) {           
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


membrane.create = function(initTarget, moduleName) {

  function contextifyFunctioncall(functionCall, context) {
    return functionCall + "@" + context;
  } 

  if (membrane.isWrapped(initTarget)) {
    return initTarget;
  }

  var wrap = function(obj, objectName) {
  
    if (membrane.isPrimitive(obj)) return obj; // primitives are passed through
       
    var specialFunction = undefined;
    specialFunctions.forEach(function(elem) {
      if (obj == elem) {
        specialFunction = obj;
      }
    });
    if (specialFunction != undefined) {
      if (membrane.debug) console.log("[DEBUG] getOwnPropertyDescriptor trap returning unwrapped special function: " + specialFunction);
      return specialFunction;
    }

    // TODO: handle special functions, native objects
    // var objectToBeWrapped = obj;
    // handleSpecialCases(objectToBeWrapped);

    var objectToWrap = obj; //shadow object used as the target object for an object
    // var objProto = obj.__proto__;

    // if (typeof obj === "object") {           
    //   objectToWrap.__proto__ = objProto ? mapWrapped2Unwrapped.get(objProto) : objProto;          
    // }
    // else if (typeof obj === "function") {
    //     var args = "";
    //     for (var i=0; i < obj.length; i++) 
    //       args = "a" + i + ",";

    //     if (i>0) args = args.slice(0,-1);
    //     try {
    //       eval("objectToWrap = function " + obj.name + "("+ args +"){};");
    //     }
    //     catch(e) {
    //       objectToWrap = function(){};
    //     }       
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
        if (membrane.debug) console.log(">>> trap: getPrototypeOf");
        return Reflect.getPrototypeOf(target);
      },
      setPrototypeOf: function(target, prototype) {
        if (membrane.debug) console.log(">>> trap: setPrototypeOf");
        return Reflect.setPrototypeOf(target, prototype);
      },
      isExtensible: function(target) {
        if (membrane.debug) console.log(">>> trap: isExtensible");
        return Reflect.isExtensible(target);
      },
      preventExtensions: function(target) {
        if (membrane.debug) console.log(">>> trap: preventExtensions");
        return Reflect.preventExtensions(target);
      },
      getOwnPropertyDescriptor: function(target, prop) {
        //if (membrane.debug) console.log(">>> trap: getOwnPropertyDescriptor");
        // membrane.sync(obj, objectToWrap, prop);

        var specialFunction = undefined;
        specialFunctions.forEach(function(elem) {
            if (objectToWrap == elem) {
              specialFunction = objectToWrap;
            }
        });
          if (specialFunction != undefined) {
            if (membrane.debug) console.log("[DEBUG] getOwnPropertyDescriptor trap returning unwrapped special function: " + specialFunction);
            return specialFunction;
          }
        var result = Reflect.getOwnPropertyDescriptor(target, prop);

        return Reflect.getOwnPropertyDescriptor(target, prop);;
      },
      defineProperty: function(target, property, descriptor) {
        if (membrane.debug) console.log(">>> trap: defineProperty");
        return Reflect.defineProperty(target, property, descriptor);
      },
      has: function(target, prop) {
        if (membrane.debug) console.log(">>> trap: has");
        return Reflect.has(target, prop);
      },
      set: function(target, property, value, receiver) {
        if (membrane.debug) console.log(">>> trap: set");
        return Reflect.set(target, property, value, receiver);
      },
      deleteProperty: function(target, property) {
        if (membrane.debug) console.log(">>> trap: deleteProperty");
        return Reflect.deleteProperty(target, property);  
      },
      ownKeys: function(target) {
        if (membrane.debug) console.log(">>> trap: ownKeys");
        return Reflect.ownKeys(target);  
      },
      construct: function(target, argumentsList, newTarget) {
        if (membrane.debug) console.log(">>> trap: construct");
        return Reflect.construct(target, argumentsList, newTarget); 
      },
      // get trap (used to intercept properties access)
      get: function(target, propertyName, receiver) {

          var specialFunction = undefined;
          specialFunctions.forEach(function(elem) {
            if (elem == objectToWrap) {
              specialFunction = objectToWrap;
            }
          });
          if (specialFunction) {
            if (membrane.debug) console.log("[DEBUG] get trap returning unwrapped special function: " + specialFunction);
            return specialFunction[propertyName];
          }
          var result = objectToWrap[propertyName];

          if (membrane.isPrimitive(result)) { // primitives are passed through (do we really need two checks?)
            return result;
          }

          // non-configurable objects cannot be wrapped
          var objDesc = Object.getOwnPropertyDescriptor(objectToWrap, propertyName);
          if (objDesc && objDesc.configurable != undefined) {
            if (objDesc.configurable == false) {
              return result;
            }
          }

          return wrap(result, String(objectName) + "." + String(propertyName));
      },
      // apply trap (used to intercept function calls)
      apply : function (target, thisArg, argumentsList) {
        // getting current context from the stack
        var currentMembraneContext = membrane.context[membrane.context.length-1];
        var currentContext = currentMembraneContext ? currentMembraneContext : "<mainContext>";

        //if (membrane.debug) { console.log("[APPLY TRAP] calling function: " + objectName + " from context " + currentContext); }

        // pushing new function context to stack
        membrane.context.push(objectName);

        // account for function call (objectName) in the current context
        var counter = membrane.functionCalls.get(contextifyFunctioncall(objectName, currentContext));
        counter = counter ? counter+ 1 : 1;
        membrane.functionCalls.set(contextifyFunctioncall(objectName, currentContext), counter);

        // proceeding with function call
        var fCall;
        // TODO: move this to handleSpecialCases function
        // special cases: Function.prototype.toString cannot be called with Reflect.apply API 
        if (target == Function.prototype.toString) {
          fCall = Function.prototype.toString.call(target);
        }  else if (mapWrapped2Unwrapped.has(thisArg)) {
          fCall = target.apply(mapWrapped2Unwrapped.get(thisArg), argumentsList);
        } else {
          fCall = target.apply(thisArg, argumentsList);
        }
        // pop function context from stack
        membrane.context.pop();

        // return the function call result
        return fCall;
      }
    });

    mapWrapped2Unwrapped.set(wrappedTarget, objectToWrap);
    mapUnwrapped2Wrapped.set(objectToWrap, wrappedTarget);

    return wrappedTarget;
  }

  return wrap(initTarget, moduleName);
}

module.exports = membrane;


