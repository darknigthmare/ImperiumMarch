# Nacre — ambulance, matériel et embarcations peintes

**ORDRE DE CENDRE · 0.15.5 · 16 novembre 2026**

Six atlas PNG originaux ajoutent **30 cellules : 29 adressables au rendu, une référence**. Ils habillent les véhicules et équipements déjà présents dans MI05, MI07 et MI08. Ils n'ajoutent aucun véhicule, passager, patient, stock ou résultat de mission.

| Atlas | Cellules | Usage |
| --- | ---: | --- |
| `ambulance.png` | 4 | Carrosseries intacte, endommagée et détruite; roue séparée |
| `equipment.png` | 6 | Caisse inconnue, vérifiée, perdue; balise attachée et perdue; balise détachée de référence |
| `rive-courte.png` | 6 | Attente, embarquement, trajet, arrivée, dégâts, perte |
| `veille-aval.png` | 6 | Même contrat pour le bateau municipal Veille d'Aval |
| `ferry.png` | 4 | Attente/trajet, arrivée, dégâts, perte du bateau civil de MI05 |
| `saisie.png` | 4 | Coque normale, câble libéré, dégâts, perte de Saisie |

## Origine et préparation

Les [prompts](prompts.json) et le [manifeste](manifest.json) conservent génération, dimensions, états, empreintes SHA-256 et chemins de provenance des sorties sélectionnées. Le mode employé est **Imagegen intégré**, avec transparence demandée. La première image de matériel possédait un voile de fond; une édition Imagegen de détourage a produit le PNG finalement retenu. Les six fichiers retenus sont copiés **octet pour octet** : aucun redimensionnement, recoloriage, masquage ou autre retouche par script.

`tools/index-painted-nacre.py` lit l'alpha pour mesurer les rectangles et écrit uniquement le manifeste et `src/painted-nacre-layout.mjs`. Quatre atlas mesurent 1536 × 1024; `ferry.png` et `saisie.png` mesurent 1774 × 887. Les frontières de cellules sont arrondies séparément. Les rectangles gardent une marge de deux pixels et restent dans leur cellule.

## Raccordement au jeu

`src/painted-nacre.mjs` charge les six URL littérales intégrables dans le HTML autonome. Le renderer conserve les dessins vectoriels quand une image manque ou ne se décode pas. Les images ne sont jamais stockées dans la sauvegarde et le rendu ne modifie pas la simulation.

Les roues de l'ambulance sont séparées de la carrosserie. Leurs centres restent à `x ± 58`, `terrainAt(x) − 11`, avec rayon 12, comme dans le rendu antérieur. La rotation suit le déplacement réel `x / 12`; elle reste fixe avec réduction des mouvements. Le cadrage vertical de carrosserie rejoint les passages de roue sans modifier la collision du véhicule. Un berceau graphique relie la caisse à la carrosserie, y compris quand le toit est abîmé; la caisse et la balise conservent leurs positions simulées.

La récupération de la balise la retire du véhicule. La cellule `beacon-recovered` n'est donc jamais affichée sur celui-ci : elle reste une référence de fabrication. Les indicateurs des quatre patients, les libellés de caisse, la progression d'inspection, le câble de remorquage, les flashs et les barres de santé restent calculés depuis les faits existants.

Les bateaux ne contiennent aucune personne peinte. Les personnes de MI08 et les marqueurs d'occupants MI05 conservent leurs chemins de rendu séparés. Un dommage acquis continue de sélectionner l'état endommagé après une arrivée. Le cadre `released` de Saisie exige le treuil réellement libéré; une inspection ne le déclenche pas. Les quilles se raccordent au même repère physique `y + h / 2`, indépendamment des gangways et des parties effondrées. Le rendu ne change ni marée, immersion, trajet, capacité, débarquement ou population.

## Réception

- `node --test tests/painted-nacre.test.mjs` : six tests ciblés, dont roues, repli vectoriel, retrait de balise, sélection des états et non-mutation des domaines.
- `node tools/test-painted-nacre.mjs` : décodage réel des six PNG, empreintes, transparence, 30 cellules sans coupe significative, quilles et cinq vues Canvas.
- Preuves : `docs/validation/painted-nacre-v0155/receipt.json`, planche des 30 cellules, quatre états de l'ambulance et trois vues de missions.

Les vues MI05/MI07/MI08 utilisent le renderer normal après 120 ticks publics, avec cadrage de caméra diagnostique. Aucun acteur n'est téléporté pour ces vues. La planche ambulance impose ses états sur des copies indépendantes pour les examiner; elle ne prouve pas un déroulé de mission. **Ces contrôles Canvas ne constituent ni une réception navigateur, ni un essai humain, ni une validation artistique finale.** Les animations fines de navigation, autres populations et décors de Nacre restent dans le programme de production.
