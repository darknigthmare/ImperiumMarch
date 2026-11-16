/** Real PNG decoding and Vesper Canvas reception. No browser or human test. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_VESPER_LAYOUT } from '../src/painted-vesper-layout.mjs';
import { PAINTED_VESPER_PARTS, loadPaintedVesper, clearPaintedVesper, paintedVesperStatus, paintedVesperFrame } from '../src/painted-vesper.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedTransport } from '../src/painted-transport.mjs';
import { createGame, updateGame, commandGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI02 } from '../tests/helpers/mi02-driver.mjs';
import { pilotMI03 } from '../tests/helpers/mi03-driver.mjs';
import { pilotMI04 } from '../tests/helpers/mi04-driver.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2]?resolve(process.argv[2]):resolve(root,'docs/validation/painted-vesper-v0157');
const require=createRequire(import.meta.url);let api;
try {api=require('@napi-rs/canvas');}
catch(cause) {if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw new Error('Vesper PNG reception requires @napi-rs/canvas',{cause});api=require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));}
const {createCanvas,loadImage}=api,sha=bytes=>createHash('sha256').update(bytes).digest('hex');
mkdirSync(output,{recursive:true});
const sourcePaths=['src/painted-vesper.mjs','src/painted-vesper-layout.mjs','src/renderer.mjs','src/simulation.mjs',
  'assets/painted/vesper/manifest.json','assets/painted/vesper/prompts.json',
  'tools/index-painted-vesper.py','tools/test-painted-vesper.mjs','tests/painted-vesper.test.mjs',
  'tests/helpers/mi02-driver.mjs','tests/helpers/mi03-driver.mjs','tests/helpers/mi04-driver.mjs'];
const receipt={version:'0.15.7',createdUtc:new Date().toISOString(),completed:false,
  type:'Original PNG decoding, imposed diagnostic states and public-input Vesper Canvas scenes',
  browserExecuted:false,humanPlaytestPerformed:false,atlases:[],frames:[],views:[],publicRuns:[],
  sourceHashes:Object.fromEntries(sourcePaths.map(path=>[path,sha(readFileSync(resolve(root,path)))])),
  limitations:['The labelled diagnostic panels impose presentation states on separate game copies; they are not mission completions.',
    'Public-input scene snapshots are reached using createGame, updateGame and commandGame without editing live game facts.',
    'MI04 starts with an explicitly configured campaignContext; this is not a replay of an independently completed MI01–MI03 dossier.',
    'The Canvas renderer omits the browser DOM, native input, audio and hardware performance evidence.',
    'No human readability, final animation, browser or new mission acceptance criterion is closed.']};
const decoded={},imageIds=new WeakMap(),manifest=JSON.parse(readFileSync(resolve(root,'assets/painted/vesper/manifest.json')));
const prompts=JSON.parse(readFileSync(resolve(root,'assets/painted/vesper/prompts.json')));
const addresses=Object.entries(PAINTED_VESPER_PARTS).flatMap(([part,spec])=>(spec.states||Object.keys(spec.names)).map(state=>({part,state,frame:paintedVesperFrame(part,state)})));
const countPixels=(data,width,[x,y,w,h],threshold=32)=>{
  let count=0;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(data[(yy*width+xx)*4+3]>=threshold)count++;return count;
};
function save(canvas,file,info={}) {
  const bytes=canvas.toBuffer('image/png');writeFileSync(resolve(output,file),bytes);
  receipt.views.push({file,width:canvas.width,height:canvas.height,sha256:sha(bytes),...info});
}
function panel(c,[x,y,w,h],title,light=false) {
  c.fillStyle=light?'#c1c7b7':'#243b43';c.fillRect(x+5,y+5,w-10,h-10);
  c.fillStyle=light?'#263c40':'#ded4b6';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText(title,x+w/2,y+26,w-20);
  c.font='11px sans-serif';c.fillText('Diagnostic Canvas · états imposés',x+w/2,y+45,w-20);
}
function focus(canvas,rect,s,{targetX,groundY,scale=1.4,visible=targetX,method,time=7,reducedMotion=false,physicalBox=null,bottom=30}) {
  const c=canvas.getContext('2d'),[x,y,w,h]=rect,renderer=new Renderer(canvas);
  renderer.cameraX=targetX-800;renderer.combatReducedMotion=reducedMotion;
  renderer.visible=value=>Array.isArray(visible)?visible.includes(value):Math.abs(value-visible)<.001;
  c.save();c.beginPath();c.rect(x+6,y+56,w-12,h-62);c.clip();
  c.translate(x+w/2,y+h-bottom);c.scale(scale,scale);c.translate(-targetX,-groundY);
  c.beginPath();c.moveTo(targetX-w/(2*scale),groundY);c.lineTo(targetX+w/(2*scale),groundY);c.strokeStyle='#69ada780';c.lineWidth=.7;c.stroke();
  const before=JSON.stringify(s);renderer[method](s,time);assert.equal(JSON.stringify(s),before,`${method}: diagnostic render changed facts`);
  if(physicalBox) {c.strokeStyle='#a2cfca99';c.lineWidth=.8;c.setLineDash([4,4]);c.strokeRect(physicalBox.x-physicalBox.w/2,physicalBox.y-physicalBox.h/2,physicalBox.w,physicalBox.h);}
  c.restore();
}
function initial(missionId,extra={}) {return createGame({missionId,walkerId:'WK01',difficulty:'story',seed:1577,...extra});}
// The same public-control policy as tests/campaign-mission.test.mjs, without
// touching that historical test or attaching metadata to the simulation.
function pilotMI01(s,{stopAt,maxFrames=30000}={}) {
  for(let frame=0;frame<maxFrames&&s.status==='playing';frame++) {
    if(stopAt?.(s))return;
    if(s.decision.active) {commandGame(s,'choice','defy');continue;}
    const p=s.player,a=s.campaign;
    const target=s.enemies.filter(e=>!e.dead&&e.active&&Math.abs(e.x-p.x)<1050).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
    const secure=!a.passageSecured;
    const destination=secure?s.mission.passage.stationX:!s.evidence.collected?s.evidence.x:!s.decision.resolved?s.mission.decisionX:s.extraction.x;
    let move=Math.abs(destination-p.x)>35?Math.sign(destination-p.x):0;
    if(secure&&Math.abs(p.x-s.mission.passage.stationX)<70) {commandGame(s,'interact');move=0;}
    if(target&&Math.abs(target.x-p.x)<680)move=0;
    if(a.filtersDelivered&&!s.evidence.collected&&Math.abs(p.x-s.evidence.x)<190) {if(!s.evidence.scanning)commandGame(s,'interact');move=0;}
    if(s.evidence.collected&&!s.decision.resolved&&Math.abs(p.x-s.mission.decisionX)<280) {commandGame(s,'interact');move=0;}
    if(p.x>s.convoy.x+360&&move>0&&!s.convoy.arrived)move=0;
    const vent=p.heat>75||p.overheated;
    updateGame(s,1/60,{move,brace:!move,vent,fire:Boolean(target)&&!vent,secondary:Boolean(target)&&!vent&&target.hp>160,aimX:target?.x,aimY:target?.y});
  }
}
try {
  clearPaintedVesper();const errors=[];
  await loadPaintedVesper({loadImage:async(url,key)=>{
    try {
      const path=fileURLToPath(url),bytes=readFileSync(path),picture=await loadImage(path),atlas=PAINTED_VESPER_LAYOUT[key],expected=manifest.files.find(f=>f.id===key);
      assert.equal(sha(bytes),expected.sha256,`${key}: selected PNG hash`);
      assert.equal(sha(bytes),prompts.selectedOutputs.find(f=>f.atlas===key).sha256,`${key}: source generation receipt`);
      assert.deepEqual([picture.width,picture.height],atlas.size);
      const canvas=createCanvas(picture.width,picture.height),c=canvas.getContext('2d');c.drawImage(picture,0,0);
      const pixels=c.getImageData(0,0,picture.width,picture.height).data;let clear=0;
      for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)clear++;
      assert.ok(clear>picture.width*picture.height*.4,`${key}: actual RGBA transparency`);
      for(const address of addresses.filter(a=>a.frame.atlas===key)) {
        const f=address.frame,[x,y,w,h]=f.source,[cx,cy,cw,ch]=f.cell;
        assert.ok(x>=cx&&y>=cy&&x+w<=cx+cw&&y+h<=cy+ch,`${key}/${f.frame}: neighbour crop`);
        const solid=countPixels(pixels,picture.width,f.source),inCell=countPixels(pixels,picture.width,f.cell);
        assert.ok(solid>100&&solid===inCell,`${key}/${f.frame}: clipped alpha silhouette`);
        for(const [sourceKey,targetKey]of [['sourceOrigin','origin'],['sourcePivot','pivot']])if(f.anchors[sourceKey]) {
          const p=f.anchors[sourceKey],q=f.anchors[targetKey],[tx,ty,tw,th]=f.target;
          assert.ok(Math.abs(tx+(p[0]-x)*tw/w-q[0])<1e-6&&Math.abs(ty+(p[1]-y)*th/h-q[1])<1e-6,`${key}/${f.frame}: measured pivot`);
        }
        receipt.frames.push({atlas:key,name:f.frame,part:address.part,state:address.state,source:f.source,target:f.target,solidPixels:solid});
      }
      for(const index of atlas.emptyCells)assert.equal(countPixels(pixels,picture.width,atlas.cells[index]),0,`${key}: reserved cell remains empty`);
      receipt.atlases.push({id:key,path:expected.path,size:atlas.size,bytes:bytes.length,sha256:sha(bytes),clearPixels:clear});
      decoded[key]=picture;imageIds.set(picture,key);return picture;
    } catch(error) {errors.push(`${key}: ${error.stack||error}`);throw error;}
  }});
  assert.deepEqual(errors,[]);assert.equal(receipt.frames.length,38);
  assert.ok(Object.values(paintedVesperStatus()).every(v=>v.state==='ready'));
  const loader={loadImage:url=>loadImage(fileURLToPath(url))};
  await Promise.all([loadPaintedWalkers(loader),loadPaintedCombat(loader),loadPaintedTransport(loader)]);
  const panorama=await loadImage(resolve(root,'assets/art/vesper-panorama.png'));
  const oldImage=globalThis.Image,oldWindow=globalThis.window;
  globalThis.Image=class{};globalThis.window={devicePixelRatio:1};
  try {
    const source=createCanvas(1800,1960),sc=source.getContext('2d');sc.fillStyle='#172d34';sc.fillRect(0,0,1800,1960);
    addresses.forEach(({part,state,frame:f},index)=>{
      const x=index%6*300,y=Math.floor(index/6)*280,light=index%2===1;
      sc.fillStyle=light?'#c2c8b8':'#29444b';sc.fillRect(x+5,y+5,290,270);
      const scale=Math.min(260/f.source[2],215/f.source[3]);
      sc.drawImage(decoded[f.atlas],...f.source,x+(300-f.source[2]*scale)/2,y+13+(220-f.source[3]*scale)/2,f.source[2]*scale,f.source[3]*scale);
      sc.fillStyle=light?'#263b3e':'#e0d7bc';sc.font='13px sans-serif';sc.textAlign='center';sc.fillText(part,x+150,y+248,282);sc.font='11px sans-serif';sc.fillText(state,x+150,y+265,282);
    });
    save(source,'vesper-source-cells.png',{type:'38 selected source crops on alternating backgrounds, no gameplay claim'});

    const network=createCanvas(2000,1170),nc=network.getContext('2d');nc.fillStyle='#142b33';nc.fillRect(0,0,2000,1170);
    const states=['active','disabled','damaged','disabled-damaged','destroyed'];
    for(let row=0;row<3;row++)for(let col=0;col<5;col++) {
      const s=initial('MI03'),station=s.network.stations[row],state=states[col],rect=[col*400,row*390,400,390];
      station.hp=state.includes('damaged')?station.maxHp*.5:state==='destroyed'?0:station.maxHp;station.disabled=state.startsWith('disabled')||state==='destroyed';station.destroyed=state==='destroyed';station.secured=col===3;
      panel(nc,rect,`${station.kind} · ${state}`,col%2===1);
      focus(network,rect,s,{targetX:station.x,groundY:terrainAt(station.x,s.planetId),scale:1.35,method:'drawNetworkStations',physicalBox:station});
    }
    save(network,'network-states-diagnostic.png',{type:'Imposed independent station states; cyan bounds mark actual projectile body; terminals remain independent'});

    const controls=createCanvas(1800,1080),cc=controls.getContext('2d');cc.fillStyle='#142b33';cc.fillRect(0,0,1800,1080);
    for(let row=0;row<4;row++)for(let col=0;col<3;col++) {
      const s=initial(row===3?'MI02':'MI04'),rect=[col*600,row*270,600,270];let object,title,method='drawIndustrialStation',scale=1.5,groundY,targetX;
      if(row===0) {object=s.industrial.pump;object.connected=col>0;object.working=col===1;title=`Pompe · ${col?'raccordée':'déconnectée'}`;}
      if(row===1) {object=s.industrial.turbines[0];object.cooled=col===1;title=`Turbine · ${['chaude','refroidie','mouvement réduit'][col]}`;scale=1.2;}
      if(row===2) {object=s.industrial.contact;object.available=col>0;object.contacted=col===2;title=`Radio · ${['indisponible','disponible','échange acquis'][col]}`;scale=1.5;}
      if(row===3) {object=s.train.harpoons[0];object.released=col===2;object.working=col===1;title=`Harpon · ${['retenu','en manœuvre','libéré'][col]}`;method='drawRailHarpoons';groundY=object.y+22;scale=2;}
      targetX=object.x;groundY??=object.y+object.h/2;panel(cc,rect,title,col%2===1);
      focus(controls,rect,s,{targetX,groundY,scale,method,reducedMotion:row===1&&col===2});
    }
    save(controls,'controls-diagnostic.png',{type:'Imposed pump, turbine, radio and harpoon states; rotors and reels drawn by runtime composite functions'});

    const posts=createCanvas(1800,440),pc=posts.getContext('2d');pc.fillStyle='#142b33';pc.fillRect(0,0,1800,440);
    for(let col=0;col<3;col++) {
      const s=initial('MI04'),post=s.industrial.post,rect=[col*600,0,600,440];post.hp=post.maxHp*[1,.5,0][col];post.destroyed=col===2;s.evidence.collected=col===1;
      panel(pc,rect,`Maintenance · ${['intact','endommagé + copie conservée','détruit'][col]}`,col===1);
      focus(posts,rect,s,{targetX:post.x,groundY:post.y+post.h/2,scale:1.8,method:'drawIndustrialStation',physicalBox:post});
    }
    save(posts,'maintenance-states-diagnostic.png',{type:'Imposed maintenance damage/copy states; ruins retain scale and no terminal survives a destroyed source'});

    const ground=createCanvas(1800,990),gc=ground.getContext('2d');gc.fillStyle='#142b33';gc.fillRect(0,0,1800,990);
    for(let row=0;row<3;row++)for(let col=0;col<2;col++) {
      const s=initial('MI01'),rect=[col*900,row*330,900,330],p=s.mission.passage;let targetX=(p.pipeFrom+p.pipeTo)/2,title;
      if(row===0) {s.campaign.pipeIntact=col===0;title=col?'Conduite rompue · interruption conservée':'Conduite intacte · aucun nouveau sol';}
      if(row===1) {s.campaign.passageWorking=col===0;s.campaign.passageProgress=col?.999:.45;s.campaign.passageSecured=col===1;title=col?'Dalles verrouillées':'Déploiement des dalles · 45 %';}
      if(row===2) {s.campaign.filtersDelivered=col===1;targetX=s.mission.deliveryX;title=col?'Poste 42 · 24 caisses livrées':'Poste 42 · livraison encore absente';}
      panel(gc,rect,title,col===1);
      focus(ground,rect,s,{targetX:row===2?targetX-80:targetX,visible:targetX,groundY:terrainAt(targetX,s.planetId),scale:row===2?1.5:3,bottom:row===2?30:100,method:'drawCampaignLandmarks'});
    }
    save(ground,'pipe-and-delivery-diagnostic.png',{type:'Imposed pipe rupture/slab progress/delivery states; no delivery is inferred from a building sprite'});

    function capturePublic(s,file,checkpoint) {
      const before=JSON.stringify(s),canvas=createCanvas(1600,900),renderer=new Renderer(canvas),c=canvas.getContext('2d'),draw=c.drawImage;
      const calls={};c.drawImage=function(...args){const id=imageIds.get(args[0]);if(id)calls[id]=(calls[id]||0)+1;return draw.apply(this,args);};
      renderer.panorama=panorama;renderer.panoramaReady=true;renderer.render(s,{shake:false});
      assert.equal(JSON.stringify(s),before,`${file}: renderer changed the public state`);
      assert.ok(Object.values(calls).reduce((a,b)=>a+b,0)>0,`${file}: no Vesper sprite reached`);
      const stateFile=file.replace('.png','.state.json');writeFileSync(resolve(output,stateFile),JSON.stringify(s,null,2)+'\n');
      save(canvas,file,{type:'Normal Canvas renderer, public-input checkpoint',checkpoint,missionId:s.missionId,walkerId:s.walkerId,
        elapsed:s.elapsed,status:s.status,playerX:s.player.x,cameraX:renderer.cameraX,stateFile,stateSha256:sha(readFileSync(resolve(output,stateFile))),atlasDrawCalls:calls});
    }
    const mi01=initial('MI01');
    for(const [file,checkpoint,stopAt]of [
      ['mi01-winch-working.png','MI01 slab winch working above 45 percent',s=>s.campaign.passageWorking&&s.campaign.passageProgress>.45],
      ['mi01-protected-passage.png','MI01 slabs locked and player at the physical pipe',s=>s.campaign.passageSecured&&s.player.x>1140],
      ['mi01-filters-delivered.png','MI01 all 24 filter crates actually delivered',s=>s.campaign.filtersDelivered],
    ]) {pilotMI01(mi01,{stopAt});assert.ok(stopAt(mi01),`${checkpoint}: public pilot did not reach state`);capturePublic(mi01,file,checkpoint);}
    receipt.publicRuns.push({missionId:'MI01',status:mi01.status,elapsed:mi01.elapsed,filtersDelivered:mi01.campaign.filtersDelivered,pipeIntact:mi01.campaign.pipeIntact,completeMissionClaimed:false});
    const mi02=initial('MI02'),railStop=s=>s.train.harpoons[1].working&&s.train.harpoons[1].progress>.45;
    pilotMI02(mi02,{stopAt:railStop});assert.ok(railStop(mi02));capturePublic(mi02,'mi02-second-harpoon.png','MI02 second harpoon release in progress through public controls');
    receipt.publicRuns.push({missionId:'MI02',status:mi02.status,elapsed:mi02.elapsed,harpoonsReleased:mi02.campaign.harpoonsReleased,completeMissionClaimed:false});
    const mi03=initial('MI03');
    for(const [file,checkpoint,stopAt]of [
      ['mi03-dispensary-inspection.png','MI03 actual dispensary inspection above 45 percent',s=>s.network.stations[1].scanning&&s.network.stations[1].scanProgress>.45],
      ['mi03-housing-verified.png','MI03 residential terminal secured by completed inspection',s=>s.network.stations[2].verified],
    ]) {pilotMI03(mi03,{stopAt});assert.ok(stopAt(mi03),`${checkpoint}: public pilot did not reach state`);capturePublic(mi03,file,checkpoint);}
    receipt.publicRuns.push({missionId:'MI03',status:mi03.status,elapsed:mi03.elapsed,signalsIdentified:mi03.campaign.signalsIdentified,completeMissionClaimed:false});
    const campaignContext={pipeIntact:false,servicesInterrupted:true,railHostagesRescued:3,dispensaryIntact:true,witnessAvailable:true,civilRelaysOnline:2};
    const mi04=initial('MI04',{campaignContext});
    for(const [file,checkpoint,stopAt]of [
      ['mi04-pump-connection.png','MI04 actual coolant pump connection above 45 percent',s=>s.industrial.pump.working&&s.industrial.pump.progress>.45],
      ['mi04-turbine-cooling.png','MI04 first turbine cooling in progress',s=>s.industrial.turbines[0].working&&s.industrial.turbines[0].progress>.45],
      ['mi04-maintenance-copy.png','MI04 actual maintenance log copy acquired',s=>s.evidence.collected],
    ]) {pilotMI04(mi04,{stopAt});assert.ok(stopAt(mi04),`${checkpoint}: public pilot did not reach state`);capturePublic(mi04,file,checkpoint);}
    receipt.publicRuns.push({missionId:'MI04',status:mi04.status,elapsed:mi04.elapsed,campaignContext,coolantRestored:mi04.campaign.coolantRestored,
      turbinesCooled:mi04.campaign.turbinesCooled,logRecovered:mi04.campaign.logRecovered,witnessContacted:mi04.campaign.witnessContacted,completeMissionClaimed:false});
  } finally {globalThis.Image=oldImage;globalThis.window=oldWindow;}
  receipt.completed=true;receipt.counts={atlases:receipt.atlases.length,cells:receipt.frames.length,
    diagnosticViews:receipt.views.filter(v=>v.type!=='Normal Canvas renderer, public-input checkpoint').length,
    publicInputViews:receipt.views.filter(v=>v.type==='Normal Canvas renderer, public-input checkpoint').length,views:receipt.views.length};
  console.log(JSON.stringify({output,completed:true,...receipt.counts}));
} catch(error) {receipt.error=error.stack||String(error);throw error;}
finally {writeFileSync(resolve(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');}
