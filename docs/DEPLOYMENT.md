# Déploiement web — ORDRE DE CENDRE

## Publication 0.15.6 accomplie

La [PR #5](https://github.com/darknigthmare/ImperiumMarch/pull/5) est fusionnée sur `main` au commit **`036d6efa4be74361450f75b284e3268a12af6f50`**. Son arbre **`41f45209670e932ea17e5f0c37ac7ba8c7dd33fb`** correspond exactement au snapshot local vérifié **`70091ebca39890ee9cb19e6cbd28187301739df5`**. Le delta compte **157 ajouts, 15 modifications et aucune suppression**. Les treize nouveaux atlas apportent **75 cellules utilisées au rendu** ; les onze lots réunis contiennent **58 atlas / 461 cellules**, dont 431 cellules de rendu et 30 références historiques.

La [CI de la PR](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43905183177), sur le HEAD `c460f7f6ac103829e50da229bb71e7a548883020`, puis la [CI de main](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43906226549), sur le commit fusionné, ont toutes deux réussi sous **Node 22.23.4** : **765 tests, 174 comparaisons SVG/Canvas, onze lots peints, 108 parcours du DOM modélisé et les constructions HTML, ZIP et web**. Les [reçus PR](validation/v0156-pr-ci.json) et [main](validation/v0156-main-ci.json) conservent les étapes et les lignes de preuve.

La [matérialisation distante](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43904656099) a reconstruit exactement l’HTML de **141 278 398 octets** et le ZIP de **103 369 632 octets** reçus localement. Leurs SHA-256 respectifs sont `7d346e0fcfacf6507a89bc10840ed1cf370297e6dff7566d0a339e7ac0c77b8e` et `2ad83ba23c1fc0f5f3cdc5ba2d929c68ba41707a9f26bd50c0fee67f553bcb67`. L’extraction indépendante vérifie l’entrée unique et son CRC. La workflow temporaire a été retirée avant la comparaison de l’arbre final et la fusion. Les PNG originaux conservent leurs octets.

Vercel a reçu le commit fusionné exact dans **`dpl_6wyMjPucped9Y5qGGfdjcks5qRBs`**, cible **production**, état **READY le 16 novembre 2026 à 16:20:09.697 UTC**. L’alias [imperium-march.vercel.app](https://imperium-march.vercel.app/) lui est associé sans erreur. Le projet, les domaines et les protections sont conservés. Le [reçu de publication](validation/v0156-publication.json) relie snapshot, PR, CI et déploiement.

Chrome partagé a ensuite affiché la **0.15.6** et repris **MI06, MI10 et MI11** par l’interface, à partir des champs `live` exacts de trois fixtures historiques. Les instruments chimiques et l’émetteur peint sont visibles. Dans le cadrage MI06 reçu, le bandeau d’interaction masque presque toute la vanne : cette capture ne certifie pas seule son sprite. Déplacement, pause et reprise ont été exercés sur MI06 et MI11 ; MI10 reçoit l’affichage, la pause et le retour au menu. Le [rapport natif](QA_NATIVE_V15_6.md) et ses [preuves](validation/native-v0156/receipt.json) distinguent ces reprises courtes d’une mission achevée, d’un essai humain, d’une mesure de performance et d’une ouverture native du fichier autonome.

Le dossier présent avant les essais a été restauré puis réexporté : les deux fichiers de **8 480 octets sont identiques**, SHA-256 `0fa13fe1ac7191fff04434e0bb6867137936ba43a889208f2a3a88dbb92073e5`. L’**Arpenteur**, les **0 / 14 rapports**, la difficulté **Récit**, les autres préférences et les onze commandes sont rétablis. Les sauvegardes privées ne sont pas ajoutées au dépôt. Ce suivi documentaire conserve les octets du jeu, des atlas, du ZIP et de la Bible de la livraison reçue.

## Préparation de publication 0.15.6

La tranche ajoute treize atlas et 75 cellules de rendu aux infrastructures de Nacre, au champ chimique et aux appareils de MI11. Les [trois lots reçus](PRODUCTION_V15_6.md) portent le total à **58 atlas / 461 cellules**. Le [rapport QA](QA_PAINTED_INSTALLATIONS.md) associe les résultats aux fichiers testés : 765 tests, 174 cas SVG/Canvas, onze lots peints et 108 parcours du DOM modélisé. La Bible conserve ses 1 007 fiches et ses statuts.

L’HTML autonome de **141 278 398 octets** embarque 56 modules ; son SHA-256 est `7d346e0fcfacf6507a89bc10840ed1cf370297e6dff7566d0a339e7ac0c77b8e`. Le ZIP distribué de **103 369 632 octets**, SHA-256 `2ad83ba23c1fc0f5f3cdc5ba2d929c68ba41707a9f26bd50c0fee67f553bcb67`, conserve l’entrée unique exacte. Aucune image n’est réduite pour la distribution.

Le parent distant contrôlé est `5171ae2aabb74915d944f1e487bea0433f76f51f`, arbre `9f0c3ae87920b1665a25f15cb03add6a85bf3b7a`, identique à la base locale `65b14f2eb10a94c7c45ed73db944eebb5158bca5`. Cette préparation est une réception locale. Les preuves de CI distante, de fusion et de navigateur doivent ensuite identifier leurs commits réels ; les sections historiques ci-dessous restent inchangées.

## Publication 0.15.5 accomplie

La [PR #4](https://github.com/darknigthmare/ImperiumMarch/pull/4) est fusionnée sur `main` au commit **`a0ae19542b384144ab4a6ce96562288c821879c4`**. Son arbre **`743dfca080436dceb0fb1c25fa5ea40061b0661c`** est identique au snapshot local vérifié **`087c49f10d615c4b9420975539220a0ea21d1ca0`**. Cette publication réunit les neuf atlas 0.15.4 récupérés et les treize atlas 0.15.5 nouvellement produits : **45 atlas / 386 cellules** au total. Le delta contre l’ancien `main`, calculé sans détection de renommage, contient 373 ajouts, 18 modifications et le remplacement de l’HTML suivi par son archive ZIP.

La [CI de la PR](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43890443523), sur le HEAD exact `19820b4f68c4d4a6a9a3724272fe08b13c726639`, puis la [CI de main](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43891493399), sur le commit fusionné, ont toutes deux réussi sous **Node 22.23.4** : **745 tests, 174 cas SVG/Canvas, huit lots peints, 108 parcours du DOM modélisé et les constructions HTML, ZIP et web**. Les [reçus PR](validation/v0155-pr-ci.json) et [main](validation/v0155-main-ci.json) conservent leurs identifiants, étapes et lignes de preuve.

La [reconstruction distante du ZIP](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43890131557) a retrouvé exactement les **111 037 952 octets de l’HTML** et les **81 013 964 octets du ZIP** reçus localement. Les SHA-256 sont respectivement `bf5151bdffec8653387e1328ca2917071f5cf4870a03c9bf2fbff307364a4ba1` et `537a123f46e21bac5a79a4b866bc34a974ffab9ae06d904291019351375d6c75`. L’extraction indépendante confirme l’entrée unique. La workflow temporaire a été retirée avant la comparaison de l’arbre final et la fusion. Aucun sprite n’a été réduit pour le transfert.

Vercel a reçu le commit fusionné exact dans **`dpl_rCFt5nX8QSsZQFkyvtcanAATk2fS`**, cible **production**, état **READY le 16 novembre 2026 à 14:59:14.151 UTC**. L’alias [imperium-march.vercel.app](https://imperium-march.vercel.app/) lui est associé, sans erreur d’alias. Le projet, les domaines et les protections existants sont conservés. Le [reçu de publication](validation/v0155-publication.json) relie snapshot, PR, CI et déploiement.

Chrome partagé a affiché la **0.15.5** et les nouveaux sprites dans **MI12, MI07 et MI13**, après import par l’interface de checkpoints historiques produits par les commandes publiques. Le Prétoire et ses relais, l’ambulance avec caisse vérifiée et sans balise récupérée, puis le porteur avec ses caisses séparées sont visibles. Le déplacement, la pause et la reprise de MI12 sont reçus. Ce contrôle court ne revendique ni mission achevée, ni transfert industriel terminé, ni essai humain. Les [sept captures et le reçu natif](validation/native-v0155/receipt.json) donnent sa portée précise.

Le dossier présent avant ces essais a été exporté, restauré puis réexporté : les deux fichiers de **8 480 octets sont identiques**. L’Arpenteur initial a été réassigné. Les dossiers privés de cette vérification ne sont pas ajoutés au dépôt. Le suivi documentaire ajoute les preuves de publication et de navigateur en conservant les octets du jeu, des PNG, du ZIP et de la Bible de la livraison reçue.

## Préparation de publication 0.15.5

La reprise du 16 novembre 2026 récupère la 0.15.4 locale puis ajoute treize atlas aux transports et aux appareils de mission. Le parent distant contrôlé est `56a1fab0540700dd6a2de789a5577c60a30e7e6e` (0.15.3). Le [bilan de production](PRODUCTION_V15_5.md) reçoit 45 atlas / 386 cellules, et le [rapport QA](QA_PAINTED_MISSION_ASSETS.md) reçoit 745 tests, 174 comparaisons SVG/Canvas, 108 parcours DOM modélisés, les huit lots d’images et le classeur.

Le HTML de 111 037 952 octets conserve toutes les images et 50 modules. Le dépôt distribue désormais `dist/Ordre_de_Cendre.zip` (81 013 964 octets), dont l’entrée unique extrait exactement l’HTML testé. Les [empreintes](../dist/Ordre_de_Cendre.manifest.json) et la [réception indépendante ZIP](../dist/Ordre_de_Cendre.zip-verification.json) en fixent le contenu. `npm run build` régénère HTML et ZIP ; la sortie web garde ses sources habituelles. Cette préparation ne revendique encore aucune CI distante, fusion ou réception native 0.15.5. Le reçu de publication suivant doit les associer au SHA exact, sans modifier les protections du projet Vercel existant.

## Publication 0.15.3 accomplie

La [PR #3](https://github.com/darknigthmare/ImperiumMarch/pull/3) est fusionnée sur `main` au commit **`259351ed8fd460b040097c266fb32a82543723d2`**. Son arbre **`6ebf63194e986953958b081dab5085f9a961bd46`** est identique au snapshot local testé **`c859be17875305cdfdb9d6b7c0dd42bbc2006d7c`**. Le lot modifie 148 chemins, sans suppression, et ajoute les six marcheurs peints au jeu existant.

La [CI de la PR](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43864382509), sur le HEAD exact `70bf235a074b4090f44e9bf5ceab56eb8ff14ae0`, et la [CI de main](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43865206068), sur le commit fusionné, ont toutes deux réussi sous **Node 22.23.4** : **706 tests, 174 cas SVG/Canvas, les trois lots d’atlas, 108 parcours du DOM modélisé et les deux constructions**. Le [reçu de publication](validation/v0153-publication.json) rattache ces résultats à leurs commits.

L’HTML de **61 591 567 octets** a été reconstruit par la [run de matérialisation](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43863942197), puis comparé au SHA-256 local **`706d5593a1cd0dabafdc04e2d01fe34ea9e5dccf163c69a669d6bebfe6fd68f3`**. Seul ce fichier a été commité par cette étape ; la workflow temporaire a été retirée avant la comparaison de l’arbre final et la fusion. Les images conservent leurs octets originaux.

Vercel a reçu le commit fusionné exact dans le déploiement **`dpl_2hEB15dADhifa4xcPNdCfsyxd7Aa`**, cible **production**, état **READY le 16 novembre 2026 à 12:17:39 UTC**. L’alias [imperium-march.vercel.app](https://imperium-march.vercel.app/) lui est associé. La configuration, les domaines et les protections restent inchangés.

Chrome partagé a ensuite affiché la **0.15.3**, les quatorze ordres de campagne et les **six châssis peints dans le hangar**. Un déploiement de l’**Arpenteur dans Simulation 02 — Le dernier bac** reçoit les poses de marche, le changement de direction et de visée, le passage du convoi de l’attente au mouvement, puis la pause et la reprise. Le [reçu natif et ses douze captures](validation/native-v0153/receipt.json) précisent la portée : l’horloge visible atteint 00:01, aucun tir réussi ni mission achevée n’est revendiqué. Ce contrôle court ne constitue ni une mesure de performance ni un essai humain.

Ce suivi documentaire ajoute les preuves de publication et de navigateur. Il conserve les octets de l’application, des atlas, de l’HTML autonome et de la Bible de la livraison reçue. Les reçus antérieurs, dont celui de prépublication locale, gardent leur périmètre historique.

## Préparation de publication 0.15.3

La tranche locale du 16 novembre 2026 ajoute six atlas de pièces peintes pour les six marcheurs existants : 96 cellules, soit 23 atlas et 228 cellules au total. Le [rapport QA](QA_PAINTED_WALKERS.md) reçoit 706 tests, 108 parcours du DOM modélisé, 174 cas SVG/Canvas et les trois lots de PNG. Les 19 vues de marcheurs chargent les 23 atlas ; la Bible garde 1007 fiches et ses statuts.

L’HTML autonome pèse **61 591 567 octets**, 39 modules, SHA-256 **706d5593a1cd0dabafdc04e2d01fe34ea9e5dccf163c69a669d6bebfe6fd68f3**. Le parent distant vérifié avant cette tranche est `8209a74284b9e5a9be4cfbf590c6ea2fdaac5f34`. Ce paragraphe reçoit la construction locale avant publication ; la PR, sa CI et le déploiement doivent être rapprochés du snapshot exact dans un nouveau reçu. Le compte rendu 0.15.2 ci-dessous demeure historique.

## Publication 0.15.2 accomplie

La [PR #2](https://github.com/darknigthmare/ImperiumMarch/pull/2) est fusionnée sur `main` au commit **`6c788a3431a3738be69a61065c0facc64379279b`**. Son arbre **`b2f66472b6e0c433a1ac92e0d1613e0ecdb2967a`** correspond exactement au snapshot local testé **`ca1f7be61af356d6a4cf7236b6bf7ba288774ba1`**. La publication réunit la reconstruction de MI12–MI13, MI14, les huit atlas de l’atelier et les neuf atlas de combat. Contre l’ancien `main`, elle contient **584 ajouts, 40 modifications et aucune suppression**.

La [CI de la PR](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43841918922) a réussi sur son HEAD exact **`42112a5dc890330baa3c955c91f9962bbb2b5c2f`**, sous Node **22.23.4** : **697 tests**, **174 cas raster**, les deux lots d’atlas, le catalogue, les builds et **108 parcours du DOM modélisé**. Le reçu [v0152-publication.json](validation/v0152-publication.json) distingue cette validation de la CI automatique de `main`.

La [CI de `main`](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43842401703) a également réussi sur le commit fusionné **`6c788a3431a3738be69a61065c0facc64379279b`**, avec l’ensemble des mêmes contrôles.

L’HTML autonome de **50 445 160 octets** dépassait la limite de corps de requête du connecteur. La [run de reconstruction](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43841610596) l’a construit avec le bundler existant, puis a contrôlé son SHA-256 **`44eb93556e7c881582634306a66ce08816d8a35ad1768fd4dc34ae54e5734b2a`** avant de commiter uniquement ce fichier sur la branche de travail. La workflow temporaire a été supprimée avant la comparaison finale et la fusion. Le fichier distant est identique à celui qui a été testé localement ; aucune image n’a été réduite pour le transfert.

Vercel a construit **`dpl_6ocHZAasgPEW28sr9t8Xk9Z6o9RE`**, état **READY**, cible **production**, pour le commit fusionné exact. Le domaine stable [imperium-march.vercel.app](https://imperium-march.vercel.app/) lui est associé sans erreur. Les paramètres, domaines et protections existants sont conservés.

Chrome partagé a ensuite reçu la version **0.15.2**, ses **quatorze missions** et un lancement réel de **Simulation 02 — Le dernier bac**. Les sprites du convoi et des combattants s’affichent ; marche, pause et reprise répondent. Le [reçu natif et les quatre captures](validation/native-v0152/receipt.json) délimitent ce parcours court. Il n’achève pas une mission ni une réception humaine et n’efface pas le blocage distinct de Chromium local. Le suivi documentaire ajoute ces preuves sans modifier le jeu, les images de production, le HTML autonome ou la Bible.

## Reprise 0.15.2 — préparation du snapshot

La reprise du 16 novembre 2026 rassemble MI12–MI14, les huit atlas de l’atelier et les neuf atlas de combat. La version locale est **0.15.2** ; les résultats de construction et de validation figurent dans [QA_PAINTED_COMBAT.md](QA_PAINTED_COMBAT.md). La Bible conserve 1 007 fiches et le dossier du joueur reste v14.

Au contrôle initial de cette reprise, `main` pointe sur `60056ce79fd1d10749abdfc88a752cb74a3dbd44`. Le dernier déploiement de production observé est `dpl_5QCqm8qWwfcGuSvrgteNznwCZ5x7`, READY pour `06a6b0b15c504cb5f185c407e551cb15da64270a`, encore en 0.12. Ces observations décrivent l’état avant publication du nouveau snapshot. Les octets du jeu local ne sont pas une preuve de déploiement ; le reçu de publication suivant doit rattacher arbre distant, CI et Vercel à leur SHA réel.

Les anciens rapports de publication ci-dessous restent historiques. Les paramètres de projet, domaines et protection Vercel existants sont conservés pendant cette reprise.

## Construction

```sh
npm run build:web
```

Cette commande produit `web-dist/` avec `index.html`, les modules et styles de `src/`, ainsi que tous les fichiers de `assets/`. La racine du site ouvre le jeu. Aucune dépendance à installer, fonction serveur, base de données ou variable secrète n'est nécessaire.

`vercel.json` sélectionne le préréglage **Other**, ignore l'installation de dépendances, exécute `npm run build:web` et publie `web-dist`. La navigation entre campagne, simulations, hangar, archives et réglages reste dans la page : aucune réécriture de routes n'est nécessaire.

Le dépôt source est [darknigthmare/ImperiumMarch](https://github.com/darknigthmare/ImperiumMarch), branche de production : `main`. La liaison Git Vercel a été créée et vérifiée le 10 novembre 2026 dans l’équipe **darknigthmare’s projects**. Les nouveaux commits de cette branche peuvent déclencher une construction automatique.

## Liaison vérifiée

| Élément | Valeur |
| --- | --- |
| Projet Vercel | `imperium-march` |
| Identifiant projet | `prj_ggDB98oddkTTzVPiGQrtxnj7frcr` |
| Équipe | `darknigthmares-projects` |
| Identifiant équipe | `team_VrIjq2UWV6VaHZr7DdQFwvfu` |
| Dépôt GitHub | `darknigthmare/ImperiumMarch` · `1453177984` |
| Adresse de production attribuée | [imperium-march.vercel.app](https://imperium-march.vercel.app) |
| Runtime de construction | Node.js `22.x` |
| Construction / sortie | `npm run build:web` / `web-dist` |

La liaison a été contrôlée en recherchant les projets rattachés à l'identifiant du dépôt GitHub. Le domaine est attribué et le jeu y est déployé. Le premier déploiement complet, vérifié READY, correspond au commit `c8f1a4dcfe1c65e15c032bac009ee249aa324469` de la version 0.5. Les publications suivantes doivent également être rattachées à leur SHA exact.

La protection Vercel existante est conservée (`all_except_custom_domains`). Le domaine de production a effectivement ouvert le jeu dans Chrome partagé le 11 novembre 2026, sans modification de cette configuration. Les adresses de prévisualisation peuvent demander une connexion autorisée.

## Historique de publication 0.3–0.4

Les versions locales 0.3 et 0.4 n’ont pas été publiées lors de leurs préparations : la revue automatique de l’action demandait de retrouver l’autorisation explicite de publication sur le dépôt public. Aucun transfert par une autre voie n’a été utilisé pour contourner ce refus.

## Préparation et contrôle initial de la 0.5

La reprise de la 0.5 a retrouvé les instructions originales : mettre l’ensemble du projet sur `darknigthmare/ImperiumMarch`, puis la confirmation de publication sur `main` et de liaison à Vercel. La livraison suit ce périmètre déjà demandé.

Au contrôle initial de cette reprise, `git ls-remote` indiquait encore `be63e872a6d315aa5e803fc366686d8c01c37bf7` sur `main`. L’API Vercel confirmait le projet `imperium-march` de l’équipe ci-dessus, `live: false` et `latestDeployment: null`. Ces observations décrivent l’état **avant la publication 0.5**, pas l’état futur du site.

## Publication 0.5 accomplie

Le commit `c8f1a4dcfe1c65e15c032bac009ee249aa324469`, enfant du README initial, a publié 160 fichiers. Son arbre distant a été comparé aux empreintes locales. La [CI GitHub](https://github.com/darknigthmare/ImperiumMarch/actions/runs/42972756981) a réussi. Vercel a automatiquement construit `dpl_8KqVrP25Y4ueXws2to9g6wY3ZNsN`, état READY, pour ce même SHA et la cible production.

La racine, les six modules, les deux feuilles de style et l'emblème ont répondu HTTP 200. Chrome partagé a ensuite ouvert le site, sélectionné le Pèlerin, lancé MI01 et repris son point après pause et rechargement. Ces contrôles sont distincts du lancement Chromium local, bloqué avant navigation par les permissions de socket.

## Publication 0.6

La 0.6 ajoute MI05 et le dossier v5, avec un classeur de 643 fiches. `package.json` fixe maintenant `engines.node` à `22.x` : l'ancienne plage ouverte avait laissé Vercel choisir Node 26 malgré le réglage de projet. La CI utilise également Node 22.

Le commit `9e4a9671cd978c8f097ec3436d783d22587c1957` a publié 202 fichiers, tous comparés à l'arbre distant. Le déploiement `dpl_2P9vnQYqGNupCCiznGiz9rLo2ve5` est passé READY pour ce SHA exact. La [CI 42974893958](https://github.com/darknigthmare/ImperiumMarch/actions/runs/42974893958) a réussi sous Node 22.23.4 : 145 tests, builds et contrôles UI compris. Les dix ressources contrôlées répondent HTTP 200. Chrome a importé le dossier historique v4, conservé ses quatre rapports et lancé MI05. Le contrôle visuel a conduit à placer la consigne contextuelle au-dessus des instruments HTML ; la correction et la vérification de reprise sont suivies dans [QA_V06.md](QA_V06.md).

Le correctif de disposition est publié dans `2a73cdddb919c0d0834c154f3696cb9a7ffdf3f4`. Son déploiement `dpl_4TXYeffTPfoik8rUUtMwPrvWgxtk` est READY pour ce même SHA, et la [CI 42977724833](https://github.com/darknigthmare/ImperiumMarch/actions/runs/42977724833) a réussi sous Node 22.23.4. Chrome a repris le point MI05 existant après rechargement et confirmé la séparation réelle entre consigne et jauges. Le [reçu](validation/v06-publication.json) rattache les preuves à ce code ; le [rapport navigateur](validation/v06-browser.json) précise les actions, les valeurs visibles et les limites.

## Dossier du joueur

La sauvegarde reste locale au navigateur et à l'adresse du site. Utiliser l'adresse de production stable pour continuer une partie. Une adresse de prévisualisation, un autre domaine et le fichier autonome disposent de stockages distincts. Pour déplacer une partie, utiliser **Exporter le dossier**, puis importer le JSON sur la nouvelle adresse.

## Édition autonome

`npm run build` produit `dist/Ordre_de_Cendre.html`, puis son archive distribuée `dist/Ordre_de_Cendre.zip`. Extraire le ZIP et ouvrir l’HTML pour jouer hors ligne. Depuis 0.15.5, le ZIP remplace le suivi Git de l’HTML volumineux ; le classeur de conception reste inclus. La construction web ne modifie pas ces livrables.

## Contrôles avant publication

- `npm run build`, `npm run build:web` et `npm run check`.
- `npm test`, `npm run check:ui` et `npm run check:ui-runtime` après reconstruction du fichier autonome.
- Vérifier que la page d'accueil, les modules, les styles et les images sont présents dans la sortie web.
- Après déploiement, contrôler le commit servi, la disponibilité des ressources et le lancement de la campagne dans un navigateur réel.

Les tests courants sont documentés dans [QA_V12.md](QA_V12.md). Les rapports précédents restent conservés comme historique. Un déploiement prêt ne remplace pas une validation navigateur.


## Publication 0.7

La 0.7 ajoute MI06, le dossier v6 et la consommation réelle de carburant. La construction locale livre six missions de campagne, trois opérations, six châssis et un classeur de 705 fiches. Les contrôles locaux passent 176 tests Node et 34 parcours du script autonome dans un DOM modélisé. Les [preuves 0.7](QA_V07.md) séparent ces contrôles des observations du navigateur et du déploiement.

Le commit **1f243c91ee6a1cc66b6d13b1619a935a61cff431**, enfant de `613c07307f2712c5fac28d9403016906e94da168`, publie le snapshot figé de la version. Les **254 fichiers** de son arbre correspondent exactement au commit local `f178d56f36c7459b7b150765cb9eb9df178bbd3e`. Le transfert comprend 77 chemins modifiés, 76 nouveaux blobs et aucune suppression. La mise à jour de `main` utilise le SHA attendu, sans force.

Vercel a automatiquement construit **dpl_E7NtUedX8jykNK9gvAdM5vh97Had**, état **READY**, pour ce SHA exact. Le domaine stable [imperium-march.vercel.app](https://imperium-march.vercel.app/) lui est associé. La [CI 42983892773](https://github.com/darknigthmare/ImperiumMarch/actions/runs/42983892773) a réussi sous **Node 22.23.4** : 176 tests, contrôles projet et UI, builds autonome et web. Les dix ressources HTTP contrôlées renvoient 200 avec le contenu exact du snapshot. La configuration de protection Vercel est conservée.

Chrome a vérifié la migration du dossier v5 existant, importé une v5 terminée, débloqué et lancé MI06, puis repris un point de vanne produit par les commandes publiques. Après pause et rechargement, il a achevé la dérivation et l’extraction. Le hangar et l’export final conservent six rapports, dix habitants sauvés, deux techniciens, zéro logement perdu et les deux lots consommés. Le [rapport navigateur](validation/v07-browser.json) distingue explicitement les actions préparées dans Node et celles réellement exécutées dans Chrome. Le [reçu de publication](validation/v07-publication.json) conserve le lien entre SHA, arbre, Vercel, CI et ressources.

Les preuves navigateur et cette documentation sont ajoutées dans un commit de suivi. Elles ne modifient ni le code du jeu, ni le HTML autonome, ni le classeur ; leurs empreintes applicatives restent celles du snapshot testé.

## Publication initiale de la 0.8

La tranche MI07 et le dossier v7 ont passé les contrôles locaux : 212 tests Node, 45 parcours UI dans le DOM modélisé, catalogue, contrôle statique, construction autonome et construction web. L’audit indépendant du dossier couvre dix-huit variantes ; il ne remplace pas la vérification du site publié.

Le commit **d79dd2fe832920794d1265271a4bf9cedaca9637**, enfant de `bc830013455bb8f71e1eaf0316173ac0e91746f8`, publie les **315 fichiers** du commit local `88c7af9f1019fd148c9a1078a860a7ad22998196`. L’arbre intégral `5b1e2580127d18018c8c19829102c71360f907b9` et les 36 empreintes sont identiques au snapshot testé. Le CAS de `main` a réussi sans force.

Le déploiement **dpl_7ttsGENXRQfFvhtpLZrju2NcZZP8** est READY pour ce SHA exact, et la [CI 42992916724](https://github.com/darknigthmare/ImperiumMarch/actions/runs/42992916724) a réussi sous **Node 22.23.4**, avec 212 tests et 45 parcours UI. Les dix ressources HTTP renvoient 200 et leur contenu correspond exactement au snapshot. Le [reçu initial](validation/v08-publication-initial.json) conserve ces contrôles. Projet, domaines, protection Vercel et configuration Node sont conservés.

Le [premier essai Chrome](validation/v08-browser-initial.json) a confirmé la migration entière du dossier v6, le lancement de MI07 et la reprise exacte du point de transfert après rechargement. Il a aussi identifié un chevauchement des cartes Canvas avec les objectifs HTML à gauche. Le correctif de placement et la vérification de fin de mission font l’objet du suivi de livraison ; cette observation initiale ne revendique pas encore la fin du parcours natif.

## Correctif visuel 0.8 et parcours final

Le commit **816a02aec27c5286e20b705fbf234caa269968fb**, enfant de `d79dd2fe832920794d1265271a4bf9cedaca9637`, correspond au commit local `be087371f9342968e41f5e72cae649c971af5a3e`. Ses **324 fichiers** ont été réconciliés à l’arbre distant `3eaa42c603ee552036f2fe0dd1a804804667d8eb`. Le delta comprend le renderer corrigé, son édition autonome, les aperçus et les preuves intermédiaires. Les neuf états de scènes, la simulation, la campagne et le classeur sont identiques au snapshot initial.

Le déploiement **dpl_7iu5U9tiadVKz7NHrWPbYANYkew7** est **READY** pour ce SHA exact. La [CI 42994464977](https://github.com/darknigthmare/ImperiumMarch/actions/runs/42994464977) réussit sous **Node 22.23.4**, avec les 212 tests et 45 parcours UI. Les dix ressources HTTP sont strictement identiques au snapshot corrigé. Le [reçu du correctif](validation/v08-publication.json) conserve le contrôle complet.

Chrome a repris le checkpoint sanitaire à 74,332 % après ce déploiement, sans changement d’état. Les cartes sont désormais séparées du HUD. Le transfert physique, les arrivées des quatre patients et des deux membres de l’équipe, l’extraction et le septième rapport ont été achevés dans le navigateur. Le dossier final reste intégralement identique après rechargement ; les six anciens rapports et les bilans de MI05–MI06 sont conservés. Le [rapport navigateur final](validation/v08-browser.json) précise le point préparé dans Node, les actions natives et les limites.

Les captures, exports, rapports de validation et cette documentation sont publiés dans un suivi documentaire. Ce suivi conserve les **36 empreintes applicatives** du correctif, y compris le HTML autonome et le XLSX. Les vérifications de la publication finale portent de nouveau sur son arbre, sa CI, son déploiement exact et les dix ressources servies.

## Publication applicative initiale de la 0.9

La 0.9 ajoute MI08, le dossier v8 et 354 fichiers de production : 287 SVG, six rigs, cinq planches PNG et 56 WAV. Le classeur initial rassemble 816 fiches. Les résultats de réception humaine et les parcours natifs sont suivis séparément dans [QA_V09.md](QA_V09.md) ; cette publication initiale ne les anticipe pas.

Le commit **c044fbe32a28e2f83f8d8088d46b43034af49d48**, enfant de `0ae303a7b04d45472dc17154039ddc73760dc97a`, publie les **781 fichiers** du commit local figé `01c4aed07788c574eeed421222c2de5fe3d25bdf`. L’arbre distant `ab7ef12b4e70f58661414d871aedde26831be688` correspond intégralement au snapshot, et les **387 empreintes** du [contrôle initial](validation/v09-release-checks-initial.json) concordent. Le delta comprend 449 ajouts et 29 changements, sans suppression. La mise à jour de `main` a vérifié son parent attendu avec `force:false`.

Le déploiement **dpl_HymTJVXhHHzcn2NUrYtno5sSgTgM** est **READY** pour ce SHA exact. Il dessert [l’adresse stable](https://imperium-march.vercel.app/) et dispose de son [adresse immuable](https://imperium-march-cj5zkplcz-darknigthmares-projects.vercel.app). La [CI 43008297207](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43008297207) a réussi sous **Node 22.23.4** : 290 tests, 57 parcours UI dans le DOM modélisé, cinq cas de comparaison SVG/Canvas avec `@napi-rs/canvas@0.1.100`, catalogue de 816 fiches, contrôles UI et constructions autonome et web. Les gates locaux du snapshot ont été exécutés sous Node 24.22.1 ; le résultat distant atteste séparément Node 22.

Les **treize ressources HTTP** contrôlées — index, neuf modules, deux feuilles de style et emblème — répondent 200 et leur contenu UTF-8 est strictement identique au snapshot. Le runtime Node `22.x`, le projet, les domaines et la protection Vercel restent inchangés. Le [reçu initial](validation/v09-publication-initial.json) conserve les SHA, l’arbre, la CI, le déploiement, les empreintes HTTP et les limites de ces contrôles.

Le XLSX de cette publication initiale a pour SHA-256 `866b7ec16d491c4ece870a9689356bb8c90a08b01630bf4dc42f6310ecb86524`. Les observations Chrome et la réception finale du classeur feront l’objet du suivi documentaire ; elles ne sont pas déduites du seul état READY.

## Réception et correctifs applicatifs de la 0.9

Le commit **006b3ab517f335102a5dfd38be3272e263af75cf**, enfant de `c044fbe32a28e2f83f8d8088d46b43034af49d48`, publie le commit local figé `1fc6b2d519458ff8fae57f60c3493c04ade4eded`. Les **873 fichiers** correspondent intégralement à l’arbre distant `0c682cbf947aa62b8bda565482b3bde9a4f75217`. Les **474 empreintes** du [contrôle final](validation/v09-release-checks.json) concordent ; le delta comprend 92 ajouts et 34 changements, sans suppression. Le CAS a conservé le parent attendu avec `force:false`.

Cette publication comprend deux corrections applicatives observées lors de la réception Chrome : les aides de touches préservent les mots accentués, dont « Départ », et le registre affiche l’instruction de sortie lorsque le bilan est déjà transmis. Les modules modifiés sont `src/controls.mjs` et `src/simulation.mjs` ; l’édition autonome a été reconstruite. Après déploiement, Chrome a confirmé « Départ acquis » dans la radio à 04:40, puis « Bilan transmis à Holt · rejoindre la sortie » à 05:20. Les captures, états d’accessibilité et limites de réception sont suivis dans [QA_V09.md](QA_V09.md).

Le déploiement **dpl_9SAPYJfTML8hm6qkSsym9Z4Hvxtw** est **READY** pour ce SHA exact, avec [son adresse immuable](https://imperium-march-q7bnqqgjf-darknigthmares-projects.vercel.app) et [le domaine stable](https://imperium-march.vercel.app/). La [CI 43015073388](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43015073388) a réussi sous **Node 22.23.4** : **291 tests**, **57 parcours DOM modélisés**, **cinq cas raster**, contrôles projet et UI, constructions autonome et web. Les treize ressources HTTP répondent 200 avec le contenu UTF-8 exact du snapshot corrigé. Projet, Node `22.x`, domaines et protection Vercel sont conservés.

Le classeur de réception conserve **816 fiches**, réparties dans **21 onglets**, et **126 formules**. Ses 37 vues ont fait l’objet du [contrôle visuel](validation/workbook-v0.9-visual-review.json) ; le [recalcul LibreOffice sans interface](validation/workbook-v0.9-libreoffice.json) n’est pas présenté comme un usage interactif de Calc ou Excel. Son SHA-256 est `af5c84c1a1efc9d78300f3443d0097fca0027596385db97358d97c7e6bdcf701`, et celui de la source JSON est `fd20c64cec042c3dbbdb866146ab22c5b6a1235d4f78e30db1ec19d6c03251f2`.

**QA19 reste ouverte** : deux pertes de focus ont laissé le déplacement actif dans Chrome, sans cause résolue. **QA20 reste partielle** pour la petite fenêtre native indépendante ; **QA29 reste ouverte** pour la manipulation interactive dans Calc ou Excel. Les tests automatiques et cette publication ne changent pas ces résultats de réception.

Depuis l’export natif au point de porte partielle, Chrome a poursuivi jusqu’au résultat à 05:45 : 34 personnes au refuge, deux accueillies localement, aucune perte, les quatre patients arrivés, deux bateaux arrivés et huit rapports. Les exports de dossier avant et après rechargement sont identiques octet par octet. Ce parcours reste distinct de l’audit Node et des tests dans le DOM modélisé.

Le reçu applicatif complet est conservé hors dépôt. Le dernier suivi documentaire ajoutera les captures, exports et rapports de ces confirmations, sans changer le code, la source de conception ni le XLSX ; son reçu ultime restera également hors dépôt pour éviter qu’un reçu doive référencer son propre commit.

## Publication initiale de la 0.10 — vérifiée

La 0.10 ajoute MI09 sur Thyr et le dossier de sauvegarde v9. Le commit public **[158a10f7e963f3f5effbb71fc3e8b4588d209d5a](https://github.com/darknigthmare/ImperiumMarch/commit/158a10f7e963f3f5effbb71fc3e8b4588d209d5a)**, enfant de `2bb8d7a708e4fab5ab34b3cac10f2418b60fe037`, publie le snapshot du commit local `f2270608ea23e7b9589b8fc9a6f81a6a59341d02`. Ses **1 041 fichiers**, leurs modes, tailles et SHA Git correspondent intégralement à l’arbre distant `977ea7f0af6d1f404feb3b92b688ebd14baccd0f`. Les **63 empreintes** du [contrôle initial](validation/v10-release-checks-initial.json) concordent. Le delta comprend **152 ajouts et 35 changements**, sans suppression ; **185 nouveaux blobs** ont été transférés puis vérifiés. Les **402 chemins historiques protégés** restent inchangés. Le CAS de `main` a conservé le parent attendu avec `force:false`.

La **[CI 43059331362](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43059331362)** a réussi sur ce SHA exact sous **Node 22.23.4** : **356 tests**, **40 cas raster SVG/Canvas** avec `@napi-rs/canvas@0.1.100`, **66 parcours du DOM modélisé**, contrôles projet et UI, constructions autonome et web. Le contrôle de catalogue porte sur **20 feuilles de conception, 845 fiches, six châssis jouables, trois opérations indépendantes et neuf missions de campagne**. Ces résultats décrivent les essais automatisés, sans leur attribuer une portée de réception native.

Le déploiement **dpl_DttZE4zB9fKdFErbMBr7t7hkLRBf** est **READY**, cible production, pour ce même commit. Il dessert le [domaine stable](https://imperium-march.vercel.app/) et son [adresse de déploiement](https://imperium-march-l4w1ym34w-darknigthmares-projects.vercel.app/). Les **18 ressources HTTP contrôlées** — index, douze modules, deux feuilles de style et trois manifestes de production/Thyr — répondent **200** ; leurs nombres d’octets et SHA-256 sont identiques au snapshot. Le projet conserve Node `22.x`, ses domaines et sa protection `all_except_custom_domains`.

Les trois preuves ci-dessous sont des copies **octet pour octet** des reçus produits après publication. Leurs éventuels chemins absolus désignent l’environnement d’exécution d’origine ; les fichiers conservés ici portent les mêmes empreintes. Le reçu initial ne revendique aucun parcours navigateur natif.

| Preuve conservée | Octets | SHA-256 |
| --- | ---: | --- |
| [Publication initiale](validation/v10-publication-initial.json) | 15 904 | `f11e587266559cb068d197f9e950453b560d0dcb8d0d897c52ceae912c6f8a3c` |
| [Comparaisons HTTP](validation/v10-http-initial.json) | 8 333 | `784312400d1c2845f3aee65347b2e58079a61bcf9faf5e8bee96303f1f91719c` |
| [Journal CI décodé](validation/v10-ci-initial.log) | 189 095 | `056fb2c9a26cdbe27beb647ee4fde96e8be49cf23f1130582099175c6bcc1111` |

## Lot final 0.10 — contenu et preuves

Les seuls changements applicatifs de ce lot final sont **quatre libellés statiques dans `index.html`** : l’accueil devient « CAMPAGNE / ORDRES DE MARCHE », la liste nomme Vesper, Nacre et Thyr dans son intitulé accessible et son bandeau, et le compteur de secours indique `0 / 9`. Les IDs et les comportements restent identiques ; aucun module de `src/` n’est modifié. L’édition autonome a été reconstruite ; les 174 IDs, 163 références et 66 parcours DOM modélisés ont été contrôlés sur ce nouvel artefact dans le [reçu UI final](validation/v10-ui-validation-final.json).

Le [reçu natif](validation/native-v10/browser-reception.json) distingue l’import réel du dossier v8 et sa migration exacte, puis l’extraction par l’interface depuis un checkpoint préparé et l’export/rechargement du dossier. Les 87 contrôles d’exports passent : neuf rapports, 42 lots et mêmes octets après recharge. Les actions préparées et les actions exécutées dans Chrome sont précisées dans [QA_V10.md](QA_V10.md). Cette portée ne constitue pas un parcours natif intégral depuis le début de MI09. **QA19, QA20 et QA29 restent ouvertes** : focus contradictoire selon l’instance et tir maintenu non reçu, petite fenêtre native non établie, manipulation bureautique interactive non exercée.

Le lot final réunit ces libellés, les preuves natives et les mises à jour de la Bible et du registre. Les statuts restent inchangés. Le [contrôle final](validation/v10-release-checks-final.json) identifie les artefacts figés ; le parent public attendu est **`158a10f7e963f3f5effbb71fc3e8b4588d209d5a`**. L’attestation de publication est établie après la création du commit : elle rapproche le snapshot, l’arbre distant intégral, le CAS sans force, la CI sur le SHA exact, le déploiement de production READY et les ressources HTTP, avec Node `22.x` et les protections conservés. Ce reçu reste hors dépôt pour éviter de référencer son propre commit ; les résultats externes ne sont pas déduits des seules validations locales.


## Lot applicatif 0.11 — validation locale

La 0.11 ajoute **MI10 — Le champ que personne n’a semé**, le dossier v10, quatre modules chimiques et un lot original de vingt-quatre SVG et deux planches. Dix missions, six châssis et trois opérations indépendantes sont jouables au stade prototype. Le classeur rassemble 873 fiches sur 21 onglets.

Les [gates locaux](validation/v11-local-validation.json) passent **440 tests Node, 71 parcours du script autonome dans un DOM modélisé, 64 comparaisons raster SVG/Canvas**, le catalogue, l’audit statique et les constructions autonome et web. Le runtime local enregistré est Node **24.22.1** ; la configuration publiée demeure **22.x** ; la réception CI ci-dessous confirme séparément Node 22.23.4. Les parcours UI et les scènes ont été reçus après le gel des sources ; l’agrégat réutilise ces résultats après vérification exacte de leurs entrées et du bundle reconstruit.

L’audit strict rapproche **414 médias sources et 414 copies web**, sans fichier non identifié ni copie en attente. L’HTML autonome comprend les seize modules du graphe applicatif et ne demande aucune ressource externe. Le SHA-256 de l’HTML est `5617690ab88a55a522897aeee1e91b923ef3395074970e3b9b094037d192459b` ; celui du classeur est `21e5cac473dd41254700a873b70f73ea87f32a757e1dfdb15d817a2d1cdcb2d5`.

La tranche part du parent public `4846d0270b2976877f9b202848bfde6d2127fb1d`, arbre `ef7b912c27fa672f1930c980ee529c165e3f77ec`. Le reçu établi après publication rapproche l’arbre complet, le CAS sans force, la CI sur le commit exact, la réponse de Vercel et vingt-trois ressources HTTP. Les résultats ci-dessous attestent la publication GitHub et son contrôle continu ; ils constatent séparément le refus de déploiement.

Le vrai dossier v9 présent dans Chrome a été préservé par export avant migration. Les checkpoints préparés par le pilote restent distincts des actions natives. Les blocages de réception observés sont consignés ci-dessous ; QA19, QA20, QA29 et les essais humains conservent leurs critères ouverts.


## Publication GitHub 0.11 reçue — hébergement Vercel bloqué

Le commit **[47677e93dae9f214b763564cf8a357dd196c2b28](https://github.com/darknigthmare/ImperiumMarch/commit/47677e93dae9f214b763564cf8a357dd196c2b28)**, enfant de `4846d0270b2976877f9b202848bfde6d2127fb1d`, est publié sur `main` par CAS sans force. L’arbre `a1c40fc9e0946fe29a417ccd494b415b8653861a` correspond exactement au snapshot local : **1 259 fichiers, 160 ajouts, 35 changements et aucune suppression**. Les 202 empreintes et les 192 nouveaux blobs transférés concordent. Les 263 chemins historiques protégés, dont les 249 anciennes preuves, sont conservés.

La **[CI 43080098248](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43080098248)**, job 130730090563, est **SUCCESS** sur ce commit et cet arbre précis. Son journal reçu confirme **Node 22.23.4**, **440 tests réussis**, **71 parcours du DOM modélisé**, **64 comparaisons raster**, le catalogue de 873 fiches et dix missions, les contrôles statiques et les deux constructions. Les [métadonnées CI](validation/v11-ci-initial-verification.json) et le [journal intégral](validation/v11-ci-initial.log) sont conservés sans modification de leurs octets.

**Vercel n’a pas créé le déploiement demandé.** L’unique tentative a reçu **HTTP 402 — payment_required**, ressource **api-deployments-free-per-day**, avec un quota de plus de 100 déploiements dans la journée et un délai annoncé de **86 400 secondes**. Le [refus exact](validation/v11-vercel-initial-blocked.json) conserve la cible, le commit et la réponse. Aucun changement d’offre, d’équipe, de protection, de domaine ou de configuration n’a été entrepris, et aucun nouvel appel de création de déploiement n’a suivi ce refus.

Le dernier déploiement production observé reste **dpl_DtEwQsxmwa9a816U6zDTK1aq5A4n**, pour le commit **4846d027…**, donc la **0.10**. Le [constat HTTP des vingt-trois ressources](validation/v11-http-initial.json) trouve **18 réponses 200 identiques à la 0.10** et **5 réponses 404** pour les quatre modules chimiques et leur manifeste. Neuf fichiers correspondent aussi au snapshot 0.11 parce qu’ils sont inchangés ; ce chevauchement n’atteste pas une publication web 0.11.

Le [reçu initial consolidé](validation/v11-publication-initial.json) distingue ainsi GitHub et CI reçus, hébergement bloqué et réception native absente. L’HTML autonome et le classeur sont disponibles dans le dépôt ; leur disponibilité ne signifie pas qu’une partie 0.11 a été observée dans Chrome.

La tentative d’ouvrir le fichier autonome exact dans le navigateur de contrôle a été refusée par sa politique d’URL : `file://` est interdit, HTTP et HTTPS seuls sont autorisés. Le [constat natif](validation/native-v11/browser-reception.json) enregistre cette restriction séparément du quota Vercel. Aucun contournement n’a été tenté. Aucun export natif 0.11 n’a été obtenu ; le dossier public 0.10 reste conservé.

## Suivi des preuves 0.11

Le suivi ajoute les reçus de GitHub, CI et HTTP, les deux blocages, les précisions d’accès dans le README et un vérificateur des futurs exports natifs. **Les sources du jeu, les assets, les tests, la Bible et le HTML autonome sont identiques à la publication applicative.** Le [contrôle final du lot](validation/v11-release-checks-final.json) rapproche leurs empreintes. L’outil de vérification ne pilote pas de navigateur et maintient toutes les phases natives en attente tant que leurs exports manquent.

Le suivi 0.11 a été publié au commit **[`c7f3273a60824ff4e968ea36ab956c6a41710df0`](https://github.com/darknigthmare/ImperiumMarch/commit/c7f3273a60824ff4e968ea36ab956c6a41710df0)**, arbre **`7942d22cfdb0b73e42ae0a427a3afbc986f29160`**, avec **1 268 fichiers** comparés au snapshot. La [CI 43083066864](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43083066864) a réussi sous **Node 22.23.4** : 440 tests, 71 parcours DOM modélisés et 64 comparaisons raster. Le [reçu final](validation/v11-publication-final.json) et les [métadonnées CI](validation/v11-ci-final-verification.json) conservent ces résultats. Ce suivi n’a effectué ni nouvelle demande explicite de déploiement ni nouveau contrôle HTTP ; il reprend les observations initiales 0.10 et les blocages à leur date d’origine. Aucune réception native 0.11 n’en découle.

## Publication initiale 0.12 — GitHub et production reçus, CI en attente

La 0.12 ajoute **MI11 — Une voix au ras du sol**, le dossier v11, quatre modules voix et six composants graphiques originaux. Le [contrôle local figé](validation/v12-release-check.json) reçoit 516 tests Node, 86 parcours du DOM modélisé, 90 comparaisons raster et le classeur de 905 fiches. Ce reçu décrit l’état avant publication ; son champ de réception publique reste historiquement faux et ses octets sont conservés.

Le commit **[`e59dc2c51c68ec151cbc75a37a033c2650d3b95b`](https://github.com/darknigthmare/ImperiumMarch/commit/e59dc2c51c68ec151cbc75a37a033c2650d3b95b)**, enfant de **`c7f3273a60824ff4e968ea36ab956c6a41710df0`**, publie les **1 441 fichiers** du snapshot local **`98c988bd6115088d5e6eead45e0027fdbf5519c8`**. L’arbre distant **`dda2a0df55f6fa7b48c0fbc9b43e5581fa9495b8`** correspond intégralement aux chemins, modes et SHA Git attendus. Le delta comprend **173 ajouts, 32 modifications et aucune suppression** ; les **200 nouveaux blobs uniques** et les **1 440 empreintes** du contrôle de release ont été comparés. Les 672 chemins protégés, dont 295 anciens fichiers de validation, restent inchangés. Le CAS de `main` a été accepté sans force le **11 novembre 2026 à 20:21:42.809 UTC**.

Le [reçu initial consolidé](validation/v12-publication-initial.json) reçoit GitHub et l’hébergement, mais conserve explicitement la CI en attente. La [CI push 43095575253](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43095575253) est rattachée au commit et à l’arbre exacts. Le [constat initial de 20:34:41 UTC](validation/v12-ci-initial-pending.json) est conservé ; la [dernière observation du 11 novembre à 20:53:18.665 UTC](validation/v12-ci-initial-last-observation.json) relève encore **`queued`, zéro job et aucune conclusion**. La configuration déclare Node `22.x` ; aucun succès de tests distants sous Node 22 n’est encore attesté pour cette version. Les 516 tests locaux sous Node 24.22.1 restent une preuve distincte.

Vercel a automatiquement construit **`dpl_635PJUowJFoZ6qGQy2th8YEh6bum`**, état **READY**, cible **production**, pour ce même SHA. Le domaine [imperium-march.vercel.app](https://imperium-march.vercel.app/) est rattaché à cette publication. L’[observation Vercel](validation/v12-vercel-initial-observation.json) ne résulte d’aucune nouvelle demande explicite de création : l’intégration Git a déclenché le déploiement. Le projet, la protection, les domaines, le réglage Node `22.x` et l’offre sont conservés. Le quota de l’ancienne tentative explicite 0.11 reste historique ; son refus n’est pas réattribué à ce déploiement automatique réussi.

Les [28 ressources HTTP](validation/v12-http-initial.json), contrôlées entre **20:29:14 et 20:30:47 UTC le 11 novembre**, répondent **200**, avec des nombres d’octets et SHA-256 identiques au snapshot 0.12. Le contrôle porte sur un accès HTTP authentifié ; il ne revendique ni accès anonyme ni action native dans le jeu. Aucun jeton ni paramètre d’accès temporaire n’est conservé dans les reçus.

### Réception native partielle et suivi documentaire

Le [constat natif avant publication](validation/native-v12/browser-reception.json) demeure inchangé : son état `not_run` décrit l’observation du 11 novembre à 19:37:55 UTC, avant ce déploiement. Le reçu de publication initial garde également sa portée antérieure aux gestes de Chrome. La [réception en production](validation/native-v12/production-reception.json) et la [vérification des exports](validation/native-v12/production-verification.json) sont de nouvelles preuves distinctes.

Chrome a chargé la 0.12 et reçu les migrations v9/v10 vers v11, puis l’interruption et l’achèvement d’une écoute depuis son checkpoint préparé. Une autre séquence reprend un **échange préparé à 45 %**, avec le **Pèlerin WK09**, en difficulté **Normal avec les aides actives**. La progression à **48,416 %** est sauvegardée et rechargée avec un checkpoint identique ; seule la révision du dossier passe de 196 à 198. L’échange est ensuite achevé dans Chrome. Le choix **`defy` / remise en service** est suivi du déplacement réel vers l’émetteur et des cinq secondes de travail. Trois secondes de rapport puis la marche jusqu’à l’extraction aboutissent à une victoire à **05:47** : **onze rapports, 50 lots, trois sites intacts, Leth vivant à 420 HP et aucune perte civile**. TE01 reste acquis et les trois paires de traduction sont visibles dans les archives. La reprise native ajoute vingt-cinq tirs et neutralise deux forces ; onze tirs et une force déjà neutralisée appartenaient au checkpoint préparé.

Les exports [completed-native.json](validation/native-v12/completed-native.json) et [completed-reloaded.json](validation/native-v12/completed-reloaded.json) sont identiques après rechargement : **118 188 octets**, SHA-256 **`02b4f04765e73d2319259aa1639aaa896b182b5e94ceee0dd90812608f185c11`**. Ce contrôle final ne confond pas l’identité de ces exports avec le changement de révision de la reprise intermédiaire. Le reçu décrit les préparations et les actions natives ; il ne revendique pas une mission complète depuis son début, les autres châssis ou les autres décisions. **QA19, QA20 et QA29 restent ouvertes**, et aucune session humaine n’est reçue.

Le suivi documentaire conserve les sources applicatives, assets, tests, source Bible, classeur et HTML autonome du snapshot publié. Il ajoute les nouvelles preuves et actualise les quatre guides de publication. Leurs empreintes documentaires évoluent dans un nouveau lot ; le contrôle de release initial et les anciens reçus restent intacts. La publication du commit de suivi et sa propre CI devront être reçues séparément, avec un reçu établi hors du commit qu’il décrit.
