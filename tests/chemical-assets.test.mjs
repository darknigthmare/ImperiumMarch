import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CHEMICAL_ASSET_SPECS, chemicalAssetGeometry, chemicalAssetSVG, drawChemicalAsset } from '../src/chemical-assets.mjs';
const sha = b => createHash('sha256').update(b).digest('hex');

test('MI10 asset exports retain the authored SVG/Canvas source and exact provenance', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/chemical/manifest.json', import.meta.url)));
  assert.equal(manifest.sourceSha256, sha(readFileSync(new URL('../src/chemical-assets.mjs', import.meta.url))));
  for (const [part, spec] of Object.entries(CHEMICAL_ASSET_SPECS)) for (const state of spec.states) {
    const entry = manifest.files.find(f => f.part === part && f.state === state); assert.ok(entry, `${part}/${state}`);
    const bytes = readFileSync(new URL(`../${entry.file}`, import.meta.url));
    assert.equal(sha(bytes), entry.sha256); assert.equal(bytes.length, entry.bytes);
    assert.match(bytes.toString(), /src\/chemical-assets.mjs/); assert.match(bytes.toString(), /tools\/build-chemical-assets.mjs/);
    assert.doesNotMatch(bytes.toString(), /<image|https?:\/\/(?!www.w3.org)|NaN|undefined|Infinity/);
  }
});

test('MI10 exported bounds contain every state and work phase without non-finite geometry', () => {
  for (const [part, spec] of Object.entries(CHEMICAL_ASSET_SPECS)) for (const state of spec.states) for (const progress of [0, .25, .5, .75, 1]) {
    const g = chemicalAssetGeometry({ part, state, progress }), [bx, by, bw, bh] = g.bounds;
    const finite = value => { if (typeof value === 'number') assert.ok(Number.isFinite(value)); else if (value && typeof value === 'object') Object.values(value).forEach(finite); };
    finite(g);
    for (const s of g.shapes) {
      const points = s.points || s.commands?.flatMap(([, ...values]) => values.reduce((a, n, i) => { if (i % 2 === 0) a.push([n, values[i + 1]]); return a; }, [])) || (s.type === 'line' ? [[s.x1, s.y1], [s.x2, s.y2]] : s.type === 'circle' ? [[s.x - s.r, s.y - s.r], [s.x + s.r, s.y + s.r]] : s.type === 'rect' ? [[s.x, s.y], [s.x + s.w, s.y + s.h]] : []);
      for (const [x, y] of points) assert.ok(x >= bx && y >= by && x <= bx + bw && y <= by + bh, `${part}/${state} clips ${x},${y}`);
    }
    assert.match(chemicalAssetSVG(g), /viewBox="[^\"]+"/);
  }
  assert.throws(() => chemicalAssetGeometry({ part: 'invented-proof' }), RangeError);
  assert.throws(() => chemicalAssetGeometry({ part: 'sampling-rig', state: 'certified-politically' }), RangeError);
});

test('MI10 illustration leaves authoritative work progress, position and source state unchanged', () => {
  let commands = 0;
  const c = new Proxy({}, { get: () => () => { commands++; }, set: () => true });
  for (const [part, spec] of Object.entries(CHEMICAL_ASSET_SPECS)) for (const state of spec.states) {
    const input = { part, state, progress: .37, x: 2480, y: 650, scale: .8 }, before = JSON.stringify(input);
    drawChemicalAsset(c, input); assert.equal(JSON.stringify(input), before);
  }
  assert.ok(commands > 500);
});
