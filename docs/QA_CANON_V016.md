# Réception 0.16 — canon de la Continuité et épreuves de châssis

**Date :** 18 novembre 2026 · **Version :** 0.16.0 · **Portée :** contenu de bible et documents, aucun changement de code de jeu.

## 1. Ce qui a été ajouté

| Livrable | Emplacement | Nature |
| --- | --- | --- |
| Canon de l’Empire d’Orthe | [CANON_EMPIRE.md](CANON_EMPIRE.md) | Doctrine, lexique, textes, organes, chaîne du crime, lieux, langue, exécutants, victimes, règles de représentation |
| Huit épreuves de châssis | [EPREUVES_CHASSIS.md](EPREUVES_CHASSIS.md) | Missions courtes liées à un châssis, dont l’ascension verticale du Tisserand |
| Missions MI15–MI32 détaillées | [CAMPAIGN_FR.md](CAMPAIGN_FR.md) | Déroulement, vérité et conséquence enrichis, statut « Conçu » inchangé |
| 61 fiches de bible | [data/bible.json](../data/bible.json) | 5 Vision, 4 Systèmes, 4 Ennemis, 8 Personnages, 32 Narration, 8 Contrats |
| Règles de projet | [AGENTS.md](../AGENTS.md) | Section « Canon de la Continuité et épreuves de châssis — 0.16 » |

Les fiches ajoutées : `VI29–VI33`, `SY136–SY139`, `EN37–EN40`, `PN15–PN22`, `NA99–NA130`, `CT17–CT24`.

## 2. Intégrité de la source

Contrôles exécutés par `tools/update-bible-v016.mjs` à l’écriture, puis relus sur le fichier final :

- **1 007 IDs avant**, **1 068 après** : 61 ajouts, **0 retrait**, **0 doublon**.
- **20 onglets de conception** (21 avec la synthèse), **20 tables**, aucune feuille ajoutée ni supprimée.
- **Campagne : 32 missions**, dont 14 « Prototype » et 18 « Conçu ». Aucune mission n’a changé de statut.
- **Contrats : 24 lignes** = 16 contrats de campagne + 8 épreuves de châssis.
- **Narration : 130 fiches**, **Personnages : 22**, **Ennemis : 40**, **Systèmes : 139**, **Vision : 33**.
- Distribution finale des statuts : **334 Conçu, 442 Prototype, 100 À produire, 192 Vérifié** (total 1 068). Les 273 « Conçu » antérieurs sont conservés ; les 61 nouvelles fiches sont toutes « Conçu ».
- Les **133 critères initiaux** et leur baseline ne sont pas touchés ; aucune fiche existante n’a été supprimée ni promue.

## 3. Contrôles exécutés

| Commande | Résultat | Portée |
| --- | --- | --- |
| `node tools/update-bible-v016.mjs` | `{"version":"0.16.0","rows":1068,"sheets":20,"added":61,"preserved":1007}` | Écriture additive et assertions d’intégrité |
| `node tools/update-docs-v016.mjs` | `{"campaign":"MI15–MI32 détaillés","contracts":24,"trials":8,"bibleRows":1068,"version":"0.16.0"}` | Mise à jour des documents et du numéro de version |
| `npm run check` | **réussi** — 20 onglets, 1 068 lignes source, 7 châssis pilotables, 3 opérations, 14 missions de campagne | Validation structurelle de la bible et du contenu |
| `npm test` | **891/891 réussis, 0 échec, 34 s** | Suite du projet, inchangée par cette tranche de contenu |

Empreintes relevées après la révision de registre (voir § 6) :

- `data/bible.json` — `94d4a461d933c9166922d15e2c73fdb68beee88e75b3f98c1e634da1a070ea2b`
- `docs/CANON_EMPIRE.md` — `449736ae59b5770894900bfe9fb5dcc6e416d3a758a3352421bc46f5ecc828e1`
- `docs/EPREUVES_CHASSIS.md` — `5772af5fee5faceb84e740b22d86c69f63853cd73aaa1ec5e3233201f06f5d47`
- `docs/CAMPAIGN_FR.md` — `acb846e3514828474b7a8fb3ad37db269c266a1cfbeb89e98accbd27640e418a`
- `docs/BIBLE_FR.md` — `12cd2da0790c829aa3d8f90b0a7236398a71ddf8a7ccc5aa353e2b9c8cc89b37`

## 4. Ce qui n’a pas été fait

- **Aucune mission nouvelle n’est jouable.** `MI15–MI32` restent « Conçu » ; `CT17–CT24` ne sont ni implémentées ni accessibles au Hangar.
- **Aucun châssis nouveau n’est pilotable.** Seul `WK14` possède une géométrie de production, des contacts simulés et une assignation. `WK13` et `WK15–WK20` n’ont ni marche ni tir.
- **Aucun asset produit.** Pas de nouvelle image, animation, voix, musique ou atlas.
- **L’export XLSX n’a pas été reconstruit.** `tools/build-bible.mjs` exige `@oai/artifact-tool`, absent de l’environnement. L’export `docs/ORDRE_DE_CENDRE_Bible.xlsx` reste donc à 1 007 fiches ; la source `data/bible.json` fait foi. Cet écart est signalé dans [BIBLE_FR.md](BIBLE_FR.md), [BIBLE_README.md](BIBLE_README.md) et [CANON_EMPIRE.md](CANON_EMPIRE.md), pas masqué.
- **Aucun essai navigateur ni humain.** Il n’y a rien de jouable à cliquer dans cette tranche.
- **Aucune validation de sensibilité.** Les contenus de déportation, de travail forcé et d’effacement culturel n’ont pas été testés avec des lecteurs ou des joueurs concernés ; les avertissements et options restent à concevoir.

## 5. Limites de représentation

Le canon impose une représentation implicite : aucun symbole, uniforme ou nom de régime historique réel, aucune torture montrée, aucun charnier en spectacle, aucune animalisation des victimes. Les épreuves `CT20`, `CT21` et `CT23` exposent des personnes déportées ou en danger : elles restent descriptives, sans image explicite. Ces règles sont contraignantes pour toute production future ; elles ne constituent pas une validation éthique.

## 6. Révision de registre

La première rédaction du canon parlait de son propre dispositif — « l’horreur passe par le formulaire, le tampon, le numéro » — et les termes officiels y étaient expliqués par le commentaire de conception. Cette voix tenait le lecteur à distance et transformait la bureaucratie en tic d’écriture.

La révision renverse le dispositif :

- `docs/CANON_EMPIRE.md` devient une **liasse de pièces**. Chaque document est cité dans sa langue de service (page d’école, manuel de guichet, formulaire 12, ordre de prélèvement, barème de l’instruction 27, feuille de greffe du règlement 61, affiche de la circulaire 9-B, calendrier d’entretien PALINODE) ; le commentaire de conception est réduit et séparé, et les métaphores du type « la peur du tampon » sont supprimées.
- Les **termes restent cohérents** d’un document à l’autre. Le lexique officiel est désormais une table de travail explicitement hors fiction (§ 18) : elle sert à écrire, jamais à expliquer une réplique. Les formes populaires apparaissent dans des phrases de file d’attente, sans glose — « il est C », « elle est à la salle », « il a fait sa phrase ».
- `docs/CAMPAIGN_FR.md` unifie « salle de calibration » pour MI15 et MI29 (l’ancienne « chambre de mesure » désignait le même lieu sous un autre nom).
- `docs/EPREUVES_CHASSIS.md` ne parle plus de « crime administratif » : l’épreuve est un exercice de conduite et un fait que le bureau classera.
- `data/bible.json` (`VI` sur la représentation), `docs/BIBLE_FR.md`, `AGENTS.md` et les deux scripts d’écriture 0.16 reprennent la même règle : un document impérial doit sembler écrit par quelqu’un qui veut que la ligne passe avant la relève.

La même révision est appliquée aux **textes déjà jouables** de MI01–MI14 dans `src/content.mjs` :

- Chaque **briefing** devient un ordre de secteur — dotation, échéance de relève, pièce attendue au compte rendu — et non une consigne adressée au joueur. Les descriptions de mission et les **feuilles de décision** remplacent les formulations d’interface (« vous pouvez clore… », « choisir ne réalise pas… ») par des constats de dossier. Les répliques de Holt, de Tess et du contrôle de Kharon gardent leur voix propre, sans glose d’un terme officiel.
- Aucun fait simulé n’a changé : ni nombre de caisses, de passagers, d’habitants ou de patients, ni durée, ni position, ni identifiant d’option. Les constats générés à partir des faits réels (fonctions `*DecisionBody`) restent intacts ; ils consignent ce qui a été exécuté.
- Le contrat de sauvegarde ne compare plus la prose. `src/campaign.mjs` vérifie les champs mécaniques de la définition de mission et les identifiants d’options ; les textes de mission, les libellés d’options et le constat affiché sont révisables. Une modification de géométrie, de durée, de position ou d’identifiant reste refusée. Les fixtures v1–v14 et les dossiers historiques se chargent donc sans réécriture.
- L’empreinte `contentSha256` du lot Sentinelle est mise à jour en conséquence ; les PNG, la géométrie et `sourceSha256` sont inchangés.

Aucun identifiant, compteur, statut, onglet ni critère n’a changé : la source reste à 1 068 fiches, 20 onglets de conception et 14 missions jouables. La révision ne touche que des textes, une chaîne de description et la comparaison de prose des sauvegardes.

Vérifications de cette révision : `npm run check`, `npm test` (901 tests), `npm run build`, `npm run check:ui-runtime` (108 parcours dans le DOM modélisé) et `npm run check:offline-package`. Aucun essai navigateur, aucune validation humaine de sensibilité et aucun export XLSX n’ont été produits par cette révision.

## 7. Prochaine étape

La prochaine tranche de production reste **MI15 — Sous le même numéro** : elle doit être implémentée dans la simulation et le dossier, puis recevoir ses propres tests, sa migration additive et sa réception distincte. Les épreuves de châssis ne doivent pas être implémentées avant que les châssis concernés ne possèdent une marche et des contacts simulés.
