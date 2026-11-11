# ORDRE DE CENDRE — Validation de la version 0.7

**11 novembre 2026 · application 0.7.0 · sauvegarde v6**

La sixième mission poursuit Nacre aux Trois-Vannes. Cette validation distingue la simulation, le dossier persistant, les gestionnaires d’interface exécutés dans un DOM modélisé, les rendus Canvas, le classeur et le navigateur réel. Les essais humains de difficulté, de son et d’accessibilité restent ouverts.

## Contrôles reproductibles

| Contrôle | Résultat observé | Preuve |
| --- | --- | --- |
| Simulation et dossiers | **176 tests réussis**, zéro échec et zéro ignoré | [v07-node-tests.txt](validation/v07-node-tests.txt) |
| Interface dans un DOM modélisé | **34 parcours réussis**, exécutant le vrai script autonome | [v07-ui-runtime.txt](validation/v07-ui-runtime.txt) |
| Cohérence statique | 143 IDs uniques, 132 références littérales, 5 vues, 4 onglets d’archives, 6 dialogues | [v07-static-ui.txt](validation/v07-static-ui.txt) |
| Construction autonome | HTML de 9,43 Mio, six modules et ressources intégrés | [v07-build.txt](validation/v07-build.txt) |
| Construction web | Page, modules, styles et assets dans `web-dist` | [v07-web-build.txt](validation/v07-web-build.txt) |
| Catalogue | 705 fiches, six châssis, trois opérations et six missions de campagne | [v07-project-check.txt](validation/v07-project-check.txt) |
| Classeur | 705 fiches, 4 811 cellules de source, 643 IDs antérieurs conservés, 126 formules | [workbook-v0.7-export.json](validation/workbook-v0.7-export.json) |
| Scènes de MI06 | Sept rendus Canvas depuis des commandes publiques, snapshots complets indépendants | [mi06-render-manifest.json](previews/mi06-render-manifest.json) |
| Relecture indépendante | Huit variantes, 589 sauvegardes/réimportations et 460 restaurations exactes ; empreintes des sources stables | [v07-campaign-audit.json](validation/v07-campaign-audit.json) |
| Navigateur réel 0.7 | Migration et import v5, lancement MI06, pause/rechargement, reprise de vanne et extraction depuis un checkpoint public, six rapports | [v07-browser.json](validation/v07-browser.json) |
| Publication 0.7 | 254 fichiers distants identiques, Vercel READY au SHA exact, CI Node 22 réussie, dix ressources HTTP 200 conformes | [v07-publication.json](validation/v07-publication.json) |

Les commandes locales utilisent Node.js 24.22.1. La CI du commit publié a également réussi les 176 tests, les 34 parcours UI et les constructions sous **Node.js 22.23.4**, version réellement relevée dans ses logs. Le projet et Vercel ciblent Node.js 22.x. Les contrôles et leurs limites de la [0.6](QA_V06.md) restent conservés.

## Règles MI06 vérifiées

Les **20 tests de `mi06-mission.test.mjs`** comprennent les six châssis avec les deux circuits et les six châssis sur une voie manuelle sans carburant ni techniciens. Les pilotes marchent, interagissent, s’ancrent et tirent par les commandes publiques. Ils ne déplacent pas directement les entités et ne forcent pas la victoire. Les cas de calibration de collision sont identifiés explicitement et ne sont pas présentés comme des parties humaines.

Les deux maisons sont inspectées séparément, avec trois secondes de travail à portée et annulation en cas d’éloignement. Un appel d’évacuation après une première inspection est global ; il ne donne pas gratuitement la seconde inspection. Les dix habitants sont locaux, répartis en groupes de six et quatre. Ils avancent vers l’abri ouest, rencontrent les menaces, peuvent être perdus en route et ne comptent comme sauvés qu’après arrivée. Les personnes déjà à l’abri sortent des collisions de dégâts.

Les deux techniciens rejoignent physiquement le chantier, peuvent se mettre derrière un couvert survivant et restent distincts au poste de verrouillage. Le second intervenant prend la serrure si le premier est perdu : une correction a supprimé un blocage où il restait à 28 unités du poste exigé. Les ennemis terrestres s’arrêtent contre les volumes de chantier ; ils ne peuvent plus pénétrer le panneau et devenir une cible inaccessible sans tirer à travers celui-ci.

Le soutien exige les contacts de la simulation : coque ancrée, immobile, à portée du repère et tous les pieds posés dans la bande autorisée. Lever un appui annule le verrouillage partiel. Les tests couvrent l’approche, l’interruption, la reprise déterministe et le besoin d’un technicien vivant. Un panneau peut être détruit après son verrouillage ; le verrou perdu ne sécurise plus l’extraction. L’étai de secours permet de poursuivre sans reconstruire le panneau. Une charge non soutenue fait monter la fatigue, peut rompre la structure et produit les pertes proches réellement résolues.

L’auxiliaire demande quatre secondes. La progression est conservée par la pause et une reprise exacte ; sortir du rayon annule sans dépense. La connexion achevée consomme exactement deux lots. Sa destruction préalable ne coûte rien ; une destruction ultérieure désactive la pompe sans rembourser le carburant. L’avantage est mesuré : l’étai exige huit secondes avec l’auxiliaire active, douze sans elle.

La décision ne manœuvre pas la vanne. Un travail distinct remet les pompes en service, avec des durées dépendant du circuit et d’un technicien réellement arrivé. Un éloignement interrompt ce travail ; la reprise conserve un état déterministe. Le circuit impérial fait ensuite monter l’eau. Les maisons deviennent inhabitables même si leurs habitants ont été évacués. Sans évacuation, les personnes encore dedans sont perdues. La dérivation conserve les maisons intactes, sans reconstruire celles déjà détruites.

Le bilan humain, les logements, les techniciens, le soutien et le circuit restent séparés jusqu’à l’extraction. Des pertes après la décision modifient encore le texte du constat. Mara intervient par radio ; aucune unité Mara vulnérable ou ressuscitée n’est inventée. `stats.evidence` reste nul : MI06 ne crée pas une preuve PALINODE.

## Dossier v6 et consommation

Les **11 tests de `campaign-v6.test.mjs`** s’ajoutent aux 145 tests précédents et aux vingt tests de mission. Les rapports historiques restent inchangés. La fixture v5 est issue du snapshot public immuable **613c07307f2712c5fac28d9403016906e94da168**, correspondant au commit local **c598badad94f81aaaf16f2b13d9e7c11b8508995** de la 0.6. Elle contient MI05 avant décision et après extraction. Elle n’est pas régénérée depuis le code courant.

La migration ajoute seulement le dossier de digue non visité, le compteur de dépense nul et le numéro 6. Dans la fixture vivante, deux lots sont déjà chargés physiquement mais la réserve officielle reste nulle jusqu’à la réussite de MI05 ; la migration ne les crédite pas prématurément. Les tests conservent les octets d’origine jusqu’à l’écriture, la copie de secours, la protection d’un primaire futur et le refus de champs MI06 introduits dans une v5.

La réserve courante plus la dépense cumulée doit toujours égaler le carburant acquis à MI05. Le budget de départ est distinct du coût de la sortie. Un même checkpoint ne débite pas deux fois l’auxiliaire. `finishCampaignMission` règle également une consommation accomplie depuis la dernière capture, avant une réussite ou une défaite. Le stimulus de défaite de ce test est un projectile de calibration résolu par les collisions de production : il ne modifie pas directement la coque ni le statut.

Une défaite MI06 produit un checkpoint terminal qui reste perdu à la reprise. Une nouvelle tentative repart avec le stock restant. Si les deux lots ont été consommés pendant l’échec, le succès manuel suivant conserve un coût de sortie nul et une dépense cumulée de deux. Il ne donne qu’un rapport et qu’une dotation de quatre pièces. Le maximum d’atelier avant dépense atteint trente pièces après six succès, indépendamment du carburant.

La relecture retrouve le budget du premier succès et ne modifie pas le dossier officiel. Un point avant décision qui restituerait du carburant est refusé. La revue a aussi mis en évidence un point d’horloge antérieure proposé par la restauration puis refusé par la sauvegarde, même à coût égal. Le correctif conserve la monotonie : en MI06, ce point reste archivé mais `restoreCampaignGame(campaign, {beforeDecision:true})` renvoie `null` dès qu’il précède le checkpoint officiel courant. Le point courant reste reprenable.

Les validateurs contrôlent les identités, cardinalités, positions fixes, santé, phases, progressions, héritages et correspondances entre objets et dossier. Ils rejettent les habitants artificiellement déclarés sauvés, une vanne non accomplie annoncée en service ou un carburant non acquis. Ces contrôles ne constituent pas un système contre la triche.

## Interface et rendu

Les **huit parcours UI ajoutés** vérifient l’import d’une véritable v5, le déblocage et le briefing de MI06, les dix habitants distincts des douze passagers, les instruments de chantier, l’auxiliaire partielle à la pause, le verrouillage repris sous Espace, les deux décisions suivies d’une vraie vanne, l’extraction, les archives, le hangar et la relecture indépendante.

Les contrôles ciblés constatent aussi le débit enregistré avant l’intervalle normal de huit secondes, l’avertissement visible lorsque le stockage refuse cette écriture, la capture immédiate d’une défaite et le redémarrage sans restitution. Une pompe détruite avant raccordement affiche désormais « AUXILIAIRE PERDUE · 2 LOTS CONSERVÉS » : la disponibilité n’est plus déduite du seul budget. Le test obtient cette destruction par des tirs publics.

Le modèle de DOM exécute le script autonome livré et ses gestionnaires. Il neutralise Canvas et simule temps, stockage et événements. Il ne valide ni CSS, ni focus natif, ni son, ni matériel tactile. Le HUD HTML de MI06 est le seul instrument fixe de chantier. Le renderer conserve les objets, repères et étiquettes du monde. Le prompt contextuel reste placé au-dessus de la hauteur effective des jauges HTML, sans doublon Canvas.

Les sept scènes montrent inspection, évacuation, soutien, auxiliaire, dérivation, logements inondés et étai manuel. La pompe et la vanne sont dessinées devant les pattes lorsque leur interaction l’exige, sans changer position ni collision. Les étiquettes distinguent habitants dedans, en route, à l’abri et perdus. Le générateur vérifie l’absence de mutation par le rendu et l’indépendance des snapshots après poursuite. Ces scènes sont des rendus Canvas, pas des captures navigateur.

## Navigateur et publication

La publication applicative **1f243c91ee6a1cc66b6d13b1619a935a61cff431** correspond exactement à l’arbre local figé de la 0.7. Les 254 fichiers distants ont été comparés. Vercel a construit **dpl_E7NtUedX8jykNK9gvAdM5vh97Had**, état READY pour ce même SHA. La [CI 42983892773](https://github.com/darknigthmare/ImperiumMarch/actions/runs/42983892773) a réussi sous Node 22.23.4. Les dix ressources publiques contrôlées répondent HTTP 200 avec le contenu du snapshot. Le [reçu de publication](validation/v07-publication.json) ne remplace pas les observations de Chrome décrites ci-dessous.

Chrome partagé a rechargé le domaine [imperium-march.vercel.app](https://imperium-march.vercel.app/) et affiché VERSION 0.7, six missions et la reprise MI05 du dossier existant. Ce dossier a été exporté par l’interface avant et après migration. La comparaison confirme l’identité des quatre rapports, du checkpoint complet, des ressources et de la flotte. En dehors du numéro de format et des deux ajouts de monde documentés, seul le compteur de captures passe de 18 à 20, en accord avec les captures `beforeunload` et `pagehide` lors du rechargement. Le temps du checkpoint reste exactement 7,698599999999782 secondes. Les [exports avant](validation/v07-browser-migration-before.json) et [après](validation/v07-browser-migration-after.json) sont conservés.

L’import par le sélecteur natif du véritable dossier v5 terminé a ensuite préservé les cinq rapports et débloqué MI06. Le briefing annonce les dix habitants locaux, les douze anciens passagers distincts, la route du quai et les deux lots disponibles. Le lancement et une commande D ont produit une sortie MI06 vivante ; l’export de contrôle conserve un pas et une position de coque de 318,17. Cette séquence a été mise en pause.

Pour contrôler le chantier avancé sans prétendre avoir joué tout le combat dans Chrome, un second dossier a été préparé avec `pilotMI06` et les commandes publiques dans Node, puis importé par la même interface. Il contient le Pèlerin à une vanne travaillée à 35 %, après inspections, évacuation, soutien et choix de dérivation. Ces actions antérieures appartiennent au pilote public, pas à la portion jouée dans Chrome. Le [dossier d’entrée](validation/v07-browser-valve-input.json) conserve cet état et sa provenance est détaillée dans le rapport.

La pause, le rechargement puis le bouton Reprendre MI06 retrouvent les mêmes indications visibles : **01:27**, vanne **35 %**, panneau verrouillé, pression **30 %**, fatigue **3 %**, **10 habitants à l’abri**, **2 techniciens** et auxiliaire active avec **2 lots utilisés**. Cette comparaison porte sur les champs visibles du HUD ; les tests Node vérifient séparément la reprise exacte de l’état entier.

La vanne a ensuite été achevée dans Chrome. L’objectif de remise en service est devenu accompli et le message de dérivation ouverte est apparu. Des commandes D ont conduit le marcheur à l’extraction. Le bilan indique **10 habitants sauvés, zéro perte, zéro logement inhabitable, deux techniciens vivants, panneau verrouillé et deux lots consommés**. Au hangar, la réserve affiche zéro et le compteur cumulé deux lots déjà utilisés. La campagne affiche six rapports. L’[export final du navigateur](validation/v07-browser-completed.json) est valide au format v6, conserve exactement les cinq rapports précédents et contient le sixième reçu, quatre pièces attribuées une fois et trente lots d’atelier au total.

Le HUD a été inspecté dans un viewport de **1363 × 936**. Le prompt finit à 660,53 px et les jauges commencent à 674,53 px, soit **14 px d’espace**. L’instrument de digue reste dans la colonne d’objectifs, sans doublon fixe Canvas. La [capture réelle du chantier](previews/browser-v07-dike.jpg) et celle du [rapport](previews/browser-v07-report.jpg) proviennent des octets JPEG retournés par Chrome. Elles ne sont pas des rendus Skia.

Cette vérification native couvre le Pèlerin et une fin de mission en dérivation depuis un point préparé. Elle ne prétend pas couvrir les six châssis, les deux choix ou l’intégralité de MI06 dans Chrome ; ces matrices sont contrôlées dans Node et dans le DOM modélisé. Les durées d’entrées maintenues ne sont pas une mesure de performances : l’horloge du jeu est simulée. L’audio, le matériel tactile, l’accessibilité et un audit exhaustif de console ne sont pas validés par ce parcours. Le Chromium local précédemment bloqué par `socket() Operation not permitted` n’a pas été utilisé comme preuve.

Le [rapport navigateur complet](validation/v07-browser.json) conserve observations, géométrie, empreintes, dossier final et limites. La publication suivante ajoute ces preuves et la documentation ; aucun changement applicatif n’est requis par ce contrôle.

## Limites de livraison

La tranche contient six missions officielles au stade prototype, trois opérations indépendantes et six châssis. Les **26 autres missions principales**, les seize contrats, les capacités spécialisées finales, les composants ennemis, les doctrines d’escouade et les assets, voix et animations définitifs restent à produire. MI07 et MI08 disposent de contrats de conception, sans être annoncées jouables.

Les tests automatisés ne démontrent pas la qualité de la difficulté pour un joueur, les performances sur appareils cibles, la qualité audio ou la conformité d’accessibilité. Les fiches de conception et leurs statuts restent distincts des preuves de production.
