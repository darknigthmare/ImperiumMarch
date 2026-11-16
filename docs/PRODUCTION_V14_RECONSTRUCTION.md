# ORDRE DE CENDRE — reconstruction 0.14.1

**Date : 12 novembre 2026 · Nom de code : ImperiumMarch · Dossier de campagne v13**

La 0.14.1 rétablit une tranche de **treize missions jouables**, de MI01 à MI13, à partir de la source publique 0.12 et des spécifications conservées des deux livraisons locales perdues. MI12 termine la tranche actuelle de Thyr ; MI13 ouvre Kharon. Six châssis et trois opérations indépendantes restent disponibles. La Bible rassemble **977 fiches sur 21 onglets**, avec les 905 identifiants de la source publique conservés.

Les résultats finaux de validation sont consignés dans [QA_RECONSTRUCTION_014.md](QA_RECONSTRUCTION_014.md). Ce document décrit les livrables et leur portée ; il n’anticipe pas le nombre de contrôles réussis, l’état d’une publication ou une réception native encore en cours.

## 1. Provenance de la reconstruction

La base récupérée est le commit public [`0f77235f7545f33b1a4f298b81a44ee2122d46dc`](https://github.com/darknigthmare/ImperiumMarch/commit/0f77235f7545f33b1a4f298b81a44ee2122d46dc), version 0.12.0, arbre `f652f75342f66ec5a3bbcb298f4f842ac8a09265`. Il conserve MI01–MI11, le code, les ressources, la Bible 0.12 et les preuves historiques correspondantes.

Les fichiers locaux 0.13 et 0.14 n’ont pas été retrouvés à l’identique. Les éléments reconstruits s’appuient sur les descriptions des livraisons conservées dans la conversation, les fiches MI12/MI13 et VE12 déjà présentes dans la Bible publique, ainsi que les règles de causalité des missions précédentes. Le code, les textes détaillés, les géométries, les exports et les preuves ajoutés dans cette reconstruction sont des productions nouvelles.

| Élément | Provenance retenue | Limite |
| --- | --- | --- |
| MI01–MI11, fixtures anciennes, rapports et médias historiques | Source publique 0.12 | Les observations anciennes gardent leur date, leur version et leur environnement. |
| MI12 — Le troisième relais | Canon public, exigences et compte rendu de la 0.13 perdue | Nouvelle implémentation ; aucune identité binaire avec le code perdu n’est revendiquée. |
| MI13 — Pièces de rechange | Canon public, exigences et compte rendu de la 0.14 perdue | Les règles connues sont reconstruites et recontrôlées sur les nouveaux octets. |
| 72 fiches supplémentaires de Bible | Identifiants et domaines de travail conservés | Les textes sont rédigés à nouveau. Les tests perdus ne sont pas déclarés à nouveau réussis par copie de leurs chiffres. |
| Géométries MI12 et Kharon | Dessins originaux produits dans les nouveaux modules d’assets | La géométrie des exports SVG est celle du Canvas ; les planches ne sont pas des captures de jeu. |
| Nouvelles preuves | Exécutions de la reconstruction | Simulation, DOM, Canvas, navigateur et essai humain restent des portées différentes. |

Les [règles du dépôt](../AGENTS.md), le [canon de campagne](CAMPAIGN_FR.md), la [Bible générale](BIBLE_FR.md) et la [direction artistique](ART_DIRECTION.md) restent les références de conception. Le [suivi de déploiement](DEPLOYMENT.md) conserve séparément le commit poussé et la publication réellement vérifiée.

## 2. MI12 — Le troisième relais

### Situation et ordre

Après le rapport de MI11, Holt demande d’effacer les trois relais de la vallée avant une inspection d’Orison. Le troisième conserve des commandes liées au traitement chimique de Thyr. Le dossier hérité indique uniquement ce qui a réellement été acquis dans MI10 et MI11 ; il ne transforme pas une présence passée de Leth en une nouvelle rencontre.

### Chaîne d’actions reconstruite

1. Relever chaque relais sous ancrage pendant trois secondes. Un appareil détruit reçoit un constat de perte.
2. Après le troisième relevé, rejoindre le terminal et tenir une copie complète de vingt-quatre secondes dans une fenêtre de quarante-cinq secondes.
3. Affronter le Prétoire de sécurité après son délai réel d’arrivée. Sa présence, ses collisions et ses tirs n’existent pas avant cet événement.
4. Choisir une conduite puis intervenir sur les appareils encore intacts : cinq secondes par purge ou isolement.
5. Transmettre le rapport des opérations, des sources et des pertes pendant trois secondes, puis rejoindre physiquement l’extraction.

| Conduite | Opérations demandées | Conséquence conservée |
| --- | --- | --- |
| Exécuter la purge | Effacer les trois relais | Le rapport distingue la purge réelle, les pertes et une éventuelle copie déjà embarquée. |
| Conserver clandestinement | Effacer les deux premiers relais et isoler le troisième | Holt constate l’écart ; la source isolée reste distincte d’une copie acquise. |
| Refuser ouvertement | Isoler les trois relais | Le refus est public et le refuge impérial devient indisponible. |

La décision ne déplace, ne répare et n’opère aucun relais. Une destruction après une intervention reste inscrite au bilan. Une copie interrompue doit être relancée ; sa fenêtre initiale continue d’avancer avec la simulation. La pause n’avance ni le travail ni l’échéance.

### Prétoire VE12

Le Prétoire est un quadrupède bas de sécurité, avec quatre appuis portés par le terrain. Son capteur supérieur règle la visée longue portée. Le perdre interrompt le verrouillage en cours et laisse une visée de secours à courte portée. Son verrou hydraulique frontal maintient l’ancrage et la protection de coque ; le rompre expose le blindage et permet un recul réel.

La simulation fournit la position du corps, des composants, des appuis et de la cible télégraphiée. Le rendu ne fabrique pas de contacts ni d’arrivée. La désignation VE12 et les deux faiblesses viennent de la fiche de véhicule publique ; ce prototype ne constitue pas la production finale de tous les composants ennemis du jeu.

### Archive et équipage

Une copie complète conserve des commandes industrielles locales. Les textes ne sont présentés que si leur source a effectivement été copiée. La destruction ou la purge ultérieure de l’original n’efface pas une copie embarquée. Une source perdue avant acquisition ne produit aucun texte reconstitué.

Ilan réagit aux pièces réellement vues au moment du rapport. Les décisions locales, l’écart relevé par Holt et l’accès au refuge sont enregistrés séparément. MI12 n’attribue pas de nouvelle preuve PT, de chaîne politique globale ni de défection anticipée.

## 3. MI13 — Pièces de rechange

### Convoi et circuits thermiques

Le porteur industriel escorte deux caisses distinctes jusqu’à la fonderie. Ses quatre roues et les pieds du marcheur suivent les surfaces de simulation. Deux tabliers thermiques disposent de leur propre vanne et circuit.

Une vanne demande quatre secondes d’ancrage. Elle coupe le jet correspondant et refroidit progressivement le tablier de 90 °C vers 28 °C. La chaleur ambiante, la conduction par les contacts et les jets de vapeur sont traités séparément. Les séquences de vapeur gardent leurs trois phases : annonce de trois secondes, jet de deux secondes, repos de sept secondes. Les avertissements doivent rester lisibles lorsque la réduction des animations est activée.

Une embuscade fait entrer deux drones et une tourelle après leur délai d’alerte. Le porteur, les caisses et le bordereau conservent leurs dommages. La destruction du porteur termine la sortie ; le rapport ne le remet pas en état.

### PT03 : une provenance acquise

Chaque marquage de caisse exige trois secondes de relevé. Le bordereau demande quatre secondes de copie ; l’analyse de Tess prend huit secondes et utilise les pièces réellement embarquées. **PT03 exige les deux marquages, le bordereau et l’analyse achevée.**

Les recoupements avec PT01 ou les commandes de MI12 sont conditionnés par la présence de ces sources dans les dossiers précédents. La preuve industrielle locale peut donc être acquise malgré une archive antérieure perdue. Une source détruite avant copie reste absente ; une copie déjà conservée survit à la destruction ultérieure de l’original.

Cette preuve ne démontre pas à elle seule toute la chaîne de commandement PALINODE. MI13 ne crée ni PT04, ni TE02, ni PO01, ni autorisation de diffusion publique, ni défection avant MI16.

### Destination et déchargement

Livrer à la fonderie ou mettre en quarantaine sélectionne un quai, sans téléporter le convoi. Le porteur doit rejoindre la destination choisie. Chaque caisse survivante demande ensuite un transfert de cinq secondes. La position et la progression d’un transfert partiel sont conservées. Les autres travaux interrompus suivent leurs propres règles de reprise ; une simple pause conserve l’état exact.

Le rapport est transmis après les actes et les pertes constatés, puis le marcheur rejoint l’extraction. Le bilan distingue caisses intactes, endommagées, perdues et transférées, ainsi que les copies conservées indépendamment de leur source.

## 4. Dossier v13 et progression

Le [contrat de sauvegarde v13](CAMPAIGN_SAVE_V13.md) décrit les migrations, les checkpoints, les réceptions et les reprises. La progression officielle passe par le premier rapport de la mission précédente. Les opérations OP01–OP03 restent indépendantes.

La migration v11 vers v12 ajoute le dossier de relais de Thyr vide. La migration v12 vers v13 ajoute le domaine `world.kharon.foundry` vide. Les rapports, les ressources, l’équipage, la flotte, les anciennes scènes et l’ancien marqueur d’étape restent conservés selon les contrats historiques. Les fixtures anciennes ne sont pas régénérées à partir du code courant.

Le premier rapport de MI12 et celui de MI13 attribuent chacun quatre lots de pièces, une seule fois. Une relecture ne remplace pas le premier dossier et n’accorde pas de nouvelle dotation. Une défaite est terminale pour sa sortie ; le lancement explicite d’une nouvelle sortie reste un acte différent d’une restauration de checkpoint.

Les fichiers locaux perdus n’étant pas disponibles, une compatibilité octet par octet avec leurs éventuels exports ne peut pas être reçue. Les nouveaux exports v12/v13 de reconstruction portent leur propre provenance et sont validés sur le schéma effectivement livré.

## 5. Bible et statuts

La [source JSON](../data/bible.json) conserve les 905 identifiants publics et ajoute 72 fiches reconstruites. Le [classeur Excel](ORDRE_DE_CENDRE_Bible.xlsx) comporte les vingt domaines de données et la synthèse, soit vingt et un onglets. Les compteurs décrivent le référentiel ; ils ne mesurent pas le pourcentage de jeu terminé.

| Domaine | IDs de reconstruction | Fiches |
| --- | --- | ---: |
| Systèmes | SY112–SY127 | 16 |
| Narration | NA87–NA94 | 8 |
| Production | PR92–PR97 | 6 |
| Prototype | PX105–PX116 | 12 |
| QA | QA192–QA221 | 30 |
| **Total** | | **72** |

Les **133 critères initialement « À produire »** gardent leur [baseline](validation/production-v09-baseline.json). Une nouvelle fiche ou une réception partielle ne modifie pas ce dénominateur. Conçu, Prototype, À produire et Vérifié restent distincts. Les résultats de validation du classeur figurent dans le rapport QA courant ; les chiffres et observations des anciens classeurs gardent leur portée historique.

## 6. Modules et reproduction

| Domaine | Fichiers principaux |
| --- | --- |
| Données et progression | `src/content.mjs`, `src/campaign.mjs` |
| Moteur et raccords | `src/simulation.mjs`, `src/renderer.mjs`, `src/main.mjs` |
| MI12 | `src/relay-simulation.mjs`, `src/relay-validation.mjs`, `src/relay-renderer.mjs` |
| MI13 | `src/foundry-simulation.mjs`, `src/foundry-validation.mjs`, `src/foundry-renderer.mjs` |
| Dessins originaux | `src/relay-assets.mjs`, `src/foundry-assets.mjs`, manifestes dans `assets/relay/` et `assets/foundry/` |
| Pilotes reproductibles | `tests/helpers/mi12-driver.mjs`, `tests/helpers/mi13-driver.mjs` |
| Bible | `data/bible.json`, `tools/build-bible.mjs`, `docs/BIBLE_README.md` |

Les commandes générales du dépôt restent :

```sh
npm test
npm run build
npm run check
npm run check:ui
npm run check:ui-runtime
npm run check:assets-render
npm run build:web
```

Les ressources et scènes des deux nouvelles missions se produisent séparément :

```sh
node tools/build-relay-assets.mjs
node tools/build-foundry-assets.mjs
node tools/render-mi12-previews.mjs
node tools/render-mi13-previews.mjs
```

Ces outils Canvas utilisent leurs dépendances de développement. Le jeu autonome intègre son code, ses styles et ses ressources et ne nécessite pas ces outils pour fonctionner. `npm run test:browser` reste un essai distinct, qui exige Playwright et un navigateur disponibles dans l’environnement d’exécution.

Les rendus MI12 conservent leur manifeste dans [rebuild-mi12/scenes.json](validation/rebuild-mi12/scenes.json) et leur [reçu Canvas](validation/rebuild-mi12/canvas-validation.json). Les autres preuves et leurs limitations sont référencées par [QA_RECONSTRUCTION_014.md](QA_RECONSTRUCTION_014.md). Les empreintes doivent être recalculées après modification d’une source ; les manifestes ne doivent pas être présentés comme attestant des fichiers qu’ils n’ont pas lus.

## 7. Ce qui reste à produire

La prochaine mission conçue est **MI14 — Les mains noires**. **MI14–MI32 représentent dix-neuf missions principales encore à produire**, auxquelles s’ajoutent les seize contrats. La défection de MI16, la coalition, les huit mondes complets, les neuf factions et les quatre familles de fins ne deviennent pas jouables par l’ajout de MI12/MI13.

Six autres châssis, les équipements spécialisés, les autres véhicules et leurs composants, les doctrines ennemies, les animations finales, les voix, les effets complets et la mise en scène restent dans le référentiel. Le kit de Kharon reçoit une tranche industrielle de prototype ; il ne clôt ni la planète entière ni Sereis.

Les essais humains, la réception sur périphériques physiques, l’écoute audio, les objectifs de performance sur matériel déclaré et les gestes bureautiques interactifs du classeur gardent leurs critères distincts. Une suite automatique ou un rendu Canvas réussi ne les transforme pas en réceptions accomplies.

**AAA demeure l’ambition de production du projet. La 0.14.1 est une tranche jouable reconstruite et vérifiable, avec un registre explicite des éléments encore ouverts.**
