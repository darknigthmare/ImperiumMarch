import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createCampaign,parseCampaign,serializeCampaign,readCampaign,writeCampaign,beginCampaignMission,checkpointCampaign,restoreCampaignGame,finishCampaignMission,nextCampaignMissionId,CAMPAIGN_SAVE_VERSION,CAMPAIGN_SAVE_KEY,CAMPAIGN_BACKUP_KEY} from '../src/campaign.mjs';
import {updateGame,departurePersonSeeds,departureTideAt} from '../src/simulation.mjs';
import {pilotMI08} from './helpers/mi08-driver.mjs';
const bytes=readFileSync(new URL('./fixtures/campaign-v7-mi07.json',import.meta.url));
const history=JSON.parse(bytes), clone=v=>JSON.parse(JSON.stringify(v));
const variants=['live','completed','imperialCompleted','manualCompleted','noStaffCompleted','lossCompleted'];
const disk=text=>{const values=new Map([[CAMPAIGN_SAVE_KEY,text]]);return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}};
const after=(name='completed')=>parseCampaign(JSON.stringify(history[name]));
const start=(name='completed')=>beginCampaignMission(after(name),{missionId:'MI08',walkerId:'WK09',difficulty:'story',seed:1847});

test('authentic v7 capture is immutable and migration preserves prior data while adding empty future dossiers',()=>{
 assert.equal(after().version,CAMPAIGN_SAVE_VERSION);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'8ca58deb11f4048039cda3a54157f7eddb2dd6af6a34450a3d177b3bdfa67a5c');
 for(const name of variants){const old=history[name],current=after(name),prior=clone(current);prior.version=7;delete prior.world.thyr;delete prior.world.nacre.departure;
  assert.deepEqual(prior,old,name);assert.deepEqual(current.world.nacre.departure,createCampaign().world.nacre.departure);
  assert.deepEqual(parseCampaign(serializeCampaign(current)),current);
  assert.deepEqual(current.resources,old.resources);assert.equal(current.world.nacre.fuelSpent,old.world.nacre.fuelSpent);
 }
 assert.deepEqual(restoreCampaignGame(after('live')),history.live.checkpoint);
 assert.equal(nextCampaignMissionId(after()),'MI08');
});

test('v7 storage is read without writing, original bytes are backed up and future dossiers stay protected',()=>{
 const original=JSON.stringify(history.live),store=disk(original),loaded=readCampaign(store);
 assert.equal(loaded.blocked,false);assert.equal(store.getItem(CAMPAIGN_SAVE_KEY),original);
 assert.equal(writeCampaign(store,loaded.campaign).ok,true);assert.equal(store.getItem(CAMPAIGN_BACKUP_KEY),original);
 const future=JSON.stringify({...createCampaign(),version:CAMPAIGN_SAVE_VERSION+1});store.values.set(CAMPAIGN_SAVE_KEY,future);
 const blocked=readCampaign(store);assert.equal(blocked.blocked,true);assert.equal(writeCampaign(store,blocked.campaign).ok,false);
 assert.equal(store.getItem(CAMPAIGN_SAVE_KEY),future);
});

test('historical v7 cannot smuggle future mission, physical scene, dossier or third decisions',()=>{
 const edits=[v=>{v.world.nacre.departure={}},v=>{v.checkpoint.departure={}},v=>{v.completed.MI08={}},v=>{v.activeMissionId='MI08'},v=>{v.checkpoint.missionId='MI08'},v=>{v.checkpoint.decision.choice='delay'}];
 for(const edit of edits){const value=clone(history.live);edit(value);assert.throws(()=>parseCampaign(JSON.stringify(value)),/Sauvegarde invalide/);}
});

test('MI08 requires the completed sanitary report and starts from actual counted survivors without fuel creation',()=>{
 assert.equal(beginCampaignMission(createCampaign(),{missionId:'MI08'}).ok,false);
 assert.equal(beginCampaignMission(after('live'),{missionId:'MI08'}).ok,false);
 for(const name of variants.filter(n=>n!=='live')){
  const source=after(name),before=serializeCampaign(source),deployed=start(name),s=deployed.game;
  assert.equal(deployed.ok,true);assert.equal(serializeCampaign(source),before);assert.deepEqual(deployed.campaign.resources,source.resources);
  assert.equal(deployed.campaign.world.nacre.fuelSpent,source.world.nacre.fuelSpent);
  assert.equal(s.campaign.context.patientsArrived,source.completed.MI07.patientsArrived);
  assert.equal(s.campaign.context.medicalDestination,source.completed.MI07.destination);
  assert.equal(s.departure.people.filter(p=>p.role==='patient').length,source.completed.MI07.patientsArrived);
  assert.equal(s.departure.people.filter(p=>p.role==='resident').length,source.completed.MI06.residentsSafe);
  assert.equal(s.departure.people.filter(p=>p.role==='refugee').length,source.completed.MI05.refugeesPassed);
  assert.equal(s.departure.people.filter(p=>p.phase==='offsite').length,1);assert.equal(s.campaign.maraPresent,false);
  assert.equal(s.campaign.peopleArrived,0);assert.equal(s.campaign.peopleDeparted,0);assert.equal(s.stats.evidence,0);
  assert.deepEqual(s.decision.options.map(o=>o.id),['obey','delay','defy']);
  assert.deepEqual(restoreCampaignGame(deployed.campaign),s);
 }
});

test('new census distinguishes aggregate origins from a surviving identified witness and creates no historical identity',()=>{
 const {game:s}=start(),seeds=departurePersonSeeds(s.campaign.context);
 assert.ok(seeds.filter(p=>['patient','refugee','resident'].includes(p.role)).every(p=>p.sourceKind==='aggregate'&&p.originalId===null));
 const witness=seeds.find(p=>p.originalId===s.campaign.context.medicalWitnessId&&p.role==='staff');
 if(s.campaign.context.medicalWitnessAvailable)assert.ok(witness);
 const partial=departurePersonSeeds({...s.campaign.context,staffArrived:1,staffLost:0,medicalWitnessAvailable:true,medicalWitnessId:'ambulance-driver'});
 assert.ok(partial.filter(p=>p.role==='staff').every(p=>p.sourceKind==='aggregate'&&p.originalId===null));
 assert.equal(new Set(seeds.map(p=>p.id)).size,seeds.length);
});

test('MI08 exact live snapshots preserve tide, people, ammunition, gates and previous reports',()=>{
 let {campaign,game}=start();const previous=clone(campaign.completed);
 for(let i=0;i<300;i++)updateGame(game,1/60,{move:1,aimX:1300,aimY:300});
 campaign=checkpointCampaign(campaign,game);const saved=parseCampaign(serializeCampaign(campaign));
 assert.deepEqual(restoreCampaignGame(saved),game);assert.deepEqual(saved.completed,previous);
 assert.deepEqual(game.departure.tide,departureTideAt(game.elapsed));
 const detached=restoreCampaignGame(saved);detached.departure.people[0].hp=0;detached.departure.locks[0].opening=0;
 assert.notDeepEqual(detached,restoreCampaignGame(saved));
});

test('MI08 imports reject forged people, capacities, positions, provenance, facts and inherited supply',()=>{
 const source=start().campaign;
 const edits=[
  v=>{v.checkpoint.departure.people.pop()},v=>{v.checkpoint.departure.people[0].id='invented'},
  v=>{v.checkpoint.departure.people[0].originalId='revived-historical-person'},v=>{v.checkpoint.departure.people[0].sourceKind='identified'},
  v=>{v.checkpoint.departure.people[0].alive=false},v=>{v.checkpoint.departure.people[0].safe=true},
  v=>{v.checkpoint.departure.people[0].departed=true},v=>{v.checkpoint.departure.people[0].phase='arrived'},
  v=>{v.checkpoint.departure.boats[0].seatCapacity=99},v=>{v.checkpoint.departure.boats[0].departed=true},
  v=>{v.checkpoint.departure.boats[0].arrived=true},v=>{v.checkpoint.departure.refuge.capacity=999},
  v=>{v.checkpoint.departure.locks[1].sealed=true},v=>{v.checkpoint.departure.locks[0].mechanism.x++},
  v=>{v.checkpoint.departure.tide.level=.999},v=>{v.checkpoint.campaign.peopleArrived=20},
  v=>{v.checkpoint.campaign.context.patientsArrived=3},v=>{v.checkpoint.campaign.registryCopied=true},
  v=>{v.checkpoint.stats.evidence=1},v=>{v.resources.fuel=2},v=>{v.world.nacre.departure.peopleArrived=3},
 ];
 for(const edit of edits){const value=clone(source);edit(value);assert.throws(()=>parseCampaign(JSON.stringify(value)),/Sauvegarde invalide/);}
});

for(const choice of ['obey','delay','defy'])test(`MI08 ${choice} stores individual outcomes, grants once and leaves all previous reports and fuel exact`,()=>{
 let {campaign,game}=start();const prior=clone(campaign.completed),stock=clone(campaign.resources),spent=campaign.world.nacre.fuelSpent;
 pilotMI08(game,{choice});assert.equal(game.status,'won');
 const result=finishCampaignMission(campaign,game),saved=parseCampaign(serializeCampaign(result.campaign)),receipt=saved.completed.MI08;
 assert.equal(result.applied,true);assert.equal(receipt.choice,choice);assert.equal(receipt.peopleTotal,36);
 assert.equal(receipt.peopleArrived,choice==='obey'?0:34);assert.equal(receipt.peopleLocal,choice==='obey'?36:2);assert.equal(receipt.peopleLost,0);
 assert.equal(receipt.roster.people.length,36);assert.equal(receipt.roster.boats.length,2);assert.equal(receipt.reportTransmitted,true);
 assert.equal(receipt.reportFiled,choice==='defy');assert.equal(receipt.registryCopied,true);
 assert.equal(saved.resources.parts,stock.parts+4);assert.equal(saved.resources.fuel,stock.fuel);assert.equal(saved.world.nacre.fuelSpent,spent);
 assert.deepEqual(Object.fromEntries(Object.entries(saved.completed).filter(([id])=>id!=='MI08')),prior);
 const before=serializeCampaign(saved);assert.equal(finishCampaignMission(saved,game).applied,false);assert.equal(serializeCampaign(saved),before);
 const replay=beginCampaignMission(saved,{missionId:'MI08',walkerId:'WK10'});assert.equal(replay.replay,true);
 pilotMI08(replay.game,{choice:choice==='obey'?'defy':'obey'});assert.equal(replay.game.status,'won');
 assert.equal(finishCampaignMission(saved,replay.game,{replay:true}).applied,false);assert.equal(serializeCampaign(saved),before);
 for(const edit of [
  r=>{r.roster.people[0].originalId='invented'},r=>{r.roster.people[0].departed=!r.roster.people[0].departed},
  r=>{r.roster.boats[0].arrived=!r.roster.boats[0].arrived},r=>{r.roster.people.pop()},r=>{r.peopleTotal++},
 ]){const tampered=clone(saved);edit(tampered.completed.MI08);tampered.lastDebrief=clone(tampered.completed.MI08);tampered.world.nacre.departure=Object.fromEntries(Object.keys(saved.world.nacre.departure).map(k=>[k,tampered.completed.MI08[k]]));assert.throws(()=>parseCampaign(JSON.stringify(tampered)),/Sauvegarde invalide/);}
});

test('MI08 terminal loss is retained exactly and cannot resume an older living scene',()=>{
 let {campaign,game}=start();const original=clone(game),stock=clone(campaign.resources);
 for(let i=0;i<20000&&game.status==='playing';i++)updateGame(game,1/30,{move:game.player.x<470?1:0});
 assert.equal(game.status,'lost');campaign=checkpointCampaign(campaign,game);
 assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(campaign))),game);
 assert.equal(restoreCampaignGame(campaign,{beforeDecision:true}),null);
 assert.throws(()=>checkpointCampaign(campaign,original),/recul|perdue/);
 const result=finishCampaignMission(campaign,game);assert.equal(result.applied,false);assert.equal(result.receipt,null);
 const fresh=beginCampaignMission(campaign,{missionId:'MI08',walkerId:'WK09',restart:true});
 assert.equal(fresh.ok,true);assert.equal(fresh.game.status,'playing');assert.equal(fresh.game.elapsed,0);assert.deepEqual(fresh.campaign.resources,stock);
});
