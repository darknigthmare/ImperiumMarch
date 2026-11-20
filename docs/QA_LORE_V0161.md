# RÉCEPTION — COMPLÉMENT DE CHRONIQUE 0.16.1

**ORDRE DE CENDRE · 20 novembre 2026 · réception statique, sans code ni asset modifié**

Ce reçu couvre la seule tranche 0.16.1 : l’extension d’histoire et de lore de `data/bible.json` et les documents qui la portent. Il ne certifie aucune session de jeu, aucun rendu, aucune réception navigateur et aucun essai humain.

## 1. Ce qui a été produit

| Livrable | Nature | Empreinte de contrôle |
| --- | --- | --- |
| `data/bible.json` | 89 fiches ajoutées (63 de lore, 26 QA), 4 fins détaillées, métadonnées de tranche | 1 157 fiches, 20 onglets, 257 critères QA |
| `tools/extend-lore-v0161.mjs` | script additif idempotent par construction (refuse une base ≠ 1 068) | exécuté une fois |
| `tools/add-qa-lore-v0161.mjs` | script additif des 26 critères QA de la tranche | exécuté une fois |
| `docs/CHRONIQUE_DES_MONDES.md` | chronique, cultures, équipage, fins, index | nouveau |
| `docs/COMPLETUDE_FR.md` | périmètre fini du jeu complet | nouveau |
| `docs/BIBLE_FR.md` §16 | synthèse et renvois | modifié |
| `docs/CAMPAIGN_FR.md` §10 | dates, équipage, fins | modifié |
| `docs/CANON_EMPIRE.md` | renvoi à la chronique | modifié |
| `README.md`, `docs/BIBLE_README.md`, `AGENTS.md` | compte de fiches, table de documentation, règles de tranche | modifiés |

Fiches ajoutées : `VI34–VI37` (4), `SY140–SY143` (4), `FA10–FA12` (3), `PN23–PN34` (12), `NA131–NA170` (40), `QA232–QA257` (26). Les quatre fins `FI01–FI04` gardent identifiant et statut ; seul leur texte est détaillé. Les 26 critères QA sont tous **À produire** : chronologie EC 61 (`QA232–QA236`), journal `SY140` (`QA237–QA242`), cargaison `SY142` (`QA243–QA247`), résolution `SY143` (`QA248–QA252`), atteignabilité des quatre fins (`QA253–QA257`).

## 2. Contrôles exécutés

| Commande | Résultat | Portée |
| --- | --- | --- |
| `node tools/extend-lore-v0161.mjs` | `{"rows":1131,"sheets":20,"added":63,"preserved":1068}` | écriture additive et assertions internes |
| `node tools/add-qa-lore-v0161.mjs` | `{"rows":1157,"qa":"QA232–QA257","added":26,"pendingQa":67}` | écriture additive et assertions internes |
| `npm run check` | **réussi** — « 20 design sheets, 1157 source rows, 7 playable chassis, 3 independent operations, 14 campaign missions » | structure de la bible, IDs uniques, missions et châssis |
| Comparaison `git show HEAD:data/bible.json` | **0 ID perdu, 0 statut promu, 89 ajouts** | préservation de la base 0.16 |
| Balayage des références `[A-Z]{2}\d{2}` | **0 symbole non résolu ajouté** ; les 23 symboles présents (OP01–03, PO01–03, PT01–05, TE01–04, WK13–WK20) existaient déjà au HEAD | cohérence des renvois |
| Liens Markdown des documents touchés | **0 lien interne cassé** | renvois de documentation |

Aucune de ces vérifications ne constitue une réception de gameplay. `npm test` n’a pas été relancé : aucun fichier de `src/`, de `tests/` ou d’`assets/` n’est modifié, et la suite ne lit pas `data/bible.json`.

**Les 26 critères QA de la tranche ne sont pas exécutés.** Ils décrivent des contrôles à produire — dates EC 61, journal `SY140`, cargaison `SY142`, résolution `SY143`, atteignabilité des fins — et restent **À produire** dans l’onglet QA. Leur présence ne vaut ni test ni réception.

## 3. Ce qui n’a pas été fait, et pourquoi

- **Aucune reconstruction de `dist/`.** La tranche ne change ni code, ni style, ni asset embarqué ; le HTML autonome et le ZIP restent ceux de la 0.16.0 déjà construits et vérifiés. Un `npm run build` n’était requis par aucune règle du projet pour un changement de bible et de documentation.
- **Aucun export XLSX.** `tools/build-bible.mjs` exige `@oai/artifact-tool`, absent de l’environnement. `docs/ORDRE_DE_CENDRE_Bible.xlsx` reste l’export 0.15.11 ; l’écart est signalé dans la bible, la chronique, la complétude et le README. La source `data/bible.json` fait foi.
- **Aucune réception navigateur, Canvas ou DOM.** Le complément n’ajoute ni écran, ni dialogue joué, ni niveau, ni image.
- **Aucune lecture de sensibilité.** Les textes de la chronique et des fiches n’ont pas été relus par des personnes concernées ; les avertissements et occultations restent à éprouver avant diffusion.
- **Aucune validation des missions MI15–MI32.** Elles restent **Conçu** ; leur détail enrichi ne les rend pas jouables.

## 4. Limites de portée

La 0.16.1 est une tranche **narrative et documentaire**. Elle rend le monde daté, culturellement habité, doté d’un équipage et de fins spécifiées, et elle nomme honnêtement ce qui manque. Elle ne réduit d’aucune manière l’écart entre le catalogue conçu et le jeu livré, sinon en le rendant lisible dans [COMPLETUDE_FR.md](COMPLETUDE_FR.md).

La campagne jouable reste **MI01–MI14**, le dossier **v14**, les sept châssis assignables et les trois opérations indépendantes. Les 133 critères initiaux de production restent le dénominateur inchangé.
