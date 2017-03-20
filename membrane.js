var membrane = {};
var membraneContext = [];

membrane.functionCalls = new Map(); 

membrane.create = function(initTarget, moduleName) {

  var wrap = function(target, objectName) {
    if (Object(target) !== target) return target; // primitives are passed through

  var handler = {
    get: function(target, propertyName, receiver) {
        var t = Reflect.get(target, propertyName, receiver);
        if (Object(t) !== t) {
          return t;
        } 
        return wrap(t, objectName + "." + propertyName);
    },
    apply : function (target, thisArg, argumentsList) {
          var currentMembraneContext = membraneContext[membraneContext.length-1];
          var currentContext = currentMembraneContext ? currentMembraneContext : "<rootModule>";

          console.log("calling function: " + objectName + " from context " + currentContext);
          membraneContext.push(objectName);

          var counter = membrane.functionCalls.get(objectName);
          counter = counter ? counter+1 : 1;
          membrane.functionCalls.set(objectName, counter);

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


