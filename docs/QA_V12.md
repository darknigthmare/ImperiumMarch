# Validation 0.12 — Une voix au ras du sol

La réception porte sur le prototype MI01–MI11, les six châssis et les trois opérations indépendantes. Moteur sans DOM, script en DOM modélisé, rendu Canvas, classeur et navigateur natif sont des environnements distincts. Les reçus indiquent leurs commandes, résultats et empreintes ; aucune validation humaine n’est déduite d’un contrôle automatique.

## Contrôles globaux sur les sources figées

La [suite Node finale](validation/v12-node-validation.json) passe **516 tests sur 516**, sans échec, annulation, omission ni test à faire. Elle est exécutée sous **Node 24.22.1** ; les empreintes des entrées restent identiques pendant les 76,8 secondes de cette passe. Le moteur déclaré pour la publication est Node 22.x. La [CI push 43095575253](https://github.com/darknigthmare/ImperiumMarch/actions/runs/43095575253) correspond au commit public exact, mais sa [dernière observation reçue](validation/v12-ci-initial-last-observation.json) relève **`queued`, zéro job et aucune conclusion**, le **11 novembre 2026 à 20:53:18.665 UTC**. **Aucun résultat CI sous Node 22 n’est encore reçu pour la 0.12.**

Le [reçu de construction](validation/v12-build-validation.json) confirme l’édition autonome de **10 507 813 octets**, vingt modules intégrés, 189 identifiants HTML et 178 références JavaScript littérales. La construction web et l’audit statique rapprochent **442 médias sources et 442 copies web**, sans entrée inconnue. Les trois fichiers image demandés par le jeu restent intégrés dans l’édition autonome ; les formes sont dessinées en code et les sons synthétisés.

Les sous-suites de simulation et campagne ci-dessous sont incluses dans les 516 tests globaux ; elles ne doivent pas être additionnées à ce total. Les parcours du DOM modélisé, les images Canvas et le recalcul de classeur ont chacun leur reçu distinct.

### Corrections issues de la revue

Quatre contre-exemples atteints par les commandes publiques ont été corrigés : rencontre avant les deux inspections, mort avant le constat de rencontre, défaite avec émetteur intact sans liaison rétablie, et retrait de coopération avant tout témoignage. Les priorités du HUD suivent maintenant les prérequis réellement manquants. Le bilan conserve l’existence du signal local. Les archives et la réaction de Sami n’évoquent un ancien enregistrement que s’il a été achevé. Aucun fait matériel n’a été fabriqué pour rendre ces textes cohérents.

Le premier contrôle global avait aussi trouvé une ancienne assertion de portée limitée à MI01–MI10 dans le test de MI02. Seule sa liste de missions courantes a été étendue à MI11 ; les contrôles ferroviaires et les autres assertions matérielles restent conservés.

## Simulation et campagne

Le [reçu de simulation MI11](previews/mi11-simulation-validation.json) et son [journal](validation/v12-simulation-tests.tap) conservent **120 tests réussis : 35 MI11 et 85 régressions partagées**. Douze parcours complets utilisent seulement les commandes publiques, sur six châssis et deux conduites en difficulté normale, avec 572 checkpoints périodiques. Ils vérifient les trois écoutes, les appuis réellement surélevés, la ponte préservée, les sources, le témoignage protégé, l’opération d’émetteur et l’extraction.

Les cas de perte utilisent des tirs et états physiques. Le refus, le retrait avant et après témoignage, le décès de Leth avant et après enregistrement, la perte des originaux et la défaite restent distincts. Un Leth déjà mort ne prononce aucune nouvelle phrase. Son décès ajoute une seule perte non combattante ; les nids ne sont pas transformés en population.

Le [reçu de campagne](validation/v012-campaign-validation.json) passe **224 tests**, dont 41 MI11. Le [contrat v11](CAMPAIGN_SAVE_V11.md) décrit les migrations et la validation. Les travaux partiels doivent avoir des dates et préconditions causales, tout comme les travaux terminés. La comparaison entre checkpoints interdit d’antidater une reprise, de recréditer une progression interrompue ou d’effacer une perte. Les premiers rapports et leurs dotations restent immuables.

## Interface exécutée dans le modèle de DOM

Le [reçu d’interface](validation/v12-ui-validation.json) et le [journal](validation/v12-ui-runtime.txt) confirment **86 parcours sur 86**, dont les 71 parcours antérieurs et 15 parcours MI11. La passe finale dure 164,5 secondes ; 46 entrées comparées avant et après, dont l’HTML autonome exact, restent identiques. Le reçu a été produit comme contrôle préparatoire puis repris dans la livraison après rapprochement de toutes ses empreintes, sans modifier ses octets.

Les nouveaux parcours vérifient migration du dossier v10, briefing, HUD, écoute interrompue et relancée, rencontre et accord sans témoignage anticipé, pause et reprise de l’échange, deux conduites avec intervention matérielle, extraction réelle au clavier depuis un point préparé, onze rapports et dotation unique. Les quatre combinaisons de présence des colonnes d’archive sont vérifiées, ainsi que la perte ultérieure du témoin.

Les quatre contre-exemples de la revue sont exécutés séparément dans le même HTML final. Le pilote de contrôle de la copie a aussi été ajusté pour conserver une marge de freinage : son premier arrêt se trouvait hors du rayon réel d’interaction. Aucun rayon de jeu n’a été augmenté pour faire passer le test.

La relecture est contrôlée au lancement, pendant un déplacement et à la pause, sans écriture du dossier officiel ; sa fin complète est couverte dans les tests de campagne. Le DOM modélisé exécute les gestionnaires livrés, mais ne valide pas le CSS natif, un dialogue système, le focus d’une vraie fenêtre ou une partie humaine.

## Provenance du dossier v10

La fixture [campaign-v10-mi10.json](../tests/fixtures/campaign-v10-mi10.json) provient des exports de la 0.11 figée, produits avec les commandes publiques. L’[attestation](validation/v012-historic-v10.json) identifie les octets et leur arbre historique. **Ce dossier n’est pas présenté comme un export natif de navigateur.** Les fixtures antérieures gardent leur provenance propre et leurs octets.

La migration ajoute seulement le domaine voix non visité et le numéro v11. Elle conserve dix rapports, ressources, flotte, scènes anciennes et marqueur historique. MI11 se déduit du premier rapport manquant. Un dossier sans dépense peut passer de 46 à 50 lots après sa première réussite ; une relecture ne reçoit aucune nouvelle dotation.

## Rendu et assets

La [réception Canvas](previews/mi11-canvas-validation.json) comprend **25 images, dix-huit parcours complets et cinq exports de campagne**. Le générateur part du dossier v10 figé et n’utilise aucun setter de position, santé, temps, permission ou résultat. Les captures copient profondément l’état ; le rendu doit le laisser strictement inchangé. Les six châssis sont observés avec un vrai pied sur la corniche.

Les cinq exports préparent l’écoute, l’échange, la décision, l’avant-extraction et le dossier terminé. Ils sont destinés à une réception native future, qui devra déclarer ce point de départ préparé.

La [revue visuelle](validation/v12-canvas-visual-review.json) porte sur les 25 scènes en planche d’ensemble, cinq scènes nommées en pleine résolution et les deux planches d’assets. Le refus n’affiche aucun témoignage acquis ; la perte ultérieure de Leth conserve TE01 tout en retirant sa disponibilité. L’émetteur saisi laisse un socle vide. Les libellés de monde peuvent passer derrière la machine ; les panneaux de statut restent distincts.

Le [journal raster](validation/v12-assets-render.txt) passe **90 comparaisons**, dont les 26 nouveaux états de voix, au seuil de recouvrement conservé de 92 %. Le lot comprend six composants, vingt-six SVG et deux PNG. Cette concordance de géométrie ne constitue ni une validation artistique finale, ni un essai de performance.

## Classeur et registre

La Bible reçoit **905 fiches sur 21 feuilles**, avec 6 105 cellules source, 20 tables et 126 formules. Les 873 IDs précédents restent présents et 32 fiches sont ajoutées. Le [guide](BIBLE_README.md) et le [registre](PRODUCTION_REGISTER_V12.md) indiquent les réceptions réellement obtenues : correspondance de cellules, conservation de baseline, recalcul indépendant et vues examinées.

Le [recalcul final](validation/workbook-v0.12-libreoffice.json), exécuté avec LibreOfficeDev 26.8.0.0.alpha0 sur une copie isolée, a retiré puis reconstruit les 126 caches de formule en **35,922 secondes**. Les 6 105 cellules source, résultats et structures restent identiques ; le classeur livré n’a pas été modifié par ce contrôle. Une première exécution avait dépassé le délai court ; le budget explicite a été augmenté sans assouplir les critères de réception.

La [revue visuelle finale](validation/workbook-v0.12-visual-review.json) porte sur **48 vues** : les cinq vues modifiées ont été relues, les 43 autres sont octet-identiques aux vues déjà examinées. La [baseline](validation/workbook-v0.12-baseline-check.json) conserve **519 fichiers historiques**, 873 identifiants et les 133 critères initiaux. Sept sondes négatives et huit baselines sans Git vérifient séparément les contrôles de référence et de conservation.

Le registre initial compte désormais **37 Prototype, 16 Vérifié et 80 À produire**. Une seule ligne initiale change de statut : AS13, reçue partiellement. La source complète compte **278 Conçu, 374 Prototype, 88 À produire et 165 Vérifié** ; ces compteurs décrivent des fiches, pas un pourcentage du jeu achevé.

Les 133 critères initiaux gardent leur exigence d’origine. AS13 est un **Prototype partiel**, limité à un interprète local et ses outils. Les Khelt complets, leurs animations finales et leurs voix restent ouverts. Le recalcul automatique ne vaut pas réception interactive dans Excel ou Calc ; QA29 n’est pas clôturée par celui-ci.

## Publication GitHub et disponibilité web reçues

Le [reçu initial de publication](validation/v12-publication-initial.json) rattache le commit **`e59dc2c51c68ec151cbc75a37a033c2650d3b95b`** à l’arbre **`dda2a0df55f6fa7b48c0fbc9b43e5581fa9495b8`** : 1 441 fichiers comparés au snapshot local, avec 1 440 empreintes du contrôle de release et 200 nouveaux blobs uniques reçus. Le CAS de `main` a conservé le parent attendu, sans force.

Le déploiement automatique **`dpl_635PJUowJFoZ6qGQy2th8YEh6bum`** est **READY**, cible production, pour ce même SHA. L’[observation Vercel](validation/v12-vercel-initial-observation.json) distingue l’intégration Git d’une nouvelle demande explicite : aucune création de déploiement, modification de configuration, de protection ou d’offre n’a été demandée. Les [28 ressources HTTP](validation/v12-http-initial.json) répondent 200 et leurs octets/SHA-256 correspondent exactement au snapshot, au contrôle achevé le 11 novembre à 20:30:47 UTC. Cette vérification utilise un accès HTTP authentifié ; elle ne revendique pas un contrôle anonyme.

Le quota HTTP 402 reçu en 0.11 reste un événement historique propre à la tentative explicite du 11 novembre. Il n’empêche pas le déploiement automatique 0.12 observé. La réussite de cet hébergement ne fournit aucun résultat à la CI encore en attente et ne reçoit pas les gestes d’une partie native.

## Réception native partielle en production

Le [constat antérieur à la publication](validation/native-v12/browser-reception.json), enregistré le 11 novembre à 19:37:55 UTC, garde son état **`not_run`**. Il conserve les contraintes alors connues : quota de la demande explicite Vercel 0.11 et refus des URL `file://` par le navigateur de contrôle. Ce document historique reste inchangé.

La [réception de production](validation/native-v12/production-reception.json) consigne une intervention distincte dans Chrome sur la 0.12 publiée, avec le **Pèlerin H-6 — WK09**, la difficulté **Normal**, les **aides actives** (`assist: true`) et le choix **`defy` / remise en service**. Les migrations, l’écoute et la continuation de l’échange utilisent des points de départ distincts. La [vérification des exports](validation/native-v12/production-verification.json) rapproche les états conservés ; aucune préparation par le pilote de simulation n’est renommée en geste natif.

| Séquence reçue | Actions et résultats observés | Portée du point de départ |
| --- | --- | --- |
| Migrations | Chrome a chargé la 0.12 et les dossiers v9/v10 ont été migrés exactement vers v11. | La provenance native du dossier v9 et la préparation historique du dossier v10 restent déclarées séparément dans le reçu. |
| Écoute | Une écoute a été interrompue puis achevée dans Chrome. | Essai depuis son checkpoint préparé ; les trois écoutes complètes ne sont pas attribuées à cette séquence. |
| Échange et reprise | Import à 45 %, progression jusqu’à 48,416 %, sauvegarde, rechargement, puis témoignage achevé dans Chrome. | Les conditions et acquisitions antérieures appartiennent au checkpoint. À la reprise, le checkpoint reste identique ; seule la révision du dossier passe de 196 à 198. |
| Combat dans la reprise | Vingt-cinq tirs ajoutés et deux forces privées neutralisées pendant la continuation native. | Le checkpoint contenait déjà onze tirs et une force neutralisée ; les totaux finaux de trente-six tirs et trois forces neutralisées ne sont pas tous attribués au navigateur. |
| Décision et émetteur | Choix de remise en service, retour physique à portée et cinq secondes de travail réellement effectuées. | La décision ne produit pas à elle seule la remise en service. |
| Rapport et extraction | Trois secondes de rapport, marche jusqu’à l’extraction et victoire à 05:47. | Continuation de la même sortie après l’échange préparé, sans nouveau point de départ pour recevoir la fin. |
| Bilan, archives et recharge | Onze rapports, 50 lots, TE01 conservé, trois sites intacts, Leth vivant à 420 HP, aucune perte civile ; les trois paires de traduction sont visibles dans les archives. | Les faits antérieurs conservés ne deviennent pas rétroactivement des actes observés dans Chrome. |

Les exports [completed-native.json](validation/native-v12/completed-native.json) et [completed-reloaded.json](validation/native-v12/completed-reloaded.json) sont **identiques octet pour octet** : **118 188 octets**, SHA-256 **`02b4f04765e73d2319259aa1639aaa896b182b5e94ceee0dd90812608f185c11`**. Cette égalité finale est distincte du changement de révision observé lors de la reprise intermédiaire de l’échange.

La portée native reçue reste partielle : un châssis, la remise en service et des séquences issues de checkpoints déclarés. Elle ne certifie pas une mission entière depuis son début, les autres choix ou les variantes de pertes. Les observations natives 0.9 et 0.10 gardent leur propre portée historique.

Le [protocole humain](PLAYTEST_VOICE_V12.md) possède un [formulaire non exécuté](validation/human-mi11-session-template-v12.json). **PR91 et QA191 restent ouverts** : aucune session humaine n’a eu lieu. **QA190 reste À produire dans la Bible figée** : son attendu conserve le constat `not_run` d’avant publication ; les nouvelles preuves natives partielles sont apportées séparément, sans réécrire cet état historique. **QA19, QA20 et QA29 restent ouvertes** pour leurs contrôles propres de focus, petite fenêtre réelle et usage interactif du classeur. La manette physique et l’écoute sonore ne sont pas reçues par ce parcours. La Bible figée, ses statuts et ses anciens reçus ne sont pas réécrits par le suivi documentaire.
