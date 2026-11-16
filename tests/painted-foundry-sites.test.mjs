import test from 'node:test';
import assert from 'node:assert/strict';
import { PAINTED_FOUNDRY_SITES_LAYOUT } from '../src/painted-foundry-sites-layout.mjs';
import { FOUNDRY_ASSET_SPECS } from '../src/foundry-assets.mjs';
import { clearPaintedFoundrySites, loadPaintedFoundrySites, paintedFoundrySitesStatus, setPaintedFoundrySitesImage,
  paintedFoundrySitesFrame, paintedFoundrySiteFrame, drawPaintedFoundrySiteAsset, drawPaintedFoundryDeck,
  drawPaintedFoundrySteamOutlet } from '../src/painted-foundry-sites.mjs';
import { createGame, foundrySurfaceAt } from '../src/simulation.mjs';
import { drawFoundrySite, drawFoundryCarrier } from '../src/foundry-renderer.mjs';

const fake = key => ({ key, width:1536, height:1024 });
const ready = () => { clearPaintedFoundrySites(); for (const key of Object.keys(PAINTED_FOUNDRY_SITES_LAYOUT)) setPaintedFoundrySitesImage(key, fake(key)); };
function context() {
  const calls=[];
  return { calls, ctx:new Proxy({}, { get:(_target,key)=>(...args)=>{
    calls.push([key,...args]);
    if (key==='createLinearGradient' || key==='createRadialGradient') return { addColorStop() {} };
    if (key==='measureText') return {width: String(args[0]).length*7};
  }, set:()=>true }) };
}

test('MI13 selected originals cover the existing equipment states without exposing the blank cell',()=>{
  let total=0;
  for (const part of ['steam-valve','transfer-crane','analysis-console','cargo-manifest']) {
    for (const state of FOUNDRY_ASSET_SPECS[part].states) {
      const frame=paintedFoundrySiteFrame(part,state); assert.ok(frame,`${part}/${state}`);
      assert.equal(frame.usage,'runtime'); total++;
      frame.source[0]=-100; assert.notEqual(paintedFoundrySiteFrame(part,state).source[0],-100);
    }
  }
  assert.equal(total,15);
  assert.equal(Object.values(PAINTED_FOUNDRY_SITES_LAYOUT).reduce((n,a)=>n+Object.keys(a.frames).length,0),23);
  assert.deepEqual(PAINTED_FOUNDRY_SITES_LAYOUT.cranes.emptyCells,[5]);
  assert.equal(paintedFoundrySiteFrame('steam-valve','new-population'),null);
  assert.equal(paintedFoundrySitesFrame('cranes','empty'),null);
});

test('MI13 atlas failures keep unrelated equipment available and preserve vector fallback',async()=>{
  clearPaintedFoundrySites();
  const status=await loadPaintedFoundrySites({loadImage:async(_url,key)=>{if(key==='valves')throw new Error('decode failure');return fake(key);}});
  assert.equal(status.valves.state,'failed');assert.equal(status.cranes.state,'ready');
  const {ctx}=context();assert.equal(drawPaintedFoundrySiteAsset(ctx,{part:'steam-valve',state:'closed'}),false);
  assert.equal(drawPaintedFoundrySiteAsset(ctx,{part:'cargo-manifest',state:'sealed'}),true);
  assert.throws(()=>setPaintedFoundrySitesImage('valves',{width:1,height:1}),RangeError);
  assert.throws(()=>setPaintedFoundrySitesImage('unknown',fake('valves')),RangeError);
  clearPaintedFoundrySites();
});

test('MI13 clearing an in-flight load cannot restore obsolete images',async()=>{
  clearPaintedFoundrySites();let release;
  const wait=new Promise(resolve=>{release=resolve;});
  const pending=loadPaintedFoundrySites({loadImage:async(_url,key)=>{await wait;return fake(key);}});
  clearPaintedFoundrySites();release();await pending;
  assert.ok(Object.values(paintedFoundrySitesStatus()).every(s=>s.state==='idle'));
  await loadPaintedFoundrySites({loadImage:async(_url,key)=>fake(key)});
  assert.ok(Object.values(paintedFoundrySitesStatus()).every(s=>s.state==='ready'));
  clearPaintedFoundrySites();
});

test('MI13 intact valves get exactly one separate wheel at their axle; destroyed valves do not',()=>{
  ready();const a=context();
  assert.equal(drawPaintedFoundrySiteAsset(a.ctx,{part:'steam-valve',state:'open',x:1320,y:670,width:52,height:62,progress:.6}),true);
  assert.equal(a.calls.filter(c=>c[0]==='drawImage').length,2);
  assert.deepEqual(a.calls.find(c=>c[0]==='translate'),['translate',1320,670]);
  assert.deepEqual(a.calls.find(c=>c[0]==='scale'),['scale',52/86,62/115]);
  assert.deepEqual(a.calls.filter(c=>c[0]==='translate')[1].slice(1),paintedFoundrySiteFrame('steam-valve','open').wheelAxle);
  const b=context();drawPaintedFoundrySiteAsset(b.ctx,{part:'steam-valve',state:'destroyed',progress:1});
  assert.equal(b.calls.filter(c=>c[0]==='drawImage').length,1);
  assert.equal(drawPaintedFoundrySiteAsset(b.ctx,{part:'steam-valve',width:0}),false);
  assert.equal(drawPaintedFoundrySiteAsset(b.ctx,{part:'steam-valve',x:NaN}),false);
  clearPaintedFoundrySites();
});

test('MI13 hook follows transfer progress while retaining the quarantine gantry state',()=>{
  ready();const snapshots=[0,.5,1].map(progress=>{
    const {ctx,calls}=context();drawPaintedFoundrySiteAsset(ctx,{part:'transfer-crane',state:'quarantine',working:true,progress});
    assert.equal(calls.filter(c=>c[0]==='drawImage').length,2);
    assert.deepEqual(calls.find(c=>c[0]==='drawImage').slice(2,6),paintedFoundrySiteFrame('transfer-crane','quarantine').source);
    return calls.filter(c=>c[0]==='translate')[1][2];
  });
  assert.deepEqual(snapshots,[-83,-71,-59]);clearPaintedFoundrySites();
});

test('MI13 deck strips follow physical slopes and keep the same texture origin when the camera moves',()=>{
  ready();const state=createGame({missionId:'MI13',walkerId:'WK09',seed:157}),bridge=state.foundry.bridges[0];
  const surface=x=>foundrySurfaceAt(state,x).groundY;
  for (const from of [bridge.start,bridge.start+13.5,bridge.start+0.1]) {
    const {ctx,calls}=context();
    assert.equal(drawPaintedFoundryDeck(ctx,{state:'hot',start:bridge.start,end:bridge.end,from,to:bridge.start+160,surfaceAt:surface}),true);
    const transforms=calls.filter(c=>c[0]==='transform'),draws=calls.filter(c=>c[0]==='drawImage');
    assert.equal(transforms.length,draws.length);assert.ok(draws.length>15);
    for(let i=0;i<draws.length;i++) {
      const x=transforms[i][5],y=transforms[i][6],width=draws[i][8];
      assert.ok(Math.abs(y-surface(x))<1e-9);
      assert.ok(Math.abs(y+width*transforms[i][2]-surface(x+width))<1e-9);
      const sourceU=PAINTED_FOUNDRY_SITES_LAYOUT.thermal.frames['deck-hot'].tile.source[0];
      assert.ok(Math.abs(draws[i][2]-(sourceU+((x-bridge.start)%96)/96*460))<1e-8);
    }
  }
  clearPaintedFoundrySites();
});

test('MI13 drawing failure restores the Canvas stack before vector fallback',()=>{
  ready();let depth=0;
  const ctx={save(){depth++;},restore(){depth--;},translate(){},scale(){},transform(){},drawImage(){throw new Error('Image lost');}};
  assert.equal(drawPaintedFoundrySiteAsset(ctx,{part:'analysis-console',state:'working'}),false);assert.equal(depth,0);
  assert.equal(drawPaintedFoundryDeck(ctx,{start:0,end:90,surfaceAt:()=>20}),false);assert.equal(depth,0);
  assert.equal(drawPaintedFoundrySteamOutlet(ctx,{state:'jet'}),false);assert.equal(depth,0);
  clearPaintedFoundrySites();
});

test('MI13 site rendering preserves saved facts, thermal clocks, transfers, copies and real contacts',()=>{
  ready();const s=createGame({missionId:'MI13',walkerId:'WK09',seed:157});
  s.foundry.bridges[0].circuitOpen=true;s.foundry.bridges[0].valve.destroyed=true;
  s.foundry.bridges[1].steam.phase='jet';s.foundry.manifest.copied=true;
  s.foundry.cargo[0].transfer.working=true;s.foundry.cargo[0].transfer.progress=.45;s.campaign.plan='quarantine';
  const before=structuredClone(s),surfaces=s.foundry.bridges.map(b=>foundrySurfaceAt(s,(b.start+b.end)/2)),{ctx,calls}=context();
  drawFoundrySite({ctx,visible:()=>true,cameraX:s.foundry.bridges[0].start-100,options:{reducedMotion:true}},s,s.elapsed);
  drawFoundryCarrier({ctx,visible:()=>true,combatReducedMotion:true},s);
  assert.deepEqual(s,before);assert.deepEqual(s.foundry.bridges.map(b=>foundrySurfaceAt(s,(b.start+b.end)/2)),surfaces);
  assert.ok(calls.filter(c=>c[0]==='drawImage').length>20);
  assert.ok(calls.some(c=>c[0]==='fillRect'&&c[3]===270&&c[4]===196),'Simulated jet danger rectangle remains');
  clearPaintedFoundrySites();const vector=context();drawFoundrySite({ctx:vector.ctx,visible:()=>true,cameraX:0},s);
  assert.equal(vector.calls.filter(c=>c[0]==='drawImage').length,0,'Missing atlases retain vector sites');
});
