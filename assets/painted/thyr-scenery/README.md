# Matières et sous-bois de Thyr — 0.15.10

Ce lot ajoute **deux nouveaux atlas Imagegen originaux et dix cellules utilisées au rendu**, sans cellule de référence supplémentaire. Les PNG sont copiés sans modification de pixels. Les prompts exacts, les sorties sélectionnées et les références locales examinées sont conservés dans `prompts.json` ; le manifeste et le layout décrivent les mesures réelles.

| Atlas | Dimensions | Cellules | Contenu |
| --- | --- | ---: | --- |
| `terrain.png` | 1 774 × 887 | 4 | Humus sombre, argile brun-violet fibreuse, schiste humide moussu, tourbe stratifiée. |
| `props.png` | 1 536 × 1 024 | 6 | Pierre moussue, feuilles tombées, écorce morte basse, fougère rampante, coques de graines, lichen sur galet. |

## Références et distinction des éléments vivants

Le panorama `assets/painted/worlds/thyr.png`, les plantes `assets/painted/thyr/plants.png` et l’habitat `assets/painted/thyr/habitat.png` ont été inspectés avant rédaction des prompts. Ils donnent la palette de verts profonds et de bruns violets, la lumière filtrée et les matières fibreuses. Leurs empreintes sont conservées ; aucun de ces fichiers n’a été modifié.

Les petits décors ne remplacent pas les **colonnes, racines porteuses, vignes respirantes FL08, herbes d’écho FL09 ou sites de ponte** déjà dessinés. L’écorce est un fragment mort bas, sans passage porteur. Les coques de graines sont des débris végétaux, sans ponte, créature ni effectif associé. La fougère basse n’utilise ni les membranes de la vigne ni les tiges tubulaires de l’herbe d’écho. Aucune nouvelle espèce de Bible, interaction écologique, lumière ou réaction physique n’est créée.

## Intégration

`src/painted-thyr-scenery.mjs` expose une banque séparée avec deux URL littérales et un repli vectoriel par atlas. Le renderer la réserve à **PL03**, pour MI09–MI12 et OP03. Les six silhouettes occupent les emplacements décoratifs génériques déjà présents, avec une largeur de base de 32 unités et une origine posée sur le sol.

Les textures de sol suivent le contour fourni au module. Les tuiles de 512 unités, leur fondu de 96 unités et les échantillons sont attachés au monde ; la caméra ne déplace pas la matière par rapport au terrain. Les limites des bandes sont alignées sur les pixels de sortie pour éviter les coutures lorsque la caméra a une position fractionnaire ; les sources de matière restent inchangées. La profondeur peinte de 180 unités s’estompe dans le sol profond existant. Les racines de MI09, canaux de MI10, corniche de MI11 et surfaces de MI12 gardent leurs objets, règles de support et rendus propres. Les nouveaux PNG n’ajoutent aucun collider ni objet à la simulation ou au dossier v14.

## Mesures des PNG

`tools/index-painted-thyr-scenery.py` utilise Pillow pour lire les dimensions et l’alpha, puis écrit uniquement le manifeste et `src/painted-thyr-scenery-layout.mjs`. Les frontières du terrain sont x=0/887/1774 et y=0/444/887 ; les petits décors utilisent des cellules de 512 pixels.

Les rectangles visibles sont mesurés au seuil alpha 32, avec deux pixels de marge. Tous les pixels significatifs de chaque cellule sont conservés dans leur rectangle de rendu. Les gouttières ont un alpha maximal de 1. Les fenêtres de matière se trouvent huit pixels à l’intérieur des rectangles visibles et conservent un alpha minimal d’au moins 200. Ces fenêtres sont des recadrages `drawImage`, sans retouche ni réencodage des originaux.

## Contrôles

```sh
node --test tests/painted-thyr-scenery.test.mjs
node tools/test-painted-thyr-scenery.mjs /chemin/de/reception
```

Les tests ciblés contrôlent l’ancrage au monde et au terrain, les raccords de matière et l’opacité, les origines des sprites, l’intégration sur PL03 et les replis après échec ou chargement annulé. La comparaison des états et des surfaces propres aux missions vérifie que les nouveaux décors ne changent pas les faits simulés.

La [réception Canvas corrigée](../../../docs/validation/painted-thyr-scenery-v01510/raster-corrected/receipt.json) distingue les diagnostics de caméra des scènes issues de commandes publiques. Les états reçus montrent un passage guidé sur la première racine MI09, un canal couvert MI10, la corniche reconnue MI11 et le premier relais inspecté MI12. La [relecture visuelle finale](../../../docs/validation/painted-thyr-scenery-v01510/raster-corrected/visual-review.json) conserve les observations et empreintes de chaque image ouverte. Ces preuves ne constituent ni un essai navigateur, ni une réception humaine, ni une validation d’écologie ou d’animation finale.

La réception initiale et sa relecture sont conservées dans le dossier parent : elles documentent les fines coutures constatées à caméra fractionnaire avant correction. Le contrôle Canvas corrigé ajoute douze cas de rasterisation sur une mire opaque uniforme, à quatre décalages de caméra et trois échelles ; aucun atlas généré n’est modifié par cette mire.
