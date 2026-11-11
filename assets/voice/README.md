# Thyr — Une voix au ras du sol

Lot original de la version 0.12 : **six composants, vingt-six variantes SVG et deux planches PNG**. Le manifeste identifie les octets, dimensions nominales, limites dessinées, pivots, ancres et références canoniques de chaque export.

| Composant | États | Usage |
| --- | --- | --- |
| listening-station | idle, listening, recorded, lost | Trois postes distincts. Une image de signal n’accorde aucun relevé ; les données acquises et la perte ultérieure du support restent séparées. |
| resonance-emitter | transmitting, working, seized, preserved, destroyed | L’appareil et sa fixation au sol. L’état saisi montre un socle vide ; choisir la capture ne retire pas le matériel à la place de l’opération. |
| nesting-site | intact, disturbed, damaged, lost | Chaque dessin représente un site local. Les motifs de ponte ne constituent ni un recensement humain ni un comptage de citoyens Khelt. |
| root-passage | unknown, surveyed, damaged, destroyed | Repère de reconnaissance de la corniche. La surface continue portant les vrais pieds est tracée depuis `voiceSurfaceAt`, pas depuis la courbe décorative de cette vignette. |
| leth-interpreter | waiting, listening, speaking, refusing, lost | Une représentation locale originale de Leth, avec outils d’interprétation et vêtements personnels. Le refus n’invente aucun déplacement, embarquement ou recrutement. |
| translation-record | untranslated, copying, copied, lost | Support impérial inspectable. Le support détruit et une copie déjà conservée peuvent coexister ; le dessin ne supprime pas la copie du dossier. |

## Fabrication et intégration

`src/voice-assets.mjs` est la source géométrique commune aux SVG et au Canvas. `src/voice-renderer.mjs` lit les positions, les travaux, les dégâts, la disponibilité du témoin et les permissions depuis l’état de simulation. Le renderer ne fait avancer aucun travail et ne constitue aucune preuve TE01.

Reconstruction : `node tools/build-voice-assets.mjs`. Comparaison raster des géométries et de leurs exports : `npm run check:assets-render`, avec le validateur de développement épinglé du projet.

Les planches indiquent les échelles employées ; elles sont des supports de production. Les scènes réellement simulées et rendues sont consignées séparément dans `docs/previews/mi11-scenes.json`.

## Limites de réception

Ce lot propose les formes nécessaires au prototype de MI11. Il ne termine pas AS13 : anatomie complète, diversité des cités, gestes finaux, vêtements, architecture et cohérence de toute la civilisation Khelt restent à produire et à relire. La présence de Leth n’accorde ni alliance militaire ni consentement à diffusion. Une planche, une comparaison raster et une scène Canvas ne sont pas des essais humains ou une réception native dans le navigateur.
