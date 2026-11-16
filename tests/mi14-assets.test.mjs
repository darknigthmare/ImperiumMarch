import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { WORKSHOP_ASSET_SPECS, workshopAssetGeometry, workshopAssetSVG, drawWorkshopAsset } from '../src/workshop-assets.mjs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('MI14 exports preserve exact source provenance, distinct mechanic variants and all individual files', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/workshop/manifest.json', import.meta.url)));
  assert.equal(manifest.version, '0.15.0');
  assert.equal(manifest.sourceSha256, sha(readFileSync(new URL('../src/workshop-assets.mjs', import.meta.url))));
  assert.equal(manifest.counts.svg, 33); assert.equal(manifest.counts.transparentSprites, 33);
  for (const [part, spec] of Object.entries(WORKSHOP_ASSET_SPECS)) for (const state of spec.states) {
    for (const mechanic of part === 'worker' ? [false, true] : [false]) for (const format of ['svg', 'png']) {
      const entry = manifest.files.find(f => f.part === part && f.state === state && f.mechanic === mechanic && f.format === format);
      assert.ok(entry, `${part}/${state}/${mechanic}/${format}`);
      const bytes = readFileSync(new URL(`../${entry.file}`, import.meta.url));
      assert.equal(sha(bytes), entry.sha256); assert.equal(bytes.length, entry.bytes);
      if (format === 'svg') {
        assert.match(bytes.toString(), /src\/workshop-assets.mjs/); assert.match(bytes.toString(), /tools\/build-workshop-assets.mjs/);
        assert.doesNotMatch(bytes.toString(), /<image|https?:\/\/(?!www.w3.org)|NaN|undefined|Infinity/);
      } else assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    }
  }
});

test('MI14 state exports and all cannon angles fit their frames without clipping strokes', () => {
  for (const [part, spec] of Object.entries(WORKSHOP_ASSET_SPECS)) for (const state of spec.states) {
    for (const phase of [0, .25, .5, .75, 1]) {
      const g = workshopAssetGeometry({ part, state, progress: phase, mechanic: true, aimAngle: phase * Math.PI * 2 });
      const [bx, by, bw, bh] = g.bounds;
      const finite = value => { if (typeof value === 'number') assert.ok(Number.isFinite(value)); else if (value && typeof value === 'object') Object.values(value).forEach(finite); };
      finite(g);
      for (const shape of g.shapes) {
        const points = shape.points || (shape.type === 'line' ? [[shape.x1, shape.y1], [shape.x2, shape.y2]] : shape.type === 'circle' ? [[shape.x - shape.r, shape.y - shape.r], [shape.x + shape.r, shape.y + shape.r]] : [[shape.x, shape.y], [shape.x + shape.w, shape.y + shape.h]]);
        const margin = shape.stroke ? (shape.strokeWidth || 1) / 2 : 0;
        for (const [x, y] of points) assert.ok(x - margin >= bx && y - margin >= by && x + margin <= bx + bw && y + margin <= by + bh,
          `${part}/${state} clips ${x},${y} with stroke ${margin}`);
      }
      assert.match(workshopAssetSVG(g), /viewBox="[^"]+"/);
    }
  }
  assert.throws(() => workshopAssetGeometry({ part: 'invented' }));
  assert.throws(() => workshopAssetGeometry({ part: 'worker', state: 'recruited' }));
  assert.throws(() => workshopAssetGeometry({ part: 'worker', progress: NaN }), TypeError);
});

test('MI14 automaton muzzle matches the physical centre/half-width projectile origin at any target angle', () => {
  for (const angle of [-Math.PI, -2.1, -.4, 0, .7, 2.8, Math.PI]) for (const facing of [-1, 1]) {
    const width = 112, height = 110, x = 3150, y = 600;
    const localAngle = Math.atan2(Math.sin(angle), Math.cos(angle) * facing);
    const g = workshopAssetGeometry({ part: 'security-automaton', state: 'active', aimAngle: localAngle });
    const muzzleX = x + g.anchors.muzzle[0] * facing, muzzleY = y + height / 2 + g.anchors.muzzle[1];
    assert.ok(Math.abs(muzzleX - (x + Math.cos(angle) * width / 2)) < 1e-9);
    assert.ok(Math.abs(muzzleY - (y + Math.sin(angle) * width / 2)) < 1e-9);
  }
});

test('MI14 drawing leaves authoritative options and progress unchanged', () => {
  let commands = 0;
  const c = new Proxy({}, { get: () => () => { commands++; }, set: () => true });
  for (const [part, spec] of Object.entries(WORKSHOP_ASSET_SPECS)) for (const state of spec.states) {
    const input = Object.freeze({ part, state, progress: .37, mechanic: true, x: 3940, y: 650, scale: .8, aimAngle: .5 });
    const before = JSON.stringify(input); drawWorkshopAsset(c, input); assert.equal(JSON.stringify(input), before);
  }
  assert.ok(commands > 500);
});
