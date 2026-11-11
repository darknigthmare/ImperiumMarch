import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { THYR_ASSET_SPECS, thyrAssetGeometry, thyrAssetSVG, drawThyrAsset } from '../src/thyr-assets.mjs';

const sha = b => createHash('sha256').update(b).digest('hex');

test('Thyr pack exports every authored state with authentic hashes and independent provenance', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/thyr/manifest.json', import.meta.url)));
  assert.equal(manifest.sourceSha256, sha(readFileSync(new URL('../src/thyr-assets.mjs', import.meta.url))));
  for (const [part, spec] of Object.entries(THYR_ASSET_SPECS)) for (const state of spec.states) {
    const entry = manifest.files.find(f => f.part === part && f.state === state);
    assert.ok(entry, `${part} / ${state} must be exportable`);
    const bytes = readFileSync(new URL(`../${entry.file}`, import.meta.url));
    assert.equal(sha(bytes), entry.sha256); assert.equal(bytes.length, entry.bytes);
    assert.match(bytes.toString(), /src\/thyr-assets.mjs/);
    assert.match(bytes.toString(), /tools\/build-thyr-assets.mjs/);
    assert.doesNotMatch(bytes.toString(), /<image|https?:\/\/(?!www.w3.org)|NaN|undefined|Infinity/);
  }
});

test('Thyr geometry is finite through animation phases and cannot silently invent asset states', () => {
  for (const [part, spec] of Object.entries(THYR_ASSET_SPECS)) for (const state of spec.states) for (const progress of [0, .25, .5, .75, 1]) {
    const geometry = thyrAssetGeometry({ part, state, progress });
    assert.ok(geometry.shapes.length > 0);
    const visit = value => { if (typeof value === 'number') assert.ok(Number.isFinite(value)); else if (value && typeof value === 'object') Object.values(value).forEach(visit); };
    visit(geometry);
    const [bx, by, bw, bh] = geometry.bounds;
    for (const shape of geometry.shapes) {
      const points = shape.points || shape.commands?.flatMap(([op, ...values]) => values.reduce((a, n, i) => { if (i % 2 === 0) a.push([n, values[i + 1]]); return a; }, [])) || (shape.type === 'line' ? [[shape.x1, shape.y1], [shape.x2, shape.y2]] : shape.type === 'circle' ? [[shape.x - shape.r, shape.y - shape.r], [shape.x + shape.r, shape.y + shape.r]] : shape.type === 'rect' ? [[shape.x, shape.y], [shape.x + shape.w, shape.y + shape.h]] : []);
      for (const [x, y] of points) assert.ok(x >= bx && y >= by && x <= bx + bw && y <= by + bh, `${part}/${state} exported bounds clip ${x},${y}`);
    }
    const svg = thyrAssetSVG(geometry);
    assert.match(svg, /viewBox="[^\"]+"/); assert.match(svg, /<title/);
  }
  assert.throws(() => thyrAssetGeometry({ part: 'imaginary-animal' }), RangeError);
  assert.throws(() => thyrAssetGeometry({ part: 'longuedorse-young', state: 'revived' }), RangeError);
});

test('Thyr Canvas drawing preserves authoritative positions and inputs', () => {
  let commands = 0;
  const ctx = new Proxy({}, { get: () => () => { commands++; }, set: () => true });
  for (const [part, spec] of Object.entries(THYR_ASSET_SPECS)) for (const state of spec.states) {
    const input = { part, state, x: 1260, y: 623.8, progress: .4, facing: -1, scale: .8 };
    const before = JSON.stringify(input); drawThyrAsset(ctx, input); assert.equal(JSON.stringify(input), before);
  }
  assert.ok(commands > 500);
});
