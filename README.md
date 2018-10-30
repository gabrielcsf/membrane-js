# Node.js package that implements the membrane pattern with ES6 Proxies
### DISCLAIMER: I was the only one working in this project and it had a very experimental nature. 

The purpose of this project was to implement a mechanism to monitor runtime interactions between JavaScript objects. The membrane pattern enables one to wrap objects and track access to their properties. The implementation of the pattern uses ES6 Proxies (and default traps) to intercept operations such as get, set, setProperty, and others in JavaScript objects. In summary, the implementation involves checking for certain properties when functions are called (i.e., when the *apply* trap is used) and ensuring that the code wrap and unwrap objects before calling function or native objects (i.e., when *get* and other similar traps are used).

A membrane implementation allow us to monitor interactions (i.e., function calls) between libraries imported through the *require* function. All imported objects that represent libraries are wrapped before *require*. Then, when a function is called from one object representing a library (callee) is called by a object representing another library (caller) we can identify cross-membrane function calls.

We later discarded the use of the membrane for two reasons:

* ES6 Proxies are not completely transparent in JavaScript. That is, the use of Proxy objects can alter the behavior of JavaScript programs. For example, the identity of objects do not hold after they are proxied (Proxies are exotic objects, which are a different from plain object in JavaScript). This could be potentially mitigated with code re-writing on the user side, but I have not explored this option.

* We understood that the membrane implementation could not provide security guarantees that justify its performance overhead (approx. 20%, as described in the paper that I submitted to IEEE S&P). *

## Installation ##

Run 'npm install' on the root directory to download all dependencies.

## Running tests ##

Run 'npm test' to run all tests in the test directory.
