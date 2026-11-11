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

Les tests courants sont documentés dans [QA_V09.md](QA_V09.md). Les rapports précédents restent conservés comme historique. Un déploiement prêt ne remplace pas une validation navigateur.


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
