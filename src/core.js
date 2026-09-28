/**
 * Creates a spy that wraps a function and records every invocation.
 *
 * Each record captures: the arguments array, the return value (or
 * `undefined` if the call threw), the thrown error (or `undefined` if it
 * did not), and a timestamp produced by the provided clock function.
 *
 * The clock is injected rather than read from `Date.now()` directly so
 * that tests can be fully deterministic. A test that depends on wall-clock
 * time is a test that fails on a slow machine.
 *
 * The spy preserves the wrapped function's `this` binding by using a real
 * method definition (so `super` works inside classes) and forwards all
 * arguments via `...args`. This means the spy is safe to use as a method
 * replacement on an existing object.
 *
 * @param {Function} fn - The function to wrap.
 * @param {() => number} [clock] - Returns the current time in ms. Defaults
 *   to `Date.now`. Inject a fake in tests.
 * @returns {Function & { calls: Array, calls: Array }} A spy with a
 *   `calls` array holding one record per invocation.
 */
export function createSpy(fn, clock = Date.now) {
  if (typeof fn !== 'function') {
    throw new TypeError('createSpy: first argument must be a function');
  }

  const calls = [];

  // A real method (not an arrow function) so that `this` and `super`
  // behave correctly when the spy replaces a class method.
  const spy = function (...args) {
    const record = {
      args: args,
      returned: undefined,
      threw: undefined,
      timestamp: clock(),
    };
    try {
      const result = fn.apply(this, args);
      record.returned = result;
      return result;
    } catch (err) {
      record.threw = err;
      throw err;
    } finally {
      calls.push(record);
    }
  };

  Object.defineProperty(spy, 'calls', {
    value: calls,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  return spy;
}
