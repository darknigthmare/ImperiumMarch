# Production vectorielle et sonore — 0.9

Ce répertoire contient des livrables originaux et réutilisables d’**ORDRE DE CENDRE**. Les planches sont des bancs de production, pas des captures du navigateur. Les états de dessin et les signaux audio suivent des données existantes ; ils ne créent ni collisions, ni personnages survivants, ni preuves, ni nouveaux châssis jouables.

## Livrables

- **Six rigs** : Vigie WK01, Caracal WK02, Bastion WK05, Arpenteur WK06, Pèlerin WK09, Cloporte WK10. Chacun possède huit pièces exportées séparément : coque, tourelle, segment supérieur, segment inférieur, hanche, genou, pied, radiateur. Les couches proche/lointaine, les pivots et chaque membre sont identifiés. Les variations de construction dépassent la couleur : carénages courts, renfort de brèche, nacelle haute, équipements démontables et toit segmenté.
- **Six poses par rig** : profil droit, profil gauche avec textes lisibles, ancrage, marche, élévation du canon, diagnostic de dégâts. Les poses de marche/ancrage utilisent les entrées publiques de la simulation ; la planche de dégâts est un diagnostic artistique déclaré, pas une preuve de dégâts joués. La feuille commune garde une seule échelle.
- **Radiateur** : normal, touché, dégradé, réparé ; cinq étapes d’une réparation de quatre secondes. La progression affichée est fournie par la simulation, jamais par une horloge indépendante. La boîte vulnérable demeure celle de `radiatorBounds`.
- **Douze silhouettes distinctes**, dont six études de châssis conçus non jouables : Héron, Linceul, Loutre, Cataphracte, Mégalithe et Noria. Leurs capacités finales ne sont pas implémentées par ces dessins.
- **Vingt et un composants** : ambulance, balise, caisse sanitaire, rampe, panneau de digue, pompe auxiliaire, vanne, deux façades, repère de marée, dock, ferry, barges Saisie et Rive-Courte, treuil, porte d’écluse, mécanisme indépendant, Veille d’Aval, refuge, turbine et poste de maintenance. Les épaves sont dépourvues de personnages ou de documents magiquement lisibles. La balise perdue montre son support abîmé ; la balise récupérée garde son module et ses attaches.
- **Audio** : 44 signaux, huit ambiances planétaires différentes, trois motifs composés pour le projet et un montage d’écoute de 36 secondes. Les 56 WAV PCM mono 22 050 Hz/16 bits proviennent des mêmes fonctions de synthèse que l’AudioEngine. Aucun enregistrement, échantillon externe ou voix humaine n’est utilisé.

Les décomptes exacts, tailles, empreintes SHA-256 et identifiants AS figurent dans [manifest.json](manifest.json) et [audio/manifest.json](audio/manifest.json). [audio/index.html](audio/index.html) est une page d’écoute locale sans dépendance externe.

## Source unique SVG / Canvas

`src/production-assets.mjs` produit une liste de primitives simples : polygones, rectangles, cercles, traits, texte et courbes. `drawProductionGeometry` consomme cette liste avec les méthodes Canvas standard. `productionGeometrySVG` sérialise les mêmes primitives ; aucun PNG ou tracé raster n’est embarqué. Les SVG conservent leurs groupes de pièces et sont modifiables comme vecteurs.

```js
import { drawProductionPart } from './production-assets.mjs';

// Coque : x/y au centre de la coque, dimensions nominales de la simulation.
drawProductionPart(ctx, {
  walkerId: walker.id, part: 'hull',
  x: player.x, y: player.y, width: player.width, height: player.height,
  facing: player.facing, state: 'normal',
});

// Segment : le pivot initial reste fixe ; l’extrémité utilise la longueur réelle.
drawProductionPart(ctx, {
  walkerId: walker.id, part: 'upper', x: hipX, y: hipY,
  width: Math.hypot(kneeX - hipX, kneeY - hipY), height: 23,
  rotation: Math.atan2(kneeY - hipY, kneeX - hipX), back: true,
});

// Pied : y est exactement la ligne de contact autoritaire, sans nouveau terrain.
drawProductionPart(ctx, { walkerId: walker.id, part: 'foot', x: foot.x, y: foot.y });

// La balise reste à sa propre boîte sur la caisse de l’ambulance.
drawProductionPart(ctx, {
  part: 'beacon', x: beacon.x, y: beacon.y, width: beacon.w, height: beacon.h,
  state: beacon.destroyed ? 'lost' : beacon.recovered ? 'recovered'
    : beacon.working ? 'dismantling' : 'attached', progress: beacon.progress,
});
```

L’origine `(x,y)` désigne un **pivot mécanique**, pas le coin supérieur gauche d’une planche. `width` et `height` redimensionnent la **taille nominale** (`geometry.size`), distincte de l’encombrement d’encre (`geometry.bounds`). `rotation` est en radians. `back` sélectionne la couche lointaine. `facing:-1` retourne la pièce et redresse ses textes. Une cache bornée conserve les géométries du renderer ; la progression visuelle est quantifiée à 1/128 uniquement dans cette cache, sans modification du fait simulé.

`productionLegPose(player, walker, foot)` reprend l’IK du renderer antérieur. `productionWalkerParts(player, walker)` renvoie une composition ordonnée depuis les vrais pieds : membres lointains, coque, membres proches, tourelle, radiateur. Ces fonctions sont pures. Elles peuvent servir au renderer ou aux outils ; elles ne remplacent pas la simulation.

### Écluse et bateaux

- `gate` : tôle et rails, taille nominale 96 × 180. `progress` représente l’**ouverture réelle** de 0 à 1 ; `open` est une commodité pour 1. Le panneau monte visuellement sur ses rails.
- `gate-mechanism` : pièce indépendante 56 × 52 à `gate.mechanism.x/y`. Les commandes ne sont pas collées au panneau : le décalage de référence est −220 unités en x et +64 en y. Les coordonnées de la simulation prévalent.
- `barge-rive-courte` : 184 × 68 ; `boat-veille-aval` : 164 × 64, coque et cabine municipale distinctes. Les rampes et personnes restent des entités séparées.
- Les dessins d’arrivée ne confirment aucune arrivée dans la campagne. Le renderer les sélectionne seulement depuis `boat.arrived`, `person.safe`, `vehicle.arrived` ou le fait correspondant.

## API audio

L’API antérieure reste disponible : `unlock()`, `setVolume(value)`, `event(type)`, `tone(...)`, `hiss(...)`.

```js
const audio = new AudioEngine();
await audio.unlock(); // geste utilisateur ; un refus reste sans effet sur le jeu

audio.setScene({ planetId: game.planetId, missionId: game.missionId, mood: 'imperial' });
audio.update(game); // premier relevé = baseline silencieuse

// À chaque image jouée : observation des faits + sons d’événements classiques.
audio.update(game);
for (const event of newEvents) audio.event(event, game);

audio.setPaused(true);   // pause, menu, bilan ou onglet masqué
audio.setPaused(false);  // reprise des boucles seulement
await audio.dispose();
```

`event` accepte une chaîne ou `{type, soundCue?}`. Il conserve les tirs, roquettes, pas, impacts, explosions, rechargements et ouvertures radio. Les pas changent entre Vesper, Nacre et Thyr. Le son radio est un signal de liaison, jamais un doublage.

`update(game)` observe séparément les faits physiques : radiateur touché, réparation commencée/interrompue/kit consommé, relais inspectés, contrôle réellement arrivé, raccordement de pompe, turbine refroidie, treuil, tablier, panneau verrouillé, logement inondé, consentement recueilli, balise récupérée ou perdue, saisie annoncée puis arrivée réelle, départ du transfert, personnes arrivées. Pour MI08, il distingue l’ouverture/fermeture réelle des portes, embarquement, mise en mouvement, sortie de la zone des portes, arrivée du bateau et arrivée individuelle. Les événements `gate`, `boarding`, `departure`, `arrival` de MI08 restent porteurs de leurs textes ; les sons correspondants passent par les faits observés afin d’éviter le doublon.

Au premier appel, après `setScene`, après changement de mission/graine ou après retour de l’horloge en arrière, le moteur mémorise l’état **sans rejouer les acquis d’un checkpoint**. Il continue de mémoriser sous mute pour éviter de rejouer l’historique au retour du son. Aucune décision locale ne sélectionne automatiquement le motif de rupture : `mood` est explicitement `imperial`, `crew`, `fracture` ou `none`.

Les boucles et effets sont bornés à 24 sources. Pause, mute et changement de scène arrêtent les sources après une extinction de 25 ms ; les nœuds sont déconnectés à leur fin. Les sons de menace et les ouvertures radio atténuent temporairement l’ambiance et la musique. Aucun intervalle ou minuteur JavaScript n’entretient la lecture.

## Reproduction et contrôles

```sh
# Tests purs : aucune dépendance à installer.
node --test tests/production-assets.test.mjs tests/production-audio.test.mjs

# Dépendance de développement uniquement, même version que la CI.
npm install --no-save --no-package-lock --ignore-scripts @napi-rs/canvas@0.1.100
npm run check:assets-render

# Régénération volontaire des exports.
node tools/build-production-assets.mjs
node tools/build-production-audio.mjs
```

La suite `npm test` ne charge aucune bibliothèque de rendu. Le lot assets/audio compte **18 tests purs**, plus **un contrôle raster dédié couvrant cinq pièces et états** avec `npm run check:assets-render`. La CI exécute d’abord les tests purs, installe ensuite explicitement **`@napi-rs/canvas@0.1.100`**, puis exécute le contrôle raster : aucune preuve n’est ignorée si le package manque. L’installation ne modifie ni les dépendances du projet ni un lockfile et n’exécute pas les scripts d’installation. La bibliothèque et ses binaires optionnels sont réservés à la vérification et à la génération d’images ; le jeu web et l’HTML autonome restent sans dépendance au runtime. Le générateur audio utilise seulement Node.

Les tests purs contrôlent les dimensions et pivots canoniques, les chaînes identifiées de membres, les contacts de pieds en mouvement réel, la boîte du radiateur inchangée, les empreintes des exports, la synthèse finie et reproductible, les huit boucles distinctes, l’égalité PCM/WAV, le plafonnement des sources et leur nettoyage après pause/mute. Un parcours MI07 public vérifie le consentement, l’examen, la temporisation réelle de la saisie, le transfert puis six arrivées individuelles. Le test MI08 audio est un test de transitions de faits, pas un parcours de mission ; le pilote et les preuves de parcours sont gérés dans le lot de gameplay. Le contrôle raster séparé compare les formes SVG et Canvas sur cinq cas : coque d’Arpenteur, segment de Cloporte, radiateur endommagé, ambulance et balise perdue. Il impose une surface visible minimale et un recouvrement des masques supérieur à 92 %, avec échec explicite si la bibliothèque n’est pas installée.

## Couverture des lots et travail restant

| Lots | Livrable concret ici | Limites conservées |
| --- | --- | --- |
| AS02, AS03, AS04, AS31 | Pièces, pivots, couches, assemblages, poses et diagnostics des six rigs | Inspection finale intégrée en mouvement, recul secondaire, gestes/animation de production et validation humaine |
| AS05 | Douze silhouettes dont les neuf châssis complémentaires aux trois premiers | Six restent conçus ; rigs détaillés et gameplay de ces six modèles à produire |
| AS36, AS41 | Radiateur distinct, quatre états et séquence de maintenance quatre secondes | Autres composants localisés et châssis ennemis non produits ; validation finale en contexte |
| AS17, AS44–AS46, AS48–AS50, AS52, AS60 | Kit de modules, ancres et variantes propres aux infrastructures, véhicules et balise | Matières animées complètes, équipages animés, finition des environnements et inspection intégrée selon chaque lot |
| AS39, AS40 | Turbine, vanne, pompe et poste/ruine vectoriels | Kit Vesper complet et validation de niveau fini encore ouverts |
| AS25–AS27, AS34, AS42, AS47, AS54, AS62 | Synthèse réutilisable, 44 signaux, huit ambiances, trois motifs, exports et page d’écoute | Voix humaines, jeu d’acteur, sons enregistrés éventuels, mix final et écoute humaine en combat non certifiés |
| AS30, AS38 | Manifestes, hashes, provenance, droits déclarés, pivots, dimensions, usages et dépendances | Toute future substitution doit conserver ces contrats et recevoir sa validation d’intégration |

La présence d’un export ou le passage de tests Node ne transforme pas un lot entier en « art final ». La bible doit conserver séparément la production, l’intégration réelle et les critères de finition encore ouverts.
