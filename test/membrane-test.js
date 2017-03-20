var assert = require('assert');
var membrane = require('../membrane');

describe('Membrane Tests', function() {

	var foo;

	beforeEach(function() {
		// initializers
		membrane.functionCalls = new Map(); 
	  foo = function(){ return "foo"; };
	});

	describe('when creating a membrane around a function', function() {
		it('should transparently return a wrapped function', function() {
				var wrappedFunc = membrane.create(foo, "foo");
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

	describe('when creating a membrane around a function', function() {
		it('should transparently return a wrapped function', function() {
			var fooMembrane = membrane.create(foo, "foo");

			assert.equal(typeof fooMembrane, 'function'); // types are kept the same
			assert.notEqual(foo, fooMembrane); // original instance and proxy are different objects

			assert.equal(foo(), fooMembrane()); // equal results
		});
	});

	describe('when wrapping an object, copying it to a dry object, and executing function foo in both', function() {
		it('should count the function calls as being from the same wrapped object', function() {
			var x = { 'foo' : foo };
			var y = { 'x' : x };

			var yMembrane = membrane.create(y, "y");
			var dryX = yMembrane.x;

			yMembrane.x.foo();
			dryX.foo();

			assert(membrane.functionCalls.get("y.x.foo"), 2);	
		});
	});

	describe('when executing a function defined locally in a wrapped function', function() {
		it('should not account for local function calls', function() {
			var foo = function(){ 
				var x=function(){return 4;}
				x();
				return "foo"; 
			};
			var fooMembrane = membrane.create(foo, "foo");
			fooMembrane();

			assert(membrane.functionCalls.get("foo"), 1);	
		});
	});

	describe('when creating a membrane around a module that require the fs module', function() {
		it('should account for cross module function calls', function() {
			var module = {};
			module.execute = function() {
				var fs = membrane.create(require("fs"), "fs");
				fs.readdir("/Users/gferreir/workspaces/jate", function(err, items) {
					for (var i=0; i<items.length; i++) {
						//console.log("file: " + items[i]);
					}
				})
			};
			var m = membrane.create(module, "testModule");
			m.execute();

			assert(membrane.functionCalls.get("testModule.execute"), 1);	
			assert(membrane.functionCalls.get("fs.readdir"), 1);	
		});
	});

	describe('when creating a membrane around a module that require the fs module', function() {
		it('should account for cross module function calls', function() {
			var module = {};
			module.execute = function() {
				var fs = membrane.create({ 
					foo:function(x) {
						console.log("foo");
						x();
						console.log("foo-end");
					}
				}, "fooModule");
				fs.foo(function() {
					console.log("callback");
				})
			};
			var m = membrane.create(module, "testModule");
			m.execute();

			assert(membrane.functionCalls.get("testModule.execute"), 1);	
			assert(membrane.functionCalls.get("fooModule.foo"), 1);	
			assert(membrane.functionCalls.get("fooModule.x"), 1);	// currently, callback functions are not wrapped
		});
	});

	describe('when executing functions that are properties of the wrapped global object', function() {
		it('should account for function calls', function() {
			var g =  membrane.create(global, "global");
			g.console.log("test");

			assert(membrane.functionCalls.get("global.console.log"), 1);
		});
	});

});