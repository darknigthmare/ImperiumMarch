import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { AudioEngine,SOUND_CUES,PLANET_SOUNDS,MUSIC_MOTIFS,renderSoundCue,renderAmbience,renderMotif,collectAudioFacts,diffAudioFacts } from '../src/audio.mjs';
import { createGame,commandGame,updateGame } from '../src/simulation.mjs';
import { pilotMI07 } from './helpers/mi07-driver.mjs';
const hash=data=>createHash('sha256').update(Buffer.from(data.buffer)).digest('hex');
function signalStats(samples){let peak=0,energy=0;for(const value of samples){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));energy+=value*value;}return{peak,rms:Math.sqrt(energy/samples.length)};}

test('production audio: every authored cue is deterministic finite PCM with usable headroom',()=>{
  for(const [id,def]of Object.entries(SOUND_CUES)){const a=renderSoundCue(id,{sampleRate:22050}),b=renderSoundCue(id,{sampleRate:22050});assert.equal(hash(a),hash(b),id);assert.equal(a.length,Math.ceil(def.duration*22050));const stats=signalStats(a);assert.ok(stats.peak<.89&&stats.peak>.015,`${id}: peak ${stats.peak}`);assert.ok(stats.rms>.003,`${id} is audible PCM, not an empty placeholder`);assert.equal(a[0],0);assert.equal(a.at(-1),0);assert.ok(def.assets.length&&def.caption.length>10);}
});
test('production audio: eight distinct planet loops join continuously and use no random global state',()=>{
  const fingerprints=new Set();for(const id of Object.keys(PLANET_SOUNDS)){const a=renderAmbience(id,{sampleRate:22050}),b=renderAmbience(id,{sampleRate:22050});assert.equal(hash(a),hash(b));fingerprints.add(hash(a));const stats=signalStats(a);assert.ok(stats.peak<.4&&stats.rms>.008);assert.ok(Math.abs(a[0]-a.at(-1))<.012,`${id}: loop seam`);assert.equal(a.length,12*22050);}assert.equal(fingerprints.size,8);
});
test('production audio: three original motifs retain written timing and an explicit story-safe selection',()=>{
  const fingerprints=new Set();for(const [id,m]of Object.entries(MUSIC_MOTIFS)){const samples=renderMotif(id,{sampleRate:22050});assert.equal(samples.length,Math.ceil(m.beats*60/m.bpm*22050));assert.ok(signalStats(samples).peak<.45);assert.equal(samples.at(-1),0);fingerprints.add(hash(samples));}assert.equal(fingerprints.size,3);const engine=new AudioEngine();engine.setScene({planetId:'PL02',missionId:'MI07',mood:'imperial'});const game=createGame({missionId:'MI07'});game.decision.choice='defy';engine.update(game);assert.equal(engine.scene.mood,'imperial','a local choice cannot select the later rupture motif');
});
test('production audio: exported WAVs match the runtime synthesis at the documented sample rate',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../assets/production/audio/manifest.json',import.meta.url)));assert.equal(manifest.counts.ambiences,8);assert.equal(manifest.counts.motifs,3);assert.equal(manifest.counts.cues,Object.keys(SOUND_CUES).length);
  for(const id of ['radiator-hit','consent-recorded','seizure-warning','person-arrived']){const entry=manifest.files.find(f=>f.id===id),bytes=readFileSync(new URL(`../${entry.file}`,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.readUInt32LE(24),22050);assert.equal(bytes.readUInt16LE(22),1);assert.equal(bytes.readUInt16LE(34),16);const samples=renderSoundCue(id,{sampleRate:22050});assert.equal(bytes.length,44+2*samples.length);for(let i=0;i<samples.length;i++)assert.equal(bytes.readInt16LE(44+i*2),Math.round(samples[i]*32767)||0);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);}
});

class Param {constructor(){this.value=0;this.events=[];}setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t]);}linearRampToValueAtTime(v,t){this.value=v;this.events.push(['linear',v,t]);}setTargetAtTime(v,t,k){this.value=v;this.events.push(['target',v,t,k]);}cancelScheduledValues(t){this.events=this.events.filter(e=>e[2]<t);}}
class Node {constructor(context){this.context=context;this.connected=false;this.gain=new Param();this.onended=null;this.end=Infinity;context.nodes.add(this);}connect(){this.connected=true;return this;}disconnect(){this.connected=false;}start(t=0){this.startAt=t;if(!this.loop)this.end=t+this.buffer.length/this.context.sampleRate;}stop(t=this.context.currentTime){this.end=Math.min(this.end,t);}}
class FakeContext {constructor(){this.sampleRate=8000;this.currentTime=0;this.state='suspended';this.nodes=new Set();this.destination={};this.resumes=0;}
  createGain(){return new Node(this);}createBufferSource(){return new Node(this);}createBuffer(channels,length,sampleRate){const samples=new Float32Array(length);return{length,sampleRate,getChannelData:()=>samples};}
  async resume(){this.resumes++;this.state='running';}async close(){this.state='closed';}advance(time){this.currentTime+=time;for(const node of this.nodes)if(node.onended&&node.end<=this.currentTime){const callback=node.onended;node.onended=null;callback();}}
}
async function withAudio(callback){const previous=globalThis.AudioContext;globalThis.AudioContext=FakeContext;try{await callback();}finally{if(previous===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=previous;}}

test('production audio: pause/mute/scene switches cancel loops and scheduled effects without node leaks',async()=>withAudio(async()=>{
  const engine=new AudioEngine();engine.setScene({planetId:'PL02',missionId:'MI07',mood:'crew'});await engine.unlock();const context=engine.context;assert.equal(engine.loops.size,2);assert.equal(engine.voices.size,2);
  for(let i=0;i<30;i++){engine.event('shot');engine.tone(220,110,.3,.1,'sine',2);engine.setPaused(true);assert.equal(engine.loops.size,0);assert.equal(engine.event('rocket'),false);context.advance(.03);assert.equal(engine.voices.size,0);assert.equal([...context.nodes].filter(n=>n.connected).length,1);engine.setPaused(false);assert.equal(engine.loops.size,2);engine.setVolume(0);context.advance(.03);assert.equal(engine.voices.size,0);engine.setVolume(.55);assert.equal(engine.loops.size,2);}
  engine.setScene({planetId:'PL01',missionId:'MI01',mood:'none'});context.advance(.04);assert.equal(engine.loops.size,1);assert.equal(engine.voices.size,1);await engine.dispose();assert.equal(engine.voices.size,0);assert.equal(engine.buffers.size,0);assert.equal(context.state,'closed');assert.equal([...context.nodes].filter(n=>n.connected).length,0);await engine.unlock();assert.equal(engine.context,null);
}));
test('production audio: rapid combat is capped and active threats displace ordinary sounds',async()=>withAudio(async()=>{
  const engine=new AudioEngine();engine.setScene({planetId:'PL02',mood:'crew'});await engine.unlock();for(let i=0;i<100;i++)engine.event('shot');assert.equal(engine.voices.size,engine.maxVoices);assert.equal(engine.event('seizure-warning'),true);assert.ok([...engine.voices].some(v=>v.priority==='danger'));assert.equal(engine.loops.size,2);engine.context.advance(3);assert.equal(engine.voices.size,2);await engine.dispose();
}));
test('production audio: denial or absence of Web Audio never blocks optional audio calls',async()=>{
  const previous=globalThis.AudioContext;try{delete globalThis.AudioContext;const absent=new AudioEngine();await absent.unlock();assert.equal(absent.event('shot'),false);assert.doesNotThrow(()=>absent.setPaused(true));await absent.dispose();globalThis.AudioContext=class extends FakeContext{async resume(){throw new Error('denied');}};const denied=new AudioEngine();await assert.doesNotReject(()=>denied.unlock());assert.equal(denied.event('shot'),false);await denied.dispose();}finally{if(previous===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=previous;}
});
test('production audio: state observation is pure and does not replay a checkpoint or muted history',async()=>withAudio(async()=>{
  const engine=new AudioEngine(),game=createGame({missionId:'MI07'}),before=JSON.stringify(game);engine.setScene({planetId:'PL02',missionId:'MI07'});await engine.unlock();assert.deepEqual(engine.update(game),[]);assert.equal(JSON.stringify(game),before);updateGame(game,1/60,{brace:true});const changes=engine.update(game);assert.ok(changes.some(c=>c.cue==='hydraulic-brace'));assert.deepEqual(engine.update(game),[]);engine.setVolume(0);updateGame(game,1/60,{brace:false});engine.update(game);updateGame(game,1/60,{brace:true});engine.update(game);engine.setVolume(.55);assert.deepEqual(engine.update(game),[]);const checkpoint=structuredClone(game);engine.setScene({planetId:'PL02',missionId:'MI07'});assert.deepEqual(engine.update(checkpoint),[]);await engine.dispose();
}));
test('production audio: repair interruption and kit expenditure are mutually exclusive transitions',()=>{
  const base={player:{radiator:{health:40,repairKits:2,repairing:false}}},initial=collectAudioFacts(base),working=collectAudioFacts({player:{radiator:{health:40,repairKits:2,repairing:true}}});assert.deepEqual(diffAudioFacts(initial,working).map(x=>x.cue),['repair-start']);assert.deepEqual(diffAudioFacts(working,initial).map(x=>x.cue),['repair-cancel']);const completed=collectAudioFacts({player:{radiator:{health:100,repairKits:1,repairing:false}}});assert.deepEqual(diffAudioFacts(working,completed).map(x=>x.cue),['repair-complete']);
});
test('production audio: real MI07 public traversal separates consent, seizure, handover and individual arrivals',()=>{
  const game=createGame({missionId:'MI07',walkerId:'WK09'}),engine=new AudioEngine(),seen=[];engine.update(game);let atChoice=null;
  pilotMI07(game,{observe:s=>{for(const item of engine.update(s)){seen.push({...item,time:s.elapsed,patients:s.campaign.patientsArrived,staff:s.campaign.staffArrived,vehicle:s.ambulance.vehicle.arrived});}if(s.decision.active&&!atChoice)atChoice={patients:s.campaign.patientsArrived,staff:s.campaign.staffArrived};}});
  assert.equal(game.status,'won');for(const id of ['consent-recorded','inspection-complete','beacon-recovered','seizure-warning','control-arrival','transfer-start'])assert.ok(seen.some(item=>item.cue===id),id);
  const first=id=>seen.find(item=>item.cue===id);assert.ok(first('consent-recorded').time<first('inspection-complete').time);assert.ok(first('control-arrival').time-first('seizure-warning').time>=9.98);assert.equal(first('transfer-start').vehicle,true);assert.equal(first('transfer-start').patients,0);assert.equal(seen.filter(x=>x.cue==='person-arrived').length,6);assert.equal(new Set(seen.filter(x=>x.cue==='person-arrived').map(x=>x.key)).size,6);assert.equal(seen.some(x=>x.cue==='beacon-lost'),false);assert.deepEqual(atChoice,{patients:0,staff:0});
});

test('production audio: rapid scene/mute changes retain a bounded node set during short fades',async()=>withAudio(async()=>{
  const engine=new AudioEngine();await engine.unlock();for(let i=0;i<80;i++){engine.setScene({planetId:i%2?'PL01':'PL02',mood:i%2?'crew':'imperial'});engine.setPaused(true);engine.setPaused(false);engine.setVolume(0);engine.setVolume(.55);assert.ok(engine.voices.size<=engine.maxVoices);}engine.context.advance(.04);assert.equal(engine.voices.size,2);assert.equal(engine.loops.size,2);await engine.dispose();
}));
test('production audio: MI08 observation distinguishes gate opening, boarding, departure and safe arrival',()=>{
  const game=createGame({missionId:'MI08',walkerId:'WK09'}),before=JSON.stringify(game),engine=new AudioEngine();assert.deepEqual(engine.update(game),[]);assert.equal(JSON.stringify(game),before);
  // Unit transition fixtures model the documented facts, without claiming a played MI08 route.
  const next=structuredClone(game),gate=next.departure.locks.find(g=>g.kind==='passage'),boat=next.departure.boats[0],person=next.departure.people.find(p=>p.phase!=='offsite');
  gate.opening=1;gate.working=false;boat.moving=true;person.phase='aboard';let changes=engine.update(next).map(x=>x.cue);assert.ok(changes.includes('gate-open'));assert.ok(changes.includes('boarding-complete'));assert.ok(changes.includes('engine-depart'));assert.equal(changes.includes('person-arrived'),false);assert.equal(changes.includes('boat-departed'),false);
  boat.departed=true;person.departed=true;person.phase='en-route';changes=engine.update(next).map(x=>x.cue);assert.ok(changes.includes('boat-departed'));assert.equal(changes.includes('person-arrived'),false);
  boat.arrived=true;person.safe=true;person.phase='arrived';changes=engine.update(next).map(x=>x.cue);assert.ok(changes.includes('engine-arrive'));assert.ok(changes.includes('person-arrived'));assert.deepEqual(engine.update(next),[]);
  engine.setScene({planetId:'PL02',missionId:'MI08'});assert.deepEqual(engine.update(next),[],'loaded achievements are not performed again');
});
