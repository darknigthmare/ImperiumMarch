# MI01 — Le couloir quarante-deux

**Tranche jouable 0.2 · Vesper / PL01 · Acte I — Le poids de l’ordre**

Cette livraison rend jouable la première mission de campagne, distincte des trois opérations de validation OP01–OP03. MI01 reste au niveau **Prototype** : son art, son audio, son animation et sa mise en scène ne constituent pas encore le niveau de qualité final décrit dans PR16. Les trente et une autres missions ne sont pas déverrouillées artificiellement.

## Situation et continuité

Sera Vey accompagne Sami Pell jusqu’au poste des mineurs. Le camion apporte réellement **vingt-quatre caisses de filtres** et l’équipe antichar menace réellement cette livraison. La mission commence par des appuis sans attaque ennemie. La contradiction n’arrive qu’après le service rendu : les Cales-Basses sont absentes du manifeste alors que leurs habitants respirent le même air.

Tess intervient comme mécanicienne, Sami comme conducteur et Holt comme responsable du secteur. Le manifeste n’est ni PT01 ni une preuve de PALINODE. La lecture ne fait donc pas augmenter le compteur de preuves techniques. La découverte PT01 de MI04 et la progression des révélations restent à produire à leur place dans la campagne.

## Parcours livré

1. **Apprendre les appuis.** D avance, Q/A recule ; J et L alternent les groupes en marche manuelle. L’assistance reste autorisée. Sami suit derrière la machine et ne la dépasse pas lorsqu’elle s’arrête.
2. **Préparer le franchissement.** Le treuil des dalles se trouve avant la conduite. Appuyer une fois sur E à proximité commence un déploiement de 4,5 secondes. Le camion attend. Quitter la zone avant la fin annule le travail ; une nouvelle interaction peut le reprendre depuis le début.
3. **Franchir la conduite.** Les dalles verrouillées protègent les contacts. Sans cette protection, un véritable pied posé sur la portion fragile rompt le raccord. La position de la coque, le passage d’un pied encore en l’air et l’animation du rendu ne déclenchent pas l’incident.
4. **Repousser l’embuscade.** Après la conduite, les assaillants s’activent. Le premier lanceur annonce son tir. Espace ancre le marcheur ; V ventile. Le convoyeur attend si des ennemis terrestres le bloquent ou si sa protection s’éloigne.
5. **Livrer.** Le camion doit atteindre le poste avec une intégrité positive. Les caisses deviennent visibles après l’arrivée. Le joueur ne peut pas livrer en atteignant le poste seul.
6. **Lire le manifeste.** E lance la lecture à proximité, uniquement après livraison. Une nouvelle interaction ouvre le compte rendu.
7. **Classer le rapport.** Clore le bordereau prévu ou joindre le signalement de Sami. Les deux choix permettent de rejoindre la rampe de retour. Aucun des deux ne crée des filtres supplémentaires, une preuve de complot ou une défection.

## Deux décisions distinctes

| Action | Conséquence immédiate | Faits conservés |
| --- | --- | --- |
| Déployer les dalles puis traverser | 4,5 secondes de travail ; camion arrêté pendant le déploiement ; conduite protégée | `route: secured`, conduite intacte, coût de réparation nul |
| Traverser directement sur un appui exposé | Raccord rompu, fuite visible, camion arrêté huit secondes | `route: direct`, dégâts de conduite à 100, deux lots de pièces nécessaires au retour |
| Clore le bordereau prévu | Livraison classée ; le quartier reste absent du signalement | `noticeFiled: false`, choix `obey` |
| Joindre le signalement de Sami | Le nom des Cales-Basses entre au compte rendu | `noticeFiled: true`, choix `defy` |

Les valeurs `obey` et `defy` sont des identifiants de compatibilité de l’interface. Pour MI01, elles désignent deux traitements administratifs du rapport, pas une rupture militaire. Les pertes civiles et l’intégrité du camion restent des états séparés.

Depuis la 0.9, les tirs du joueur, les explosions et les appuis réels peuvent également endommager le camion. La première atteinte alliée déclenche un avertissement. Le convoyeur attend derrière l’empreinte annoncée d’un pied descendant au lieu de passer dessous; le joueur peut toujours l’atteindre volontairement. Cette règle de suivi ne restaure pas son intégrité et ne remplace pas ses collisions. La livraison conserve son exigence d’arrivée avec une intégrité positive.

La protection actuelle consiste à déployer des dalles sur un passage unique. Il n’existe pas encore de détour libre en profondeur, de réseau de conduites physique ou de simulation épidémiologique. Le coût de deux lots décrit la charge de réparation transmise au retour de mission ; le traitement du budget et le bilan de hangar appartiennent au module de campagne.

## Contrat technique

`src/content.mjs` exporte séparément `MISSIONS` pour OP01–OP03 et `CAMPAIGN_MISSIONS` pour MI01. `ALL_MISSIONS` réunit les missions reconnues par `createGame`. Les identifiants de bible restent inchangés.

`createGame({ missionId: 'MI01', walkerId, difficulty, assist, seed })` utilise les mêmes commandes publiques que les opérations. Les trois châssis actuels sont autorisés. La simulation ajoute `state.campaign` ; cette propriété vaut `null` pour une opération autonome.

| Champ de `state.campaign` | Signification |
| --- | --- |
| `missionId` | `MI01` |
| `phase` | `approach`, `escort`, `delivery`, puis `complete` seulement à la victoire |
| `route` | `unresolved`, `secured` ou `direct` |
| `pipeIntact`, `pipeDamage` | État réel du raccord, dégâts de 0 ou 100 |
| `passageSecured`, `passageProgress`, `passageWorking` | État et avancement du déploiement des dalles |
| `filtersDelivered`, `filtersDeliveredCount` | Livraison effective ; 24 caisses attribuées une seule fois à l’arrivée |
| `manifestRead`, `noticeFiled` | Lecture effective et inclusion du signalement |
| `repairCost` | 0 ou 2 lots de pièces selon les dégâts |
| `deliveryTime` | Temps de simulation lors de la livraison, sinon `null` |
| `convoyIntegrity` | Rapport entre intégrité restante et intégrité maximale |
| `tutorial` | Actions de marche et d’ancrage observées, sans imposer un usage obligatoire |

Le camion conserve aussi `label`, `cargo` et `waitTime`. Les objectifs et interactions indiquent livraison, manifeste et retour au hangar ; aucune formule « au bac » ou « effacer la bande » des opérations ne remplace ces objectifs de campagne.

Le rendu dessine les pieds à partir de leur état simulé. La rupture apparaît uniquement après un contact détecté dans la simulation. Les dalles ont leur surface au niveau de `terrainAt`, le même niveau que les pieds posés. Le treuil, la conduite, son éventuelle fuite, le poste, les vingt-quatre caisses livrées et le marquage du camion sont dessinés en Canvas. Il s’agit d’assets procéduraux de prototype.

## Validation de simulation

Commande ciblée :

```sh
node --test tests/campaign-mission.test.mjs tests/simulation.test.mjs
```

**27 tests réussis : les 18 existants et 9 nouveaux.** Le test de parcours MI01 réalise **12 parties complètes** : trois châssis × deux franchissements × deux comptes rendus, en difficulté Pilote. Ces douze parties utilisent exclusivement `createGame`, `commandGame` et `updateGame`, sans modifier les objectifs, la position, les points de vie ou les résultats pour obtenir la victoire.

Les contrôles ciblés vérifient également :

- l’absence de tir ennemi pendant l’ouverture et le camion qui reste derrière le joueur ;
- la durée et l’annulation du déploiement, ainsi que l’arrêt du camion ;
- la rupture sur pied posé et l’absence de rupture par un pied encore en l’air ;
- l’impossibilité d’obtenir le manifeste en arrivant au poste avant Sami ;
- les portes de livraison, de lecture, de décision et d’extraction ;
- l’arrêt d’une tentative après destruction du transport, avec un état de dégâts injecté uniquement pour ce test unitaire d’échec ;
- l’absence d’attribution d’une preuve PALINODE ;
- le résultat immuable après victoire et le déroulement identique après sérialisation JSON du même état.

Ces tests de simulation ne sont pas des clics navigateur et ne mesurent pas la difficulté ressentie. Le pilote automatique vise précisément. La vérification de l’interface, de la sauvegarde complète et du parcours dans un navigateur doit être consignée dans le rapport d’intégration de la livraison.

## Captures Canvas reproductibles

```sh
node tools/render-campaign-previews.mjs
```

L’outil utilise `@napi-rs/canvas` déjà installé, avec recherche dans `CODEX_PRIMARY_RUNTIME_NODE_MODULES` si nécessaire. Il n’installe aucune dépendance. Les trois états sont atteints par les commandes publiques de la simulation puis dessinés par le `Renderer` de production, sans modifier les contacts de pieds ou fabriquer une livraison.

| Capture | État observé |
| --- | --- |
| [Dalles protégées](previews/mi01-secured.png) | Pied réellement posé sur le passage protégé, à 14,60 secondes de simulation |
| [Conduite rompue](previews/mi01-direct.png) | Premier contact déclenchant la fuite et l’attente de Sami, à 8,87 secondes |
| [Livraison au poste](previews/mi01-delivery.png) | Camion arrivé et 24 caisses déchargées, avant lecture du manifeste, à 80,03 secondes |

Ces trois images 1600 × 900 sont des **rendus Canvas inspectés**, pas des captures de navigateur. Elles ne montrent pas le HUD HTML, les menus, les dialogues ou la mise en page CSS. Les états, contacts, dimensions, tailles et empreintes SHA-256 sont décrits dans [le manifeste des captures](previews/campaign-manifest.json). Leur inspection a permis de séparer les libellés du treuil et du camion, puis de déplacer les caisses au sol à côté du transport pour que la livraison reste visible.
