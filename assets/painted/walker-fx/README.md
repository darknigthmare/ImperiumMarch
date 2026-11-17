# Flash primaire et purge des marcheurs — 0.15.11

Deux PNG Imagegen originaux fournissent dix cellules au rendu : quatre phases
du cœur de flash primaire et six phases de bouffée de purge. Ce lot reçoit une
partie de AS09/AS22 ; il ne clôt aucun statut ni critère de la Bible.

## Sources et mesure

`prompts.json` conserve les prompts initiaux, leurs deux éditions ciblées, les
sorties sélectionnées et les références consultées. Les premières sorties avaient
une brume alpha faible autour des silhouettes. Les corrections Imagegen sont les
PNG sélectionnés : elles sont copiées octet pour octet, sans retouche ni réencodage.
Les gouttières des dix cellules ont un alpha maximal de 1/255.

`tools/index-painted-walker-fx.py` ne produit que des métadonnées. Il conserve dans
chaque crop tous les pixels non transparents de la cellule. La bouche est mesurée
sur alpha >= 2 et son axe sur la zone initiale de la flamme. Une échelle commune
aux quatre phases conserve leur croissance relative. Pour la vapeur, alpha >= 4
est le premier seuil qui écarte les rares pixels distants : les enveloppes aux
seuils 4, 8 et 32 restent proches. Les seuils 2/4/8/32/128 sont documentés dans le
layout. Aucun pixel faible n'est effacé ; seules les mesures l'excluent.

## Raccordement du flash

`loadPaintedWalkerFx` charge les deux atlas indépendamment ;
`paintedWalkerFxStatus` décrit leur disponibilité. `setPaintedWalkerFxImage` et
`clearPaintedWalkerFx` permettent les diagnostics de décodage et de repli.

`drawPaintedMuzzleFlash(ctx, { fireCooldown, fireRate, muzzleX, hangar,
reducedMotion })` est appelé dans le repère canon déjà translaté à
`[player.x + 9, player.y + 8]` et tourné de `aimAngle`. Il peint uniquement le
cœur, après le halo procédural historique. Son retour `false` conserve le polygone
vectoriel existant. La bouche locale vaut 92, 112 ou 101 selon les deux, quatre
ou six appuis. La direction du corps ne remplace jamais l'angle réel du canon.

Le flash exige `fireCooldown > .1` et l'absence de hangar. Son âge vaut
`clamp((fireRate - fireCooldown) / (fireRate - .1), 0, 1)`. La fenêtre reste
`fireRate - .1` : 80/20/150/140/30/120 ms pour WK01/WK02/WK05/WK06/WK09/WK10.
Une roquette seule ne crée aucun flash primaire. Les quatre phases ne prolongent
aucune fenêtre ; la réduction des mouvements fixe la première cellule.

Le clip est exactement `[[0,-7],[33,-3],[18,0],[41,4],[1,8]]` depuis la bouche.
Le halo reste calculé par le renderer : centre bouche + `[8,0]`, rayon 42,
couleur `#ffd58766`. Aucun halo supplémentaire, canon, douille ou recul mécanique
n'est peint dans ce lot.

## Raccordement de la purge

`drawPaintedVentPuff(ctx, { x, y, radius, phase })` remplace un cercle dans la
boucle historique de cinq bouffées. Il ne touche pas à l'alpha du caller et son
retour `false` conserve le cercle vectoriel. La condition reste
`player.venting || player.heat > 70`.

Pour chaque index i de 0 à 4, le renderer conserve :

```js
phase = (t * .8 + i * .23) % 1;
x = player.x - (player.facing || 1) * (player.width * .47 + phase * 20);
y = player.y - 30 - phase * 85;
radius = 9 + phase * 27;
alpha = (1 - phase) * .18;
```

La palette de référence est `#d2d5c6`. Chaque dessin est clippé dans son cercle
historique exact. Le temps t reste le temps simulé, ou zéro sous réduction des
mouvements : les cinq phases décalées sont alors fixes. Une pause ne change
aucune cellule. La purge ne devient pas un objet de `s.particles`.

Les fonctions `paintedMuzzleFlashFrame` et `paintedVentPuffFrame` exposent des
copies des mesures pour les diagnostics, sans rendre les ancres modifiables.

## Vérification et limites

Les huit tests ciblés couvrent six châssis, deux sens, visées haute et basse,
fenêtres de tir, roquette seule, hangar, seuil strict de chaleur, ventilation,
pause, réduction des mouvements, défaut d'image et absence de mutation. Le
contrôle Canvas décode les PNG, reçoit les clips réels et les dix cellules, puis
rend des scènes issues uniquement d'entrées publiques avec le panorama de Vesper
chargé. Les états, entrées, empreintes et relectures sont conservés sous
`docs/validation/painted-walker-fx-v01511/`.

Les images n'ajoutent ni acteur, ni collision, ni timer, ni appel aléatoire, ni
champ de sauvegarde, ni mécanique thermique. Les flashes ennemis autonomes, les
flashes de dégâts, le recul, les douilles, le rechargement animé et les impacts
par matériau restent hors du lot. Une vue Canvas ne constitue pas une réception
du navigateur, de la performance matérielle ou une approbation artistique humaine.
