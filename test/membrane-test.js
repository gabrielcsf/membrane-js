var assert = require('assert');
var membrane = require('../membrane');

describe('Membrane Tests', function() {

	var foo;

	beforeEach(function() {
		// initializers
		membrane.functionCalls = new Map(); 
	});

	describe('when creating a membrane around a function', function() {
		it('should transparently return a wrapped function', function() {
				foo = function(){ return "foo"; };
				var wrappedFunc = membrane.create(foo, "foo");
				assert.equal(typeof wrappedFunc, 'function'); // types are kept the same
				assert.notEqual(foo, wrappedFunc); // original instance and proxy are different objects
				assert.equal(foo(), wrappedFunc()); // equal results
			});
	});


	describe('when creating a membrane around an object that contains a function', function() {
			it('should transparently return a membrane wrapping the object and the internal function', function() {
				foo = function(){ return "foo"; };
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
		it('should account for both function calls', function() {
			var x = { 'foo' : foo };
			var y = { 'x' : x };

			var yMembrane = membrane.create(y, "y");
			var dryX = yMembrane.x;

			yMembrane.x.foo();
			dryX.foo();

			assert(membrane.functionCalls.get("y.x.foo@<mainContext>"), 2);	
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

			assert(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	
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

			assert(membrane.functionCalls.get("testModule.execute@<mainContext>"), 1);	
			assert(membrane.functionCalls.get("fs.readdir@testModule.execute"), 1);	
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

			  assert(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	
			  assert.strictEqual(membrane.functionCalls.get("fooModule.x@<mainContext>"), undefined);	// currently, callback functions are not wrapped
		});
	});

	describe('when creating a membrane around a module that accepts wrapped callback functions as parameters', function() {
		it('should account for the callback function call', function() {

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

				var fooMembrane = membrane.create(fooModule, "fooModule");
				var barMembrane = membrane.create(barModule, "barModule");


				fooMembrane.foo(barMembrane.bar);
				barMembrane.bar();

			 assert(membrane.functionCalls.get("fooModule.foo@<mainContext>"), 1);	
			 assert(membrane.functionCalls.get("barModule.bar@<mainContext>"), 1);	
			 assert(membrane.functionCalls.get("barModule.bar@fooModule.foo"), 1);	
		});
	});

	describe('when executing functions that are properties of the wrapped global object', function() {
		it('should account for function calls', function() {
			var g =  membrane.create(global, "global");
			g.console.log("test");

			assert(membrane.functionCalls.get("global.console.log@<mainContext>"), 1);
		});
	});

});