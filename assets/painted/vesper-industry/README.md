# Industrie de Vesper — 0.15.11

Ce lot ajoute **un atlas original et deux cellules de rendu** : `silo` et `chimney`. Il remplace les deux grandes silhouettes vectorielles du second plan industriel de PL01. L'atelier voisin réutilise la cellule `maintenance` normale du lot Vesper 0.15.7 ; cette réutilisation n'est pas comptée comme une nouvelle cellule.

## Provenance et image originale

`industry.png` est la sortie sélectionnée de l'outil Imagegen intégré, copiée sans réencodage depuis `exec-3c4c4abd-e100-475a-8507-fbaedf7e820e.png`. Aucun pixel n'a été retouché. Le prompt exact et les paramètres réellement employés se trouvent dans `prompts.json`; `prompt.txt` en fournit une copie lisible avec un saut de ligne terminal.

- Dimensions : **1536 × 1024**, RGBA, deux colonnes de 768 pixels.
- Taille : **1 643 956 octets**.
- SHA-256 : `80e2a528226c5d3fa9a7086a78c19511d2df6808af21f860062a96f2278592b8`.
- Pixels exactement transparents : **68,437004089 %**.
- Alpha maximal dans les gouttières de cellules : **1/255**.
- Références locales effectivement ouvertes avant génération : panorama historique de Vesper et `assets/painted/vesper/outposts.png`. Elles ont servi à la lecture de palette et de construction ; aucune n'a été transmise comme cible d'édition.

Le dessin emploie ardoise désaturée, métal mat, patine ocre et rouille modérée. Il ne contient ni fumée, ni personne, ni bâtiment annexe, ni marquage de faction. L'indexeur ne produit que des métadonnées et vérifie l'identité de la copie avec la source sélectionnée si cette dernière est disponible.

## Contrat géométrique

Les coordonnées ci-dessous sont celles de `drawIndustry`, avant sa transformation historique. `x` est la position du slot déjà calculée par le renderer ; `h` est sa hauteur historique. Aucun échantillon de terrain ni objet simulé n'entre dans ce module.

| Pièce | Rectangle historique local | Ancre basse de l'enveloppe |
| --- | --- | --- |
| Silo | `[x - 6, 584 - h, 86, h + 16]` | `[x + 37, 600]` |
| Cheminée | `[x + 89, 541 - h, 25, h + 59]` | `[x + 101.5, 600]` |
| Atelier réutilisé | Taille nominale 96 × 101 | `[x + 195, 599]` |

Le centre de l'enveloppe complète du silo est `x + 37` ; le corps vectoriel antérieur avait un centre `x + 35`, sa toiture étant asymétrique. Cette différence ne déplace aucune collision : ces éléments n'en possèdent pas.

L'enveloppe visible est mesurée à alpha ≥32. Le rectangle source conserve tous les pixels alpha ≥2, plus deux pixels de marge. Les pixels alpha 1 éloignés restent dans le PNG original mais ne déterminent ni les ancres ni les dimensions. Au rendu, les pixels sont mis à l'échelle séparément en x et y pour suivre les hauteurs existantes, puis limités au rectangle historique par un clip Canvas. La source reste inchangée. La palette, l'opacité et les transformations du contexte appelant sont conservées.

Le renderer reste responsable de `translate(0,180)`, `scale(1,.75)`, de la parallaxe `cameraX × .32`, de l'espacement de 620 unités, des six slots, et de `h = 125 + hash(i) × 120`. Les tuyaux, le support, la semelle et les quatre cercles de fumée par slot restent ceux du renderer. Ils ne sont pas prépeints dans cet atlas.

## API

Le module est `src/painted-vesper-industry.mjs` et emploie une URL PNG littérale compatible avec la construction autonome.

| Fonction | Résultat et usage |
| --- | --- |
| `loadPaintedVesperIndustry({loadImage?} = {})` | Promise de statut ; charge une fois l'atlas, décode et vérifie ses dimensions. Le chargeur facultatif reçoit `(url, key)` et rend une image. |
| `paintedVesperIndustryStatus()` | Copie de `{industry: {state, width?, height?}}`, avec `idle`, `loading`, `ready` ou `failed`. |
| `drawPaintedVesperIndustryPart(ctx, {part, x = 0, h = 185})` | Booléen. `part` vaut `silo` ou `chimney`. `false` conserve le repli vectoriel de cette pièce. |
| `drawPaintedVesperIndustry(ctx, {x = 0, h = 185} = {})` | `{silo: boolean, chimney: boolean}` ; dessine seulement ces deux pièces. Aucun atelier ou effet implicite. |
| `drawPaintedVesperIndustryMaintenance(ctx, {x = 0} = {})` | Booléen ; réutilise `drawPaintedVesperPart` avec `part:'maintenance'`, `state:'normal'`, base `(x+195,599)`, largeur96, hauteur101. Le lot Vesper acquis doit être chargé séparément. |
| `vesperIndustryBounds({part, x = 0, h = 185} = {})` | Copie du rectangle historique, ou `null` si paramètres non valides. |
| `paintedVesperIndustryFrame(part)` | Copie défensive des rectangles et ancres mesurés. |
| `setPaintedVesperIndustryImage(key, image)` | Injection d'une image décodée de dimensions exactes, utile pour les réceptions. |
| `clearPaintedVesperIndustry()` | Efface le chargement et invalide les promesses de générations antérieures. |

Une image manquante, invalide ou impossible à dessiner ne désactive pas le lot Vesper acquis. Les deux pièces conservent un résultat de repli distinct. Aucun module de simulation n'est importé et aucun champ graphique n'est ajouté à la sauvegarde.

## Réception

Commandes ciblées :

```sh
python tools/index-painted-vesper-industry.py
node --test tests/painted-vesper-industry.test.mjs
node tools/test-painted-vesper-industry.mjs <nouveau-dossier-de-preuves>
```

Le reçu accepté est `docs/validation/painted-vesper-industry-v01511/public-context/receipt.json`. Sa relecture réelle des huit PNG est dans `visual-review.json` au même emplacement. Les empreintes des sources, du renderer, du panorama et de la cellule réutilisée identifient précisément le contenu reçu.

- Quatre tests ciblés : géométrie et ancrages, réutilisation indépendante, raccordement exclusivement PL01 sans mutation et fumée conservée, défauts de chargement et promesses obsolètes.
- Douze contrôles avec les vrais pixels Canvas : deux pièces × trois hauteurs × deux échelles. Aucun pixel hors de l'enveloppe, assise visible, opacité et contexte restaurés.
- Quatre diagnostics : sources sur fonds clair/sombre, trois hauteurs avec l'atelier, deux caméras de second plan dont une fractionnaire.
- Quatre scènes MI01–MI04 rendues normalement avec le panorama peint. Les états proviennent des commandes publiques. MI04 utilise un contexte de campagne explicitement configuré avec la conduite rompue ; ce contexte n'atteste pas un parcours antérieur complet de MI01–MI03.

Le dossier `initial` conserve les quatre premiers diagnostics et le reçu interrompu : le pilote MI04 y cherchait une opération de pompe que le contexte par défaut n'exigeait pas. La correction concerne seulement la préparation du scénario de réception. Les quatre diagnostics ont les mêmes octets dans `public-context` ; aucune source runtime ni image n'a été corrigée après ce premier rendu.

Les huit vues ont été ouvertes. Les silhouettes ne présentent pas de fond opaque ou de contamination de cellule. L'atelier réutilisé garde son assise et ses trois fenêtres peintes, sans superposition des cinq anciens rectangles de fenêtres. Aucun clip supplémentaire de cet atelier n'a été nécessaire. Les tuyaux et la semelle restent visiblement vectoriels ; leur séparation géométrique historique est conservée.

Cette réception concerne le lot industriel. Elle ne constitue ni un navigateur, ni un essai humain, ni une réception des autres nouveaux lots simultanés, ni une livraison Release ou un déploiement. Les structures n'ajoutent aucune collision, population, émission de fumée, interaction écologique ou mission.
