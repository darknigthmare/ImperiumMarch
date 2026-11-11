# ORDRE DE CENDRE — Tranche de production 0.7

**Version 0.7.0 · 11 novembre 2026**

La 0.7 rend jouable **MI06, Les maisons sous la ligne**. Le marcheur doit soutenir un panneau pendant le travail de techniciens, protéger dix habitants et réaliser un circuit hydraulique après l’avoir choisi. La réserve facultative de MI05 acquiert un usage, avec une dépense persistante dès le branchement.

Le [contrat MI06](CAMPAIGN_MISSION_06.md) fixe les gestes et limites. Le [contrat de Nacre 0.7](NACRE_CONSEQUENCES_V07.md) précise les populations, les héritages et les suites encore conçues.

## Portée de cette tranche

| Domaine | Version au stade prototype | Travail ouvert |
| --- | --- | --- |
| Campagne | MI01–MI06, dans l’ordre; MI06 reste accessible sans réserve ni sauvetage réussi à MI05. | MI07–MI32, seize contrats et les quatre familles de fins. |
| Appuis | Soutien du panneau par position, immobilité, ancrage et pieds réellement posés. | Génie libre, manipulation d’objets et résistance générale des quais. |
| Chantier | Deux techniciens, déplacements, attente face aux menaces, abris qui interceptent les tirs, verrou et étai manuel. | Commande d’escouade complète, animation détaillée, voix et mise en scène finale. |
| Habitants | Dix personnes distinctes marchant vers l’abri; deux maisons avec état matériel propre. | Noms, vie des familles, accueil incarné et réinstallation durable. |
| Circuit | Réglage impérial ou dérivation, puis manœuvre réelle de vanne et conséquences sur l’eau. | Réseau hydraulique global et fluides volumétriques. |
| Carburant | Deux lots consommés au branchement auxiliaire, coût conservé après défaite ou recommencement. | Achats, négoce et approvisionnement général. |
| Dossier | Format v6, sixième rapport, état de digue et registre cumulé de dépense. | Synchronisation de compte en ligne et formats futurs inconnus. |
| Narration | Mara à la radio après constat, sans personnage physique vulnérable ni recrutement. | Scènes finales, relations complètes et réapparitions de MI07–MI08. |

La progression conserve les six châssis, les trois opérations indépendantes, les munitions finies et le radiateur réparable. Elle ne modifie pas les nombres historiques du chenal : douze passagers et quatre membres de Rive-Courte restent dans leur propre dossier.

## Les décisions qui structurent MI06

**Le secours exige une arrivée.** Appeler des personnes ne les met pas à l’abri. Le trajet expose encore les habitants. Une personne arrivée sort des collisions, tandis que sa maison peut rester vulnérable.

**Tenir et verrouiller sont différents.** Les appuis du marcheur créent un soutien temporaire. Le travail du technicien ou l’étai manuel sécurise le passage. Un étai de secours sur un panneau détruit ne le répare pas.

**La décision précède des actions.** Le choix de circuit ne termine pas l’objectif. La vanne doit être manœuvrée, l’eau évolue et le bilan des habitants doit être établi avant extraction.

**Le coût appartient à l’action accomplie.** Le carburant est débité au branchement, sans attendre un rapport victorieux. Un recommencement officiel conserve cette dépense. Les relectures restent isolées du dossier officiel.

## 705 fiches et continuité des identifiants

Le référentiel compte **705 fiches**, soit **62 ajouts**, dans les vingt domaines existants. Le classeur conserve vingt et un onglets avec la synthèse. Les **643 identifiants de la 0.6** sont préservés.

| Domaine enrichi | Ajouts | Usage |
| --- | ---: | --- |
| Vision | 2 | Soutien maintenu et coût persistant après échec. |
| Systèmes | 10 | Techniciens, habitants, secours, circuit, pompe, repli, dépense et bilan. |
| Narration | 8 | Arrivée au chantier, populations, Mara, travail, logement perdu et suite sanitaire. |
| Assets | 6 | Rendu procédural et tâches de finition pour façades, techniciens, son, Mara et archives. |
| Production | 8 | Dossier v6, interface, validations, finition et consommation future des héritages. |
| QA | 20 | Parcours, dommages, reprise, coûts, migrations, UI, classeur et essai humain. |
| Prototype | 8 | Portée présente et limites de la nouvelle mission. |

Les lignes existantes de MI06, Mara, du soutien de panneau et de la consommation locale sont consolidées. MI07 et MI08 gardent leur statut Conçu. Les assets finaux, les capacités complètes de MD02 et VE08 et la finition de MI01 restent des travaux distincts.

## Vérifier le jeu sans confondre les preuves

Les scénarios QA96–QA114 indiquent les contrôles exécutés et leur portée. La [suite Node](validation/v07-node-tests.txt) termine avec **176 tests réussis, aucun échec et aucun test ignoré**, dont vingt tests MI06 et onze tests du format v6. QA115 réserve un essai humain sans guidage extérieur et reste ouverte.

Les parcours complets utilisent les commandes publiques : six châssis avec les deux circuits, et six parcours de repli sans carburant ni techniciens. Les pertes ciblées de certains contrôles utilisent des projectiles de calibration résolus par les collisions de production; santé, décès et résultat ne sont pas attribués directement. Ces stimuli unitaires sont déclarés et ne sont pas présentés comme des actions humaines.

Les [34 parcours d’interface](validation/v07-ui-runtime.txt), dont huit consacrés à MI06, exécutent les gestionnaires dans un **DOM modélisé**. Ils vérifient notamment les pauses, les deux circuits, les archives, la relecture, la dépense avant l’intervalle périodique, l’échec d’écriture signalé et la capture immédiate d’une défaite. Ils ne testent pas le rendu CSS ou les comportements natifs de Chrome.

Les sept vues du [manifeste MI06](previews/mi06-render-manifest.json) proviennent du rendu Canvas de production et d’états atteints par commandes publiques, copiés profondément au moment de la capture. Elles montrent inspection, trajet des habitants, auxiliaire, soutien, vanne, inondation et étai. Elles ne sont pas des captures de navigateur et ne comprennent pas le HUD HTML.

Les preuves et leurs décomptes finaux sont regroupés dans [QA_V07.md](QA_V07.md) et les journaux `docs/validation/v07-*`. Les contrôles de publication doivent identifier le commit distant et le déploiement réellement servis, selon [DEPLOYMENT.md](DEPLOYMENT.md).

## Classeur et provenance historique

Le générateur existant reconstruit le véritable fichier Excel depuis `data/bible.json`. Les cellules source, les formules de synthèse, les tables, les validations, les règles conditionnelles et les volets sont contrôlés dans l’export. Les vues des lignes modifiées servent à la relecture visuelle. Ces contrôles ne constituent pas une exécution native dans Excel ou LibreOffice.

Le [rapport d’export final](validation/workbook-v0.7-export.json) réconcilie 705 fiches, 4 811 cellules source et les 643 IDs historiques. Il confirme 126 formules calculées sans erreur, vingt tables et validations, vingt feuilles de données avec volets et 80 règles conditionnelles. La [revue de 17 vues](validation/workbook-v0.7-visual-review.json) couvre onze onglets. La synthèse finale répartit les fiches en 292 Conçu, 209 Prototype, 125 À produire et 79 Vérifié; ce décompte ne mesure pas l’achèvement du jeu.

La baseline authentique v0.6 provient du commit local `c598badad94f81aaaf16f2b13d9e7c11b8508995`, distinct de l’histoire du dépôt public. `tests/fixtures/bible-v06-ids.json` conserve ses 643 IDs, sa révision complète, le hash Git du blob et son empreinte SHA-256. Le vérificateur peut utiliser cette provenance dans une archive sans historique local; les baselines v0.5 et v0.4 restent disponibles pour leurs révisions exactes.

Une révision absente non reconnue reste une erreur. L’existence de la fixture n’autorise pas à prétendre que tout l’historique local a été publié. Les preuves d’export, de baselines et de revue visuelle portent le préfixe `workbook-v0.7`.

Le [contrôle des baselines](validation/workbook-v0.7-baseline-check.json) confirme l’empreinte et le contenu de la fixture 0.6 contre son blob historique. Les trois fallbacks sont aussi exécutés sans Git sur le classeur final; une révision absente non reconnue est effectivement rejetée.

## Suite de fabrication

MI07 doit exploiter un état réel de la digue : verrou, étai, fatigue et intervenants survivants offrent des différences disponibles. L’ambulance doit introduire ses propres personnes, s’arrêter réellement, être examinée puis rejoindre un accueil. Le dossier de la digue ne suffit pas à créer ses patients.

MI08 doit conserver l’origine des groupes, les places des bateaux et la destination des départs. Deux portes avec des fonctions différentes doivent avoir des effets distincts. Leur contrôle et les scènes de départ restent à produire.

Le jalon de qualité demeure MI01 entièrement finalisée, avec animation, environnement, audio, performance mesurée et essai humain. Ajouter un dispositif de mission ne clôt pas cette exigence de finition ni n’établit un budget ou un calendrier commercial.
