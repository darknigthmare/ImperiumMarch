# Rapprochement exhaustif des médias distribués

Snapshot : 2026-11-11T17:08:10.239Z. Révision de repère : f2270608ea23e7b9589b8fc9a6f81a6a59341d02. Le relevé porte sur les fichiers courants, y compris les travaux non commités.

## Résultat

388 médias sources possèdent une entrée. Les artefacts actuellement observés contiennent 388 médias web et 5 occurrences inline (3 contenus distincts). **0 média non rapproché ou anomalie de provenance.** La source du jeu demande trois fichiers image : illustration du menu, panorama Vesper et emblème. Les formes de production sont du code Canvas ; le son est synthétisé. Aucun WAV de production n’est embarqué dans le HTML observé.

Éditions observées : source UI 0.10, HTML autonome 0.10, web 0.10. **Synchronisation des builds : oui.**

Les médias copiés et le graphe des modules sont synchronisés avec la source observée.

## Provenance et absences explicites

Les deux PNG historiques proviennent d’image_gen selon docs/ASSET_PROVENANCE.md, qui conserve leurs prompts complets et précise l’absence d’image de référence. Leur première introduction est le commit 78e2b11 (version 0.1.0, 10 novembre 2026). Cette date est une date de dépôt, pas une heure de génération. Le modèle exact, le numéro de génération et un acte de licence distinct ne sont pas présents ; le manifeste les garde absents. L’emblème est déclaré géométrique et original, sans auteur individuel nommé. Aucune licence ou autorisation supplémentaire n’a été inventée.

Le lot de Thyr ajoute onze composants, trente-cinq SVG et deux planches PNG, issus de src/thyr-assets.mjs et employés par src/thyr-renderer.mjs. Les surfaces des racines suivent la simulation ; les décors ne recensent aucun habitant. Les membranes FL08 restent décoratives et FL09 n’apporte ici qu’une réaction visuelle.

Les nouveaux vecteurs et sons renvoient à leurs manifestes de production datés et versionnés, avec code source et hashes. Les WAV reproduisent la synthèse du runtime ; aucune voix humaine, aucun échantillon tiers ni validation humaine de mix n’est déclaré. Aucun fichier de police n’est distribué ; les noms de polices sont des fallbacks système.

La page officielle Steam de **BE-A Walker** est enregistrée comme référence de conception non distribuée. Aucun fichier local de cette référence n’est documenté : il n’existe donc pas de hash local ou d’autorisation de redistribution à inventer. Tous les octets média effectivement observés sont rapprochés des fichiers originaux du projet. Les 288 médias de documentation sont recensés séparément et exclus des deux politiques de build.

## Médias réellement demandés par le jeu

| Fichier | Origine | Usage | Inline observé | Web observé |
| --- | --- | --- | --- | --- |
| assets/art/key-art.png | legacy-key-art | Main-menu illustration and background; also linked from README. Artistic target, not an articulated playable chassis. | 2 occurrence(s) | oui |
| assets/art/vesper-panorama.png | legacy-vesper-panorama | Distant parallax background of Vesper in the production Canvas renderer. | 1 occurrence(s) | oui |
| assets/emblem.svg | legacy-emblem | Browser favicon and menu brand emblem. | 2 occurrence(s) | oui |

## Inventaire complet par fichier

« Web absent » indique ici un export qui n’a pas encore été copié dans le build observé ; le générateur web copie tout assets/ lors de la prochaine reconstruction. Les exports restent disponibles sans être chargés par le runtime. Les hashes complets, dimensions, ancres et références sont dans distribution-manifest.json.

| Fichier | Version | Registre d’origine | Usage / état | Inline | Web |
| --- | --- | --- | --- | --- | --- |
| assets/art/key-art.png | 0.1.0 introduction | legacy-key-art | Main-menu illustration and background; also linked from README. Artistic target, not an articulated playable chassis. | oui | oui |
| assets/art/vesper-panorama.png | 0.1.0 introduction | legacy-vesper-panorama | Distant parallax background of Vesper in the production Canvas renderer. | oui | oui |
| assets/emblem.svg | 0.1.0 introduction | legacy-emblem | Browser favicon and menu brand emblem. | oui | oui |
| assets/production/audio/ambience-pl01.wav | 0.9.0 | production-audio | Vesper — Cendre, conduite et ateliers lointains | non | oui |
| assets/production/audio/ambience-pl02.wav | 0.9.0 | production-audio | Nacre — Eau contre les palées, clapot et brume saline | non | oui |
| assets/production/audio/ambience-pl03.wav | 0.9.0 | production-audio | Thyr — Frottement végétal et appels non humains | non | oui |
| assets/production/audio/ambience-pl04.wav | 0.9.0 | production-audio | Kharon — Souffle de hauts fourneaux et tôles thermiques | non | oui |
| assets/production/audio/ambience-pl05.wav | 0.9.0 | production-audio | Sereis — Vent froid, neige dure et craquement de glace | non | oui |
| assets/production/audio/ambience-pl06.wav | 0.9.0 | production-audio | Ilex — Lamelles minérales et résonances de canopée | non | oui |
| assets/production/audio/ambience-pl07.wav | 0.9.0 | production-audio | Méridien — Canal lent, mécanisme agricole et vent de plaine | non | oui |
| assets/production/audio/ambience-pl08.wav | 0.9.0 | production-audio | Orthe — Ville de pierre, atelier et trafic distant | non | oui |
| assets/production/audio/cue-beacon-lost.wav | 0.9.0 | production-audio | Balise détruite, données non récupérées | non | oui |
| assets/production/audio/cue-beacon-recovered.wav | 0.9.0 | production-audio | Attaches et balise récupérées | non | oui |
| assets/production/audio/cue-boarding-complete.wav | 0.9.0 | production-audio | Embarquement individuel acquis | non | oui |
| assets/production/audio/cue-boat-departed.wav | 0.9.0 | production-audio | Bateau sorti de la zone des portes, arrivée encore attendue | non | oui |
| assets/production/audio/cue-bridge-lock.wav | 0.9.0 | production-audio | Tablier verrouillé | non | oui |
| assets/production/audio/cue-civil-signal.wav | 0.9.0 | production-audio | Émission civile identifiée | non | oui |
| assets/production/audio/cue-consent-recorded.wav | 0.9.0 | production-audio | Accord effectivement recueilli, sans parole synthétique | non | oui |
| assets/production/audio/cue-control-arrival.wav | 0.9.0 | production-audio | Drone de contrôle effectivement présent | non | oui |
| assets/production/audio/cue-decision.wav | 0.9.0 | production-audio | Dossier disponible | non | oui |
| assets/production/audio/cue-defeat.wav | 0.9.0 | production-audio | Arrêt du marcheur | non | oui |
| assets/production/audio/cue-dike-load.wav | 0.9.0 | production-audio | Charge prise par le panneau | non | oui |
| assets/production/audio/cue-engine-arrive.wav | 0.9.0 | production-audio | Moteur revenu au ralenti à destination | non | oui |
| assets/production/audio/cue-engine-depart.wav | 0.9.0 | production-audio | Départ réel du véhicule | non | oui |
| assets/production/audio/cue-explosion.wav | 0.9.0 | production-audio | Détonation et débris | non | oui |
| assets/production/audio/cue-gate-lock.wav | 0.9.0 | production-audio | Verrou d’écluse effectivement engagé | non | oui |
| assets/production/audio/cue-gate-open.wav | 0.9.0 | production-audio | Porte d’écluse réellement ouverte | non | oui |
| assets/production/audio/cue-hit.wav | 0.9.0 | production-audio | Impact sur blindage | non | oui |
| assets/production/audio/cue-hydraulic-brace.wav | 0.9.0 | production-audio | Verrouillage des appuis | non | oui |
| assets/production/audio/cue-inspection-complete.wav | 0.9.0 | production-audio | Inspection effectivement achevée | non | oui |
| assets/production/audio/cue-military-signal.wav | 0.9.0 | production-audio | Émission militaire identifiée | non | oui |
| assets/production/audio/cue-objective.wav | 0.9.0 | production-audio | Objectif local confirmé | non | oui |
| assets/production/audio/cue-overheat.wav | 0.9.0 | production-audio | Alarme thermique | non | oui |
| assets/production/audio/cue-person-arrived.wav | 0.9.0 | production-audio | Une personne a effectivement atteint l’accueil | non | oui |
| assets/production/audio/cue-pressure-warning.wav | 0.9.0 | production-audio | Seuil de fatigue ou de pression réellement atteint | non | oui |
| assets/production/audio/cue-pump-start.wav | 0.9.0 | production-audio | Pompe raccordée, circuit en charge | non | oui |
| assets/production/audio/cue-radiator-hit.wav | 0.9.0 | production-audio | Impact local sur les ailettes | non | oui |
| assets/production/audio/cue-radio.wav | 0.9.0 | production-audio | Ouverture du canal radio, sans voix | non | oui |
| assets/production/audio/cue-relay-secured.wav | 0.9.0 | production-audio | Conduit sécurisé | non | oui |
| assets/production/audio/cue-reload.wav | 0.9.0 | production-audio | Verrou, transfert puis fermeture du magasin | non | oui |
| assets/production/audio/cue-repair-cancel.wav | 0.9.0 | production-audio | Outil retiré, réparation interrompue | non | oui |
| assets/production/audio/cue-repair-complete.wav | 0.9.0 | production-audio | Circuit réparé, kit consommé | non | oui |
| assets/production/audio/cue-repair-start.wav | 0.9.0 | production-audio | Ouverture de la maintenance | non | oui |
| assets/production/audio/cue-rocket.wav | 0.9.0 | production-audio | Mise à feu de la roquette | non | oui |
| assets/production/audio/cue-seizure-warning.wav | 0.9.0 | production-audio | Signal de saisie effectivement annoncé | non | oui |
| assets/production/audio/cue-shot.wav | 0.9.0 | production-audio | Départ du canon, culasse et recul | non | oui |
| assets/production/audio/cue-step-fibre.wav | 0.9.0 | production-audio | Appui sur sol fibreux | non | oui |
| assets/production/audio/cue-step-wet.wav | 0.9.0 | production-audio | Appui sur quai mouillé, eau déplacée | non | oui |
| assets/production/audio/cue-step.wav | 0.9.0 | production-audio | Appui lourd sur sol minéral | non | oui |
| assets/production/audio/cue-transfer-start.wav | 0.9.0 | production-audio | Début matériel du transfert individuel | non | oui |
| assets/production/audio/cue-turbine-cooled.wav | 0.9.0 | production-audio | Turbine stabilisée | non | oui |
| assets/production/audio/cue-victory.wav | 0.9.0 | production-audio | Fin de sortie, résolution retenue | non | oui |
| assets/production/audio/cue-water-warning.wav | 0.9.0 | production-audio | Eau entrée dans un logement | non | oui |
| assets/production/audio/cue-winch-load.wav | 0.9.0 | production-audio | Treuil mis en charge | non | oui |
| assets/production/audio/cue-winch-release.wav | 0.9.0 | production-audio | Treuil libéré | non | oui |
| assets/production/audio/motif-crew.wav | 0.9.0 | production-audio | Le fil gardé | non | oui |
| assets/production/audio/motif-fracture.wav | 0.9.0 | production-audio | Ordre interrompu | non | oui |
| assets/production/audio/motif-imperial.wav | 0.9.0 | production-audio | Pas mesurés | non | oui |
| assets/production/audio/preview-nacre-library.wav | 0.9.0 | production-audio | Montage de bibliothèque Nacre / aucune voix / aucun parcours revendiqué | non | oui |
| assets/production/nacre/ambulance-damaged.svg | 0.9.0 | production-vector | Reusable vector component: ambulance; damaged | non | oui |
| assets/production/nacre/ambulance-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: ambulance; destroyed | non | oui |
| assets/production/nacre/ambulance-normal.svg | 0.9.0 | production-vector | Reusable vector component: ambulance; normal | non | oui |
| assets/production/nacre/auxiliary-pump-active.svg | 0.9.0 | production-vector | Reusable vector component: auxiliary-pump; active | non | oui |
| assets/production/nacre/auxiliary-pump-connected.svg | 0.9.0 | production-vector | Reusable vector component: auxiliary-pump; connected | non | oui |
| assets/production/nacre/auxiliary-pump-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: auxiliary-pump; destroyed | non | oui |
| assets/production/nacre/auxiliary-pump-normal.svg | 0.9.0 | production-vector | Reusable vector component: auxiliary-pump; normal | non | oui |
| assets/production/nacre/barge-rive-courte-arrived.svg | 0.9.0 | production-vector | Reusable vector component: barge-rive-courte; arrived | non | oui |
| assets/production/nacre/barge-rive-courte-boarding.svg | 0.9.0 | production-vector | Reusable vector component: barge-rive-courte; boarding | non | oui |
| assets/production/nacre/barge-rive-courte-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: barge-rive-courte; destroyed | non | oui |
| assets/production/nacre/barge-rive-courte-moving.svg | 0.9.0 | production-vector | Reusable vector component: barge-rive-courte; moving | non | oui |
| assets/production/nacre/barge-rive-courte-waiting.svg | 0.9.0 | production-vector | Reusable vector component: barge-rive-courte; waiting | non | oui |
| assets/production/nacre/barge-seizure-damaged.svg | 0.9.0 | production-vector | Reusable vector component: barge-seizure; damaged | non | oui |
| assets/production/nacre/barge-seizure-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: barge-seizure; destroyed | non | oui |
| assets/production/nacre/barge-seizure-normal.svg | 0.9.0 | production-vector | Reusable vector component: barge-seizure; normal | non | oui |
| assets/production/nacre/barge-seizure-released.svg | 0.9.0 | production-vector | Reusable vector component: barge-seizure; released | non | oui |
| assets/production/nacre/beacon-attached.svg | 0.9.0 | production-vector | Reusable vector component: beacon; attached | non | oui |
| assets/production/nacre/beacon-dismantling.svg | 0.9.0 | production-vector | Reusable vector component: beacon; dismantling | non | oui |
| assets/production/nacre/beacon-lost.svg | 0.9.0 | production-vector | Reusable vector component: beacon; lost | non | oui |
| assets/production/nacre/beacon-recovered.svg | 0.9.0 | production-vector | Reusable vector component: beacon; recovered | non | oui |
| assets/production/nacre/boat-veille-aval-arrived.svg | 0.9.0 | production-vector | Reusable vector component: boat-veille-aval; arrived | non | oui |
| assets/production/nacre/boat-veille-aval-boarding.svg | 0.9.0 | production-vector | Reusable vector component: boat-veille-aval; boarding | non | oui |
| assets/production/nacre/boat-veille-aval-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: boat-veille-aval; destroyed | non | oui |
| assets/production/nacre/boat-veille-aval-moving.svg | 0.9.0 | production-vector | Reusable vector component: boat-veille-aval; moving | non | oui |
| assets/production/nacre/boat-veille-aval-waiting.svg | 0.9.0 | production-vector | Reusable vector component: boat-veille-aval; waiting | non | oui |
| assets/production/nacre/cooling-turbine-cooled.svg | 0.9.0 | production-vector | Reusable vector component: cooling-turbine; cooled | non | oui |
| assets/production/nacre/cooling-turbine-hot.svg | 0.9.0 | production-vector | Reusable vector component: cooling-turbine; hot | non | oui |
| assets/production/nacre/cooling-turbine-working.svg | 0.9.0 | production-vector | Reusable vector component: cooling-turbine; working | non | oui |
| assets/production/nacre/dike-panel-damaged.svg | 0.9.0 | production-vector | Reusable vector component: dike-panel; damaged | non | oui |
| assets/production/nacre/dike-panel-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: dike-panel; destroyed | non | oui |
| assets/production/nacre/dike-panel-locked.svg | 0.9.0 | production-vector | Reusable vector component: dike-panel; locked | non | oui |
| assets/production/nacre/dike-panel-normal.svg | 0.9.0 | production-vector | Reusable vector component: dike-panel; normal | non | oui |
| assets/production/nacre/dike-panel-supported.svg | 0.9.0 | production-vector | Reusable vector component: dike-panel; supported | non | oui |
| assets/production/nacre/dock-damaged.svg | 0.9.0 | production-vector | Reusable vector component: dock; damaged | non | oui |
| assets/production/nacre/dock-normal.svg | 0.9.0 | production-vector | Reusable vector component: dock; normal | non | oui |
| assets/production/nacre/ferry-arrived.svg | 0.9.0 | production-vector | Reusable vector component: ferry; arrived | non | oui |
| assets/production/nacre/ferry-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: ferry; destroyed | non | oui |
| assets/production/nacre/ferry-moving.svg | 0.9.0 | production-vector | Reusable vector component: ferry; moving | non | oui |
| assets/production/nacre/ferry-waiting.svg | 0.9.0 | production-vector | Reusable vector component: ferry; waiting | non | oui |
| assets/production/nacre/gate-blocked.svg | 0.9.0 | production-vector | Reusable vector component: gate; blocked | non | oui |
| assets/production/nacre/gate-closed.svg | 0.9.0 | production-vector | Reusable vector component: gate; closed | non | oui |
| assets/production/nacre/gate-damaged.svg | 0.9.0 | production-vector | Reusable vector component: gate; damaged | non | oui |
| assets/production/nacre/gate-mechanism-damaged.svg | 0.9.0 | production-vector | Reusable vector component: gate-mechanism; damaged | non | oui |
| assets/production/nacre/gate-mechanism-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: gate-mechanism; destroyed | non | oui |
| assets/production/nacre/gate-mechanism-normal.svg | 0.9.0 | production-vector | Reusable vector component: gate-mechanism; normal | non | oui |
| assets/production/nacre/gate-mechanism-working.svg | 0.9.0 | production-vector | Reusable vector component: gate-mechanism; working | non | oui |
| assets/production/nacre/gate-open.svg | 0.9.0 | production-vector | Reusable vector component: gate; open | non | oui |
| assets/production/nacre/gate-working.svg | 0.9.0 | production-vector | Reusable vector component: gate; working | non | oui |
| assets/production/nacre/house-a-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: house-a; destroyed | non | oui |
| assets/production/nacre/house-a-dry.svg | 0.9.0 | production-vector | Reusable vector component: house-a; dry | non | oui |
| assets/production/nacre/house-a-exposed.svg | 0.9.0 | production-vector | Reusable vector component: house-a; exposed | non | oui |
| assets/production/nacre/house-a-flooded.svg | 0.9.0 | production-vector | Reusable vector component: house-a; flooded | non | oui |
| assets/production/nacre/house-b-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: house-b; destroyed | non | oui |
| assets/production/nacre/house-b-dry.svg | 0.9.0 | production-vector | Reusable vector component: house-b; dry | non | oui |
| assets/production/nacre/house-b-exposed.svg | 0.9.0 | production-vector | Reusable vector component: house-b; exposed | non | oui |
| assets/production/nacre/house-b-flooded.svg | 0.9.0 | production-vector | Reusable vector component: house-b; flooded | non | oui |
| assets/production/nacre/maintenance-post-damaged.svg | 0.9.0 | production-vector | Reusable vector component: maintenance-post; damaged | non | oui |
| assets/production/nacre/maintenance-post-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: maintenance-post; destroyed | non | oui |
| assets/production/nacre/maintenance-post-normal.svg | 0.9.0 | production-vector | Reusable vector component: maintenance-post; normal | non | oui |
| assets/production/nacre/medical-case-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: medical-case; destroyed | non | oui |
| assets/production/nacre/medical-case-inspecting.svg | 0.9.0 | production-vector | Reusable vector component: medical-case; inspecting | non | oui |
| assets/production/nacre/medical-case-normal.svg | 0.9.0 | production-vector | Reusable vector component: medical-case; normal | non | oui |
| assets/production/nacre/medical-case-verified.svg | 0.9.0 | production-vector | Reusable vector component: medical-case; verified | non | oui |
| assets/production/nacre/ramp-closed.svg | 0.9.0 | production-vector | Reusable vector component: ramp; closed | non | oui |
| assets/production/nacre/ramp-prepared.svg | 0.9.0 | production-vector | Reusable vector component: ramp; prepared | non | oui |
| assets/production/nacre/ramp-working.svg | 0.9.0 | production-vector | Reusable vector component: ramp; working | non | oui |
| assets/production/nacre/refuge-damaged.svg | 0.9.0 | production-vector | Reusable vector component: refuge; damaged | non | oui |
| assets/production/nacre/refuge-normal.svg | 0.9.0 | production-vector | Reusable vector component: refuge; normal | non | oui |
| assets/production/nacre/refuge-receiving.svg | 0.9.0 | production-vector | Reusable vector component: refuge; receiving | non | oui |
| assets/production/nacre/routing-valve-completed.svg | 0.9.0 | production-vector | Reusable vector component: routing-valve; completed | non | oui |
| assets/production/nacre/routing-valve-normal.svg | 0.9.0 | production-vector | Reusable vector component: routing-valve; normal | non | oui |
| assets/production/nacre/routing-valve-working.svg | 0.9.0 | production-vector | Reusable vector component: routing-valve; working | non | oui |
| assets/production/nacre/tide-marker-normal.svg | 0.9.0 | production-vector | Reusable vector component: tide-marker; normal | non | oui |
| assets/production/nacre/winch-destroyed.svg | 0.9.0 | production-vector | Reusable vector component: winch; destroyed | non | oui |
| assets/production/nacre/winch-loaded.svg | 0.9.0 | production-vector | Reusable vector component: winch; loaded | non | oui |
| assets/production/nacre/winch-normal.svg | 0.9.0 | production-vector | Reusable vector component: winch; normal | non | oui |
| assets/production/nacre/winch-released.svg | 0.9.0 | production-vector | Reusable vector component: winch; released | non | oui |
| assets/production/previews/current-vs-production.png | 0.9.0 | production-vector | Canvas comparison, not browser screenshot | non | oui |
| assets/production/previews/nacre-components.png | 0.9.0 | production-vector | Production artwork preview | non | oui |
| assets/production/previews/parts-damage-repair.png | 0.9.0 | production-vector | Production artwork preview | non | oui |
| assets/production/previews/silhouettes-twelve.png | 0.9.0 | production-vector | Production artwork preview | non | oui |
| assets/production/previews/walkers-six-common-scale.png | 0.9.0 | production-vector | Vector asset bench with shared runtime geometry | non | oui |
| assets/production/silhouettes/wk01.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk02.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk03.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk04.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk05.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk06.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk07.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk08.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk09.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk10.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk11.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/silhouettes/wk12.svg | 0.9.0 | production-vector | Reusable vector component: silhouette; concept | non | oui |
| assets/production/walkers/wk01/assembly-aim-up.svg | 0.9.0 | production-vector | Articulation reference: aim-up | non | oui |
| assets/production/walkers/wk01/assembly-brace.svg | 0.9.0 | production-vector | Articulation reference: brace | non | oui |
| assets/production/walkers/wk01/assembly-damaged.svg | 0.9.0 | production-vector | Articulation reference: damaged | non | oui |
| assets/production/walkers/wk01/assembly-stand-left.svg | 0.9.0 | production-vector | Articulation reference: stand-left | non | oui |
| assets/production/walkers/wk01/assembly-stand-right.svg | 0.9.0 | production-vector | Articulation reference: stand-right | non | oui |
| assets/production/walkers/wk01/assembly-walk.svg | 0.9.0 | production-vector | Articulation reference: walk | non | oui |
| assets/production/walkers/wk01/foot-far.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk01/foot-near.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk01/hip-far.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk01/hip-near.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk01/hull-braced.svg | 0.9.0 | production-vector | Reusable vector component: hull; braced | non | oui |
| assets/production/walkers/wk01/hull-damaged.svg | 0.9.0 | production-vector | Reusable vector component: hull; damaged | non | oui |
| assets/production/walkers/wk01/hull-far.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk01/hull-near.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk01/hull-repaired.svg | 0.9.0 | production-vector | Reusable vector component: hull; repaired | non | oui |
| assets/production/walkers/wk01/knee-far.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk01/knee-near.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk01/lower-far.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk01/lower-near.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk01/radiator-damaged.svg | 0.9.0 | production-vector | Reusable vector component: radiator; damaged | non | oui |
| assets/production/walkers/wk01/radiator-far.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk01/radiator-hit.svg | 0.9.0 | production-vector | Reusable vector component: radiator; hit | non | oui |
| assets/production/walkers/wk01/radiator-near.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk01/radiator-repair-0s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk01/radiator-repair-1s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk01/radiator-repair-2s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk01/radiator-repair-3s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk01/radiator-repair-4s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk01/radiator-repaired.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repaired | non | oui |
| assets/production/walkers/wk01/turret-far.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk01/turret-near.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk01/upper-far.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk01/upper-near.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk02/assembly-aim-up.svg | 0.9.0 | production-vector | Articulation reference: aim-up | non | oui |
| assets/production/walkers/wk02/assembly-brace.svg | 0.9.0 | production-vector | Articulation reference: brace | non | oui |
| assets/production/walkers/wk02/assembly-damaged.svg | 0.9.0 | production-vector | Articulation reference: damaged | non | oui |
| assets/production/walkers/wk02/assembly-stand-left.svg | 0.9.0 | production-vector | Articulation reference: stand-left | non | oui |
| assets/production/walkers/wk02/assembly-stand-right.svg | 0.9.0 | production-vector | Articulation reference: stand-right | non | oui |
| assets/production/walkers/wk02/assembly-walk.svg | 0.9.0 | production-vector | Articulation reference: walk | non | oui |
| assets/production/walkers/wk02/foot-far.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk02/foot-near.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk02/hip-far.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk02/hip-near.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk02/hull-braced.svg | 0.9.0 | production-vector | Reusable vector component: hull; braced | non | oui |
| assets/production/walkers/wk02/hull-damaged.svg | 0.9.0 | production-vector | Reusable vector component: hull; damaged | non | oui |
| assets/production/walkers/wk02/hull-far.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk02/hull-near.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk02/hull-repaired.svg | 0.9.0 | production-vector | Reusable vector component: hull; repaired | non | oui |
| assets/production/walkers/wk02/knee-far.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk02/knee-near.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk02/lower-far.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk02/lower-near.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk02/radiator-damaged.svg | 0.9.0 | production-vector | Reusable vector component: radiator; damaged | non | oui |
| assets/production/walkers/wk02/radiator-far.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk02/radiator-hit.svg | 0.9.0 | production-vector | Reusable vector component: radiator; hit | non | oui |
| assets/production/walkers/wk02/radiator-near.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk02/radiator-repair-0s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk02/radiator-repair-1s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk02/radiator-repair-2s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk02/radiator-repair-3s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk02/radiator-repair-4s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk02/radiator-repaired.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repaired | non | oui |
| assets/production/walkers/wk02/turret-far.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk02/turret-near.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk02/upper-far.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk02/upper-near.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk05/assembly-aim-up.svg | 0.9.0 | production-vector | Articulation reference: aim-up | non | oui |
| assets/production/walkers/wk05/assembly-brace.svg | 0.9.0 | production-vector | Articulation reference: brace | non | oui |
| assets/production/walkers/wk05/assembly-damaged.svg | 0.9.0 | production-vector | Articulation reference: damaged | non | oui |
| assets/production/walkers/wk05/assembly-stand-left.svg | 0.9.0 | production-vector | Articulation reference: stand-left | non | oui |
| assets/production/walkers/wk05/assembly-stand-right.svg | 0.9.0 | production-vector | Articulation reference: stand-right | non | oui |
| assets/production/walkers/wk05/assembly-walk.svg | 0.9.0 | production-vector | Articulation reference: walk | non | oui |
| assets/production/walkers/wk05/foot-far.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk05/foot-near.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk05/hip-far.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk05/hip-near.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk05/hull-braced.svg | 0.9.0 | production-vector | Reusable vector component: hull; braced | non | oui |
| assets/production/walkers/wk05/hull-damaged.svg | 0.9.0 | production-vector | Reusable vector component: hull; damaged | non | oui |
| assets/production/walkers/wk05/hull-far.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk05/hull-near.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk05/hull-repaired.svg | 0.9.0 | production-vector | Reusable vector component: hull; repaired | non | oui |
| assets/production/walkers/wk05/knee-far.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk05/knee-near.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk05/lower-far.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk05/lower-near.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk05/radiator-damaged.svg | 0.9.0 | production-vector | Reusable vector component: radiator; damaged | non | oui |
| assets/production/walkers/wk05/radiator-far.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk05/radiator-hit.svg | 0.9.0 | production-vector | Reusable vector component: radiator; hit | non | oui |
| assets/production/walkers/wk05/radiator-near.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk05/radiator-repair-0s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk05/radiator-repair-1s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk05/radiator-repair-2s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk05/radiator-repair-3s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk05/radiator-repair-4s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk05/radiator-repaired.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repaired | non | oui |
| assets/production/walkers/wk05/turret-far.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk05/turret-near.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk05/upper-far.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk05/upper-near.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk06/assembly-aim-up.svg | 0.9.0 | production-vector | Articulation reference: aim-up | non | oui |
| assets/production/walkers/wk06/assembly-brace.svg | 0.9.0 | production-vector | Articulation reference: brace | non | oui |
| assets/production/walkers/wk06/assembly-damaged.svg | 0.9.0 | production-vector | Articulation reference: damaged | non | oui |
| assets/production/walkers/wk06/assembly-stand-left.svg | 0.9.0 | production-vector | Articulation reference: stand-left | non | oui |
| assets/production/walkers/wk06/assembly-stand-right.svg | 0.9.0 | production-vector | Articulation reference: stand-right | non | oui |
| assets/production/walkers/wk06/assembly-walk.svg | 0.9.0 | production-vector | Articulation reference: walk | non | oui |
| assets/production/walkers/wk06/foot-far.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk06/foot-near.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk06/hip-far.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk06/hip-near.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk06/hull-braced.svg | 0.9.0 | production-vector | Reusable vector component: hull; braced | non | oui |
| assets/production/walkers/wk06/hull-damaged.svg | 0.9.0 | production-vector | Reusable vector component: hull; damaged | non | oui |
| assets/production/walkers/wk06/hull-far.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk06/hull-near.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk06/hull-repaired.svg | 0.9.0 | production-vector | Reusable vector component: hull; repaired | non | oui |
| assets/production/walkers/wk06/knee-far.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk06/knee-near.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk06/lower-far.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk06/lower-near.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk06/radiator-damaged.svg | 0.9.0 | production-vector | Reusable vector component: radiator; damaged | non | oui |
| assets/production/walkers/wk06/radiator-far.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk06/radiator-hit.svg | 0.9.0 | production-vector | Reusable vector component: radiator; hit | non | oui |
| assets/production/walkers/wk06/radiator-near.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk06/radiator-repair-0s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk06/radiator-repair-1s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk06/radiator-repair-2s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk06/radiator-repair-3s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk06/radiator-repair-4s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk06/radiator-repaired.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repaired | non | oui |
| assets/production/walkers/wk06/turret-far.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk06/turret-near.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk06/upper-far.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk06/upper-near.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk09/assembly-aim-up.svg | 0.9.0 | production-vector | Articulation reference: aim-up | non | oui |
| assets/production/walkers/wk09/assembly-brace.svg | 0.9.0 | production-vector | Articulation reference: brace | non | oui |
| assets/production/walkers/wk09/assembly-damaged.svg | 0.9.0 | production-vector | Articulation reference: damaged | non | oui |
| assets/production/walkers/wk09/assembly-stand-left.svg | 0.9.0 | production-vector | Articulation reference: stand-left | non | oui |
| assets/production/walkers/wk09/assembly-stand-right.svg | 0.9.0 | production-vector | Articulation reference: stand-right | non | oui |
| assets/production/walkers/wk09/assembly-walk.svg | 0.9.0 | production-vector | Articulation reference: walk | non | oui |
| assets/production/walkers/wk09/foot-far.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk09/foot-near.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk09/hip-far.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk09/hip-near.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk09/hull-braced.svg | 0.9.0 | production-vector | Reusable vector component: hull; braced | non | oui |
| assets/production/walkers/wk09/hull-damaged.svg | 0.9.0 | production-vector | Reusable vector component: hull; damaged | non | oui |
| assets/production/walkers/wk09/hull-far.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk09/hull-near.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk09/hull-repaired.svg | 0.9.0 | production-vector | Reusable vector component: hull; repaired | non | oui |
| assets/production/walkers/wk09/knee-far.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk09/knee-near.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk09/lower-far.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk09/lower-near.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk09/radiator-damaged.svg | 0.9.0 | production-vector | Reusable vector component: radiator; damaged | non | oui |
| assets/production/walkers/wk09/radiator-far.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk09/radiator-hit.svg | 0.9.0 | production-vector | Reusable vector component: radiator; hit | non | oui |
| assets/production/walkers/wk09/radiator-near.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk09/radiator-repair-0s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk09/radiator-repair-1s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk09/radiator-repair-2s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk09/radiator-repair-3s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk09/radiator-repair-4s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk09/radiator-repaired.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repaired | non | oui |
| assets/production/walkers/wk09/turret-far.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk09/turret-near.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk09/upper-far.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk09/upper-near.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk10/assembly-aim-up.svg | 0.9.0 | production-vector | Articulation reference: aim-up | non | oui |
| assets/production/walkers/wk10/assembly-brace.svg | 0.9.0 | production-vector | Articulation reference: brace | non | oui |
| assets/production/walkers/wk10/assembly-damaged.svg | 0.9.0 | production-vector | Articulation reference: damaged | non | oui |
| assets/production/walkers/wk10/assembly-stand-left.svg | 0.9.0 | production-vector | Articulation reference: stand-left | non | oui |
| assets/production/walkers/wk10/assembly-stand-right.svg | 0.9.0 | production-vector | Articulation reference: stand-right | non | oui |
| assets/production/walkers/wk10/assembly-walk.svg | 0.9.0 | production-vector | Articulation reference: walk | non | oui |
| assets/production/walkers/wk10/foot-far.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk10/foot-near.svg | 0.9.0 | production-vector | Reusable vector component: foot; normal | non | oui |
| assets/production/walkers/wk10/hip-far.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk10/hip-near.svg | 0.9.0 | production-vector | Reusable vector component: hip; normal | non | oui |
| assets/production/walkers/wk10/hull-braced.svg | 0.9.0 | production-vector | Reusable vector component: hull; braced | non | oui |
| assets/production/walkers/wk10/hull-damaged.svg | 0.9.0 | production-vector | Reusable vector component: hull; damaged | non | oui |
| assets/production/walkers/wk10/hull-far.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk10/hull-near.svg | 0.9.0 | production-vector | Reusable vector component: hull; normal | non | oui |
| assets/production/walkers/wk10/hull-repaired.svg | 0.9.0 | production-vector | Reusable vector component: hull; repaired | non | oui |
| assets/production/walkers/wk10/knee-far.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk10/knee-near.svg | 0.9.0 | production-vector | Reusable vector component: knee; normal | non | oui |
| assets/production/walkers/wk10/lower-far.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk10/lower-near.svg | 0.9.0 | production-vector | Reusable vector component: lower; normal | non | oui |
| assets/production/walkers/wk10/radiator-damaged.svg | 0.9.0 | production-vector | Reusable vector component: radiator; damaged | non | oui |
| assets/production/walkers/wk10/radiator-far.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk10/radiator-hit.svg | 0.9.0 | production-vector | Reusable vector component: radiator; hit | non | oui |
| assets/production/walkers/wk10/radiator-near.svg | 0.9.0 | production-vector | Reusable vector component: radiator; normal | non | oui |
| assets/production/walkers/wk10/radiator-repair-0s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk10/radiator-repair-1s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk10/radiator-repair-2s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk10/radiator-repair-3s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk10/radiator-repair-4s.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repairing | non | oui |
| assets/production/walkers/wk10/radiator-repaired.svg | 0.9.0 | production-vector | Reusable vector component: radiator; repaired | non | oui |
| assets/production/walkers/wk10/turret-far.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk10/turret-near.svg | 0.9.0 | production-vector | Reusable vector component: turret; normal | non | oui |
| assets/production/walkers/wk10/upper-far.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/production/walkers/wk10/upper-near.svg | 0.9.0 | production-vector | Reusable vector component: upper; normal | non | oui |
| assets/thyr/breathing-vine-burnt.svg | 0.10.0 | thyr-vector | Thyr reusable vector: breathing-vine; burnt | non | oui |
| assets/thyr/breathing-vine-normal.svg | 0.10.0 | thyr-vector | Thyr reusable vector: breathing-vine; normal | non | oui |
| assets/thyr/breathing-vine-wilted.svg | 0.10.0 | thyr-vector | Thyr reusable vector: breathing-vine; wilted | non | oui |
| assets/thyr/column-damaged.svg | 0.10.0 | thyr-vector | Thyr reusable vector: column; damaged | non | oui |
| assets/thyr/column-destroyed.svg | 0.10.0 | thyr-vector | Thyr reusable vector: column; destroyed | non | oui |
| assets/thyr/column-normal.svg | 0.10.0 | thyr-vector | Thyr reusable vector: column; normal | non | oui |
| assets/thyr/echo-grass-calm.svg | 0.10.0 | thyr-vector | Thyr reusable vector: echo-grass; calm | non | oui |
| assets/thyr/echo-grass-moving.svg | 0.10.0 | thyr-vector | Thyr reusable vector: echo-grass; moving | non | oui |
| assets/thyr/fan-colony-dispersed.svg | 0.10.0 | thyr-vector | Thyr reusable vector: fan-colony; dispersed | non | oui |
| assets/thyr/fan-colony-lost.svg | 0.10.0 | thyr-vector | Thyr reusable vector: fan-colony; lost | non | oui |
| assets/thyr/fan-colony-settled.svg | 0.10.0 | thyr-vector | Thyr reusable vector: fan-colony; settled | non | oui |
| assets/thyr/longuedorse-adult-arrived.svg | 0.10.0 | thyr-vector | Thyr reusable vector: longuedorse-adult; arrived | non | oui |
| assets/thyr/longuedorse-adult-dead.svg | 0.10.0 | thyr-vector | Thyr reusable vector: longuedorse-adult; dead | non | oui |
| assets/thyr/longuedorse-adult-diverted.svg | 0.10.0 | thyr-vector | Thyr reusable vector: longuedorse-adult; diverted | non | oui |
| assets/thyr/longuedorse-adult-moving.svg | 0.10.0 | thyr-vector | Thyr reusable vector: longuedorse-adult; moving | non | oui |
| assets/thyr/longuedorse-adult-waiting.svg | 0.10.0 | thyr-vector | Thyr reusable vector: longuedorse-adult; waiting | non | oui |
| assets/thyr/longuedorse-young-arrived.svg | 0.10.0 | thyr-vector | Thyr reusable vector: longuedorse-young; arrived | non | oui |
| assets/thyr/longuedorse-young-dead.svg | 0.10.0 | thyr-vector | Thyr reusable vector: longuedorse-young; dead | non | oui |
| assets/thyr/longuedorse-young-diverted.svg | 0.10.0 | thyr-vector | Thyr reusable vector: longuedorse-young; diverted | non | oui |
| assets/thyr/longuedorse-young-moving.svg | 0.10.0 | thyr-vector | Thyr reusable vector: longuedorse-young; moving | non | oui |
| assets/thyr/longuedorse-young-waiting.svg | 0.10.0 | thyr-vector | Thyr reusable vector: longuedorse-young; waiting | non | oui |
| assets/thyr/migration-barrier-broken.svg | 0.10.0 | thyr-vector | Thyr reusable vector: migration-barrier; broken | non | oui |
| assets/thyr/migration-barrier-closed.svg | 0.10.0 | thyr-vector | Thyr reusable vector: migration-barrier; closed | non | oui |
| assets/thyr/migration-barrier-open.svg | 0.10.0 | thyr-vector | Thyr reusable vector: migration-barrier; open | non | oui |
| assets/thyr/migration-barrier-working.svg | 0.10.0 | thyr-vector | Thyr reusable vector: migration-barrier; working | non | oui |
| assets/thyr/previews/thyr-kit.png | 0.10.0 | thyr-vector | Authoring sheet, varied scales stated per nominal dimensions in manifest | non | oui |
| assets/thyr/previews/thyr-states.png | 0.10.0 | thyr-vector | Authored states on a bench; not gameplay or reception evidence | non | oui |
| assets/thyr/root-damaged.svg | 0.10.0 | thyr-vector | Thyr reusable vector: root; damaged | non | oui |
| assets/thyr/root-destroyed.svg | 0.10.0 | thyr-vector | Thyr reusable vector: root; destroyed | non | oui |
| assets/thyr/root-normal.svg | 0.10.0 | thyr-vector | Thyr reusable vector: root; normal | non | oui |
| assets/thyr/route-map-concealed.svg | 0.10.0 | thyr-vector | Thyr reusable vector: route-map; concealed | non | oui |
| assets/thyr/route-map-surveyed.svg | 0.10.0 | thyr-vector | Thyr reusable vector: route-map; surveyed | non | oui |
| assets/thyr/route-marker-imperial.svg | 0.10.0 | thyr-vector | Thyr reusable vector: route-marker; imperial | non | oui |
| assets/thyr/route-marker-local.svg | 0.10.0 | thyr-vector | Thyr reusable vector: route-marker; local | non | oui |
| assets/thyr/suspended-home-damaged.svg | 0.10.0 | thyr-vector | Thyr reusable vector: suspended-home; damaged | non | oui |
| assets/thyr/suspended-home-destroyed.svg | 0.10.0 | thyr-vector | Thyr reusable vector: suspended-home; destroyed | non | oui |
| assets/thyr/suspended-home-normal.svg | 0.10.0 | thyr-vector | Thyr reusable vector: suspended-home; normal | non | oui |

## Reproduction

`node tools/audit-media-provenance.mjs` écrit ce relevé sans reconstruire ni publier le jeu. Après les builds finaux, relancer avec `--strict` : l’outil échoue si des médias sont sans entrée, si un hash de production est périmé, ou si les copies/graphe de modules ne sont pas à jour. Il ne remplace ni le test navigateur, ni une validation juridique.
