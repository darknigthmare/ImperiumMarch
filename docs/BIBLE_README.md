# Bible Excel — Ordre de cendre

Le classeur `ORDRE_DE_CENDRE_Bible.xlsx` présente la conception et la réception de production d’**ImperiumMarch**. La version **0.9.0** conserve les **21 onglets** et porte le référentiel à **816 fiches**. Les compteurs décrivent les vingt domaines; ils ne mesurent pas un pourcentage d’achèvement du jeu.

**MI01–MI08 possèdent une version jouable au stade prototype.** Les quatre sorties de Vesper sont suivies du chenal, de la digue, de la chaussée sanitaire et des portes d’Aval sur Nacre. Les 24 missions MI09–MI32 et les seize contrats restent conçus. Les trois opérations OP01–OP03 gardent leurs rapports indépendants. Six châssis sont jouables.

Les **769 identifiants de la 0.8** sont conservés et **47 fiches** sont ajoutées : dix systèmes, six éléments narratifs, dix périmètres Prototype et vingt et une QA. Le dossier v8 garde les anciens états et ajoute le départ de Nacre. Accord, embarquement, départ de zone, arrivée au refuge et accueil local sont des faits distincts.

Les **133 lignes initialement À produire** disposent de leur [baseline immuable](validation/production-v09-baseline.json) et d’un [registre complet de réception](PRODUCTION_REGISTER_V09.md). Un fichier ou comportement reçu au stade Prototype ne clôt pas son critère d’art final, de matériel ou d’essai humain. Le texte initial et le travail restant sont conservés par ID.

## Lire les statuts

| Statut | Signification |
| --- | --- |
| Conçu | Spécification écrite, sans revendication d’implémentation complète. |
| Prototype | Livrable partiel disponible; intégration, usage et limites précisés dans Prototype ou le registre. |
| À produire | Travail identifié dont la réalisation ou le critère de réception reste ouvert. |
| Vérifié | Contrôle réellement exécuté, avec preuve et portée explicites. |

Le statut d’un scénario QA ne certifie pas la finition complète du système. Un test DOM ne certifie pas un navigateur, une image Canvas ne certifie pas le HUD HTML et un périphérique simulé ne certifie pas du matériel physique. Les protocoles humains préparés ne contiennent aucun résultat de session.

## Rechercher et mettre à jour

Les tables proposent filtres, volets figés et listes de statut. Les IDs relient missions, systèmes, assets, production et QA. La synthèse se recalcule quand une fiche change de statut.

Pour conserver une version reproductible, reporter les modifications dans `data/bible.json`, puis régénérer. Une édition limitée au XLSX ne modifie pas le JSON et serait remplacée lors de la génération suivante. Garder les IDs stables et les critères originaux dans le registre lorsque la réception change.

## Régénérer et contrôler

Le générateur emploie **@oai/artifact-tool** depuis le runtime primaire, sans installer de dépendance dans le dépôt.

```bash
"$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs
```

Il exporte le classeur, ses inspections et ses aperçus sous `../outputs/imperium-march/`, puis copie le XLSX dans `docs/ORDRE_DE_CENDRE_Bible.xlsx` et le rapport dans `docs/validation/workbook-validation.json`. Les deux arguments optionnels fixent la racine du dépôt et la sortie. `BIBLE_RENDER_SHEETS` limite les vues aux feuilles modifiées; `BIBLE_EXTRA_PREVIEWS` ajoute des plages ciblées par `sheetName`, `range` et `file`.

La génération réconcilie comptes et statuts avec le JSON. Elle modifie temporairement un statut, recalcule, contrôle l’effet puis restaure la valeur. Le vérificateur indépendant lit le ZIP/XML : cellules source, caches de formules, tables, validations, règles conditionnelles et volets.

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . 03c69e7
```

La baseline par défaut est le commit local authentique `03c69e73175d6e2d61f59f6f9ba8ee80da827103`, version 0.8. La publication précédente possède une histoire différente, au commit `0ae303a7b04d45472dc17154039ddc73760dc97a`. La fixture `tests/fixtures/bible-v08-ids.json` conserve les 769 IDs, la révision complète, le blob Git et le SHA-256 de la source. Elle sert de fallback seulement lorsque cette révision enregistrée n’est pas disponible dans Git.

Les baselines v0.7, v0.6, v0.5 et v0.4 restent disponibles, respectivement pour 705, 643, 581 et 526 IDs. Une révision absente non reconnue demeure une erreur. Ces fixtures ne reconstituent pas tout l’historique Git et ne modifient pas les fichiers historiques.

L’audit des références peut aussi être exécuté sans toucher au classeur ni aux rapports d’export :

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . --references-only
```

Il résout les identifiants explicites à deux lettres et deux ou trois chiffres, les plages fermées et les paires abrégées. Les opérations et familles de preuve disposent d’ancres canoniques. [BIBLE_REFERENCES.md](BIBLE_REFERENCES.md) décrit les limites et les sondes négatives. Résoudre une référence ne prouve pas l’implémentation de son contenu.

## Contrôle de réception 0.9

La structure de 816 fiches est préparée; les contrôles finaux d’export, de recalcul et de vues seront consignés après gel des réceptions. Aucun résultat de classeur final n’est anticipé dans cet état de travail.

| Statut | Fiches |
| --- | ---: |
| Conçu | 288 |
| Prototype | 305 |
| À produire | 123 |
| Vérifié | 100 |
| **Total** | **816** |

Le recalcul indépendant LibreOffice est préparé sur une copie jetable; aucun résultat natif n’est encore attribué. QA29 conserve son exigence distincte de tri, filtres, volets et édition dans une interface bureautique réellement observée.

Le [bilan de production](PRODUCTION_V09.md), le [contrat de Nacre](NACRE_CONSEQUENCES_V09.md) et le [registre des 133 critères](PRODUCTION_REGISTER_V09.md) expliquent les changements et les travaux ouverts. Les documents des tranches précédentes conservent leurs bilans historiques.
