/** Decode original PNGs and inspect MI13 Canvas scenes. Not a browser or human test. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_FOUNDRY_SITES_LAYOUT } from '../src/painted-foundry-sites-layout.mjs';
import { clearPaintedFoundrySites, loadPaintedFoundrySites, paintedFoundrySitesStatus,
  drawPaintedFoundrySiteAsset, drawPaintedFoundryDeck, drawPaintedFoundrySteamOutlet } from '../src/painted-foundry-sites.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedTransport } from '../src/painted-transport.mjs';
import { Renderer } from '../src/renderer.mjs';
import { createGame, foundrySurfaceAt } from '../src/simulation.mjs';
import { drawFoundrySite } from '../src/foundry-renderer.mjs';
import { pilotMI13 } from '../tests/helpers/mi13-driver.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2]?resolve(process.argv[2]):resolve(root,'../outputs/painted-foundry-sites-qa');
const require=createRequire(import.meta.url);let api;
try { api=require('@napi-rs/canvas'); }
catch(cause) { if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw new Error('PNG QA requires @napi-rs/canvas',{cause});api=require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas')); }
const {createCanvas,loadImage}=api,sha=bytes=>createHash('sha256').update(bytes).digest('hex');
mkdirSync(output,{recursive:true});
const sources=['src/painted-foundry-sites.mjs','src/painted-foundry-sites-layout.mjs','src/foundry-renderer.mjs','src/foundry-simulation.mjs',
  'assets/painted/foundry-sites/anchors.json','tools/index-painted-foundry-sites.py','tools/test-painted-foundry-sites.mjs','tests/helpers/mi13-driver.mjs'];
const receipt={version:'0.15.7',createdUtc:new Date().toISOString(),type:'Original PNG decoding, state diagnostics and public-input MI13 Canvas scenes',
  completed:false,nativeBrowserExecuted:false,humanPlaytestPerformed:false,atlases:[],frames:[],views:[],
  sourceHashes:Object.fromEntries(sources.map(path=>[path,sha(readFileSync(resolve(root,path)))])),
  limitations:['Diagnostic states use explicit presentation options; public-input mission snapshots are identified separately.',
    'Crane hook is a presentation rig, not a simulated cargo constraint. Deck skin follows the exact existing physical surface.',
    'No new population, acquisition, inventory, damage model or save field is introduced. Historical evidence and PNGs are unchanged.']};
const ids=new WeakMap(),decoded={};
const track=ctx=>{const calls={},draw=ctx.drawImage;ctx.drawImage=function(...args){const key=ids.get(args[0]);if(key)calls[key]=(calls[key]||0)+1;return draw.apply(this,args);};return calls;};
const save=(canvas,name,extra={})=>{const bytes=canvas.toBuffer('image/png');writeFileSync(resolve(output,name),bytes);receipt.views.push({file:name,sha256:sha(bytes),width:canvas.width,height:canvas.height,...extra});};
const background=(ctx,w,h)=>{ctx.fillStyle='#25363c';ctx.fillRect(0,0,w,h);};
const label=(ctx,text,x,y)=>{ctx.fillStyle='#e6d6b6';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText(text,x,y);};
const manifest=JSON.parse(readFileSync(resolve(root,'assets/painted/foundry-sites/manifest.json')));
clearPaintedFoundrySites();
await loadPaintedFoundrySites({loadImage:async(url,key)=>{
  const path=fileURLToPath(url),bytes=readFileSync(path),image=await loadImage(path),atlas=PAINTED_FOUNDRY_SITES_LAYOUT[key];
  assert.equal(sha(bytes),manifest.files.find(file=>file.id===key).sha256);decoded[key]=image;ids.set(image,key);
  const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,image.width,image.height).data;
  const alpha=(x,y)=>pixels[(y*image.width+x)*4+3];let transparent=0,solid=0;
  for(let i=3;i<pixels.length;i+=4){if(!pixels[i])transparent++;if(pixels[i]>=230)solid++;}
  assert.ok(transparent/(image.width*image.height)>.35&&solid>1000,`${key}: alpha cutout`);
  for(const [name,frame]of Object.entries(atlas.frames)){
    const [x,y,w,h]=frame.cell;
    for(let dx=0;dx<w;dx++)for(const dy of [0,1,h-2,h-1])assert.ok(alpha(x+dx,y+dy)<=2,`${key}/${name}: row gutter`);
    for(let dy=0;dy<h;dy++)for(const dx of [0,1,w-2,w-1])assert.ok(alpha(x+dx,y+dy)<=2,`${key}/${name}: column gutter`);
    const [u,v,sw,sh]=frame.source;assert.ok(u>=x&&v>=y&&u+sw<=x+w&&v+sh<=y+h);
    assert.ok(frame.target.every(Number.isFinite));
    const [px,py]=frame.anchors.sourcePivot,[tx,ty,tw,th]=frame.target;
    assert.ok(Math.abs(tx+(px-u)*tw/sw)<1e-6&&Math.abs(ty+(py-v)*th/sh)<1e-6,`${key}/${name}: pivot`);
    receipt.frames.push({atlas:key,name,source:frame.source,target:frame.target});
  }
  for(const i of atlas.emptyCells){const x=i%3*512,y=Math.floor(i/3)*512;for(let yy=y;yy<y+512;yy++)for(let xx=x;xx<x+512;xx++)assert.ok(alpha(xx,yy)<32,'Blank cell has no subject');}
  receipt.atlases.push({id:key,bytes:bytes.length,sha256:sha(bytes),size:[image.width,image.height],transparentFraction:transparent/(image.width*image.height)});
  return image;
}});
assert.ok(Object.values(paintedFoundrySitesStatus()).every(s=>s.state==='ready'));assert.equal(receipt.frames.length,23);
const loader={loadImage:url=>loadImage(fileURLToPath(url))};
await Promise.all([loadPaintedWalkers(loader),loadPaintedCombat(loader),loadPaintedTransport(loader)]);

const board=createCanvas(2500,2080),b=board.getContext('2d');background(b,board.width,board.height);
label(b,'MI13 / CHANTIER DE KHARON — 23 CELLULES PEINTES',1250,35);
const rows=[['steam-valve',['closed','warning','jet','open','destroyed']],['transfer-crane',['idle','working','received','quarantine']],
  ['analysis-console',['idle','working','complete']],['cargo-manifest',['sealed','copied','destroyed']]];
for(const [row,[part,states]] of rows.entries())for(const [col,state]of states.entries()){
  const x=260+col*490,y=330+row*340;
  b.fillStyle=(row+col)%2?'#34474a':'#1d3035';b.fillRect(x-235,y-275,470,315);
  b.strokeStyle='#8c9f95';b.beginPath();b.moveTo(x-205,y);b.lineTo(x+205,y);b.stroke();
  assert.equal(drawPaintedFoundrySiteAsset(b,{part,state,x,y,scale:part==='transfer-crane'?1.25:1.7,progress:.6,working:state==='quarantine'}),true);
  label(b,`${part} / ${state}`,x,y+25);
}
for(const [col,state]of ['hot','cooling','cooled'].entries()){
  const x=260+col*720,y=1550;assert.equal(drawPaintedFoundryDeck(b,{state,start:x-210,end:x+210,surfaceAt:()=>y}),true);
  label(b,`tablier / ${state}`,x,y+60);
}
for(const [col,state]of ['rest','warning','jet'].entries()){
  const x=260+col*720,y=1770;b.save();b.translate(x,y);b.scale(3,3);assert.equal(drawPaintedFoundrySteamOutlet(b,{state}),true);b.restore();
  label(b,`grille vapeur / ${state}`,x,y+40);
}
for(const [col,[atlas,name]]of [['valves','wheel'],['cranes','hook']].entries()){
  const frame=PAINTED_FOUNDRY_SITES_LAYOUT[atlas].frames[name];b.save();b.translate(2100,1580+col*260);b.scale(3,3);b.drawImage(decoded[atlas],...frame.source,...frame.target);b.restore();
  label(b,`pièce séparée / ${name}`,2100,1680+col*260);
}
save(board,'foundry-sites-state-board.png',{diagnostic:true,frames:23});

const slope=createCanvas(1600,1080),sc=slope.getContext('2d');background(sc,1600,1080);
const diagnostic=createGame({missionId:'MI13',walkerId:'WK09',seed:157});
for(const [row,phase]of ['warning','jet','off'].entries()){
  const d=structuredClone(diagnostic),bridge=d.foundry.bridges[0];bridge.steam.phase=phase;bridge.circuitOpen=phase==='off';bridge.temperature=phase==='off'?28:90;
  const before=JSON.stringify(d),cameraX=bridge.valve.x-450;
  sc.save();sc.translate(-cameraX,310+row*340-foundrySurfaceAt(d,bridge.start).groundY);
  drawFoundrySite({ctx:sc,cameraX,visible:x=>x>=cameraX&&x<=cameraX+1600,options:{reducedMotion:true}},d,0);sc.restore();
  assert.equal(JSON.stringify(d),before);label(sc,`Diagnostic physique : ${phase} / ${bridge.temperature} °C`,800,40+row*340);
}
save(slope,'foundry-thermal-surface-diagnostic.png',{diagnostic:true,cases:['warning','jet','off'],scope:'Camera diagnostic of unchanged terrain contacts and exact existing 270-unit steam hazard width'});

globalThis.window={devicePixelRatio:1};globalThis.Image=class{set src(_) {}};
const panorama=await loadImage(resolve(root,'assets/art/vesper-panorama.png'));
const state=createGame({missionId:'MI13',walkerId:'WK09',difficulty:'normal',seed:157});
const scenes=new Map([['arrival',structuredClone(state)]]);
pilotMI13(state,{choice:'defy',observe:s=>{
  const d=s.foundry;
  for(const [name,condition]of[
    ['valve-working',d.bridges.some(bridge=>bridge.valve.working&&bridge.valve.progress>.45)],
    ['deck-cooling',d.bridges.some(bridge=>bridge.circuitOpen&&bridge.temperature<65&&bridge.temperature>33)],
    ['analysis-working',d.analysis.working&&d.analysis.progress>.45],
    ['quarantine-transfer',d.cargo.some(cargo=>cargo.transfer.working&&cargo.transfer.progress>.45)],
    ['received',s.campaign.operationsResolved&&!d.report.transmitted],
  ])if(condition&&!scenes.has(name))scenes.set(name,structuredClone(s));
}});
assert.equal(state.status,'won');assert.equal(scenes.size,6);
for(const [name,s]of scenes){
  const canvas=createCanvas(1600,900),renderer=new Renderer(canvas),drawCalls=track(renderer.ctx),before=JSON.stringify(s);
  renderer.panorama=panorama;renderer.panoramaReady=true;renderer.render(s,{shake:false,reducedMotion:true});
  assert.equal(JSON.stringify(s),before);assert.ok(Object.values(drawCalls).reduce((a,b)=>a+b,0)>0,`${name}: actual MI13 PNG calls`);
  writeFileSync(resolve(output,`mi13-${name}.state.json`),JSON.stringify(s,null,2)+'\n');
  save(canvas,`mi13-${name}.png`,{diagnostic:false,source:'Unmodified pilotMI13 public commands',elapsed:s.elapsed,drawCalls,
    facts:{circuits:digestBridges(s),manifestCopied:s.foundry.manifest.copied,analysisComplete:s.foundry.analysis.completed,
      cargo:s.foundry.cargo.map(cargo=>({id:cargo.id,x:cargo.x,y:cargo.y,transferred:cargo.transferred,progress:cargo.transfer.progress})),pt03:s.campaign.pt03Acquired}});
}
function digestBridges(s){return s.foundry.bridges.map(b=>({id:b.id,temperature:b.temperature,circuitOpen:b.circuitOpen,steamPhase:b.steam.phase,valveDestroyed:b.valve.destroyed}));}
receipt.completed=true;receipt.publicRun={status:state.status,choice:'defy',pt03Acquired:state.campaign.pt03Acquired,sceneCount:scenes.size};
writeFileSync(resolve(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(`MI13 foundry sites: ${receipt.atlases.length} original atlases, ${receipt.frames.length} cells, ${receipt.views.length} Canvas views; public run ${state.status}. Not a browser or human test.`);
