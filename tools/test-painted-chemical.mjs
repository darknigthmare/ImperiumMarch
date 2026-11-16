/** Original PNG decoding and MI10 public-input Canvas reception, not a browser. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHEMICAL_ASSET_SPECS } from '../src/chemical-assets.mjs';
import { PAINTED_CHEMICAL_LAYOUT } from '../src/painted-chemical-layout.mjs';
import { clearPaintedChemical, loadPaintedChemical, paintedChemicalStatus, drawPaintedChemicalAsset } from '../src/painted-chemical.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedThyr } from '../src/painted-thyr.mjs';
import { createGame, chemicalSurfaceAt, terrainAt } from '../src/simulation.mjs';
import { drawChemicalSite } from '../src/chemical-renderer.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI10 } from '../tests/helpers/mi10-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-chemical-qa');
const require = createRequire(import.meta.url); let api;
try { api = require('@napi-rs/canvas'); }
catch(cause) { if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('PNG reception requires @napi-rs/canvas', { cause }); api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, loadImage } = api, sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = ['src/painted-chemical.mjs', 'src/painted-chemical-layout.mjs', 'src/chemical-renderer.mjs', 'src/chemical-simulation.mjs',
  'src/chemical-assets.mjs', 'src/renderer.mjs', 'src/painted-thyr.mjs', 'tools/index-painted-chemical.py', 'tests/helpers/mi10-driver.mjs', 'tools/test-painted-chemical.mjs'];
const report = { version: '0.15.6', createdUtc: new Date().toISOString(), type: 'Original PNG decoding, 24-state diagnostic board and MI10 public-input Canvas scenes',
  completed: false, nativeBrowserExecuted: false, humanPlaytestPerformed: false, atlases: [], frames: [], views: [],
  sourceHashes: Object.fromEntries(sources.map(p => [p, sha(readFileSync(resolve(root, p)))])),
  limitations: ['Canvas/Skia reception, not browser interaction or human playtest.', 'The state board is a diagnostic presentation; mission scenes are reached by the unchanged public-input pilot.',
    'Five selected original generated PNGs are unchanged. Three blank grid cells are not sprites.', 'Artwork does not add fluid mass, population, evidence or physical surfaces. Work bars and canal cover geometry remain procedural.'] };
mkdirSync(output, { recursive: true });
const save = (canvas, file, detail = {}) => { const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), bytes); report.views.push({ file, size: [canvas.width, canvas.height], sha256: sha(bytes), ...detail }); };
try {
  const manifest = JSON.parse(readFileSync(resolve(root, 'assets/painted/chemical/manifest.json')));
  clearPaintedChemical();
  await loadPaintedChemical({ loadImage: async (url, key) => {
    const path = fileURLToPath(url), bytes = readFileSync(path), im = await loadImage(path), atlas = PAINTED_CHEMICAL_LAYOUT[key];
    assert.equal(sha(bytes), manifest.files.find(x => x.id === key).sha256);
    const canvas = createCanvas(im.width, im.height), c = canvas.getContext('2d'); c.drawImage(im, 0, 0);
    const pixels = c.getImageData(0, 0, im.width, im.height).data;
    const alpha = (x, y) => pixels[(y*im.width+x)*4+3];
    let transparent = 0, solid = 0; for (let i=3;i<pixels.length;i+=4) { if (!pixels[i]) transparent++; if (pixels[i] >= 230) solid++; }
    assert.ok(transparent/(im.width*im.height) > .4 && solid > 1000, `${key}: transparent original`);
    for (const [name, frame] of Object.entries(atlas.frames)) {
      const [x,y,w,h] = frame.cell;
      for (let dx=0;dx<w;dx++) for (const dy of [0,1,h-2,h-1]) assert.ok(alpha(x+dx,y+dy) <= 2, `${key}/${name}: transparent horizontal gutter`);
      for (let dy=0;dy<h;dy++) for (const dx of [0,1,w-2,w-1]) assert.ok(alpha(x+dx,y+dy) <= 2, `${key}/${name}: transparent vertical gutter`);
      assert.ok(frame.target.every(Number.isFinite)); assert.deepEqual(frame.anchors.ground, [0,0]);
      report.frames.push({ atlas:key, frame:name, part:frame.part, state:frame.state, source:frame.source, target:frame.target });
    }
    for (const index of atlas.emptyCells) {
      const x0=Math.floor(index%atlas.grid[0]*im.width/atlas.grid[0]+.5),x1=Math.floor((index%atlas.grid[0]+1)*im.width/atlas.grid[0]+.5);
      const y0=Math.floor(Math.floor(index/atlas.grid[0])*im.height/atlas.grid[1]+.5),y1=Math.floor((Math.floor(index/atlas.grid[0])+1)*im.height/atlas.grid[1]+.5);
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)assert.ok(alpha(x,y)<=2,`${key}: reserved empty cell`);
    }
    report.atlases.push({ id:key, sha256:sha(bytes), bytes:bytes.length, dimensions:[im.width,im.height], transparentFraction:transparent/(im.width*im.height) });
    return im;
  } });
  assert.ok(Object.values(paintedChemicalStatus()).every(x => x.state === 'ready')); assert.equal(report.frames.length,24);

  const board=createCanvas(2400,1860), c=board.getContext('2d'); c.fillStyle='#20373b';c.fillRect(0,0,board.width,board.height);
  c.fillStyle='#e4dcc0';c.font='bold 28px sans-serif';c.fillText('MI10 / INSTALLATIONS CHIMIQUES — 24 ÉTATS PEINTS',32,43);
  Object.entries(CHEMICAL_ASSET_SPECS).forEach(([part,spec],row)=>{
    const top=70+row*295;c.fillStyle='#c5cdb1';c.font='18px sans-serif';c.fillText(part,32,top+19);
    spec.states.forEach((state,column)=>{
      const x=255+column*460,y=top+264;c.strokeStyle='#78928b';c.lineWidth=1;c.beginPath();c.moveTo(x-155,y);c.lineTo(x+155,y);c.stroke();
      assert.equal(drawPaintedChemicalAsset(c,{part,state,x,y,scale:1.15}),true);
      c.fillStyle='#ded9c0';c.font='17px sans-serif';c.textAlign='center';c.fillText(state,x,top+35);c.textAlign='left';
    });
  });
  save(board,'chemical-state-board.png',{diagnostic:true,states:24});

  const coverBoard=createCanvas(1600,900),bc=coverBoard.getContext('2d');bc.fillStyle='#20373b';bc.fillRect(0,0,1600,900);
  const coverCases=[['Couvert / eau sous le seuil',true,false,false],['Couvert / contamination conservée',true,true,false],['Ouvert / contaminé',false,true,false],['Couverture perdue / canal détruit',true,true,true]];
  coverCases.forEach(([title,covered,polluted,destroyed],index)=>{
    const state=createGame({missionId:'MI10',walkerId:'WK09',seed:156}),canal=state.chemical.canals[0];
    canal.covered=covered;canal.contamination=polluted?state.mission.chemical.contaminationLimit+5:0;canal.destroyed=destroyed;
    const before=JSON.stringify(state),x=400+(index%2)*800,y=345+Math.floor(index/2)*430;
    bc.fillStyle='#e6ddc0';bc.font='22px sans-serif';bc.textAlign='center';bc.fillText(title,x,y-245);
    bc.save();bc.translate(x-canal.x*1.5,y-terrainAt(canal.x,state.planetId)*1.5);bc.scale(1.5,1.5);
    drawChemicalSite({ctx:bc,visible:worldX=>Math.abs(worldX-canal.x)<210,cameraX:canal.x-400},state,0);bc.restore();
    assert.equal(JSON.stringify(state),before);assert.equal(chemicalSurfaceAt(state,canal.x).rise,covered&&!destroyed?10:0);
  });
  save(coverBoard,'chemical-canal-combinations.png',{diagnostic:true,cases:coverCases.map(x=>x[0]),scope:'Explicit diagnostic copies: covered and contaminated remain independent; destroyed cover creates no support.'});

  const s=createGame({missionId:'MI10',walkerId:'WK09',seed:156}),scenes=new Map([['arrival',structuredClone(s)]]);
  pilotMI10(s,{choice:'defy',observe:state=>{
    const d=state.chemical;
    for(const [name,condition]of[
      ['collector-closed',d.collector.closed&&state.player.x<1000],
      ['tank-marks',d.tanks.every(t=>t.identified)&&!d.leak.contained],
      ['sampler-working',d.sampler.working&&d.sampler.progress>.35&&d.alert.ready],
      ['sample-conserved',d.sampler.collected&&d.record.copied],
      ['canal-covering',d.canals.some(canal=>canal.working&&canal.progress>.45)],
      ['canal-real-contacts',state.player.feet.some(foot=>foot.contact&&chemicalSurfaceAt(state,foot.x).rise===10)],
      ['water-restored',d.water.resolved],
    ])if(condition&&!scenes.has(name))scenes.set(name,structuredClone(state));
  }});
  assert.equal(s.status,'won');assert.equal(s.campaign.pt02Acquired,true);assert.equal(scenes.size,8);
  report.publicInputMission={mission:'MI10',walker:'WK09',choice:'defy',status:s.status,elapsed:s.elapsed,capturedScenes:scenes.size,
    pt02Acquired:s.campaign.pt02Acquired,sampleCollected:s.campaign.sampleCollected,canalsCovered:s.campaign.canalsCovered,homesHabitable:s.campaign.homesHabitable};
  const loss=createGame({missionId:'MI10',walkerId:'WK09',seed:156});
  pilotMI10(loss,{choice:'defy',destroyOriginalsAfterSample:true,stopAt:state=>state.chemical.sampler.destroyed&&state.chemical.record.destroyed&&state.chemical.tanks[2].destroyed});
  assert.ok(loss.chemical.sampler.destroyed&&loss.chemical.record.destroyed&&loss.chemical.tanks[2].destroyed);
  assert.equal(loss.campaign.pt02Acquired,true); scenes.set('originals-lost-copy-conserved',structuredClone(loss));
  report.publicLossObservation={status:loss.status,elapsed:loss.elapsed,pt02Acquired:loss.campaign.pt02Acquired,missionCompleted:false};

  const imageLoader=url=>loadImage(fileURLToPath(url));
  await Promise.all([loadPaintedWalkers({loadImage:imageLoader}),loadPaintedCombat({loadImage:imageLoader}),loadPaintedThyr({loadImage:imageLoader})]);
  const oldImage=globalThis.Image,oldWindow=globalThis.window;globalThis.Image=class{};globalThis.window={devicePixelRatio:1};
  try {
    for(const [name,state]of scenes){
      const before=JSON.stringify(state),canvas=createCanvas(1600,900),renderer=new Renderer(canvas);
      renderer.render(state,{reducedMotion:true,shake:false});assert.equal(JSON.stringify(state),before,`${name}: renderer changed simulation`);
      save(canvas,`mi10-${name}.png`,{diagnostic:false,preparation:'Unchanged public commandGame/updateGame pilot',mission:'MI10',elapsed:state.elapsed,stateSha256:sha(before)});
      writeFileSync(resolve(output,`mi10-${name}.state.json`),before+'\n');
    }
  } finally {globalThis.Image=oldImage;globalThis.window=oldWindow;}
  report.completed=true;writeFileSync(resolve(output,'receipt.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Painted chemical reception: ${report.atlases.length} PNGs / ${report.frames.length} states / ${report.views.length} views; MI10 defy won at ${s.elapsed.toFixed(3)} s`);
} catch(error) {report.error=String(error?.stack||error);writeFileSync(resolve(output,'receipt.json'),JSON.stringify(report,null,2)+'\n');throw error;}
