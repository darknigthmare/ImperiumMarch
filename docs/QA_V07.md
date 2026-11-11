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
| Navigateur réel 0.7 | Contrôle à effectuer après publication ; les preuves 0.6 ne valent pas validation de MI06 | État suivi ci-dessous |
| Publication 0.7 | SHA distant, Vercel et CI à confirmer après le gel des livrables | [Déploiement](DEPLOYMENT.md) |

Les commandes locales utilisent Node.js 24.22.1. Le projet, Vercel et la CI ciblent Node.js 22.x ; le résultat distant doit être observé séparément. Les contrôles et leurs limites de la [0.6](QA_V06.md) restent conservés.

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

La 0.7 attend ici son contrôle de production. Les contrôles Chrome de la 0.6 concernaient l’import v4, MI05, la marche, la pause, le rechargement et la reprise. Ils restent des preuves historiques limitées à cette version. Le Chromium local était bloqué avant navigation par `socket() Operation not permitted` ; le navigateur partagé autorisé fournit un environnement distinct.

Le contrôle 0.7 doit identifier le code publié, les actions réellement exécutées, les valeurs visibles avant/après reprise et la disposition du HUD. Une réponse HTTP 200, un build Vercel READY ou une image Canvas ne démontrent pas à eux seuls le parcours de MI06.

## Limites de livraison

La tranche contient six missions officielles au stade prototype, trois opérations indépendantes et six châssis. Les **26 autres missions principales**, les seize contrats, les capacités spécialisées finales, les composants ennemis, les doctrines d’escouade et les assets, voix et animations définitifs restent à produire. MI07 et MI08 disposent de contrats de conception, sans être annoncées jouables.

Les tests automatisés ne démontrent pas la qualité de la difficulté pour un joueur, les performances sur appareils cibles, la qualité audio ou la conformité d’accessibilité. Les fiches de conception et leurs statuts restent distincts des preuves de production.
