function contextifyFunctioncall(functionCall, context) {
    return functionCall + "@" + context;
}

var membrane = {};
var membraneContext = [];

// TODO: replace this map by one that also contains the context of function calls
membrane.functionCalls = new Map(); 

membrane.create = function(initTarget, moduleName) {

  var wrap = function(target, objectName) {
    if (Object(target) !== target) return target; // primitives are passed through

  // membrane handler
  var handler = {

    // get trap (useful to intercept properties access)
    get: function(target, propertyName, receiver) {
        var t = Reflect.get(target, propertyName, receiver);
        if (Object(t) !== t) {
          return t;
        } 
        return wrap(t, objectName + "." + propertyName);
    },
    // apply trap (useful to intercept function calls)
    apply : function (target, thisArg, argumentsList) {

          var currentMembraneContext = membraneContext[membraneContext.length-1];
          var currentContext = currentMembraneContext ? currentMembraneContext : "<mainContext>";

          console.log("> calling function: " + objectName + " from context " + currentContext);

          membraneContext.push(objectName);

          var counter = membrane.functionCalls.get(contextifyFunctioncall(objectName, currentContext));
          counter = counter ? counter+ 1 : 1;

          membrane.functionCalls.set(contextifyFunctioncall(objectName, currentContext), counter);

          var fCall = Reflect.apply(target, thisArg, argumentsList);
          membraneContext.pop();
          return fCall;
        }
  };
      
    var wrapper = new Proxy(target, handler);
    return wrapper;
  }
  return wrap(initTarget, moduleName);
}

module.exports = membrane;


