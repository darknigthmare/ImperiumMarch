# Marcheurs peints — 0.15.3

Ce lot contient **six PNG originaux avec transparence, chacun de 1 254 × 1 254 pixels**, soit **96 cellules de pièces et d’états**. Il habille les six châssis déjà jouables et leur présentation au hangar. Les mouvements viennent du rig existant ; aucune nouvelle machine, mission ou pose complète de marche n’est ajoutée par ce nombre de cellules.

## Châssis

| Fichier | Châssis | Appuis | Caractère |
| --- | --- | ---: | --- |
| [wk01.png](wk01.png) | WK01 — Vigie M-12 | 2 | Cabine haute ocre, membres longs |
| [wk02.png](wk02.png) | WK02 — Caracal C-5 | 2 | Cabine compacte bleu pétrole, garde basse |
| [wk05.png](wk05.png) | WK05 — Bastion Q-40 | 4 | Casemate basse sauge, renfort frontal |
| [wk06.png](wk06.png) | WK06 — Arpenteur A-17 | 4 | Nacelle d’observation mauve, très longs membres |
| [wk09.png](wk09.png) | WK09 — Pèlerin H-6 | 6 | Coque longue grès, modules d’endurance |
| [wk10.png](wk10.png) | WK10 — Cloporte CL-4 | 6 | Coque très basse olive, toit segmenté |

## Découpage de chaque planche

Les frontières des quatre lignes et quatre colonnes sont arrondies individuellement, avec les demi-pixels vers le haut. Les cellules alternent donc 313 et 314 pixels ; les rectangles réels sont dans le [manifeste](manifest.json). Ils ne reposent pas sur une taille fictive de 256 ou 384 pixels.

| Ligne | Colonne 1 | Colonne 2 | Colonne 3 | Colonne 4 |
| --- | --- | --- | --- | --- |
| 1 | Coque intacte | Coque endommagée | Coque ancrée | Tourelle et canon |
| 2 | Segment supérieur | Supérieur endommagé | Segment inférieur | Inférieur endommagé |
| 3 | Hanche | Genou | Pied intact | Pied endommagé |
| 4 | Pied ancré | Radiateur intact | Radiateur endommagé | Radiateur réparé |

Les **96 cellules sont utilisables par le moteur** dans les états correspondants. Les pièces proches et lointaines emploient les mêmes cellules, les dernières avec un assombrissement de 30 %. Aucun deuxième jeu de 96 images n’est compté. Les hanches et genoux n’ont pas de variante peinte d’avarie.

## Raccords au moteur

Le [layout](../../../src/painted-walker-layout.mjs) exprime les rectangles de source, le cadrage et les ancres dans les unités de `production-assets.mjs`. Le [module de rendu](../../../src/painted-walkers.mjs) utilise ces données sans modifier la simulation.

Les extrémités des deux segments sont raccordées à la hanche, au genou et à la cheville produits par `productionLegPose`. Le contact de la chaussure correspond à la projection de la cheville sur sa semelle horizontale. Pour une chaussure asymétrique, ce point n’est pas le centre de son rectangle d’alpha. La cheville reste huit unités au-dessus de ce contact ; les dimensions de cadrage sont adaptées à cette contrainte.

La coque peut changer d’orientation indépendamment du canon. Le pivot de l’arme reste à `[player.x + 9, player.y + 8]`, avec une bouche à **92 unités** pour les bipèdes, **112** pour les quadrupèdes et **101** pour les hexapodes. Les petites corrections optiques redressent l’axe réellement peint. Le calcul des tirs et leur dispersion restent ceux de la simulation.

Les pièces peintes remplacent leurs plaques vectorielles ; les véritables vérins entre articulations restent procéduraux. Les anciennes sous-couches épaisses ne doivent pas doubler les jambes peintes. Le capot distal du segment inférieur est limité au plan de sa cheville pour rester derrière le récepteur du pied.

Le radiateur utilise sa boîte vulnérable existante. Ses trois états statiques sont peints. L’impact bref et la réparation progressive conservent le rendu vectoriel et son retour continu. Le boss Cerbère, qui ne fournit pas d’ID de châssis jouable, conserve son rig propre. Un atlas indisponible ou en échec laisse le repli vectoriel par pièce.

## Provenance et reproduction

La génération emploie **image_gen.imagegen intégré**, avec fond transparent. Les [prompts complets](prompts.json) conservent les demandes des six planches. Les PNG sélectionnés sont copiés sans retouche, recadrage physique, rééchantillonnage ni changement d’alpha.

Le fichier [anchors.json](anchors.json) garde les mesures dans les cellules originales. `tools/index-painted-walkers.py` lit les PNG et écrit uniquement le manifeste et le module de layout ; il ne réécrit aucune image.

```sh
python tools/index-painted-walkers.py
node --test tests/painted-walkers.test.mjs
node tools/test-painted-walkers.mjs ../outputs/painted-walkers-qa
npm run build
npm run check:ui
```

Le script de réception décode les vrais PNG et contrôle les 96 silhouettes, la transparence, les marges, les points d’articulation, les bouches et les semelles. Il produit un banc à échelle commune, 54 poses de contrôle, six scènes simulées et six vues du hangar. Ce sont des rendus Canvas, distincts d’une capture navigateur ou d’un essai humain. Le [rapport QA](../../../docs/QA_PAINTED_WALKERS.md) détaille les preuves reçues.

## Statut et limites

Le lot reste **Prototype**. Les cycles finaux de marche, transfert de masse, changement de hauteur et recul, les équipements spécialisés et la flotte complète de douze marcheurs ne sont pas validés par ces pièces. Les six modèles non jouables, les variantes de factions, la diversité civile, la faune et les autres biomes gardent leurs travaux de production propres. La campagne reste MI01–MI14 et la sauvegarde v14.
