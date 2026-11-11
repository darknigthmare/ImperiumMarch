# ORDRE DE CENDRE — Tranche de production 0.8

**Version 0.8.0 · 11 novembre 2026**

La 0.8 rend jouable **MI07, Une ambulance sans escorte**. L’Ambulance Quai transporte quatre patients, une conductrice et un soignant sur la chaussée des Salines. La mission distingue l’ordre reçu, l’arrêt, l’accord à l’examen, les constats matériels, la récupération du boîtier et le transfert réel vers une destination.

Le [contrat MI07](CAMPAIGN_MISSION_07.md) décrit ces actions. Le [contrat de Nacre 0.8](NACRE_CONSEQUENCES_V08.md) fixe la continuité entre les trois missions jouables de Nacre et prépare MI08, qui reste conçue.

## Portée de cette tranche

| Domaine | Version au stade prototype | Travail ouvert |
| --- | --- | --- |
| Campagne | MI01–MI07 dans l’ordre, avec dossier et reprise. | Les 25 missions MI08–MI32, seize contrats et quatre familles de fins. |
| Transport | Roulage de VE02, arrêt protégé et arrivée à destination. | Navigation amphibie, art final et animation sanitaire détaillée. |
| Examen | Accord, caisse sanitaire, boîtier, démontage et constats de ruines. | Provenance complète de pose et attribution à un commanditaire. |
| Héritage | Verrou, étai et fatigue de MI06 déterminent l’accès; un technicien aide après contact. | Résistance générale des quais et préparation libre de routes. |
| Personnes | Quatre patients et deux membres du personnel propres à MI07. | Identités finales, soins détaillés et scènes de vie après accueil. |
| Destination | Poste médical impérial ou accueil civil, avec état réel du véhicule en sortie. | Embarquement vers le refuge, portes d’Aval et départ de Nacre. |
| Dossier | Format v7, septième rapport, migration historique et relecture isolée. | Synchronisation de compte et formats futurs inconnus. |
| Ressources | Stock et dépense de MI06 conservés; MI07 ne crée aucun carburant. | Commerce, négoce et approvisionnement général. |

Six châssis et les trois opérations indépendantes restent disponibles. Le nombre de sorties au stade prototype ne mesure pas leur niveau de finition. Le jalon de qualité reste MI01 finalisée de bout en bout.

## Les décisions de conception appliquées

**L’accord porte sur une action précise.** Autoriser l’examen ne signifie pas accepter une publication de données de soins ou un recrutement. Un consentement à témoigner peut être demandé par un autre échange facultatif; il conserve son auteur et sa disponibilité dépend de la survie de cette personne.

**La source et son auteur restent distincts.** Le boîtier peut être observé et récupéré. Son origine technique et son journal local ne prouvent pas qui a ordonné sa pose. `provenanceVerified` reste faux; aucun PT ou PO n’est attribué par cette mission.

**L’ancienne infrastructure change le trajet.** La route principale exige un verrou achevé, aucun étai et une fatigue inférieure à 65. La route secondaire conserve une issue. La survie d’un technicien ne vaut pas échange réalisé; sa contribution doit être demandée.

**Le transfert continue après le choix.** Rampe et accueil doivent être préparés, puis le véhicule doit atteindre son quai. Les chariots sont ensuite déployés et les six personnes rejoignent individuellement la porte. Sans conductrice, le remorquage garde une voie; sans soignant, la dernière partie est plus lente. Une décision n’annule pas les dégâts et ne crédite pas une arrivée anticipée.

## 769 fiches et 705 identifiants préservés

Le référentiel passe de 705 à **769 fiches**, avec **64 ajouts** dans les vingt domaines existants. Le classeur conserve ses vingt et un onglets, synthèse comprise.

| Domaine enrichi | Ajouts | Portée |
| --- | ---: | --- |
| Vision | 2 | Consentement borné et héritage matériel d’une route. |
| Systèmes | 10 | Arrêt, accord, caisse, balise, rampe, aide, transfert, population, constats et disposition. |
| Narration | 8 | Ordre reçu, six personnes nouvelles, source locale, interlocuteur et suite à Aval. |
| Assets | 6 | Kit procédural et travaux de finition sanitaire, balise, interface et audio. |
| Production | 8 | Dossier v7, interface, validation, finition, essai humain et préparation de MI08. |
| QA | 22 | Parcours, sources, pertes, héritages, reprise, migration, UI, classeur, rendu et essai humain. |
| Prototype | 8 | Comportements livrés et limites propres à MI07. |

Les lignes existantes MI07, VE02, SY61, NA46, NA55 et PR72 sont consolidées. VE02 est limité au roulage routier actuellement simulé. AS49 reste un travail de finition; MI08, ses portes et ses bateaux restent conçus.

## Validation et portée des preuves

Les QA116–QA136 sont vérifiées dans la portée de leurs preuves finales. La [suite Node](validation/v08-node-tests.txt) compte **212 tests réussis, sans échec ni test ignoré**, dont 22 consacrés à MI07 et 14 au dossier v7. Les [45 parcours d’interface](validation/v08-ui-runtime.txt), dont 11 propres à MI07, exécutent les vrais gestionnaires dans un DOM modélisé. Ils couvrent aussi une interaction tactile immédiatement suivie d’une pause avant la frame suivante; ils ne certifient pas le rendu CSS, le focus natif ou un périphérique réel.

L’[audit indépendant de campagne](validation/v08-campaign-audit.json) termine **18 variantes**, avec **3 054 passages de checkpoints par JSON** et **1 878 restaurations exactement comparées**. Il emploie le Pèlerin WK09, la difficulté normale, l’assistance et la graine 1847, sur les deux héritages authentiques de MI06. Les commandes publiques conduisent les parcours; les empreintes des sources copiées restent stables. Ce contrôle complète les matrices de châssis de la suite de simulation.

Les **neuf vues Canvas** du [manifeste MI07](previews/mi07-render-manifest.json) ont été produites en 1 600 × 900 avec le renderer de production puis relues visuellement. Leurs états sont atteints par commandes publiques depuis la fixture historique et copiés profondément avant rendu. Elles contrôlent les scènes de la chaussée, pas le HUD HTML, les dialogues natifs, le son, les performances ou une partie humaine. Le détail et les limites de chaque famille de preuves figurent dans [QA_V08.md](QA_V08.md).

Les parcours doivent utiliser les commandes publiques. Lorsqu’un scénario négatif emploie un projectile de calibration, sa portée doit être déclarée : la collision et les dégâts de production sont alors contrôlés, sans présenter ce stimulus isolé comme une partie humaine. Une victoire ou une perte attribuée directement ne constitue pas un parcours valide.

QA137 reste **À produire** pour un essai humain sans guidage extérieur sur l’arrêt, l’accord, les constats, la récupération, la route et l’arrivée. Le nombre de tests automatiques ne ferme pas cette exigence. QA115, consacrée à la digue, reste également ouverte. Le contrôle Chrome de la version publiée est distinct et n’est pas attribué aux preuves locales de ce document.

Les preuves finales de cette tranche portent le préfixe `v08-*`. Une publication doit identifier le commit réellement servi et le déploiement observé selon [DEPLOYMENT.md](DEPLOYMENT.md).

## Classeur et provenance

Le classeur est reconstruit depuis `data/bible.json` avec le générateur existant. Le contrôle de l’export compare toutes les cellules source, les formules calculées, les tables, les validations, les règles conditionnelles et les volets. Les vues des lignes modifiées sont relues. Ce contrôle ne constitue pas une exécution native dans Excel ou LibreOffice.

Le fichier final réconcilie **769 fiches, 5 225 cellules source et les 705 IDs historiques**, avec 64 ajouts. Ses 21 onglets comportent 20 tables, 126 formules calculées sans erreur, 20 plages de validation, 80 règles conditionnelles et 20 feuilles de données aux volets figés. Le recalcul après modification temporaire d’un statut et la restauration ont réussi. Les 20 vues relues portent sur 12 onglets. Les statuts totalisent **292 Conçu, 244 Prototype, 133 À produire et 100 Vérifié**. Les résultats et empreintes sont conservés dans les rapports [export](validation/workbook-v0.8-export.json), [baselines](validation/workbook-v0.8-baseline-check.json) et [relecture](validation/workbook-v0.8-visual-review.json).

La baseline v0.7 provient du commit local authentique `1e7eadbf8bb97b37ad5753d8f2821d5085200e63`. La publication précédente possède une histoire différente, avec le commit public `bc830013455bb8f71e1eaf0316173ac0e91746f8`. La fixture `tests/fixtures/bible-v07-ids.json` conserve les 705 IDs par feuille, la révision complète, l’identifiant Git du blob et son SHA-256.

Le vérificateur utilise cette fixture uniquement lorsque la révision historique n’est pas disponible dans Git et correspond à sa provenance enregistrée. Les baselines 0.6, 0.5 et 0.4 restent prises en charge. Une révision absente non reconnue reste une erreur. La fixture ne reconstitue pas tout l’historique local et n’affirme pas sa publication.

## Suite de fabrication

MI08 doit partir des états réels du quartier et de l’accueil sanitaire. Une ambulance saisie ne réapparaît pas au quai civil sans nouvelle scène. Un patient perdu ne redevient pas une place à remplir. Un appel à Mara ne crée pas sa présence physique.

Les portes d’Aval doivent gérer séparément amenée d’eau et passage des bateaux. Les personnes ont une origine, une place, un état d’embarquement et une destination. Un départ reste distinct d’une arrivée au refuge. Les issues de perte ou de blocage gardent un accueil local et un constat possibles, avec leurs propres limites.

La finition du véhicule, des gestes de soin, des voix et de l’environnement demeure ouverte. Les capacités amphibies de VE02, la résistance générale des quais, l’économie de carburant et la campagne complète ne sont pas déclarées livrées par cette seule tranche.
