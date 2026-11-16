import test from 'node:test';
import assert from 'node:assert/strict';
import { PAINTED_ROUTE_LAYOUT } from '../src/painted-route-layout.mjs';
import { PAINTED_ROUTE_PARTS, clearPaintedRoute, loadPaintedRoute, paintedRouteStatus, setPaintedRouteImage,
  paintedRouteFrame, paintedRoutePartFrames, drawPaintedRouteAsset } from '../src/painted-route.mjs';
import { drawLivingRouteSite, drawLivingRouteActors, drawLivingRouteMap } from '../src/thyr-renderer.mjs';
import { createGame, livingRouteSurfaceAt } from '../src/simulation.mjs';

const fakeImage=key=>({width:PAINTED_ROUTE_LAYOUT[key].size[0],height:PAINTED_ROUTE_LAYOUT[key].size[1],key});
function ready() { clearPaintedRoute();for(const key of Object.keys(PAINTED_ROUTE_LAYOUT))setPaintedRouteImage(key,fakeImage(key)); }
function context() {
  const calls=[];
  return {calls,ctx:new Proxy({}, {get:(_target,key)=>(...args)=>{ calls.push([key,...args]); if(key==='measureText')return{width:String(args[0]).length*7}; },set:()=>true})};
}
test('MI09 maps all existing states and keeps the duplicate wheel and unmodeled terminal wreck as references',()=>{
  const frames=Object.values(PAINTED_ROUTE_LAYOUT).flatMap(a=>Object.values(a.frames));
  assert.equal(frames.length,20);assert.equal(frames.filter(f=>f.usage==='runtime').length,18);
  for(const [part,spec] of Object.entries(PAINTED_ROUTE_PARTS))for(const state of spec.states)
    assert.ok(paintedRoutePartFrames(part,state).every(f=>f.usage==='runtime'));
  const frame=paintedRouteFrame('barrier','arm');frame.source[0]=-1;
  assert.notEqual(paintedRouteFrame('barrier','arm').source[0],-1);
  assert.deepEqual(PAINTED_ROUTE_LAYOUT.barrier.rowBoundaries,[0,418,815,1254]);
  assert.equal(paintedRoutePartFrames('invented','normal'),null);
  assert.equal(paintedRouteFrame('logistics','wheel-reference').usage,'reference');
  assert.equal(paintedRouteFrame('terminals','terminal-destroyed').usage,'reference');
  assert.equal(paintedRoutePartFrames('route-terminal','destroyed'),null);
});
test('MI09 failed PNG decoding falls back independently and rejects wrong dimensions',async()=>{
  clearPaintedRoute();const status=await loadPaintedRoute({loadImage:async(_url,key)=>{if(key==='barrier')throw Error('decode');return fakeImage(key);}});
  assert.equal(status.barrier.state,'failed');assert.equal(status.terminals.state,'ready');
  const {ctx}=context();assert.equal(drawPaintedRouteAsset(ctx,{part:'migration-barrier'}),false);
  assert.equal(drawPaintedRouteAsset(ctx,{part:'route-map'}),true);
  assert.throws(()=>setPaintedRouteImage('barrier',{width:1,height:1}),RangeError);
  assert.throws(()=>setPaintedRouteImage('missing',fakeImage('barrier')),RangeError);clearPaintedRoute();
});
test('MI09 stale in-flight images cannot restore a cleared generation',async()=>{
  clearPaintedRoute();let release;const block=new Promise(r=>release=r);
  const old=loadPaintedRoute({loadImage:async(_url,key)=>{await block;return fakeImage(key);}});
  clearPaintedRoute();release();await old;assert.ok(Object.values(paintedRouteStatus()).every(x=>x.state==='idle'));
});
test('MI09 barrier rotates around its historical hinge at the actual opening fraction',()=>{
  ready();
  for(const progress of [0,.15,.5,.85,1]) {
    const {ctx,calls}=context();
    assert.equal(drawPaintedRouteAsset(ctx,{part:'migration-barrier',state:'working',progress,x:2300,y:700,width:38,height:84}),true);
    assert.deepEqual(calls.find(c=>c[0]==='scale'),['scale',38/170,84/112]);
    assert.ok(calls.some(c=>c[0]==='translate'&&c[1]===-76&&c[2]===-77));
    assert.deepEqual(calls.find(c=>c[0]==='rotate'),['rotate',-Math.PI*.69*progress]);
    assert.equal(calls.filter(c=>c[0]==='drawImage').length,2);
  }
  const broken=context();drawPaintedRouteAsset(broken.ctx,{part:'migration-barrier',state:'broken',progress:1});
  assert.equal(broken.calls.some(c=>c[0]==='rotate'),false);clearPaintedRoute();
});
test('MI09 complete truck draws exactly one bitmap and does not overlay its reference wheel',()=>{
  ready();const {ctx,calls}=context();
  assert.equal(drawPaintedRouteAsset(ctx,{part:'route-logistics',state:'normal',x:200,y:700,width:126,height:68}),true);
  assert.equal(calls.filter(c=>c[0]==='drawImage').length,1);
  assert.equal(drawPaintedRouteAsset(ctx,{part:'route-logistics',state:'wheel-reference'}),false);
  assert.equal(drawPaintedRouteAsset(ctx,{part:'route-logistics',x:NaN}),false);
  assert.equal(drawPaintedRouteAsset(ctx,{part:'route-logistics',width:0}),false);clearPaintedRoute();
});
test('MI09 image errors restore nested Canvas transforms before vector fallback',()=>{
  ready();let depth=0;
  const ctx={save:()=>depth++,restore:()=>depth--,translate(){},scale(){},rotate(){},drawImage(){throw Error('lost image');}};
  assert.equal(drawPaintedRouteAsset(ctx,{part:'migration-barrier'}),false);assert.equal(depth,0);clearPaintedRoute();
});
test('MI09 map conceals homes until inspection and surveys the two simulated homes only',()=>{
  ready();const s=createGame({missionId:'MI09',walkerId:'WK09',seed:157}),homes=s.livingRoute.homes;
  assert.equal(homes.length,2);
  for(const inspected of [false,true]) {
    const {ctx,calls}=context(),before=structuredClone(homes);
    drawLivingRouteMap(ctx,{x:250,y:700,inspected,homes});
    assert.equal(calls.filter(c=>c[0]==='rect'&&c[3]===8&&c[4]===6).length,inspected?homes.length:0);
    const bitmaps=calls.filter(c=>c[0]==='drawImage');
    assert.equal(bitmaps.length,inspected?2:1);
    assert.deepEqual(bitmaps[0].slice(2,6),paintedRouteFrame('terminals',inspected?'map-surveyed':'map-concealed').source);
    if(inspected) {
      assert.ok(calls.some(c=>c[0]==='clip'));
      assert.deepEqual(bitmaps[1].slice(2,6),paintedRouteFrame('terminals','map-concealed').source);
    }
    assert.deepEqual(homes,before);
  }
  clearPaintedRoute();const {ctx,calls}=context();
  assert.ok(drawLivingRouteMap(ctx,{x:250,y:700,inspected:true,homes}));
  assert.equal(calls.some(c=>c[0]==='drawImage'||c[0]==='clip'),false);
});
test('MI09 render changes no barrier, beings, jobs, route surface or saved facts',()=>{
  ready();const s=createGame({missionId:'MI09',walkerId:'WK09',seed:157});
  s.livingRoute.barrier.working=true;s.livingRoute.barrier.opening=.45;s.livingRoute.barrier.progress=.45;
  s.livingRoute.approach.prepared=true;s.livingRoute.approach.kind='guided';s.livingRoute.maps.inspected=true;
  s.livingRoute.logistics.hp*=.4;
  const before=structuredClone(s),surface=livingRouteSurfaceAt(s,s.livingRoute.roots[0].x),{ctx,calls}=context();
  const renderer={ctx,visible:()=>true,combatReducedMotion:false};
  drawLivingRouteSite(renderer,s,s.elapsed);drawLivingRouteActors(renderer,s,s.elapsed);
  assert.deepEqual(s,before);assert.deepEqual(livingRouteSurfaceAt(s,s.livingRoute.roots[0].x),surface);
  assert.equal(calls.filter(c=>c[0]==='drawImage').length,15);clearPaintedRoute();
});
