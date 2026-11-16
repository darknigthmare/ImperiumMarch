import assert from 'node:assert/strict';

/** Observe normal Canvas calls and their actual transforms without a native
 * dependency. PNG decoding is checked by tools/test-painted-combat.mjs.
 */
export function combatRecorder() {
  const calls = [], stack = [];
  let matrix = [1, 0, 0, 1, 0, 0];
  const multiply = n => {
    const [a, b, c, d, e, f] = matrix, [A, B, C, D, E, F] = n;
    matrix = [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  };
  const record = (method, args) => calls.push({ method, args, matrix: [...matrix] });
  const ctx = new Proxy({
    globalAlpha: 1,
    save() { stack.push([...matrix]); },
    restore() { assert.ok(stack.length, 'Canvas state underflow'); matrix = stack.pop(); },
    setTransform(...n) { matrix = [...n]; },
    translate(x, y) { multiply([1, 0, 0, 1, x, y]); },
    rotate(a) { multiply([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]); },
    scale(x, y) { multiply([x, 0, 0, y, 0, 0]); },
    drawImage(...args) { record('drawImage', args); },
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    measureText(text) { return { width: String(text).length * 7 }; },
  }, {
    get(target, key) { return key in target ? target[key] : (...args) => record(key, args); },
    set(target, key, value) { target[key] = value; return true; },
  });
  return { ctx, calls, balanced: () => stack.length === 0,
    point: (call, [x, y]) => {
      const [a, b, c, d, e, f] = call.matrix; return [a * x + c * y + e, b * x + d * y + f];
    } };
}
