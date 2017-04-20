var assert = require('assert');
var membrane = require('../membrane');

describe('Membrane tests', function() {
	var foo;

	beforeEach(function() {
		// initializers
		foo = function(){ return "foo"; };
		membrane.functionCalls = new Map(); 
	});

	describe('when creating a membrane around a function', function() {
		it('should transparently return a wrapped function', function() { 
				var wrappedFunc = membrane.create(foo, "foo");//

				console.log(wrappedFunc());

				assert.equal(typeof wrappedFunc, 'function'); // types are kept the same
				assert.notEqual(foo, wrappedFunc); // original instance and proxy are different objects
				assert.equal(foo(), wrappedFunc()); // equal results
			});
	});


	describe('when creating a membrane around an object that contains a function', function() {
			it('should transparently return a membrane wrapping the object and the internal function', function() {
				var obj = { 'foo' : foo };
				var wrappedObj = membrane.create(obj, "foo");

				assert.equal(typeof wrappedObj, 'object'); // types are kept the same
				assert.notEqual(obj, wrappedObj); // original instance and proxy are different objects
				assert.notEqual(obj.foo, wrappedObj.foo); // original instance and proxy are different objects

				assert.equal(obj.foo(), wrappedObj.foo()); // equal results
		});
	});

	describe('when creating a membrane around an object and trying to access its prototype', function() {
			it('should handle', function() {
				var obj = { 'foo' : foo };

				var wrappedObj = membrane.create(obj, "foo");
				wrappedObj.__proto__.toString();

				// assert.equal(typeof wrappedObj, 'object'); // types are kept the same
				// assert.notEqual(obj, wrappedObj); // original instance and proxy are different objects
				// assert.notEqual(obj.foo, wrappedObj.foo); // original instance and proxy are different objects
				// assert.equal(obj.foo(), wrappedObj.foo()); // equal results
		});
	});

	describe('when wrapping an object, copying it to a dry object, and executing function foo in both', function() {
		it('should account for both function calls', function() {
			var x = { 'foo' : foo };
			var y = { 'x' : x };

			var yMembrane = membrane.create(y, "y");
			var dryX = yMembrane.x;

			yMembrane.x.foo();
			dryX.foo();

			assert.equal(membrane.functionCalls.get("y.x.foo@<mainContext>"), 2);	
		});
	});

	// ------------ IMPORTANT ----------------
	// write test for recursive wrapped functions

	describe('when wrapping an module that call functions using thisArg argument', function() {
				it('should not throw TypeError', function() {

			var testModule = {};
			testModule.foo = function() {
				return "foo";
			}

			testModule.objectX = {
			  propertyOne: 'yoda',
			  propertyTwo: 'jedi',
			};

			testModule.execute = function() {
			  Object.keys({ propertyOne :"a", propertyTwo : "b"}).forEach(function(key) {
			    console.log(this[key]);
			  }, testModule.objectX); // last arg is `thisArg`
			}

			var membraneTest = membrane.create(testModule, "testModule");
			membraneTest.execute();
			assert.equal(membrane.functionCalls.get("testModule.execute@<mainContext>"), 1);	
		});
	});

	describe('when wrapping a module that has properties binded to C code', function() {
		it('should not ', function() {
			var membraneOS = membrane.create(require('os'), "osModule");
			console.log(membraneOS.type());

			assert.equal(membrane.functionCalls.get("osModule.type@<mainContext>"), 1);	
		});
	});

	describe('when executing a function in a wrapped module', function() {
		it('should account for the function call', function() {
			var fooModule = {};
			fooModule.foo = function(){ 
				return "foo"; 
			};
			var fooMembrane = membrane.create(fooModule, "fooModule");
			fooMembrane.foo();

			assert.equal(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	
		});
	});

	describe('when executing a function defined locally in a wrapped function', function() {
		it('should not account for local function calls', function() {
			var fooModule = {};
			fooModule.foo = function(){ 
				var x=function(){return 4;}
				x();
				return "foo"; 
			};
			var fooMembrane = membrane.create(fooModule, "fooModule");
			fooMembrane.foo();

			assert.equal(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	
			assert.equal(membrane.functionCalls.get("fooModule.x@<mainContext>"), undefined);	// local functions and function passed as parameters are not wrapped
		});
	});

	describe('when creating a membrane around a module that require the fs module', function() {
		it('should account for cross module function calls', function() {

			var testModule = {};
			testModule.execute = function() {

				var fs = membrane.create(require("fs"), "fs");
				fs.readdir("/home", function(err, items) {
					for (var i=0; i<items.length; i++) {
						console.log("file: " + items[i]);
					}
				})
			};

			var wrappedTestModule = membrane.create(testModule, "testModule");
			wrappedTestModule.execute();

			assert.equal(membrane.functionCalls.get("testModule.execute@<mainContext>"), 1);	
			assert.equal(membrane.functionCalls.get("fs.readdir@testModule.execute"), 1);	

		});
	});

	describe('when creating a membrane around a module that accepts callback functions as parameters', function() {
		it('should not account for the callback function call', function() {

				var fooModule = {};
				fooModule.foo = function(x) {
						console.log("foo");
						x();
						console.log("foo-end");
				}

				var fooMembrane = membrane.create(fooModule, "fooModule");
				fooMembrane.foo(function(){});
				fooMembrane.foo(function() {
					console.log("callback");
				});

			  assert.equal(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 2);	
			  assert.equal(membrane.functionCalls.get("fooModule.x@<mainContext>"), undefined);	// local functions and function passed as parameters are not wrapped
		});
	});

	describe('when creating a membrane around a module that accepts wrapped callback functions as parameters', function() {
		it('should account for the callback function call', function() {

				var fooModule = {};
				fooModule.foo = function(x) {
						console.log("foo");
						x();
						var y = x;
						console.log("foo-end");
						return y;
				}

				var barModule = {};
				barModule.bar = function() {
					console.log("callback");
				}

				var fooMembrane = membrane.create(fooModule, "fooModule");
				var barMembrane = membrane.create(barModule, "barModule");

				var z = fooMembrane.foo(barMembrane.bar); // barMembrane.bar returned and assigned to z
				z(); // // implicit call to barModule.bar
				barMembrane.bar();

			 assert.equal(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	
			 assert.equal(membrane.functionCalls.get("barModule.bar@<mainContext>"), 2);	
			 assert.equal(membrane.functionCalls.get("barModule.bar@fooModule.foo"), 1);	
		});
	});

	describe('when executing functions that are properties of the wrapped global object', function() {
		it('should account for function calls', function() {
			var g =  membrane.create(global, "global");
			g.console.log("log");

			assert.equal(membrane.functionCalls.get("global.console.log@<mainContext>"), 1);
		});
	});

	describe('when executing Function.prototype.toString in a wrapped module', function() {
		it('should execute the native toString function and ignore wrapped object', function() {
			var fooModule = {};
			fooModule.foo = Function.prototype.toString;

			var fooMembrane = membrane.create(fooModule, "fooModule");
			fooMembrane.foo();

			assert.equal(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	
		});
	});

	describe('when executing function using `this` reference', function() {
		it('should account for the function execution', function() {
			var fooModule = {};

			fooModule.foo = foo;
			fooModule.bar = function() {
				this.foo();
			}

			var fooMembrane = membrane.create(fooModule, "fooModule");
			fooMembrane.bar();
			fooMembrane.foo();

			assert.equal(membrane.functionCalls.get("fooModule.bar@<mainContext>"), 1);	
			assert.equal(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	// function call this.foo() is not supposed to be tracked

		});
	});

	describe('when executing function that is part of the module and exists inside an array of the module', function() {
		it('should account for the function execution', function() {
			var fooModule = {};

			fooModule.foo = foo;

			fooModule.bar = new Array();
			fooModule.bar.push(fooModule.foo);

			var fooMembrane = membrane.create(fooModule, "fooModule");
			fooMembrane.bar[0]();

			assert.equal(membrane.functionCalls.get("fooModule.bar.0@<mainContext>"), 1);	
			// assert.equal(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	// function calls of functions referenced in arrays are not tracked yet


		});
	});

	describe('when executing function that exists inside an array of the module', function() {
		it('should account for the function execution', function() {
			var fooModule = {};

			fooModule.bar = new Array();
			fooModule.bar.push(foo);

			var fooMembrane = membrane.create(fooModule, "fooModule");
			fooMembrane.bar[0]();

			assert.equal(membrane.functionCalls.get("fooModule.bar.0@<mainContext>"), 1);	
			// assert.equal(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	// function calls of functions referenced in arrays are not tracked yet

		});
	});

	describe('when executing function that exists inside an array of the module', function() {
		it('should account for the function execution', function() {
				var foo = function() { return "foo"; };
				var arr = [foo, 'b', 'c'];
				var obj = { arr: arr };
				var membraneObj = membrane.create(obj, "objModule");

				assert.ok(membraneObj.arr.filter(function(e) { return e == 'b'; }));
		});
	});

	describe('when executing function from the whitelist', function() {
		it('should return no error', function() {
			const date = new Date();
			const dateMembrane = membrane.create(date, "dateModule");
			assert.ok(dateMembrane.getDate());

	 	});
	}); 

	describe('when executing functions defined in the prototype of an object', function() {
		it('should track the function call', function() {
			var Glob = function(){};

			Glob.prototype._processReaddir = function (input) {
			  var self = this;
			  self._readdir(self, input);
			}

			Glob.prototype._readdir = function(self, input) {
			  self._processReaddir2(input);
			}

			Glob.prototype._processReaddir2 = function(input) {
			  console.log(input);
			}

			// creating object of type Glob
			var glob = new Glob();
			glob._processReaddir("test");

			// creating membrane around object of type Glob
			var membraneGlob = membrane.create(glob, "globModule");
			membraneGlob._processReaddir("test");

			assert.equal(membrane.functionCalls.get("globModule._processReaddir@<mainContext>"), 1);	
			assert.equal(membrane.functionCalls.get("globModule._readdir@globModule._processReaddir"), undefined);	// public functions should not be tracked if only used internally
			assert.equal(membrane.functionCalls.get("globModule._processReaddir2@globModule._readdir"), undefined);	// public functions should not be tracked if only used internally

	 	});
	}); 

	describe('when creating a membrane around a module that accepts wrapped callback functions defined as prototype functions in other objects', function() {
		it('should account for the function calls', function() {
				var fooModule = {};
				fooModule.foo = function(x) {
						console.log("foo");
						x();
						console.log("foo-end");
				}

				var barModule = {};
				barModule.bar = function() {
					console.log("callback");
				}

				var Glob = function(){};

				Glob.prototype._processReaddir = function (input) {
					var self = this;
				  self._readdir(self, input);
				}

				Glob.prototype._readdir = function(self, input) {
				  self._processReaddir2(input);
				}

				Glob.prototype._processReaddir2 = function(input) {
				  console.log(input);
				}
				// creating object of type Glob
				var glob = new Glob();
				glob._processReaddir("test");

				// // creating membrane around object of type Glob
				var fooMembrane = membrane.create(fooModule, "fooModule");
				var barMembrane = membrane.create(barModule, "barModule");
				var globMembrane = membrane.create(glob, "globModule");

				fooMembrane.foo(barMembrane.bar);
				globMembrane._processReaddir();
				barMembrane.bar();

			 assert.equal(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	
			 assert.equal(membrane.functionCalls.get("barModule.bar@<mainContext>"), 1);	
			 assert.equal(membrane.functionCalls.get("barModule.bar@fooModule.foo"), 1);	
			 // assert.equal(membrane.functionCalls.get("globModule._processReaddir@<mainContext>"), 1);	
		});
	});

	describe('when cloning a wrapped object', function() {
		it('should not change the behavior of the object', function() {
			var membraneFs = membrane.create(require('fs'), 'fs');
			function clone (obj) {
			  if (obj === null || typeof obj !== 'object')
			    return obj

			  if (obj instanceof Object)
			    var copy = { __proto__: obj.__proto__ }
			  else
			    var copy = Object.create(null);
			  
			  Object.getOwnPropertyNames(obj).forEach(function (key) {
			    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key))
			  });
			  return copy;
			}

			var membraneCopy = clone(membraneFs);
			membraneCopy.readdir("/Users/", function(err, items) {
			    for (var i=0; i<items.length; i++) {
			      console.log("file: " + items[i]);
			    }
			});
	 	});
	});  

	describe('when accessing non-configurable objects', function() {
		it('should return them unwrapped ', function() {
			var membraneFs = membrane.create(require('fs'), 'fs');
			assert.ok(membraneFs.constants);
	 	});
	});

	// extracted from delegate package (_fail.js)
	describe('when executing a wrapped module that receives a function as call back and executes it inside a try/catch block', function() {
		it('should..', function() {
			var membraneFailJS = membrane.create(function(exec) {
		     try {
		       return !!exec();
		     } catch(e){
		       return true;
		     }
  		}, "_fail.js");

			assert.ifError(membraneFailJS(function(){}));
		  assert.ifError(membraneFailJS(function(){ return false; }));
		  assert.ifError(membraneFailJS(function(){ return NaN; }));
		  assert.ifError(membraneFailJS(function(){ return null; }));
		  assert.ifError(membraneFailJS(function(){
			  return Object.defineProperty({}, 'a', { get: function(){ return 7; }}).a != 7;
			}));
		  assert.ok(membraneFailJS(function(){ return Infinity; }));
		  assert.ok(membraneFailJS(function(){ throw new Error(); }))
			assert.ok(membraneFailJS(function(){ return true; }));

			assert.equal(membrane.functionCalls.get("_fail.js@<mainContext>"), 8);	

	 	});
	});

	// extracted from delegate package (_descriptors.js)
	describe('when executing a wrapped module that receives a function as call back and executes it inside a try/catch block', function() {
		it('should..', function() {
			var membraneFailJS = membrane.create(function(exec) {
		     try {
		       return !!exec();
		     } catch(e){
		       return true;
		     }
  		}, "_fail.js");

			var descriptorMembrane = membrane.create(!membraneFailJS(function(){
			  return Object.defineProperty({}, 'a', { get: function(){ return 7; }}).a != 7;
			}), "_descriptor.js");

			assert.ok(descriptorMembrane);
			assert.equal(membrane.functionCalls.get("_fail.js@<mainContext>"), 1);	

	 	});
	});

	describe('when setting a new function on a wrapped object and executing it', function() {
		it('should account for the function call', function() {
			var foo = function(){ return "foo"; };
			var bar = function(){ return "bar"; };
			var objFoo = { 'foo' : foo };
			var objBar = { 'bar' : bar };

			var fooMembrane = membrane.create(objFoo, "fooModule");
			fooMembrane.bar = bar;

			fooMembrane.foo();
			fooMembrane.bar();

			var barMembrane = membrane.create(objBar, 'barModule');
			barMembrane.foo = fooMembrane.foo;

			barMembrane.foo();
			barMembrane.bar();

			assert.equal(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);
			assert.equal(membrane.functionCalls.get("fooModule.bar@<mainContext>"), 1);
			assert.equal(membrane.functionCalls.get("barModule.foo@<mainContext>"), 1);
			assert.equal(membrane.functionCalls.get("barModule.bar@<mainContext>"), 1);
	 	});
	});

	describe('when wrapping an object constructor and executing a function that exists in the object', function() {
		it('should account for the function call', function() {
			var Foo = function(){};
			Foo.prototype.foo = function(){ return "foo"; };

			var FooMembrane = membrane.create(Foo, "fooConstructorModule");
			
			var fooObj = new FooMembrane();
			fooObj.foo();

			assert.equal(membrane.functionCalls.get("fooConstructorModule@<mainContext>"), 1); // new (constructor)
			assert.equal(membrane.functionCalls.get("fooConstructorModule.foo@<mainContext>"), 1); // function call

	 	});
	});
});

describe('Membrane utils tests', function() {

	describe('when checking if object is primitive', function() {
		it('should return true for integers, booleans, strings, NaN, undefined, null, and Infinity and false otherwise', function() {
			assert.ok(membrane.isPrimitive(null));
			assert.ok(membrane.isPrimitive(undefined));
			assert.ok(membrane.isPrimitive(1));
			assert.ok(membrane.isPrimitive('foo'));
			assert.ok(membrane.isPrimitive(true));
			assert.ok(membrane.isPrimitive(false));
			assert.ok(membrane.isPrimitive(NaN));
			assert.ok(membrane.isPrimitive(Infinity));

			assert.equal(membrane.isPrimitive({}), false);
			assert.equal(membrane.isPrimitive([]), false);
			assert.equal(membrane.isPrimitive(/./), false);
			assert.equal(membrane.isPrimitive(global), false);
			assert.equal(membrane.isPrimitive(function() {}), false);
			assert.equal(membrane.isPrimitive(new function() {}), false);
			assert.equal(membrane.isPrimitive(new Number), false);
			assert.equal(membrane.isPrimitive(new String), false);
			assert.equal(membrane.isPrimitive(new Boolean), false);
			assert.equal(membrane.isPrimitive(new Date), false);
			assert.equal(membrane.isPrimitive(new Error), false);
			assert.equal(membrane.isPrimitive(Object.create(null)), false);
		});
	});
});
