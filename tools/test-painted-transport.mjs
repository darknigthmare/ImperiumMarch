/** PNG decoding and integration proof; Canvas renders are not browser screenshots. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync,writeFileSync,mkdirSync,existsSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_TRANSPORT_LAYOUT } from '../src/painted-transport-layout.mjs';
import { loadPaintedTransport, paintedTransportFrame, drawPaintedTrainCar, drawPaintedIndustrialCarrier, drawPaintedIndustrialCargo, drawPaintedTransportFrame } from '../src/painted-transport.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedSprites } from '../src/painted-sprites.mjs';
import { loadPaintedThyr } from '../src/painted-thyr.mjs';
import { loadPaintedCerbere } from '../src/painted-cerbere.mjs';
import { Renderer } from '../src/renderer.mjs';
import { createGame } from '../src/simulation.mjs';
import { pilotMI02 } from '../tests/helpers/mi02-driver.mjs';
import { pilotMI13 } from '../tests/helpers/mi13-driver.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=resolve(process.argv[2] || resolve(root,'../outputs/painted-transport-qa'));
const require=createRequire(import.meta.url);let api;
try{api=require('@napi-rs/canvas');}catch{api=require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));}
const {createCanvas,loadImage,GlobalFonts}=api;
if(existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf','Courier New');
const sha=b=>createHash('sha256').update(b).digest('hex');
mkdirSync(output,{recursive:true});
const receipt={version:JSON.parse(readFileSync(resolve(root,'package.json'))).version,createdUtc:new Date().toISOString(),
 type:'Actual PNG decoding and transport Canvas rendering',browserExecuted:false,humanPlaytestPerformed:false,completed:false,atlases:[],frames:[],views:[],
 sourceHashes:Object.fromEntries(['src/painted-transport.mjs','src/painted-transport-layout.mjs','src/renderer.mjs','src/foundry-renderer.mjs','tools/test-painted-transport.mjs'].map(p=>[p,sha(readFileSync(resolve(root,p)))])),
 limitations:['State boards use explicit diagnostic copies; integrated mission scenes use public controls.','Vehicle paint does not add crew, cargo, passenger counts, corpses, physics, or final gameplay systems.']};
const pictureIds=new WeakMap();
const decoded={};
await loadPaintedTransport({loadImage:async(url,key)=>{
 const path=fileURLToPath(url),bytes=readFileSync(path),image=await loadImage(path);decoded[key]=image;pictureIds.set(image,key);
 const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const rgba=ctx.getImageData(0,0,image.width,image.height).data;
 let clear=0,solid=0;for(let i=3;i<rgba.length;i+=4){if(rgba[i]===0)clear++;if(rgba[i]>128)solid++;}
 assert.ok(clear>image.width*image.height*.15);assert.ok(solid>1000);
 const count=([x,y,w,h])=>{let sum=0;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(rgba[(yy*image.width+xx)*4+3]>128)sum++;return sum;};
 for(const name of Object.keys(PAINTED_TRANSPORT_LAYOUT[key].frames)){
  const frame=paintedTransportFrame(key,name),[x,y,w,h]=frame.source,[cx,cy,cw,ch]=frame.cell;
  assert.ok(frame.source.every(Number.isInteger));assert.ok(x>=cx&&y>=cy&&x+w<=cx+cw&&y+h<=cy+ch);
  const inside=count(frame.source),all=count(frame.cell);assert.ok(inside>30);assert.ok(all-inside<Math.max(50,all*.01));
  const [px,py]=frame.anchors.sourcePivot,[dx,dy,dw,dh]=frame.target;
  assert.ok(Math.abs(dx+(px-x)*dw/w-frame.anchors.pivot[0])<.001);
  assert.ok(Math.abs(dy+(py-y)*dh/h-frame.anchors.pivot[1])<.001);
  for(const [side,point]of Object.entries(frame.anchors.sourceCouplers||{})){
    const [ax,ay]=point;assert.ok(rgba[(Math.round(ay)*image.width+Math.round(ax))*4+3]>128,`${key}/${name}/${side}: coupling endpoint must touch actual painted metal`);
    const expected=frame.anchors.couplers[side];
    assert.ok(Math.abs(dx+(ax-x)*dw/w-expected[0])<.001&&Math.abs(dy+(ay-y)*dh/h-expected[1])<.001,`${key}/${name}/${side}: source coupling must resolve to its rendered endpoint`);
  }
  receipt.frames.push({atlas:key,name,source:frame.source,target:frame.target,occupiedPixels:inside,anchors:frame.anchors});
 }
 receipt.atlases.push({id:key,file:path.slice(root.length+1),width:image.width,height:image.height,bytes:bytes.length,sha256:sha(bytes),transparentPixels:clear,solidPixels:solid});return image;
}});
assert.equal(receipt.atlases.length,4);assert.equal(receipt.frames.length,20);
const loader={loadImage:url=>loadImage(fileURLToPath(url))};
await Promise.all([loadPaintedCombat(loader),loadPaintedWalkers(loader),loadPaintedSprites(loader),loadPaintedThyr(loader),loadPaintedCerbere(loader)]);
function track(ctx){const calls=[],original=ctx.drawImage;ctx.drawImage=function(...args){const atlas=pictureIds.get(args[0]);if(atlas)calls.push({atlas,source:args.slice(1,5),target:args.slice(5)});return original.apply(ctx,args);};return calls;}
function save(canvas,file,detail){const bytes=canvas.toBuffer('image/png');writeFileSync(resolve(output,file),bytes);receipt.views.push({file,width:canvas.width,height:canvas.height,sha256:sha(bytes),...detail});}
function background(ctx,w,h){ctx.fillStyle='#152c32';ctx.fillRect(0,0,w,h);}
const board=createCanvas(1800,1600),ctx=board.getContext('2d');background(ctx,board.width,board.height);const boardCalls=track(ctx);
const cases=[['locomotive','intact'],['locomotive','damaged'],['locomotive','wreck'],['wagons','ore-intact'],['wagons','hostages-closed'],['wagons','hostages-open'],['carrier','intact'],['carrier','damaged'],['carrier','wreck'],['cargo','sealed'],['cargo','copied'],['cargo','destroyed']];
for(const [i,[atlas,name]] of cases.entries()){
 const x=i%3*600,y=Math.floor(i/3)*400;ctx.fillStyle=i%2?'#c8c9b9':'#28434a';ctx.fillRect(x+10,y+10,580,380);
 const s=createGame({missionId:atlas==='carrier'?'MI13':'MI02'});
 ctx.save();ctx.translate(x+300,y+240);ctx.scale(atlas==='carrier'?1.75:2.5,atlas==='carrier'?1.75:2.5);
 if(atlas==='cargo'){
  drawPaintedTransportFrame(ctx,'cargo',name,{y:25});
 }else if(atlas==='carrier'){
  const p=structuredClone(s.foundry.carrier);p.x=0;p.y=0;p.wheels=p.wheels.map(w=>({...w,x:w.x-s.foundry.carrier.x,y:w.y-s.foundry.carrier.y}));p.hp=name==='damaged'?100:name==='wreck'?0:p.maxHp;p.destroyed=name==='wreck';drawPaintedIndustrialCarrier(ctx,p);
 }else{
  const car=atlas==='locomotive'?s.train:name.startsWith('ore')?s.train.wagons[0]:s.train.wagons[1];car.x=0;car.y=0;
  if(name.includes('damaged'))car.hp=car.maxHp*.5;if(name.includes('wreck')){car.hp=0;car.destroyed=true;}s.campaign.rescueResolved=name.includes('open');drawPaintedTrainCar(ctx,car,s.train,s.campaign);
 }
 ctx.restore();ctx.fillStyle=i%2?'#1a3339':'#e0e2ca';ctx.font='bold 19px "Courier New"';ctx.textAlign='left';ctx.fillText(`${atlas} / ${name}`,x+30,y+43);ctx.font='14px "Courier New"';ctx.fillText('Assemblage de diagnostic',x+30,y+68);
}
save(board,'transport-state-board.png',{type:'Diagnostic states of assembled vehicles',drawCalls:boardCalls});

globalThis.window={devicePixelRatio:1};globalThis.Image=class{set src(_) {}};
const panorama=await loadImage(resolve(root,'assets/art/vesper-panorama.png'));
const railway=createGame({missionId:'MI02',walkerId:'WK01',difficulty:'normal',seed:1847});
const industry=createGame({missionId:'MI13',walkerId:'WK05',difficulty:'normal',seed:1847});
const scenes=[
 {name:'mi02-closed-wagon.png',state:railway,drive:()=>pilotMI02(railway,{stopAt:s=>s.train.brakeWorking&&s.train.brakeProgress>.4}),reached:s=>s.train.brakeWorking},
 {name:'mi02-open-wagon.png',state:railway,drive:()=>pilotMI02(railway,{stopAt:s=>s.decision.active}),reached:s=>s.campaign.rescueResolved},
 {name:'mi13-carrier-loading.png',state:industry,drive:()=>{},reached:s=>!s.foundry.carrier.released},
 {name:'mi13-carrier-escort.png',state:industry,drive:()=>pilotMI13(industry,{stopAt:s=>s.foundry.carrier.distance>300}),reached:s=>s.foundry.carrier.distance>300},
];
for(const stage of scenes){
 stage.drive();const s=stage.state;assert.ok(stage.reached(s),`${stage.name}: public control state`);const before=JSON.stringify(s);
 const canvas=createCanvas(1600,900),renderer=new Renderer(canvas),calls=track(renderer.ctx);renderer.panorama=panorama;renderer.panoramaReady=true;renderer.render(s,{shake:false});
 assert.equal(JSON.stringify(s),before,'Renderer must not change saved facts');assert.ok(calls.length>0,`${stage.name}: transported PNG is visible`);
 save(canvas,stage.name,{type:'Canvas mission scene reached through public controls',missionId:s.missionId,elapsed:s.elapsed,drawCalls:calls,
  facts:s.train?{trainX:s.train.x,rescueResolved:s.campaign.rescueResolved,hostagesLost:s.campaign.hostagesLost,hostagesRescued:s.campaign.hostagesRescued}:{carrierX:s.foundry.carrier.x,carrierDistance:s.foundry.carrier.distance,cargo:s.foundry.cargo.map(c=>({id:c.id,x:c.x,y:c.y,transferred:c.transferred})),wheels:s.foundry.carrier.wheels}});
}
receipt.completed=true;writeFileSync(resolve(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(`Transport reception: ${receipt.atlases.length} atlases, ${receipt.frames.length} cells, ${receipt.views.length} Canvas views. Not a browser test.`);
