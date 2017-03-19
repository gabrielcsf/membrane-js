var assert = require('assert');
var membrane = require('../membrane');

describe('when creating a membrane around a function', function() {
	it('should transparently return a wrapped function', function() {
			var foo = function(){ return "foo"; };
			var wrappedFunc = membrane.create(foo);
			assert.equal(typeof wrappedFunc, 'function'); // types are kept the same
			assert.notEqual(foo, wrappedFunc); // original instance and proxy are different objects
			assert.equal(foo(), wrappedFunc()); // equal results
		});
});


describe('when creating a membrane around an object that contains a function', function() {
		it('should transparently return a membrane wrapping the object and the internal function', function() {
			var foo = function(){ return "foo"; };
			var obj = { 'foo' : foo };

			var wrappedObj = membrane.create(obj);
			assert.equal(typeof wrappedObj, 'object'); // types are kept the same
			assert.notEqual(obj, wrappedObj); // original instance and proxy are different objects
			assert.notEqual(obj.foo, wrappedObj.foo); // original instance and proxy are different objects

			assert.equal(obj.foo(), wrappedObj.foo()); // equal results
	});
});

describe('when creating a membrane around a function', function() {
	it('should transparently return a wrapped function', function() {
		var foo = function(){ return "foo"; };
		var fooMembrane = membrane.create(foo);

		assert.equal(typeof fooMembrane, 'function'); // types are kept the same
		assert.notEqual(foo, fooMembrane); // original instance and proxy are different objects

		assert.equal(foo(), fooMembrane()); // equal results
	});
});

describe('when something', function() {
	it('should something', function() {
		var foo = function(){ 
			var x=function(){return 4;}
			x();
			return "foo"; 
		};
		var bar = membrane.create({a:function() { return 3; }}, "bar")
	});
});

describe('proxy around fs', function() {
	it('should something', function() {
		var fs = membrane.create(require("fs"),"fs")

		fs.readdir("/Users/gferreir/workspaces/jate", function(err, items) {
			for (var i=0; i<items.length; i++) {
				//console.log(" >>>" + items[i]);
			}
		});
	});
});

describe('proxy around fs', function() {
	it('should something', function() {
		var foo = function(){return "foo";};
		var bar = membrane.create({a:function() { return 3; }}, "bar");
		var x = { 'foo' : foo };
		var y = { 'x' : x };
		var yMembrane = membrane.create(y,"y");
		var dryX = yMembrane.x;

		console.log(yMembrane.x.foo());
		console.log(dryX.foo());
		console.log(bar.a());
	});
});