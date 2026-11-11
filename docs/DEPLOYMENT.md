# Déploiement web — ORDRE DE CENDRE

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

`npm run build` conserve son rôle : produire `dist/Ordre_de_Cendre.html`, qui s'ouvre hors ligne. Ce fichier et le classeur de conception sont inclus dans le dépôt. La construction web ne les modifie pas.

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
