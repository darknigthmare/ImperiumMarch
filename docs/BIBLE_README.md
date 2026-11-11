# Bible Excel — Ordre de cendre

Le classeur `ORDRE_DE_CENDRE_Bible.xlsx` présente la conception et le suivi de production d’**ImperiumMarch**. La version **0.7.0** conserve les **21 onglets** et porte le référentiel à **705 fiches**. La synthèse compte les fiches présentes dans les vingt domaines. Elle ne mesure pas un pourcentage d’achèvement du jeu.

**MI01–MI06 possèdent une première version jouable.** Les quatre sorties de Vesper sont suivies du chenal puis de la digue de Nacre. Les 26 autres missions principales restent conçues, dont MI07–MI08 détaillées dans le [contrat de Nacre 0.7](NACRE_CONSEQUENCES_V07.md). Les trois opérations OP01–OP03 gardent leurs rapports indépendants.

Les **643 identifiants de la 0.6** sont conservés et **62 fiches** sont ajoutées. SY63–SY72 développent techniciens, habitants, évacuation, pompes, repli, dépense et bilan. PX63–PX70 décrivent la portée jouable. PR67–PR74 suivent production et finition. QA96–QA115 séparent simulation, persistance, interface, classeur et essai humain.

MI06 suit dix nouveaux habitants, deux maisons et deux techniciens. Mara intervient par radio après un constat réel. Le carburant de MI05 est consommé seulement après branchement complet de la pompe auxiliaire; une dépense officielle reste acquise après défaite ou recommencement. Le rapport de la sortie et le registre cumulé restent distincts. La voie sans carburant demeure possible, et les relectures sont isolées du dossier officiel.

## Lire les statuts

| Statut | Signification |
| --- | --- |
| Conçu | La spécification existe. Elle doit encore être produite et validée. |
| Prototype | Une version partielle du système ou du contenu existe. |
| À produire | Le livrable est identifié et sa réalisation reste ouverte. |
| Vérifié | Le critère a été contrôlé avec une preuve de validation. |

Les compteurs portent sur des fiches. Ils ne représentent pas le pourcentage d’achèvement du jeu. Une mission jouable au stade prototype n’est pas une mission à la finition finale. Le statut Vérifié d’un scénario de test ne clôt pas la conception complète du système auquel il se rapporte.

## Rechercher et mettre à jour

Les tables sont filtrables et les en-têtes restent visibles pendant le défilement. Les colonnes d’identification permettent de suivre les liens entre les domaines. Les cellules de statut proposent une liste de valeurs et la synthèse se recalcule lorsque le statut d’une fiche change.

Pour conserver une version reproductible, reporter les modifications de contenu dans `data/bible.json`, puis régénérer le classeur. Une édition effectuée uniquement dans Excel ne modifie pas le JSON et serait remplacée à la génération suivante.

## Régénérer

Le générateur utilise **@oai/artifact-tool**, disponible dans le runtime primaire Codex. Il n’installe aucune dépendance dans le dépôt.

```bash
"$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs
```

Il exporte le classeur, une synthèse des vérifications et les aperçus de chaque feuille sous `../outputs/imperium-march/`, puis copie le classeur final dans `docs/ORDRE_DE_CENDRE_Bible.xlsx` et le rapport dans `docs/validation/workbook-validation.json`. Le dossier temporaire de résolution des dépendances se trouve dans le répertoire temporaire du système.

Les deux arguments optionnels fixent la racine du dépôt et le répertoire de sortie. `BIBLE_RENDER_SHEETS` limite les aperçus aux onglets modifiés. `BIBLE_EXTRA_PREVIEWS` accepte une liste JSON de vues supplémentaires avec `sheetName`, `range` et `file`, pour contrôler les lignes ajoutées en fin de table sans modifier le classeur.

Le contrôle de l’export utilise uniquement la bibliothèque standard Python. Il lit le ZIP/XML du classeur, compare chaque cellule source, contrôle les valeurs calculées de la synthèse et vérifie les tables, validations de statut et volets. Le second argument facultatif choisit la révision Git dont les identifiants doivent être conservés; la comparaison de cette tranche utilise `c598bad`, version 0.6 comportant 643 fiches.

Le contrôle lit la révision dans Git lorsqu’elle est disponible. Dans une archive source ou un dépôt publié sans cet historique local, il utilise la baseline gelée `tests/fixtures/bible-v06-ids.json`, issue du commit local authentique `c598badad94f81aaaf16f2b13d9e7c11b8508995`. Cette révision possède une histoire différente de celle du dépôt public. La fixture conserve les IDs par feuille, la révision complète, l’identifiant Git du blob et son empreinte SHA-256. Le fallback ne prétend pas que l’historique local entier a été publié.

Les baselines `bible-v05-ids.json` (581 IDs) et `bible-v04-ids.json` (526 IDs) restent disponibles pour leurs révisions exactes. Une autre révision absente reste une erreur. Ces listes prouvent la conservation des identifiants sans reconstruire tout l’historique du code.

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . c598bad
```

La génération compare les totaux de fiches et de statuts avec les données JSON. Elle vérifie aussi qu’une modification temporaire de statut affecte les formules de synthèse, puis restaure la valeur initiale. Les aperçus servent au contrôle de lisibilité. Les cellules source, formules calculées, tables, validations et volets du fichier exporté sont contrôlés séparément. Ces vérifications ne remplacent pas les tests de gameplay répertoriés dans le projet. Le contenu de la tranche et les suites encore ouvertes sont détaillés dans [PRODUCTION_V07.md](PRODUCTION_V07.md) et [NACRE_CONSEQUENCES_V07.md](NACRE_CONSEQUENCES_V07.md). Le [concept complet](CONCEPT_COMPLET_V04.md) garde la vue générale. Les documents PRODUCTION_V02 à V06 conservent les bilans historiques.

## Résultat du contrôle 0.7

Le [contrôle de l’export](validation/workbook-v0.7-export.json) réconcilie **705 fiches et 4 811 cellules source**, avec **643 identifiants historiques conservés**. Les **126 formules** sont calculées sans cellule d’erreur; le changement temporaire d’un statut modifie bien la synthèse, puis la valeur initiale est restaurée. Les vingt tables possèdent leurs validations de statut et leurs volets; quatre règles conditionnelles par table donnent **80 règles**.

| Conçu | Prototype | À produire | Vérifié | Total |
| ---: | ---: | ---: | ---: | ---: |
| 292 | 209 | 125 | 79 | 705 |

La [revue visuelle](validation/workbook-v0.7-visual-review.json) porte sur **17 vues de 11 onglets**, dont la [synthèse](previews/bible-v07-summary.png), la [mission et ses voisines](previews/bible-v07-campaign.png), les nouveaux systèmes et les preuves QA. Les textes contrôlés restent lisibles dans leurs cellules. Une ancienne limite de PX30 a été corrigée pendant cette relecture pour refléter les six missions disponibles.

Le [contrôle des baselines](validation/workbook-v0.7-baseline-check.json) compare la fixture 0.6 au blob Git authentique, puis exécute les fallbacks 0.6, 0.5 et 0.4 dans une archive temporaire sans Git. Ils conservent respectivement 643, 581 et 526 IDs. Une révision absente non reconnue est refusée.

Le recalcul est exécuté dans **@oai/artifact-tool** et l’export contrôlé par lecture XML. Aucune exécution native dans Excel ou LibreOffice n’est revendiquée. Les essais de jeu et d’interface ont leur propre portée dans [QA_V07.md](QA_V07.md); QA115, consacrée à la compréhension humaine de MI06, reste à produire.
