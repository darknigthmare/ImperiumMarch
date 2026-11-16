import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PAINTED_VOICE_LAYOUT } from '../src/painted-voice-layout.mjs';
import { clearPaintedVoice, setPaintedVoiceImages, setPaintedVoiceImage, loadPaintedVoice,
  paintedVoiceStatus, paintedVoiceFrame, paintedVoiceSiteFrame, drawPaintedVoiceAsset } from '../src/painted-voice.mjs';
import { drawVoiceSite } from '../src/voice-renderer.mjs';
import { createGame, voiceSurfaceAt } from '../src/simulation.mjs';

const images = () => Object.fromEntries(Object.entries(PAINTED_VOICE_LAYOUT).map(([key,value]) => [key,{width:value.size[0],height:value.size[1],key}]));
function context() {
  const calls=[], labels=[], translations=[], scales=[];
  const ctx=new Proxy({globalAlpha:1, drawImage(...args){calls.push(args);}, fillText(...args){labels.push(args[0]);}, translate(...args){translations.push(args);},
    scale(...args){scales.push(args);},createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};}},
    {get(target,key){return key in target ? target[key] : () => {};},set(target,key,value){target[key]=value;return true;}});
  return {ctx,calls,labels,translations,scales};
}

test('MI11 manifests preserve the exact original PNG bytes and all 21 cell bounds', () => {
  const manifest=JSON.parse(readFileSync(new URL('../assets/painted/voice/manifest.json',import.meta.url)));
  assert.equal(manifest.atlasCount,3); assert.equal(manifest.cellCount,21); assert.equal(manifest.referenceCellCount,0);
  for(const file of manifest.files){
    const bytes=readFileSync(new URL(`../${file.path}`,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    for(const [name,item] of Object.entries(PAINTED_VOICE_LAYOUT[file.id].frames)){
      const [cx,cy,cw,ch]=item.cell,[x,y,w,h]=item.source;
      assert.ok(x>=cx&&y>=cy&&x+w<=cx+cw&&y+h<=cy+ch);
      const frame=paintedVoiceFrame(file.id,name);frame.source[0]=-1;frame.anchors.ground[0]=5;
      assert.equal(paintedVoiceFrame(file.id,name).source[0],x);
      assert.deepEqual(paintedVoiceFrame(file.id,name).anchors.ground,[0,0]);
    }
  }
  assert.equal(paintedVoiceFrame('emitter','unused'),null);
});

test('MI11 failed and stale image loads preserve the vector path', async () => {
  clearPaintedVoice();const {ctx,calls}=context(),s=createGame({missionId:'MI11',seed:1561});
  assert.equal(drawPaintedVoiceAsset(ctx,{part:'listening-station',state:'idle'}),false);
  const failed=await loadPaintedVoice({loadImage:async()=>{throw Error('decode unavailable');}});
  assert.ok(Object.values(failed).every(value=>value.state==='failed'));
  drawVoiceSite({ctx,visible:()=>true,cameraX:0},s,0);assert.equal(calls.length,0);
  clearPaintedVoice();const release=[];
  const pending=loadPaintedVoice({loadImage:(_,key)=>new Promise(done=>release.push(()=>done(images()[key])))});
  clearPaintedVoice();release.forEach(done=>done());await pending;
  assert.ok(Object.values(paintedVoiceStatus()).every(value=>value.state==='idle'));
  assert.throws(()=>setPaintedVoiceImage('emitter',{width:1,height:1}),/dimensions/);
  assert.throws(()=>setPaintedVoiceImage('other',{width:1,height:1}),/Unknown/);
});

test('MI11 ground anchors and full-size intact emitter remain unchanged when seized', () => {
  clearPaintedVoice();setPaintedVoiceImages(images());const {ctx,translations,scales}=context();
  const intact=paintedVoiceSiteFrame('resonance-emitter','transmitting');
  const seized=paintedVoiceSiteFrame('resonance-emitter','seized');
  assert.ok(seized.target[3]<intact.target[3]*.3,'Removed resonator must not stretch its base');
  assert.ok(Math.abs(seized.target[2]-intact.target[2])<12,'Footprint remains the same physical size');
  for(const state of ['transmitting','working','seized','preserved','destroyed']){
    assert.equal(drawPaintedVoiceAsset(ctx,{part:'resonance-emitter',state,x:925,y:720,width:150,height:171}),true);
    assert.deepEqual(translations.at(-1),[925,720]);
  }
  assert.equal(drawPaintedVoiceAsset(ctx,{part:'resonance-emitter',state:'invented'}),false);
  assert.equal(drawPaintedVoiceAsset(ctx,{part:'leth-interpreter',state:'waiting'}),false,'Existing Leth renderer keeps ownership');
  for(const facing of [-1,1]){
    assert.equal(drawPaintedVoiceAsset(ctx,{part:'resonance-emitter',state:'transmitting',facing}),true);
    assert.deepEqual(scales.at(-1),[facing,1],'Painted orientation follows the vector renderer convention');
  }
});

test('MI11 painted site draw does not create terrain, work, bodies or evidence', () => {
  clearPaintedVoice();setPaintedVoiceImages(images());const {ctx,calls}=context();
  const s=createGame({missionId:'MI11',seed:1562});
  const ground=[1940,2050,2350,2700].map(x=>voiceSurfaceAt(s,x));
  const before=JSON.stringify(s);drawVoiceSite({ctx,visible:()=>true,cameraX:0},s,0);
  assert.equal(JSON.stringify(s),before);assert.deepEqual([1940,2050,2350,2700].map(x=>voiceSurfaceAt(s,x)),ground);
  assert.equal(calls.filter(call=>call[0].key==='instruments').length,4);
  assert.equal(calls.filter(call=>call[0].key==='emitter').length,1);
  assert.equal(calls.filter(call=>call[0].key==='terrain-sites').length,4);
});

test('MI11 destroyed originals keep acquired copies while selecting lost material', () => {
  clearPaintedVoice();setPaintedVoiceImages(images());const {ctx,calls,labels}=context();
  const s=createGame({missionId:'MI11',seed:1563});
  // Explicit rendering fixture, not a claimed mission playthrough.
  s.voice.receiver.translationCopied=true;s.voice.receiver.destroyed=true;s.voice.receiver.hp=0;
  s.voice.emitter.warningCopied=true;s.voice.emitter.destroyed=true;s.voice.emitter.hp=0;
  s.voice.listening[0].detected=true;s.voice.listening[0].sampled=true;s.voice.listening[0].destroyed=true;
  const before=JSON.stringify(s);drawVoiceSite({ctx,visible:()=>true,cameraX:0},s,0);
  assert.equal(JSON.stringify(s),before);assert.ok(labels.includes('COPIE CONSERVÉE À BORD'));
  for(const [atlas,frame] of [['instruments','record-lost'],['instruments','listen-lost'],['emitter','destroyed']]){
    const source=paintedVoiceFrame(atlas,frame).source;
    assert.ok(calls.some(call=>call[0].key===atlas&&source.every((value,i)=>value===call[i+1])));
  }
});

test('MI11 all five site families keep distinct supported operation states', () => {
  clearPaintedVoice();setPaintedVoiceImages(images());const {ctx,calls}=context();
  const states={
    'listening-station':['idle','listening','recorded','lost'],
    'translation-record':['untranslated','copying','copied','lost'],
    'resonance-emitter':['transmitting','working','seized','preserved','destroyed'],
    'nesting-site':['intact','disturbed','damaged','lost'],
    'root-passage':['unknown','surveyed','damaged','destroyed'],
  };
  for(const [part,values]of Object.entries(states))for(const state of values)assert.equal(drawPaintedVoiceAsset(ctx,{part,state}),true);
  assert.equal(calls.length,21);
  assert.equal(new Set(calls.map(call=>[call[0].key,...call.slice(1,5)].join('/'))).size,21);
});
