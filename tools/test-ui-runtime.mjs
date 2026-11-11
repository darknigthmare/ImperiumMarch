/**
 * Execute the delivered script and its real event handlers in a small DOM model.
 * This is NOT a browser. It does not validate CSS, native dialog focus, audio,
 * touch hardware, downloads, or browser localStorage. Canvas calls are no-ops.
 * The suite covers UI/state/save wiring when Chromium cannot start.
 * Run after npm run build; no dependencies, server, network or state injection.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beginCampaignMission, checkpointCampaign, finishCampaignMission, createCampaign, serializeCampaign, parseCampaign, CAMPAIGN_SAVE_KEY } from '../src/campaign.mjs';
import { commandGame, updateGame } from '../src/simulation.mjs';
import { pilotMI02 } from '../tests/helpers/mi02-driver.mjs';
import { pilotMI03 } from '../tests/helpers/mi03-driver.mjs';
import { pilotMI04 } from '../tests/helpers/mi04-driver.mjs';
import { pilotMI05 } from '../tests/helpers/mi05-driver.mjs';
import { pilotMI06 } from '../tests/helpers/mi06-driver.mjs';
import { pilotMI07 } from '../tests/helpers/mi07-driver.mjs';
import { WALKERS } from '../src/content.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'dist/Ordre_de_Cendre.html'), 'utf8');
const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const markup = source.replace(/<style>[\s\S]*?<\/style>|<script>[\s\S]*?<\/script>/g, '');
const compiled = new Script(script, { filename: 'Ordre_de_Cendre.delivered.js' });
const normalized = value => JSON.parse(JSON.stringify(value));

function harness(values = new Map(), { denyWrites = false } = {}) {
  const nodes = new Set(), ids = new Map(), errors = [], raf = [];
  let time = 0, document;
  class Events {
    constructor() { this.handlers = new Map(); }
    addEventListener(type, handler) { if (!this.handlers.has(type)) this.handlers.set(type, []); this.handlers.get(type).push(handler); }
    async dispatch(type, detail = {}) {
      const event = { target: this, preventDefault() {}, ...detail };
      for (const handler of this.handlers.get(type) || []) await handler(event);
    }
  }
  const ctx2d = new Proxy({}, { get(target, key) {
    if (key in target) return target[key];
    if (key === 'measureText') return text => ({ width: String(text).length * 7 });
    if (String(key).startsWith('create')) return () => ({ addColorStop() {} });
    return () => {};
  }, set(target, key, value) { target[key] = value; return true; } });
  class Element extends Events {
    constructor(tag, attributes = {}) {
      super(); this.tagName = tag.toUpperCase(); this.attributes = { ...attributes }; this.style = {}; this.dataset = {};
      this.hidden = Object.hasOwn(attributes, 'hidden'); this.disabled = Object.hasOwn(attributes, 'disabled');
      this.checked = Object.hasOwn(attributes, 'checked'); this.value = attributes.value || ''; this.open = false;
      this.width = 1600; this.height = 900; this.children = []; this._html = ''; this.textContent = '';
      const classes = new Set((attributes.class || '').split(' ').filter(Boolean));
      this.classList = { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name), toggle(name, force) { const add = force === undefined ? !classes.has(name) : force; if (add) classes.add(name); else classes.delete(name); return add; } };
      for (const [key, value] of Object.entries(attributes)) if (key.startsWith('data-')) this.dataset[key.slice(5)] = value;
      nodes.add(this); if (attributes.id) ids.set(attributes.id, this);
    }
    get innerHTML() { return this._html; }
    set innerHTML(value) { this.children.forEach(node => node.remove()); this._html = String(value); this.children = parse(this._html); }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    getContext() { return ctx2d; }
    getBoundingClientRect() { return { x: 0, y: 0, left: 0, top: 0, width: 1600, height: 900 }; }
    setPointerCapture() {}
    focus() { document.activeElement = this; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    append(node) { this.children.push(node); }
    remove() { nodes.delete(this); this.children.forEach(node => node.remove()); }
    async click() { if (!this.disabled) await this.dispatch('click'); }
  }
  function parse(html) {
    return [...html.matchAll(/<([a-z][a-z0-9-]*)(\s[^<>]*?)?\/?\s*>/gi)].map(match => {
      const attrs = {};
      for (const item of (match[2] || '').matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[item[1]] = item[2] ?? item[3] ?? item[4] ?? '';
      return new Element(match[1], attrs);
    });
  }
  function select(selector) {
    return [...nodes].filter(node => {
      if (selector.startsWith('#')) return node.attributes.id === selector.slice(1);
      if (selector.startsWith('.')) return node.classList.contains(selector.slice(1));
      const match = selector.match(/^([\w-]*)?(?:\[([\w-]+)(?:="?([^"\]]+)"?)?\])?$/);
      if (!match) return false;
      if (match[1] && node.tagName.toLowerCase() !== match[1]) return false;
      if (match[2] === 'open') return node.open;
      if (match[2] && !Object.hasOwn(node.attributes, match[2])) return false;
      if (match[3] !== undefined && node.attributes[match[2]] !== match[3]) return false;
      return true;
    });
  }
  document = Object.assign(new Events(), { hidden: false, getElementById: id => ids.get(id), querySelectorAll: select, querySelector: selector => select(selector)[0] || null, createElement: tag => new Element(tag) });
  parse(markup); document.body = select('body')[0]; document.documentElement = select('html')[0]; document.activeElement = document.body;
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => { if (denyWrites) throw new Error('quota'); values.set(key, value); } };
  const window = Object.assign(new Events(), { devicePixelRatio: 1, localStorage: storage, scrollTo() {} });
  const context = createContext({ window, document, localStorage: storage, Image: class { set src(_) {} },
    matchMedia: () => ({ matches: false }), location: { search: '?test=1' }, requestAnimationFrame: callback => raf.push(callback),
    setTimeout: () => 1, clearTimeout() {}, URLSearchParams, URL, Blob, structuredClone,
    console: { error: (...args) => errors.push(args.map(String).join(' ')), log() {}, warn() {} } });
  compiled.runInContext(context);
  const api = {
    ids, values, errors, window, document,
    snapshot: () => normalized(window.__IMPERIUM_TEST__.snapshot()),
    click: id => { assert.ok(ids.has(id), `missing UI element ${id}`); return ids.get(id).click(); },
    data: async (key, value) => { const node = select(`[data-${key}]`).find(item => item.dataset[key] === value); assert.ok(node, `missing ${key}=${value}`); await node.click(); },
    key: (code, down = true) => window.dispatch(down ? 'keydown' : 'keyup', { code, repeat: false }),
    frames(count) { for (let i = 0; i < count; i++) { const callback = raf.shift(); assert.ok(callback); time += 1000 / 60; callback(time); } assert.deepEqual(errors, [], 'application runtime error'); },
  };
  return api;
}

function nearDecisionDossier() {
  let { campaign, game: s } = beginCampaignMission(createCampaign(), { walkerId: 'WK01', difficulty: 'normal' });
  for (let frame = 0; frame < 20000 && !s.decision.active && s.status === 'playing'; frame++) {
    const p = s.player;
    const target = s.enemies.filter(e => !e.dead && e.active && Math.abs(e.x - p.x) < 1050).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    let move = Math.abs(s.evidence.x - p.x) > 35 ? Math.sign(s.evidence.x - p.x) : 0;
    if (target && Math.abs(target.x - p.x) < 680) move = 0;
    if (p.x > s.convoy.x + 360 && move > 0 && !s.convoy.arrived) move = 0;
    if (s.campaign.filtersDelivered && Math.abs(p.x - s.evidence.x) < 190) {
      if (!s.evidence.scanning) commandGame(s, 'interact');
      move = 0;
    }
    const vent = p.heat > 75 || p.overheated;
    updateGame(s, 1 / 60, { move, brace: !move, vent, fire: Boolean(target) && !vent, secondary: Boolean(target) && !vent && target.hp > 160, aimX: target?.x, aimY: target?.y });
  }
  assert.equal(s.decision.active, true, 'fixture reached decision through public controls');
  return checkpointCampaign(campaign, s, { beforeDecision: true });
}

let checks = 0;
const flowFilter = process.env.IMPERIUM_UI_FILTER ? new RegExp(process.env.IMPERIUM_UI_FILTER) : null;
async function check(name, fn) { if (flowFilter && !flowFilter.test(name)) return; await fn(); checks++; console.log(`PASS ${name}`); }

await check('cold start, five views, six selectable chassis and independent simulation launch', async () => {
  const h = harness(); assert.equal(h.snapshot().view, 'campaign'); assert.equal(h.ids.get('menu').hidden, false);
  for (const view of ['hangar', 'archives', 'settings', 'operations', 'campaign']) { await h.data('view', view); assert.equal(h.snapshot().view, view); h.frames(1); }
  await h.data('view', 'hangar');
  for (const walker of WALKERS) {
    await h.data('walker', walker.id); h.frames(1);
    assert.equal(h.snapshot().settings.walkerId, walker.id);
    assert.match(h.ids.get('rig-class').textContent, new RegExp(`${walker.legs} APPUIS`));
    assert.match(h.ids.get('rig-strength').textContent, /en réserve/);
  }
  await h.data('walker', 'WK09'); await h.click('confirm-rig');
  assert.equal(h.snapshot().settings.walkerId, 'WK09');
  await h.data('view', 'operations'); await h.data('mission', 'op02'); await h.click('deploy'); await h.click('launch');
  assert.equal(h.snapshot().game.missionId, 'op02'); assert.equal(h.snapshot().game.player.feet.length, 6); h.frames(2);
});

await check('pause writes an exact campaign checkpoint; a new script context resumes it', async () => {
  const h = harness(); await h.click('campaign-deploy'); await h.click('launch'); await h.key('KeyD'); h.frames(180); await h.key('KeyD', false);
  await h.click('pause-button'); const stopped = h.snapshot(); h.frames(30); assert.equal(h.snapshot().game.elapsed, stopped.game.elapsed);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.deepEqual(fresh.snapshot().game, stopped.game); assert.equal(fresh.snapshot().activeMode, 'campaign');
  await fresh.key('KeyD'); fresh.frames(10); assert.ok(fresh.snapshot().game.elapsed > stopped.game.elapsed);
});

await check('switching to a simulation preserves the campaign and its resume button', async () => {
  const h = harness(); await h.click('campaign-deploy'); await h.click('launch'); await h.key('KeyD'); h.frames(90); await h.click('pause-button'); await h.click('to-menu');
  const checkpoint = h.snapshot().campaign.checkpoint;
  await h.data('view', 'operations'); await h.click('deploy'); await h.click('launch'); h.frames(3); await h.click('pause-button'); await h.click('to-menu');
  await h.data('view', 'campaign'); await h.click('campaign-resume'); assert.deepEqual(h.snapshot().game, checkpoint);
});

await check('decision, debrief, pipe repair and replay leave one official dossier', async () => {
  const values = new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(nearDecisionDossier())]]), h = harness(values);
  await h.click('campaign-resume'); h.frames(2); assert.equal(h.ids.get('decision-dialog').open, true);
  await h.data('choice', 'defy'); await h.key('KeyD');
  for (let i = 0; i < 1000 && h.snapshot().game.status === 'playing'; i++) h.frames(1);
  await h.key('KeyD', false); assert.equal(h.snapshot().game.status, 'won'); assert.equal(h.ids.get('result-dialog').open, true);
  assert.equal(h.snapshot().campaign.resources.parts, 10); assert.equal(h.snapshot().campaign.completed.MI01.noticeFiled, true);
  await h.click('next-operation'); assert.equal(h.snapshot().view, 'hangar'); await h.click('campaign-repair-pipe');
  assert.equal(h.snapshot().campaign.resources.parts, 8); assert.equal(h.snapshot().campaign.world.vesper.pipeRepaired, true);
  const receipt = h.snapshot().campaign.completed.MI01;
  await h.data('view', 'campaign'); await h.data('chapter', 'MI01'); await h.click('campaign-deploy'); await h.click('launch'); h.frames(5);
  assert.equal(h.snapshot().campaignReplay, true); assert.deepEqual(h.snapshot().campaign.completed.MI01, receipt);
  assert.equal(parseCampaign(values.get(CAMPAIGN_SAVE_KEY)).resources.parts, 8);
});

const legacyDossier = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/campaign-v1-mi01.json'), 'utf8'));

await check('MI02 is locked initially; a real v1 MI01 dossier unlocks it and resumes its own train', async () => {
  const locked = harness(); await locked.data('chapter', 'MI02');
  assert.equal(locked.ids.get('campaign-order-title').textContent, 'Le couloir quarante-deux');
  const original = JSON.stringify(legacyDossier.completed);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, original]]));
  assert.equal(h.values.get(CAMPAIGN_SAVE_KEY), original, 'reading migration must not overwrite the original dossier');
  assert.equal(h.ids.get('campaign-order-title').textContent, 'La dette sous la poussière');
  await h.click('campaign-deploy'); assert.equal(h.ids.get('briefing-title').textContent, 'La dette sous la poussière');
  await h.click('launch'); h.frames(2);
  assert.equal(h.snapshot().game.missionId, 'MI02'); assert.equal(h.snapshot().campaignReplay, false);
  assert.equal(h.snapshot().game.campaign.context.noticeFiled, legacyDossier.completed.world.vesper.noticeFiled);
  await h.key('KeyD'); h.frames(120); await h.key('KeyD', false); await h.click('pause-button');
  const paused = h.snapshot(); h.frames(30); assert.deepEqual(h.snapshot().game.train, paused.game.train);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.deepEqual(fresh.snapshot().game, paused.game);
  await fresh.click('pause-button'); await fresh.click('to-menu');
  await fresh.data('chapter', 'MI01'); await fresh.click('campaign-deploy'); await fresh.click('launch'); fresh.frames(3);
  assert.equal(fresh.snapshot().game.missionId, 'MI01'); assert.equal(fresh.snapshot().campaignReplay, true);
  assert.deepEqual(fresh.snapshot().campaign.checkpoint, paused.campaign.checkpoint);
  await fresh.click('pause-button'); await fresh.click('to-menu'); await fresh.click('campaign-resume');
  assert.equal(fresh.snapshot().game.missionId, 'MI02'); assert.equal(fresh.snapshot().campaignReplay, false);
});

await check('MI02 decision uses its own wording and a reload preserves the signed report before extraction', async () => {
  const initial = parseCampaign(JSON.stringify(legacyDossier.completed));
  const started = beginCampaignMission(initial, { missionId: 'MI02', walkerId: 'WK01', difficulty: 'normal' });
  pilotMI02(started.game, { stopAt: state => state.decision.active });
  assert.equal(started.game.decision.active, true);
  const dossier = checkpointCampaign(started.campaign, started.game, { beforeDecision: true });
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); h.frames(2);
  assert.match(h.ids.get('decision-title').textContent, /noms/);
  assert.match(h.ids.get('decision-body').textContent, /ouvriers/);
  const elapsed = h.snapshot().game.elapsed; h.frames(30); assert.equal(h.snapshot().game.elapsed, elapsed);
  await h.data('choice', 'defy'); assert.equal(h.snapshot().game.campaign.recordFiled, true);
  assert.equal(h.snapshot().campaign.checkpoint.campaign.recordFiled, true);
  assert.equal(h.snapshot().campaign.completed.MI02, undefined);
  const fresh = harness(h.values); await fresh.click('campaign-resume'); fresh.frames(2);
  assert.equal(fresh.snapshot().game.decision.choice, 'defy'); assert.equal(fresh.ids.get('decision-dialog').open, false);
});

await check('MI02 extraction records both missions, displays its own debrief and keeps separate archive entries', async () => {
  const initial = parseCampaign(JSON.stringify(legacyDossier.completed));
  const started = beginCampaignMission(initial, { missionId: 'MI02', walkerId: 'WK09', difficulty: 'normal' });
  pilotMI02(started.game, { stopAt: state => state.decision.resolved && state.player.x > state.extraction.x - 145 });
  assert.equal(started.game.status, 'playing');
  const dossier = checkpointCampaign(started.campaign, started.game);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); await h.key('KeyD');
  for (let i = 0; i < 400 && h.snapshot().game.status === 'playing'; i++) h.frames(1);
  await h.key('KeyD', false);
  assert.equal(h.snapshot().game.status, 'won'); assert.ok(h.snapshot().campaign.completed.MI02);
  assert.deepEqual(h.snapshot().campaign.completed.MI01, initial.completed.MI01);
  assert.match(h.ids.get('result-stats').innerHTML, /OUVRIERS LIBÉRÉS/);
  assert.doesNotMatch(h.ids.get('result-stats').innerHTML, /FILTRES LIVRÉS/);
  await h.click('result-menu');
  assert.match(h.ids.get('campaign-debrief').innerHTML, /MI02 \/ RAPPORT/);
  await h.data('view', 'archives'); await h.data('archive', 'records');
  assert.match(h.ids.get('archive-content').innerHTML, /CAMPAGNE \/ MI01/);
  assert.match(h.ids.get('archive-content').innerHTML, /CAMPAGNE \/ MI02/);
});

const previousDossier = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/campaign-v2-mi02.json'), 'utf8'));

await check('MI03 unlocks only after MI02, migrates a historical v2 dossier and resumes a new chassis exactly', async () => {
  const locked = harness(new Map([[CAMPAIGN_SAVE_KEY, JSON.stringify(legacyDossier.completed)]]));
  await locked.data('chapter', 'MI03');
  assert.equal(locked.ids.get('campaign-order-title').textContent, 'La dette sous la poussière');
  const original = JSON.stringify(previousDossier.completed), values = new Map([[CAMPAIGN_SAVE_KEY, original]]);
  const h = harness(values);
  assert.equal(values.get(CAMPAIGN_SAVE_KEY), original);
  assert.equal(h.ids.get('campaign-order-title').textContent, 'Une fenêtre encore allumée');
  await h.data('view', 'hangar'); await h.data('walker', 'WK06'); await h.click('confirm-rig');
  await h.click('campaign-deploy');
  assert.match(h.ids.get('briefing-description').textContent, /survivants du train/);
  await h.click('launch'); await h.key('KeyD'); h.frames(120); await h.key('KeyD', false);
  assert.equal(h.snapshot().game.missionId, 'MI03');
  assert.equal(h.snapshot().game.walkerId, 'WK06');
  assert.equal(h.snapshot().game.network.stations.length, 3);
  assert.match(h.ids.get('convoy-status').textContent, /ÉMISSIONS IDENTIFIÉES/);
  await h.click('pause-button'); const paused = h.snapshot();
  const fresh = harness(values); await fresh.click('campaign-resume');
  assert.deepEqual(fresh.snapshot().game, paused.game);
  assert.equal(fresh.snapshot().settings.walkerId, 'WK06');
  assert.match(fresh.ids.get('ammo-reserve').textContent, /RÉSERVE 96 \/ 96/);
});

await check('MI03 identification work survives pause and reload without becoming a filter or train objective', async () => {
  const started = beginCampaignMission(parseCampaign(JSON.stringify(previousDossier.completed)), { missionId: 'MI03', walkerId: 'WK02', difficulty: 'normal', seed: 1847 });
  pilotMI03(started.game, { stopAt: s => s.network.stations[1].scanning && s.network.stations[1].scanProgress > .5 });
  assert.equal(started.game.network.stations[1].scanning, true);
  const dossier = checkpointCampaign(started.campaign, started.game);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); await h.click('pause-button');
  const scan = h.snapshot().game.network.stations[1].scanProgress;
  h.frames(120); assert.equal(h.snapshot().game.network.stations[1].scanProgress, scan);
  const fresh = harness(h.values); await fresh.click('campaign-resume'); fresh.frames(130);
  assert.equal(fresh.snapshot().game.network.stations[1].verified, true);
  assert.match(fresh.ids.get('hud-objectives').innerHTML, /mission|émissions|militaire|réseau|Vérifier/i);
  assert.doesNotMatch(fresh.ids.get('convoy-status').textContent, /FILTRES|TRAIN/);
});

for (const choice of ['obey', 'defy']) await check(`MI03 ${choice} decision, extraction, world facts and three archive reports stay consistent`, async () => {
  const initial = parseCampaign(JSON.stringify(previousDossier.completed));
  const started = beginCampaignMission(initial, { missionId: 'MI03', walkerId: 'WK10', difficulty: 'normal', seed: 1847 });
  pilotMI03(started.game, { stopAt: s => s.decision.active });
  assert.equal(started.game.decision.active, true);
  const dossier = checkpointCampaign(started.campaign, started.game, { beforeDecision: true });
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); h.frames(2);
  assert.match(h.ids.get('decision-body').textContent, /dispensaire/);
  const elapsed = h.snapshot().game.elapsed; h.frames(30); assert.equal(h.snapshot().game.elapsed, elapsed);
  await h.data('choice', choice);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.equal(fresh.snapshot().game.decision.choice, choice);
  assert.equal(fresh.snapshot().game.campaign.civilRelaysOnline, choice === 'defy' ? 2 : 0);
  await fresh.key('KeyD');
  for (let frame = 0; frame < 1500 && fresh.snapshot().game.status === 'playing'; frame++) fresh.frames(1);
  await fresh.key('KeyD', false);
  assert.equal(fresh.snapshot().game.status, 'won');
  const completed = fresh.snapshot().campaign;
  assert.equal(completed.completed.MI03.witnessAvailable, choice === 'defy');
  assert.equal(completed.completed.MI03.residentsLost, 0);
  assert.deepEqual(completed.completed.MI01, initial.completed.MI01);
  assert.deepEqual(completed.completed.MI02, initial.completed.MI02);
  assert.equal(completed.resources.parts, initial.resources.parts + 4);
  assert.match(fresh.ids.get('result-stats').innerHTML, /RÉSEAUX CIVILS ACTIFS/);
  assert.doesNotMatch(fresh.ids.get('result-stats').innerHTML, /FILTRES LIVRÉS|OUVRIERS LIBÉRÉS/);
  await fresh.click('next-operation');
  assert.equal(fresh.ids.get('workshop-network').hidden, false);
  await fresh.data('view', 'campaign');
  assert.match(fresh.ids.get('campaign-debrief').innerHTML, /MI03 \/ RAPPORT/);
  assert.equal(fresh.ids.get('campaign-progress').textContent, '3 / 7 RAPPORTS CLASSÉS');
  await fresh.data('view', 'archives'); await fresh.data('archive', 'records');
  for (const id of ['MI01', 'MI02', 'MI03']) assert.match(fresh.ids.get('archive-content').innerHTML, new RegExp(`CAMPAGNE / ${id}`));
  await fresh.data('view', 'campaign'); await fresh.data('chapter', 'MI03'); await fresh.click('campaign-deploy'); await fresh.click('launch'); fresh.frames(2);
  assert.equal(fresh.snapshot().campaignReplay, true);
  assert.deepEqual(fresh.snapshot().campaign.completed, completed.completed);
  assert.equal(fresh.snapshot().campaign.resources.parts, completed.resources.parts);
});

const v3Dossier = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/campaign-v3-mi03.json'), 'utf8'));

await check('MI04 requires MI03 and the migrated historical dossier exposes concrete inherited briefing conditions', async () => {
  const locked = harness(new Map([[CAMPAIGN_SAVE_KEY, JSON.stringify(previousDossier.completed)]]));
  await locked.data('chapter', 'MI04');
  assert.equal(locked.ids.get('campaign-order-title').textContent, 'Une fenêtre encore allumée');
  const raw = JSON.stringify(v3Dossier.completed), values = new Map([[CAMPAIGN_SAVE_KEY, raw]]);
  const h = harness(values);
  assert.equal(values.get(CAMPAIGN_SAVE_KEY), raw, 'reading a historic dossier must not rewrite it');
  assert.equal(h.ids.get('campaign-order-title').textContent, 'Ce qui reste dans les filtres');
  assert.equal(h.ids.get('campaign-transition').hidden, true);
  await h.click('campaign-deploy');
  assert.match(h.ids.get('briefing-description').textContent, /quatre secondes par vanne/);
  assert.match(h.ids.get('briefing-description').textContent, /canal du dispensaire est ouvert/);
  await h.click('launch'); h.frames(2);
  assert.equal(h.snapshot().game.missionId, 'MI04');
  assert.equal(h.snapshot().game.campaign.witnessContacted, false);
  assert.match(h.ids.get('convoy-status').textContent, /TURBINES REFROIDIES/);
  assert.doesNotMatch(h.ids.get('convoy-status').textContent, /FILTRES|ÉMISSIONS/);
});

await check('MI04 a partly opened valve survives pause and exact reload, then visibly completes', async () => {
  const started = beginCampaignMission(parseCampaign(JSON.stringify(v3Dossier.completed)), { missionId: 'MI04', walkerId: 'WK06', difficulty: 'normal', seed: 1847 });
  pilotMI04(started.game, { stopAt: s => s.industrial.turbines[0].working && s.industrial.turbines[0].progress > .4 });
  assert.equal(started.game.industrial.turbines[0].working, true);
  const dossier = checkpointCampaign(started.campaign, started.game);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); await h.click('pause-button');
  const paused = h.snapshot().game;
  h.frames(90); assert.deepEqual(h.snapshot().game, paused);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.deepEqual(fresh.snapshot().game, paused);
  fresh.frames(160);
  assert.equal(fresh.snapshot().game.industrial.turbines[0].cooled, true);
  assert.match(fresh.ids.get('convoy-status').textContent, /1 \/ 2 TURBINES/);
});

for (const choice of ['obey', 'defy']) await check(`MI04 ${choice} records the technical copy, contact and four reports without replay rewards`, async () => {
  const initial = parseCampaign(JSON.stringify(v3Dossier.completed));
  const started = beginCampaignMission(initial, { missionId: 'MI04', walkerId: 'WK01', difficulty: 'normal', seed: 1847 });
  pilotMI04(started.game, { stopAt: s => s.decision.active });
  assert.equal(started.game.decision.active, true);
  const dossier = checkpointCampaign(started.campaign, started.game, { beforeDecision: true });
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); h.frames(2);
  assert.match(h.ids.get('decision-body').textContent, /remplac|journal/);
  const elapsed = h.snapshot().game.elapsed; h.frames(20); assert.equal(h.snapshot().game.elapsed, elapsed);
  await h.data('choice', choice);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.equal(fresh.snapshot().game.decision.choice, choice);
  await fresh.key('KeyD');
  for (let frame = 0; frame < 1800 && fresh.snapshot().game.status === 'playing'; frame++) fresh.frames(1);
  await fresh.key('KeyD', false);
  assert.equal(fresh.snapshot().game.status, 'won');
  const completed = fresh.snapshot().campaign;
  assert.equal(completed.completed.MI04.technicalEvidence, true);
  assert.equal(completed.completed.MI04.witnessContacted, true);
  assert.equal(completed.completed.MI04.reportFiled, choice === 'defy');
  assert.equal(completed.resources.parts, initial.resources.parts + 4);
  for (const id of ['MI01', 'MI02', 'MI03']) assert.deepEqual(completed.completed[id], initial.completed[id]);
  assert.match(fresh.ids.get('result-stats').innerHTML, /JOURNAL PT01|COPIE CONSERVÉE/);
  assert.doesNotMatch(fresh.ids.get('result-stats').innerHTML, /FILTRES LIVRÉS|OUVRIERS LIBÉRÉS|RÉSEAUX CIVILS ACTIFS/);
  await fresh.click('next-operation');
  assert.equal(fresh.ids.get('workshop-industrial').hidden, false);
  assert.match(fresh.ids.get('workshop-condition').textContent, /radiateur/);
  await fresh.data('view', 'campaign');
  assert.equal(fresh.ids.get('campaign-progress').textContent, '4 / 7 RAPPORTS CLASSÉS');
  assert.equal(fresh.ids.get('campaign-transition').hidden, false);
  assert.match(fresh.ids.get('campaign-transition-text').textContent, /Nacre/);
  await fresh.data('view', 'archives'); await fresh.data('archive', 'records');
  for (const id of ['MI01', 'MI02', 'MI03', 'MI04']) assert.match(fresh.ids.get('archive-content').innerHTML, new RegExp(`CAMPAGNE / ${id}`));
  await fresh.data('view', 'campaign'); await fresh.data('chapter', 'MI04'); await fresh.click('campaign-deploy'); await fresh.click('launch'); fresh.frames(2);
  assert.equal(fresh.snapshot().campaignReplay, true);
  assert.deepEqual(fresh.snapshot().campaign.completed, completed.completed);
  assert.equal(fresh.snapshot().campaign.resources.parts, completed.resources.parts);
});

await check('MI04 lost-journal UI keeps a neutral decision and records a loss without granting PT01', async () => {
  const started = beginCampaignMission(parseCampaign(JSON.stringify(v3Dossier.completed)), { missionId: 'MI04', walkerId: 'WK05', difficulty: 'normal', seed: 1847 });
  pilotMI04(started.game, { destroyPost: true, stopAt: s => s.decision.active });
  assert.equal(started.game.industrial.post.destroyed, true);
  const dossier = checkpointCampaign(started.campaign, started.game, { beforeDecision: true });
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); h.frames(2);
  assert.equal(h.ids.get('decision-title').textContent, 'Le relevé de maintenance');
  assert.equal(h.snapshot().game.campaign.technicalEvidence, false);
  assert.match(h.ids.get('decision-body').textContent, /détruit|perdu|ruines/);
  await h.data('choice', 'defy'); await h.key('KeyD');
  for (let frame = 0; frame < 1900 && h.snapshot().game.status === 'playing'; frame++) h.frames(1);
  await h.key('KeyD', false);
  assert.equal(h.snapshot().game.status, 'won');
  assert.equal(h.snapshot().campaign.completed.MI04.technicalEvidence, false);
  assert.match(h.ids.get('result-stats').innerHTML, /journal technique est perdu/);
  assert.doesNotMatch(h.ids.get('result-stats').innerHTML, /COPIE CONSERVÉE|copie du journal PT01 reste conservée/);
  await h.click('result-menu');
  assert.match(h.ids.get('campaign-transition-text').textContent, /autre source technique/);
  assert.match(h.ids.get('campaign-debrief').innerHTML, /Constat technique joint/);
});

await check('radiator controls show damage, pause repair, preserve finite kits and cancel on movement', async () => {
  // Deliberate worn-fleet unit fixture; it does not assert a played victory or damage route.
  const worn = createCampaign(); worn.fleet.WK01.radiator = 20;
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(worn)]]));
  await h.click('campaign-deploy'); await h.click('launch'); h.frames(2);
  assert.equal(h.ids.get('radiator-value').textContent, '20 %');
  assert.match(h.ids.get('radiator-condition').textContent, /DISSIPATION 48 % · 2 KITS/);
  await h.key('KeyT'); h.frames(90); await h.key('KeyT', false);
  assert.equal(h.snapshot().game.player.radiator.repairing, true);
  await h.click('pause-button'); const paused = h.snapshot().game;
  h.frames(90); assert.deepEqual(h.snapshot().game, paused);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.deepEqual(fresh.snapshot().game, paused);
  fresh.frames(180);
  assert.equal(fresh.snapshot().game.player.radiator.health, 80);
  assert.equal(fresh.snapshot().game.player.radiator.repairKits, 1);
  await fresh.click('radiator-repair'); fresh.frames(10);
  await fresh.key('KeyD'); fresh.frames(2); await fresh.key('KeyD', false);
  assert.equal(fresh.snapshot().game.player.radiator.repairing, false);
  assert.equal(fresh.snapshot().game.player.radiator.repairKits, 1);
  for (let frame = 0; frame < 180 && (Math.abs(fresh.snapshot().game.player.speed) > 3 || fresh.snapshot().game.player.feet.some(foot => !foot.contact)); frame++) fresh.frames(1);
  fresh.frames(10); await fresh.click('radiator-repair');
  assert.equal(fresh.snapshot().game.player.radiator.repairing, true, 'the settled chassis accepts a second field repair');
  fresh.frames(250);
  assert.equal(fresh.snapshot().game.player.radiator.health, 100);
  assert.equal(fresh.snapshot().game.player.radiator.repairKits, 0);
  assert.equal(fresh.ids.get('radiator-repair').disabled, true);
});

await check('an exhausted finite reserve remains empty after UI reload and displays an explicit resupply hint', async () => {
  const started = beginCampaignMission(createCampaign(), { missionId: 'MI01', walkerId: 'WK02', difficulty: 'normal' });
  const s = started.game;
  for (let frame = 0; frame < 20000 && (s.player.ammo || s.player.reserveAmmo); frame++) {
    const vent = s.player.heat > 72 || s.player.overheated;
    updateGame(s, 1 / 60, { brace: true, fire: !vent, vent, aimX: s.player.x + 500, aimY: 80 });
  }
  assert.equal(s.player.ammo + s.player.reserveAmmo, 0);
  const dossier = checkpointCampaign(started.campaign, s);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); h.frames(2);
  assert.match(h.ids.get('ammo-reserve').textContent, /RÉSERVE ÉPUISÉE/);
  await h.key('KeyR'); h.frames(180); await h.key('KeyR', false);
  assert.equal(h.snapshot().game.player.ammo, 0);
  assert.equal(h.snapshot().game.player.reserveAmmo, 0);
  assert.equal(h.snapshot().game.player.reloadTime, 0);
});

await check('unsupported saves remain untouched until an explicit new dossier', async () => {
  const raw = JSON.stringify({ ...createCampaign(), version: 42 }); const values = new Map([[CAMPAIGN_SAVE_KEY, raw]]), h = harness(values);
  assert.equal(h.snapshot().campaignBlocked, true); assert.equal(h.ids.get('campaign-deploy').disabled, true);
  h.frames(3); assert.equal(values.get(CAMPAIGN_SAVE_KEY), raw);
  await h.click('campaign-new'); await h.click('campaign-confirm-new'); assert.equal(h.snapshot().campaignBlocked, false);
  assert.equal(parseCampaign(values.get(CAMPAIGN_SAVE_KEY)).stage, 'hangar');
});

await check('storage refusal is visible during play; session progression remains usable', async () => {
  const h = harness(new Map(), { denyWrites: true }); await h.click('campaign-deploy'); await h.click('launch');
  assert.match(h.ids.get('toast').textContent, /refusée|indisponible|insuffisant/); assert.equal(h.ids.get('toast').hidden, false);
  await h.key('KeyD'); h.frames(30); assert.ok(h.snapshot().game.player.x > 300);
});

await check('an asynchronous import returns an active mission to the menu safely', async () => {
  const h = harness(); let resolveFile;
  h.ids.get('campaign-file').files = [{ size: 500, text: () => new Promise(resolve => { resolveFile = resolve; }) }];
  const reading = h.ids.get('campaign-file').dispatch('change');
  await h.click('campaign-deploy'); await h.click('launch'); h.frames(2);
  resolveFile(serializeCampaign(createCampaign())); await reading;
  assert.equal(h.snapshot().inGame, false); await h.click('campaign-confirm-import');
  assert.equal(h.snapshot().game, null); assert.equal(h.ids.get('menu').hidden, false); assert.equal(h.ids.get('game-screen').hidden, true);
  assert.equal(h.snapshot().campaign.stage, 'hangar');
});

const v4Dossier = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/campaign-v4-mi04.json'), 'utf8'));

await check('importing a genuine v4 Vesper dossier unlocks Nacre in the delivered interface', async () => {
  const h = harness(), raw = JSON.stringify(v4Dossier.completed);
  h.ids.get('campaign-file').files = [{ size: raw.length, text: async () => raw }];
  await h.ids.get('campaign-file').dispatch('change');
  assert.equal(h.ids.get('campaign-import-dialog').open, true);
  assert.match(h.ids.get('campaign-import-summary').textContent, /MI04/);
  await h.click('campaign-confirm-import');
  assert.equal(h.ids.get('campaign-order-title').textContent, 'Le prix du passage');
  assert.equal(h.ids.get('campaign-progress').textContent, '4 / 7 RAPPORTS CLASSÉS');
  assert.deepEqual(h.snapshot().campaign.completed, v4Dossier.completed.completed);
  await h.click('campaign-deploy');
  assert.match(h.ids.get('briefing-description').textContent, /journal de Vesper/);
  await h.click('launch'); h.frames(2);
  assert.equal(h.snapshot().game.missionId, 'MI05');
  assert.equal(h.ids.get('tide-instrument').hidden, false);
  assert.equal(h.ids.get('tide-phase').textContent, 'BASSE MER');
  assert.match(h.ids.get('convoy-status').textContent, /CÂBLES LIBÉRÉS/);
});

await check('Nacre tide and bridge work freeze on pause and restore through the delivered save wiring', async () => {
  const initial = parseCampaign(JSON.stringify(v4Dossier.completed));
  const start = beginCampaignMission(initial, { missionId: 'MI05', walkerId: 'WK09', seed: 1847 });
  pilotMI05(start.game, { stopAt: s => s.channel.banks[0].working && s.channel.banks[0].progress > 0.35 });
  const dossier = checkpointCampaign(start.campaign, start.game);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); await h.click('pause-button');
  const paused = h.snapshot().game;
  h.frames(180); assert.deepEqual(h.snapshot().game, paused);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.deepEqual(fresh.snapshot().game, paused);
  fresh.frames(180);
  assert.equal(fresh.snapshot().game.channel.banks[0].bridgeRaised, true);
  assert.equal(fresh.ids.get('tide-instrument').hidden, false);
  assert.match(fresh.ids.get('tide-window').textContent, /CHANGEMENT DANS/);
  await fresh.click('pause-button'); await fresh.click('to-menu');
  await fresh.data('view', 'operations'); await fresh.click('deploy'); await fresh.click('launch'); fresh.frames(2);
  assert.equal(fresh.ids.get('tide-instrument').hidden, true);
  assert.equal(fresh.snapshot().campaign.activeMissionId, 'MI05');
});

for (const choice of ['obey', 'defy']) await check(`MI05 ${choice} debrief, archives, workshop fuel and replay keep the first report`, async () => {
  const initial = parseCampaign(JSON.stringify(v4Dossier.completed));
  const start = beginCampaignMission(initial, { missionId: 'MI05', walkerId: 'WK01', seed: 1847 });
  pilotMI05(start.game, { stopAt: s => s.decision.active });
  const dossier = checkpointCampaign(start.campaign, start.game, { beforeDecision: true });
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); h.frames(2);
  assert.equal(h.ids.get('decision-dialog').open, true);
  assert.match(h.ids.get('decision-body').textContent, /Saisie|Rive-Courte/);
  await h.data('choice', choice);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.equal(fresh.snapshot().game.decision.choice, choice);
  await fresh.key('KeyD');
  for (let frame = 0; frame < 1200 && fresh.snapshot().game.status === 'playing'; frame++) fresh.frames(1);
  await fresh.key('KeyD', false);
  assert.equal(fresh.snapshot().game.status, 'won');
  const completed = fresh.snapshot().campaign;
  assert.equal(completed.completed.MI05.refugeesPassed, 12);
  assert.equal(completed.completed.MI05.reportFiled, choice === 'defy');
  assert.equal(completed.resources.fuel, 2);
  assert.match(fresh.ids.get('result-stats').innerHTML, /PASSAGERS AU QUAI/);
  assert.doesNotMatch(fresh.ids.get('result-stats').innerHTML, /FILTRES LIVRÉS|JOURNAL PT01/);
  await fresh.click('next-operation');
  assert.equal(fresh.ids.get('workshop-nacre').hidden, false);
  assert.equal(fresh.ids.get('workshop-fuel').textContent, '2 LOTS DE CARBURANT EN RÉSERVE');
  await fresh.data('view', 'archives'); await fresh.data('archive', 'records');
  assert.match(fresh.ids.get('archive-content').innerHTML, /CAMPAGNE \/ MI05/);
  assert.match(fresh.ids.get('archive-content').innerHTML, /Vann Ostre/);
  await fresh.data('view', 'campaign');
  assert.equal(fresh.ids.get('campaign-progress').textContent, '5 / 7 RAPPORTS CLASSÉS');
  await fresh.data('chapter', 'MI05');
  await fresh.click('campaign-deploy'); await fresh.click('launch'); fresh.frames(2);
  assert.equal(fresh.snapshot().campaignReplay, true);
  assert.deepEqual(fresh.snapshot().campaign.completed, completed.completed);
  assert.deepEqual(fresh.snapshot().campaign.resources, completed.resources);
});

await check('the UI records a lost civil boat and skipped fuel without granting either arrival or stock', async () => {
  const start = beginCampaignMission(parseCampaign(JSON.stringify(v4Dossier.completed)), { missionId: 'MI05', walkerId: 'WK05', seed: 1847 });
  pilotMI05(start.game, { destroyBoat: true, skipFuel: true, stopAt: s => s.decision.active });
  assert.equal(start.game.channel.boat.destroyed, true);
  const dossier = checkpointCampaign(start.campaign, start.game, { beforeDecision: true });
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); h.frames(2); await h.data('choice', 'defy');
  await h.key('KeyD');
  for (let frame = 0; frame < 1200 && h.snapshot().game.status === 'playing'; frame++) h.frames(1);
  await h.key('KeyD', false);
  assert.equal(h.snapshot().game.status, 'won');
  assert.equal(h.snapshot().campaign.completed.MI05.refugeesPassed, 0);
  assert.equal(h.snapshot().campaign.completed.MI05.refugeesLost, 12);
  assert.equal(h.snapshot().campaign.resources.fuel, 0);
  assert.match(h.ids.get('result-stats').innerHTML, /0 passagers au quai ; 12 perdus/);
  await h.click('next-operation');
  assert.equal(h.ids.get('workshop-fuel').textContent, '0 LOT DE CARBURANT EN RÉSERVE');
});

const v5Dossier = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/campaign-v5-mi05.json'), 'utf8'));
const dikeStart = () => beginCampaignMission(parseCampaign(JSON.stringify(v5Dossier.completed)), { missionId: 'MI06', walkerId: 'WK09', seed: 1847 });

await check('a genuine v5 import unlocks MI06 with its actual stock and ten distinct local residents', async () => {
  const h = harness(), raw = JSON.stringify(v5Dossier.completed);
  h.ids.get('campaign-file').files = [{ size: raw.length, text: async () => raw }];
  await h.ids.get('campaign-file').dispatch('change'); await h.click('campaign-confirm-import');
  assert.equal(h.ids.get('campaign-order-title').textContent, 'Les maisons sous la ligne');
  assert.equal(h.ids.get('campaign-progress').textContent, '5 / 7 RAPPORTS CLASSÉS');
  assert.deepEqual(h.snapshot().campaign.completed, v5Dossier.completed.completed);
  await h.click('campaign-deploy');
  assert.match(h.ids.get('briefing-description').textContent, /dix habitants/);
  assert.match(h.ids.get('briefing-description').textContent, /Deux lots/);
  await h.click('launch'); h.frames(2);
  assert.equal(h.snapshot().game.missionId, 'MI06');
  assert.equal(h.snapshot().game.campaign.context.refugeesPassed, 12);
  assert.equal(h.snapshot().game.campaign.residentsTotal, 10);
  assert.equal(h.ids.get('dike-instrument').hidden, false);
  assert.equal(h.ids.get('tide-instrument').hidden, true);
  assert.match(h.ids.get('dike-fuel').textContent, /2 LOTS À BRANCHER/);
});

await check('auxiliary work freezes on pause, resumes exactly and saves its debit before the eight-second interval', async () => {
  const start = dikeStart();
  pilotMI06(start.game, { stopAt: s => s.dike.auxiliary.working && s.dike.auxiliary.progress > 0.4 });
  const dossier = checkpointCampaign(start.campaign, start.game);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); await h.click('pause-button');
  const paused = h.snapshot().game;
  h.frames(180); assert.deepEqual(h.snapshot().game, paused);
  assert.equal(h.snapshot().campaign.resources.fuel, 2);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.deepEqual(fresh.snapshot().game, paused);
  fresh.frames(180);
  assert.equal(fresh.snapshot().game.campaign.fuelSpent, 2);
  assert.equal(fresh.snapshot().campaign.resources.fuel, 0);
  const saved = parseCampaign(fresh.values.get(CAMPAIGN_SAVE_KEY));
  assert.equal(saved.world.nacre.fuelSpent, 2);
  assert.equal(saved.checkpoint.campaign.fuelSpent, 2);
  assert.ok(saved.checkpoint.elapsed - paused.elapsed < 8);
  assert.match(fresh.ids.get('dike-fuel').textContent, /ACTIVE · 2 LOTS UTILISÉS/);
  await fresh.click('pause-button'); await fresh.click('to-menu'); await fresh.data('view', 'hangar');
  assert.equal(fresh.ids.get('workshop-fuel').textContent, '0 LOT DE CARBURANT EN RÉSERVE');
  assert.match(fresh.ids.get('workshop-fuel-used').textContent, /2 LOTS DÉJÀ UTILISÉS/);
});

await check('partial panel locking pauses exactly and needs renewed keyboard anchoring on resume', async () => {
  const start = dikeStart();
  pilotMI06(start.game, { stopAt: s => s.dike.panel.latchProgress > 0.35 && !s.dike.panel.locked });
  assert.ok(start.game.dike.panel.latchProgress > 0.35);
  const dossier = checkpointCampaign(start.campaign, start.game);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); await h.click('pause-button');
  const paused = h.snapshot().game; h.frames(180); assert.deepEqual(h.snapshot().game, paused);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.deepEqual(fresh.snapshot().game, paused);
  await fresh.key('Space'); fresh.frames(300); await fresh.key('Space', false);
  assert.equal(fresh.snapshot().game.dike.panel.locked, true);
  assert.match(fresh.ids.get('dike-support').textContent, /PANNEAU VERROUILLÉ/);
});

await check('a refused immediate auxiliary save keeps the session debit and a visible storage warning', async () => {
  const start = dikeStart();
  pilotMI06(start.game, { stopAt: s => s.dike.auxiliary.working && s.dike.auxiliary.progress > 0.4 });
  const dossier = checkpointCampaign(start.campaign, start.game), bytes = serializeCampaign(dossier);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, bytes]]), { denyWrites: true });
  await h.click('campaign-resume'); h.frames(180);
  assert.equal(h.snapshot().campaign.resources.fuel, 0);
  assert.equal(h.snapshot().campaign.world.nacre.fuelSpent, 2);
  assert.equal(h.values.get(CAMPAIGN_SAVE_KEY), bytes);
  assert.match(h.ids.get('toast').textContent, /refusée|indisponible|insuffisant/);
  assert.equal(h.ids.get('toast').hidden, false);
});

await check('an auxiliary destroyed before connection is shown as lost while its two lots remain in reserve', async () => {
  const start = dikeStart();
  pilotMI06(start.game, { useAuxiliary: false, stopAt: s => s.player.x >= s.dike.auxiliary.x + 260 });
  const auxiliary = start.game.dike.auxiliary;
  for (let frame = 0; frame < 3600 && start.game.status === 'playing' && !auxiliary.destroyed; frame++) {
    const vent = start.game.player.heat > 75 || start.game.player.overheated;
    const flying = start.game.projectiles.some(p => p.team === 'player');
    updateGame(start.game, 1 / 60, { brace: true, vent, fire: !vent && !flying, aimX: auxiliary.x, aimY: auxiliary.y });
  }
  assert.equal(auxiliary.destroyed, true);
  assert.equal(auxiliary.connected, false);
  assert.equal(start.game.campaign.fuelSpent, 0);
  const dossier = checkpointCampaign(start.campaign, start.game);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); h.frames(2);
  assert.equal(h.snapshot().campaign.resources.fuel, 2);
  assert.equal(h.snapshot().campaign.world.nacre.fuelSpent, 0);
  assert.equal(h.ids.get('dike-fuel').textContent, 'AUXILIAIRE PERDUE · 2 LOTS CONSERVÉS');
  assert.doesNotMatch(h.ids.get('dike-fuel').textContent, /DISPONIBLE/);
});

for (const choice of ['obey', 'defy']) await check(`MI06 ${choice} requires the actual valve operation, then persists housing, people, fuel and a pure replay`, async () => {
  const start = dikeStart();
  pilotMI06(start.game, { stopAt: s => s.decision.active });
  const dossier = checkpointCampaign(start.campaign, start.game, { beforeDecision: true });
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); h.frames(2);
  assert.equal(h.ids.get('decision-title').textContent, 'La ligne sur les maisons');
  await h.data('choice', choice);
  assert.equal(h.snapshot().game.campaign.pumpsOnline, false);
  h.frames(60); assert.equal(h.snapshot().game.dike.valve.progress, 0);
  await h.key('KeyE'); h.frames(2); await h.key('KeyE', false); h.frames(1200);
  assert.equal(h.snapshot().game.campaign.pumpsOnline, true);
  assert.equal(h.snapshot().game.campaign.homesUninhabitable, choice === 'obey' ? 2 : 0);
  await h.key('KeyD');
  for (let frame = 0; frame < 1800 && h.snapshot().game.status === 'playing'; frame++) h.frames(1);
  await h.key('KeyD', false);
  assert.equal(h.snapshot().game.status, 'won');
  const completed = h.snapshot().campaign;
  assert.equal(completed.completed.MI06.residentsSafe, 10);
  assert.equal(completed.completed.MI06.fuelSpent, 2);
  assert.equal(completed.world.nacre.fuelSpent, 2);
  assert.equal(completed.resources.fuel, 0);
  assert.match(h.ids.get('result-stats').innerHTML, /HABITANTS À L’ABRI/);
  assert.match(h.ids.get('result-stats').innerHTML, /manœuvre de vanne est achevée/);
  await h.click('next-operation');
  assert.match(h.ids.get('workshop-dike').textContent, /10 habitants à l’abri/);
  await h.data('view', 'archives'); await h.data('archive', 'records');
  assert.match(h.ids.get('archive-content').innerHTML, /CAMPAGNE \/ MI06/);
  await h.data('view', 'campaign');
  assert.equal(h.ids.get('campaign-progress').textContent, '6 / 7 RAPPORTS CLASSÉS');
  await h.data('chapter', 'MI06'); await h.click('campaign-deploy'); await h.click('launch'); h.frames(2);
  assert.equal(h.snapshot().campaignReplay, true);
  assert.equal(h.snapshot().game.campaign.context.fuelAvailable, 2);
  assert.deepEqual(h.snapshot().campaign, completed);
});

await check('the UI immediately persists a terminal MI06 loss and restarts without refunding its consumed auxiliary', async () => {
  const start = dikeStart();
  pilotMI06(start.game, { stopAt: s => s.campaign.fuelSpent === 2 });
  const p = start.game.player, x = p.x, y = p.y - p.height / 2 - 80;
  // A collision calibration fixture; this is not a claimed natural combat loss.
  start.game.projectiles.push({ id: `ui-terminal-${start.game.entityId++}`, team: 'enemy', type: 'bullet',
    x, y, prevX: x, prevY: y, vx: 0, vy: 6000, damage: 5000, radius: 2, life: 1, trail: [] });
  const live = checkpointCampaign(start.campaign, start.game);
  const first = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(live)]]));
  await first.click('campaign-resume'); first.frames(60);
  assert.equal(first.snapshot().game.status, 'lost');
  const failed = parseCampaign(first.values.get(CAMPAIGN_SAVE_KEY));
  assert.equal(failed.checkpoint.status, 'lost');
  assert.equal(failed.resources.fuel, 0);
  assert.equal(failed.world.nacre.fuelSpent, 2);
  assert.ok(failed.checkpoint.elapsed - live.checkpoint.elapsed < 8);
  const h = harness(first.values);
  assert.equal(h.ids.get('campaign-resume').textContent, 'Voir le bilan de MI06');
  await h.click('campaign-resume'); h.frames(2);
  assert.equal(h.ids.get('result-dialog').open, true);
  assert.equal(h.ids.get('result-title').textContent, 'Liaison perdue.');
  assert.equal(h.snapshot().game.status, 'lost');
  await h.click('replay'); h.frames(2);
  assert.equal(h.snapshot().game.status, 'playing');
  assert.equal(h.snapshot().campaignReplay, false);
  assert.equal(h.snapshot().game.campaign.context.fuelAvailable, 0);
  assert.equal(h.snapshot().campaign.world.nacre.fuelSpent, 2);
  assert.match(h.ids.get('dike-fuel').textContent, /SANS CARBURANT/);
});

const v6Dossier = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/campaign-v6-mi06.json'), 'utf8'));
const ambulanceStart = (variant = 'completed') => beginCampaignMission(parseCampaign(JSON.stringify(v6Dossier[variant])), { missionId: 'MI07', walkerId: 'WK09', seed: 1847 });
async function importAmbulanceDossier(h, dossier) {
  const raw = JSON.stringify(dossier);
  h.ids.get('campaign-file').files = [{ size: raw.length, text: async () => raw }];
  await h.ids.get('campaign-file').dispatch('change');
  assert.equal(h.ids.get('campaign-import-dialog').open, true);
  await h.click('campaign-confirm-import');
  assert.equal(h.ids.get('campaign-import-dialog').open, false);
}

await check('MI07 migration imports an authentic paid v6 valve without rewriting its scene or earlier reports', async () => {
  const h = harness(); await importAmbulanceDossier(h, v6Dossier.live);
  const migrated = h.snapshot().campaign;
  assert.equal(migrated.version, 7);
  assert.deepEqual(migrated.checkpoint, v6Dossier.live.checkpoint);
  assert.deepEqual(migrated.preDecisionCheckpoint, v6Dossier.live.preDecisionCheckpoint);
  assert.deepEqual(migrated.completed, v6Dossier.live.completed);
  assert.deepEqual(migrated.resources, v6Dossier.live.resources);
  assert.equal(migrated.world.nacre.fuelSpent, 2);
  assert.equal(migrated.world.nacre.ambulance.patientsTotal, 0);
  await h.click('campaign-resume');
  assert.deepEqual(h.snapshot().game, v6Dossier.live.checkpoint);
  await h.click('pause-button'); h.frames(180);
  assert.deepEqual(h.snapshot().game, v6Dossier.live.checkpoint);
  const saved = parseCampaign(h.values.get(CAMPAIGN_SAVE_KEY));
  assert.deepEqual(saved.checkpoint, v6Dossier.live.checkpoint);
  assert.equal(saved.world.nacre.fuelSpent, 2);
  assert.equal(h.ids.get('ambulance-instrument').hidden, true);
  assert.equal(h.ids.get('dike-instrument').hidden, false);
});

for (const [variant, route, routeText] of [['completed', 'main', 'PRINCIPALE'], ['manualCompleted', 'secondary', 'SECONDAIRE']]) await check(`MI07 ${route} briefing uses authentic dike support and introduces four new patients without altering fuel`, async () => {
  const h = harness(); await importAmbulanceDossier(h, v6Dossier[variant]);
  const prior = h.snapshot().campaign;
  assert.equal(h.ids.get('campaign-order-title').textContent, 'Une ambulance sans escorte');
  assert.equal(h.ids.get('campaign-progress').textContent, '6 / 7 RAPPORTS CLASSÉS');
  await h.click('campaign-deploy');
  const briefing = h.ids.get('briefing-description').textContent;
  assert.match(briefing, /quatre patients et deux membres/);
  assert.match(briefing, route === 'main' ? /rampe principale/ : /rampe secondaire/);
  assert.match(briefing, /65 %|trajet sera plus long/);
  await h.click('launch'); h.frames(2);
  const state = h.snapshot();
  assert.equal(state.game.missionId, 'MI07');
  assert.equal(state.game.campaign.route, route);
  assert.equal(state.game.campaign.patientsTotal, 4);
  assert.equal(state.game.campaign.staffTotal, 2);
  assert.equal(state.game.campaign.patientsArrived, 0);
  assert.equal(state.game.campaign.consentObtained, false);
  assert.equal(state.game.campaign.beaconRecovered, false);
  assert.deepEqual(state.campaign.resources, prior.resources);
  assert.equal(state.campaign.world.nacre.fuelSpent, prior.world.nacre.fuelSpent);
  assert.deepEqual(state.campaign.completed, prior.completed);
  assert.equal(h.ids.get('ambulance-instrument').hidden, false);
  assert.equal(h.ids.get('dike-instrument').hidden, true);
  assert.equal(h.ids.get('tide-instrument').hidden, true);
  assert.match(h.ids.get('ambulance-route').textContent, new RegExp(routeText));
  assert.match(h.ids.get('ambulance-people').textContent, /0 \/ 4 PATIENTS ARRIVÉS/);
});

for (const job of [
  { label: 'cargo examination', object: 'cargo', active: 'scanning', progress: 'scanProgress', done: 'inspected', fact: 'medicalCargoVerified' },
  { label: 'beacon dismantling', object: 'beacon', active: 'working', progress: 'progress', done: 'recovered', fact: 'beaconRecovered' },
  { label: 'ramp preparation', object: 'ramp', active: 'working', progress: 'progress', done: 'prepared', fact: 'rampPrepared' },
]) await check(`MI07 partial ${job.label} freezes on pause and resumes its exact physical progress after reload`, async () => {
  const start = ambulanceStart();
  pilotMI07(start.game, { stopAt: state => state.ambulance[job.object][job.active] && state.ambulance[job.object][job.progress] > 0.35 });
  const part = start.game.ambulance[job.object];
  assert.equal(start.game.status, 'playing');
  assert.ok(part[job.progress] > 0.35 && part[job.progress] < 1, `${job.label} reached through public controls`);
  assert.equal(part[job.done], false);
  const dossier = checkpointCampaign(start.campaign, start.game);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); await h.click('pause-button');
  const paused = h.snapshot().game;
  h.frames(180); assert.deepEqual(h.snapshot().game, paused);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.deepEqual(fresh.snapshot().game, paused);
  await fresh.key('Space');
  for (let frame = 0; frame < 600 && !fresh.snapshot().game.ambulance[job.object][job.done]; frame += 6) fresh.frames(6);
  await fresh.key('Space', false);
  assert.equal(fresh.snapshot().game.ambulance[job.object][job.done], true);
  assert.equal(fresh.snapshot().game.campaign[job.fact], true);
  assert.equal(fresh.snapshot().game.campaign.provenanceVerified, false);
  assert.deepEqual(fresh.snapshot().campaign.resources, dossier.resources);
  assert.equal(fresh.snapshot().campaign.world.nacre.fuelSpent, dossier.world.nacre.fuelSpent);
  await fresh.click('pause-button');
  const saved = parseCampaign(fresh.values.get(CAMPAIGN_SAVE_KEY));
  assert.equal(saved.checkpoint.ambulance[job.object][job.done], true);
});

// Continue from a public-control checkpoint through real keyboard and touch-button
// events. This helper reads snapshots to choose inputs; it never edits the app state.
async function finishAmbulanceThroughUI(h) {
  const held = new Map(), fireButton = h.document.querySelector('[data-hold="fire"]');
  const setKey = async (code, down) => {
    if (Boolean(held.get(code)) === down) return;
    await h.key(code, down); held.set(code, down);
  };
  const setFire = async down => {
    if (Boolean(held.get('fire')) === down) return;
    await fireButton.dispatch(down ? 'pointerdown' : 'pointerup', { pointerId: 7, pointerType: 'touch' });
    held.set('fire', down);
  };
  for (let frame = 0; frame < 30000; frame += 6) {
    const s = h.snapshot().game;
    if (s.status !== 'playing') break;
    const a = s.ambulance, c = s.campaign, p = s.player;
    const reception = a.receptions.find(r => r.kind === c.destination);
    const job = !a.mara.contacted ? { x: a.mara.x }
      : a.technical.available && !a.technical.contacted ? { x: a.technical.x }
      : !a.ramp.prepared ? { x: a.ramp.x }
      : !reception.ready || !a.handover.ordered ? { x: reception.x }
      : !a.handover.completed && (a.vehicle.arrived || a.vehicle.destroyed) ? { x: reception.x }
      : null;
    const destination = c.transferResolved ? s.extraction.x : job ? job.x - 115 : reception.x - 115;
    let move = Math.abs(destination - p.x) > 28 ? Math.sign(destination - p.x) : 0;
    const enemy = s.enemies.filter(e => !e.dead && e.active && Math.abs(e.x - p.x) < 1000)
      .sort((x, y) => Math.abs(x.x - p.x) - Math.abs(y.x - p.x))[0];
    if (enemy && Math.abs(enemy.x - p.x) < 650) move = 0;
    const vent = p.heat > 75 || p.overheated;
    await setKey('KeyD', move > 0); await setKey('KeyA', move < 0);
    await setKey('Space', move === 0); await setKey('KeyV', vent);
    await setFire(Boolean(enemy) && !vent);
    const interact = job && Math.abs(p.x - job.x) < 168;
    if (interact) await h.key('KeyE');
    h.frames(2);
    if (interact) await h.key('KeyE', false);
    h.frames(4);
  }
  for (const code of ['KeyD', 'KeyA', 'Space', 'KeyV']) await setKey(code, false);
  await setFire(false);
  assert.equal(h.snapshot().game.status, 'won', 'keyboard/touch continuation reached extraction');
}

for (const choice of ['obey', 'defy']) await check(`MI07 ${choice} selects a destination without arrivals, then transfers physically through UI and preserves the first report on replay`, async () => {
  const start = ambulanceStart();
  pilotMI07(start.game, { stopAt: s => s.decision.active });
  assert.equal(start.game.decision.active, true);
  const dossier = checkpointCampaign(start.campaign, start.game, { beforeDecision: true });
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(dossier)]]));
  await h.click('campaign-resume'); h.frames(2);
  assert.equal(h.ids.get('decision-title').textContent, 'Une signature sous le châssis');
  await h.data('choice', choice);
  const chosen = h.snapshot().game;
  assert.equal(chosen.campaign.destination, choice === 'defy' ? 'clinic' : 'imperial');
  assert.equal(chosen.campaign.transferOrdered, false);
  assert.equal(chosen.campaign.transferResolved, false);
  assert.equal(chosen.campaign.patientsArrived, 0);
  h.frames(60);
  assert.equal(h.snapshot().game.campaign.patientsArrived, 0);
  assert.equal(h.snapshot().game.campaign.vehicleRecovered, false);
  await finishAmbulanceThroughUI(h);
  const completed = h.snapshot().campaign, report = completed.completed.MI07;
  assert.equal(report.patientsArrived, 4); assert.equal(report.patientsLost, 0);
  assert.equal(report.staffAlive, 2); assert.equal(report.staffArrived, 2);
  assert.equal(report.vehicleRecovered, true); assert.equal(report.vehicleSeized, choice === 'obey');
  assert.equal(report.beaconRecovered, true); assert.equal(report.provenanceVerified, false);
  assert.deepEqual(completed.resources, { ...dossier.resources, parts: dossier.resources.parts + 4 });
  assert.equal(completed.world.nacre.fuelSpent, dossier.world.nacre.fuelSpent);
  assert.deepEqual(completed.world.nacre.dike, dossier.world.nacre.dike);
  for (const id of ['MI01', 'MI02', 'MI03', 'MI04', 'MI05', 'MI06']) assert.deepEqual(completed.completed[id], dossier.completed[id]);
  assert.match(h.ids.get('result-stats').innerHTML, /PATIENTS ARRIVÉS/);
  assert.match(h.ids.get('result-stats').innerHTML, choice === 'obey' ? /arrivé puis saisi/ : /conservé pour les soins/);
  await h.click('next-operation');
  assert.match(h.ids.get('workshop-ambulance').textContent, /4 patients arrivés/);
  assert.equal(h.ids.get('workshop-fuel').textContent, '0 LOT DE CARBURANT EN RÉSERVE');
  await h.data('view', 'archives'); await h.data('archive', 'records');
  assert.match(h.ids.get('archive-content').innerHTML, /CAMPAGNE \/ MI07/);
  await h.data('view', 'campaign');
  assert.equal(h.ids.get('campaign-progress').textContent, '7 / 7 RAPPORTS CLASSÉS');
  assert.match(h.ids.get('campaign-debrief').innerHTML, /À recouper/);
  await h.data('chapter', 'MI07'); await h.click('campaign-deploy'); await h.click('launch'); h.frames(2);
  assert.equal(h.snapshot().campaignReplay, true);
  assert.equal(h.snapshot().game.campaign.patientsArrived, 0);
  assert.deepEqual(h.snapshot().campaign, completed);
});

await check('MI07 report keeps an obtained witness agreement while identifying that witness as deceased', async () => {
  const start = ambulanceStart();
  pilotMI07(start.game, { stopAt: state => state.campaign.witnessConsent });
  assert.equal(start.game.campaign.witnessConsent, true);
  assert.equal(start.game.campaign.witnessAvailable, true);
  const witnessId = start.game.campaign.witnessId;
  // The public pilot deliberately fires at the staff. No health or dossier
  // fields are assigned; the ensuing report distinguishes agreement from life.
  pilotMI07(start.game, { killStaff: true, stopAt: state => state.campaign.staffAlive === 0 });
  assert.equal(start.game.campaign.staffAlive, 0);
  assert.equal(start.game.campaign.witnessConsent, true);
  assert.equal(start.game.campaign.witnessId, witnessId);
  assert.equal(start.game.campaign.witnessAvailable, false);
  pilotMI07(start.game);
  assert.equal(start.game.status, 'won');
  const completed = finishCampaignMission(start.campaign, start.game).campaign;
  const h = harness(); await importAmbulanceDossier(h, completed);
  assert.equal(h.snapshot().campaign.completed.MI07.witnessConsent, true);
  assert.equal(h.snapshot().campaign.completed.MI07.witnessAvailable, false);
  assert.match(h.ids.get('campaign-debrief').innerHTML, /Recueilli · témoin décédé/);
  assert.match(h.ids.get('campaign-debrief').innerHTML, /Cette personne est morte depuis cet accord/);
  await h.data('view', 'hangar');
  assert.match(h.ids.get('workshop-ambulance').textContent, /0 membres de l’équipe vivants/);
  assert.match(h.ids.get('workshop-ambulance').textContent, /accord à témoigner a été recueilli/);
});

await check('MI07 terminal loss persists immediately, reopens as a report and requires an explicit fresh sortie', async () => {
  const start = ambulanceStart(), before = normalized(start.campaign);
  const p = start.game.player, x = p.x, y = p.y - p.height / 2 - 80;
  // Controlled collision calibration, not a claimed natural combat death.
  // Production damage resolves the impact; hull, phase and outcome are not set.
  start.game.projectiles.push({ id: `ui-ambulance-terminal-${start.game.entityId++}`, team: 'enemy', type: 'bullet',
    x, y, prevX: x, prevY: y, vx: 0, vy: 6000, damage: 5000, radius: 2, life: 1, trail: [] });
  const live = checkpointCampaign(start.campaign, start.game);
  const first = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(live)]]));
  await first.click('campaign-resume'); first.frames(60);
  assert.equal(first.snapshot().game.status, 'lost');
  const failed = parseCampaign(first.values.get(CAMPAIGN_SAVE_KEY));
  assert.equal(failed.checkpoint.status, 'lost');
  assert.ok(failed.checkpoint.elapsed - live.checkpoint.elapsed < 8);
  assert.equal(failed.completed.MI07, undefined);
  assert.deepEqual(failed.resources, before.resources);
  assert.equal(failed.world.nacre.fuelSpent, before.world.nacre.fuelSpent);
  assert.deepEqual(failed.world.nacre.dike, before.world.nacre.dike);
  const h = harness(first.values);
  assert.equal(h.ids.get('campaign-resume').textContent, 'Voir le bilan de MI07');
  await h.click('campaign-resume'); h.frames(2);
  assert.equal(h.snapshot().game.status, 'lost');
  assert.equal(h.ids.get('result-dialog').open, true);
  assert.equal(h.ids.get('result-title').textContent, 'Liaison perdue.');
  await h.click('replay'); h.frames(2);
  assert.equal(h.snapshot().game.status, 'playing');
  assert.equal(h.snapshot().campaignReplay, false);
  assert.equal(h.snapshot().game.campaign.stopCalled, false);
  assert.equal(h.snapshot().game.campaign.patientsArrived, 0);
  assert.equal(h.snapshot().game.campaign.beaconRecovered, false);
  assert.deepEqual(h.snapshot().campaign.resources, before.resources);
  assert.equal(h.snapshot().campaign.world.nacre.fuelSpent, before.world.nacre.fuelSpent);
});

await check('MI07 a touch interaction can be paused and saved before the next animation frame', async () => {
  const start = ambulanceStart();
  pilotMI07(start.game, { stopAt: s => !s.ambulance.vehicle.called && s.player.x > s.mission.ambulance.callX - 174 });
  assert.equal(start.game.ambulance.vehicle.called, false);
  assert.ok(Math.abs(start.game.player.x - start.game.mission.ambulance.callX) < 175);
  const live = checkpointCampaign(start.campaign, start.game);
  const h = harness(new Map([[CAMPAIGN_SAVE_KEY, serializeCampaign(live)]]));
  await h.click('campaign-resume');
  const elapsed = h.snapshot().game.elapsed;
  await h.data('action', 'interact');
  await h.click('pause-button');
  assert.equal(h.snapshot().game.elapsed, elapsed);
  assert.equal(h.snapshot().game.ambulance.vehicle.called, true);
  assert.equal(h.snapshot().game.campaign.stopCalled, true);
  assert.equal(h.snapshot().campaignWarning, '');
  const saved = parseCampaign(h.values.get(CAMPAIGN_SAVE_KEY));
  assert.equal(saved.checkpoint.elapsed, elapsed);
  assert.equal(saved.checkpoint.campaign.stopCalled, true);
  assert.deepEqual(saved.checkpoint, h.snapshot().game);
  const fresh = harness(h.values); await fresh.click('campaign-resume');
  assert.deepEqual(fresh.snapshot().game, saved.checkpoint);
});

console.log(`UI STATE INTEGRATION PASSED: ${checks} flows against the actual offline application script in a modeled DOM.`);
console.log('LIMIT: no browser, CSS layout, native focus/dialog behavior, real download, audio or physical touch validation.');
