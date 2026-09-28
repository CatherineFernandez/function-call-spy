import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createSpy } from '../src/index.js';

describe('createSpy', () => {
  test('records arguments and return value of a successful call', () => {
    const add = (a, b) => a + b;
    const spy = createSpy(add, () => 1000);

    const result = spy(2, 3);

    assert.equal(result, 5);
    assert.equal(spy.calls.length, 1);
    assert.deepEqual(spy.calls[0].args, [2, 3]);
    assert.equal(spy.calls[0].returned, 5);
    assert.equal(spy.calls[0].threw, undefined);
    assert.equal(spy.calls[0].timestamp, 1000);
  });

  test('records multiple calls in order', () => {
    let t = 0;
    const spy = createSpy((x) => x * 2, () => (t += 10));

    spy(1);
    spy(2);
    spy(3);

    assert.equal(spy.calls.length, 3);
    assert.deepEqual(spy.calls[0].args, [1]);
    assert.deepEqual(spy.calls[1].args, [2]);
    assert.deepEqual(spy.calls[2].args, [3]);
    assert.equal(spy.calls[0].timestamp, 10);
    assert.equal(spy.calls[1].timestamp, 20);
    assert.equal(spy.calls[2].timestamp, 30);
  });

  test('records the thrown error and re-throws it', () => {
    const boom = new Error('boom');
    const fn = () => { throw boom; };
    const spy = createSpy(fn, () => 5);

    assert.throws(() => spy(), (err) => err === boom);

    assert.equal(spy.calls.length, 1);
    assert.equal(spy.calls[0].threw, boom);
    assert.equal(spy.calls[0].returned, undefined);
    assert.equal(spy.calls[0].timestamp, 5);
  });

  test('records a call even when the function throws', () => {
    let count = 0;
    const spy = createSpy(
      () => { if (count === 0) { count++; throw new Error('first fails'); } return 'ok'; },
      () => 0,
    );

    assert.throws(() => spy());
    assert.equal(spy(), 'ok');

    assert.equal(spy.calls.length, 2);
    assert.ok(spy.calls[0].threw instanceof Error);
    assert.equal(spy.calls[1].returned, 'ok');
  });

  test('preserves `this` binding when used as a method', () => {
    const obj = {
      multiplier: 10,
      scale(n) { return n * this.multiplier; },
    };

    obj.scale = createSpy(obj.scale, () => 0);

    assert.equal(obj.scale(4), 40);
    assert.equal(spy_calls(obj).length, 1);
    assert.equal(spy_calls(obj)[0].returned, 40);
  });

  test('handles zero arguments', () => {
    const spy = createSpy(() => 42, () => 0);
    assert.equal(spy(), 42);
    assert.deepEqual(spy.calls[0].args, []);
  });

  test('preserves undefined as a return value', () => {
    const spy = createSpy(() => undefined, () => 0);
    spy();
    assert.equal(spy.calls[0].returned, undefined);
    assert.equal(spy.calls[0].threw, undefined);
  });

  test('records null and undefined arguments distinctly', () => {
    const spy = createSpy(() => {}, () => 0);
    spy(null, undefined);
    assert.deepEqual(spy.calls[0].args, [null, undefined]);
  });

  test('throws TypeError if first argument is not a function', () => {
    assert.throws(
      () => createSpy('not a function'),
      (err) => err instanceof TypeError && /must be a function/.test(err.message),
    );
  });

  test('calls array is not replaceable', () => {
    const spy = createSpy(() => {}, () => 0);
    assert.throws(() => { spy.calls = []; }, TypeError);
  });

  test('records objects passed by reference without cloning', () => {
    const spy = createSpy((obj) => obj.value, () => 0);
    const input = { value: 1 };
    spy(input);
    assert.strictEqual(spy.calls[0].args[0], input);
  });

  test('uses Date.now by default when no clock is given', () => {
    const before = Date.now();
    const spy = createSpy(() => {});
    spy();
    const after = Date.now();

    const ts = spy.calls[0].timestamp;
    assert.ok(ts >= before && ts <= after, 'timestamp should fall within the call window');
  });
});

function spy_calls(obj) {
  const keys = Object.keys(obj);
  for (const k of keys) {
    if (typeof obj[k] === 'function' && obj[k].calls) return obj[k].calls;
  }
  throw new Error('no spy found');
}
