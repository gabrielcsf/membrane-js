// CODE USED TO TEST SPECIAL CASES (IGNORE IT)
// ------------------------- BEGIN --------------------------- 
// var DoubleWeakMap = function() {
//   this.map = new WeakMap();
//   this.a = [];
//   this.b = [];
// };

// DoubleWeakMap.prototype = {
//   get: function(obj) {
//     var wo = this.map.get(obj);
//     if (wo)
//       return wo;
//     for (var i = 0; i < this.a.length; i++) {
//       if (obj === this.a[i])
//         return this.b[i];
//     }
//     return undefined;
//   },
//   set: function(obj, val) {
//     try {
//       return this.map.set(obj, val);
//     } catch(e) {
//       console.log("catch: " + e);
//       for (var i = 0; i < this.a.length; i++) {
//         if (obj === this.a[i]) {
//           this.b[i] = val;
//           return this;
//         }
//       }
//       this.a.push(obj);
//       this.b.push(val);
//       return this;
//     }
//   },
//   has: function(obj) {
//     return this.map.has(obj) || this.a.filter(function(o) { return o === obj; }).length > 0;
//   },
//   getOrCreate: function(obj, def) {
//     var result = this.get(obj);
//     if (result === undefined) {
//       this.set(obj, def);
//       return def;
//     }
//     return result;
//   }
// };

// var mapUnwrapped2Wrapped = new DoubleWeakMap(); // store map from original objects to wrapped ones
// var mapWrapped2Unwrapped = new DoubleWeakMap(); // store map from wrapped objects to original ones

// var specialFunctions = {  
//     clearInterval : clearInterval,  
//     clearTimeout : clearTimeout,
//     setTimeout : setTimeout,
//     setInterval : setInterval,
//     eval : eval,
//     Function : Function,
//     Array : Array,
//     Object : Object,
//     String : String, 
//     Number : Number, 
//     Boolean : Boolean,
//     RegExp : RegExp,
//     Date : Date,
//     Error : Error,
//     Uint32Array : Uint32Array,
//     Promise : Promise,
//     pResolve : Promise.resolve,
//     functionToString : Function.prototype.toString,        
// };
// ------------------------- END --------------------------- 

var membrane = {};
membrane.debug = false;
membrane.context = [];

membrane.functionCalls = new Map(); 

membrane.create = function(initTarget, moduleName) {

  function contextifyFunctioncall(functionCall, context) {
    return functionCall + "@" + context;
  } 

  var wrap = function(target, objectName) {
  
  // membrane handler
  var handler = {
    // get trap (useful to intercept properties access)
    get: function(target, propertyName, receiver) {
        var t = Reflect.get(target, propertyName, receiver);
        if (Object(t) !== t) { // primitives are passed through (do we really need two checks?)
          return t;
        } 
        return wrap(t, objectName + "." + propertyName);
    },
    // apply trap (useful to intercept function calls)
    apply : function (target, thisArg, argumentsList) {
      // getting current context from the stack
      var currentMembraneContext = membrane.context[membrane.context.length-1];
      var currentContext = currentMembraneContext ? currentMembraneContext : "<mainContext>";

      if (membrane.debug) { console.log("[APPLY TRAP] calling function: " + objectName + " from context " + currentContext); }

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
      } else {    
        fCall = Reflect.apply(target, {}, argumentsList);
      }
      // pop function context from stack
      membrane.context.pop();

      // return the function call result
      return fCall;
    }
  };

  if (Object(target) !== target) return target; // primitives are passed through
     
  // TODO: handle special functions, native objects
  var objectToBeWrapped = target;
  // handleSpecialCases(objectToBeWrapped);

  var wrappedTarget = new Proxy(objectToBeWrapped, handler);
  return wrappedTarget;
  }

  return wrap(initTarget, moduleName);
}

module.exports = membrane;


