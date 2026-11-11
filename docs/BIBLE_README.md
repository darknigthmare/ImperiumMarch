# Bible Excel — Ordre de cendre

Le classeur `ORDRE_DE_CENDRE_Bible.xlsx` présente les fiches de conception et le suivi de production du projet **ImperiumMarch**. La version **0.5.0** conserve les **21 onglets** et porte le référentiel à **581 fiches**. La feuille **Synthèse** compte les fiches présentes dans les autres onglets. Chaque domaine porte le même nom que son onglet.

**MI01–MI04 possèdent une première version jouable et forment le bloc de Vesper.** Les 28 autres missions principales restent conçues. Les trois opérations OP01–OP03 conservent leurs rapports indépendants. Les fiches PX47–PX54 précisent les turbines, les héritages de Vesper, le contact, la copie PT01, le radiateur, les kits et le format de sauvegarde v4. PR49–PR56 suivent cette tranche et les chantiers de suite. QA64–QA78 distinguent simulation, migration, interface modélisée, classeur et perception humaine.

Les 526 fiches de la 0.4 sont conservées avec leurs identifiants; 55 fiches ont été ajoutées. MI04 et le premier radiateur passent au statut Prototype. Leurs capacités restent partielles : les conséquences changent des actions réelles et une première source technique peut être copiée, tandis que sources alternatives futures, symétrie de l’avarie sur un ennemi et habillage final restent à produire. La sauvegarde v4 migre les formats v1, v2 et v3 connus avec conservation des rapports et acquis historiques.

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

Le contrôle de l’export utilise uniquement la bibliothèque standard Python. Il lit le ZIP/XML du classeur, compare chaque cellule source, contrôle les valeurs calculées de la synthèse et vérifie les tables, validations de statut et volets. Le second argument facultatif choisit la révision Git dont les identifiants doivent être conservés; la référence par défaut de cette tranche est `c81a360`.

Le contrôle lit cette révision dans Git lorsqu’elle est disponible. Dans une archive source ou un dépôt publié sans cet historique local, il utilise `tests/fixtures/bible-v04-ids.json` uniquement si la révision demandée correspond à la référence enregistrée. Ce fichier conserve les 526 identifiants de la 0.4, regroupés par feuille, avec la révision complète, l’identifiant Git du fichier source et son empreinte SHA-256. Une autre révision absente reste une erreur ; elle n’est pas remplacée par cette référence. Cette liste permet de reproduire le contrôle de conservation des identifiants, sans prétendre reconstruire tout l’historique du code.

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py
```

La génération compare les totaux de fiches et de statuts avec les données JSON. Elle vérifie aussi qu’une modification temporaire de statut affecte les formules de synthèse, puis restaure la valeur initiale. Les aperçus servent au contrôle de lisibilité. Les cellules source, formules calculées, tables, validations et volets du fichier exporté sont contrôlés séparément. Ces vérifications ne remplacent pas les tests de gameplay répertoriés dans le projet. Le contenu de la tranche et les suites encore ouvertes sont détaillés dans [PRODUCTION_V05.md](PRODUCTION_V05.md) et [VESPER_CONSEQUENCES_V05.md](VESPER_CONSEQUENCES_V05.md). Le [concept complet](CONCEPT_COMPLET_V04.md) garde la vue générale. Les documents PRODUCTION_V02, V03 et V04 conservent les bilans historiques.
