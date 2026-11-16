import test from 'node:test';
import assert from 'node:assert/strict';
import { PAINTED_TRANSPORT_LAYOUT } from '../src/painted-transport-layout.mjs';
import { clearPaintedTransport, loadPaintedTransport, setPaintedTransportImage, paintedTransportStatus,
  paintedTransportFrame, trainCarPaintedFrame, trainWheelPose, trainCouplerPose, trainPassengerCount, industrialCarrierPaintedFrame,
  industrialWheelPose, drawPaintedTrainCar, drawPaintedIndustrialCarrier, industrialCargoPaintedFrame, drawPaintedIndustrialCargo } from '../src/painted-transport.mjs';
import { createGame, updateGame } from '../src/simulation.mjs';

function decoded(key) { const [width,height]=PAINTED_TRANSPORT_LAYOUT[key].size;return {width,height}; }
function recorder() {
  const calls=[];const c={calls};
  for(const name of ['save','restore','translate','scale','rotate','drawImage','beginPath','rect','clip','arc','fill','fillRect','moveTo','lineTo','stroke']) c[name]=(...args)=>calls.push([name,...args]);
  return c;
}
test('transport requires decoded original dimensions and returns defensive metadata',()=>{
  clearPaintedTransport();
  assert.throws(()=>setPaintedTransportImage('foreign',{width:1,height:1}),/Unknown/);
  assert.throws(()=>setPaintedTransportImage('wagons',{width:100,height:100}),/dimensions/);
  const first=paintedTransportFrame('wagons','hostages-closed');first.source[0]=-50;first.window[0]=-999;
  assert.ok(paintedTransportFrame('wagons','hostages-closed').source[0]>0);
  assert.notEqual(paintedTransportFrame('wagons','hostages-closed').window[0],-999);
  assert.equal(paintedTransportFrame('wagons','missing'),null);
});
test('missing transport art returns to the vector path without any drawing or simulation mutation',()=>{
  clearPaintedTransport();const s=createGame({missionId:'MI02'}),f=createGame({missionId:'MI13'}),before=JSON.stringify([s,f]),c=recorder();
  assert.equal(drawPaintedTrainCar(c,s.train,s.train,s.campaign),false);
  assert.equal(drawPaintedIndustrialCarrier(c,f.foundry.carrier),false);
  assert.equal(c.calls.length,0);assert.equal(JSON.stringify([s,f]),before);
});
test('railway damage, rescue and wreck selection follows existing facts with wreck priority',()=>{
  const s=createGame({missionId:'MI02'}),t=s.train,ore=t.wagons[0],hostages=t.wagons[1];
  assert.equal(trainCarPaintedFrame(t,t,s.campaign).name,'intact');
  assert.equal(trainCarPaintedFrame(ore,t,s.campaign).name,'ore-intact');
  assert.equal(trainCarPaintedFrame(hostages,t,s.campaign).name,'hostages-closed');
  hostages.hp=100;assert.equal(trainCarPaintedFrame(hostages,t,s.campaign).name,'hostages-damaged');
  s.campaign.rescueResolved=true;assert.equal(trainCarPaintedFrame(hostages,t,s.campaign).name,'hostages-open-damaged');
  hostages.destroyed=true;assert.equal(trainCarPaintedFrame(hostages,t,s.campaign).name,'hostages-wreck');
  t.hp=0;assert.equal(trainCarPaintedFrame(t,t,s.campaign).name,'wreck');
});
test('wagon occupants are only remaining simulated people and disappear after rescue or loss',()=>{
  const car={hp:100},c={hostagesTotal:6,hostagesLost:2,rescueResolved:false};
  assert.equal(trainPassengerCount(car,c),4);
  assert.equal(trainPassengerCount(car,{...c,rescueResolved:true}),0);
  assert.equal(trainPassengerCount({...car,hp:0},c),0);
  assert.equal(trainPassengerCount(car,{...c,hostagesLost:8}),0);
});
test('rail wheels retain physical centres and rotation when the train stops',()=>{
  const s=createGame({missionId:'MI02'}),car=s.train.wagons[1];s.train.moving=true;
  const moving=trainWheelPose(car,s.train,-1);s.train.moving=false;
  assert.deepEqual(trainWheelPose(car,s.train,-1),moving);
  assert.equal(moving.x,car.x-car.w/2+24);assert.equal(moving.y,car.y+car.h/2-3);assert.equal(moving.radius,15);
});
test('rail couplers meet painted hardware and retain legacy endpoints for missing images',()=>{
  clearPaintedTransport();const s=createGame({missionId:'MI02'}),ore=s.train.wagons[0],passengers=s.train.wagons[1],before=JSON.stringify(s);
  assert.deepEqual(trainCouplerPose(ore,s.train,s.campaign,1),{x:ore.x+ore.w/2,y:ore.y+22,painted:false});
  for(const key of ['locomotive','wagons'])setPaintedTransportImage(key,decoded(key));
  const orePoint=trainCouplerPose(ore,s.train,s.campaign,-1),passengerPoint=trainCouplerPose(passengers,s.train,s.campaign,1);
  assert.equal(orePoint.painted,true);assert.equal(passengerPoint.painted,true);
  assert.ok(orePoint.y<ore.y+10,'Ore coupling is above the obsolete y+22 line');
  assert.ok(passengerPoint.y<passengers.y+16,'Passenger coupling is above the obsolete y+22 line');
  assert.deepEqual(trainCouplerPose(ore,s.train,s.campaign,1,{painted:false}),{x:ore.x+ore.w/2,y:ore.y+22,painted:false});
  assert.equal(JSON.stringify(s),before);
});
test('industrial wheels follow four real ground contacts and crates meet the authored deck',()=>{
  const s=createGame({missionId:'MI13'});updateGame(s,1/60,{});const p=s.foundry.carrier;
  assert.equal(p.wheels.length,4);
  for(const wheel of p.wheels){const pose=industrialWheelPose(p,wheel);assert.equal(pose.x,wheel.x);assert.equal(pose.y+pose.radius,wheel.groundY);}
  const frame=paintedTransportFrame('carrier','intact');assert.equal(frame.anchors.pivot[1],-p.h/2);
  for(const cargo of s.foundry.cargo) assert.equal(cargo.y+cargo.h/2,p.y+frame.anchors.pivot[1]);
  p.hp=100;assert.equal(industrialCarrierPaintedFrame(p),'damaged');p.destroyed=true;assert.equal(industrialCarrierPaintedFrame(p),'wreck');
});
test('painted transport draws only one shell and its independent wheels without touching saved facts',()=>{
  clearPaintedTransport();for(const key of Object.keys(PAINTED_TRANSPORT_LAYOUT))setPaintedTransportImage(key,decoded(key));
  const s=createGame({missionId:'MI02'}),f=createGame({missionId:'MI13'}),before=JSON.stringify([s,f]),a=recorder(),b=recorder();
  assert.equal(drawPaintedTrainCar(a,s.train,s.train,s.campaign),true);
  assert.equal(a.calls.filter(c=>c[0]==='drawImage').length,3);
  assert.equal(drawPaintedIndustrialCarrier(b,f.foundry.carrier),true);
  assert.equal(b.calls.filter(c=>c[0]==='drawImage').length,5);
  assert.equal(JSON.stringify([s,f]),before);
});
test('decode failure stays local while other transport atlases remain usable',async()=>{
  clearPaintedTransport();await loadPaintedTransport({loadImage:async(url,key)=>{if(key==='wagons')throw new Error('bad PNG');return decoded(key);}});
  const status=paintedTransportStatus();assert.equal(status.wagons.state,'failed');assert.equal(status.locomotive.state,'ready');assert.equal(status.carrier.state,'ready');
});
test('cargo retains its own physical placement, damage and copied evidence state',()=>{
  clearPaintedTransport();setPaintedTransportImage('cargo',decoded('cargo'));
  const cargo=createGame({missionId:'MI13'}).foundry.cargo[0];
  assert.equal(industrialCargoPaintedFrame(cargo),'sealed');cargo.markingCopied=true;assert.equal(industrialCargoPaintedFrame(cargo),'copied');
  cargo.hp=100;assert.equal(industrialCargoPaintedFrame(cargo),'damaged');
  const before=JSON.stringify(cargo),ctx=recorder();assert.equal(drawPaintedIndustrialCargo(ctx,cargo),true);
  assert.ok(ctx.calls.some(call=>call[0]==='translate'&&call[1]===cargo.x&&call[2]===cargo.y+cargo.h/2));
  assert.equal(JSON.stringify(cargo),before);cargo.destroyed=true;assert.equal(industrialCargoPaintedFrame(cargo),'destroyed');assert.equal(cargo.markingCopied,true);
});
test('clearing an in-flight load prevents stale transport images from returning',async()=>{
  clearPaintedTransport();let releases=[];
  const pending=loadPaintedTransport({loadImage:(url,key)=>new Promise(resolve=>releases.push(()=>resolve(decoded(key))))});
  clearPaintedTransport();for(const release of releases)release();await pending;
  assert.ok(Object.values(paintedTransportStatus()).every(s=>s.state==='idle'));
});
