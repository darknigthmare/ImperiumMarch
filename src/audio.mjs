/** Original deterministic procedural score and sound library. No samples, voices or remote requests.
 * Offline WAV exports and Web Audio use these same synthesis functions. Audio never writes to game state. */
const AUDIO_TAU = Math.PI * 2;
const audioClamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toneLayer = (frequency, end, duration, level = .3, at = 0, wave = 'sine') => ({ kind: 'tone', frequency, end, duration, level, at, wave });
const noiseLayer = (duration, level = .3, cutoff = 1000, at = 0) => ({ kind: 'noise', duration, level, cutoff, at });
const cue = (caption, assets, layers, priority = 'effect') => ({ caption, assets, layers, priority, duration: Math.max(...layers.map(l => l.at + l.duration)) + .025 });

export const SOUND_CUES = {
  shot: cue('Départ du canon, culasse et recul', ['AS25'], [toneLayer(128,37,.16,.48,0,'triangle'),noiseLayer(.08,.46,3600),toneLayer(710,270,.035,.12)]),
  rocket: cue('Mise à feu de la roquette', ['AS25'], [noiseLayer(.65,.52,1700),toneLayer(95,24,.55,.42)]),
  step: cue('Appui lourd sur sol minéral', ['AS25'], [toneLayer(64,23,.36,.54),noiseLayer(.23,.31,650),toneLayer(182,81,.11,.14,.04,'triangle')]),
  'step-wet': cue('Appui sur quai mouillé, eau déplacée', ['AS25','AS47'], [toneLayer(57,22,.34,.48),noiseLayer(.37,.25,2100,.02),toneLayer(210,70,.08,.1,.06)]),
  'step-fibre': cue('Appui sur sol fibreux', ['AS25','AS26'], [toneLayer(61,26,.29,.43),noiseLayer(.22,.22,1200),noiseLayer(.06,.13,4200,.04)]),
  hit: cue('Impact sur blindage', ['AS25'], [noiseLayer(.13,.3,4300),toneLayer(340,92,.18,.23,0,'triangle'),toneLayer(1250,570,.06,.09)]),
  explosion: cue('Détonation et débris', ['AS25'], [noiseLayer(.8,.58,1100),toneLayer(88,20,.76,.46),noiseLayer(.22,.17,3800,.13)]),
  reload: cue('Verrou, transfert puis fermeture du magasin', ['AS25'], [noiseLayer(.055,.24,3100),toneLayer(280,110,.1,.19,.06,'triangle'),noiseLayer(.09,.3,1900,.3)]),
  objective: cue('Objectif local confirmé', ['AS25'], [toneLayer(510,510,.12,.13),toneLayer(765,765,.16,.1,.12)]),
  decision: cue('Dossier disponible', ['AS25'], [toneLayer(340,340,.18,.12),toneLayer(510,510,.23,.11,.15)]),
  radio: cue('Ouverture du canal radio, sans voix', ['AS34'], [noiseLayer(.045,.075,2200),toneLayer(760,760,.065,.065,.025),noiseLayer(.04,.04,3800,.1)]),
  overheat: cue('Alarme thermique', ['AS25','AS42'], [toneLayer(330,245,.32,.22,0,'triangle'),toneLayer(330,245,.32,.2,.4,'triangle'),noiseLayer(.85,.1,3100)], 'danger'),
  victory: cue('Fin de sortie, résolution retenue', ['AS27'], [toneLayer(220,220,1.2,.13),toneLayer(275,275,1.05,.09,.16),toneLayer(330,330,.9,.08,.32)]),
  defeat: cue('Arrêt du marcheur', ['AS25'], [toneLayer(155,42,1.5,.21,0,'triangle'),noiseLayer(.6,.11,600,.15)], 'danger'),
  'hydraulic-brace': cue('Verrouillage des appuis', ['AS25'], [noiseLayer(.38,.13,1400),toneLayer(180,78,.19,.2,.26,'triangle'),noiseLayer(.055,.22,2100,.43)]),
  'radiator-hit': cue('Impact local sur les ailettes', ['AS36','AS41','AS42'], [toneLayer(1430,740,.22,.18,0,'metal'),noiseLayer(.25,.25,4100),toneLayer(430,190,.15,.13)], 'danger'),
  'repair-start': cue('Ouverture de la maintenance', ['AS41','AS42'], [noiseLayer(.12,.16,2100),toneLayer(300,330,.3,.1,.12,'triangle')]),
  'repair-cancel': cue('Outil retiré, réparation interrompue', ['AS41','AS42'], [noiseLayer(.14,.15,2700),toneLayer(390,160,.25,.12,.06)]),
  'repair-complete': cue('Circuit réparé, kit consommé', ['AS41','AS42'], [noiseLayer(.07,.16,1400),toneLayer(440,440,.18,.11,.08),toneLayer(660,660,.3,.1,.24)]),
  'civil-signal': cue('Émission civile identifiée', ['AS34'], [toneLayer(415,415,.19,.11),toneLayer(622.5,622.5,.23,.1,.24),noiseLayer(.06,.035,1900,.48)]),
  'military-signal': cue('Émission militaire identifiée', ['AS34'], [toneLayer(260,260,.09,.12,0,'triangle'),toneLayer(260,260,.09,.12,.15,'triangle'),toneLayer(390,390,.2,.11,.3)]),
  'inspection-complete': cue('Inspection effectivement achevée', ['AS34','AS62'], [noiseLayer(.055,.08,2200),toneLayer(580,580,.12,.1,.08),toneLayer(725,725,.22,.09,.23)]),
  'relay-secured': cue('Conduit sécurisé', ['AS34'], [noiseLayer(.2,.11,850),toneLayer(110,82,.3,.16),toneLayer(550,550,.16,.08,.3)]),
  'control-arrival': cue('Drone de contrôle effectivement présent', ['AS34'], [toneLayer(210,210,.15,.17,0,'triangle'),toneLayer(315,315,.15,.17,.2,'triangle'),toneLayer(210,210,.22,.17,.4,'triangle')], 'danger'),
  'pump-start': cue('Pompe raccordée, circuit en charge', ['AS42','AS54'], [toneLayer(42,110,1.15,.2,0,'triangle'),noiseLayer(.8,.12,730,.2)]),
  'turbine-cooled': cue('Turbine stabilisée', ['AS42'], [noiseLayer(.72,.15,1900),toneLayer(145,82,.7,.15),toneLayer(495,495,.25,.08,.6)]),
  'winch-load': cue('Treuil mis en charge', ['AS47'], [toneLayer(180,260,.65,.14,0,'triangle'),noiseLayer(.65,.11,1300),toneLayer(90,90,.25,.14,.5)]),
  'winch-release': cue('Treuil libéré', ['AS47'], [noiseLayer(.24,.23,2900),toneLayer(430,95,.32,.19,0,'metal')]),
  'bridge-lock': cue('Tablier verrouillé', ['AS47'], [toneLayer(92,43,.35,.28),noiseLayer(.16,.21,1400),toneLayer(620,210,.13,.09,.12,'metal')]),
  'engine-depart': cue('Départ réel du véhicule', ['AS47','AS62'], [toneLayer(42,86,1.3,.18,0,'triangle'),toneLayer(85,172,1.1,.07,.12),noiseLayer(1.3,.09,850)]),
  'engine-arrive': cue('Moteur revenu au ralenti à destination', ['AS47','AS62'], [toneLayer(85,39,1.15,.18,0,'triangle'),noiseLayer(.75,.09,640),toneLayer(130,70,.2,.08,.75)]),
  'dike-load': cue('Charge prise par le panneau', ['AS54'], [toneLayer(95,68,.8,.19,0,'metal'),noiseLayer(.7,.12,550)]),
  'pressure-warning': cue('Seuil de fatigue ou de pression réellement atteint', ['AS54'], [toneLayer(370,310,.21,.19,0,'triangle'),toneLayer(370,310,.21,.19,.31,'triangle')], 'danger'),
  'water-warning': cue('Eau entrée dans un logement', ['AS54'], [noiseLayer(1.1,.19,2100),toneLayer(440,355,.24,.16,.15),toneLayer(440,355,.24,.16,.51)], 'danger'),
  'consent-recorded': cue('Accord effectivement recueilli, sans parole synthétique', ['AS62'], [toneLayer(440,440,.13,.09),toneLayer(550,550,.19,.08,.18)]),
  'beacon-recovered': cue('Attaches et balise récupérées', ['AS60','AS62'], [noiseLayer(.06,.15,2600),toneLayer(880,440,.2,.1,.08,'metal'),toneLayer(660,660,.2,.08,.31)]),
  'beacon-lost': cue('Balise détruite, données non récupérées', ['AS60','AS62'], [noiseLayer(.25,.19,3600),toneLayer(620,160,.4,.14,0,'metal')], 'danger'),
  'seizure-warning': cue('Signal de saisie effectivement annoncé', ['AS62'], [toneLayer(480,480,.16,.2,0,'triangle'),toneLayer(360,360,.16,.19,.24,'triangle'),toneLayer(480,480,.22,.2,.49,'triangle')], 'danger'),
  'transfer-start': cue('Début matériel du transfert individuel', ['AS62'], [noiseLayer(.18,.11,1400),toneLayer(130,190,.45,.11,.07)]),
  'person-arrived': cue('Une personne a effectivement atteint l’accueil', ['AS50','AS62'], [toneLayer(640,640,.12,.06),toneLayer(800,800,.15,.045,.15)]),
  'boarding-complete': cue('Embarquement individuel acquis', ['AS50'], [noiseLayer(.09,.09,1600),toneLayer(480,480,.13,.07,.1),toneLayer(600,600,.19,.065,.25)]),
  'boat-departed': cue('Bateau sorti de la zone des portes, arrivée encore attendue', ['AS50','AS47'], [toneLayer(392,392,.35,.1,0,'metal'),toneLayer(294,294,.5,.08,.28,'metal')]),
  'gate-open': cue('Porte d’écluse réellement ouverte', ['AS50','AS54'], [noiseLayer(1.1,.18,1100),toneLayer(62,93,.9,.19,0,'triangle'),toneLayer(240,110,.25,.13,.85)]),
  'gate-lock': cue('Verrou d’écluse effectivement engagé', ['AS50','AS54'], [toneLayer(105,35,.5,.26),noiseLayer(.17,.23,1700),toneLayer(710,280,.17,.09,.1,'metal')]),
};

/** Eight different seamless environmental beds; no speech or licensed recordings. */
export const PLANET_SOUNDS = {
  PL01: { name:'Vesper',title:'Cendre, conduite et ateliers lointains',seed:1847,color:'dust',noise:.16,low:43,bell:317,pulse:5 },
  PL02: { name:'Nacre',title:'Eau contre les palées, clapot et brume saline',seed:2941,color:'water',noise:.22,low:52,bell:583,pulse:3 },
  PL03: { name:'Thyr',title:'Frottement végétal et appels non humains',seed:3853,color:'forest',noise:.12,low:37,bell:941,pulse:7 },
  PL04: { name:'Kharon',title:'Souffle de hauts fourneaux et tôles thermiques',seed:4481,color:'furnace',noise:.18,low:61,bell:211,pulse:4 },
  PL05: { name:'Sereis',title:'Vent froid, neige dure et craquement de glace',seed:5531,color:'ice',noise:.13,low:31,bell:1241,pulse:2 },
  PL06: { name:'Ilex',title:'Lamelles minérales et résonances de canopée',seed:6653,color:'glass',noise:.065,low:47,bell:727,pulse:6 },
  PL07: { name:'Méridien',title:'Canal lent, mécanisme agricole et vent de plaine',seed:7741,color:'canal',noise:.13,low:57,bell:383,pulse:8 },
  PL08: { name:'Orthe',title:'Ville de pierre, atelier et trafic distant',seed:8863,color:'city',noise:.11,low:73,bell:463,pulse:9 },
};

/** The application explicitly selects the mood; local disobedience cannot reveal the later rupture. */
export const MUSIC_MOTIFS = {
  imperial: {title:'Pas mesurés',bpm:72,beats:16,base:110,notes:[[0,0,1.6],[2,7,.8],[3,3,.8],[4,2,2.8],[8,0,1.8],[10,7,.8],[11,5,.8],[12,2,2.8]],bass:[[0,-12,3],[4,-10,3],[8,-12,3],[12,-17,3]],wave:'triangle'},
  crew: {title:'Le fil gardé',bpm:66,beats:16,base:146.8324,notes:[[0,0,2.4],[3,5,1.5],[5,7,2.3],[8,9,2.5],[11,7,1.8],[13,2,2.5]],bass:[[0,-12,5],[8,-7,5]],wave:'sine'},
  fracture: {title:'Ordre interrompu',bpm:72,beats:16,base:110,notes:[[0,0,1.6],[2,7,.8],[3,3,.8],[4,1,2.1],[9,0,1.5],[11,6,.7],[12,2,2.8]],bass:[[0,-12,3],[4,-11,3],[9,-12,3],[12,-18,3]],wave:'metal'},
};

function sampleRateOf(options) { return audioClamp(Math.round(options.sampleRate || 22050),8000,96000); }
function oscillator(phase,wave) {
  if (wave==='triangle') return (Math.sin(phase)-Math.sin(phase*3)/9+Math.sin(phase*5)/25)/1.16;
  if (wave==='metal') return (Math.sin(phase)+.28*Math.sin(phase*2.73)+.12*Math.sin(phase*4.19))/1.4;
  return Math.sin(phase);
}
function renderLayers(layers,duration,options={}) {
  const sampleRate=sampleRateOf(options),output=new Float32Array(Math.ceil(duration*sampleRate)); let seed=(options.seed||6173)>>>0;
  for (const layer of layers) {
    const count=Math.ceil(layer.duration*sampleRate),start=Math.round(layer.at*sampleRate); let phase=0,low=0;
    const coefficient=1-Math.exp(-AUDIO_TAU*Math.min(sampleRate*.4,layer.cutoff||1000)/sampleRate);
    for(let i=0;i<count&&start+i<output.length;i++) {
      const t=i/sampleRate,p=i/count,env=Math.min(1,t/.007)*Math.min(1,(layer.duration-t)/.018)*Math.pow(1-p,layer.kind==='noise'?1.8:1.3); let sample;
      if(layer.kind==='noise') {seed=(Math.imul(seed,1664525)+1013904223)>>>0;low+=(seed/2147483648-1-low)*coefficient;sample=low*1.65;}
      else { const frequency=Math.max(8,layer.frequency)*Math.pow(Math.max(8,layer.end)/Math.max(8,layer.frequency),p);phase+=AUDIO_TAU*Math.min(sampleRate*.35,frequency)/sampleRate;sample=oscillator(phase,layer.wave); }
      output[start+i]+=sample*env*layer.level;
    }
  }
  for(let i=0;i<output.length;i++)output[i]=Math.tanh(output[i]*1.15)*.88;
  return output;
}
export function renderSoundCue(id,options={}) {
  const definition=SOUND_CUES[id];if(!definition)throw new RangeError(`Unknown sound cue: ${id}`);
  return renderLayers(definition.layers,definition.duration,{...options,seed:6173+(options.variant||0)*127});
}
export function renderAmbience(planetId,options={}) {
  const profile=PLANET_SOUNDS[planetId];if(!profile)throw new RangeError(`Unknown planet ambience: ${planetId}`);
  const sampleRate=sampleRateOf(options),duration=options.duration||12,length=Math.round(sampleRate*duration),output=new Float32Array(length);let seed=profile.seed;
  // Integer-frequency partials plus periodic interpolated noise create an exact loop, with no splice fade.
  const tables=[31,127,509,2039].map(count=>Array.from({length:count},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;}));
  const periodic=(table,phase)=>{const p=phase*table.length,j=Math.floor(p),f=p-j,u=f*f*(3-2*f);return table[j%table.length]*(1-u)+table[(j+1)%table.length]*u;};
  const lowCycles=Math.round(profile.low*duration),bellCycles=Math.round(profile.bell*duration);
  for(let i=0;i<length;i++) {
    const u=i/length,phase=AUDIO_TAU*u,swell=.52+.35*Math.sin(phase*profile.pulse+.7);
    const n=periodic(tables[0],u)*.42+periodic(tables[1],u)*.32+periodic(tables[2],u)*.18+periodic(tables[3],u)*.08;
    let sample=n*profile.noise*swell+Math.sin(phase*lowCycles)*.014;
    if(profile.color==='water')sample+=periodic(tables[3],u)*.04*Math.pow(.5+.5*Math.sin(phase*23),5);
    if(profile.color==='forest')sample+=Math.sin(phase*bellCycles+2*Math.sin(phase*19))*.016*Math.pow(.5+.5*Math.sin(phase*7),18);
    if(profile.color==='furnace')sample+=Math.sin(phase*lowCycles*2)*.022+periodic(tables[1],u)*.05;
    if(profile.color==='ice')sample+=Math.sin(phase*bellCycles)*.012*Math.pow(.5+.5*Math.sin(phase*11),28);
    if(profile.color==='glass')sample+=(Math.sin(phase*bellCycles)+.5*Math.sin(phase*Math.round(bellCycles*1.498)))*.014*Math.pow(.5+.5*Math.sin(phase*5),6);
    if(profile.color==='canal')sample+=Math.sin(phase*lowCycles)*.015*(.5+.5*Math.sin(phase*17));
    if(profile.color==='city')sample+=Math.sin(phase*Math.round(93*duration)+2*Math.sin(phase*3))*.012*(.5+.5*Math.sin(phase));
    if(profile.color==='dust')sample+=Math.sin(phase*bellCycles)*.01*Math.pow(.5+.5*Math.sin(phase*13),12);
    output[i]=sample;
  }
  return output;
}
export function renderMotif(id,options={}) {
  const motif=MUSIC_MOTIFS[id];if(!motif)throw new RangeError(`Unknown musical motif: ${id}`);const beat=60/motif.bpm,layers=[];
  for(const [at,pitch,beats]of motif.notes) {const f=motif.base*Math.pow(2,pitch/12);layers.push(toneLayer(f,f,beats*beat,.16,at*beat,motif.wave));layers.push(toneLayer(f*2,f*2,beats*beat*.72,.023,at*beat+.017));}
  for(const [at,pitch,beats]of motif.bass) {const f=motif.base*Math.pow(2,pitch/12);layers.push(toneLayer(f,f,beats*beat,.12,at*beat));}
  return renderLayers(layers,motif.beats*beat,options);
}

/** Facts use physical state, never parsed radio prose or a choice that has not been performed. */
export function collectAudioFacts(game) {
  const facts={},put=(key,value,cueId)=>{facts[key]={value,cue:cueId};},r=game.player?.radiator;
  if(r){put('radiator.health',r.health,'radiator-hit');put('repair.working',r.repairing,'repair-start');put('repair.kits',r.repairKits,'repair-complete');}
  put('player.braced',!!game.player?.braced,'hydraulic-brace');
  for(const station of game.network?.stations||[]){put(`${station.id}.identified`,station.identified,station.kind==='military'?'military-signal':'civil-signal');put(`${station.id}.verified`,station.verified,'inspection-complete');put(`${station.id}.secured`,station.secured,'relay-secured');}
  if(game.network)put('control.arrival',game.network.scrutinyTriggered,'control-arrival');
  if(game.industrial){put('coolant.connected',game.industrial.pump.connected,'pump-start');for(const t of game.industrial.turbines)put(`${t.id}.cooled`,t.cooled,'turbine-cooled');}
  if(game.channel){for(const b of game.channel.banks)put(`${b.id}.bridge`,b.bridgeRaised,'bridge-lock');for(const w of game.channel.winches){put(`${w.id}.working`,w.working,'winch-load');put(`${w.id}.released`,w.released,'winch-release');}put('channel.boat.moving',game.channel.boat.moving,'engine-depart');put('channel.boat.arrived',game.channel.boat.arrived,'engine-arrive');}
  if(game.dike){const d=game.dike;put('dike.loaded',d.panel.loaded,'dike-load');put('dike.locked',d.panel.locked,'gate-lock');put('dike.fatigue',d.panel.fatigue>=65,'pressure-warning');put('dike.auxiliary',d.auxiliary.connected,'pump-start');put('dike.pump',d.valve.completed,'pump-start');for(const h of d.houses)put(`${h.id}.flooded`,h.flooded,'water-warning');for(const p of d.residents)put(`${p.id}.safe`,p.safe,'person-arrived');}
  if(game.ambulance){const a=game.ambulance;put('ambulance.moving',a.vehicle.moving,'engine-depart');put('ambulance.stop',a.vehicle.stopReached,'engine-arrive');put('ambulance.arrived',a.vehicle.arrived,'engine-arrive');put('ambulance.consent',a.consent.obtained,'consent-recorded');put('ambulance.inspection',a.cargo.inspected,'inspection-complete');put('ambulance.beacon.recovered',a.beacon.recovered,'beacon-recovered');put('ambulance.beacon.destroyed',a.beacon.destroyed,'beacon-lost');put('ambulance.signal',a.signalAnnounced,'seizure-warning');put('ambulance.raid',a.raidTriggered,'control-arrival');put('ambulance.ramp',a.ramp.prepared,'bridge-lock');put('ambulance.handover',a.handover.completed,'transfer-start');for(const p of [...a.staff,...a.patients])put(`${p.id}.safe`,p.safe,'person-arrived');}
  if(game.departure){
    const d=game.departure;
    for(const gate of d.locks){put(`${gate.id}.inspected`,gate.inspected,'inspection-complete');put(`${gate.id}.open`,!gate.destroyed&&!gate.working&&gate.opening===1,'gate-open');put(`${gate.id}.closed`,!gate.destroyed&&!gate.working&&gate.opening===0,'gate-lock');put(`${gate.id}.sealed`,gate.sealed,'gate-lock');put(`${gate.id}.pressure`,!!game.notified?.[`aval-pressure-${gate.kind}`],'pressure-warning');}
    for(const ramp of d.ramps)put(`${ramp.id}.prepared`,ramp.prepared,'bridge-lock');
    for(const boat of d.boats){put(`${boat.id}.moving`,boat.moving,'engine-depart');put(`${boat.id}.departed`,boat.departed,'boat-departed');put(`${boat.id}.arrived`,boat.arrived,'engine-arrive');}
    for(const person of d.people){put(`${person.id}.aboard`,person.phase==='aboard','boarding-complete');put(`${person.id}.safe`,person.safe,'person-arrived');}
    put('aval.alert.announced',d.alert.announced,'seizure-warning');put('aval.alert.arrived',d.alert.triggered,'control-arrival');
  }
  return facts;
}
export function diffAudioFacts(previous,next) {
  if(!previous)return [];const changes=[];
  for(const [key,current]of Object.entries(next)){
    const before=previous[key];if(!before||before.value===current.value)continue;
    if(key==='radiator.health'||key==='repair.kits'){if(current.value<before.value)changes.push({key,cue:current.cue});continue;}
    if(key==='repair.working'&&before.value&&!current.value){if(next['repair.kits']?.value===previous['repair.kits']?.value)changes.push({key,cue:'repair-cancel'});continue;}
    if(current.value===true)changes.push({key,cue:current.cue});
  }
  return changes;
}

export class AudioEngine {
  constructor(){this.context=null;this.master=null;this.volume=.55;this.lastStep=-1;this.paused=false;this.scene={planetId:null,missionId:null,mood:'none'};this.voices=new Set();this.loops=new Map();this.buffers=new Map();this.facts=null;this.elapsed=-1;this.gameKey=null;this.lastCues=[];this.maxVoices=24;this.disposed=false;}
  async unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio||this.disposed)return;if(!this.context){this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=this.volume*.5;this.master.connect(this.context.destination);}if(this.context.state==='suspended')await this.context.resume();this.startScene();}catch{/* A denied audio context must never stop a mission. */}}
  setVolume(value){const n=Number(value);this.volume=Number.isFinite(n)?audioClamp(n,0,1):this.volume;if(this.master)this.master.gain.setTargetAtTime(this.volume*.5,this.context.currentTime,.025);if(!this.volume)this.stopAll();else this.startScene();}
  setPaused(value){this.paused=!!value;if(this.paused)this.stopAll();else this.startScene();}
  setScene({planetId=null,missionId=null,mood='none'}={}){this.stopAll();this.scene={planetId,missionId,mood};this.facts=null;this.elapsed=-1;this.gameKey=null;this.startScene();}
  get ready(){return !!this.context&&this.context.state==='running'&&!this.paused&&this.volume>0&&!this.disposed;}
  buffer(key,samples){if(!this.buffers.has(key)){const data=samples(),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.getChannelData(0).set(data);this.buffers.set(key,buffer);}return this.buffers.get(key);}
  playBuffer(buffer,{loop=false,level=1,key=null,delay=0,priority='effect'}={}){
    if(!this.ready)return null;if(this.voices.size>=this.maxVoices){const oldest=[...this.voices].find(v=>v.stopped)||[...this.voices].find(v=>!v.loop&&v.priority!=='danger');if(oldest)this.stopVoice(oldest,true);else return null;}
    const c=this.context,source=c.createBufferSource(),gain=c.createGain(),time=c.currentTime+delay;source.buffer=buffer;source.loop=loop;gain.gain.setValueAtTime(loop?0:level,time);if(loop)gain.gain.linearRampToValueAtTime(level,time+.3);source.connect(gain).connect(this.master);
    const voice={source,gain,loop,key,priority,stopped:false,cleanup:null};voice.cleanup=()=>{source.disconnect();gain.disconnect();this.voices.delete(voice);if(key&&this.loops.get(key)===voice)this.loops.delete(key);};source.onended=voice.cleanup;this.voices.add(voice);if(key)this.loops.set(key,voice);source.start(time);return voice;
  }
  stopVoice(voice,immediate=false){if(voice.stopped){if(immediate)voice.cleanup();return;}voice.stopped=true;if(voice.key&&this.loops.get(voice.key)===voice)this.loops.delete(voice.key);try{if(!immediate){const now=this.context.currentTime;voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(0,now,.005);voice.source.stop(now+.025);}else{voice.source.stop();voice.cleanup();}}catch{voice.cleanup();}}
  stopAll(){for(const voice of [...this.voices])this.stopVoice(voice);this.loops.clear();}
  startScene(){if(!this.ready)return;const sampleRate=this.context.sampleRate,{planetId,mood}=this.scene;if(PLANET_SOUNDS[planetId]&&!this.loops.has('ambience'))this.playBuffer(this.buffer(`planet:${planetId}`,()=>renderAmbience(planetId,{sampleRate})),{loop:true,level:.8,key:'ambience'});if(MUSIC_MOTIFS[mood]&&!this.loops.has('music'))this.playBuffer(this.buffer(`motif:${mood}`,()=>renderMotif(mood,{sampleRate})),{loop:true,level:.23,key:'music'});}
  playCue(id,options={}){
    if(!this.ready||!SOUND_CUES[id])return false;const definition=SOUND_CUES[id],variant=(options.variant||0)%4,sampleRate=this.context.sampleRate;
    const played=this.playBuffer(this.buffer(`cue:${id}:${variant}`,()=>renderSoundCue(id,{sampleRate,variant})),{priority:definition.priority});if(!played)return false;
    if(definition.priority==='danger'||id==='radio')for(const [key,level]of [['ambience',.8],['music',.23]]){const voice=this.loops.get(key);if(!voice)continue;const t=this.context.currentTime,gain=voice.gain.gain;gain.cancelScheduledValues(t);gain.setTargetAtTime(level*.42,t,.03);gain.setTargetAtTime(level,t+Math.max(.7,definition.duration),.3);}
    return true;
  }
  event(eventOrType,game=null){let id=typeof eventOrType==='string'?eventOrType:eventOrType?.soundCue||eventOrType?.type;if(id==='step'&&game?.planetId==='PL02')id='step-wet';if(id==='step'&&game?.planetId==='PL03')id='step-fibre';return this.playCue(id,{variant:game?.stats?.steps||0});}
  update(game){if(!game)return [];const key=`${game.missionId}:${game.seed}`,elapsed=game.elapsed||0,next=collectAudioFacts(game);if(key!==this.gameKey||elapsed<this.elapsed)this.facts=null;const changes=diffAudioFacts(this.facts,next);this.facts=next;this.elapsed=elapsed;this.gameKey=key;this.lastCues=changes;if(this.ready)for(const change of changes)this.playCue(change.cue);return changes;}
  tone(freq,end,length,level=.5,type='sine',delay=0){if(!this.ready)return;const data=renderLayers([toneLayer(freq,end,length,level,0,type)],length+.025,{sampleRate:this.context.sampleRate}),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.getChannelData(0).set(data);this.playBuffer(buffer,{delay});}
  hiss(length,level=.3,cutoff=800,delay=0){if(!this.ready)return;const data=renderLayers([noiseLayer(length,level,cutoff)],length+.025,{sampleRate:this.context.sampleRate}),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.getChannelData(0).set(data);this.playBuffer(buffer,{delay});}
  async dispose(){this.disposed=true;for(const voice of [...this.voices])this.stopVoice(voice,true);this.loops.clear();this.buffers.clear();this.facts=null;const context=this.context;if(this.master)this.master.disconnect();this.context=null;this.master=null;try{if(context&&context.state!=='closed')await context.close();}catch{/* Already closed. */}}
}
