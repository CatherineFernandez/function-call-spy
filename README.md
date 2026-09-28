# Function Call Spy

Wraps a function so that every invocation's arguments, return value, thrown error, and timestamp are recorded for later inspection.

```js
import { createSpy } from 'function-call-spy';

const spy = createSpy((a, b) => a + b);

spy(2, 3);
spy(4, 5);

console.log(spy.calls);
// [{ args: [2, 3], returned: 5, threw: undefined, timestamp: 1710000000000 }, ...]
```

## Why

Debugging a function that is called from several places — or verifying that a callback was invoked with the right arguments — is easier when you have a log of every call rather than a breakpoint you have to babysit. This library gives you that log with no dependencies and no test-framework coupling.

The trade-off: the spy is a real function, not a proxy, so it captures `this` and `super` correctly when used as a method replacement, but it does not intercept property access on the original function object.

## Edge cases

The spy re-throws errors from the wrapped function. The call is still recorded (in a `finally` block) before the error propagates, so `spy.calls` is complete even when the wrapped function throws.

`undefined` as a return value is preserved and recorded — it is distinct from a thrown error, which sets the `threw` field instead.

The timestamp comes from an injected clock function (defaulting to `Date.now`). Pass a fake clock in tests for deterministic timestamps.
