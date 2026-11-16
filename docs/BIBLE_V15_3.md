# Bible 0.15.3 — marcheurs peints

La [Bible Excel](ORDRE_DE_CENDRE_Bible.xlsx) enregistre le lot peint des six marcheurs déjà jouables. **Les 1 007 fiches, leurs identifiants, leur ordre et tous leurs statuts sont conservés.** Le classeur comporte vingt onglets de données et l’onglet Synthèse; sa [source JSON](../data/bible.json) reste la référence éditable.

## Lot enregistré

| Châssis | Profil | Fiches de réception | Cellules |
| --- | --- | --- | ---: |
| WK01 — Vigie M-12 | Bipède haut | AS02, PX01 | 16 |
| WK02 — Caracal C-5 | Bipède bas | AS31, PX37 | 16 |
| WK05 — Bastion Q-40 | Quadrupède bas | AS03, PX02 | 16 |
| WK06 — Arpenteur A-17 | Quadrupède haut | AS31, PX38 | 16 |
| WK09 — Pèlerin H-6 | Hexapode médian | AS04, PX03 | 16 |
| WK10 — Cloporte CL-4 | Hexapode très bas | AS31, PX39 | 16 |
| **Total nouveau** | **6 atlas** | | **96** |

Chaque atlas à quatre colonnes et quatre lignes contient les huit familles de pièces et leurs états : coque normale, endommagée et ancrée; tourelle; segments supérieur et inférieur normaux et endommagés; hanche et genou; pied normal, endommagé et ancré; radiateur normal, endommagé et réparé. Les 96 cellules servent à assembler les rigs sur leurs appuis existants.

Les huit atlas MI14 et leurs 54 cellules, puis les neuf atlas de combat et leurs 78 cellules, sont conservés. **Le total peint atteint 23 atlas et 228 cellules.** Les 32 poses de marche du lot de combat restent distinctes des pièces articulées des marcheurs. Les [prompts](../assets/painted/walkers/prompts.json) et le [manifeste](../assets/painted/walkers/manifest.json) documentent les nouveaux originaux et leur usage.

Le [rendu des marcheurs](../src/painted-walkers.mjs) assemble les pièces depuis le rig et les pieds simulés, conserve les couches de profondeur et propose un repli vectoriel en cas d’image indisponible. Les pivots, points de tir, appuis et collisions restent sous leurs contrats physiques existants. La pièce du radiateur suit `radiatorBounds`. Ses trois états statiques sont peints; l’état touché et la réparation progressive conservent leur rendu vectoriel.

Le [rapport de production](PRODUCTION_V15_3.md) et le [rapport QA des marcheurs](QA_PAINTED_WALKERS.md) précisent l’intégration réellement reçue et les contrôles du jeu. Le présent reçu porte sur la Bible.

## Portée et statuts

Dix-huit fiches reçoivent une description ciblée : **AS02, AS03, AS04, AS30, AS31, AS36, AS38, AS41, PR12, PX01, PX02, PX03, PX24, PX37, PX38, PX39, PX51 et PX86**. La description de l’onglet Prototype et les métadonnées courantes passent à 0.15.3.

| Statut | Fiches, inchangées depuis 0.15.2 |
| --- | ---: |
| Conçu | 273 |
| Prototype | 442 |
| À produire | 100 |
| Vérifié | 192 |
| **Total** | **1 007** |

La peinture constitue une réception partielle des rigs. **AS06–AS09 restent À produire** pour leurs cycles, postures, recul et rechargements finaux. Les capacités de hauteur réglable et de passages, la marche à cinq appuis du Pèlerin, le module de secours de l’Arpenteur et le déminage du Cloporte restent ouverts. Les six autres châssis du catalogue restent conçus et non jouables. L’identification spontanée des dégâts et la lecture des appuis demandent leur réception humaine.

La portée de campagne reste **MI01–MI14**, six châssis et trois opérations autonomes, avec sauvegardes **v14**. **MI15–MI32 et les seize contrats restent conçus.** Les variantes de factions, la faune, les biomes et la finition artistique complète demeurent des travaux de production.

## Conservation et contrôles du classeur

La source et le XLSX 0.15.2 ont été copiés hors dépôt avant modification. Le [contrôle de source](validation/workbook-v0.15-patch3-source.json) confirme les identifiants ordonnés, tous les statuts, tous les textes actuels des critères et résultats attendus, ainsi que l’idempotence du script de mise à jour. Les **133 critères initiaux** restent dans leur [baseline immuable](validation/production-v09-baseline.json). La différence de rédaction historique de QA25 reste documentée et inchangée. Les 53 reçus et aperçus historiques inventoriés avant ce patch conservent leurs empreintes.

Le classeur est reconstruit avec `@oai/artifact-tool`. Le [contrôle de l’export ZIP/XML](validation/workbook-v0.15-patch3-export.json) compare **6 767 cellules source**, reçoit **126 formules calculées sans erreur**, vingt tableaux, vingt plages de validation, quatre-vingts règles conditionnelles et les volets figés des vingt onglets de données. Le [contrôle des références](validation/workbook-v0.15-patch3-references.json) ne relève aucun identifiant non résolu.

La [comparaison de mise en page](validation/workbook-v0.15-patch3-layout.json) conserve **7 556 cellules non affectées et 989 fiches inchangées**, ainsi que les styles, colonnes, vues et volets. Onze vues ont été rendues et inspectées avant modification, puis onze aperçus courants ont été relus : la [Synthèse](previews/bible-v0153/00-Synthese.png), quatre plages Assets, la ligne Production et cinq plages Prototype couvrant les dix-huit fiches. Le [reçu visuel](validation/workbook-v0.15-patch3-visual-review.json) identifie chaque plage, fichier et empreinte.

Ces vérifications couvrent la source, le calcul, l’export et les aperçus. Aucune interaction native avec un tableur ni réception humaine du jeu n’est déclarée effectuée par ce reçu. Les preuves de la 0.15.2 et des versions antérieures restent attachées à leurs propres fichiers et contextes.

## Reproduction

Le script [update-bible-v0153.mjs](../tools/update-bible-v0153.mjs) protège les identifiants, les statuts, les critères et la portée de campagne. La configuration [bible-v0153-previews.json](../data/bible-v0153-previews.json) sélectionne les onze aperçus.

Depuis la racine du dépôt, après conservation d’une copie de la source et du classeur précédents hors dépôt :

```bash
"$CODEX_PRIMARY_RUNTIME_NODE" tools/update-bible-v0153.mjs
BIBLE_RECEIPT_SUFFIX=patch3 BIBLE_PREVIEW_CONFIG=data/bible-v0153-previews.json \
  "$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs \
  "$PWD" "${PWD}/../outputs/bible-v0153"
BIBLE_RECEIPT_SUFFIX=patch3 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --reference-report docs/validation/workbook-v0.15-patch3-references.json
BIBLE_RECEIPT_SUFFIX=patch3 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-layout.py \
  /chemin/vers/baseline/bible.xlsx /chemin/vers/baseline/bible.json
```

Le suffixe `patch3` distingue les nouveaux reçus des preuves historiques. Toute modification ultérieure des textes exige un nouvel export et la relecture des plages concernées.
