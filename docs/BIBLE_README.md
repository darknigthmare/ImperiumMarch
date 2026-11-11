# Bible Excel — Ordre de cendre

Le classeur `ORDRE_DE_CENDRE_Bible.xlsx` présente la conception et le suivi de production d’**ImperiumMarch**. La version **0.6.0** conserve les **21 onglets** et porte le référentiel à **643 fiches**. La synthèse compte les fiches présentes dans les vingt domaines. Elle ne mesure pas un pourcentage d’achèvement du jeu.

**MI01–MI05 possèdent une première version jouable.** Les quatre sorties de Vesper sont suivies du chenal de Nacre. Les 27 autres missions principales restent conçues, dont MI06–MI08 détaillées dans le [contrat de Nacre](NACRE_CONSEQUENCES_V06.md). Les trois opérations OP01–OP03 gardent leurs rapports indépendants.

Les **581 identifiants de la 0.5** sont conservés et **62 fiches** sont ajoutées. Les fiches SY53–SY62 développent marée, surfaces, inspections, bateau, carburant et dispositifs futurs. PX55–PX62 décrivent les limites de la tranche jouable. PR57–PR66 suivent sa production et les suites. QA79–QA95 séparent simulation, migration, interface, classeur et essai humain.

Le carburant de MI05 est une réserve réellement collectée et conservée. Sa dépense dans MI06 demeure à produire. Vann Ostre reste le navigateur de Rive-Courte, avec une coopération locale intéressée. Les modules d’estran, les capacités finales de la Barge Croc, les animations de passagers et les trois missions suivantes ne deviennent pas livrés par l’ajout de leur description.

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

Le contrôle de l’export utilise uniquement la bibliothèque standard Python. Il lit le ZIP/XML du classeur, compare chaque cellule source, contrôle les valeurs calculées de la synthèse et vérifie les tables, validations de statut et volets. Le second argument facultatif choisit la révision Git dont les identifiants doivent être conservés; la comparaison de cette tranche utilise `d7d76b6`, version 0.5 comportant 581 fiches.

Le contrôle lit la révision dans Git lorsqu’elle est disponible. Dans une archive source ou un dépôt publié sans cet historique local, il utilise les baselines gelées `tests/fixtures/bible-v05-ids.json` (581 identifiants de la 0.5) et `tests/fixtures/bible-v04-ids.json` (526 identifiants de la 0.4), uniquement si la révision demandée correspond exactement à leur provenance. Chaque fichier conserve les IDs par feuille, la révision complète, l’identifiant Git du blob et son empreinte SHA-256. Une autre révision absente reste une erreur. Ces listes prouvent la conservation des identifiants sans prétendre reconstruire tout l’historique du code.

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . d7d76b6
```

La génération compare les totaux de fiches et de statuts avec les données JSON. Elle vérifie aussi qu’une modification temporaire de statut affecte les formules de synthèse, puis restaure la valeur initiale. Les aperçus servent au contrôle de lisibilité. Les cellules source, formules calculées, tables, validations et volets du fichier exporté sont contrôlés séparément. Ces vérifications ne remplacent pas les tests de gameplay répertoriés dans le projet. Le contenu de la tranche et les suites encore ouvertes sont détaillés dans [PRODUCTION_V06.md](PRODUCTION_V06.md) et [NACRE_CONSEQUENCES_V06.md](NACRE_CONSEQUENCES_V06.md). Le [concept complet](CONCEPT_COMPLET_V04.md) garde la vue générale. Les documents PRODUCTION_V02, V03, V04 et V05 conservent les bilans historiques.

## Résultat du contrôle 0.6

L’[export vérifié](validation/workbook-v0.6-export.json) réconcilie 4 409 cellules, 643 fiches et 126 formules sans erreur. La [revue visuelle](validation/workbook-v0.6-visual-review.json) couvre treize vues de la synthèse et des lignes modifiées. Le [contrôle des baselines](validation/workbook-v0.6-baseline-check.json) vérifie aussi la reproduction sans historique Git pour les versions 0.5 et 0.4, ainsi que le refus d’une révision absente non reconnue.

La synthèse finale compte 291 fiches conçues, 176 au stade prototype, 116 à produire et 60 vérifiées. Ces statuts décrivent des fiches de nature différente; ils ne constituent pas une mesure de finition globale. Les formules et le fichier exporté ont été contrôlés dans le runtime et par lecture XML, sans exécution native dans Excel ou LibreOffice.
