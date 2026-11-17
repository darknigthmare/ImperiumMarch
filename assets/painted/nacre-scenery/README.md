# Matières et petits décors de Nacre — 0.15.9

Deux nouveaux PNG originaux **Imagegen**, copiés sans modification de pixels, donnent des matières de sol et six petites silhouettes aux emplacements décoratifs existants de Nacre. Les prompts exacts et les noms des sorties sélectionnées figurent dans `prompts.json` ; `manifest.json` conserve dimensions, transparence, empreintes et décompte.

| Atlas | Dimensions réelles | Cellules utilisées | Contenu |
| --- | --- | ---: | --- |
| `terrain.png` | 1 774 × 887 | 4 | Roche humide, limon stratifié, maçonnerie salée et métal de digue patiné. |
| `props.png` | 1 536 × 1 024 | 6 | Rocher, galets, Fleur de sel, algues, bollard avec corde et planches usées. |
| **Total** | **2 atlas** | **10** | **Aucune cellule de référence supplémentaire.** |

## Intégration et portée

Le module `src/painted-nacre-scenery.mjs` charge ses deux URL littérales séparément. Le renderer emploie ce lot sur **PL02 seulement** : MI05–MI08 et la simulation indépendante OP02. Un décodage ou un dessin défaillant laisse disponible le repli vectoriel de la banque concernée.

Les matières sont projetées sous le profil fourni par `terrainAt`, dans des tuiles de 512 unités et sur une profondeur de 180 unités. Un fondu de 96 unités relie leurs bords ; les échantillons suivent les coordonnées du monde et restent identiques lorsque la caméra se déplace. Le sol profond conserve son fondu vers la couleur existante. Ni le profil de terrain, ni les ponts, ni les contacts des pieds ne sont modifiés.

Les six petits décors remplacent les silhouettes génériques des emplacements déjà dessinés. Leur largeur de base est de 32 unités, avec une échelle uniforme mesurée sur l’alpha ; leur origine rejoint le sol. Ils n’ajoutent aucun objet à la simulation, aucune collision, aucune population ou interaction d’amarrage. L’eau, les ouvertures et les surfaces de passage conservent leurs règles.

La **Fleur de sel FL06 est ici décorative**. Sa présence ne fournit aucune mesure de marée, anomalie de pompe ou autre indice mécanique. La plante et l’algue ne reçoivent pas d’animation, de lumière dynamique ou d’interaction dans cette tranche. Les critères complets de flore restent ouverts.

## Mesures des originaux

`tools/index-painted-nacre-scenery.py` lit les PNG avec Pillow pour produire le manifeste et `src/painted-nacre-scenery-layout.mjs`. Il n’écrit aucune image. Les frontières de l’atlas de terrain sont x=0/887/1774 et y=0/444/887 ; les petits décors utilisent une grille de 512 pixels.

Les rectangles visibles sont mesurés au seuil alpha 32, avec deux pixels de marge. Les dix cellules conservent tous leurs pixels à partir de ce seuil. Les gouttières ont un alpha maximal de 1 ; les faibles traces résiduelles du générateur ne deviennent pas des silhouettes voisines. Les fenêtres de matière se trouvent huit pixels à l’intérieur des rectangles visibles et ont un alpha minimal d’au moins 200. Ces fenêtres sont des recadrages `drawImage`, sans retouche, rééchantillonnage ou réencodage des sources.

## Réception

```sh
node --test tests/painted-nacre-scenery.test.mjs
node tools/test-painted-nacre-scenery.mjs /chemin/de/reception
```

Les quatre tests ciblés reçoivent les surfaces réelles et le défilement caméra, les raccords et l’opacité, les ancrages et l’absence de modification des faits de mission, puis les replis après échec ou annulation de chargement. L’intégration vérifie les quatre missions de Nacre et l’absence du lot dans les autres mondes.

La [réception Canvas](../../../docs/validation/painted-nacre-scenery-v0159/receipt.json) décode les deux PNG, reçoit les dix cellules et produit **huit vues** : une planche, trois caméras de diagnostic et quatre scènes issues de commandes publiques. MI05 montre un pont effectivement relevé ; MI06 une évacuation commencée ; MI08 les groupes au quai depuis la fixture historique MI07 ; OP02 180 commandes de marche dans une simulation indépendante.

La [relecture des huit images](../../../docs/validation/painted-nacre-scenery-v0159/visual-review.json) distingue ces diagnostics d’un essai navigateur. Aucun essai humain, réception audio, mesure de performance matérielle ou achèvement de mission supplémentaire n’est déduit de ces images.
