/** Actual PNG decoding and MI12 Canvas reception. Not a browser playthrough. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_RELAY_LAYOUT } from '../src/painted-relay-layout.mjs';
import { loadPaintedRelay, clearPaintedRelay, paintedRelayStatus, paintedRelayFrame, drawPaintedPraetor,
  drawPaintedRelaySiteAsset, praetorPresentationWeapon } from '../src/painted-relay.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedThyr } from '../src/painted-thyr.mjs';
import { drawRelayActor } from '../src/relay-renderer.mjs';
import { createGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI12 } from '../tests/helpers/mi12-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-relay-qa');
const require=createRequire(import.meta.url); let api;
try { api=require('@napi-rs/canvas'); }
catch(cause) { if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw new Error('PNG reception requires @napi-rs/canvas',{cause}); api=require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas')); }
const {createCanvas,loadImage}=api, sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sources=['src/painted-relay.mjs','src/painted-relay-layout.mjs','src/relay-renderer.mjs','src/relay-simulation.mjs',
  'src/renderer.mjs','src/painted-walkers.mjs','src/painted-thyr.mjs','src/painted-combat.mjs',
  'tests/helpers/mi12-driver.mjs','tools/test-painted-relay.mjs'];
const report={createdUtc:new Date().toISOString(),type:'Original PNG decoding, diagnostic assembly and MI12 public-input Canvas scenes',
  completed:false,nativeBrowserExecuted:false,humanPlaytestPerformed:false,atlases:[],frames:[],views:[],
  sourceHashes:Object.fromEntries(sources.map(p=>[p,sha(readFileSync(resolve(root,p)))])),
  limitations:['This reception uses Skia Canvas, not browser UI or a human playtest.',
    'Diagnostic panels explicitly set damage/phase/facing on copies; mission scene states are separately reached by public inputs.',
    'The damaged isolated cannon and spare cassette are references; no new component health, persons or final animation cycles are added.']};
mkdirSync(output,{recursive:true});
const save=(canvas,name,details={})=>{const bytes=canvas.toBuffer('image/png');writeFileSync(resolve(output,name),bytes);report.views.push({file:name,size:[canvas.width,canvas.height],sha256:sha(bytes),...details});};
try {
  clearPaintedRelay();
  await loadPaintedRelay({loadImage:async(url,key)=>{
    const path=fileURLToPath(url),bytes=readFileSync(path),im=await loadImage(path),canvas=createCanvas(im.width,im.height),ctx=canvas.getContext('2d');
    ctx.drawImage(im,0,0);const pixels=ctx.getImageData(0,0,im.width,im.height).data;
    let transparent=0,solid=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]===0)transparent++;if(pixels[i]>128)solid++;}
    assert.ok(transparent>im.width*im.height*.3 && solid>1000,`${key}: real cutout alpha`);
    assert.deepEqual([im.width,im.height],PAINTED_RELAY_LAYOUT[key].size);
    for(const [name,value] of Object.entries(PAINTED_RELAY_LAYOUT[key].frames)){
      const frame=paintedRelayFrame(key,name);assert.ok(frame);const [x,y,w,h]=frame.source;let visible=0;
      for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)if(pixels[(row*im.width+col)*4+3]>128)visible++;
      assert.ok(visible>30,`${key}/${name}: empty crop`);
      const [cx,cy,cw,ch]=frame.cell;let outside=0;
      for(let row=cy;row<cy+ch;row++)for(let col=cx;col<cx+cw;col++)if((col<x||col>=x+w||row<y||row>=y+h)&&pixels[(row*im.width+col)*4+3]>128)outside++;
      assert.equal(outside,0,`${key}/${name}: silhouette outside crop`);
      report.frames.push({atlas:key,frame:name,source:frame.source,target:frame.target,usage:value.usage,visiblePixels:visible});
    }
    report.atlases.push({id:key,path:path.slice(root.length+1),size:[im.width,im.height],sha256:sha(bytes),bytes:bytes.length,transparentPixels:transparent,solidPixels:solid});return im;
  }});
  assert.equal(report.atlases.length,3); assert.ok(Object.values(paintedRelayStatus()).every(x=>x.state==='ready'));

  const board=createCanvas(1600,1050),ctx=board.getContext('2d'),base=createGame({missionId:'MI12',seed:1555,difficulty:'story'});
  const configs=[
    {name:'Garde / gauche',facing:-1}, {name:'Verrouillage / droite',facing:1,phase:'attack'},
    {name:'Capteur détruit',facing:-1,sensorLost:true}, {name:'Verrou rompu',facing:1,lockLost:true},
    {name:'Coque neutralisée',facing:-1,destroyed:true}, {name:'Repli vectoriel',facing:1,vector:true},
  ];
  for(let i=0;i<configs.length;i++){
    const config=configs[i],col=i%3,row=Math.floor(i/3),x=col*533,y=row*525;
    ctx.fillStyle=i%2?'#d4d2c3':'#273a3d';ctx.fillRect(x,y,533,525);
    ctx.fillStyle=i%2?'#25383b':'#e0ddc6';ctx.font='bold 21px sans-serif';ctx.fillText(config.name,x+20,y+35);
    ctx.font='14px sans-serif';ctx.fillText('Assemblage diagnostique · échelle × 1,6',x+20,y+60);
    const s=structuredClone(base),p=s.relay.praetor; p.x=0;p.y=-78;p.facing=config.facing;p.phase=config.phase||'guard';p.destroyed=!!config.destroyed;
    p.feet.forEach((f,j)=>{f.x=[-64,-34,34,64][j];f.y=0;});p.sensor.x=p.facing*13;p.sensor.y=-145;p.sensor.destroyed=!!config.sensorLost;
    p.hydraulicLock.x=p.facing*106;p.hydraulicLock.y=-27;p.hydraulicLock.destroyed=!!config.lockLost;s.relay.alert.ready=true;
    const before=JSON.stringify(s);
    ctx.save();ctx.translate(x+266,y+395);ctx.scale(1.6,1.6);
    ctx.strokeStyle='#7e9685';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-155,0);ctx.lineTo(155,0);ctx.stroke();
    if(config.vector){clearPaintedRelay();drawRelayActor({ctx,visible:()=>true},s);await loadPaintedRelay({loadImage:url=>loadImage(fileURLToPath(url))});}
    else assert.equal(drawPaintedPraetor(ctx,p),true);
    const pose=praetorPresentationWeapon(p);ctx.strokeStyle='#e4a16e';ctx.beginPath();ctx.arc(...pose.muzzle,4,0,Math.PI*2);ctx.stroke();
    for(const f of p.feet){ctx.fillStyle='#88d7ce';ctx.beginPath();ctx.arc(f.x,f.y,2.5,0,Math.PI*2);ctx.fill();}
    ctx.restore();assert.equal(JSON.stringify(s),before,'Assembly cannot mutate simulation');
  }
  save(board,'praetor-assembly.png',{diagnostic:true,panels:configs.map(x=>x.name),markers:'Cyan: genuine contact coordinates. Amber circle: projectile origin.'});

  const site=createCanvas(1700,1020),sc=site.getContext('2d');sc.fillStyle='#263b3f';sc.fillRect(0,0,1700,1020);
  sc.fillStyle='#e3ddc0';sc.font='bold 25px sans-serif';sc.fillText('MI12 / RELAIS ET TERMINAUX — ÉTATS DU RENDU',30,40);
  const states=['live','reviewed','purging','isolated','erased','destroyed'];
  for(let i=0;i<states.length;i++){
    const x=140+i*280;sc.fillStyle='#e0d7b9';sc.font='17px sans-serif';sc.fillText(states[i],x-55,82);
    assert.equal(drawPaintedRelaySiteAsset(sc,{part:'relay-mast',state:states[i],x,y:470,scale:2}),true);
  }
  const consoles=[['copy-console','idle'],['copy-console','copying'],['copy-console','copied'],['copy-console','expired'],['command-post','idle'],['command-post','working'],['command-post','transmitted']];
  consoles.forEach(([part,state],i)=>{const x=120+i*240;sc.fillStyle='#e0d7b9';sc.font='15px sans-serif';sc.fillText(`${part==='copy-console'?'COPIE':'POSTE'} / ${state}`,x-90,600);assert.equal(drawPaintedRelaySiteAsset(sc,{part,state,x,y:955,scale:2}),true);});
  save(site,'relay-site-states.png',{diagnostic:true,states:13});

  const scenes=new Map([['arrival-before-alert',structuredClone(base)]]);
  pilotMI12(base,{choice:'defy',observe:s=>{
    const d=s.relay,p=d.praetor;
    for(const [name,condition]of[
      ['praetor-arrived',d.alert.ready], ['praetor-locking',d.alert.ready&&p.phase==='attack'&&p.telegraph>.3],
      ['console-copying',d.copy.working&&d.copy.progress>.4], ['components-disabled',p.sensor.destroyed&&p.hydraulicLock.destroyed&&!p.destroyed],
      ['praetor-neutralized',p.destroyed], ['relays-resolved',s.campaign.operationsResolved],
    ])if(condition&&!scenes.has(name))scenes.set(name,structuredClone(s));
  }});
  assert.equal(base.status,'won','Public MI12 pilot must complete before claiming mission reception');
  assert.ok(scenes.has('console-copying')&&scenes.has('praetor-arrived')&&scenes.has('components-disabled'));
  const imageLoader=url=>loadImage(fileURLToPath(url));
  await Promise.all([loadPaintedWalkers({loadImage:imageLoader}),loadPaintedCombat({loadImage:imageLoader}),loadPaintedThyr({loadImage:imageLoader})]);
  const oldImage=globalThis.Image,oldWindow=globalThis.window;globalThis.Image=class{};globalThis.window={devicePixelRatio:1};
  try {
    for(const [name,s]of scenes){
      const before=JSON.stringify(s),canvas=createCanvas(1600,900),renderer=new Renderer(canvas);renderer.render(s,{reducedMotion:true,shake:false});
      assert.equal(JSON.stringify(s),before,`${name}: renderer changed mission state`);
      save(canvas,`mi12-${name}.png`,{diagnostic:false,preparation:'Existing public MI12 pilot commands only',mission:'MI12',elapsed:s.elapsed,stateSha256:sha(before),alertReady:s.relay.alert.ready});
      writeFileSync(resolve(output,`mi12-${name}.state.json`),before+'\n');
    }
  }finally{globalThis.Image=oldImage;globalThis.window=oldWindow;}
  report.publicInputMission={mission:'MI12',status:base.status,elapsed:base.elapsed,capturedScenes:scenes.size,choice:'defy'};
  report.completed=true;report.counts={atlases:report.atlases.length,frames:report.frames.length,views:report.views.length};
  console.log(JSON.stringify({completed:true,...report.counts,mission:report.publicInputMission,output}));
}catch(error){report.error=error.stack||String(error);throw error;}
finally{writeFileSync(resolve(output,'receipt.json'),JSON.stringify(report,null,2)+'\n');}
