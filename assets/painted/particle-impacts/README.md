# Étincelles et petites particules de détonation — AS22 partiel

Deux atlas originaux ImageGen apportent douze cellules utilisées au rendu :
six âges de spark et six âges de blast. Aucun émetteur, projectile, matériau,
contact, appel aléatoire ou champ sauvegardé n'est ajouté.

## Géométries conservées

Pour spark, la tête reste à x/y et la queue à x − 0,025 vx / y − 0,025 vy.
La largeur reste 2 unités et les deux extrémités rondes gardent un rayon de 1.
Le sprite suit la vitesse actuelle, y compris après freinage et gravité.
La propriété size de spark n'est jamais consultée. La mesure de la texture
sert à couvrir le segment existant ; le dessin est limité par un clip capsule
effectué avant son étirement. Aucune longueur minimale n'est imposée.

Pour blast, une cellule représente une seule petite particule, au centre x/y
et dans le cercle existant de rayon size. Ce rayon vaut initialement 2 à moins
de 6 unités. Le rayon de dégâts de 90 unités n'est jamais utilisé par ce lot.
Les cellules ne contiennent ni fumée, ni gerbe supplémentaire, ni onde de choc.

Les six âges dépendent exclusivement de 1 − life/maxLife, sans boucle.
La réduction des mouvements fixe age-0 mais conserve les coordonnées, la
direction courante du spark, le rayon du blast, l'alpha et l'expiration.
Une pause ne fait avancer aucun âge. Le module conserve l'alpha du caller.

## Origine, mesure et replis

Les [prompts et sorties sélectionnées](prompts.json) conservent la provenance
des deux PNG. Les originaux sont copiés octet pour octet, sans réencodage ni
retouche par script. L'indexeur écrit seulement les rectangles, mesures et le
[manifeste](manifest.json).

Les sources comprennent tous les pixels non transparents. Les seuils alpha
2, 8 et 32 sont mesurés pour chaque cellule ; l'alpha ≥ 2 détermine l'enveloppe
utile et son centre. Les résidus alpha = 1 sont exclus de cette mesure
uniquement. Les clips historiques limitent le dessin complet.

Les palettes canoniques sont #ffd09a pour spark et #f4a56d pour blast.
Une palette personnalisée, un type inconnu, une image absente ou invalide et
une géométrie non exploitable conservent le rendu vectoriel existant.
Les segments nuls ou non représentables restent aussi vectoriels.

## Réception et limites

Les tests vérifient les ancres, les caps, les orientations, les faibles vitesses,
les six âges, les pauses, la réduction des mouvements, les replis et
l'absence de mutation. La [réception Canvas reçue](../../../docs/validation/painted-particle-impacts-v01511/verified-integration/receipt.json)
décode les PNG réels, contrôle leurs empreintes et reçoit des tirs et impacts
par commandes publiques MI01 sur le panorama Vesper peint.

Le [premier reçu](../../../docs/validation/painted-particle-impacts-v01511/receipt.json)
et ses vues restent conservés : ses contrôles de cellules et de rendu passent,
mais son garde de stabilité des sources échoue car l'intégration du lot
industrie a modifié le renderer pendant la réception. La réception séparée
ci-dessus constate les empreintes stables après cette intégration.

Les planches agrandies sont des diagnostics, sans événement de gameplay.
Les textures restent très petites à la taille réelle : la lisibilité du signal
prime sur les détails de peinture. Canvas ne constitue pas un essai humain,
une réception native du navigateur ou une mesure de performances matérielles.
AS22 reste ouvert pour les impacts par matériau, les ricochets, les flammes,
les débris et les traces persistantes.
