'use strict';

var membrane = {};
var membraneContext = [];

membrane.create = function(initTarget, bname) {

  var wrap = function(target, bname) {
    if (Object(target) !== target) return target; // primitives are passed through

	var handler = {
		get: function(target, name, receiver) {
			var t = Reflect.get(target, name, receiver);
			if (Object(t) !== t) {
				return t;
			} else {
		    	return wrap(t, bname+"."+name);
			}
	    },
	    apply : function (target, thisArg, argumentsList) {
	    	console.log("calling function: " + bname +"---" + target + " from context " + membraneContext.pop());
	    	membraneContext.push(bname);
	        var fCall = Reflect.apply(target, thisArg, argumentsList);
	        membraneContext.pop();
	        return fCall;
        }
	};
      
    var wrapper = new Proxy(target, handler);
    return wrapper;
  }
  return wrap(initTarget, bname);
}

module.exports = membrane;
