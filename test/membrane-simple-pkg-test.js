// var assert = require('assert');
// var membrane = require('../membrane');

// describe('Membrane tests [on simple packages]', function() {

// 	describe('when wrapping a module that does not require other packages and executing its functions', function() {
// 		it('should not contain cross-membrane function calls', function() {
// 			var membraneLeftPad = membrane.create(require('left-pad'), "leftPad");
// 			membraneLeftPad('foo', 5);;
// 			membraneLeftPad('foobar', 6);
// 			membraneLeftPad(1, 2, '0');
// 			membraneLeftPad(17, 5, 0);

// 			console.log(membrane.functionCalls.get("leftPad@<mainContext>"));
// 			assert.equal(membrane.functionCalls.get("leftPad@<mainContext>"), 4);	
// 		});
// 	});
// });