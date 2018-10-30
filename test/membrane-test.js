var assert = require('assert');
var membrane = require('../membrane');

describe('Membrane tests', function() {
	beforeEach(function() {
		// initializers
		membrane.functionCalls = new Map(); 
		membrane.permissions = new Map();
	});

	describe('when creating a membrane around a function', function() {
		it('should transparently return a wrapped function', function() { 
				var foo = function(){ return "foo"; };
				var wrappedFunc = membrane.create(foo, "foo");//
				assert.equal(typeof wrappedFunc, 'function'); // types are kept the same
				assert.notEqual(foo, wrappedFunc); // original instance and proxy are different objects
				assert.equal(foo(), wrappedFunc()); // equal results
			});
	});

	describe('when creating a membrane around an object that contains a function', function() {
			it('should transparently return a membrane wrapping the object and the internal function', function() {
				var foo = function(){ return "foo"; };
				var obj = { 'foo' : foo };
				var wrappedObj = membrane.create(obj, "foo");

				assert.equal(typeof wrappedObj, 'object'); // types are kept the same
				assert.equal(typeof wrappedObj, typeof obj); // types are kept the same
				assert.notEqual(obj, wrappedObj); // original instance and proxy are different objects
				// assert.notEqual(obj.foo, wrappedObj.foo); // original instance properties and proxy properties are different objects

				assert.equal(obj.foo(), wrappedObj.foo()); // equal results
		});
	});

	describe('when creating a membrane around an object that contains a function that returns an object', function() {
			it('should return a membrane wrapping the object, the internal function, and the return object', function() {
				var foo = function(obj){ return obj; };
				var obj = { 'foo' : foo };
				var wrappedObj = membrane.create(obj, "fooModule");
				var test = { a : "a" };

				wrappedObj.foo(test);
		});
	});


describe('when creating a membrane around an object that contains a function that returns an object that is a function', function() {
			it('should return a membrane wrapping the object, the internal function, and the return object (allowing it to be called)', function() {
				var foo = function(obj){ return obj; };
				var bar = function(){ console.log("bar"); return null;};
				var obj = { 'foo' : foo };
				var wrappedObj = membrane.create(obj, "fooModule");
				var test = { 'bar' : bar };

				wrappedObj.foo(test).bar();
		});
	});

	/*
	 * Extracted from minimatch package 
	 * (wrapping an empty object and comparing it with the '===' operator breaks code semantics) 
	 */
	describe('when wrapping an empty object', function() {
		it('should transparently', function() {
		  var minimatch = function(){};
			var Minimatch = new function(){};

			minimatch.Minimatch = Minimatch
			var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {};

			var membraneMinimatch = membrane.create(minimatch, 'minimatchModule');
			var membraneMinimatch2 = membrane.create(minimatch, 'minimatchModule');

			assert.equal(minimatch.GLOBSTAR, minimatch.GLOBSTAR);
			assert.equal(Minimatch.GLOBSTAR, minimatch.GLOBSTAR);
			assert.notEqual(membraneMinimatch.GLOBSTAR, membraneMinimatch.GLOBSTAR); // should be handled with code re-writing (maybe???)
			assert.notEqual(membraneMinimatch.GLOBSTAR, membraneMinimatch2.GLOBSTAR); // should be handled with code re-writing (maybe???)
			assert.notEqual(minimatch.GLOBSTAR, membraneMinimatch.GLOBSTAR); // should be handled with code re-writing
		});
	});

	describe('when wrapping an object, copying it to a dry object, and executing function foo in both', function() {
		it('should account for both function calls', function() {
			var foo = function(){ return "foo"; };
			var x = { 'foo' : foo };
			var y = { 'x' : x };

			var yMembrane = membrane.create(y, "y");
			var dryX = yMembrane.x;

			yMembrane.x.foo();
			dryX.foo();

			assert.equal(membrane.functionCalls.get("y.x.foo@(mainFunction)"), 2);	
		});
	});

	describe('when wrapping a module that contains a recursive function', function() {
			it('should account for just one function call', function() {
				var recursiveFoo = function(list) { 
          if (list.length == 0) {
            return;
          }
          console.log(list[0]);
          return recursiveFoo(list.slice(1));
        }
        var fruits = ["Banana", "Orange", "Apple", "Mango"];

        var obj = { 'foo' : recursiveFoo };
        var wrappedObj = membrane.create(obj, "fooModule");

				assert.equal(typeof wrappedObj, 'object'); // types are kept the same
				assert.notEqual(obj, wrappedObj); // original instance and proxy are different objects
				assert.notEqual(obj.foo, wrappedObj.foo); // original instance and proxy are different objects
				assert.equal(obj.foo(fruits), wrappedObj.foo(fruits)); // equal results

				assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), 1);	

		});
	});

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
			assert.equal(membrane.functionCalls.get("testModule.execute@(mainFunction)"), 1);	
		});
	});

	describe('when wrapping a module that has properties binded to C code', function() {
		it('should not ', function() {
			var membraneOS = membrane.create(require('os'), "osModule");
			console.log(membraneOS.type());

			assert.equal(membrane.functionCalls.get("osModule.type@(mainFunction)"), 1);	
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

			assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), 1);	
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

			assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), 1);	
			assert.equal(membrane.functionCalls.get("fooModule.x@(mainFunction)"), undefined);	// local functions and function passed as parameters are not wrapped
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

			assert.equal(membrane.functionCalls.get("testModule.execute@(mainFunction)"), 1);	
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

			  assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), 2);	
			  assert.equal(membrane.functionCalls.get("fooModule.x@(mainFunction)"), undefined);	// local functions and function passed as parameters are not wrapped
		});
	});

	describe('when creating a membrane around a module that accepts wrapped callback functions as parameters', function() {
		it('should account for the callback function call', function() {
			var mainModule = {};
			mainModule.main = function() {

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

			var z = fooMembrane.foo(barMembrane.bar); // barMembrane.bar executed inside foo, returned as function, and assigned to z
			z(); // // implicit call to barModule.bar
			barMembrane.bar();
		 };
		 var mainMemebrane = membrane.create(mainModule, "mainModule");
		 mainMemebrane.main();

		 assert.equal(membrane.functionCalls.get("fooModule.foo@mainModule.main"), 1);	
		 assert.equal(membrane.functionCalls.get("barModule.bar@fooModule.foo"), 1);	
		 assert.equal(membrane.functionCalls.get("barModule.bar@mainModule.main"), 2);	
		});
	});

	describe('when calling a wrapped function passed as argument to another module', function() {
		it('should account for the function call in the right context ', function() {
	    
		var httpMembrane = membrane.create(require('http'), "httpModule");
		
		var barModule = {};
		barModule.bar = function(func) {
		  func();
		}
		var barMembrane = membrane.create(barModule, "barModule");

		var fooModule= {};
		fooModule.run = function() {
		  barMembrane.bar(this.send);
		};

		fooModule.send = function(data) {
		  httpMembrane.get('http://www.google.com/?' + data);
		};
		var fooMembrane = membrane.create(fooModule, "fooModule");
		// http.get will be executed inside the module bar ctx, although it is executed by a function from module foo (passed as argument to bar)
		fooMembrane.run(); 

			assert.equal(membrane.functionCalls.get("fooModule.run@(mainFunction)"), 1);
			assert.equal(membrane.functionCalls.get("barModule.bar@fooModule.run"), 1);
			assert.equal(membrane.functionCalls.get("fooModule.(anonymousFunction)@barModule.bar"), 1);
			assert.equal(membrane.functionCalls.get("httpModule.get@fooModule.(anonymousFunction)"), 1);
		});
	});

	describe('when calling a wrapped function passed as argument to another module and returned by another one', function() {
		it('should account for the function call in the right context ', function() {
			var httpMembrane = membrane.create(require('http'), "httpModule");
			var bazModule= {};
			bazModule.baz = function(func) {
			  func();
			};
			var bazMembrane = membrane.create(bazModule, "bazModule");

			var barModule = {};
			barModule.bar = function(func) {
			  return func;
			};
			var barMembrane = membrane.create(barModule, "barModule");

			var fooModule= {};
			fooModule.run = function() {
			  bazMembrane.baz(barMembrane.bar(this.send));
			};

			fooModule.send = function(data) {
			  httpMembrane.get('http://www.google.com/?' + data);
			};

			var fooMembrane = membrane.create(fooModule, "fooModule");
			fooMembrane.run();

			assert.equal(membrane.functionCalls.get("fooModule.run@(mainFunction)"), 1);
			assert.equal(membrane.functionCalls.get("barModule.bar@fooModule.run"), 1);
			assert.equal(membrane.functionCalls.get("bazModule.baz@fooModule.run"), 1);
			assert.equal(membrane.functionCalls.get("fooModule.(anonymousFunction)@bazModule.baz"), 1);
			assert.equal(membrane.functionCalls.get("httpModule.get@fooModule.(anonymousFunction)"), 1);

		});
	});

	describe('when calling a wrapped function passed as argument to another module and returned by another one', function() {
		it('should account for the function call in the right context ', function() {
			var httpMembrane = membrane.create(require('http'), "httpModule");
			var bazModule= {};
			bazModule.baz = function(func) {
			  func();
			};
			var bazMembrane = membrane.create(bazModule, "bazModule");

			var barModule = {};
			barModule.bar = function(func) {
			  return func;
			};
			var barMembrane = membrane.create(barModule, "barModule");

			var fooModule= {};
			fooModule.run = function() {
			  bazMembrane.baz(barMembrane.bar(this.send));
			};

			fooModule.send = function(data) {
			  httpMembrane.get('http://www.google.com/?' + data);
			};

			var fooMembrane = membrane.create(fooModule, "fooModule");
			fooMembrane.run();
			fooMembrane.send();

			assert.equal(membrane.functionCalls.get("fooModule.run@(mainFunction)"), 1);
			assert.equal(membrane.functionCalls.get("barModule.bar@fooModule.run"), 1);
			assert.equal(membrane.functionCalls.get("bazModule.baz@fooModule.run"), 1);
			assert.equal(membrane.functionCalls.get("fooModule.(anonymousFunction)@bazModule.baz"), 1);
			assert.equal(membrane.functionCalls.get("httpModule.get@fooModule.(anonymousFunction)"), 1);
			assert.equal(membrane.functionCalls.get("fooModule.send@(mainFunction)"), 1);
			assert.equal(membrane.functionCalls.get("httpModule.get@fooModule.send"), 1);
		});
	});

	describe('when calling a module function to indirectly have access its capabilities (e.g, http) through a return value', function() {
		it('should account for the function call in the correct context', function() {
	   
	  // does not have http capabilities  
		var bModule = {};
		bModule.foo = function(func, data) {
		  var f = func();
		  f('http://www.google.com/?' + data);
		}
		var bMembrane = membrane.create(bModule, "bModule");

	  // has http capabilities  
		var aModule= {};
		aModule.a = function() {
		  var httpMembrane = membrane.create(require('http'), "httpModule");
		  return httpMembrane.get;
		};
		var aMembrane = membrane.create(aModule, "aModule");

		// in this case, the function call to httpModule should be blocked because bModule does not have http capabilities  
		bMembrane.foo(aMembrane.a, "secret"); 

		assert.equal(membrane.functionCalls.get("bModule.foo@(mainFunction)"), 1);
		assert.equal(membrane.functionCalls.get("aModule.a@bModule.foo"), 1);
		assert.equal(membrane.functionCalls.get("httpModule.get@bModule.foo"), 1);
		});
	});

	describe('when calling a module function to indirectly have access its capabilities (e.g, http)', function() {
		it('should account for the function call in the module that is used indirectly', function() {

	  // does not have http capabilities  
		var bModule = {};
		bModule.foo = function(func, data) {
		  func(data);
		}
		var bMembrane = membrane.create(bModule, "bModule");

		// has http capabilities  
		var aModule= {};
		aModule.a = function(data) {
		  var httpMembrane = membrane.create(require('http'), "httpModule");
		  httpMembrane.get('http://www.google.com/?' + data);
		};
		var aMembrane = membrane.create(aModule, "aModule");

		// in this case, the function call to httpModule will not be blocked because the call comes indirectly through aModule
		bMembrane.foo(aMembrane.a, "secret"); 

		assert.equal(membrane.functionCalls.get("bModule.foo@(mainFunction)"), 1);
		assert.equal(membrane.functionCalls.get("aModule.a@bModule.foo"), 1);
		assert.equal(membrane.functionCalls.get("httpModule.get@aModule.a"), 1);
	
		});
	});


	describe('when executing functions that are properties of the wrapped global object', function() {
		it('should account for function calls', function() {
			var g =  membrane.create(global, "global");
			g.console.log("log");

			assert.equal(membrane.functionCalls.get("global.console.log@(mainFunction)"), 1);
		});
	});

	describe('when executing Function.prototype.toString in a wrapped module', function() {
		it('should execute the native toString function and ignore wrapped object', function() {
			var fooModule = {};
			fooModule.foo = Function.prototype.toString;

			var fooMembrane = membrane.create(fooModule, "fooModule");
			console.log(fooMembrane.foo);
			assert.ok(Function.prototype.toString.call(fooMembrane.foo));
			assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), undefined);	
		});
	});

	describe('when executing function using `this` reference', function() {
		it('should account for the function execution', function() {
			var foo = function(){ return "foo"; };

			var fooModule = {};
			fooModule.foo = foo;

			fooModule.bar = function() {
				this.foo();
			}

			var fooMembrane = membrane.create(fooModule, "fooModule");
			fooMembrane.bar();
			fooMembrane.foo();

			assert.equal(membrane.functionCalls.get("fooModule.bar@(mainFunction)"), 1);	
			assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), 1);	// function call this.foo() is not supposed to be tracked

		});
	});

	describe('when executing function that is part of the module and exists inside an array of the module', function() {
		it('should account for the function execution', function() {
			var foo = function(){ return "foo"; };
			var fooModule = {};
			fooModule.foo = foo;

			fooModule.bar = new Array();
			fooModule.bar.push(fooModule.foo);

			var fooMembrane = membrane.create(fooModule, "fooModule");
			fooMembrane.bar[0]();

			assert.equal(membrane.functionCalls.get("fooModule.bar.0@(mainFunction)"), 1);	
		});
	});

	describe('when executing function that exists inside an array of a wrapped module', function() {
		it('should account for the function execution', function() {
			var foo = function(){ return "foo"; };
			var fooModule = {};
			fooModule.foo = foo;
			var fooMembrane = membrane.create(fooModule, "fooModule");

			var barModule = {};
			barModule.bar = new Array();
			barModule.bar.push(fooMembrane.foo);

			var barMembrane = membrane.create(barModule, "barModule");
			barMembrane.bar[0]();

			assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), 1);	
		});
	});

	describe('when executing native functions from the Array builtin object', function() {
		it('should behave transparently', function() {
				var foo = function() { return "foo"; };
				var arr = [foo, 'b', 'c'];
				var obj = { arr: arr };
				var membraneObj = membrane.create(obj, "objModule");

				var compare = function(e) { 
					return e == 'b'; 
				};

				var arr = membraneObj.arr.filter(compare);
				console.log(arr);

				assert.ok(membraneObj.arr.filter(compare));
		});
	});

	describe('when executing function from the whitelist', function() {
		it('should return no error', function() {
			const date = new Date();
			const dateMembrane = membrane.create(date, "dateModule");
			assert.ok(dateMembrane.getDate());

			assert.equal(membrane.functionCalls.get("dateModule.getDate@(mainFunction)"), 1);	
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

			console.log(membrane.functionCalls);
			assert.equal(membrane.functionCalls.get("globModule._processReaddir@(mainFunction)"), 1);	
			// assert.equal(membrane.functionCalls.get("globModule._readdir@globModule._processReaddir"), 1);	// direct reference to this helps function to be tracked
			// assert.equal(membrane.functionCalls.get("globModule._processReaddir2@globModule._readdir"), 1);	// TODO: fix
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

			 assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), 1);	
			 assert.equal(membrane.functionCalls.get("barModule.bar@(mainFunction)"), 1);	
			 assert.equal(membrane.functionCalls.get("barModule.bar@fooModule.foo"), 1);	
			 // assert.equal(membrane.functionCalls.get("globModule._processReaddir@(mainFunction)"), 1);	
		});
	});

	describe('when cloning a wrapped object', function() {
		it('should not change the behavior of the object', function() {
			var membraneFs = membrane.create(require('fs'), 'fs');
			membraneFs.readdir("/Users/", function(err, items) {
			    for (var i=0; i<items.length; i++) {
			      console.log("file: " + items[i]);
			    }
			});

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
			// assert.equal(membrane.functionCalls.get("fs.readdir@(mainFunction)"), 2);	// TODO: finish implementation of getOwnPropertyDescriptor trap

	 	});
	});  

	describe('when setting non-configurable properties to objects and accessing them', function() {
		it('should return them unwrapped ', function() {
			var obj = {};
			var constants = ['a', 'b', 'c'];
			Object.defineProperty(obj, 'constants', {configurable:false, writable:false, value: constants, enumerable:true});

			var membraneObj = membrane.create(obj, "obj");
			var objDesc = Object.getOwnPropertyDescriptor(membraneObj, 'constants');
			assert.ok(membraneObj.constants);

			var membraneFs = membrane.create(require('fs'), 'fs');
			assert.ok(membraneFs.constants);
	 	});
	});


	describe('when setting wrapped non-configurable properties to objects and accessing them', function() {
		it('should execute it transparently', function() {
			var obj = {};
			var membraneObj = membrane.create(obj, "obj");

			var constants = ['a', 'b', 'c'];
			var membraneConstants = membrane.create(constants, "constants");

			Object.defineProperty(obj, 'constants', {configurable:false, writable:false, value: membraneConstants, enumerable:true});
			Object.defineProperty(membraneObj, 'constants', {configurable:false, writable:false, value: membraneConstants, enumerable:true});

			assert.ok(obj.constants);
			assert.ok(membraneObj.constants);
	 	});
	});

	// extracted from delegate package (_fail.js)
	describe('when executing a wrapped module that receives a function as call back and executes it inside a try/catch block (_fail.js)', function() {
		it('should..', function() {
			var membraneFailJS = membrane.create(function(exec) {
		     try {
		       return !!exec();
		     } catch(e){
		       return true;
		     }
  		}, "_fail.js", ['(mainFunction)']);


			assert.ifError(membraneFailJS(function(){}));
		  assert.ifError(membraneFailJS(function(){ return false; }));
		  assert.ifError(membraneFailJS(function(){ return NaN; }));
		  assert.ifError(membraneFailJS(function(){ return null; }));
		  assert.ifError(membraneFailJS(function(){ return Object.defineProperty({}, 'a', { get: function(){ return 7; }}).a != 7; }));
		  assert.ok(membraneFailJS(function(){ return Infinity; }));
			assert.ok(membraneFailJS(function(){ return true; }));
		  // assert.ok(membraneFailJS(function(){ throw new Error(); })) // TODO: investigate

		  console.log(membrane.functionCalls);
			assert.equal(membrane.functionCalls.get("_fail.js@(mainFunction)"), 7);
			assert.equal(membrane.functionCalls.get("(mainFunction).(anonymousFunction)@_fail.js"), 7);	
	
	 	});
	});

	// // extracted from delegate package (_descriptors.js)
	describe('when executing a wrapped module that receives a function as call back and executes it inside a try/catch block (_descriptors.js)', function() {
		it('should..', function() {
			var membraneFailJS = membrane.create(function(exec) {
		     try {
		       return !!exec();
		     } catch(e){
		       return true;
		     }
  		}, "_fail.js");


			var r = !membraneFailJS(function(){
			  return Object.defineProperty({}, 'a', { get: function(){ return 7; }}).a != 7;
			});
			var descriptorMembrane = membrane.create(r, "_descriptor.js");

			assert.ok(descriptorMembrane);
			console.log(membrane.functionCalls);
			assert.equal(membrane.functionCalls.get("_fail.js@(mainFunction)"), 1);	
			assert.equal(membrane.functionCalls.get("(mainFunction).(anonymousFunction)@_fail.js"), 1);	

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

			var barMembrane = membrane.create(objBar, "barModule");
			barMembrane.foo = fooMembrane.foo;

			barMembrane.foo();
			barMembrane.bar();

			console.log(membrane.functionCalls);

			assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), 2);
			assert.equal(membrane.functionCalls.get("fooModule.bar@(mainFunction)"), 1);
			assert.equal(membrane.functionCalls.get("barModule.bar@(mainFunction)"), 1);
	 	});
	});

	describe('when wrapping an object constructor and executing a function that exists in the prototype of the object', function() {
		it('should account for the function call', function() {
			var Foo = function(){};
			Foo.prototype.foo = function(){ return "foo"; };

			var FooMembrane = membrane.create(Foo, "fooModule");
			
			var fooObj = new FooMembrane();
			fooObj.foo();

			console.log(membrane.functionCalls);
			assert.equal(membrane.functionCalls.get("fooModule@(mainFunction)"), 1); // new (constructor)
			assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), 1); // function call

	 	});
	});

	describe('when wrapping an object constructor and executing a callback function passed as a parameter', function() {
		it('should account for the function call', function() {
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

				var z = fooMembrane.foo(barMembrane.bar); // call to barMembrane.bar by fooModule.foo (barMembrane.bar returned and assigned to z)
				z();  // implicit call to barModule.bar
				barMembrane.bar(); // explicit call to barModule.bar

			 assert.equal(membrane.functionCalls.get("fooModule.foo@(mainFunction)"), 1);	
			 assert.equal(membrane.functionCalls.get("barModule.bar@fooModule.foo"), 1);	
			 assert.equal(membrane.functionCalls.get("barModule.bar@(mainFunction)"), 2);	
	 	});
	});

	describe('when wrapping an object constructor and executing a callback function passed as a parameter', function() {
		it('should account for the function call', function() {

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

			var bazModule = {};
			bazModule.baz = function(x) { return x; };

			bazModule.main = function() {
			    var fooMembrane = membrane.create(fooModule, "fooModule");
			    var barMembrane = membrane.create(barModule, "barModule");

			    var w = bazModule.baz(barMembrane.bar);
			    var z = fooMembrane.foo(w); 
			    z(); // implicit call to barModule.bar
			    w(); // another implicit call to barModule.bar
			}
			var bazMemebrane = membrane.create(bazModule, "bazModule");
			bazMemebrane.main();

			 assert.equal(membrane.functionCalls.get("fooModule.foo@bazModule.main"), 1);	
			 assert.equal(membrane.functionCalls.get("barModule.bar@fooModule.foo"), 1);	
			 assert.equal(membrane.functionCalls.get("barModule.bar@bazModule.main"), 2);	
	 	});
	});

	describe('when wrapping an object constructor and executing a callback function passed as a parameter', function() {
		it('should account for the function call', function() {

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

			    var w = bazModule.baz(barMembrane.barrr);
			    var z = fooMembrane.foo(w); 
			    z(); // implicit call to barModule.bar
			    w(); // another implicit call to barModule.bar
			}
			var bazMembrane = membrane.create(bazModule, "bazModule");
			bazMembrane.main();

			 assert.equal(membrane.functionCalls.get("fooModule.foo@bazModule.main"), 1);	
			 assert.equal(membrane.functionCalls.get("barModule.barrr@bazModule.main"), 3);	
			 assert.equal(membrane.functionCalls.get("barModule.barrr@fooModule.foo"), 1);	
	 	});
	});

describe('when wrapping setTimeout', function() {
		it('should execute it transparently and should not account for the function call because it is whitelisted', function() {
			var foo = function() { console.log("foo"); };
			var fooMembrane = membrane.create(foo, "fooModule");
			fooMembrane(); // explicit call to foo()

			var setTimeoutMembrane = membrane.create(setTimeout, "setTimeoutModule");
			setTimeoutMembrane(function(){ fooMembrane(); }, 1000);  // implict call to foo()

			assert.equal(membrane.functionCalls.get("setTimeoutModule.setTimeout@(mainFunction)"), undefined);	
			assert.equal(membrane.functionCalls.get("fooModule@(mainFunction)"), 1); // implicit call to foo()

	 	});
	});

describe('when wrapping an object Promise', function() {
		it('should execute it transparently', function() {

			let myPromise = new Promise((resolve, reject) => {
			  setTimeout(function(){
			    resolve("Success!"); // Yay! Everything went well!
			  }, 3000);
			});

			var promiseMembrane = membrane.create(myPromise, "myPromiseModule");

			promiseMembrane.then((successMessage) => {
			  console.log("Yay! " + successMessage);
			});

	 	});
	});

describe('when wrapping an native object constructor', function() {
	it('should execute it transparently', function() {
			// Date, Object, String, Number, Boolean, RegExp, Error, Promise, Function

			membraneNativeObject = membrane.create(Date, "membraneNativeObjectModule");
			assert.ok(new membraneNativeObject);

			membraneNativeObject = membrane.create(Object, "membraneNativeObjectModule");
			assert.ok(new membraneNativeObject);

			var membraneNativeObject = membrane.create(String, "membraneNativeObjectModule");
			assert.ok(new membraneNativeObject);

			membraneNativeObject = membrane.create(Number, "membraneNativeObjectModule");
			assert.ok(new membraneNativeObject);

			membraneNativeObject = membrane.create(Boolean, "membraneNativeObjectModule");
			assert.ok(new membraneNativeObject);	 

			membraneNativeObject = membrane.create(RegExp, "membraneNativeObjectModule");
			assert.ok(new membraneNativeObject("/(?:)/"));

			membraneNativeObject = membrane.create(Error, "membraneNativeObjectModule");
			assert.ok(new membraneNativeObject("errorMsg"));

			membraneNativeObject = membrane.create(Uint32Array, "membraneNativeObjectModule");
			assert.ok(new membraneNativeObject);

			membraneNativeObject = membrane.create(Promise, "membraneNativeObjectModule");
			assert.ok(new membraneNativeObject((resolve,reject)=>{}));

			membraneNativeObject = membrane.create(Function, "membraneNativeObjectModule");
			assert.ok(new membraneNativeObject);
		});
	});

	describe('when trying to execute a function from fs (for which it does not have permission) that was returned by another module', function() {
		it('fooModule should be interruputed', function() {
		var fooModule = {};
		fooModule.foo = function(x) {
		  var y = x();
		  y.readdir("/Users", function(err, items) {
		      for (var i=0; i<items.length; i++) {
		        console.log("file: " + items[i]);
		      }
		  });
		}

		var barModule = {};
		barModule.bar = function() {
		  
		  return fsMembrane;
		}

		var fsMembrane = membrane.create(require("fs"), "fs", ["fs"]);
		var fooMembrane = membrane.create(fooModule, "fooModule", ["barModule"]);
		var barMembrane = membrane.create(barModule, "barModule", ["fs"]);

		var bazModule = {};
		bazModule.main = function() {
		    fooMembrane.foo(barMembrane.bar); 
		}
		var bazMembrane = membrane.create(bazModule, "bazModule", ["fooModule"]);
		bazMembrane.main();
		// assert.throws(function() { bazMembrane.main() }, Error);

	});
  });

	describe('when trying to execute a function from fs that was returned by another module', function() {
		it('fooModule should execute normally', function() {
		var fooModule = {};
		fooModule.foo = function(x) {
		  var y = x();
		  y.readdir("/Users", function(){});
		}

		var barModule = {};
		barModule.bar = function() {
		  var fsMembrane = membrane.create(require("fs"), "fs", []);
		  return fsMembrane;
		}

		var bazModule = {};
		bazModule.main = function() {
				var fooMembrane = membrane.create(fooModule, "fooModule", ["barModule", "fs"]);
				var barMembrane = membrane.create(barModule, "barModule", []);
		    fooMembrane.foo(barMembrane.bar); 
		}
		var bazMembrane = membrane.create(bazModule, "bazModule", ["fooModule"]);
		bazMembrane.main();
		// assert.doesNotThrow(function() { bazMembrane.main() }, Error);

	});
  });

});


describe('Membrane utils tests', function() {

	describe('when checking if object is wrapped', function() {
		it('should return true if object was found on map', function() {

			var foo = function(){ return "foo"; };

			var bar = function(){ return "bar"; };
			var objBar = { 'bar' : bar };

			var fooMembrane = membrane.create(foo, "fooModule");
			var barMembrane = membrane.create(objBar, 'barModule');

			assert.ifError(membrane.isProxy(foo));
			assert.ifError(membrane.isProxy(objBar));
			assert.ok(membrane.isProxy(fooMembrane));
			assert.ok(membrane.isProxy(barMembrane));
		});
	});

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
			assert.equal(membrane.isPrimitive(new ArrayBuffer), false);
			assert.equal(membrane.isPrimitive(Object.create(null)), false);
		});
	});
});
