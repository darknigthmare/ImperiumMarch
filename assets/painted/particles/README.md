# Fumée et poussière — réception partielle AS22

Deux PNG originaux, chacun composé de six cellules en trois colonnes et deux lignes,
représentent les âges successifs de la fumée et de la poussière déjà émises par la
simulation. Le lot apporte douze cellules runtime. Il ne clôt pas AS22.

## Raccordement

Le rendu utilise exclusivement les objets existants de s.particles. L'âge dépend
de life/maxLife, sans boucle, horloge supplémentaire ni valeur aléatoire. La
réduction des mouvements conserve la première cellule ; les positions, le rayon
et la transparence suivent toujours leurs valeurs simulées. Une pause conserve
exactement l'image de chaque particule.

Le rayon reste size pour la poussière et size × (2 − life/maxLife) pour la fumée.
Le renderer conserve son alpha historique : life/maxLife, multiplié par 0,32 pour
la fumée. Le module ne modifie pas cet alpha. Chaque cellule est centrée sur x/y.
Le centre et le rayon du nuage utilisent les pixels alpha ≥ 2 ; les rares
résidus alpha = 1 éloignés sont exclus de cette mesure uniquement. La comparaison
préalable des seuils 2, 8 et 32 confirme la même enveloppe visible. Le crop
conserve tous les pixels non transparents du PNG et le rendu est strictement
clippé dans le cercle historique. Les pixels alpha = 1 ne sont pas réécrits.

Les couleurs historiques sont #6d7478 pour la fumée et #bea58c pour la poussière.
Une couleur personnalisée, une ressource indisponible, un contexte sans image ou
un type non couvert conserve le rendu vectoriel. Les étincelles et les explosions
de type blast gardent leur rendu antérieur.

## Origine et indexation

prompts.json documente les créations originales. Les PNG sélectionnés sont
conservés octet pour octet. L'indexeur mesure les dimensions réelles, les cellules,
les limites alpha, les centres et les rayons ; il écrit seulement le manifeste
et le layout. Il ne recolore, ne détoure et ne reconstruit aucun pixel.

## Vérification et limites

Les premières preuves de réception sont conservées avec un snapshot des sources
initiales : leur normalisation incluait les résidus alpha = 1 et sous-estimait
la taille visible des nuages. La réception corrigée est dans
docs/validation/painted-particles-v01510/corrected-anchor/.

Les tests vérifient les six âges, les centres, le clip circulaire, les rayons, la pause, la réduction
des mouvements, les couleurs personnalisées, les chargements partiels et
l'absence de mutations. La réception Canvas décode les PNG réels et utilise
des pas et un tir secondaire réalisés par les entrées publiques de MI01.

Les impacts par matériau, les ricochets, les flammes, les débris, les traces
persistantes de pieds, les performances matérielles et l'approbation artistique
humaine restent ouverts. La réception Canvas ne constitue pas une réception
native du navigateur.
