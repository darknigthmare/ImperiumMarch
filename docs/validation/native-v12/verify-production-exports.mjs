import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {fileURLToPath, pathToFileURL} from 'node:url';

// This receiver only reads exports and invokes the existing validator and pure
// derivation. It never drives, resumes, updates or changes a simulation.
// Portable usage: node verify-production-exports.mjs --repo /path/to/repo
// Optional: --output /path/to/new-receipt.json; without it, write only to stdout.
const options = process.argv.slice(2);
const option = name => { const i=options.indexOf(name); return i<0 ? null : options[i+1]; };
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const candidates = [process.cwd(), path.resolve(scriptDirectory, '../../..'), path.join(scriptDirectory, 'ImperiumMarch')];
const locatedRoot = option('--repo') || candidates.find(p=>fs.existsSync(path.join(p,'src/campaign.mjs')));
if (!locatedRoot) throw new Error('Repository not found; pass --repo /path/to/ImperiumMarch');
const root = path.resolve(locatedRoot);
const output = option('--output');
const {parseCampaign, serializeCampaign} = await import(pathToFileURL(path.join(root,'src/campaign.mjs')));
const {voiceDerivedFacts} = await import(pathToFileURL(path.join(root,'src/voice-simulation.mjs')));
const {VOICE_TRANSLATION_PAIRS} = await import(pathToFileURL(path.join(root,'src/content.mjs')));
const native = 'docs/validation/native-v12/';
const seen = new Map();
const checks = [];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function read(relative) {
  if (seen.has(relative)) return seen.get(relative);
  const absolute = path.join(root, relative), bytes = fs.readFileSync(absolute);
  const item = {path: relative, absolutePath: absolute, bytes: bytes.length, sha256: sha(bytes), raw: bytes};
  seen.set(relative, item); return item;
}
function check(id, pass, observed = undefined) {
  checks.push({id, pass: Boolean(pass), ...(observed === undefined ? {} : {observed})});
}
function document(relative, nativeExport = false) {
  const item = read(relative), raw = JSON.parse(item.raw.toString('utf8'));
  const parsed = parseCampaign(item.raw.toString('utf8'));
  item.document = raw; item.validated = parsed;
  check(`${relative}: accepted by existing campaign validator`, true);
  if (nativeExport || raw.version === 11) check(`${relative}: validation leaves all fields unchanged`, same(raw, parsed));
  if (parsed.checkpoint?.missionId === 'MI11') {
    const scene = parsed.checkpoint, before = JSON.stringify(scene), facts = voiceDerivedFacts(scene);
    check(`${relative}: stored facts match physical objects`, Object.entries(facts).every(([k,v])=>same(scene.campaign[k],v)));
    check(`${relative}: pure derivation leaves checkpoint unchanged`, JSON.stringify(scene) === before);
  }
  return item;
}
function differences(a, b, at = '$', out = []) {
  if (same(a,b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) differences(a[k], b[k], `${at}.${k}`, out);
  } else out.push({path: at, before: a, after: b});
  return out;
}
function summary(d) {
  const s = d.checkpoint;
  return {version:d.version, revision:d.revision, stage:d.stage, reports:Object.keys(d.completed).length,
    resources:d.resources, activeMissionId:d.activeMissionId, checkpoint:s ? {
      missionId:s.missionId, status:s.status, elapsed:s.elapsed, phase:s.campaign.phase,
      shots:s.stats.shots, kills:s.stats.kills, playerX:s.player.x, braced:s.player.braced,
      facts:s.campaign, listening:s.voice.listening.map(p=>({id:p.id, sampled:p.sampled, detected:p.detected,
        progress:p.progress, working:p.working, startedAt:p.startedAt, completedAt:p.completedAt, sampledAt:p.sampledAt})),
      leth:{alive:s.voice.leth.alive, met:s.voice.leth.met, consent:s.voice.leth.consent,
        progress:s.voice.leth.progress, working:s.voice.leth.working, startedAt:s.voice.leth.startedAt,
        completedAt:s.voice.leth.completedAt, testimonyRecorded:s.voice.leth.testimonyRecorded,
        testimonyAt:s.voice.leth.testimonyAt, publicConsent:s.voice.leth.publicConsent, recruited:s.voice.leth.recruited},
      enemies:s.enemies.map(e=>({id:e.id, kind:e.kind, hp:e.hp, dead:e.dead, x:e.x}))
    } : null};
}
function unchangedOfficial(label, before, after) {
  for (const field of ['completed','resources','crew','authority','world','fleet','maintenanceLog'])
    check(`${label}: official ${field} preserved`, same(before[field], after[field]));
}

// Keep the earlier local browser-reception record historical and immutable.
read(native + 'browser-reception.json');
for (const source of ['src/campaign.mjs','src/voice-validation.mjs','src/voice-simulation.mjs','src/simulation.mjs','src/content.mjs']) read(source);
const baseline9 = document(native + 'production-baseline-v9.json');
const migrated9 = document(native + 'migrated-v9-to-v11.json', true);
const baseline10 = document('docs/previews/mi10-completed-campaign.json');
const migrated10 = document(native + 'migrated-v10-to-v11.json', true);
const migrations = [];
for (const [name, old, current, oldVersion, reports, parts, added] of [
  ['v9-to-v11',baseline9,migrated9,9,9,42,['chemical','voice']],
  ['v10-to-v11',baseline10,migrated10,10,10,46,['voice']]
]) {
  const reverted = structuredClone(current.document); reverted.version = oldVersion;
  for (const key of added) delete reverted.world.thyr[key];
  const serialized = Buffer.from(serializeCampaign(old.validated));
  check(`${name}: exact structural migration`, same(old.validated,current.document));
  check(`${name}: native export equals serialized migration byte for byte`, serialized.equals(current.raw));
  check(`${name}: only version and documented new Thyr domains were added`, same(reverted,old.document));
  check(`${name}: historical receipt count`, Object.keys(current.document.completed).length === reports, reports);
  check(`${name}: stock preserved`, current.document.resources.parts === parts && current.document.resources.fuel === 0, current.document.resources);
  migrations.push({id:name, source:old.path, nativeExport:current.path, exactSerializedBytes:serialized.equals(current.raw), addedDomains:added, summary:summary(current.document)});
}
const fixture = read('tests/fixtures/campaign-v10-mi10.json');
let refusal;
try { parseCampaign(fixture.raw.toString('utf8')); refusal = {rejected:false}; }
catch(error) { refusal = {rejected:true, error:error.message}; }
check('fixture container is correctly rejected as a player export', refusal.rejected && refusal.error === 'Sauvegarde invalide : format inconnu');

const listeningSource = document('docs/previews/mi11-listening-checkpoint.json');
const interrupted = document(native + 'listening-interrupted.json', true);
const listened = document(native + 'listening-completed.json', true);
for (const [name,item] of [['interrupted',interrupted],['completed',listened]]) {
  const d=item.document,s=d.checkpoint;
  unchangedOfficial(`listening ${name}`,listeningSource.document,d);
  check(`listening ${name}: ten historical reports unchanged`,Object.keys(d.completed).length===10 && same(d.completed,baseline10.document.completed));
  check(`listening ${name}: no shots, three intact nesting sites, living Leth, no premature TE01`,s.stats.shots===0 && s.campaign.nestsIntact===3 && s.campaign.lethAlive && !s.campaign.te01Acquired);
}
const li = interrupted.document.checkpoint, lc = listened.document.checkpoint;
check('prepared listening was in progress before native interruption',listeningSource.document.checkpoint.voice.listening[0].working && listeningSource.document.checkpoint.voice.listening[0].progress>0);
check('native listening interruption resets incomplete job and acquires nothing',li.voice.listening.every(p=>!p.sampled&&!p.detected&&!p.working&&p.progress===0&&p.startedAt===null&&p.completedAt===null) && li.campaign.readingsTaken===0 && li.campaign.signalsRecorded===0 && !li.player.braced);
check('native listening restart acquires exactly one sample and signal',lc.campaign.readingsTaken===1 && lc.campaign.signalsRecorded===1 && lc.voice.listening.filter(p=>p.sampled).length===1 && lc.voice.listening.filter(p=>p.detected).length===1);
check('first native reading is complete and other two remain untouched',lc.voice.listening[0].sampled && lc.voice.listening[0].detected && lc.voice.listening[0].progress===1 && !lc.voice.listening[0].working && lc.voice.listening.slice(1).every(p=>!p.sampled&&!p.detected&&!p.working&&p.progress===0));
check('native listening restarts after interruption without locating source early',lc.voice.listening[0].startedAt>li.elapsed && lc.elapsed>li.elapsed && !lc.campaign.sourceLocated);

const exchangeSource = document('docs/previews/mi11-exchange-checkpoint.json');
const paused = document(native + 'exchange-paused.json', true);
const reloaded = document(native + 'exchange-reloaded.json', true);
const exchanged = document(native + 'exchange-completed.json', true);
for (const [name,item] of [['paused',paused],['reloaded',reloaded],['completed',exchanged]]) {
  unchangedOfficial(`exchange ${name}`,exchangeSource.document,item.document);
  check(`exchange ${name}: all ten historical reports retained`,same(item.document.completed,baseline10.document.completed) && Object.keys(item.document.completed).length===10);
}
const ep=paused.document.checkpoint,er=reloaded.document.checkpoint,ec=exchanged.document.checkpoint;
const reloadDiff = differences(paused.document,reloaded.document);
check('exchange pause/reload keeps the entire checkpoint identical',same(ep,er));
check('exchange pause/reload changes only dossier revision 196 to 198',reloadDiff.length===1 && reloadDiff[0].path==='$.revision' && reloadDiff[0].before===196 && reloadDiff[0].after===198,reloadDiff);
check('exchange files correctly recorded as different bytes',!paused.raw.equals(reloaded.raw));
check('exchange not yet recorded at pause or reload',!ep.voice.leth.testimonyRecorded && !er.campaign.te01Acquired && ep.voice.leth.progress>0 && ep.voice.leth.progress<1);
check('native exchange completes living private testimony and TE01',ec.voice.leth.alive && ec.voice.leth.testimonyRecorded && ec.voice.leth.progress===1 && !ec.voice.leth.working && ec.campaign.te01Acquired && ec.campaign.witnessAvailable);
check('native exchange preserves original start and adds actual completion',ec.voice.leth.startedAt===ep.voice.leth.startedAt && ec.voice.leth.testimonyAt>er.elapsed && ec.elapsed>er.elapsed);
check('native exchange has no public consent or recruitment',!ec.voice.leth.publicConsent && !ec.voice.leth.recruited);
check('native exchange defense is represented by actual shots and casualties',ec.stats.shots===28 && ec.campaign.privateNeutralized===2 && ec.enemies.filter(e=>!e.dead).length===1);
check('native exchange has not already operated emitter or transmitted report',!ec.voice.emitter.seized&&!ec.voice.emitter.restored&&!ec.voice.report.transmitted&&!ec.decision.resolved);

const choice = document(native + 'emitter-choice.json', true);
const restored = document(native + 'emitter-restored.json', true);
const beforeExtraction = document(native + 'before-extraction.json', true);
const completed = document(native + 'completed-native.json', true);
const completedReloaded = document(native + 'completed-reloaded.json', true);
const cs=choice.document.checkpoint,rs=restored.document.checkpoint,bs=beforeExtraction.document.checkpoint;
const final=completed.document,finalReload=completedReloaded.document,finalReport=final.completed.MI11;
for (const [name,item] of [['choice',choice],['restored',restored],['before extraction',beforeExtraction]]) {
  unchangedOfficial(`native ${name}`,exchangeSource.document,item.document);
  check(`native ${name}: ten historical reports retained`,same(item.document.completed,baseline10.document.completed) && Object.keys(item.document.completed).length===10);
  check(`native ${name}: actual native testimony and copies retained`,item.document.checkpoint.voice.leth.testimonyAt===ec.voice.leth.testimonyAt && item.document.checkpoint.campaign.te01Acquired && item.document.checkpoint.campaign.warningCopied && item.document.checkpoint.campaign.translationCopied);
}
check('native scenario is WK09 Normal with assistance enabled',cs.walkerId==='WK09'&&cs.difficultyId==='normal'&&cs.assist===true);
check('native decision selects restoration without performing it',cs.decision.resolved&&cs.decision.choice==='defy'&&cs.campaign.plan==='restore'&&!cs.voice.emitter.restored&&!cs.voice.emitter.seized&&cs.voice.emitter.restoredAt===null&&!cs.campaign.operationsResolved);
check('native pre-decision snapshot is unresolved and has no restoration',choice.document.preDecisionCheckpoint.decision.active&&!choice.document.preDecisionCheckpoint.decision.resolved&&!choice.document.preDecisionCheckpoint.voice.emitter.restored);
check('native emitter operation has its own later start and completion',rs.voice.emitter.work==='restore'&&rs.voice.emitter.restored&&rs.voice.emitter.progress===1&&!rs.voice.emitter.working&&rs.voice.emitter.startedAt>cs.elapsed&&rs.voice.emitter.restoredAt===rs.voice.emitter.completedAt&&rs.voice.emitter.completedAt>rs.voice.emitter.startedAt);
check('native emitter operation restores the channel without capture or report',rs.campaign.emitterOnline&&rs.campaign.operationsResolved&&!rs.campaign.emitterSeized&&!rs.voice.report.transmitted&&!rs.extraction.active);
check('native report is a subsequent completed operation',bs.voice.report.transmitted&&bs.voice.report.progress===1&&!bs.voice.report.working&&bs.voice.report.startedAt>rs.elapsed&&bs.voice.report.completedAt===bs.voice.report.transmittedAt&&bs.voice.report.completedAt>bs.voice.report.startedAt);
check('native report unlocks extraction while player is still outside its radius',bs.status==='playing'&&bs.campaign.phase==='extraction'&&bs.extraction.active&&Math.abs(bs.player.x-bs.extraction.x)>bs.extraction.radius);
check('native physical route has advanced actual step count',rs.stats.steps>cs.stats.steps&&bs.stats.steps>rs.stats.steps);
check('native physical chronology is ordered through the final receipt',ec.elapsed<cs.elapsed&&cs.elapsed<rs.voice.emitter.startedAt&&rs.voice.emitter.completedAt<bs.voice.report.startedAt&&bs.voice.report.completedAt<=bs.elapsed&&bs.elapsed<finalReport.elapsed);
check('native final state closes mission and adds the eleventh report',final.stage==='complete'&&final.checkpoint===null&&final.activeMissionId===null&&Object.keys(final.completed).length===11&&finalReport.missionId==='MI11');
for(const [id,report] of Object.entries(baseline10.document.completed)) check(`native final receipt preserves historical ${id}`,same(final.completed[id],report));
check('native completion grants four lots exactly once',final.resources.parts===50&&final.resources.parts-beforeExtraction.document.resources.parts===4&&finalReport.partsGranted===4&&final.resources.fuel===beforeExtraction.document.resources.fuel);
check('native completion and reload exports are exactly identical bytes',completed.raw.equals(completedReloaded.raw));
check('native completed export has received expected fingerprint',completed.bytes===118188&&completed.sha256==='02b4f04765e73d2319259aa1639aaa896b182b5e94ceee0dd90812608f185c11');
check('native reload keeps all eleven reports and fifty lots',same(final,finalReload)&&Object.keys(finalReload.completed).length===11&&finalReload.resources.parts===50);
check('native last debrief is the actual final receipt',same(final.lastDebrief,finalReport));
check('native pre-decision checkpoint is preserved through completion and reload',same(choice.document.preDecisionCheckpoint,final.preDecisionCheckpoint)&&same(final.preDecisionCheckpoint,finalReload.preDecisionCheckpoint));
check('native final Thyr voice dossier matches the final receipt',Object.entries(final.world.thyr.voice).every(([k,v])=>same(v,finalReport[k])));
const historicalWorld = structuredClone(final.world); delete historicalWorld.thyr.voice;
check('native completion preserves all older world domains',same(historicalWorld,baseline10.document.world));
check('native final receipt preserves TE01 and living available Leth',finalReport.te01Acquired&&finalReport.testimonyRecorded&&finalReport.lethAlive&&finalReport.witnessAvailable&&finalReport.roster.leth.testimonyAt===ec.voice.leth.testimonyAt);
check('native final receipt gives no public consent or recruitment',!finalReport.publicConsent&&!finalReport.recruited&&finalReport.roster.leth.publicConsent===false&&finalReport.roster.leth.recruited===false);
check('native final receipt preserves all three nesting sites',finalReport.nestsIntact===3&&finalReport.nestsDamaged===0&&finalReport.nestsLost===0&&finalReport.roster.nests.every(n=>n.hp===120&&n.maxHp===120&&!n.destroyed&&n.damagedAt===null));
check('native final receipt retains the actual restoration and report',finalReport.emitterRestored&&finalReport.emitterOnline&&!finalReport.emitterSeized&&finalReport.reportTransmitted&&same(finalReport.roster.emitter,bs.voice.emitter)&&same(finalReport.roster.report,bs.voice.report));
check('native final accounting is 36 shots with 11 inherited and 25 added',bs.stats.shots===36&&finalReport.roster.noise.observedShots===36&&exchangeSource.document.checkpoint.stats.shots===11&&bs.stats.shots-exchangeSource.document.checkpoint.stats.shots===25);
check('native final accounting is three neutralized forces with one inherited and two added',finalReport.privateNeutralized===3&&finalReport.kills===3&&finalReport.roster.privateForces.length===3&&finalReport.roster.privateForces.every(e=>e.dead&&e.hp===0)&&exchangeSource.document.checkpoint.campaign.privateNeutralized===1);
const linkedEvidence = fs.readdirSync(path.join(root,native)).filter(name=>name.endsWith('-ax.txt')||name.endsWith('.png')||name==='ui-observation-times.json').sort();
for(const name of linkedEvidence) read(native+name);
const observationTimes=JSON.parse(read(native+'ui-observation-times.json').raw.toString('utf8'));
check('native observation timestamps are valid and chronological',observationTimes.every((v,i)=>Number.isFinite(Date.parse(v.observedAt))&&(i===0||Date.parse(v.observedAt)>=Date.parse(observationTimes[i-1].observedAt))));
const resultAx=read(native+'mission-result-after-control-timeout-ax.txt').raw.toString('utf8');
const menuAx=read(native+'completed-native-reloaded-ax.txt').raw.toString('utf8');
const archiveAx=read(native+'journal-mi11-expanded-received-ax.txt').raw.toString('utf8');
check('received native result shows actual five-minute-forty-seven-second completion and TE01',resultAx.includes('05:47')&&resultAx.includes('Émetteur remis en service.')&&resultAx.includes('TÉMOIGNAGE TE01')&&Math.floor(finalReport.elapsed)===347);
check('received native reload menu shows eleven of eleven classified reports',menuAx.includes('11 / 11 RAPPORTS CLASSÉS'));
check('received native archive contains all three French source comparisons',VOICE_TRANSLATION_PAIRS.length===3&&VOICE_TRANSLATION_PAIRS.every(p=>archiveAx.includes(p.imperial)&&archiveAx.includes(p.leth)));
check('received native archive retains private permission and limits',archiveAx.includes('Cette permission ne couvre aucune diffusion publique.')&&archiveAx.includes('Aucun recrutement, aucune alliance militaire et aucune autorisation publique'));
const inputsUnchanged = [...seen.values()].every(item=>sha(fs.readFileSync(item.absolutePath))===item.sha256);
check('all received inputs and historical record remain byte-identical during verification',inputsUnchanged);
const receipt = {
  schema:'imperium-march-v12-native-export-reconciliation-1', observedAt:new Date().toISOString(),
  release:'0.12', publicCommit:'e59dc2c51c68ec151cbc75a37a033c2650d3b95b', publicTree:'dda2a0df55f6fa7b48c0fbc9b43e5581fa9495b8',
  method:'Read-only reconciliation of exports received from the separate actual production Chrome/Sky session; existing parseCampaign/serializeCampaign and pure voiceDerivedFacts only.',
  scope:{nativeBrowserControlledByThisVerifier:false,simulationAdvanced:false,engineTestsAdded:false,applicationCodeWritten:false,receivedExportsWritten:false,repositoryInputsReadOnly:true,outputArtifactOnly:true,initialBrowserReceptionOverwritten:false,humanPlaytest:false,inputsUnchanged},
  complete:true, allReceivedChecksPassed:checks.every(c=>c.pass), counts:{checks:checks.length,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length},
  pending:[],
  coverage:{nativeScenario:{walker:'WK09',difficulty:'normal',assist:true,choice:'defy',plan:'restore'},fullMissionFromStartPlayedNatively:false,allChassisPlayedNatively:false,bothChoicesPlayedNatively:false,humanPlaytest:false},
  migrations,
  rejectedPreparation:{source:'tests/fixtures/campaign-v10-mi10.json',validatorResult:refusal,
    operatorReported:'The first file selected was the fixture wrapper, not a player export. The production UI rejected it as format inconnu; the operator then imported the raw historical export.',
    evidenceLimit:'The retained accessibility snapshot shows the unchanged nine-report menu but does not retain the transient error toast. This preparation error is not counted as an application bug or a successful migration.'},
  nativeListening:{preparedSource:listeningSource.path,interrupted:summary(interrupted.document),completed:summary(listened.document),
    operatorReported:'Native Sky hold Space 2000 ms then Space+e 6000 ms completed the first reading. Earlier short presses and tab pressKey attempts did not establish the necessary hold.',
    evidenceLimit:'JSON confirms data and chronology; native input actions are documented separately by the operator and linked captures.'},
  nativeExchange:{preparedSource:exchangeSource.path,preparedProgress:exchangeSource.document.checkpoint.voice.leth.progress,
    paused:summary(paused.document),reloaded:summary(reloaded.document),pauseReloadExactBytes:false,pauseReloadDifferences:reloadDiff,
    wholeCheckpointIdentical:same(ep,er),completed:summary(exchanged.document),
    defenseAccounting:{shotsAlreadyInPreparedCheckpoint:exchangeSource.document.checkpoint.stats.shots,
      totalShotsAtNativeCompletion:ec.stats.shots,shotsAddedAfterNativeReload:ec.stats.shots-er.stats.shots,
      privateNeutralizedAlreadyPrepared:exchangeSource.document.checkpoint.campaign.privateNeutralized,
      totalPrivateNeutralizedAtNativeCompletion:ec.campaign.privateNeutralized,
      additionalPrivateNeutralizedAfterReload:ec.campaign.privateNeutralized-er.campaign.privateNeutralized}},
  nativeRouteScope:{listeningPreparedCheckpointImported:true,exchangePreparedCheckpointImported:true,
    decisionPreparedCheckpointImported:false,extractionPreparedCheckpointImported:false,
    operatorReported:'After importing the 45-percent exchange checkpoint, the operator continued that actual native state through exchange completion, decision, emitter intervention, report and physical extraction. No decision or extraction checkpoint was imported.'},
  nativeCompletion:{choice:summary(choice.document),restored:summary(restored.document),beforeExtraction:summary(beforeExtraction.document),
    final:summary(final),reloaded:summary(finalReload),finalReport:Object.fromEntries(Object.entries(finalReport).filter(([k])=>k!=='roster')),
    finalExportsExactlyEqual:completed.raw.equals(completedReloaded.raw),finalExportSha256:completed.sha256,
    officialResourceDelta:{parts:final.resources.parts-beforeExtraction.document.resources.parts,fuel:final.resources.fuel-beforeExtraction.document.resources.fuel},
    actualWork:{emitter:{startedAt:rs.voice.emitter.startedAt,completedAt:rs.voice.emitter.completedAt,stampDeltaSeconds:rs.voice.emitter.completedAt-rs.voice.emitter.startedAt},
      report:{startedAt:bs.voice.report.startedAt,completedAt:bs.voice.report.completedAt,stampDeltaSeconds:bs.voice.report.completedAt-bs.voice.report.startedAt}},
    extraction:{beforePlayerX:bs.player.x,exitX:bs.extraction.x,radius:bs.extraction.radius,beforeStatus:bs.status,beforeElapsed:bs.elapsed,
      finalReceiptElapsed:finalReport.elapsed,finalStage:final.stage,finalPlayerPositionStored:false,
      evidenceLimit:'The official completed export does not retain the final player coordinates. The received before-extraction scene is still playing and outside the exit radius; the later completed receipt and native result capture corroborate the operator-observed physical extraction.'},
    defenseAccounting:{preparedShots:exchangeSource.document.checkpoint.stats.shots,totalShots:bs.stats.shots,nativeAdditionalShots:bs.stats.shots-exchangeSource.document.checkpoint.stats.shots,
      preparedNeutralized:exchangeSource.document.checkpoint.campaign.privateNeutralized,totalNeutralized:finalReport.privateNeutralized,nativeAdditionalNeutralized:finalReport.privateNeutralized-exchangeSource.document.checkpoint.campaign.privateNeutralized}},
  nativeEvidence:{observationTimesPath:native+'ui-observation-times.json',firstRecordedAt:observationTimes[0].observedAt,lastRecordedAt:observationTimes.at(-1).observedAt,
    recordedTimestamps:observationTimes.length,accessibilitySnapshots:linkedEvidence.filter(n=>n.endsWith('-ax.txt')).length,screenshots:linkedEvidence.filter(n=>n.endsWith('.png')).length,
    screenImagesHashedNotVisuallyReplayedByVerifier:true,archiveFrenchPairsMatched:VOICE_TRANSLATION_PAIRS.map(p=>p.id)},
  checks,
  inputs:[...seen.values()].map(({path,absolutePath,bytes,sha256})=>({path,absolutePath,bytes,sha256})),
  script:{path:process.argv[1],portableEvidencePath:native+'verify-production-exports.mjs',sha256:sha(fs.readFileSync(process.argv[1]))}
};
const receiptBytes=Buffer.from(JSON.stringify(receipt,null,2)+'\n');
if(output) {
  fs.writeFileSync(output,receiptBytes);
  console.log(JSON.stringify({receipt:output,bytes:receiptBytes.length,sha256:sha(receiptBytes),counts:receipt.counts,complete:receipt.complete,inputsUnchanged,failed:checks.filter(c=>!c.pass)},null,2));
} else process.stdout.write(receiptBytes);
if (!receipt.allReceivedChecksPassed) process.exitCode=1;
