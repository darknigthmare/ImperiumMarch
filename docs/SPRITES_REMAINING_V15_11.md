# Sprites restant à produire après la 0.15.11

Lecture ciblée du commit applicatif `2dbdd01279cd21c305d5811905e05c362d15d82e`, effectuée le 17 novembre 2026. Les cinq lots ci-dessous concernent des formes procédurales encore visibles lorsque les images actuelles sont chargées. Ce document propose des travaux futurs : aucun de ces lots n’est produit ou reçu ici. Les priorités proposées ne modifient ni les statuts ni les critères de la [Bible](../data/bible.json).

## 1. Accessoires génériques de terrain — P1

**Fiches :** AS16, AS35 ; PR12, PR39 ; PX04, PX20, PX24. **Fonctions :** `drawRelay`, `drawEvidence`, `drawSupply` dans [src/renderer.mjs](../src/renderer.mjs).

Les trois relais d’OP01, le terminal générique et la caisse de ravitaillement restent vectoriels. Le terminal apparaît dans les opérations autonomes et les contextes de campagne qui utilisent `drawEvidence`, notamment MI01 et MI03. Les caisses sont communes aux missions et opérations.

Un kit peut remplacer les corps existants : relais intact ou détruit, terminal, caisse. Conserver les ancres au terrain ou à `item.x/item.y`, les collisions, libellés, voyants, barres de santé et progression du scan. La caisse disparaît après consommation. Une caisse vide persistante, un réassort ou une ouverture animée demanderaient un nouveau comportement. Les relais génériques ne sont pas les bâtiments de MI03 ni les relais de MI12 déjà peints. AS33 concerne la finition du HUD des stocks ; une image de caisse ne reçoit pas ce critère.

## 2. Décor et accessoires du hangar — P1

**Fiches :** AS24 ; PR09, PR21 ; PX24, PX30. **Fonctions :** `Renderer.renderHangar` dans [src/renderer.mjs](../src/renderer.mjs), appelé par [src/main.mjs](../src/main.mjs).

Le cadrage de 960 × 480 conserve un mur à travées, des poutres, un sol en perspective, des suspentes, une caisse de service, un support d’outil et une silhouette d’équipage anonyme, tous procéduraux. Un fond et des accessoires peints peuvent reprendre ces emplacements.

Conserver le marcheur peint séparé, son échelle commune aux six châssis, ses appuis et sa pose de présentation. Les intitulés variables restent du texte. Ce lot ne crée ni poste d’équipement interactif, ni membre d’équipage nommé, ni déplacement humain ou transaction. Il ne reçoit pas l’ensemble des fonctions finales d’AS24.

## 3. Vapeur d’avertissement et jet de MI13 — P1

**Fiches :** AS19, AS22 ; PR96 ; PX115. **Fonctions :** `drawFoundrySite` dans [src/foundry-renderer.mjs](../src/foundry-renderer.mjs), `updateThermal` dans [src/foundry-simulation.mjs](../src/foundry-simulation.mjs).

La grille est déjà peinte par [src/painted-foundry-sites.mjs](../src/painted-foundry-sites.mjs). La vapeur reste composée de sept traits : hauteur 45 et largeur 2 en avertissement, hauteur 196 et largeur 4 pendant le jet.

Le remplacement peut se limiter à ces traits, ancrés à `foundrySurfaceAt(s, steam.x).groundY` et sélectionnés par `bridge.steam.phase`. Conserver le rectangle de danger de 270 unités de large et les libellés. Les temps existants sont 3 secondes d’avertissement, 2 de jet et 7 de repos, avec un décalage de trois secondes entre tabliers ; le circuit isolé impose `off`. Le temps graphique reçu est déjà figé à zéro en mouvement réduit. Aucun nouveau volume de chaleur, débit, dégât, émetteur ou horloge. Ajouter de la vapeur au repos ou circuit isolé créerait une présence absente du rendu actuel.

## 4. Réparation progressive du radiateur — P2

**Fiches :** AS41 ; PR50 ; PX51, PX52, PX86. **Fonctions :** `drawRadiator` dans [src/renderer.mjs](../src/renderer.mjs), `paintedWalkerPartFrame` dans [src/painted-walkers.mjs](../src/painted-walkers.mjs), `radiatorGeometry` dans [src/production-assets.mjs](../src/production-assets.mjs).

Les états normal, endommagé et réparé sont peints. Le sélecteur retourne explicitement `null` pour `repairing` : l’échangeur, le remplissage progressif et les ailettes redeviennent vectoriels pendant l’intervention.

Des étapes peintes peuvent suivre `repairProgress`, ou conserver une révélation continue du dessin. Préserver les quatre secondes, l’ancrage de `radiatorBounds`, l’enveloppe visuelle, la collision, le halo, le point mobile et la barre de progression. Annulation, consommation du kit et santé restent définies dans [src/simulation.mjs](../src/simulation.mjs). Aucun mécanicien ou outil autonome n’est simulé. Un état spécifique « radiateur touché » demanderait un raccord distinct : `drawRadiator` ne sélectionne pas actuellement l’état vectoriel `hit`.

## 5. Corps et traînées des projectiles — P2

**Fiches :** AS22 ; PR05 ; PX14, PX17, PX23. **Fonctions :** `drawShots` dans [src/renderer.mjs](../src/renderer.mjs), `updateProjectiles` dans [src/simulation.mjs](../src/simulation.mjs).

Les balles gardent leurs segments entre positions précédente et actuelle. Les roquettes gardent un segment, une lueur et des cercles de traînée. Les atlas de particules actuels ne sont pas appelés par `drawShots`.

Des textures étroites peuvent suivre ces segments et les points de `trail` existants. Conserver extrémités, couleurs ami/ennemi, largeurs de 2 à 4 unités, alpha, collisions et nombre de points, au maximum huit pour une roquette. Leur faible taille limite le bénéfice de détails supplémentaires. Aucun guidage, douille, rebond, trace persistante ou nouveau flash ennemi. Les flashes primaires joueur reçus en 0.15.11 restent séparés.

## Réemploi à examiner avant toute nouvelle génération

- Les cellules du [lot fumée/poussière](../assets/painted/particles/manifest.json) peuvent être évaluées pour la traînée de roquette et les quatre cercles de fumée par silhouette industrielle dans `drawIndustry`. Vérifier palette, enveloppe, alpha et phase avec les paramètres de chaque appel ; leur chargeur actuel ne constitue pas une intégration automatique à ces fonctions.
- La cellule `ground-fern` du [lot Thyr](../assets/painted/thyr-scenery/manifest.json) peut être évaluée pour la fougère procédurale de `drawForeground`, en conservant ses emplacements, sa profondeur et ses dimensions. Aucun effet écologique ne doit être déduit de cette réutilisation.
- Pour les accessoires de terrain et de hangar, comparer d’abord les pièces des lots acquis avec le besoin exact. Une réutilisation ne compte pas comme une nouvelle cellule et ne crée pas l’identité ou l’état absent d’un objet.

## Replis de panoramas à distinguer

Dans `drawBackground`, `drawHarbor`, `drawForest` et `drawFoundryHorizon` ne sont appelés que lorsque `worldPainted` est faux. Avec les panoramas de Nacre, Thyr et Kharon chargés, ces formes ne sont pas des manquants du rendu nominal. Les refaire ne changerait que le repli. Les silhouettes de `drawIndustry` sur Vesper restent actives, mais leurs corps sont déjà peints en 0.15.11 ; leur fumée relève du réemploi à examiner ci-dessus.

La lecture et cette note ne reçoivent aucun nouvel asset, événement, système, statut ou critère. Les réceptions graphiques, navigateur et humaines restent distinctes.
