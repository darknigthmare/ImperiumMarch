/** Decode the original MI11 PNGs and receive their actual Canvas composition.
 * Public-input scene captures and diagnostic state boards remain separate. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_VOICE_LAYOUT } from '../src/painted-voice-layout.mjs';
import { VOICE_ASSET_SPECS } from '../src/voice-assets.mjs';
import { clearPaintedVoice, loadPaintedVoice, paintedVoiceStatus, paintedVoiceFrame, drawPaintedVoiceAsset } from '../src/painted-voice.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedThyr } from '../src/painted-thyr.mjs';
import { createGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI11 } from '../tests/helpers/mi11-driver.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2]?resolve(process.argv[2]):resolve(root,'../outputs/painted-voice-qa');
const require=createRequire(import.meta.url);let api;
try{api=require('@napi-rs/canvas');}catch(cause){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw new Error('PNG reception requires @napi-rs/canvas',{cause});api=require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));}
const {createCanvas,loadImage}=api,sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sources=['src/painted-voice.mjs','src/painted-voice-layout.mjs','src/voice-renderer.mjs','src/voice-simulation.mjs',
  'src/renderer.mjs','src/painted-walkers.mjs','src/painted-thyr.mjs','src/painted-combat.mjs',
  'tests/helpers/mi11-driver.mjs','tools/test-painted-voice.mjs'];
const report={createdUtc:new Date().toISOString(),type:'Original PNG decoding, diagnostic states and MI11 public-input Canvas scenes',
  completed:false,nativeBrowserExecuted:false,humanPlaytestPerformed:false,atlases:[],frames:[],views:[],
  sourceHashes:Object.fromEntries(sources.map(path=>[path,sha(readFileSync(resolve(root,path)))])),
  limitations:['Skia Canvas reception, not a native browser or human playtest.',
    'The state board selects named states explicitly; mission captures use the existing public-input driver.',
    'The root arch is only the existing survey landmark. Real ledge geometry and foot contacts remain simulated.',
    'The three local nesting sites do not establish a new population count.']};
mkdirSync(output,{recursive:true});
function save(canvas,name,details={}){const bytes=canvas.toBuffer('image/png');writeFileSync(resolve(output,name),bytes);report.views.push({file:name,size:[canvas.width,canvas.height],sha256:sha(bytes),...details});}
try{
  clearPaintedVoice();
  await loadPaintedVoice({loadImage:async(url,key)=>{
    const path=fileURLToPath(url),bytes=readFileSync(path),im=await loadImage(path),canvas=createCanvas(im.width,im.height),ctx=canvas.getContext('2d');
    ctx.drawImage(im,0,0);const pixels=ctx.getImageData(0,0,im.width,im.height).data;
    let transparent=0,solid=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]===0)transparent++;if(pixels[i]>=128)solid++;}
    assert.ok(transparent>im.width*im.height*.3&&solid>1000,`${key}: actual transparent cutout`);
    assert.deepEqual([im.width,im.height],PAINTED_VOICE_LAYOUT[key].size);
    for(const name of Object.keys(PAINTED_VOICE_LAYOUT[key].frames)){
      const frame=paintedVoiceFrame(key,name),[x,y,w,h]=frame.source,[cx,cy,cw,ch]=frame.cell;let visible=0,outside=0;
      for(let row=cy;row<cy+ch;row++)for(let col=cx;col<cx+cw;col++)if(pixels[(row*im.width+col)*4+3]>=32){
        if(col>=x&&col<x+w&&row>=y&&row<y+h)visible++;else outside++;
      }
      assert.ok(visible>50,`${key}/${name}: missing silhouette`);assert.equal(outside,0,`${key}/${name}: clipped silhouette`);
      report.frames.push({atlas:key,frame:name,source:frame.source,target:frame.target,usage:frame.usage,visiblePixels:visible});
    }
    report.atlases.push({id:key,path:path.slice(root.length+1),size:[im.width,im.height],sha256:sha(bytes),bytes:bytes.length,transparentPixels:transparent,solidPixels:solid});return im;
  }});
  assert.equal(report.atlases.length,3);assert.equal(report.frames.length,21);
  assert.ok(Object.values(paintedVoiceStatus()).every(value=>value.state==='ready'));
  const board=createCanvas(1720,1150),ctx=board.getContext('2d');ctx.fillStyle='#132c27';ctx.fillRect(0,0,board.width,board.height);
  const parts=['listening-station','translation-record','resonance-emitter','nesting-site','root-passage'];
  for(const [row,part]of parts.entries()){
    const definition=VOICE_ASSET_SPECS[part];
    ctx.fillStyle='#dfd9bd';ctx.font='16px sans-serif';ctx.fillText(part,25,30+row*224);
    for(const [col,state]of definition.states.entries()){
      const x=175+col*335,y=198+row*224,scale=part==='resonance-emitter'?.85:part==='nesting-site'||part==='root-passage'?.98:1.4;
      ctx.fillStyle='#284739';ctx.fillRect(x-147,y+1,294,3);
      assert.equal(drawPaintedVoiceAsset(ctx,{part,state,x,y,scale}),true);
      ctx.fillStyle='#b8c9b7';ctx.font='14px sans-serif';ctx.fillText(state,x-100,y+23);
    }
  }
  save(board,'mi11-site-states.png',{diagnostic:true,description:'All21 named material states on a game-colored background; drawn baseline identifies ground anchors.'});
  const base=createGame({missionId:'MI11',walkerId:'WK09',seed:1566,difficulty:'story'}),scenes=new Map([['arrival',structuredClone(base)]]);
  pilotMI11(base,{choice:'defy',observe:s=>{
    const d=s.voice;
    for(const [name,condition]of[
      ['listening',d.listening.some(point=>point.working&&point.progress>.45)],
      ['nesting-route',d.ridge.surveyed&&s.player.x>s.mission.voice.ridgeStart+160&&s.player.x<s.mission.voice.ridgeEnd],
      ['translation-copying',d.receiver.working&&d.receiver.progress>.45],
      ['source-copying',d.emitter.working&&d.emitter.work==='emitter'&&d.emitter.progress>.45],
      ['restored-emitter',d.emitter.restored],
      ['emitter-clear',d.emitter.restored&&s.player.x>d.emitter.x+400&&s.player.x<d.emitter.x+1000],
    ])if(condition&&!scenes.has(name))scenes.set(name,structuredClone(s));
  }});
  assert.equal(base.status,'won','Existing public MI11 pilot must actually finish');
  assert.equal(scenes.size,7,'All specified states must be reached by public commands');
  const imageLoader=url=>loadImage(fileURLToPath(url));
  await Promise.all([loadPaintedWalkers({loadImage:imageLoader}),loadPaintedCombat({loadImage:imageLoader}),loadPaintedThyr({loadImage:imageLoader})]);
  const oldImage=globalThis.Image,oldWindow=globalThis.window;globalThis.Image=class{};globalThis.window={devicePixelRatio:1};
  try{
    for(const [name,s]of scenes){
      const before=JSON.stringify(s),canvas=createCanvas(1600,900),renderer=new Renderer(canvas);
      renderer.render(s,{reducedMotion:true,shake:false});assert.equal(JSON.stringify(s),before,`${name}: rendering changed simulation`);
      save(canvas,`mi11-${name}.png`,{diagnostic:false,preparation:'Existing public MI11 driver commands only',mission:'MI11',elapsed:s.elapsed,stateSha256:sha(before)});
      writeFileSync(resolve(output,`mi11-${name}.state.json`),before+'\n');
    }
  }finally{globalThis.Image=oldImage;globalThis.window=oldWindow;}
  report.publicInputMission={mission:'MI11',status:base.status,elapsed:base.elapsed,choice:'defy',capturedScenes:scenes.size,
    nestsIntact:base.campaign.nestsIntact,te01Acquired:base.campaign.te01Acquired};
  report.completed=true;report.counts={atlases:report.atlases.length,frames:report.frames.length,views:report.views.length};
  console.log(JSON.stringify({completed:true,...report.counts,mission:report.publicInputMission,output}));
}catch(error){report.error=error.stack||String(error);throw error;}
finally{writeFileSync(resolve(output,'receipt.json'),JSON.stringify(report,null,2)+'\n');}
