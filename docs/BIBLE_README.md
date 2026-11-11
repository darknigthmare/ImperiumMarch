# Bible Excel — Ordre de cendre

Le classeur `ORDRE_DE_CENDRE_Bible.xlsx` présente la conception et le suivi de production d’**ImperiumMarch**. La version **0.8.0** conserve les **21 onglets** et porte le référentiel à **769 fiches**. La synthèse compte les fiches présentes dans les vingt domaines. Elle ne mesure pas un pourcentage d’achèvement du jeu.

**MI01–MI07 possèdent une première version jouable.** Les quatre sorties de Vesper sont suivies du chenal, de la digue et de la chaussée sanitaire de Nacre. Les 25 autres missions principales restent conçues; MI08 est détaillée dans le [contrat de Nacre 0.8](NACRE_CONSEQUENCES_V08.md). Les trois opérations OP01–OP03 gardent leurs rapports indépendants.

Les **705 identifiants de la 0.7** sont conservés et **64 fiches** sont ajoutées. SY73–SY82 développent arrêt, accord, cargo, balise, rampe, technicien, transfert et constats. PX71–PX78 décrivent la portée jouable. PR75–PR82 suivent dossier, validation, finition et préparation de MI08. QA116–QA137 séparent simulation, persistance, interface, classeur, rendu et essai humain.

MI07 introduit quatre patients, une conductrice et un soignant. Arrêt, accord, examen, récupération de la balise et arrivée sanitaire restent distincts. L’état du panneau de MI06 détermine l’accès principal ou secondaire; un technicien n’aide qu’après un contact réel. La provenance de pose du boîtier reste non vérifiée. Le dossier v7 conserve les états précédents, notamment le carburant réellement dépensé à MI06; MI07 n’en crée pas. Les relectures restent isolées.

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

Le contrôle de l’export utilise uniquement la bibliothèque standard Python. Il lit le ZIP/XML du classeur, compare chaque cellule source, contrôle les valeurs calculées de la synthèse et vérifie les tables, validations de statut et volets. Le second argument facultatif choisit la révision Git dont les identifiants doivent être conservés; la comparaison de cette tranche utilise `1e7eadb`, version 0.7 comportant 705 fiches.

Le contrôle lit la révision dans Git lorsqu’elle est disponible. Dans une archive source ou un dépôt publié sans cet historique local, il utilise la baseline gelée `tests/fixtures/bible-v07-ids.json`, issue du commit local authentique `1e7eadbf8bb97b37ad5753d8f2821d5085200e63`. Cette révision possède une histoire différente de celle du dépôt public. La fixture conserve les IDs par feuille, la révision complète, l’identifiant Git du blob et son empreinte SHA-256. Le fallback ne prétend pas que l’historique local entier a été publié.

Les baselines `bible-v06-ids.json` (643 IDs), `bible-v05-ids.json` (581 IDs) et `bible-v04-ids.json` (526 IDs) restent disponibles pour leurs révisions exactes. Une autre révision absente reste une erreur. Ces listes prouvent la conservation des identifiants sans reconstruire tout l’historique du code.

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . 1e7eadb
```

La génération compare les totaux de fiches et de statuts avec les données JSON. Elle vérifie aussi qu’une modification temporaire de statut affecte les formules de synthèse, puis restaure la valeur initiale. Les aperçus servent au contrôle de lisibilité. Les cellules source, formules calculées, tables, validations et volets du fichier exporté sont contrôlés séparément. Ces vérifications ne remplacent pas les tests de gameplay répertoriés dans le projet. Le contenu de la tranche et les suites encore ouvertes sont détaillés dans [PRODUCTION_V08.md](PRODUCTION_V08.md) et [NACRE_CONSEQUENCES_V08.md](NACRE_CONSEQUENCES_V08.md). Le [concept complet](CONCEPT_COMPLET_V04.md) garde la vue générale. Les documents PRODUCTION_V02 à V07 conservent les bilans historiques.

## Résultat du contrôle 0.8

Le fichier exporté a été réconcilié avec le JSON final : **769 fiches et 5 225 cellules source concordent**, les **705 IDs de la 0.7** sont préservés et les **64 ajouts** sont identifiés. Le classeur comporte 21 onglets, 20 tables, 126 formules calculées sans erreur, 20 plages de validation des statuts, 80 règles conditionnelles et 20 feuilles de données avec volets figés. La modification temporaire d’un statut, le recalcul de la synthèse puis la restauration de la valeur ont été contrôlés.

| Statut | Fiches |
| --- | ---: |
| Conçu | 292 |
| Prototype | 244 |
| À produire | 133 |
| Vérifié | 100 |
| **Total** | **769** |

Les **20 vues de 12 onglets** ont été relues, avec une vue détaillée de NA62 et des vues en fin de table pour les nouvelles fiches. Les preuves conservées sont la [réconciliation de l’export](validation/workbook-v0.8-export.json), le [contrôle des baselines](validation/workbook-v0.8-baseline-check.json), la [relecture visuelle](validation/workbook-v0.8-visual-review.json), l’[inspection des cellules](validation/workbook-v0.8-inspection.ndjson) et le [contrôle des formules](validation/workbook-v0.8-formula-check.ndjson). Les quatre baselines historiques ont également été contrôlées dans une copie sans historique Git; une révision absente non reconnue est bien rejetée.

Empreinte SHA-256 du classeur final : `726c2d8a3464af1cd934574942da5c2ccc0cbfc0dcf12d5874fa26deb30835cb`.

Cette validation porte sur la génération, le contenu exporté et les rendus du classeur. Elle ne revendique aucune ouverture native dans Excel ou LibreOffice. Les QA116–QA136 disposent des preuves décrites dans [QA_V08.md](QA_V08.md); QA137 et QA115 conservent les essais humains à produire.
