import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_VESPER_LAYOUT } from '../src/painted-vesper-layout.mjs';
import { PAINTED_VESPER_URLS, PAINTED_VESPER_PARTS, setPaintedVesperImage, clearPaintedVesper,
  loadPaintedVesper, paintedVesperStatus, paintedVesperFrame, vesperNetworkState,
  drawPaintedVesperPart, drawPaintedVesperWinch, drawPaintedVesperTurbine,
  drawPaintedVesperGroundStrip } from '../src/painted-vesper.mjs';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} differs from ${b}`);
const images=record=>record.calls.filter(call=>call.method==='drawImage');
function loadStandIns() {
  for(const [key,atlas] of Object.entries(PAINTED_VESPER_LAYOUT))
    setPaintedVesperImage(key,{atlasKey:key,width:atlas.size[0],height:atlas.size[1]});
}
function matches(call,part,state) {
  const frame=paintedVesperFrame(part,state);
  return call.args[0].atlasKey===frame.atlas && call.args.slice(1,5).every((n,i)=>n===frame.source[i]);
}
const frames=(record,part,state)=>images(record).filter(call=>matches(call,part,state));
function rendererFor(record) {
  return Object.assign(Object.create(Renderer.prototype),{ctx:record.ctx,cameraX:0,width:1600,height:900,
    panoramaReady:false,lastGame:null,combatReducedMotion:false,visible:()=>true,prepare(){}});
}
function mappedSource(record,call,point) {
  const [,sx,sy,sw,sh,dx,dy,dw,dh]=call.args;
  return record.point(call,[dx+(point[0]-sx)/sw*dw,dy+(point[1]-sy)/sh*dh]);
}
function strips(record,part) {
  const f=paintedVesperFrame(part),[x,y,w,h]=f.alphaBounds;
  return images(record).filter(call=>call.args[0].atlasKey===f.atlas&&call.args[2]===y&&call.args[4]===h&&
    call.args[1]>=x-1e-6&&call.args[1]+call.args[3]<=x+w+1e-6);
}
test.afterEach(clearPaintedVesper);

test('38 Vesper cells retain measured irregular crops, source pivots and defensive metadata',()=>{
  assert.equal(Object.keys(PAINTED_VESPER_URLS).length,6);
  const addressed=new Set();
  for(const [part,spec]of Object.entries(PAINTED_VESPER_PARTS)) {
    for(const state of spec.states||Object.keys(spec.names)) {
      const f=paintedVesperFrame(part,state),atlas=PAINTED_VESPER_LAYOUT[f.atlas];
      assert.equal(f.usage,'runtime');addressed.add(`${f.atlas}/${f.frame}`);
      const [x,y,w,h]=f.source,[cx,cy,cw,ch]=f.cell;
      assert.ok(x>=cx&&y>=cy&&x+w<=cx+cw&&y+h<=cy+ch);
      assert.ok(x>=0&&y>=0&&x+w<=atlas.size[0]&&y+h<=atlas.size[1]);
      const [tx,ty,tw,th]=f.target;
      for(const [sourceKey,targetKey]of [['sourceOrigin','origin'],['sourcePivot','pivot']])if(f.anchors[sourceKey]) {
        const p=f.anchors[sourceKey],q=f.anchors[targetKey];
        near(tx+(p[0]-x)*tw/w,q[0]);near(ty+(p[1]-y)*th/h,q[1]);
      }
      f.source[0]=-999;f.anchors.sourceOrigin[0]=-999;
      assert.notEqual(paintedVesperFrame(part,state).source[0],-999);
      assert.notEqual(paintedVesperFrame(part,state).anchors.sourceOrigin[0],-999);
    }
  }
  assert.equal(addressed.size,38);
  assert.deepEqual(PAINTED_VESPER_LAYOUT.housing.size,[1783,882]);
  assert.equal(PAINTED_VESPER_LAYOUT.outposts.frames.depot.cell[2],710);
  assert.equal(PAINTED_VESPER_LAYOUT.outposts.frames['filter-crate'].cell[0],710);
  assert.equal(PAINTED_VESPER_LAYOUT.civilworks.frames['harpoon-released'].cell[1],370);
  for(const part of ['pump','turbine','radio','harpoon'])assert.equal(paintedVesperFrame(part,'destroyed'),null,'No invented local damage model');
});

test('network damage, power loss and destruction remain separate facts with the original 75 percent threshold',()=>{
  for(const [hp,disabled,destroyed,wanted]of [[100,false,false,'active'],[75,false,false,'active'],[74,false,false,'damaged'],
    [100,true,false,'disabled'],[74,true,false,'disabled-damaged'],[0,true,true,'destroyed'],[100,false,true,'destroyed']]) {
    const station={hp,maxHp:100,disabled,destroyed},before=structuredClone(station);
    assert.equal(vesperNetworkState(station),wanted);assert.deepEqual(station,before);
  }
});

test('all three network buildings use their own states and grounded separate terminals, absent after destruction',()=>{
  loadStandIns();
  const s=createGame({missionId:'MI03',seed:1577});
  for(const station of s.network.stations)for(const state of ['active','disabled','damaged','disabled-damaged','destroyed']) {
    station.hp=state.includes('damaged')?station.maxHp*.5:state==='destroyed'?0:station.maxHp;
    station.disabled=state.startsWith('disabled')||state==='destroyed';station.destroyed=state==='destroyed';
    station.secured=state==='disabled-damaged';
    const before=JSON.stringify(s),record=combatRecorder(),renderer=rendererFor(record);renderer.visible=x=>x===station.x;
    renderer.drawNetworkStations(s,4);
    const part=station.kind==='residential'?'housing':station.kind;
    assert.equal(frames(record,part,state).length,1,`${station.kind}/${state}`);
    const terminalCalls=images(record).filter(call=>call.args[0].atlasKey==='civilworks');
    assert.equal(terminalCalls.length,station.destroyed?0:1);
    if(!station.destroyed) {
      const call=frames(record,'ground-terminal',station.secured?'protected':'exposed')[0];assert.ok(call);
      const p=record.point(call,[0,0]),x=station.x+station.w/2+30;
      near(p[0],x);near(p[1],terrainAt(x,s.planetId));
    }
    assert.equal(JSON.stringify(s),before);assert.ok(record.balanced());
  }
});

test('winch bodies and isolated wheels draw once around their measured sockets and stop under reduced motion',()=>{
  loadStandIns();
  for(const kind of ['slab','harpoon'])for(const released of [false,true]) {
    const options={kind,x:840,y:702,released,working:true,time:3.5},record=combatRecorder();
    assert.equal(drawPaintedVesperWinch(record.ctx,options),true);assert.equal(images(record).length,2);
    const bodyPart=kind==='harpoon'?'harpoon':'slab-winch',bodyState=kind==='harpoon'?(released?'released':'latched'):'normal';
    const wheelPart=kind==='harpoon'?'harpoon-reel':'slab-wheel';
    const body=frames(record,bodyPart,bodyState)[0],wheel=frames(record,wheelPart)[0];assert.ok(body&&wheel);
    const socket=mappedSource(record,body,paintedVesperFrame(bodyPart,bodyState).anchors.sourcePivot),axis=record.point(wheel,[0,0]);
    near(axis[0],840);near(axis[1],702-(kind==='harpoon'?27:31));near(socket[0],axis[0]);near(socket[1],axis[1]);
    const a=combatRecorder(),b=combatRecorder();
    drawPaintedVesperWinch(a.ctx,{...options,reducedMotion:true,time:1});
    drawPaintedVesperWinch(b.ctx,{...options,reducedMotion:true,time:19});
    assert.deepEqual(images(a).map(c=>c.matrix),images(b).map(c=>c.matrix));assert.ok(record.balanced());
  }
});

test('turbines place one rotor on the historical physical centre at both temperatures',()=>{
  loadStandIns();const s=createGame({missionId:'MI04',seed:1577});
  for(const cooled of [false,true]) {
    for(const turbine of s.industrial.turbines)turbine.cooled=cooled;
    const before=JSON.stringify(s),record=combatRecorder(),renderer=rendererFor(record);
    renderer.drawIndustrialStation(s,7);
    const bodies=frames(record,'turbine',cooled?'cooled':'hot'),rotors=frames(record,'turbine-rotor');
    assert.equal(bodies.length,2);assert.equal(rotors.length,2);
    for(let i=0;i<2;i++) {
      const t=s.industrial.turbines[i],axis=record.point(rotors[i],[0,0]);
      near(axis[0],t.x);near(axis[1],t.y-8);
      const socket=mappedSource(record,bodies[i],paintedVesperFrame('turbine',cooled?'cooled':'hot').anchors.sourcePivot);
      near(socket[0],axis[0]);near(socket[1],axis[1]);
      const frame=paintedVesperFrame('turbine-rotor'),origin=frame.anchors.sourceOrigin;
      // Source alpha has a measured maximum radius of 138.192 pixels. Both
      // painted apertures retain at least 19.9 world units of clear radius.
      const edge=mappedSource(record,rotors[i],[origin[0]+138.192,origin[1]]);
      assert.ok(Math.hypot(edge[0]-axis[0],edge[1]-axis[1])<19.9,'Rotating blades must remain inside the painted aperture');
    }
    const a=combatRecorder(),b=combatRecorder();
    drawPaintedVesperTurbine(a.ctx,{x:100,y:300,cooled,time:2,reducedMotion:true});
    drawPaintedVesperTurbine(b.ctx,{x:100,y:300,cooled,time:21,reducedMotion:true});
    assert.deepEqual(images(a).map(c=>c.matrix),images(b).map(c=>c.matrix));
    assert.equal(JSON.stringify(s),before);assert.ok(record.balanced());
  }
});

test('all four Vesper mission renderers preserve every simulation and save fact',()=>{
  loadStandIns();
  for(const missionId of ['MI01','MI02','MI03','MI04'])for(const reducedMotion of [false,true]) {
    const s=createGame({missionId,seed:1577}),before=JSON.stringify(s),record=combatRecorder();
    rendererFor(record).render(s,{shake:false,reducedMotion});
    assert.ok(images(record).some(call=>call.args[0].atlasKey),`${missionId}: painted objects reached`);
    assert.equal(JSON.stringify(s),before,`${missionId}: render changed simulation`);assert.ok(record.balanced());
  }
});

test('pipe rupture remains an actual gap and slab skins follow the same terrain as foot contacts',()=>{
  loadStandIns();const s=createGame({missionId:'MI01',seed:1577}),passage=s.mission.passage;
  s.campaign.pipeIntact=false;
  let record=combatRecorder();rendererFor(record).drawCampaignLandmarks(s,4);
  const pipe=strips(record,'pipe'),mid=(passage.pipeFrom+passage.pipeTo)/2;
  assert.ok(pipe.length>0);assert.equal(strips(record,'slab').length,0);
  for(const call of pipe) {
    const [, , , , ,x,y,w,h]=call.args;
    assert.ok(x+w<=mid-28||x>=mid+28,'No painted pipe crosses the physical rupture gap');
    near(y,terrainAt(x+(w-.03)/2,s.planetId)+1.5);near(h,13);
  }
  s.campaign.pipeIntact=true;s.campaign.passageSecured=true;
  record=combatRecorder();rendererFor(record).drawCampaignLandmarks(s,4);
  const slabs=strips(record,'slab');assert.ok(slabs.length>10);
  for(const call of slabs) {
    const [, , , , ,x,y,w,h]=call.args;near(y,terrainAt(x+(w-.03)/2,s.planetId));near(h,13);
    assert.ok(x>=passage.pipeFrom-14&&x+w<=passage.pipeTo+14.031);
  }
  near(Math.min(...slabs.map(c=>c.args[5])),passage.pipeFrom-14);
  near(Math.max(...slabs.map(c=>c.args[5]+c.args[7])),passage.pipeTo+14.03);
});

test('filter deliveries draw exactly twenty-four crates only after the existing delivery fact',()=>{
  loadStandIns();const s=createGame({missionId:'MI01',seed:1577});
  for(const delivered of [false,true]) {
    s.campaign.filtersDelivered=delivered;const before=JSON.stringify(s),record=combatRecorder();
    rendererFor(record).drawCampaignLandmarks(s,2);
    assert.equal(frames(record,'filter-crate').length,delivered?24:0);
    const depot=frames(record,'depot')[0];near(record.point(depot,[0,0])[0],s.mission.deliveryX-19);
    assert.equal(JSON.stringify(s),before);
  }
});

test('missing or invalid decoding keeps vector fallback and a reset cannot install stale images',async()=>{
  clearPaintedVesper();assert.throws(()=>setPaintedVesperImage('foreign',{width:1,height:1}),/Unknown/);
  assert.throws(()=>setPaintedVesperImage('housing',{width:1536,height:1024}),/dimensions/);
  const empty=combatRecorder();assert.equal(drawPaintedVesperWinch(empty.ctx),false);
  assert.equal(drawPaintedVesperTurbine(empty.ctx),false);assert.equal(images(empty).length,0);
  await loadPaintedVesper({loadImage:async()=>{throw new Error('Decode failure');}});
  assert.ok(Object.values(paintedVesperStatus()).every(status=>status.state==='failed'));
  for(const missionId of ['MI01','MI02','MI03','MI04']) {
    const s=createGame({missionId}),before=JSON.stringify(s),record=combatRecorder();rendererFor(record).drawCampaignLandmarks(s,0);
    assert.equal(images(record).length,0);assert.ok(record.calls.some(c=>c.method==='fill'));
    assert.equal(JSON.stringify(s),before);assert.ok(record.balanced());
  }
  clearPaintedVesper();const pending=[];
  const first=loadPaintedVesper({loadImage:(_url,key)=>new Promise(resolve=>pending.push(()=>resolve({width:PAINTED_VESPER_LAYOUT[key].size[0],height:PAINTED_VESPER_LAYOUT[key].size[1]})))});
  clearPaintedVesper();pending.forEach(resolve=>resolve());await first;
  assert.ok(Object.values(paintedVesperStatus()).every(status=>status.state==='idle'));
  await loadPaintedVesper({loadImage:async(_url,key)=>({width:PAINTED_VESPER_LAYOUT[key].size[0],height:PAINTED_VESPER_LAYOUT[key].size[1]})});
  assert.ok(Object.values(paintedVesperStatus()).every(status=>status.state==='ready'));
});

test('failed drawing retires the affected atlas, balances Canvas state and retains a vector route',()=>{
  loadStandIns();const record=combatRecorder();record.ctx.drawImage=()=>{throw new Error('Broken image');};
  assert.equal(drawPaintedVesperPart(record.ctx,{part:'depot'}),false);
  assert.equal(paintedVesperStatus().outposts.state,'failed');assert.ok(record.balanced());
  assert.equal(drawPaintedVesperPart(record.ctx,{part:'depot'}),false);
  const invalid=combatRecorder();assert.equal(drawPaintedVesperGroundStrip(invalid.ctx,{part:'pipe',from:4,to:1,groundAt:()=>3}),false);
  assert.equal(images(invalid).length,0);assert.ok(invalid.balanced());
});
