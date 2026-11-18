/** Rendu HTML du menu Affrontements. Aucune simulation, aucun état de campagne. */
import { ARENA_RULES, ARENA_ROSTER, ARENA_ARENAS, ARENA_TOURNAMENT, ARENA_STORY, ARENA_ILLUSTRATIONS, ARENA_ILLUSTRATION_LOTS } from './arena.mjs';

const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rosterById = id => ARENA_ROSTER.find(fighter => fighter.id === id);
const arenaById = id => ARENA_ARENAS.find(arena => arena.id === id);
const arenaName = id => rosterById(id)?.name || id;

export function illustrationLot(id) {
  return ARENA_ILLUSTRATIONS.find(entry => entry.id === id)?.lot || 'all';
}

function tournamentView() {
  const seed = n => ARENA_TOURNAMENT.seeds.find(entry => entry.seed === n);
  const chip = n => {
    const fighter = rosterById(seed(n).id);
    return `<span class="arena-chip" style="--fighter:${fighter.accent}"><small>${n}</small><strong>${escapeHTML(fighter.name)}</strong><em>${escapeHTML(fighter.planet)}</em></span>`;
  };
  const quarters = ARENA_TOURNAMENT.quarters.map(([a, b], index) => `<div class="arena-match"><span class="arena-match-label">QUART ${index + 1}</span>${chip(a)}${chip(b)}</div>`).join('');
  const semis = [1, 2].map(n => `<div class="arena-match"><span class="arena-match-label">DEMI-APPUI ${n}</span><span class="arena-slot">Vainqueur quart ${n * 2 - 1}</span><span class="arena-slot">Vainqueur quart ${n * 2}</span></div>`).join('');
  return `<div class="arena-banner"><div><p class="eyebrow">TOURNOI / ${escapeHTML(ARENA_TOURNAMENT.venue.toUpperCase())}</p><h3>${escapeHTML(ARENA_TOURNAMENT.name)}</h3><p class="arena-format">${escapeHTML(ARENA_TOURNAMENT.format)}</p></div><button class="primary-button" data-arena-action="start">OUVRIR LE BRACKET <span aria-hidden="true">↗</span></button></div>
    <div class="arena-bracket">
      <section><h4>${escapeHTML(ARENA_TOURNAMENT.rounds[0].name)}</h4><p class="arena-hint">${escapeHTML(ARENA_TOURNAMENT.rounds[0].detail)}</p>${quarters}</section>
      <section><h4>${escapeHTML(ARENA_TOURNAMENT.rounds[1].name)}</h4><p class="arena-hint">${escapeHTML(ARENA_TOURNAMENT.rounds[1].detail)}</p>${semis}</section>
      <section><h4>${escapeHTML(ARENA_TOURNAMENT.rounds[2].name)}</h4><p class="arena-hint">${escapeHTML(ARENA_TOURNAMENT.rounds[2].detail)}</p><div class="arena-match arena-final"><span class="arena-match-label">TITRE</span><span class="arena-slot">Vainqueur demi-appui 1</span><span class="arena-slot">Vainqueur demi-appui 2</span></div></section>
    </div>
    <section class="arena-rules-strip"><h4>CE QUE LE TITRE ENGAGE</h4><ul>${ARENA_TOURNAMENT.rules.map(rule => `<li>${escapeHTML(rule)}</li>`).join('')}</ul></section>`;
}

function storyView(fighterId) {
  const arc = ARENA_STORY.find(item => item.id === fighterId) || ARENA_STORY[0];
  const fighter = rosterById(arc.id), arena = arenaById(fighter.arena);
  const roster = ARENA_STORY.map(item => {
    const entry = rosterById(item.id);
    return `<button class="arena-roster-card ${item.id === arc.id ? 'active' : ''}" data-fighter="${item.id}" aria-pressed="${item.id === arc.id}" style="--fighter:${entry.accent}"><span><small>${escapeHTML(entry.source.split(' / ')[0])}</small><strong>${escapeHTML(entry.name)}</strong><em>${escapeHTML(entry.epithet)}</em></span><span class="arena-roster-count">${item.fights} DUELS</span></button>`;
  }).join('');
  const ladder = arc.ladder.map((step, index) => `<li><span class="arena-step">ÉPREUVE ${index + 1}</span><strong>${escapeHTML(arenaName(step.opponent))}</strong><p>${escapeHTML(step.stake)}</p></li>`).join('');
  return `<div class="arena-story-layout"><div class="arena-roster"><p class="small-caps">DOSSIERS DISPONIBLES</p>${roster}</div>
    <article class="arena-dossier">
      <p class="eyebrow">${escapeHTML(fighter.source.toUpperCase())} / ${escapeHTML(arena.planet.toUpperCase())}</p>
      <h3>${escapeHTML(fighter.name)} <em>${escapeHTML(fighter.epithet)}</em></h3>
      <p class="arena-arena-line">${escapeHTML(arena.name)} — ${escapeHTML(arena.rule)}</p>
      <p>${escapeHTML(arc.intro)}</p>
      <blockquote>${escapeHTML(arc.introQuote)}</blockquote>
      <dl class="arena-counts"><div><dt>ADVERSAIRES À BATTRE</dt><dd>${arc.fights}</dd></div><div><dt>RIVAL</dt><dd>${escapeHTML(arenaName(arc.rival.opponent))}</dd></div><div><dt>GARDIEN</dt><dd>${escapeHTML(arc.guardian.opponent === arc.id ? 'Unité de réserve' : arenaName(arc.guardian.opponent))}</dd></div></dl>
      <ol class="arena-ladder">${ladder}</ol>
      <div class="arena-duel-card"><p class="small-caps">RIVAL / ${escapeHTML(arc.rival.title.toUpperCase())}</p><strong>${escapeHTML(arenaName(arc.rival.opponent))}</strong><p>${escapeHTML(arc.rival.why)}</p></div>
      <div class="arena-duel-card guardian"><p class="small-caps">GARDIEN / ${escapeHTML(arc.guardian.title.toUpperCase())}</p><strong>${escapeHTML(arc.guardian.opponent === arc.id ? 'Décret de réserve' : arenaName(arc.guardian.opponent))}</strong><p>${escapeHTML(arc.guardian.why)}</p></div>
      <section class="arena-ending"><p class="eyebrow">ÉPILOGUE / ${escapeHTML(arc.ending.title.toUpperCase())}</p><p>${escapeHTML(arc.ending.body)}</p><p class="arena-ending-line">${escapeHTML(arc.ending.line)}</p><div class="arena-ending-actions"><span>Planche prévue : ${escapeHTML(arc.ending.illustration)}</span><button class="text-button" data-arena-illustration="${arc.ending.illustration}">Voir la description de l’illustration →</button></div></section>
      <p class="arena-canon-note">${escapeHTML(fighter.unlock)} Les épilogues sont des pièces d’archive du banc d’essai : ils n’écrivent aucun fait de campagne.</p>
    </article></div>`;
}

function galleryView(lotId) {
  const lots = ARENA_ILLUSTRATION_LOTS.map(lot => ({ ...lot, actual: ARENA_ILLUSTRATIONS.filter(item => item.lot === lot.id).length }));
  const filters = [{ id: 'all', label: 'Tout', actual: ARENA_ILLUSTRATIONS.length }, ...lots]
    .map(lot => `<button class="arena-lot ${lotId === lot.id ? 'active' : ''}" data-illustration-lot="${lot.id}" aria-pressed="${lotId === lot.id}">${escapeHTML(lot.label)} <small>${lot.actual}</small></button>`).join('');
  const activeLot = lots.find(lot => lot.id === lotId);
  const items = ARENA_ILLUSTRATIONS.filter(item => lotId === 'all' || item.lot === lotId);
  return `<p class="arena-gallery-lede">Chaque planche est décrite par son usage, son cadrage, sa lumière et ses interdits de canon. Une image livrée ne vaut pas intégration : le statut reste « À produire » tant que le rendu en jeu, les collisions et la lisibilité ne sont pas reçus.</p><div class="arena-lots">${filters}</div>${activeLot ? `<p class="arena-lot-usage">${escapeHTML(activeLot.usage)}</p>` : ''}<div class="arena-illustrations">${items.map(item => `<article class="arena-illustration"><header><p class="small-caps">${escapeHTML(item.id)} / ${escapeHTML(item.format)}</p><h4>${escapeHTML(item.title)}</h4></header><p><strong>Cadrage.</strong> ${escapeHTML(item.composition)}</p><p><strong>Lumière.</strong> ${escapeHTML(item.light)}</p><p><strong>Canon.</strong> ${escapeHTML(item.canon)}</p><footer><span>${escapeHTML(item.status)}</span><span>${escapeHTML(ARENA_ILLUSTRATION_LOTS.find(lot => lot.id === item.lot)?.label || item.lot)}</span></footer></article>`).join('')}</div>`;
}

function rulesView() {
  const rows = [['Le rite', ARENA_RULES.pitch], ['Origine', ARENA_RULES.origin], ['Marques', ARENA_RULES.marks], ['Bridage', ARENA_RULES.bridage], ['Bêtes reconstituées', ARENA_RULES.beasts], ['Terrains', ARENA_RULES.ground], ['Commandes', ARENA_RULES.controls]];
  return `<div class="arena-rules-layout"><div>${rows.map(([title, body]) => `<article class="arena-rule"><h4>${escapeHTML(title)}</h4><p>${escapeHTML(body)}</p></article>`).join('')}</div><aside class="arena-status"><p class="eyebrow">STATUT DE PRODUCTION</p><p>${escapeHTML(ARENA_RULES.status)}</p><p class="arena-canon-note">${escapeHTML(ARENA_RULES.canon)}</p><dl><dt>COMBATTANTS</dt><dd>${ARENA_ROSTER.length}</dd><dt>DOSSIERS D’HISTOIRE</dt><dd>${ARENA_STORY.length}</dd><dt>PLANCHES DÉCRITES</dt><dd>${ARENA_ILLUSTRATIONS.length}</dd><dt>SAUVEGARDE</dt><dd>Aucun état de campagne modifié</dd></dl></aside></div>`;
}

export function renderArenaView(view, { fighter = 'CER', lot = 'all' } = {}) {
  if (view === 'story') return storyView(fighter);
  if (view === 'gallery') return galleryView(lot);
  if (view === 'rules') return rulesView();
  return tournamentView();
}
