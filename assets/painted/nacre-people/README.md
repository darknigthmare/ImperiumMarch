# Personnes de Nacre peintes — 0.15.8

Trois PNG originaux ajoutent **28 cellules adressables au rendu**, dont **12 poses de marche**. Ces cellules habillent les personnes déjà présentes dans les missions ; elles ne créent ni effectif ni identité historique.

| Atlas | Dimensions | Cellules | Utilisation |
| --- | --- | --- | --- |
| `technicians.png` | 1774 × 887 | 8 | Attente, quatre appuis de marche, verrouillage, couvert et perte des techniciens. |
| `staff.png` | 1448 × 1086 | 12 | Conductrice et soignant : attente, quatre appuis de marche et perte pour chacun. |
| `patients.png` | 1312 × 1199 | 8 | Quatre apparences de patients sur chariot et leurs états couverts de perte. |

Les fichiers proviennent du générateur intégré `image_gen.imagegen`, avec transparence demandée. Les prompts exacts et les sorties sélectionnées sont dans `prompts.json`. Les octets des trois PNG sont conservés sans retouche, redimensionnement ni détourage après génération. `manifest.json` contient leurs SHA-256, dimensions, rectangles et mesures d’alpha.

## Raccordement

`src/painted-nacre-people.mjs` charge les trois atlas et retourne `false` si une image n’est pas prête ou devient invalide. Le renderer garde alors son rendu existant. Une erreur de dessin invalide uniquement l’atlas concerné et restaure le contexte Canvas.

- **MI06 :** les deux techniciens partagent une apparence de rôle. Le verrouillage et la protection suivent `phase` et `covering`. Les dix résidents gardent leur rendu existant.
- **MI07 :** les deux membres du personnel et les quatre patients sont dessinés aux positions de leurs corps simulés. Les personnes à bord et celles déjà accueillies restent masquées. Les noms de rôles, jauges et indicateurs de l’ambulance restent indépendants des images.
- **MI08 :** les techniciens et patients exposés utilisent ces images. Un membre du personnel ne reprend l’apparence précise de la conductrice ou du soignant que si son `originalId` est connu. Le personnel issu d’un agrégat sans identité, Mara, le responsable du quai, les équipages et les autres habitants gardent leur rendu existant. À bord, les indicateurs de pont sont conservés ; aucun corps complet supplémentaire n’est ajouté. Les pertes de MI08 restent absentes du dessin comme auparavant.

La marche suit la distance réellement parcourue entre deux temps de simulation. Un arrêt, un blocage ou une téléportation ne fait pas marcher sur place. Réafficher le même temps conserve exactement la pose ; la réduction des mouvements sélectionne l’attente. L’historique est une `WeakMap` de présentation : aucun champ n’entre dans les sauvegardes.

`tools/index-painted-nacre-people.py` mesure les frontières des cellules séparément, les demi-pixels vers le haut. Il calcule les rectangles d’alpha au seuil 32 et les origines du buste au seuil 96, puis écrit uniquement le layout, `anchors.json` et le manifeste. Le repère bas visible des semelles ou roues est appliqué à `person.y + person.h / 2`. Les collisions restent inchangées.

## Vérification de cette tranche

- `node --test tests/painted-nacre-people.test.mjs` : neuf tests ciblés couvrant géométrie, mouvement, pause, visibilité, identités, pertes, chargement et reprise après une erreur de dessin.
- `node tools/test-painted-nacre-people.mjs docs/validation/painted-nacre-people-v0158` : décodage des trois originaux et réception des 28 cellules sans alpha significatif coupé.
- Deux bancs graphiques distinguent les cellules et les repères au sol. Trois scènes Canvas sont atteintes par les commandes publiques : verrouillage MI06, personnel extérieur MI07 et transfert des patients MI07. Elles chargent également le panorama peint de Nacre pour vérifier les petites silhouettes et les labels sur le fond réellement intégré. Les deux pilotes vont jusqu’à la victoire ; la simulation n’est jamais modifiée par le renderer.

L’inspection des trois scènes confirme que les labels de la conductrice et du soignant restent lisibles devant l’eau. Les silhouettes conservent leur petite taille de jeu : pendant le verrouillage et le transfert, des corps et labels se superposent localement aux jambes du marcheur ou à l’ambulance, à leurs positions simulées. Les bancs agrandis vérifient les découpes et proportions ; ils ne remplacent pas cette limite de lisibilité en situation. La réception enregistre le SHA-256 du panorama et du renderer utilisé, et vérifie que ce dernier ne change pas pendant le rendu.

Ces scènes sont des **rendus Canvas**, pas des captures de navigateur. La réception des animations finales, un parcours humain et une nouvelle recette native de MI08 restent ouverts. Les preuves sont dans `docs/validation/painted-nacre-people-v0158/reception.json` et `visual-review.json`.
