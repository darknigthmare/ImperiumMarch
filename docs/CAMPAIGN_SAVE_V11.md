# Dossier de campagne v11 — la voix de Thyr

## Évolution du format

La version de jeu 0.12 utilise le format `ordre-de-cendre.campaign`, version **11**. La clé de stockage reste `imperium.campaign.v1` et la copie de sauvegarde `imperium.campaign.v1.backup`.

La migration v10 → v11 ajoute uniquement `world.thyr.voice`, initialement vide, et le numéro de version. Elle conserve exactement les dix rapports existants, les ressources, la flotte, les relations de Tess et Sami, le registre d’entretien, la révision, les checkpoints et l’ancien champ `stage`. Un ancien `stage: complete` ne ferme pas la campagne : la progression recherche le premier rapport manquant et propose MI11 après MI10.

Les migrations v1–v9 gardent leurs ajouts documentés, puis appliquent ce même ajout v11. Aucun checkpoint de MI01–MI10 ne reçoit un état `voice`. Un dossier ancien qui contient déjà une scène, un rapport ou un résultat MI11 est refusé.

## Source historique v10

La fixture [campaign-v10-mi10.json](../tests/fixtures/campaign-v10-mi10.json) reprend deux dossiers du snapshot public 0.11 :

| Variante | Source conservée | Provenance |
| --- | --- | --- |
| `live` | [mi10-sampling-checkpoint.json](previews/mi10-sampling-checkpoint.json) | Mission MI10 en cours pendant le prélèvement, avec neuf rapports antérieurs. |
| `completed` | [mi10-completed-campaign.json](previews/mi10-completed-campaign.json) | MI10 terminée par les commandes publiques de simulation, avec dix rapports. |

Ces deux fichiers sont des **exports préparés par la simulation**. Aucun export natif MI10 n’était disponible : la réception 0.11 avait rencontré le quota Vercel et le refus des URL `file://` du navigateur de contrôle. Leur provenance ne doit pas être renommée en réception native.

Le commit public de référence est `c7f3273a60824ff4e968ea36ab956c6a41710df0`, arbre `7942d22cfdb0b73e42ae0a427a3afbc986f29160`, correspondant au commit local `f75e674313120094b9540603fbfa571d5df2f1d2`. Les **1 268 blobs** du snapshot ont été comparés à cet arbre avant copie. Aucun module de gameplay n’a été exécuté pour construire la nouvelle fixture. Les neuf fixtures historiques antérieures restent inchangées. L’[attestation v10](validation/v012-historic-v10.json) conserve les tailles, empreintes, sources et limites.

## Nouveau dossier de MI11

`world.thyr.voice` est issu du premier rapport officiel de MI11. Il conserve les relevés, la localisation, la reconnaissance du passage, l’état des trois nids, les inspections et copies, le sort de Leth et de l’échange, la conduite de l’émetteur, les menaces et le rapport. Le registre individuel permet de confronter les agrégats aux objets qui les ont produits.

Les faits de rencontre, d’accord privé, d’enregistrement et de disponibilité actuelle ne sont pas interchangeables. La présence d’un enregistrement ne ressuscite pas Leth. Un accord ne crée pas une copie, et une copie ne crée pas l’accord. TE01 exige toutes les pièces prévues au [contrat de MI11](CAMPAIGN_MISSION_11.md).

Le choix `obey` ouvre la capture ; `defy` ouvre la restauration. Une opération doit encore être accomplie sur place. Les dates, durées, conditions de portée et résultats sont vérifiés séparément du choix. Le consentement à une diffusion publique et le recrutement restent absents de cette tranche.

## Protection de la sortie officielle

Un checkpoint officiel doit poursuivre la même mission, le même châssis, la même graine et la même difficulté. Son contexte hérité ne change pas. Son horloge ne recule pas ; les copies acquises, dates d’actes et pertes irréversibles ne disparaissent pas. Les progressions interrompues suivent les règles du moteur, sans transformer une pause en temps de travail.

Le début d’une copie exige déjà les trois relevés ; celui d’une demande d’accord exige la rencontre et les deux inspections. Le rapport ne peut même pas commencer avant la résolution matérielle du site. Entre deux checkpoints, un nouveau travail ne peut être antidaté et sa progression ne peut dépasser le temps simulé écoulé. Un véritable arrêt suivi d’un recommencement demeure possible.

La sauvegarde distingue une partie vivante et une perte terminale du marcheur. Une sortie perdue peut être conservée au dossier et recommencée explicitement ; elle ne se restaure pas en partie vivante. Un ancien point de décision n’est pas proposé comme reprise si la sortie officielle a déjà avancé.

Le premier rapport ajoute **quatre lots d’atelier une seule fois**. Les relectures sont isolées : elles ne remplacent aucun rapport, ne modifient pas le monde officiel et ne donnent aucune seconde dotation. MI11 ne crée ni ne consomme de carburant de Nacre.

## Lecture, export et récupération

La lecture d’un ancien dossier n’écrit pas dans le stockage. Au premier enregistrement migré, le texte original est conservé en copie de sauvegarde. Un dossier d’une version future est protégé contre l’écrasement automatique, même si une copie plus ancienne peut être lue.

Exporter, parser et restaurer retournent des structures indépendantes des entrées. La validation doit refuser les champs inventés, identités ou capacités modifiées, actes trop rapides, dates impossibles, comptes contraires au registre individuel et prétendues preuves sans leurs prérequis. Les résultats effectivement exécutés sont consignés dans les reçus de validation de la tranche, séparément des futurs essais natifs.

Le [reçu v11 de campagne](validation/v012-campaign-validation.json) atteste **224 tests réussis, sans échec ni omission**, dont **41 tests MI11**. Les vingt variantes historiques des dix fixtures passent la lecture et le retour export/import. Les deux exports préparés v10 sont comparés intégralement après retrait du seul dossier `voice` et restauration du numéro 10 ; leurs anciens checkpoints, rapports, ressources et champs de progression restent identiques. Les neuf fixtures antérieures conservent leurs octets attestés.
