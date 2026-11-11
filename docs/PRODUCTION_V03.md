# Production 0.3 — La dette sous la poussière

Référence : 10 novembre 2026. Cette tranche rend jouable **MI02** après la livraison de MI01 et conserve les premiers dossiers d’**ORDRE DE CENDRE**. ImperiumMarch reste le nom du dépôt.

## Deux sorties, un même dossier

Dans MI01, Sera Vey escortait les vingt-quatre caisses de filtres de Sami Pell. MI02 lui donne un nouvel ordre sur Vesper : reprendre un train de minerai détourné par un équipage des Brisants. Le train reste une infrastructure civile, même lorsqu’un groupe armé le retient. Le joueur doit dégager la voie, immobiliser la locomotive, ouvrir le wagon fermé et rendre compte de ce qu’il contient.

Deux treuils retiennent le convoi par des harpons. Les libérer demande un travail à proximité. La locomotive part en roue libre après le second déverrouillage. La poursuite et le freinage utilisent sa position dans la simulation, avec une limite matérialisée par la voie rompue. Le quadrupède Bastion doit pouvoir la rejoindre malgré sa vitesse inférieure aux deux autres châssis.

Huit ouvriers sont séquestrés dans un wagon. Les dégâts de tir et d’explosion ont des conséquences sur ses occupants et sur le registre de leur vente. Arrêter la locomotive n’efface pas ces dégâts. Ouvrir un wagon détruit ne ressuscite personne. Le compte rendu conserve séparément les sauvés, les morts, la lisibilité du registre et le traitement administratif choisi. Il ne donne aucune preuve PALINODE.

Le dossier MI01 fournit le contexte de la sortie : conduite préservée, réparation effectuée ou service encore interrompu, et signalement des Cales-Basses joint ou absent. Tess et Sami parlent de ces états. Le niveau ne simule pas encore leurs effets sur une économie ou sur la santé de tout un quartier.

## Progression, atelier et sauvegarde

MI02 se débloque après la première réussite de MI01. Les trois opérations autonomes restent séparées. Chaque mission de campagne possède son rapport. Une relecture permet de revisiter une mission terminée sans remplacer son premier bilan ni répéter sa dotation.

L’atelier commence avec six lots et reçoit quatre lots pour chaque première réussite de MI01 et MI02. Le maximum théorique avant dépenses est donc de quatorze lots. Réparer la coque et les appuis coûte toujours de zéro à six lots selon les dégâts. La réparation de conduite coûte deux lots et conserve l’incident de MI01. Les interventions sont refusées pendant une sortie officielle.

Le format de dossier passe en **version 2** tout en conservant les clés locales `imperium.campaign.v1` et `imperium.campaign.v1.backup`. La migration du format v1 connu préserve MI01, son éventuel checkpoint, son rapport, les pièces et les conditions du parc. Elle ajoute l’état du dossier ferroviaire sans inventer une réussite de MI02. Une version future ou un format étranger reste protégé contre l’écrasement automatique.

Le checkpoint MI02 comprend le train, les treuils, les dégâts, les ouvriers et les travaux en cours, en plus de la simulation de combat. Le point avant décision reste distinct. Après validation d’une mission, aucun ancien point ne peut réécrire son premier rapport.

## Correspondance avec la bible

| Fiches | Portée de la tranche |
| --- | --- |
| MI02, VE17 | Mission et famille Train Fret-Est au stade prototype. Dételage et aiguillages restent ouverts. |
| PX31–PX33 | Séquence de mission, train, harpons, freinage, ouvriers et registre. |
| PX34–PX36 | Héritage MI01, migration/reprise, bilans et dotations. |
| PR33–PR34 | Mission et progression implémentées au stade prototype. |
| PR35–PR36 | Finition du viaduc et validation navigateur encore suivies séparément. |
| QA39–QA45 | Parcours, échecs, dégâts, migration et limites de chaque vérification. |

Le classeur conserve **21 onglets** et comporte **446 fiches**, soit dix-sept ajouts sans suppression ni renumérotation des 429 fiches précédentes. Les formules de Synthèse comptent les lignes et les statuts des domaines. Une fiche Vérifié désigne un contrôle exécuté dans la portée annoncée.

## Validation et limites

Les tests de simulation et de dossier sont décrits dans [CAMPAIGN_MISSION_02.md](CAMPAIGN_MISSION_02.md). Le [rapport d’intégration](QA_INTEGRATION.md) est la référence pour les suites effectivement exécutées et les éventuels blocages du navigateur. Une extraction obtenue par commandes publiques établit que les objectifs sont atteignables dans les conditions testées. Elle ne certifie pas le confort de pilotage, la performance sur matériel cible ou la difficulté ressentie.

La bible est reconstruite avec Artifact Tool. La validation rapproche ses formules de synthèse du JSON et vérifie leur réaction à un changement temporaire de statut. Les vues modifiées sont rendues pour vérifier leur lisibilité. Le rapport de classeur est conservé dans `docs/validation/workbook-validation.json`.

Restent à produire : MI03 et les vingt-neuf missions suivantes, les embranchements après Vesper, les autres châssis et mondes, les assets et animations définitifs, les voix, les réserves de munitions et la simulation avancée de terrain. La cible AAA demeure une ambition de production.
