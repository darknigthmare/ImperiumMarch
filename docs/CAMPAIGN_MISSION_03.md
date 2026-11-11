# MI03 — Une fenêtre encore allumée

## Portée de la version 0.4

MI03 est la troisième mission de campagne jouable du prototype. Elle se déroule sur Vesper, après le classement officiel du dossier du train de MI02. Elle ne remplace aucune des trois opérations indépendantes et n’accorde aucune preuve du programme PALINODE. Le personnage apprend l’usage réel de trois émissions locales ; il ne connaît pas encore la chaîne qui les a classées hostiles.

Le niveau associe identification, manipulation à proximité, choix de coupure électrique, combats et dommages persistants. Ses bâtiments, terminaux, stocks et conséquences appartiennent à `src/simulation.mjs`. Le rendu consomme ces faits sans créer des contacts ou des victimes séparément.

## Ordre reçu et progression

Holt ordonne de faire taire trois émetteurs présentés comme du guidage hostile. Le poste neuf porte effectivement un relais militaire. Les deux autres sources sont le dispensaire des Fours et les maisons de la traverse.

1. Approcher le relais du poste neuf et appuyer sur **E**. L’identification dure deux secondes à portée.
2. Appuyer de nouveau sur **E** pour isoler le relais militaire. L’isolement dure deux secondes supplémentaires. Le détruire par des tirs le neutralise aussi, mais son emplacement doit toujours être inspecté.
3. Inspecter chaque source civile. Une source en état de transmettre demande quatre secondes d’écoute. Une source détruite demande deux secondes de constat ; ses communications perdues ne sont pas reconstituées.
4. Rejoindre le poste de sortie et compiler les relevés avec **E** pendant 2,4 secondes.
5. Appuyer de nouveau sur **E** pour répondre à l’ordre de coupure civile, puis rejoindre la rampe de retour.

Un appui sur **E** lance chaque travail ; il n’est pas nécessaire de maintenir la touche. Sortir du rayon d’interaction annule le travail concerné et remet sa progression à zéro. La décision suspend la simulation pendant sa lecture.

## Géométrie et paramètres exécutés

Les coordonnées sont des unités du monde 2D, distinctes d’une échelle physique de production définitive. La longueur du niveau est 5 200 ; l’extraction est centrée en 4 930 avec le rayon standard de 110.

| Entité | Position x | Largeur × hauteur | Résistance | Occupants |
| --- | ---: | ---: | ---: | ---: |
| Relais du poste neuf | 1 250 | 64 × 164 | 250 | 0 |
| Dispensaire des Fours | 2 560 | 160 × 184 | 480 | 8 |
| Maisons de la traverse | 3 740 | 170 × 156 | 520 | 12 |
| Poste de compilation | 4 380 | Terminal standard | Sans objectif de destruction | — |

Les stations utilisent un rayon d’interaction de 180. Leur centre vertical suit le terrain moins la moitié de leur hauteur. Les trois dépôts de ravitaillement se trouvent en 1 850, 3 180 et 4 520.

Les bâtiments occupés se situent derrière le passage de marche. La coque ne les traverse pas comme un obstacle physique de premier plan. Leur liaison au passage possède un boîtier de sol en `station.x + station.w / 2 + 30`. Ce boîtier expose un intervalle de 18 unités de part et d’autre aux contacts de pieds. L’inspection d’une station vivante referme la gaine de protection du boîtier avant la traversée. Elle n’ajoute aucun blindage aux murs.

## Identification, appuis et dommages

`identified` signifie qu’un relevé a été effectué. `verified` signifie que la fonction du signal a pu être vérifiée alors que la source existait encore. Le relevé de ruines peut donner `identified: true` avec `verified: false`. Une vérification déjà copiée reste vraie après des dommages ultérieurs ; la disponibilité actuelle du circuit et des habitants est enregistrée séparément.

Un pied réellement posé sur un boîtier non sécurisé inflige 45 points de dégâts à sa liaison et au bâtiment concerné. L’effet dépend du contact simulé, de sa position et de sa hauteur au sol. La proximité du corps ou de la caméra ne le déclenche pas. Un pilote peut inspecter depuis le côté d’approche avant de franchir le boîtier avec ses pieds.

Les projectiles utilisent les collisions balayées existantes. Les balles et roquettes des deux camps peuvent toucher les bâtiments. Une roquette inflige 165 points de dégâts directs lorsqu’elle vient du joueur ; les explosions voisines appliquent les règles de zone existantes. Le bâtiment directement touché ne reçoit pas une seconde application de sa propre explosion.

Le nombre de décès constatés dans chaque bâtiment suit la perte de résistance :

`floor((maxHp - hp) / maxHp * population)`, borné à la population initiale.

Ce modèle est une abstraction de prototype pour rendre les conséquences vérifiables. Il ne simule ni chaque pièce, ni chaque personne, ni un système médical. Les pertes des tirs ennemis figurent aussi dans le bilan de mission ; le nombre n’est pas une attribution automatique de responsabilité au pilote. Réparer un marcheur, couper un circuit ou choisir de maintenir le réseau ne ressuscite personne.

Les exemples exécutés par les tests comprennent trois roquettes contre le dispensaire non identifié : bâtiment détruit, huit décès, source impossible à vérifier, canal du dispensaire indisponible. Détruire aussi les maisons produit vingt décès et aucun contenu civil vérifié. Les ruines restent documentables afin de terminer une mission dont le résultat sera mauvais.

## Contrôle de Holt et fenêtres de combat

Le compteur de contrôle additionne uniquement le temps effectivement passé à écouter des sources civiles vivantes. Le déplacement, l’inspection militaire, le constat des ruines, la pause et la lecture d’un choix ne l’augmentent pas. À six secondes cumulées, Holt signale le délai et active un drone de contrôle. Le compteur est alors borné à six. Cette activation ne provoque ni défaite automatique ni seconde génération de drone.

Le drone est pré-instancié au début du niveau avec l’ID `holt-observer`, en x=3 200. Cet emplacement de sauvegarde ne constitue pas une présence physique avant son arrivée : il reste inactif, invisible, sans collision de projectile ni dommage d’explosion tant que le seuil n’est pas atteint. Le drone ordinaire se trouve initialement en x=3 220, avant les maisons. Ce placement offre une zone pour les affronter sans imposer des tirs ennemis à travers une façade pendant les quatre secondes d’écoute. Les bâtiments restent entièrement vulnérables lorsqu’un véritable tir les rencontre.

Il n’existe pas de minuterie de mission qui annulerait automatiquement l’écoute. Prendre le temps de vérifier devient un fait administratif mémorisé, avec une opposition jouable.

## Choix et conséquences

| Décision | Effet immédiat | Effet conservé au retour |
| --- | --- | --- |
| Couper les deux circuits civils | Les deux stations civiles sont désactivées électriquement. La coupure ne crée pas de décès instantanés. | `reportFiled: false`, circuits disponibles à zéro ; le canal du dispensaire est indisponible. Les dégâts et vérifications déjà obtenus restent enregistrés. |
| Maintenir les circuits restants et joindre le constat | Aucun circuit survivant n’est désactivé par l’ordre. Les destructions déjà survenues restent irréversibles. | `reportFiled: true`, nombre réel de circuits encore disponibles, bilan des habitants et vérifications. Le dispensaire peut conserver un canal pour un contact futur. |

`civilRelaysOnline` distingue deux circuits ouverts, un circuit restant et une coupure totale. `networkPreserved` vaut vrai seulement après une décision résolue et si les deux circuits fonctionnent. Un réseau partiel n’est donc pas présenté comme une coupure complète.

`witnessAvailable` signifie qu’un canal permet encore de chercher un contact ultérieur au dispensaire. Il exige une vérification antérieure, un bâtiment non détruit, un circuit non coupé et au moins un occupant survivant. Il n’invente ni identité ni rencontre déjà survenue. Le nom technique `dispensaryIntact` signifie que le bâtiment n’est pas détruit ; son existence ne garantit pas une résistance à 100 %.

Les faits sont recalculés après les dommages jusqu’à l’extraction. Détruire le dispensaire après avoir signé un choix de maintien retire donc l’accès au canal et laisse un seul circuit. Le texte du dossier dynamique est également actualisé. La réussite officielle archive ces faits une seule fois ; les relectures ne remplacent pas le premier reçu et ne donnent pas une deuxième dotation.

## Contrat d’état

`state.network` contient `stations`, `scrutinyElapsed` et `scrutinyTriggered`. Chaque station contient :

```js
{
  id, kind, x, y, w, h, hp, maxHp, destroyed, flash,
  identified, verified, scanProgress, scanning,
  disabled, secured, population, casualties,
  disabling, disableProgress
}
```

Les valeurs de `kind` sont `military`, `dispensary` et `residential`. Les noms visuels viennent des définitions dans `mission.network.stations`, reliées par ID.

`state.campaign` contient :

```js
{
  missionId: 'MI03', phase, signalsIdentified,
  militaryRelayDisabled, verifiedBuildings,
  networkPreserved, civilRelaysOnline, dispensaryIntact,
  witnessAvailable, residentsLost, holtAlerted, reportFiled,
  manifestRead, context, tutorial
}
```

Les phases sont `approach`, `inspection`, `report` et `complete`. Le contexte reprend la conduite et son signalement de MI01, puis `railRecordFiled`, `railHostagesRescued` et `railHostagesLost` de MI02. `networkDecisionBody(state)` produit le texte du constat à partir des faits présents.

## Validation de simulation

`tests/mi03-mission.test.mjs` contient douze tests dédiés. Le scénario de succès utilise `tests/helpers/mi03-driver.mjs`, qui agit uniquement par commandes et entrées publiques : il ne réécrit ni positions, ni morts, ni objectifs.

Les douze combinaisons de six châssis et deux décisions terminent MI03 en difficulté Pilote, graine 1 847, sans décès civil. Sont aussi contrôlés les travaux interrompus, le seuil de Holt, l’impossibilité de toucher son drone avant son arrivée, les destructions avant identification, les tirs après sécurisation, les dommages après décision, un contact de pied réel, le gel pendant le choix et la reprise déterministe au milieu d’une inspection. Un passage supplémentaire sur les six châssis dans les trois difficultés a constaté dix-huit victoires sans décès à cette graine ; cela ne constitue pas un équilibrage exhaustif de toutes les tactiques et graines.

Ces résultats sont des tests Node de la simulation. La validation de l’interface et du rendu relève des outils et rapports distincts du projet ; aucun de ces parcours ne constitue une capture de navigateur ni un test manuel humain.

## Limites conservées

Les fonctions finales de diagnostic d’ondes, de balistique de façade, d’évacuation détaillée, de négociation avec Holt et de témoins individuels restent à produire. La protection du boîtier et le bilan proportionnel des habitants sont des règles de prototype explicites. MI04 et la suite doivent consommer les faits persistants de MI03 sans présumer qu’un dispensaire, un circuit ou un témoin a forcément survécu.
