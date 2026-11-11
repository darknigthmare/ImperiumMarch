/** Independent public-controls MI08 campaign audit. Never injects physical game state. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {WALKERS} from '../src/content.mjs';
import {updateGame} from '../src/simulation.mjs';
import {createCampaign,parseCampaign,serializeCampaign,beginCampaignMission,checkpointCampaign,restoreCampaignGame,finishCampaignMission} from '../src/campaign.mjs';
import {pilotMI08} from '../tests/helpers/mi08-driver.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const path=rel=>resolve(root,rel), sha=rel=>createHash('sha256').update(readFileSync(path(rel))).digest('hex');
const core=['src/content.mjs','src/simulation.mjs','src/campaign.mjs','src/departure-validation.mjs','tests/helpers/mi08-driver.mjs','tests/fixtures/campaign-v7-mi07.json'];
const startHashes=Object.fromEntries(core.map(f=>[f,sha(f)]));
const historical=JSON.parse(readFileSync(path('tests/fixtures/campaign-v7-mi07.json'),'utf8'));
const report={type:'public-controls-campaign-audit',version:'0.9',runtime:process.version,startedAt:new Date().toISOString(),sourceHashes:startHashes,completed:false,variants:[],checkpointRoundtrips:0,restorations:0,deterministicContinuations:0,limits:['Simulation Node; no browser clicks, hardware, audio listening or human playtest.','Normal difficulty for six-chassis main matrix; story difficulty for focused degraded and historical cases.']};
const cases=WALKERS.flatMap(walker=>['obey','delay','defy'].map(choice=>({name:`${walker.id}-${choice}`,walkerId:walker.id,choice,difficulty:'normal'})));
for(const [name,options]of Object.entries({intake:{destroyIntake:true},passage:{destroyPassage:true},boats:{destroyBoats:true},registry:{destroyRegistry:true},refuge:{destroyRefugeRadio:true},ramp1:{destroyRamp:true},ramp2:{destroyRamp:2},technicians:{killTechnicians:true},harbourmaster:{killHarbourmaster:true},mara:{killMara:true}}))cases.push({name:`degraded-${name}`,walkerId:'WK09',choice:'delay',difficulty:'story',...options});
for(const history of ['imperialCompleted','manualCompleted','noStaffCompleted','lossCompleted'])cases.push({name:`historical-${history}`,walkerId:'WK09',choice:'delay',difficulty:'story',history});
mkdirSync(path('docs/validation'),{recursive:true});
const snapshots=new Set();
try{
 for(const variant of cases){
  const before=parseCampaign(JSON.stringify(historical[variant.history||'completed']));
  const priorReports=structuredClone(before.completed),stock=structuredClone(before.resources),spent=before.world.nacre.fuelSpent;
  let {campaign,game}=beginCampaignMission(before,{missionId:'MI08',walkerId:variant.walkerId,difficulty:variant.difficulty,seed:1847});
  let checkpoints=0,restorations=0,continuations=0,lastCapture=-1,lastTransition='';
  pilotMI08(game,{...variant,observe(s,frame){
   // Won sorties are committed by finishCampaignMission below, not by the live
   // checkpoint API. A frame landing exactly on extraction must use that path.
   if(s.status!=='playing')return;
   const transition=JSON.stringify([s.campaign.phase,s.departure.people.map(p=>[p.phase,p.alive,p.departed]),s.departure.boats.map(b=>[b.phase,b.moving,b.arrived,b.departed,b.returned,b.destroyed]),s.departure.locks.map(g=>[g.working,g.inspected,g.sealed,g.destroyed,g.mechanism.destroyed]),s.departure.report.transmitted]);
   if(frame%120===0||transition!==lastTransition||s.decision.active&&lastCapture!==s.elapsed){
    lastTransition=transition;
    lastCapture=s.elapsed;
    campaign=checkpointCampaign(campaign,s);const roundtrip=parseCampaign(serializeCampaign(campaign));assert.deepEqual(roundtrip,campaign);checkpoints++;
    const restored=restoreCampaignGame(roundtrip);assert.deepEqual(restored,s);restorations++;
    if(checkpoints%11===0){const a=structuredClone(s),b=restoreCampaignGame(roundtrip),input={move:0,brace:true,vent:true,aimX:s.player.x+400,aimY:s.player.y};updateGame(a,1/60,input);updateGame(b,1/60,input);assert.deepEqual(a,b);continuations++;}
   }
   if(variant.name==='WK09-delay'){
    const gate=s.departure.locks[1];
    let name=gate.working&&gate.progress>.35&&gate.progress<.65?'gate':s.campaign.peopleEnRoute>0&&!s.campaign.peopleArrived?'departed':s.departure.people.some(p=>p.phase==='landing')?'landing':s.departure.report.working&&s.departure.report.progress>.25?'report':null;
    if(name&&!snapshots.has(name)){snapshots.add(name);writeFileSync(path(`docs/validation/v09-browser-${name}-input.json`),serializeCampaign(checkpointCampaign(campaign,s)));}
   }
  }});
  assert.equal(game.status,'won',`${variant.name} did not finish`);
  const result=finishCampaignMission(campaign,game);assert.equal(result.applied,true);
  const finished=parseCampaign(serializeCampaign(result.campaign));
  assert.deepEqual(Object.fromEntries(Object.entries(finished.completed).filter(([id])=>id!=='MI08')),priorReports);
  assert.equal(finished.resources.parts,stock.parts+4);assert.equal(finished.resources.fuel,stock.fuel);assert.equal(finished.world.nacre.fuelSpent,spent);
  assert.equal(finished.completed.MI08.roster.people.length,game.departure.people.length);
  assert.equal(game.stats.evidence,0);
  const unchanged=serializeCampaign(finished),duplicate=finishCampaignMission(finished,game);
  assert.equal(duplicate.applied,false);assert.equal(serializeCampaign(duplicate.campaign),unchanged);
  const replay=beginCampaignMission(finished,{missionId:'MI08',walkerId:variant.walkerId,replay:true});assert.equal(replay.replay,true);assert.equal(serializeCampaign(replay.campaign),unchanged);
  const f=game.campaign;
  report.variants.push({name:variant.name,walkerId:variant.walkerId,choice:variant.choice,difficulty:variant.difficulty,historicalSource:variant.history||'completed',elapsed:game.elapsed,checkpointRoundtrips:checkpoints,restorations,deterministicContinuations:continuations,peopleTotal:f.peopleTotal,peopleDeparted:f.peopleDeparted,peopleArrived:f.peopleArrived,peopleLocal:f.peopleLocal,peopleLost:f.peopleLost,patientsTotal:f.patientsTotal,patientsArrived:f.patientsArrived,patientsLocal:f.patientsLocal,patientsLost:f.patientsLost,boatsDeparted:f.boatsDeparted,boatsArrived:f.boatsArrived,boatsLost:f.boatsLost,execution:f.execution,registryCopied:f.registryCopied,parts:finished.resources.parts,fuel:finished.resources.fuel,fuelSpent:finished.world.nacre.fuelSpent,previousReportsExact:true,replayUnchanged:true});
  report.checkpointRoundtrips+=checkpoints;report.restorations+=restorations;report.deterministicContinuations+=continuations;
  if(variant.name==='WK09-delay')writeFileSync(path('docs/validation/v09-campaign-completed-reference.json'),serializeCampaign(finished));
  console.log(`${variant.name}: won; ${checkpoints} exact saves; ${f.peopleArrived} refuge / ${f.peopleLocal} local / ${f.peopleLost} lost; ${f.execution}`);
 }
 equalHashes(); report.completed=true;
}catch(error){report.error=error.stack;console.error(error.stack);process.exitCode=1;}
function equalHashes(){assert.deepEqual(Object.fromEntries(core.map(f=>[f,sha(f)])),startHashes,'Core changed during audit: rerun against a stable snapshot');}
report.finishedAt=new Date().toISOString();
writeFileSync(path('docs/validation/v09-campaign-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({completed:report.completed,variants:report.variants.length,checkpointRoundtrips:report.checkpointRoundtrips,restorations:report.restorations,deterministicContinuations:report.deterministicContinuations}));
