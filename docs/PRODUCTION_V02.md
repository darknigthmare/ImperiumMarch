# Production 0.2 — Le couloir quarante-deux

Référence : 10 novembre 2026. Cette tranche poursuit le prototype 0.1 et rend jouable la première mission de la campagne, **MI01**. Le titre du jeu reste **ORDRE DE CENDRE**, et ImperiumMarch son nom de code.

## Ce que cette tranche développe

Sera Vey accompagne le convoi de filtres de Sami Pell vers le poste des mineurs de Vesper. Tess Ardan guide les premiers appuis. La cargaison est utile et les attaquants mettent réellement le transport en danger. La mission installe la responsabilité du pilote avant les révélations ultérieures du récit.

Le franchissement de la conduite peut être préparé en déployant des plaques de protection. L’interaction demande 4,5 secondes. Sans cette protection, la rupture provient du contact d’un pied avec la conduite. Le convoi s’immobilise alors pendant huit secondes et le dossier conserve un besoin de réparation de deux lots d’atelier. Le rendu représente l’état de la conduite fourni par la simulation.

L’arrivée du convoi livre 24 caisses. Le manifeste devient ensuite lisible : les Cales-Basses ne figurent pas parmi les destinataires. Le pilote peut clore le bordereau officiel ou joindre l’observation de Sami. Ce choix est administratif et local. **MI01 n’attribue pas la preuve PT01 et ne révèle pas PALINODE.**

Le retour d’équipage lit les événements de la mission : état de la conduite, livraison, pertes civiles et observation jointe ou ignorée. Tess et Sami répondent à ces événements. Le dossier de Vesper, les relations nommées et le matériel persistent après fermeture lorsque le stockage est disponible.

## Reprise et atelier

La campagne dispose d’un format de sauvegarde versionné. Un point de reprise conserve le monde en cours, et le point précédant la décision reste distinct. Les opérations OP01–OP03 continuent de stocker leurs propres rapports. Leurs réussites ne débloquent aucun chapitre de campagne.

La sauvegarde possède une copie principale et une dernière copie valide de secours. Les fichiers exportés permettent un transfert manuel. Une version incompatible, un fichier mal formé ou un stockage refusé doivent produire un état explicite, sans annoncer une sauvegarde qui n’a pas été écrite et sans remplacer silencieusement une progression existante.

L’atelier commence avec six lots d’atelier. Une première livraison réussie ajoute quatre lots d’atelier. Le même bilan ne peut pas être appliqué deux fois. Une défaite ou un replay n’accorde ni dotation supplémentaire ni réécriture du dossier.

Le devis du marcheur dépend de la part manquante de coque et de l’usure moyenne des appuis. Il vaut zéro sur une machine intacte, sinon un à six lots d’atelier. La conduite demande deux lots d’atelier, une seule fois. Une réparation rétablit le service mais conserve la trace historique de la rupture.

## Correspondance avec la bible

| Fiches | État de la tranche |
| --- | --- |
| MI01 | Première version jouable. La mission de référence à la qualité finale reste suivie par PR16. |
| PN02, PN14 | Tess et Sami interviennent dans MI01 et au retour. Leurs arcs complets restent à produire. |
| SY24, SY25, SY26 | États locaux, atelier et reprise prototypés pour MI01. Les systèmes de campagne complète restent ouverts. |
| PX25–PX30 | Définition précise des six ajouts fonctionnels et de leurs limites. |
| PR29–PR32 | Suivi de la mission, de sa reprise, du retour au hangar et des vérifications navigateur. |
| QA31–QA38 | Contrôles ciblés. Leur statut indique uniquement les parcours réellement exécutés. |

Le classeur comporte **429 fiches dans 21 onglets**, sans suppression ni renumérotation des 411 fiches de la 0.1. Les nouveaux enregistrements utilisent les colonnes, filtres, volets et statuts existants. La synthèse compte les fiches par statut au moyen de formules reliées aux tables.

## Portée de la validation

Les tests de mission et de sauvegarde sont séparés des tests navigateur. Un parcours simulé par commandes publiques peut établir l’atteignabilité d’un objectif, mais ne mesure pas à lui seul la lisibilité ni la difficulté ressentie par un joueur. Les tests de stockage injectent volontairement des erreurs pour vérifier la conservation de l’état existant.

La suite de mission vérifie douze parcours complets par commandes publiques : trois châssis, deux passages et deux réponses au bordereau. Elle vérifie aussi l’ordre livraison/manifeste, l’absence de révélation PALINODE, l’annulation du déploiement des plaques et l’immuabilité du résultat final. Cette portée justifie QA31 et QA32, sans clôturer l’art ni la validation navigateur de MI01.

Les contrôles de sauvegarde comparent, pour chaque châssis, l’état complet de deux simulations après restauration et 180 entrées identiques. Ils couvrent aussi le point précédant la décision, les formats invalides, la copie de secours, les erreurs d’écriture simulées, les dotations uniques et les réparations. Une copie principale de version future reste protégée, même lorsqu’une ancienne copie de secours est encore lisible. QA33–QA36 sont vérifiés dans cette portée automatisée. Les cas d’atelier utilisent des états de dégâts préparés pour tester les limites du stock ; ils ne prétendent pas être des parcours de combat humains.

La tentative de lancement de Chromium via Playwright a échoué avant l’ouverture d’une page : `socket() Operation not permitted`. **Aucune interaction navigateur n’a donc été validée dans cette tranche.** PR32, QA37 et QA38 restent à produire. Les vérifications statiques et les tests de simulation ne les remplacent pas. Les résultats du classeur et de son recalcul sont consignés dans `docs/validation/workbook-validation.json`.

## Suite de production

1. Développer MI02, « La dette sous la poussière », avec son train de minerai et ses otages, puis vérifier les conséquences en provenance de MI01.
2. Donner aux choix de campagne une portée au-delà de Vesper : témoins, preuves techniques, pactes, ressources et territoires.
3. Produire le contournement libre et les interactions de terrain avancées. Les plaques de MI01 ne constituent pas encore un réseau hydraulique simulé.
4. Étendre l’atelier aux modules, pièces rares et choix entre le marcheur et les transports de secours.
5. Produire l’art et l’animation définitifs, les voix, la mise en scène, l’IA de couverture/repli/reddition et les mesures de performance sur matériel cible.

Les **31 autres missions principales**, les **16 contrats**, les autres châssis et les quatre fins restent des contenus de conception ou de production. La sauvegarde de cette tranche ne représente pas encore une validation de toutes leurs combinaisons.
