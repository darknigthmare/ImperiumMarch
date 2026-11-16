# Bible 0.15.4 — Cerbère et vie de Thyr

La [Bible Excel](ORDRE_DE_CENDRE_Bible.xlsx) enregistre le lot de neuf atlas peints pour Cerbère et les êtres, plantes et supports de Thyr déjà représentés dans le prototype. Les **1 007 fiches, leurs identifiants, leur ordre, les 133 critères initiaux et tous les statuts sont conservés**. La [source JSON](../data/bible.json) reste la référence éditable. Le présent reçu porte sur le classeur; la réception des images et du jeu est suivie séparément dans le [rapport de production](PRODUCTION_V15_4.md).

## Lot enregistré

| Sujet | Fiches existantes concernées | Atlas | Cellules |
| --- | --- | ---: | ---: |
| Cerbère, boss d’OP03 | AS14, PX13 | 1 | 16 |
| Guetteur-racine | FU09, AS21, PX11 | 1 | 12 |
| Longues-dorses adultes et jeunes | FU07, AS18, AS21, PX90 | 2 | 16 |
| Éventail de Thyr | FU08, AS18, AS21, PX90 | 1 | 6 |
| Colonnes-mères | FL07, AS18, PX90 | 1 | 6 |
| Habitats suspendus et racines | FL07, AS18, PX90 | 1 | 6 |
| Vigne respirante et Herbe d’écho | FL08, FL09, AS18, AS21 | 1 | 8 |
| Leth | AS13, PX103 | 1 | 8 |
| **Nouveau lot** | | **9** | **78** |

Les 23 atlas et 228 cellules précédents sont conservés. Le lot porte le total décrit à **32 atlas et 306 cellules**. Ces nombres désignent des pièces, poses, états graphiques et références; ils ne comptent ni nouvelles unités ni cycles de marche complets. Le contrat d’usage distingue onze cellules de rendu et cinq références pour Cerbère, puis cinquante-huit cellules adressables au rendu et quatre références pour Thyr. Une cellule adressable au dessin ne prouve pas qu’un état écologique existe dans le domaine.

Les poses de Guetteur-racine mort, les outils séparés de Leth et l’herbe aplatie sont des références sans nouveau fait simulé. Les variantes de colonnes ne créent aucun support supplémentaire. Les états de vigne disponibles au dessin ne constituent pas une simulation de respiration, flétrissement ou incendie. Les cinq références de dégâts/réparation de Cerbère ne lui ajoutent pas de santé localisée.

## Portée conservée

Le script [update-bible-v0154.mjs](../tools/update-bible-v0154.mjs) cible vingt fiches : **FU07, FU08, FU09, FL07, FL08, FL09, AS13, AS14, AS18, AS21, AS30, AS37, AS38, PR12, PX11, PX13, PX24, PX90, PX91 et PX103**. Les métadonnées courantes et la description de l’onglet Prototype passent à 0.15.4. Aucune fiche QA n’est promue et aucun critère de réception n’est réécrit.

| Statut | Fiches, inchangées depuis 0.15.3 |
| --- | ---: |
| Conçu | 273 |
| Prototype | 442 |
| À produire | 100 |
| Vérifié | 192 |
| **Total** | **1 007** |

La campagne reste **MI01–MI14**, six châssis et trois opérations autonomes, avec sauvegardes **v14**. MI15–MI32 et les seize contrats restent conçus. FL08 et FL09 restent **Conçu**; AS21 et AS37 restent **À produire**, leur portée dépassant cette tranche graphique. L’écologie complète de FU09, les autres espèces et biomes, les animations finales et la réception humaine conservent leurs travaux propres.

## Conservation et contrôles du classeur

Une copie exacte de la source et du XLSX 0.15.3 a été conservée hors dépôt avant modification. Le [contrôle de source](validation/workbook-v0.15-patch4-source.json) reçoit les identifiants ordonnés, les statuts, tous les textes actuels des critères et résultats attendus, la portée jouable et l’idempotence du script. **Vingt fiches descriptives changent; 987 fiches restent identiques.** Les 133 critères initiaux restent dans leur [baseline immuable](validation/production-v09-baseline.json), avec la différence de rédaction historique de QA25 inchangée. Les 1 390 preuves et aperçus historiques inventoriés conservent leurs empreintes.

Le classeur est reconstruit avec le builder existant et `@oai/artifact-tool`. Le [contrôle ZIP/XML](validation/workbook-v0.15-patch4-export.json) compare **6 767 cellules source**, réconcilie **126 formules calculées sans erreur** et conserve **21 onglets, vingt tableaux, vingt plages de validation, quatre-vingts règles conditionnelles et vingt jeux de volets figés**. Les compteurs réagissent à une modification temporaire de statut, ensuite restaurée. Le [contrôle des références](validation/workbook-v0.15-patch4-references.json) ne relève aucun identifiant non résolu.

La [comparaison de mise en page](validation/workbook-v0.15-patch4-layout.json) conserve **7 557 cellules non affectées**, les styles, les colonnes, les vues et les volets. Treize vues de référence ont été rendues et inspectées avant édition, puis les treize aperçus nouveaux ont été ouverts et relus. La [Synthèse](previews/bible-v0154/00-Synthese.png), les vues [Faune](previews/bible-v0154/fauna.png) et [Flore](previews/bible-v0154/flora.png), les cinq plages Assets, la ligne Production et les quatre plages Prototype couvrent les vingt fiches. Le [reçu visuel](validation/workbook-v0.15-patch4-visual-review.json) identifie chaque plage, fichier et empreinte. Les fins de texte et les statuts restent visibles, sans chevauchement ni troncature observés.

Les nouveaux reçus portent le suffixe `patch4` et les aperçus sont rangés dans `docs/previews/bible-v0154/`. Les preuves antérieures sont conservées. Ces contrôles reçoivent la source, le calcul, l’export et les rendus du classeur; aucune interaction native avec un tableur, réception navigateur du jeu ou réception humaine n’en est déduite.

## Reproduction

Après conservation d’une copie exacte de la source et du classeur 0.15.3 hors dépôt :

```bash
"$CODEX_PRIMARY_RUNTIME_NODE" tools/update-bible-v0154.mjs
BIBLE_RECEIPT_SUFFIX=patch4 BIBLE_PREVIEW_CONFIG=data/bible-v0154-previews.json \
  "$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs \
  "$PWD" "${PWD}/../outputs/bible-v0154/final"
BIBLE_RECEIPT_SUFFIX=patch4 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --reference-report docs/validation/workbook-v0.15-patch4-references.json
BIBLE_RECEIPT_SUFFIX=patch4 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-layout.py \
  /chemin/vers/baseline/bible.xlsx /chemin/vers/baseline/bible.json
```

Le [rapport de production](PRODUCTION_V15_4.md) documente séparément la portée des images, leur intégration et les contrôles du jeu. Toute modification ultérieure des textes exige un nouvel export et une nouvelle relecture des plages concernées.
