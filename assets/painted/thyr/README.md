# Vie de Thyr — sprites peints 0.15.4

Huit PNG RGBA originaux générés avec `image_gen.imagegen`, **62 cellules : 58 adressables au rendu et quatre références**. Les fichiers restent identiques aux sorties de génération; les rectangles, tailles et points d'attache sont mesurés dans les sources. Aucune retouche de pixels ni suppression de fond n'a été effectuée après génération.

| Atlas | Cellules | Dimensions | Utilisation |
| --- | ---: | --- | --- |
| `longuedorse-adult.png` | 8 | 1774 × 887 | Deux adultes existants de MI09; attente, quatre pas, arrivée, exclusion vivante, perte |
| `longuedorse-young.png` | 8 | 1774 × 887 | Deux jeunes existants, avec les mêmes états |
| `fan-colony.png` | 6 | 1536 × 1024 | Colonies existantes; repos, quatre positions de vol, perte |
| `column.png` | 6 | 1536 × 1024 | Deux silhouettes de support, chacune intacte, abîmée ou détruite |
| `habitat.png` | 6 | 2172 × 724 | Trois états d'habitat et trois états de racine porteuse |
| `plants.png` | 8 | 1774 × 887 | Vigne respirante et Herbe d'écho; herbe aplatie en référence |
| `leth.png` | 8 | 1774 × 887 | Six poses couvrant cinq états; enregistreur et bâton isolés en référence |
| `rootwatcher.png` | 12 | 1448 × 1086 | Guetteur-racine de OP03 : repos, huit pas, préparation, attaque; mort en référence |

Les seize pas du lot sont des poses de prototype : quatre pour chaque âge de Longue-dorse et huit pour le Guetteur-racine. Ils ne constituent pas une réception d'animation finale. Le nombre de cellules ne représente pas un nouvel effectif.

## Sources et indexation

- [prompts.json](prompts.json) conserve les huit prompts complets, y compris les contraintes de grille demandées.
- [manifest.json](manifest.json) décrit les dimensions réellement produites, SHA-256, transparence, cellules et usages.
- [index-painted-thyr.py](../../../tools/index-painted-thyr.py) produit seulement le manifeste et [painted-thyr-layout.mjs](../../../src/painted-thyr-layout.mjs).
- [painted-thyr.mjs](../../../src/painted-thyr.mjs) charge et dessine les images dans les renderers existants.

Les cellules de `habitat.png` utilisent deux rangées **inégales**, délimitées par **0, 500 et 724 pixels**, car c'est la géométrie réellement produite. Chaque entrée porte son rectangle `cell`; aucun cadre ne traverse une autre image. Les cordes des maisons sont mesurées à leurs sommets et raccordées au support dans la scène. Les recadrages reposent sur l'alpha à partir de 32, avec deux pixels de marge, sans modifier le PNG.

## Autorité du jeu

Les positions, dégâts, arrivées, pertes et consentements continuent de provenir de la simulation. Les racines dessinées suivent le contour fourni par `livingRouteSurfaceAt`. Les animaux à l'arrêt cessent leur cycle de marche; les historiques graphiques restent hors sauvegarde. Les références d'outils ne sont pas superposées aux outils déjà peints sur Leth. Aucun cadavre persistant, nouvelle personne, capacité écologique ou châssis jouable n'est ajouté par ce lot.

Si le chargement ou le dessin d'un atlas échoue, sa présentation vectorielle reste disponible. Les exports SVG historiques sont conservés.

## Réception

```sh
python tools/index-painted-thyr.py
npm run check:thyr -- docs/validation/painted-thyr-v0154
```

La [réception Canvas](../../../docs/validation/painted-thyr-v0154/receipt.json), le [bilan de production](../../../docs/PRODUCTION_V15_4.md) et le [rapport QA](../../../docs/QA_PAINTED_THYR_CERBERE.md) distinguent les scènes simulées, bancs diagnostiques, navigateur et critères humains encore ouverts.
