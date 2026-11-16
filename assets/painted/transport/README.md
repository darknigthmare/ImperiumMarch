# Transports peints — 0.15.5

Quatre atlas originaux RGBA comportent **20 cellules toutes utilisées au rendu**. Le train de MI02, le porteur et les deux caisses de MI13 gardent leurs corps et leurs états existants. Ces cellules désignent des carrosseries, roues et variantes, pas vingt véhicules supplémentaires.

| Fichier | Cellules | Utilisation |
| --- | ---: | --- |
| `locomotive.png` | 4 | Intacte, endommagée, épave et roue ferroviaire séparée |
| `wagons.png` | 8 | Trois états minerai; wagon occupé fermé, endommagé, détruit, ouvert et ouvert endommagé |
| `carrier.png` | 4 | Plateau intact, endommagé, détruit et roue industrielle |
| `cargo.png` | 4 | Caisse scellée, marquage copié, caisse endommagée et détruite |

## Sources et découpe

Les fichiers sont les sorties **Imagegen** originales, copiées sans retouche, conversion ni redimensionnement. `prompts.json` conserve chaque prompt et le nom de la sortie sélectionnée. Le porteur a reçu une seconde génération d'édition : sa cabine est sous le plateau pour laisser les deux emplacements de cargaison libres. La première proposition non retenue ne fait pas partie des assets du jeu.

`tools/index-painted-transport.py` mesure les masques alpha et produit `manifest.json` et `src/painted-transport-layout.mjs`. Il ne réécrit aucun PNG. Les frontières de cellules sont arrondies séparément, demi-pixels vers le haut. Les dimensions et empreintes exactes sont dans le manifeste; aucune taille suggérée dans un prompt n'est traitée comme une dimension livrée.

`anchors.json` fixe le plateau du porteur et les fenêtres du wagon. Le rendu sélectionne uniquement les rectangles source, sans exporter des copies recompressées. L'axe de chaque roue est le centre mesuré de la roue isolée.

## Intégration mécanique

Le train conserve les positions de ses trois corps, ses deux roues de présentation par corps, ses attelages, ses harpons et ses compteurs de personnes. Les roues conservent leur orientation à l'arrêt. Les suspensions raccordent leurs centres aux découpes de carrosserie. Leurs positions ne créent pas des contacts supplémentaires dans la simulation.

Les silhouettes visibles dans la fenêtre suivent `hostagesTotal - hostagesLost`; elles disparaissent après la résolution du sauvetage ou la destruction du wagon. Aucun occupant n'est peint dans les PNG. Une porte ouverte dépend de `rescueResolved`, pas de l'apparence ou du chargement de l'image.

Les quatre roues du porteur utilisent les positions, rayons et surfaces de `carrier.wheels`. Le plateau est enregistré à `carrier.y - carrier.h / 2`, qui est également la base physique des deux caisses avant leur transfert. Ces caisses sont rendues séparément à leurs vraies positions pendant le levage. Les états de dommage priment sur la marque graphique de copie; le libellé et la preuve copiée gardent les faits de la simulation.

Chaque lot conserve le repli vectoriel après absence ou échec de décodage. Les historiques et fichiers SVG antérieurs sont conservés. Le réglage de réduction des mouvements immobilise les roues de présentation; il ne change ni le déplacement ni les contacts.

## Réception

`node --test tests/painted-transport.test.mjs` vérifie les états, les roues, les passagers, les caisses, le chargement et l'absence de mutations des faits sauvegardés. `npm run check:transport -- docs/validation/painted-transport-v0155` décode les vrais PNG, vérifie les rectangles et ancres et produit une planche diagnostique ainsi que quatre scènes de mission atteintes par commandes publiques.

Les vues Canvas ne sont pas des captures de navigateur. La planche utilise des copies d'états pour montrer les variantes; elle ne prétend pas que ces pertes ont été produites dans une mission accomplie. Le lot ne modifie aucune règle de simulation, aucun compte de population et aucune sauvegarde v14.
