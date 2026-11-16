/** Decode immutable PNGs, inspect actual frames and render MI09 public-input states. Not a browser. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PAINTED_ROUTE_LAYOUT} from '../src/painted-route-layout.mjs';
import {PAINTED_ROUTE_PARTS,clearPaintedRoute,loadPaintedRoute,paintedRouteStatus,paintedRouteFrame,drawPaintedRouteAsset} from '../src/painted-route.mjs';
import {loadPaintedThyr} from '../src/painted-thyr.mjs';
import {loadPaintedWalkers} from '../src/painted-walkers.mjs';
import {loadPaintedCombat} from '../src/painted-combat.mjs';
import {createGame,livingRouteSurfaceAt} from '../src/simulation.mjs';
import {Renderer} from '../src/renderer.mjs';
import {drawLivingRouteMap} from '../src/thyr-renderer.mjs';
import {pilotMI09} from '../tests/helpers/mi09-driver.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2]?resolve(process.argv[2]):resolve(root,'../outputs/painted-route-qa');
const require=createRequire(import.meta.url);let api;
try {api=require('@napi-rs/canvas');} catch(cause) {
  if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw new Error('Canvas PNG decoding requires @napi-rs/canvas',{cause});
  api=require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));
}
const {createCanvas,loadImage}=api,sha=b=>createHash('sha256').update(b).digest('hex');
mkdirSync(output,{recursive:true});
const sources=['src/painted-route.mjs','src/painted-route-layout.mjs','src/thyr-renderer.mjs','src/simulation.mjs','tools/index-painted-route.py','tools/test-painted-route.mjs','tests/helpers/mi09-driver.mjs'];
const report={version:'0.15.7',createdUtc:new Date().toISOString(),type:'MI09 original PNG decoding, state diagnostics and public-input Canvas scenes',completed:false,
  nativeBrowserExecuted:false,humanPlaytestPerformed:false,sourceHashes:Object.fromEntries(sources.map(p=>[p,sha(readFileSync(resolve(root,p)))])),
  atlases:[],frames:[],views:[],limitations:['Canvas/Skia reception is not browser interaction or human playtest.','State board inputs are explicitly diagnostic; mission scenes use unchanged public movement/action commands.',
  'The original barrier PNG needs measured unequal row boundaries. No original pixels are changed.','The surveyed map keeps its painted frame, masks decorative town groups inside the screen with the concealed map texture, and draws only the two simulated homes.','The isolated truck wheel remains a reference, since all truck bodies contain both wheels. The ruined terminal is also a reference: MI09 job terminals have no simulated health.','No contacts, beings, jobs, evidence or saved state fields are added.']};
const save=(canvas,name,detail={})=>{const bytes=canvas.toBuffer('image/png');writeFileSync(resolve(output,name),bytes);report.views.push({file:name,size:[canvas.width,canvas.height],sha256:sha(bytes),...detail});};
try {
  const manifest=JSON.parse(readFileSync(resolve(root,'assets/painted/route/manifest.json')));
  clearPaintedRoute();
  await loadPaintedRoute({loadImage:async(url,key)=>{
    const path=fileURLToPath(url),bytes=readFileSync(path),im=await loadImage(path),atlas=PAINTED_ROUTE_LAYOUT[key];
    assert.equal(sha(bytes),manifest.files.find(f=>f.id===key).sha256);
    const cnv=createCanvas(im.width,im.height),ctx=cnv.getContext('2d');ctx.drawImage(im,0,0);
    const pixels=ctx.getImageData(0,0,im.width,im.height).data;let transparent=0,opaque=0;
    for(let i=3;i<pixels.length;i+=4){if(!pixels[i])transparent++;if(pixels[i]>230)opaque++;}
    assert.ok(transparent/(im.width*im.height)>.4&&opaque>1000,`${key}: transparent cutouts`);
    const occupancy=([x,y,w,h])=>{let n=0;for(let v=y;v<y+h;v++)for(let u=x;u<x+w;u++)if(pixels[(v*im.width+u)*4+3]>12)n++;return n;};
    for(const name of Object.keys(atlas.frames)) {
      const frame=paintedRouteFrame(key,name);assert.ok(frame);
      const [x,y,w,h]=frame.source,[cx,cy,cw,ch]=frame.cell;
      assert.ok(x>=cx&&y>=cy&&x+w<=cx+cw&&y+h<=cy+ch,`${key}/${name}: source stays in own measured cell`);
      const inside=occupancy(frame.source),all=occupancy(frame.cell);
      assert.ok(inside>20&&all-inside<Math.max(50,all*.005),`${key}/${name}: full isolated sprite retained`);
      report.frames.push({atlas:key,name,source:frame.source,target:frame.target,usage:frame.usage,occupiedPixels:inside});
    }
    report.atlases.push({id:key,sha256:sha(bytes),bytes:bytes.length,dimensions:[im.width,im.height],transparentFraction:transparent/(im.width*im.height)});
    return im;
  }});
  assert.ok(Object.values(paintedRouteStatus()).every(v=>v.state==='ready'));assert.equal(report.frames.length,20);
  assert.equal(report.frames.filter(f=>f.usage==='runtime').length,18);

  const s=createGame({missionId:'MI09',walkerId:'WK09',difficulty:'story',seed:157});
  assert.equal(s.livingRoute.homes.length,2);
  const cases=Object.entries(PAINTED_ROUTE_PARTS).flatMap(([part,spec])=>spec.states.map(state=>({part,state})));
  const board=createCanvas(1920,Math.ceil(cases.length/4)*340),c=board.getContext('2d');
  c.fillStyle='#1a302b';c.fillRect(0,0,board.width,board.height);
  for(const [i,entry] of cases.entries()) {
    const x=i%4*480,y=Math.floor(i/4)*340;
    c.fillStyle=i%2?'#243e32':'#1d352f';c.fillRect(x+2,y+2,476,336);
    c.fillStyle='#e5d9af';c.font='20px sans-serif';c.textAlign='center';c.fillText(entry.part,x+240,y+29);c.font='17px sans-serif';c.fillText(entry.state,x+240,y+54);
    c.beginPath();c.moveTo(x+35,y+305);c.lineTo(x+445,y+305);c.strokeStyle='#6c8267';c.lineWidth=1;c.stroke();
    const options={...entry,x:x+240,y:y+305,scale:entry.part==='migration-barrier'?1:1.65,progress:.45};
    assert.equal(entry.part==='route-map'
      ?drawLivingRouteMap(c,{...options,inspected:entry.state==='surveyed',homes:s.livingRoute.homes})
      :drawPaintedRouteAsset(c,options),true);
  }
  save(board,'route-state-board.png',{diagnostic:true,states:cases.length,scope:'Explicit states and nominal sizes, not gameplay screenshots.'});

  const hinge=createCanvas(1920,400),h=hinge.getContext('2d');h.fillStyle='#23372e';h.fillRect(0,0,1920,400);
  for(const [i,opening] of [0,.2,.45,.7,1].entries()) {
    const x=190+i*380,y=365;drawPaintedRouteAsset(h,{part:'migration-barrier',state:'working',x,y,scale:1,progress:opening});
    h.fillStyle='#e3d6b5';h.font='21px sans-serif';h.textAlign='center';h.fillText(`Ouverture ${Math.round(opening*100)} %`,x,38);
    h.beginPath();h.arc(x-76,y-77,4,0,Math.PI*2);h.strokeStyle='#ffcf73';h.lineWidth=2;h.stroke();
  }
  save(hinge,'route-barrier-hinge.png',{diagnostic:true,scope:'Five real opening fractions, same authored hinge [-76,-77].'});

  const scenes=new Map([['arrival',structuredClone(s)]]);
  let publicTicks=0;
  pilotMI09(s,{choice:'defy',observe:state=>{
    publicTicks++;const d=state.livingRoute;
    for(const [name,condition]of[
      ['contact-working',d.contact.working&&d.contact.progress>.5],
      ['map-surveyed',d.maps.inspected&&state.decision.resolved&&d.barrier.opening===0],
      ['barrier-working',d.barrier.working&&d.barrier.progress>.45],
      ['truck-moving',d.logistics.moving&&Math.abs(state.player.x-d.logistics.x)<500],
      ['report-sent',d.report.transmitted],
    ])if(condition&&!scenes.has(name))scenes.set(name,structuredClone(state));
  }});
  assert.equal(s.status,'won');assert.ok(scenes.has('truck-moving')&&scenes.has('map-surveyed'));
  // MI09 commits opening only when the job finishes. Work progress never invents an earlier opening.
  report.publicRun={ticks:publicTicks,status:s.status,scenes:[...scenes.keys()],elapsed:s.elapsed,reportTransmitted:s.livingRoute.report.transmitted,
    arrived:s.livingRoute.migrators.filter(a=>a.phase==='arrived').length,logisticsArrived:s.livingRoute.logistics.arrived};
  const oldImage=globalThis.Image,oldWindow=globalThis.window;
  globalThis.Image=class {};globalThis.window={devicePixelRatio:1};
  try {
    const loader=url=>loadImage(fileURLToPath(url));
    await Promise.all([loadPaintedThyr({loadImage:loader}),loadPaintedWalkers({loadImage:loader}),loadPaintedCombat({loadImage:loader})]);
    const panorama=await loadImage(resolve(root,'assets/art/vesper-panorama.png'));
    for(const [name,state]of scenes) {
      const canvas=createCanvas(1600,900),renderer=new Renderer(canvas);renderer.panorama=panorama;renderer.panoramaReady=true;
      const before=JSON.stringify(state),surfaces=state.player.feet.map(f=>livingRouteSurfaceAt(state,f.x));
      renderer.render(state,{reducedMotion:false,shake:false});assert.equal(JSON.stringify(state),before);
      assert.deepEqual(state.player.feet.map(f=>livingRouteSurfaceAt(state,f.x)),surfaces);
      save(canvas,`mi09-${name}.png`,{publicInputs:true,missionId:'MI09',walkerId:'WK09',elapsed:state.elapsed,playerX:state.player.x,stateSha256:sha(before)});
      writeFileSync(resolve(output,`mi09-${name}.state.json`),JSON.stringify(state,null,2)+'\n');
    }
  } finally {globalThis.Image=oldImage;globalThis.window=oldWindow;}
  report.completed=true;
  report.counts={atlases:report.atlases.length,cells:report.frames.length,runtimeCells:report.frames.filter(f=>f.usage==='runtime').length,
    referenceCells:report.frames.filter(f=>f.usage==='reference').length,views:report.views.length,publicScenes:scenes.size};
} catch(error) { report.error=error.stack;throw error; }
finally {writeFileSync(resolve(output,'receipt.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({completed:report.completed,counts:report.counts,output,publicRun:report.publicRun},null,2));
