/** Reproducible public-control input files for the separately observed Chrome QA.
 * These are Node-prepared fixtures, never browser or human-playtest evidence. */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { parseCampaign, serializeCampaign, beginCampaignMission, checkpointCampaign, finishCampaignMission } from '../src/campaign.mjs';
import { pilotMI02 } from '../tests/helpers/mi02-driver.mjs';
import { pilotMI08 } from '../tests/helpers/mi08-driver.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const path=rel=>resolve(root,rel);
const sha=rel=>createHash('sha256').update(readFileSync(path(rel))).digest('hex');
const read=rel=>JSON.parse(readFileSync(path(rel),'utf8'));
const files=[];
function save(name,campaign,note){
 const rel=`docs/validation/v09-browser-${name}.json`;
 writeFileSync(path(rel),serializeCampaign(campaign));
 files.push({path:rel,sha256:sha(rel),note,mission:campaign.activeMissionId,
  elapsed:campaign.checkpoint?.elapsed??null,playerX:campaign.checkpoint?.player.x??null});
}
const beforeRel='docs/validation/v09-browser-migration-before.json';
const old=read(beforeRel), native=parseCampaign(JSON.stringify(old));
assert.equal(old.version,7);
assert.deepEqual(native.completed,old.completed);
assert.deepEqual(native.resources,old.resources);
save('migration-expected',native,'Expected migration of the actual pre-upgrade browser export; only the declared v8 addition is allowed.');

const v1=read('tests/fixtures/campaign-v1-mi01.json');
const first=parseCampaign(JSON.stringify(v1.completed));
save('mi01-completed-input',first,'Authentic historical MI01 receipt, migrated without changing the receipt, for opening the MI02 briefing.');
const trainStart=beginCampaignMission(first,{missionId:'MI02',walkerId:'WK09',difficulty:'story',seed:1847});
assert.ok(trainStart.ok);
pilotMI02(trainStart.game,{stopAt:s=>s.train.moving&&!s.train.stopped&&s.player.x>=s.train.x-170});
assert.equal(trainStart.game.status,'playing');
assert.equal(trainStart.game.train.moving,true);
assert.equal(trainStart.game.train.brakeWorking,false);
save('mi02-chase-input',checkpointCampaign(trainStart.campaign,trainStart.game),'Prepared by the public MI02 pilot: two harpoons released, train moving, braking not started. Chrome must perform its own chase, reload and braking actions.');
const v2=read('tests/fixtures/campaign-v2-mi02.json');
save('mi02-completed-input',parseCampaign(JSON.stringify(v2.completed)),'Authentic historical two-report dossier, for native archive and replay navigation only.');

const start=beginCampaignMission(native,{missionId:'MI08',walkerId:'WK09',difficulty:'story',seed:1847});
assert.ok(start.ok);
const captured=new Set();
pilotMI08(start.game,{choice:'delay',observe(s){
 if(s.status!=='playing')return;
 const gate=s.departure.locks[1];
 const phases={
  gate:gate.working&&gate.progress>.35&&gate.progress<.65,
  departed:s.campaign.peopleEnRoute>0&&!s.campaign.peopleArrived,
  landing:s.departure.people.some(p=>p.phase==='landing'),
  report:s.departure.report.working&&s.departure.report.progress>.25,
  extraction:s.campaign.reportTransmitted&&s.player.x>s.extraction.x-200
 };
 for(const [name,yes]of Object.entries(phases))if(yes&&!captured.has(name)){
  captured.add(name);
  save(`native-${name}-input`,checkpointCampaign(start.campaign,s),`Node-prepared MI08 ${name} checkpoint, descended from the preserved actual browser v7 export; not a browser result.`);
 }
}});
assert.equal(start.game.status,'won');
assert.deepEqual([...captured].sort(),['departed','extraction','gate','landing','report']);
const finished=finishCampaignMission(start.campaign,start.game).campaign;
assert.deepEqual(Object.fromEntries(Object.entries(finished.completed).filter(([id])=>id!=='MI08')),old.completed);
save('native-completed-reference',finished,'Public-pilot reference only; the final Chrome export must be saved separately and described as observed.');
writeFileSync(path('docs/validation/v09-browser-invalid-input.json'),'{"version":8,"invalid":true}\n');
writeFileSync(path('docs/validation/v09-browser-input-manifest.json'),JSON.stringify({
 type:'Node-prepared public-control inputs, not native browser results',runtime:process.version,
 sources:Object.fromEntries([beforeRel,'tests/fixtures/campaign-v1-mi01.json','tests/fixtures/campaign-v2-mi02.json','src/content.mjs','src/simulation.mjs','src/campaign.mjs','src/departure-validation.mjs','tests/helpers/mi02-driver.mjs','tests/helpers/mi08-driver.mjs'].map(f=>[f,sha(f)])),
 files,limits:['No Chrome interaction is performed by this tool.','No simulated result is counted as a human test.','The actual pre-upgrade browser export is kept unchanged.']
},null,2)+'\n');
console.log(`Prepared ${files.length} valid browser inputs/references and one deliberately invalid file; all preparations are explicitly distinguished from observed browser results.`);
