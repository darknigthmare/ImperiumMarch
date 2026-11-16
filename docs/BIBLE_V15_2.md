# Bible 0.15.2 — réception du lot peint de combat

La [Bible Excel](ORDRE_DE_CENDRE_Bible.xlsx) enregistre la livraison partielle des sprites de combat. Elle conserve **1 007 fiches, leurs identifiants et leur ordre**, réparties entre vingt onglets de données et l’onglet Synthèse. La [source JSON](../data/bible.json) reste la référence éditable.

## Contenu reçu

| Lot | Atlas | Cellules | Contenu |
| --- | ---: | ---: | --- |
| Combat 0.15.2 | 9 | 78 | Fusilier, tireur de précision, lancier, civil, buggy, patin, drone, tourelle et convoi |
| Atelier MI14, conservé | 8 | 54 | Deux tenues et machines de l’atelier |
| **Total peint** | **17** | **132** | Images originales et découpe au rendu |

Les quatre atlas humains du lot de combat comptent douze cellules chacun, dont huit poses de marche : **32 poses de marche nouvelles**. Les cinq atlas de véhicules et machines comptent six cellules chacun. Les sept rôles armés disposent d’une arme séparée. Les états endommagés, épaves, poses hors combat et pièces détachées comprennent aussi des références de production : leur présence dans un atlas ne clôt pas leur animation ni leur utilisation dans chaque situation.

Le [rendu peint de combat](../src/painted-combat.mjs) suit les positions simulées. La marche des personnes dépend du déplacement horizontal réel. Le [calcul de pose d’arme](../src/enemy-weapon-pose.mjs) fournit le point de bouche commun au dessin, à l’avertissement et au projectile pour les sept types armés. Les collisions sont conservées; le rendu vectoriel prend le relais si une image est indisponible. Les [prompts et la provenance](../assets/painted/combat/prompts.json) documentent les neuf images.

## Fiches et statuts

Onze fiches sont mises à jour : **AS11, AS12, AS14, PR12, PX07, PX08, PX09, PX10, PX12, PX21 et PX24**. La description de l’onglet Prototype et la version de la source passent à 0.15.2.

**AS14 est le seul changement de statut : « À produire » → « Prototype ».** Ses cinq atlas constituent une réception partielle; le marcheur lourd, les pièces articulées et les animations finales restent ouverts. AS11 et AS12 restent « À produire » : les silhouettes livrées sont des rôles génériques sans logo de faction. Elles ne livrent pas les escouades impériales, rebelles et pirates complètes. Aucun statut ne passe à « Vérifié » dans ce patch.

| Statut | Fiches |
| --- | ---: |
| Conçu | 273 |
| Prototype | 442 |
| À produire | 100 |
| Vérifié | 192 |
| **Total** | **1 007** |

Les variantes de factions, transitions et cycles finaux, sprites de marcheurs articulés, faune et campagne entièrement peinte restent à produire. La portée jouable reste **MI01–MI14**, six châssis et trois opérations autonomes; le dossier de sauvegarde reste au format **v14**. **MI15–MI32 et les seize contrats restent conçus.**

## Contrôles du classeur

Le classeur a été reconstruit avec `@oai/artifact-tool`, puis son export ZIP/XML comparé à la source. Le [reçu d’export](validation/workbook-v0.15-patch2-export.json) confirme **6 767 cellules source comparées, 126 formules calculées, zéro cellule en erreur**, vingt tableaux, vingt plages de validation de statut, quatre-vingts règles de mise en forme conditionnelle et vingt onglets de données figés.

La [comparaison de mise en page](validation/workbook-v0.15-patch2-layout.json) vérifie **7 566 cellules non affectées et 996 fiches inchangées**, ainsi que les styles, colonnes, vues et volets. Six plages ont été rendues et inspectées avant modification, puis six aperçus de la version finale ont été relus : [Synthèse](previews/bible-v0152/00-Synthese.png), [Assets](previews/bible-v0152/combat-assets.png), [Production](previews/bible-v0152/production-art.png), [combat](previews/bible-v0152/combat-runtime.png), [civil et convoi](previews/bible-v0152/civilian-convoy.png), [portée peinte](previews/bible-v0152/painted-scope.png). Le [reçu visuel](validation/workbook-v0.15-patch2-visual-review.json) conserve leurs empreintes.

Le [contrôle de source](validation/workbook-v0.15-patch2-source.json) confirme que tous les textes actuels de critères et de résultats attendus sont inchangés. La [baseline immuable](validation/production-v09-baseline.json) conserve les **133 critères initiaux**. Il signale aussi la différence de rédaction de QA25 déjà présente avant ce patch; elle n’est ni introduite ni corrigée ici. Les reçus des versions antérieures sont conservés. Le [contrôle des références](validation/workbook-v0.15-patch2-references.json) ne relève aucun identifiant non résolu.

Ces contrôles portent sur la source, le calcul, l’export et les aperçus du classeur. Aucune interaction native avec un tableur ni réception humaine du jeu n’est déclarée effectuée par ce reçu.

## Reproduction

Le script [update-bible-v0152.mjs](../tools/update-bible-v0152.mjs) applique les modifications de manière idempotente et protège les identifiants, critères, autres statuts et portée de campagne. Les plages de rendu sont déclarées dans [bible-v0152-previews.json](../data/bible-v0152-previews.json).

Depuis la racine du dépôt, après conservation d’une copie du JSON et du XLSX précédents hors dépôt :

```bash
"$CODEX_PRIMARY_RUNTIME_NODE" tools/update-bible-v0152.mjs
BIBLE_RECEIPT_SUFFIX=patch2 BIBLE_PREVIEW_CONFIG=data/bible-v0152-previews.json \
  "$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs \
  "$PWD" "${PWD}/../outputs/bible-v0152"
BIBLE_RECEIPT_SUFFIX=patch2 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --reference-report docs/validation/workbook-v0.15-patch2-references.json
BIBLE_RECEIPT_SUFFIX=patch2 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-layout.py \
  /chemin/vers/baseline/bible.xlsx /chemin/vers/baseline/bible.json
```

Le suffixe `patch2` distingue les nouveaux reçus des réceptions historiques. La copie et la relecture des six PNG exportés restent nécessaires après toute modification de texte.
