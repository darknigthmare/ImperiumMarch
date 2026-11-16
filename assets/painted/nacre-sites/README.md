# Installations peintes de Nacre — 0.15.6

Ce lot habille les installations déjà simulées de MI05 à MI08. Il contient **5 atlas PNG RGBA originaux, 30 cellules de rendu et aucune cellule de référence**, soit **7 779 670 octets**. Tous les PNG mesurent 1254 × 1254 pixels. Aucun véhicule du lot Nacre 0.15.5 n’est régénéré.

## Atlas et usages

| Fichier | Cellules | Contenu effectivement utilisé | Rendu |
|---|---:|---|---|
| `barriers.png` | 6 | Panneau MI06 et vantail MI08, chacun intact, endommagé et détruit | `drawDike`, `drawDepartureSite` |
| `hydraulics.png` | 8 | Pompe intacte/détruite, rotor séparé, vanne, volant séparé, commande de porte intacte/détruite, verrou séparé | `drawDikeControls`, `drawDike`, `drawDepartureSite` |
| `houses.png` | 6 | Deux maisons, chacune intacte, endommagée et détruite | `drawDike`; maisons d’origine de `drawDepartureSite` |
| `shelters.png` | 4 | Abri du quai ouest, accueil médical civil, accueil médical impérial, refuge réutilisé pour les trois accueils MI08 | `drawDike`, `drawAmbulanceSite`, `drawDepartureSite` |
| `quays.png` | 6 | Quai fixe, rampe repliée, lame de platelage, treuil intact, tambour séparé, treuil détruit | `drawChannel`, `drawAmbulanceSite`, `drawDepartureSite` |

Les états « alimenté », « circuit choisi », « accueil prêt » ou « passage ouvert » ne gonflent pas le nombre de cellules. Ils utilisent les pièces existantes avec les mouvements, lampes, aiguilles, câbles et indications calculés par le jeu. Une rampe MI08 détruite garde le rendu vectoriel existant ; aucune image de destruction de rampe n’a été inventée.

## Origine et intégrité

Les cinq images ont été produites avec l’outil Imagegen intégré et `transparent_background: true`. Les requêtes exactes, les chemins des originaux et leur sélection figurent dans `prompts.json`. Les PNG sélectionnés ont été copiés octet pour octet, sans retouche, réduction, recompression, détourage ou assemblage hors Imagegen.

`tools/index-painted-nacre-sites.py` lit l’alpha et produit uniquement `manifest.json` ainsi que `src/painted-nacre-sites-layout.mjs`. Il ne réécrit jamais les images. Les SHA-256, dimensions, rectangles source, rectangles de cellule, ancres et nombres de pixels transparents figurent dans le manifeste. Les fonds contiennent entre 44 % et 63 % de pixels d’alpha exactement nul ; la réception Canvas vérifie également les silhouettes sur deux fonds et en scène.

Les cellules inférieures de `shelters.png` ont des largeurs inégales, séparées à x = 498. Le bas de `hydraulics.png` sépare la commande détruite et le verrou à x = 960. Le moteur utilise les rectangles `cell` et `source` mesurés, et non une grille régulière déduite du nombre de colonnes.

## Ancrages et mouvements

- Les portes des maisons, des accueils et du refuge rejoignent la position d’arrivée existante, au sol. Aucune personne n’est peinte dans un bâtiment.
- Le panneau de MI06 garde son centre et son assise. Son verrou tourne autour de `[panel.x − panel.w / 2 + 5, panel.y − 8]`. Les étais du marcheur et l’étai de fortune restent les segments calculés par le renderer.
- Le rotor de pompe tourne autour de `[auxiliary.x − 6, auxiliary.y − 2]`. Le volant de vanne reste en `[valve.x, valve.y + 11]`. La réduction des mouvements fige ces rotations, sans changer les états simulés.
- Le vantail de MI08 suit `departureGateBounds(gate).y`, soit la levée physique existante de 140 unités. Les rails restent fixés au sol. La ruine reste au pied de l’ouvrage, même si l’état détruit contient `opening = 1`.
- Le cadran de commande reçoit une aiguille calculée à partir de la progression ; le sprite ne contient pas d’aiguille permanente.
- Les treuils et leurs tambours gardent leur centre simulé. Les câbles restent des segments reliant le treuil à la position réelle de la barge et disparaissent selon `released`.
- Le tablier MI05 et la rampe préparée MI07 utilisent des lames dessinées le long des segments du terrain existant. La passerelle MI08 conserve sa pente pilotée par la progression.
- Le pont du quai rejoint le niveau de contact existant ; ses pieux restent en dessous de ce niveau.

L’eau des maisons reste calculée avec `ground − 126 × waterLevel`. Le repère blanc reste exactement au seuil `ground − 126 × 0.65`. Les graduations de marée, pressions, flèches de circuit, marques d’appui, signaux de disponibilité et personnes restent codés séparément. Les scènes et sauvegardes ne reçoivent aucun nouveau champ graphique.

## Chargement et repli

`src/painted-nacre-sites.mjs` exporte `loadPaintedNacreSiteAssets()` et `paintedNacreSiteAssetSnapshot()`. Les cinq URL littérales permettent l’inclusion dans l’HTML autonome. Le renderer conserve les formes vectorielles en cas d’absence ou d’échec de décodage. Les exports SVG historiques de `production-assets.mjs` restent inchangés.

## Réception

```sh
python tools/index-painted-nacre-sites.py
node --test tests/painted-nacre-sites.test.mjs
node tools/test-painted-nacre-sites.mjs
```

Le lot possède six tests ciblés et dix vues Canvas dans `docs/validation/painted-nacre-sites-v0156/`. Le reçu distingue les cinq scènes au renderer normal, cadrées après 120 ticks publics, des diagnostics aux états imposés. Il ne constitue ni une partie terminée, ni une réception navigateur, ni une reconnaissance humaine des silhouettes. Le rapport détaillé est `docs/QA_PAINTED_NACRE_SITES.md`.

Les fiches concernées sont AS44 pour la seule matière du tablier, AS45 pour les treuils séparés, AS46 pour les quais, AS48 pour la digue et ses commandes, AS49 pour rampe et accueils, AS50 pour les portes/refuges/quais et AS52 pour les maisons. Les sons AS47, la lecture humaine, les critères de mission et les statuts de Bible restent distincts.
