# Bible Excel — Ordre de cendre

Le classeur `ORDRE_DE_CENDRE_Bible.xlsx` présente la conception et la réception de production d’**ImperiumMarch**. La version **0.10.0** conserve **21 onglets** et porte le référentiel à **845 fiches**. Les compteurs décrivent les vingt domaines; ils ne mesurent pas un pourcentage d’achèvement du jeu.

**MI01–MI09 possèdent une version jouable au stade prototype.** Après Vesper et les quatre sorties de Nacre, MI09 ouvre une route locale sur Thyr. Les 23 missions MI10–MI32 et les seize contrats restent conçus. Les trois opérations OP01–OP03 gardent leurs rapports indépendants. Six châssis sont jouables.

Les **816 identifiants de la 0.9** sont conservés dans leur ordre de feuille. Les **29 ajouts** se répartissent ainsi :

| Domaine | Nouveaux IDs | Fiches |
| --- | --- | ---: |
| Systèmes | SY93–SY98 | 6 |
| Narration | NA75–NA78 | 4 |
| Production | PR83–PR85 | 3 |
| Prototype | PX89–PX93 | 5 |
| QA | QA159–QA169 | 11 |

Le dossier v9 ajoute un état local de Thyr sans transformer les anciens habitants de Nacre en nouveaux occupants. La migration conserve les faits précédents, le carburant et même l’ancien marqueur `stage:'complete'`; la progression propose ensuite MI09 à partir du rapport manquant. Les deux supports FL07, les quatre migrateurs FU07 et les deux colonies FU08 possèdent des mécanismes locaux. FL08 reste décorative et FL09 conserve seulement une réaction visuelle.

Les **133 lignes initialement À produire** gardent leur [baseline immuable](validation/production-v09-baseline.json) et leur [registre complet de réception 0.10](PRODUCTION_REGISTER_V10.md). Le texte initial, les reçus 0.9 et le travail restant sont conservés par ID. Les nouveaux systèmes et QA ne gonflent pas ce dénominateur.

## Lire les statuts

| Statut | Signification |
| --- | --- |
| Conçu | Spécification écrite, sans revendication d’implémentation complète. |
| Prototype | Livrable partiel disponible; intégration, usage et limites précisés dans Prototype ou le registre. |
| À produire | Travail identifié dont la réalisation ou le critère de réception reste ouvert. |
| Vérifié | Contrôle réellement exécuté, avec preuve et portée explicites. |

Le statut d’un scénario QA ne certifie pas la finition complète du système. Un test DOM ne certifie pas un navigateur, une image Canvas ne certifie pas le HUD HTML et un périphérique simulé ne certifie pas du matériel physique. Les protocoles humains préparés ne contiennent aucun résultat de session. PR85 et QA169 gardent la réception humaine de Thyr ouverte.

La [réception Chrome 0.10](validation/native-v10/browser-reception.json) ajoute des observations partielles sans changer les statuts. **QA19 reste À produire** : D puis Tab et l’activation de Pause ont été observés, mais un changement d’onglet avec D donne des résultats différents dans deux instances du jeu. Une copie créée par le menu natif affiche bien une pause après les clics avec D vers un autre onglet et la barre d’adresse. Les deux contextes emploient des actions natives; la cause de l’écart reste indéterminée et le tir maintenu n’a pas été reçu. Les observations 0.9 restent archivées. Les captures temporaires initiales devenues indisponibles sont distinguées des pièces persistées dans le [journal d’observations](validation/native-v10/native-observations.json).

**QA20 reste À produire** : HUD à 100 %, briefing à 125 %, décision à 125 et 150 % avec choix réel, puis bilan à 150 % accessible par défilement ont été observés. La fenêtre Chrome mesurée reste à 1363 × 1023 pixels malgré les tentatives de réduction; une véritable petite fenêtre n’a donc pas été reçue. Les précontrôles sur un autre onglet sont exclus. La fin de MI09 depuis un checkpoint préparé, le journal et le hangar après rechargement ont été observés; les exports passent 87 contrôles et restent identiques avant et après rechargement. Cela ne constitue pas un parcours humain de toute la mission.

## Rechercher et mettre à jour

Les tables proposent filtres, volets figés et listes de statut. Les IDs relient missions, systèmes, assets, production et QA. La synthèse se recalcule quand une fiche change de statut.

Pour conserver une version reproductible, reporter les modifications dans `data/bible.json`, puis régénérer. Une édition limitée au XLSX ne modifie pas le JSON et serait remplacée lors de la génération suivante. Garder les IDs stables et les critères originaux dans le registre lorsque la réception change.

## Régénérer et contrôler

Le générateur emploie **@oai/artifact-tool** depuis le runtime primaire, sans installer de dépendance dans le dépôt. La configuration initiale `data/bible-v010-previews.json` contient onze vues d’ensemble et vingt-neuf plages ciblées. La réception finale utilise `data/bible-v010-final-previews.json` pour les cinq vues dont le texte change.

```bash
BIBLE_RECEIPT_SUFFIX=final \
  BIBLE_PREVIEW_CONFIG=data/bible-v010-final-previews.json \
  "$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs . \
  ../outputs/imperium-march-v010-final
```

Le générateur exporte le classeur, ses inspections et ses aperçus sous `../outputs/imperium-march/`, puis copie le XLSX dans `docs/ORDRE_DE_CENDRE_Bible.xlsx`. Les deux arguments optionnels fixent la racine du dépôt et le répertoire de sortie. La réception finale a utilisé `../outputs/imperium-march-v010-final/`. `BIBLE_RENDER_SHEETS` et `BIBLE_EXTRA_PREVIEWS` permettent de remplacer les sélections de la configuration.

Le rapport courant est **`docs/validation/workbook-v0.10-final-validation.json`**. Le suffixe `final` sépare cette réception du premier snapshot 0.10 publié en `158a10f7e963f3f5effbb71fc3e8b4588d209d5a`. Les reçus initiaux `workbook-v0.10-*` restent conservés, ainsi que le fichier générique `workbook-validation.json` de la 0.9. Les anciens reçus ne décrivent pas implicitement les nouveaux octets du classeur.

Pour recevoir les cinq nouvelles images et conserver les trente-cinq plages inchangées, fournir au script suivant le classeur exact du premier snapshot 0.10, de SHA-256 `6a5e10c5296f1bbc0468926dde4424a41f9425fc8cd9b02b7fa52e2fc08d5082`, puis le répertoire de sortie utilisé. Le script vérifie cette empreinte, les cellules, les formules, les styles, les dimensions et les empreintes des anciennes images. Il ne remplace pas la relecture visuelle des cinq nouvelles vues.

```bash
BIBLE_RECEIPT_SUFFIX=final "$CODEX_PRIMARY_RUNTIME_PYTHON" \
  tools/receive-bible-previews.py /chemin/vers/le-classeur-initial.xlsx \
  ../outputs/imperium-march-v010-final
```

La génération réconcilie comptes et statuts avec le JSON. Elle modifie temporairement un statut, recalcule, contrôle l’effet puis restaure la valeur. Le vérificateur indépendant lit le ZIP/XML : cellules source, caches de formules, tables, validations, règles conditionnelles et volets.

```bash
BIBLE_RECEIPT_SUFFIX=final "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --reference-report docs/validation/production-v010-final-reference-audit.json
```

La baseline par défaut est la publication 0.9 authentique **`2bb8d7a708e4fab5ab34b3cac10f2418b60fe037`**. La fixture `tests/fixtures/bible-v09-ids.json` conserve les 816 IDs, la révision, l’arbre, le blob Git et le SHA-256 de cette source. Elle a été copiée depuis le snapshot publié, identique à la base locale `e0026cb3fcd342309f2201a9288f10b78b8cff84`; elle n’a pas été reconstruite à partir des fiches nouvelles. Le fallback s’applique seulement à une révision enregistrée absente de Git.

Les baselines 0.8, 0.7, 0.6, 0.5 et 0.4 restent disponibles pour 769, 705, 643, 581 et 526 IDs. Les six baselines ont été contrôlées dans une copie sans Git. Une révision absente non reconnue demeure une erreur. Ces fixtures ne reconstituent pas tout l’historique Git et ne modifient pas les fichiers historiques.

L’audit des références et ses sondes peuvent aussi être exécutés séparément :

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . --references-only
BIBLE_RECEIPT_SUFFIX=final "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/audit-bible-references.py
```

Il résout les identifiants explicites à deux lettres et deux ou trois chiffres, les plages fermées et les paires abrégées. Les opérations et familles de preuve disposent d’ancres canoniques. [BIBLE_REFERENCES.md](BIBLE_REFERENCES.md) décrit les limites et les sept mutations négatives. Résoudre une référence ne prouve pas l’implémentation de son contenu.

## Réception du classeur 0.10

L’export réconcilie **845 fiches et 5 715 cellules source**, avec **816 IDs historiques conservés** et 29 ajouts. Les 21 onglets comportent **20 tables, 126 formules calculées sans erreur, 20 plages de validation, 80 règles conditionnelles et 20 feuilles de données aux volets figés**. La modification temporaire d’un statut et sa restauration ont été contrôlées dans le moteur de génération.

| Statut | Fiches |
| --- | ---: |
| Conçu | 282 |
| Prototype | 333 |
| À produire | 84 |
| Vérifié | 146 |
| **Total** | **845** |

Les preuves finales comprennent la [réconciliation de l’export](validation/workbook-v0.10-final-export.json), la [relecture visuelle](validation/workbook-v0.10-final-visual-review.json), l’[inspection des cellules](validation/workbook-v0.10-final-inspection.ndjson) et le [contrôle des formules](validation/workbook-v0.10-final-formula-check.ndjson). Le [contrôle indépendant des baselines](validation/workbook-v0.10-baseline-check.json), réalisé avant le premier gel, conserve sa portée de comparaison historique; la réconciliation finale contrôle de nouveau les 816 IDs dans le classeur courant.

Les **40 vues de onze feuilles** couvrent la synthèse, les en-têtes retenus et toutes les plages de lignes ajoutées ou modifiées. Cette réception a généré et relu **cinq vues** de QA et Prototype. Les **trente-cinq autres images sont conservées sans duplication** : leurs plages de cellules, formules, styles, hauteurs et géométrie de colonnes sont exactement identiques au premier classeur 0.10, et leurs empreintes restent celles de la relecture initiale. Le [rapport d’intégrité des aperçus](validation/workbook-v0.10-final-preview-integrity.json) décrit cette comparaison. La feuille de styles XML reste identique au premier export, lui-même identique à la 0.9. Le [tableau de synthèse](previews/bible-v010/00-Synthese.png) conserve les mêmes compteurs.

Empreinte SHA-256 du classeur final : `7bd75161f5d10026d5e0101d9d052c439d1ff342bfba1a72a9b2329fc001cd60`.

## Recalcul dans LibreOffice

```bash
BIBLE_RECEIPT_SUFFIX=final "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/recalculate-bible-libreoffice.py
```

Le contrôle indépendant a exécuté **LibreOfficeDev 26.8.0.0.alpha0 2c87e51eeaa2b413ff4ae097b2705eea1995d8e5** en mode headless sur une copie jetable après retrait des 126 caches de formules. Les **126 résultats ont été recalculés**; les 5 715 cellules source et toutes les valeurs comparées concordent. L’original est resté inchangé. Le [rapport final de recalcul](validation/workbook-v0.10-final-libreoffice.json) conserve version, commande, empreintes et observations structurelles.

LibreOffice a normalisé cent expressions en retirant les apostrophes facultatives autour des noms de feuille; leurs résultats sont identiques. La copie conserve aussi les tables, validations, règles conditionnelles et volets contrôlés en XML. Ces observations structurelles ne valident pas le tri interactif, le défilement des volets ou une modification par un utilisateur. **QA29 reste ouverte** pour ces gestes. Aucune exécution dans Excel desktop n’est revendiquée.

Le [bilan de production](PRODUCTION_V10.md), le [contrat de MI09](CAMPAIGN_MISSION_09.md), le [contrat du dossier v9](CAMPAIGN_SAVE_V9.md) et le [registre des 133 critères](PRODUCTION_REGISTER_V10.md) expliquent les réalisations et le travail restant. Les documents et preuves des versions précédentes conservent leurs bilans historiques.
