import { CORPS_FILTERS, CORPS_STATUS, WALKER_CORPS, corpsChassis, corpsChassisById, walkerBlueprintSvg } from './walker-corps.mjs';

const legsLabel = legs => `${legs} APPUIS`;

function card(chassis, selected) {
  return `<button class="corps-card${selected ? ' active' : ''}" data-corps-chassis="${chassis.id}" aria-pressed="${selected}">`
    + `<span class="corps-thumb">${walkerBlueprintSvg(chassis, { width: 132 })}</span>`
    + `<span class="corps-card-meta"><small>${chassis.id} · ${legsLabel(chassis.legs)}${chassis.playable ? ' · PILOTABLE' : ''}</small>`
    + `<strong>${chassis.designation} ${chassis.name}</strong><em>${chassis.role}</em></span></button>`;
}

function stat(label, value) {
  return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
}

function dossier(chassis) {
  return `<article class="corps-dossier" aria-live="polite">
    <header><p class="eyebrow">${chassis.id} / ${chassis.archetype.toUpperCase()}</p><h4>${chassis.designation} ${chassis.name}</h4><span class="corps-role">${chassis.role}</span>${chassis.playable ? '<span class="corps-playable">PILOTABLE</span>' : ''}</header>
    <div class="corps-blueprint">${walkerBlueprintSvg(chassis)}<span class="corps-blueprint-note">${chassis.playable ? 'Silhouette de conception · châssis assignable au départ' : 'Silhouette de conception · pas une capture de jeu'}</span></div>
    <dl class="corps-stats">${stat('HAUTEUR', `${chassis.heightM} m`)}${stat('MASSE', `${chassis.massT} t`)}${stat('APPUIS', chassis.legs)}${stat('ÉQUIPAGE', chassis.crew)}${stat('MOBILITÉ', chassis.mobility)}${stat('BLINDAGE', chassis.armor)}</dl>
    <p class="corps-description">${chassis.description}</p>
    <div class="corps-fields">
      <div><p class="eyebrow">FONCTION</p><p>${chassis.function}</p><p class="eyebrow">ARMEMENT</p><p>${chassis.weapon} · <span>${chassis.secondary}</span></p></div>
      <div><p class="eyebrow">DOCTRINE</p><p>${chassis.doctrine}</p></div>
    </div>
    <div class="corps-traits">
      <div><p class="eyebrow">TENUE</p><ul>${chassis.strengths.map(item => `<li>${item}</li>`).join('')}</ul></div>
      <div><p class="eyebrow">VIGILANCE</p><ul>${chassis.weaknesses.map(item => `<li>${item}</li>`).join('')}</ul></div>
    </div>
    <footer class="corps-illustration"><span>${chassis.illustration.id} · ${chassis.illustration.label}</span><small>À PRODUIRE</small><p>${chassis.illustration.brief}</p></footer>
  </article>`;
}

export function renderWalkerCorps({ filter = 'all', selected = WALKER_CORPS[0].id } = {}) {
  const list = corpsChassis(filter);
  const chassis = corpsChassisById(list.some(item => item.id === selected) ? selected : list[0]?.id);
  const filters = CORPS_FILTERS.map(entry =>
    `<button class="corps-filter${entry.id === filter ? ' active' : ''}" data-corps-filter="${entry.id}" aria-pressed="${entry.id === filter}">${entry.short}<small>${corpsChassis(entry.id).length}</small></button>`).join('');
  return `<section class="corps-heading">
      <div><p class="eyebrow">BUREAU DES CHÂSSIS / RÉPERTOIRE DES APPUIS</p><h3>Huit silhouettes.<br><em>Une seule grammaire de marche.</em></h3></div>
      <p class="corps-lede">Le corps expéditionnaire n’a pas six machines, mais un standard : les mêmes joints, les mêmes plaques, la même maintenance. Ces huit châssis couvrent l’éclairage, la patrouille, le transport, l’artillerie et la brèche — du poste découvert au porteur de section.</p>
    </section>
    <div class="corps-status"><span class="corps-badge">${CORPS_STATUS.level.toUpperCase()}</span><p>${CORPS_STATUS.note}</p></div>
    <div class="corps-filters" role="tablist" aria-label="Filtrer par nombre d’appuis">${filters}</div>
    <div class="corps-layout">
      <div class="corps-list">${list.map(item => card(item, chassis.id === item.id)).join('')}</div>
      ${dossier(chassis)}
    </div>
    <p class="corps-note">Silhouettes originales, dessinées pour ce répertoire : aucun nom, aucune coque et aucun récit ne reprend une franchise existante. Les archétypes de marcheurs classiques servent de brief de fonction et de proportions. Les planches illustrées AW13–AW20 restent à produire.</p>`;
}
