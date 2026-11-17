# Matières et petits décors de Kharon — 0.15.10

Deux nouveaux atlas originaux ont été générés avec l’outil intégré **Imagegen** le 17 novembre 2026. Les PNG sélectionnés sont copiés sans retouche, redimensionnement ni réencodage. Les [prompts exacts](prompts.json) conservent les sorties sélectionnées ; le [manifeste](manifest.json) donne dimensions, transparence, empreintes et décompte.

La palette reprend le basalte, le graphite, la poussière noire et le cuivre terni de PL04, du [panorama de Kharon](../worlds/kharon.png) et des [installations MI13](../foundry-sites/README.md). Les lumières fortes restent réservées aux dangers et actions simulés. Les nouvelles matières ne contiennent ni lave, ni vapeur, ni lueur thermique prépeinte.

| Atlas | Dimensions | Cellules utilisées | Contenu |
| --- | --- | ---: | --- |
| `terrain.png` | 1 536 × 1 024 | 4 | Basalte fissuré, scorie compacte, maçonnerie réfractaire cendrée, métal graphite à joints de cuivre terni. |
| `props.png` | 1 536 × 1 024 | 6 | Bloc de basalte, gravier de scorie, pierre soufrée mate, mousse de scorie sur roche, fougère de fonte basse, tronçon de conduite froide. |
| **Total** | **2 atlas** | **10** | **Dix cellules utilisées, aucune référence supplémentaire.** |

## Intégration

`src/painted-kharon-scenery.mjs` expose `loadPaintedKharonScenery`, `paintedKharonSceneryStatus`, `drawPaintedKharonTerrain`, `drawPaintedKharonSceneryPart` et `kharonGroundProp`. Les deux images possèdent des URL littérales distinctes, utilisables dans le build autonome. Les accès de mesure et les fonctions de nettoyage servent aux contrôles et au repli du chargement.

Le renderer utilise ce lot sur **PL04 : MI13 et MI14**. **OP03 appartient à Thyr, PL03**, et reste exclue de ce lot. Les autres planètes conservent leurs propres habillages.

Le terrain reçoit une fonction `groundAt` du renderer. Les matières sont projetées sous ce profil dans des tuiles de 512 unités, sur 180 unités de profondeur. Le fondu de 96 unités entre tuiles reste lié aux coordonnées du monde. La caméra ne déplace pas la matière sur le terrain. Les ponts thermiques, la galerie et leurs surfaces physiques restent produits par les modules de mission existants.

Les six petits décors occupent les emplacements décoratifs déjà dessinés. Leur largeur de base est de 32 unités, avec une échelle uniforme et une origine mesurée à leur contact inférieur. Ils n’ajoutent aucun collider, objet de mission, personne, ressource ou interaction. Les bancs de sol et de décor conservent leurs replis indépendants après défaut de décodage ou de dessin.

La **Fougère de fonte FL10** et la **Mousse de scorie FL11** sont ici décoratives. La fougère ne signale aucun flux de vapeur ; la mousse ne modifie ni bruit ni solidité. La pierre soufrée et la conduite sont froides et sans interaction. Aucun état de température, avertissement, jet ou dommage n’est déduit de ces images. Les capacités finales de la flore restent conçues.

## Mesures et conservation

`tools/index-painted-kharon-scenery.py` lit les PNG avec Pillow et produit uniquement le manifeste et `src/painted-kharon-scenery-layout.mjs`. Il compare aussi leurs SHA-256 aux empreintes figées des deux sorties sélectionnées. Il ne sauvegarde aucune image.

Le terrain possède deux colonnes de 768 pixels et deux rangées de 512 pixels. Les six décors utilisent des cellules de 512 × 512 pixels. Les rectangles visibles sont mesurés au seuil alpha 32, avec deux pixels de marge. Les cellules conservent tous les pixels visibles à ce seuil ; l’alpha maximal des gouttières vaut 1.

Les fenêtres de matière sont situées huit pixels à l’intérieur des limites visibles et gardent un alpha minimal d’au moins 200. Le moteur emploie ces rectangles avec `drawImage`, sans changer les sources. **26,6651 %** des pixels du terrain et **81,9253 %** de ceux des décors sont entièrement transparents.

## Réception

```sh
node --test tests/painted-kharon-scenery.test.mjs
node tools/test-painted-kharon-scenery.mjs docs/validation/painted-kharon-scenery-v01510/raster-corrected
```

Les [quatre tests ciblés](../../../docs/validation/painted-kharon-scenery-v01510/raster-corrected/unit-tests.txt) reçoivent le profil physique, la stabilité lors du déplacement de caméra, les raccords, les fenêtres de matière, l’opacité, les ancrages et les replis. Le véritable `Renderer.drawTerrain()` vérifie l’intégration sur MI13/MI14, l’absence du lot sur les autres mondes et l’absence de mutation des états de mission.

La [réception Canvas corrigée](../../../docs/validation/painted-kharon-scenery-v01510/raster-corrected/receipt.json) décode les deux PNG originaux, reçoit les dix cellules et produit **six vues** : une planche sur fonds clair et sombre, trois diagnostics de caméra, MI13 avec un circuit réellement isolé et MI14 après passage effectif des ouvriers à la galerie. Les scènes de mission sont obtenues par les pilotes publics inchangés, avec des états copiés profondément à la capture. Elles ne revendiquent pas de nouvelle mission achevée.

La [relecture visuelle corrigée](../../../docs/validation/painted-kharon-scenery-v01510/raster-corrected/visual-review.json) reçoit les cinq images modifiées, ouvertes à nouveau, et la planche octet-identique déjà relue. Les matières et petits décors suivent le sol et les silhouettes restent basses. Le cadrage MI14 ne montre pas simultanément tous les ouvriers : les états joints portent leur recensement. Les diagnostics de caméra ne prétendent pas que le joueur ait atteint leurs positions. Aucun navigateur, essai humain, réception audio ou mesure matérielle de performance n’est certifié par ces rendus.

### Correction des coutures aux caméras fractionnaires

Une mire opaque a [reproduit le défaut](../../../docs/validation/painted-kharon-scenery-v01510/raster-corrected/before-fix.json) dans neuf cas fractionnaires : les bords des bandes de huit unités laissaient apparaître de fines colonnes moins opaques. Les limites de dessin sont désormais alignées sur les pixels de sortie pour une transformation horizontale positive. Les rectangles source et les échantillons de terrain restent liés au monde ; ni la caméra, ni l’échelle, ni `terrainAt` ne sont modifiés.

Le reçu corrigé vérifie **douze cas**, quatre positions de caméra aux échelles 1, 1,25 et 1,5. Chaque ligne de 480 pixels conserve un alpha de 255, avec une tolérance RGB d’une unité pour l’arrondi de conversion Canvas. Les [douze fichiers initiaux](../../../docs/validation/painted-kharon-scenery-v01510/raster-corrected/before-fix.json) sont conservés avec leurs empreintes ; la [première réception](../../../docs/validation/painted-kharon-scenery-v01510/receipt.json) reste une preuve distincte.
