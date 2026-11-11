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

Le fichier exporté réconcilie **816 fiches et 5 527 cellules source**, avec **769 IDs historiques conservés** et 47 ajouts. Ses 21 onglets comportent 20 tables, 126 formules calculées sans erreur, 20 plages de validation, 80 règles conditionnelles et 20 feuilles de données aux volets figés. La modification temporaire d’un statut et la restauration ont été contrôlées dans le moteur de génération.

| Statut | Fiches |
| --- | ---: |
| Conçu | 287 |
| Prototype | 310 |
| À produire | 83 |
| Vérifié | 136 |
| **Total** | **816** |

Les preuves comprennent la [réconciliation de l’export](validation/workbook-v0.9-export.json), le [contrôle des baselines](validation/workbook-v0.9-baseline-check.json), la [relecture visuelle](validation/workbook-v0.9-visual-review.json), l’[inspection des cellules](validation/workbook-v0.9-inspection.ndjson) et le [contrôle des formules](validation/workbook-v0.9-formula-check.ndjson). Les **37 vues de dix feuilles** ciblent les lignes modifiées et la synthèse. Les vues conservées d’un export précédent ont exactement les mêmes valeurs, formules, hauteurs de lignes et colonnes que le fichier final.

Empreinte SHA-256 du classeur final : `af5c84c1a1efc9d78300f3443d0097fca0027596385db97358d97c7e6bdcf701`.

Un contrôle indépendant a exécuté **LibreOfficeDev 26.8.0.0.alpha0 2c87e51eeaa2b413ff4ae097b2705eea1995d8e5** en mode headless sur une copie jetable, après retrait des 126 caches de formules. Les 126 résultats ont été recalculés; les 5 527 cellules source et toutes les valeurs comparées concordent. L’original est resté inchangé. Le [rapport natif](validation/workbook-v0.9-libreoffice.json) conserve version, commande, empreintes et observations structurelles.

LibreOffice a normalisé cent expressions en retirant les apostrophes facultatives autour des noms de feuille; leurs résultats sont identiques. La copie conserve aussi les tables, validations, règles conditionnelles et volets contrôlés en XML. Ces observations structurelles ne valident pas le tri interactif, le défilement des volets ou une modification par un utilisateur. **QA29 reste ouverte** pour ces gestes. Aucune exécution dans Excel desktop n’est revendiquée.

Le [bilan de production](PRODUCTION_V09.md), le [contrat de Nacre](NACRE_CONSEQUENCES_V09.md) et le [registre des 133 critères](PRODUCTION_REGISTER_V09.md) expliquent les changements et les travaux ouverts. Les documents des tranches précédentes conservent leurs bilans historiques.
