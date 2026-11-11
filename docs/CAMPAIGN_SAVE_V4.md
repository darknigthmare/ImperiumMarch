# ORDRE DE CENDRE — Dossiers de campagne v4

**Version de jeu 0.5.0 · 11 novembre 2026**

Le format v4 prolonge la même campagne locale jusqu’à MI04. Il conserve les trois premiers rapports et les conséquences de Vesper, ajoute le dossier industriel et persiste l’état du radiateur. La clé principale reste `imperium.campaign.v1`, avec `imperium.campaign.v1.backup` pour la copie précédente ; le suffixe historique de la clé ne décrit pas la version du contenu.

## Progression et résultats officiels

MI01 ouvre MI02, MI02 ouvre MI03, puis MI03 ouvre MI04. Le quatrième rapport achève l’arc jouable de Vesper. Il ne prétend pas achever la campagne conçue de trente-deux missions. `nextCampaignMissionId()` renvoie `null` après ces quatre rapports, tant qu’aucune mission suivante n’est produite.

Une sortie officielle possède un checkpoint courant et, dès la première décision atteinte, un checkpoint antérieur au choix. Un redémarrage explicite réinitialise cette sortie. Une relecture d’une mission déjà terminée reste une simulation indépendante : elle ne remplace aucun premier rapport, ne change ni l’état de la flotte ni les conséquences du monde, et n’accorde pas de lots.

L’atelier commence avec six lots. Chaque première réussite accorde quatre lots, une seule fois. Les quatre missions permettent donc vingt-deux lots avant dépenses. Une défaite conserve le dernier checkpoint vivant et n’accorde aucune dotation. L’entretien et la réparation de la conduite sont indisponibles pendant une sortie officielle.

## Héritage réellement consommé par MI04

| Fait officiel antérieur | Effet au départ ou pendant MI04 | Ce que le résultat conserve |
| --- | --- | --- |
| Conduite intacte, ou réparée à l’atelier après MI01 | La pompe dispose déjà de liquide. | Les vannes peuvent être actionnées directement. |
| Conduite rompue et non réparée | Le pilote doit brancher une pompe portative pendant cinq secondes à portée. | Le refroidissement local fonctionne ; la conduite des maisons reste rompue dans le monde. |
| Au moins un ouvrier secouru dans MI02 | Les indications des ouvriers réduisent chaque refroidissement à quatre secondes. | `coolingAssistance: true`. |
| Aucun ouvrier secouru dans MI02 | Chaque turbine exige la procédure manuelle de sept secondes. | `coolingAssistance: false` ; aucun ouvrier n’est créé rétroactivement. |
| Dispensaire vérifié, encore debout et relié après MI03 | Une permanence peut être appelée au terminal pendant trois secondes. | `witnessContacted` devient vrai seulement après cet échange. |
| Canal coupé, dispensaire détruit ou non vérifié dans MI03 | La liaison n’est pas accessible. | L’absence de contact ne bloque pas la mission et n’octroie aucun témoignage. |

Le checkpoint de MI04 conserve ces faits dans `campaign.context`. Le validateur les compare aux dossiers officiels ; une importation ne peut pas changer seulement le contexte de la mission pour se donner une aide absente des rapports précédents.

Le terme `coolantRestored` décrit le circuit utilisé dans la station. Il ne répare pas implicitement les services civils. L’action d’atelier `repairCampaignPipe()` reste une intervention distincte à deux lots et laisse l’incident dans le premier rapport.

## Journal, première anomalie et remise du rapport

La pièce PT01 est la copie du journal du poste de maintenance de MI04. Elle indique un remplacement antérieur au rejet industriel et une référence d’ordre militaire. Ce constat constitue une anomalie matérielle. Il ne démontre pas à lui seul un motif, une chaîne complète de commandement ou l’existence du programme général.

Deux turbines doivent avoir été refroidies avant le relevé. Si le poste existe encore au terme du scan, le journal est copié. Sa provenance est conservée par l’association de `missionId: "MI04"`, `logRecovered: true` et `evidenceSource: "PT01"`. `technicalEvidence` vaut alors vrai et la statistique de preuve vaut un. Une destruction ultérieure du bâtiment ne détruit pas la copie déjà emportée.

Si le poste est détruit avant la fin du relevé, le pilote constate les ruines. La mission et le choix restent accessibles, mais `logRecovered` et `technicalEvidence` restent faux, `evidenceSource` vaut `none` et `alternativeSourceNeeded` devient vrai. La recherche d’une autre source appartient aux missions ultérieures conçues ; cette version ne la simule pas.

Le choix règle la remise administrative : joindre le constat au rapport signé ou remettre le dossier sous scellés. Les deux choix conservent les faits observés et la copie éventuelle. Le signalement signé augmente l’attention du commandement de deux points. Tess gagne trois points de confiance si le journal a été copié ; Sami gagne deux points pour le signalement et un pour un échange effectif avec le dispensaire. Ces valeurs sont un réglage du prototype, pas une évaluation morale générale.

Le premier rapport MI04 contient les champs suivants, en plus des informations communes de mission, de châssis, de durée, de coque, de choix et de dotation.

| Champ | Valeur et sens |
| --- | --- |
| `coolantRestored` | Circuit de la station disponible à l’extraction. |
| `coolingAssistance` | Au moins un ouvrier du train a pu fournir ses indications. |
| `turbinesCooled` | Deux pour une sortie validée. |
| `maintenanceInspected` | Le poste ou ses ruines ont été relevés. |
| `logRecovered` | La copie du journal a réellement été obtenue. |
| `technicalEvidence` | Même état que le journal dans cette première implémentation. |
| `evidenceSource` | `PT01` si une copie existe, sinon `none`. |
| `alternativeSourceNeeded` | Une sortie achevée sans journal exige une autre source. |
| `witnessContacted` | La permanence a effectivement été appelée dans cette sortie. |
| `reportFiled` | Le constat est joint au rapport signé. |
| `maintenanceIntact` | Le poste est encore debout à l’extraction, sans promettre une absence de dégâts. |

`world.vesper.industrial` reprend ces champs. Le validateur exige qu’ils correspondent au premier rapport. Les rapports MI01–MI03 ne sont pas enrichis après coup avec des observations de MI04.

## Radiateur, réparation de terrain et atelier

Chaque état de joueur possède `player.radiator` :

```json
{
  "health": 100,
  "maxHealth": 100,
  "repairKits": 2,
  "maxRepairKits": 2,
  "repairProgress": 0,
  "repairing": false
}
```

Les deux kits sont une dotation de sortie. Une reprise conserve exactement le stock et la progression en cours ; un nouveau départ renouvelle la dotation. Ils ne constituent pas encore un inventaire intermissions acheté ou transporté entre planètes.

L’intégrité du radiateur est conservée au retour dans `fleet[walkerId].radiator`. Une nouvelle sortie officielle reprend cette intégrité, ainsi que la coque et les appuis. Une relecture utilise un marcheur d’entraînement neuf et ne répare pas le marcheur officiel.

La commande publique `repair` démarre une réparation de quatre secondes, à l’arrêt et avec tous les appuis posés. Une réussite rend soixante points, dans la limite de cent, puis consomme un kit. La progression est remise à zéro à la réussite ou à l’interruption. Le mouvement, l’armement ou un impact interrompent le travail sans consommer le kit en cours. Les caisses de terrain ne réparent pas gratuitement ce composant.

L’atelier remet ensemble coque, appuis et radiateur en état. Le coût utilise les fractions de dégâts :

```text
min(6, ceil(4 × dégâts de coque
          + 2 × dégâts moyens des appuis
          + 2 × dégâts du radiateur))
```

Chaque fraction vaut de zéro à un. Un radiateur endommagé exige donc au moins un lot même si le reste du marcheur est intact. Une machine déjà en état n’engendre aucune dépense. Le plafond de six lots reste celui de l’intervention complète du prototype.

## Migration des versions historiques

La lecture passe par `parseCampaign()`. Elle ne modifie ni la chaîne fournie ni le stockage. Elle ajoute les champs successifs connus et valide le résultat courant. L’écriture explicite passe par `writeCampaign()` ; une ancienne version valide est conservée en copie avant le remplacement du fichier principal.

| Format lu | Ajouts documentés | Éléments conservés |
| --- | --- | --- |
| v1, jeu 0.2 | Dossier ferroviaire, puis ajouts v2→v3 et v3→v4. | Premier rapport, conduite, lots, coque, appuis, choix, progression et événements. |
| v2, jeu 0.3 | Dossier des communications ; trois nouveaux châssis ; huit magasins de réserve dans chaque checkpoint ; puis ajouts v3→v4. | Train, ouvriers, registre, rapports, magasin chargé, roquettes, recharge en cours et générateur aléatoire. |
| v3, jeu 0.4 | Dossier industriel vide ; radiateur neuf dans chaque châssis et checkpoint ; deux kits par sortie historique en cours. | Les trois rapports, le réseau civil, les pertes, l’accès possible au dispensaire, les munitions et chaque autre champ historique. |

Les trois ajouts de flotte de la migration v2→v3 sont WK02, WK06 et WK10. Le format v4 n’ajoute pas de châssis. Il n’attribue ni preuve technique ni rencontre à une ancienne partie.

Les anciens schémas ne peuvent pas contenir des champs de version future sous une ancienne étiquette. Un dossier v3 contenant déjà un radiateur, des résultats MI04 ou une mission MI04 active est rejeté ; il n’est pas transformé en fichier courant en effaçant discrètement l’incohérence.

## Fixtures historiques et preuves exécutables

Les fixtures sont générées par leurs propres versions du jeu, avec les commandes publiques. Elles ne sont pas reconstruites en retirant des champs d’une sauvegarde récente.

| Fixture | Révision source | État conservé |
| --- | --- | --- |
| `tests/fixtures/campaign-v1-mi01.json` | Version 0.2, provenance conservée dans le fichier. | MI01 en cours et premier rapport. |
| `tests/fixtures/campaign-v2-mi02.json` | `72027333c6ea5dc914d189fec6d2ff864b2f07c1` | MI02 avec WK05 avant décision, puis sortie terminée. |
| `tests/fixtures/campaign-v3-mi03.json` | `c81a360c262e63ba01cc6037d0874740d67e3ef6` | MI03 avec WK06 avant décision, puis sortie terminée avec deux relais civils et canal du dispensaire disponible. |

La fixture v3 a été générée depuis une extraction isolée de la révision 0.4, en migrant le véritable dossier v2 terminé puis en exécutant `beginCampaignMission`, `pilotMI03`, `checkpointCampaign`, `restoreCampaignGame` et `finishCampaignMission`. Sa provenance contient les empreintes SHA-256 du module de campagne, du module de simulation et du pilote historique. Le dossier en cours s’arrête à environ 69,63 secondes de simulation et le rapport à environ 76,33 secondes. Ces durées proviennent du pilote de validation, sans prétendre mesurer une partie humaine.

Les tests `campaign-v4.test.mjs` comparent la totalité de ces anciennes structures après retrait des seuls ajouts documentés. Ils vérifient aussi la reprise d’une réparation à mi-parcours, la dotation de kits, le coût d’atelier, les douze parcours MI04 des six châssis et des deux décisions, les checkpoints de choix, les relectures, les imports contradictoires, une vraie défaite et les deux ordres de destruction du poste. Une chaîne pilotée MI02→MI03→MI04 vérifie que huit pertes ferroviaires donnent réellement la procédure de sept secondes et que la pompe portative ne répare pas la conduite des maisons.

Ces contrôles sont des tests Node de simulation et de sérialisation. Ils ne constituent pas un essai humain ni une validation dans un navigateur.

## Protection du stockage et limites

Un dossier d’un format étranger, d’une version future inconnue ou de plus de deux millions de caractères est protégé contre l’écrasement automatique. Une copie plus ancienne lisible peut être proposée à la reprise, mais elle n’autorise pas à effacer ce fichier principal. Un import compatible explicite ou une nouvelle campagne explicite peut remplacer le dossier protégé.

Si le stockage est indisponible, plein ou refuse une écriture, l’application reçoit un résultat d’échec. Une écriture n’est déclarée réussie qu’après relecture de la chaîne enregistrée. Les opérations n’accèdent pas au réseau et ne synchronisent pas la campagne avec un compte.

La validation contrôle les schémas, bornes, identités, définitions fixes et principales cohérences entre simulation, héritage, rapports et monde. Elle n’est pas une signature cryptographique ni un système contre la modification volontaire de tous les faits cohérents d’un fichier local. La sauvegarde reste exportable et inspectable par le joueur.
