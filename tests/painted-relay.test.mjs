import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PAINTED_RELAY_LAYOUT } from '../src/painted-relay-layout.mjs';
import { clearPaintedRelay, setPaintedRelayImages, setPaintedRelayImage, loadPaintedRelay, paintedRelayStatus,
  paintedRelayFrame, drawPaintedRelaySiteAsset, drawPaintedPraetor, paintedPraetorState,
  praetorPresentationLeg, praetorPresentationWeapon } from '../src/painted-relay.mjs';
import { drawRelayActor, drawRelaySite } from '../src/relay-renderer.mjs';
import { createGame, updateGame } from '../src/simulation.mjs';

const images = () => Object.fromEntries(Object.entries(PAINTED_RELAY_LAYOUT).map(([key,value])=>[key,{width:value.size[0],height:value.size[1],key}]));
function context() {
  const calls = [];
  const ctx = new Proxy({ globalAlpha:1, drawImage(...args) { calls.push(args); } }, {
    get(target,key) { if (key in target) return target[key]; return () => {}; }, set(target,key,value) {target[key]=value;return true;},
  });
  return {ctx,calls};
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('MI12 original atlas bytes and measured frames agree with production manifest', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/painted/relay/manifest.json',import.meta.url)));
  assert.equal(manifest.atlasCount,3); assert.equal(manifest.cellCount,30); assert.equal(manifest.runtimeCellCount,28); assert.equal(manifest.referenceCellCount,2);
  for (const file of manifest.files) {
    assert.equal(hash(readFileSync(new URL(`../${file.path}`,import.meta.url))),file.sha256);
    for (const [name,item] of Object.entries(PAINTED_RELAY_LAYOUT[file.id].frames)) {
      const copy=paintedRelayFrame(file.id,name); assert.ok(copy);
      const [cx,cy,cw,ch]=item.cell, [x,y,w,h]=item.source;
      assert.ok(x>=cx && y>=cy && x+w<=cx+cw && y+h<=cy+ch,`${file.id}/${name} crosses its cell`);
      copy.source[0]=-1; copy.anchors.pivot[0]=999;
      assert.equal(paintedRelayFrame(file.id,name).source[0],x);
      assert.equal(paintedRelayFrame(file.id,name).anchors.pivot[0],0);
    }
  }
});

test('MI12 resource failures keep a usable vector fallback and reject wrong-sized images', async () => {
  clearPaintedRelay(); const {ctx,calls}=context();
  const state=createGame({missionId:'MI12',seed:1551});
  assert.equal(drawPaintedPraetor(ctx,state.relay.praetor),false);
  assert.equal(drawPaintedRelaySiteAsset(ctx,{part:'relay-mast',state:'live'}),false);
  const status=await loadPaintedRelay({loadImage:async()=>{throw new Error('Offline failure fixture');}});
  assert.ok(Object.values(status).every(v=>v.state==='failed'));
  drawRelaySite({ctx,visible:()=>true},state); assert.equal(calls.length,0);
  assert.throws(()=>setPaintedRelayImage('praetor',{width:1,height:1}),/dimensions/);
  assert.throws(()=>setPaintedRelayImage('other',{width:1,height:1}),/Unknown/);
  clearPaintedRelay(); setPaintedRelayImages(images()); assert.ok(Object.values(paintedRelayStatus()).every(v=>v.state==='ready'));
});

test('a stale in-flight relay load cannot restore images after clear', async () => {
  clearPaintedRelay(); const resolve=[];
  const pending=loadPaintedRelay({loadImage:(_,key)=>new Promise(done=>resolve.push(()=>done(images()[key])))});
  clearPaintedRelay(); resolve.forEach(done=>done()); await pending;
  assert.ok(Object.values(paintedRelayStatus()).every(v=>v.state==='idle'));
});

test('MI12 arrival gate excludes every painted enemy part before actual readiness', () => {
  clearPaintedRelay(); setPaintedRelayImages(images()); const {ctx,calls}=context();
  const state=createGame({missionId:'MI12',seed:1552}), renderer={ctx,visible:()=>true};
  const before=JSON.stringify(state);
  drawRelayActor(renderer,state); assert.equal(calls.length,0); assert.equal(JSON.stringify(state),before);
  state.relay.alert.triggered=true; drawRelayActor(renderer,state); assert.equal(calls.length,0);
  state.relay.alert.ready=true;
  const active=JSON.stringify(state); drawRelayActor(renderer,state);
  assert.equal(calls.length,24); assert.equal(JSON.stringify(state),active);
});

test('Pretoire parts follow real contacts, exact component bodies and acquired damage states', () => {
  clearPaintedRelay(); setPaintedRelayImages(images());
  const state=createGame({missionId:'MI12',seed:1553}), p=state.relay.praetor;
  const {ctx}=context(), original=JSON.stringify(p); assert.equal(drawPaintedPraetor(ctx,p),true); assert.equal(JSON.stringify(p),original);
  for(let i=0;i<4;i++) { const pose=praetorPresentationLeg(p,i); assert.deepEqual(pose.sole,[p.feet[i].x,p.feet[i].y]); assert.equal(pose.ankle[0],p.feet[i].x); }
  assert.deepEqual(paintedPraetorState(p),{hull:'hull-guard',sensor:'sensor-tracking',lock:'lock-anchored'});
  p.phase='attack'; assert.equal(paintedPraetorState(p).sensor,'sensor-locking'); assert.equal(paintedPraetorState(p).hull,'hull-attack');
  p.sensor.destroyed=true; assert.equal(paintedPraetorState(p).sensor,'sensor-disabled');
  p.hydraulicLock.destroyed=true; assert.equal(paintedPraetorState(p).lock,'lock-broken'); assert.equal(paintedPraetorState(p).hull,'hull-exposed');
  p.destroyed=true; assert.equal(paintedPraetorState(p).hull,'hull-destroyed');
});

test('painted Pretoire muzzle resolves to actual projectiles in both orientations', () => {
  const cannon=paintedRelayFrame('praetor','cannon'), a=cannon.anchors;
  const sourceVector=[a.sourceEndpoint[0]-a.sourcePivot[0],a.sourceEndpoint[1]-a.sourcePivot[1]];
  const scale=cannon.target[2]/cannon.source[2], angle=cannon.rotation||0;
  const resolved=[sourceVector[0]*scale*Math.cos(angle)-sourceVector[1]*scale*Math.sin(angle),sourceVector[0]*scale*Math.sin(angle)+sourceVector[1]*scale*Math.cos(angle)];
  assert.ok(Math.abs(resolved[0]+71)<.00001 && Math.abs(resolved[1])<.00001);
  for(const facing of [-1,1]) {
    // Explicit shot fixture: real update emits the projectile; no natural playthrough claim.
    const s=createGame({missionId:'MI12',seed:1554,difficulty:'story'}), p=s.relay.praetor;
    s.enemies=[]; s.relay.alert.triggered=true; s.relay.alert.ready=true;
    p.x=s.player.x-facing*350; p.phase='attack'; p.telegraph=.999; p.targetX=s.player.x; p.targetY=s.player.y;
    updateGame(s,1/60,{brace:true}); const shot=s.projectiles.find(x=>x.team==='enemy'); assert.ok(shot,`${facing}: actual shot`);
    const weapon=praetorPresentationWeapon(p); assert.equal(weapon.facing,facing);
    assert.ok(Math.hypot(shot.prevX-weapon.muzzle[0],shot.prevY-weapon.muzzle[1])<.001);
  }
});
