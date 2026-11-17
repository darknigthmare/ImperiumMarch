# Horizons peints — Nacre, Thyr et Kharon

**ORDRE DE CENDRE · 0.15.8 · 17 novembre 2026**

Les trois PNG originaux sont des panoramas de fond, sans grille ni poses. Ils sont comptés séparément des atlas de sprites. Chaque image mesure **2 172 × 724 pixels**, avec un rapport 3:1. Les fichiers Imagegen retenus sont copiés sans retouche, rééchantillonnage ni réencodage.

| Image | Affectation | Lecture du monde |
| --- | --- | --- |
| `nacre.png` | PL02, MI05–MI08 et simulation de Nacre | Estuaire, quais sur pilotis, digues, grues, métal humide, brume saline. |
| `thyr.png` | PL03, MI09–MI12 et simulation de Thyr | Vallée forestière, colonnes d’écorce, membranes et habitat tissé lointain. |
| `kharon.png` | PL04, MI13–MI14 | Basalte, fonderies en service, conduites de cuivre et vapeur. |

Les bâtiments lointains appartiennent au décor. Leur dessin ne crée ni maison interactive, ni habitant, ni arrivée, ni appui ou collision. Les installations de mission, les surfaces physiques, les personnes et la météo restent ceux du prototype.

`src/painted-worlds.mjs` charge chaque image indépendamment. Le cadrage préserve son rapport d’origine et parcourt une portion finie de l’image avec la progression de caméra : aucun bouclage ni raccord de tuile n’est nécessaire. Le champ reste couvert au début et en fin de mission. La réduction des mouvements fixe le panorama au centre. Le rendu historique de chaque planète reste disponible si le PNG manque ou échoue au décodage.

Le panorama existant de Vesper conserve son fichier et ses propriétés `Renderer.panorama` / `panoramaReady`. Son cadrage bénéficie de la même projection sans déformation et sans bord découvert.

Les [prompts exacts](prompts.json) et [empreintes des originaux](manifest.json) documentent la génération intégrée. `npm run check:worlds` reçoit le décodage, la couverture de l’image et quatre ouvertures de mission dans le moteur Canvas. Les résultats de la tranche sont conservés dans `docs/validation/painted-worlds-v0158/`. Ces rendus ne sont pas des captures de navigateur ni des parties complètes.
