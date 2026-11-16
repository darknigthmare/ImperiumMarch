import assert from 'node:assert/strict';

/** Records the actual canvas transforms and layer shading used by the normal
 * renderer. It is intentionally not a PNG decoder or a browser substitute. */
export function walkerRecorder() {
  const calls = [], stack = [];
  let matrix = [1, 0, 0, 1, 0, 0];
  const multiply = n => {
    const [a, b, c, d, e, f] = matrix, [A, B, C, D, E, F] = n;
    matrix = [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  };
  const record = (method, args) => calls.push({ method, args, matrix: [...matrix], filter: ctx.filter, alpha: ctx.globalAlpha,
    lineWidth: ctx.lineWidth, strokeStyle: ctx.strokeStyle });
  const ctx = new Proxy({
    globalAlpha: 1, filter: 'none', imageSmoothingEnabled: true,
    save() { stack.push({ matrix: [...matrix], filter: this.filter, alpha: this.globalAlpha, smoothing: this.imageSmoothingEnabled }); },
    restore() {
      assert.ok(stack.length, 'Canvas state underflow'); const saved = stack.pop();
      matrix = saved.matrix; this.filter = saved.filter; this.globalAlpha = saved.alpha; this.imageSmoothingEnabled = saved.smoothing;
    },
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
  const point = (call, [x, y]) => {
    const [a, b, c, d, e, f] = call.matrix; return [a * x + c * y + e, b * x + d * y + f];
  };
  return { ctx, calls, balanced: () => stack.length === 0, point,
    sourcePoint: (call, [x, y]) => {
      const [, sx, sy, sw, sh, dx, dy, dw, dh] = call.args;
      return point(call, [dx + (x - sx) * dw / sw, dy + (y - sy) * dh / sh]);
    } };
}
