# ORDRE DE CENDRE — Conséquences de Nacre 0.8

**Version 0.8.0 · 11 novembre 2026**

MI05, **Le prix du passage**, MI06, **Les maisons sous la ligne**, et MI07, **Une ambulance sans escorte**, forment les trois sorties jouables de Nacre au stade prototype. MI08 reste conçue. Ce contrat décrit les héritages consommés par l’ambulance et les conditions nécessaires à la suite d’Aval. Le [contrat 0.7](NACRE_CONSEQUENCES_V07.md) conserve l’état de conception précédent.

## 1. Ce qui vient des deux premières missions

Le chenal conserve son état de passage, ses douze passagers, les quatre membres de Rive-Courte, la facture de Saisie, le contact éventuel avec Vann et le carburant réellement prélevé. Une facture locale ne devient pas un dossier PALINODE; un passeur joint ne représente pas tous les Brisants.

La digue conserve dix habitants nouveaux, deux maisons, deux techniciens, les relevés, le verrou ou l’étai, la fatigue, le circuit et les pompes. Une maison inhabitée ou détruite n’équivaut pas à la perte de ses anciens occupants. Les personnes arrivées à l’abri restent comptées à l’abri.

Le stock de carburant et le registre cumulé de dépense survivent à la transition. Deux lots engagés dans une tentative perdue de MI06 ne reviennent pas parce que MI07 introduit un autre véhicule. Aucune ressource supplémentaire n’est attribuée par le passage de mission.

| Fait hérité | Usage dans MI07 | Limite |
| --- | --- | --- |
| Premier rapport MI06 | Ouvre la mission de l’ambulance. | Aucun PT01, secours réussi ou carburant exigé. |
| Verrou achevé, sans étai, fatigue inférieure à 65 | Route principale admissible. | La seule survie du panneau ne suffit pas. |
| Autre état du panneau | Route secondaire; accueil éloigné de 550 unités supplémentaires. | Le repli ne reconstruit pas le panneau. |
| Technicien vivant | Une liaison radio peut être demandée au poste. | Le survivant n’a pas déjà été interrogé et n’apparaît pas comme nouvelle entité physique. |
| Au moins une maison inhabitable | L’accueil civil est déplacé de 180 unités supplémentaires. | Aucun bâtiment rétabli pour rendre la scène plus commode. |
| Carburant et dépense | Conservés dans le dossier v7. | Aucun plein ou remboursement automatique. |

## 2. Six nouvelles personnes

L’Ambulance Quai apporte **quatre patients, une conductrice et un soignant**. Le jeu les représente comme six entités individuelles, avec position, santé et état. Ces personnes ne sont pas réutilisées depuis les groupes de MI05 ou de MI06.

Avant l’arrêt, elles se trouvent à bord et la carrosserie les protège des tirs individuels. Le personnel sort physiquement au portique pour l’échange. Il doit remonter avant le transfert. Un membre du personnel dehors est exposé; la destruction de l’ambulance ne tue que ceux qui sont encore embarqués.

Après arrivée au quai, les chariots doivent être déployés. Le travail demande cinq secondes avec le soignant vivant et neuf sans lui. Les patients avancent ensuite jusqu’à la porte à 24 unités par seconde tant que le soignant vit, ou 18 sans lui. Cette différence ne dépend pas du remorquage du véhicule. Le personnel marche à 32 unités par seconde. La distance restante est réellement parcourue; elle ne disparaît pas au choix de destination.

Une personne est comptée arrivée seulement à la porte d’accueil. Elle sort alors des collisions. Le véhicule au quai n’est donc pas un certificat de secours pour ses quatre patients. Une ambulance détruite n’annule pas l’arrivée d’une personne qui l’avait déjà quittée et avait atteint l’accueil.

| Situation | Fait à conserver |
| --- | --- |
| Véhicule au quai, chariots non déployés | Transport arrivé, patients encore à bord. |
| Patient en route vers la porte | Débarquement engagé, secours pas encore acquis. |
| Patient à la porte, véhicule ensuite détruit | Arrivée conservée et véhicule perdu. |
| Personnel dehors, véhicule détruit | Personnel encore exposé et possibilité d’accueil à pied; seuls les embarqués sont perdus dans la coque. |
| Quatre patients perdus, personnel accueilli | Deux bilans différents; aucune population sanitaire de remplacement. |

Ce modèle ne simule pas des soins médicaux détaillés. Les identités finales, les familles et la vie après l’accueil restent un travail de narration et de mise en scène. Les patients ne sont pas des preuves à publier.

## 3. Arrêter, demander, examiner

L’ordre de Holt repose sur une désignation de dépôt mobile de munitions. L’arrivée de Sera ne transforme pas cette désignation en vérité. Le joueur doit ménager l’arrêt, demander un accord puis observer les sources matérielles.

La demande d’arrêt et l’immobilisation sont deux événements. Le véhicule doit encore atteindre l’aire protégée. Un examen ne peut pas être compté pendant ce déplacement. L’accord du personnel permet l’examen local; il ne donne pas un droit général sur les personnes, leurs noms ou leurs soins.

Le relevé de la caisse sanitaire est distinct du démontage du boîtier ajouté. La caisse demande trois secondes avec accord et source intacte. Sans source ou sans responsable pour donner l’accord, le constat extérieur prend deux secondes et n’affirme aucun contenu médical. Le boîtier intact demande cinq secondes sous ancrage, coque immobile et tous les pieds posés. L’achèvement de cette unique opération donne la balise, ses attaches et son journal. Une interruption ne donne pas un relevé partiel fictif; un boîtier détruit laisse un constat de deux secondes sans journal.

Après constat de la caisse, un échange facultatif de 2,5 secondes peut recueillir le consentement à témoigner. Il conserve l’identité de son auteur. Cet accord n’est pas fourni par les deux secondes d’autorisation de l’examen. Si son auteur meurt, l’accord historique reste et la disponibilité du témoin disparaît; l’autre membre du personnel n’en hérite pas.

Mara peut être appelée pendant trois secondes après compilation du relevé. Cette transmission accepte aussi un constat de perte. Aucun contact effectué n’est ajouté parce que Mara serait théoriquement disponible. Elle demeure radio : cette scène ne la fait pas apparaître physiquement, ne lui attribue pas la connaissance de l’auteur de pose et ne la recrute pas.

## 4. Une source locale et une attribution encore ouverte

La balise récupérée conserve l’objet, ses attaches et son journal local. Le relevé montre un problème de désignation sur ce véhicule. Il n’identifie pas à lui seul la personne ayant donné l’ordre de pose, ni une chaîne de responsabilité complète.

**La provenance de pose reste non vérifiée.** `provenanceVerified` demeure faux. Aucun PT ou PO n’est attribué par MI07. Si le journal PT01 de Vesper a été perdu, l’ambulance ne le reconstitue pas sous un autre nom.

| État connu | Ce qu’il permet de dire | Ce qu’il ne permet pas de dire |
| --- | --- | --- |
| Signature reçue | Holt a transmis cette désignation. | Des munitions ont été vues dans la caisse. |
| Caisse examinée | Le contenu sanitaire a été observé. | Le personnel connaît l’auteur de la désignation. |
| Boîtier intact, démontage inachevé | La pièce reste à récupérer. | Son journal ou ses attaches sont déjà conservés. |
| Démontage achevé | La balise, ses attaches et son relevé sont conservés. | La provenance de pose ou le commanditaire sont certifiés. |
| Ruines sans relevé antérieur | Une perte et les éléments encore observables sont constatés. | Un journal intact ou une conversation perdue sont disponibles. |
| Copie obtenue avant dommage | Le relevé acquis demeure dans le dossier. | L’original existe encore dans le monde. |

La destruction du véhicule, du personnel ou du boîtier laisse une issue de constat. Elle ne doit pas imposer d’utiliser un objet disparu. Cette possibilité garantit la continuité de campagne; elle ne garantit pas le même niveau d’information ou le même bilan humain.

## 5. Préparer puis accomplir le transfert

Au poste, une liaison de 2,5 secondes avec un technicien réellement survivant de MI06 donne son guidage. Le travail de rampe passe de huit à quatre secondes. Sans survivant ou sans appel, la préparation manuelle demeure possible. Cette aide est radio et ne crée pas une nouvelle personne physique sur la chaussée.

Le choix de destination conduit au poste médical impérial ou à l’accueil civil. Sous la disposition impériale, le véhicule survivant est saisi. À l’accueil civil, le véhicule qui arrive reste disponible. Ces résultats ne qualifient pas rétroactivement sa caisse comme militaire ou son conducteur comme allié durable.

La rampe et le poste sont préparés après ce choix. La préparation de l’accueil prend quatre secondes avec les pompes en service d’un dossier MI06 terminé. Un contexte de simulation sans pompes conserve une opération de sept secondes, sans présenter ce cas comme une autre victoire de MI06. Une nouvelle commande engage le transfert lorsque rampe et accueil sont prêts.

La conductrice permet le roulage à 48 unités par seconde. Si elle est perdue, le soignant ne la remplace pas automatiquement. Sera peut accomplir un attelage de cinq secondes à proximité de l’ambulance. L’attelage interrompu est annulé sans coût. Le remorquage avance ensuite à 28 unités par seconde lorsque le marcheur reste à moins de 480 unités; il attend au-delà. Ce repli reste possible sans personnel vivant, tant que le véhicule existe encore. Il ne répare pas une épave.

La destination choisie n’efface pas les menaces du trajet. Le véhicule, les occupants encore embarqués, le personnel dehors et les patients débarqués gardent leurs états réels. Au quai, le déploiement des chariots puis l’arrivée individuelle à la porte restent nécessaires.

La récupération ou la destruction de la balise annonce deux drones de saisie, actifs dix secondes simulées plus tard. Cette alerte ne se répète pas après reprise et ne donne pas l’identité de l’auteur de la pose. L’ambulance et les personnes en trajet peuvent attendre face aux menaces proches; attendre n’accorde aucun secours.

## 6. Ce que MI07 laisse pour la suite

Le dossier v7 conserve le premier résultat de MI07, les constats, la récupération, les contacts, la préparation et les résultats sanitaires. Les rapports précédents restent immuables. Une relecture simule ses propres ressources et personnes sans réécrire le dossier officiel ou son checkpoint.

La migration d’un dossier v6 ajoute l’ambulance non visitée, sans jouer la mission rétroactivement. Elle préserve notamment la dépense cumulée de MI06, même lorsque la sortie victorieuse de la digue n’avait utilisé aucun lot après une tentative perdue.

Les combinaisons suivantes doivent rester lisibles dans les scènes futures :

- Patients accueillis et ambulance saisie au poste impérial.
- Patients accueillis et véhicule disponible à l’accueil civil.
- Conductrice perdue, transfert accompli au treuil et soignant arrivé.
- Patients perdus à bord, personnel déjà sorti puis accueilli à pied.
- Caisse observée, balise détruite avant récupération et provenance toujours inconnue.
- Balise récupérée, véhicule perdu ensuite et relevé conservé.
- Rampe secondaire utilisée malgré le succès de MI06, parce que l’étai ou la fatigue ne permettaient pas l’accès principal.

Ces états ne promettent pas un bateau, une place au refuge ou un consentement à quitter Nacre. MI08 devra établir ces actes dans sa propre scène. Le [contrat MI07](CAMPAIGN_MISSION_07.md) fixe la portée jouable; la [production 0.8](PRODUCTION_V08.md) sépare cette portée des travaux suivants.

## MI08 — La marée compte les absents : conception de la sortie

**Cette mission reste conçue.** La 0.8 ne fournit ni ses portes jouables, ni ses bateaux, ni son refuge. Le contrat suivant prépare leur réalisation à partir de faits que MI05–MI07 peuvent réellement laisser.

### L’ordre et les lieux

Holt demande la fermeture des portes d’Aval pour achever le contrôle de l’archipel. L’ordre arrive alors qu’une file de départ est encore en préparation. Le niveau doit présenter trois lieux reliés : le poste des vannes, le quai d’embarquement et une aire d’accueil en amont. Le refuge de destination se trouve au-delà du passage; il faut établir sa capacité et son contact avant d’y annoncer des arrivées.

Les deux portes ont des fonctions différentes. La porte d’amenée règle l’eau qui rejoint le bassin. La porte de passage règle la sortie des embarcations. Fermer l’amenée ralentit l’évolution du bassin, sans téléporter son eau ni arrêter instantanément le courant. Ouvrir le passage n’autorise pas un départ lorsque le courant dépasse la fenêtre annoncée. Le poste doit afficher la fonction de chaque commande, l’état actuel et le prochain effet attendu.

### Préparer les personnes présentes

La scène ne compose pas une foule à partir du total de civils sauvés. Elle présente les groupes qu’une rencontre et un trajet ont effectivement amenés au quai.

| Origine | Condition pour participer à la scène | Ce qui ne doit pas être déduit |
| --- | --- | --- |
| Douze passagers de MI05 | Arrivés au dock, puis retrouvés par une scène de liaison si leur présence est requise. | Leur arrivée au dock n’est pas déjà une traversée vers le refuge. |
| Dix habitants de MI06 | Vivants à l’abri, puis invités à rejoindre un lieu de départ identifié. | Une maison perdue ne produit ni un nouvel habitant ni une adhésion automatique au départ. |
| Personnes de MI07 | Bilan sanitaire, disponibilité et accord connus; place adaptée réservée aux patients. | Aucun patient perdu n’est recréé et aucun personnel sauvé n’est réquisitionné sans échange. |
| Équipage de Vann | Contact établi, survivants disponibles et passage accepté dans une nouvelle scène. | Le service intéressé de MI05 ne constitue pas un pacte général. |
| Mara | Présence ou liaison explicitement établie, selon ses responsabilités et sa décision. | Une voix radio ne devient pas une présence physique au quai. |

Chaque groupe conserve son identifiant d’origine et les personnes qui le composent. Une personne montée à bord quitte la file du quai; elle n’occupe pas deux places simultanément. Les patients qui nécessitent un emplacement de brancard ne doivent pas être comptés comme une simple capacité de voyageurs debout. La disponibilité d’un bateau, d’une place et d’un accompagnant sont trois contraintes séparées.

### Une séquence réalisable

Le joueur inspecte d’abord les commandes et les marques de pression. Un échange avec le responsable du quai donne les bateaux prêts, leurs places, leurs destinations et les personnes encore à rejoindre. Une transmission au refuge précise les places d’accueil. Ce contact est une action : un indicateur de liaison disponible ne valide pas sa réalisation.

La préparation consiste ensuite à dégager l’accès au quai, sécuriser les passerelles d’embarquement et fixer le service qui gardera l’amenée. Les techniciens réellement survivants peuvent raccourcir une manœuvre après avoir accepté le poste. Sans eux, Sera conserve un travail manuel plus long. Aucun remplacement anonyme ne fait disparaître leur perte.

L’embarquement puis le départ sont observables. Les bateaux attendent une voie praticable et une fenêtre de courant. Les passagers partis restent partis si la porte est endommagée ensuite. Une sortie de l’archipel est enregistrée comme un départ; l’arrivée au refuge n’est acquise qu’après le signal d’arrivée prévu. Si cette confirmation ne fait pas partie du niveau, le dossier doit conserver une destination annoncée et un statut en route.

### Trois conduites locales, puis un rapport

La fermeture immédiate applique l’ordre alors que le quai peut encore contenir des personnes. Celles qui restent doivent avoir une issue dans l’aire d’accueil locale; rester ne signifie pas automatiquement mourir. La fermeture après une fenêtre de départ permet aux embarcations réellement prêtes de partir, puis exige de terminer la manœuvre. Le maintien d’un accès laisse une route ouverte et expose ses installations à une pression ou à des renforts supplémentaires annoncés.

Ces conduites sont des actions matérielles, pas trois intitulés qui distribuent des survivants. Les commandes demeurent soumises aux conditions du monde et la mission constate ce qui s’est passé. La déclaration à Holt intervient ensuite. Elle peut reconnaître le retard, décrire une avarie ou contester la fermeture; elle ne modifie ni les départs, ni les dégâts, ni le nombre de personnes restées.

La désobéissance locale de Nacre ne remplace pas la défection opérationnelle de MI16. Une décision d’ouverture ne donne pas immédiatement un nouvel équipage, un engagement politique de Mara ou la fidélité de tous les Brisants.

### Dommages et voies de repli

La porte d’amenée possède son intégrité, son mécanisme et son ouverture. Un mécanisme détruit bloque sa manœuvre à l’état atteint; une obturation de secours peut alors réduire l’apport d’eau après un travail matériel distinct. Cette obturation ne restaure pas les composants détruits.

La porte de passage possède un autre mécanisme. Bloquée ouverte, elle laisse un passage dangereux à gérer; bloquée fermée, elle peut imposer le repli de bateaux encore dans le bassin vers un quai secondaire. Une avarie ne doit pas empêcher toute fin de mission : constat du poste, bilan du quai et accueil des personnes restantes constituent une issue documentée, sans prétendre à une traversée réussie.

Les bateaux gardent une coque, une capacité et un état de trajet. Les dommages avant départ ou dans la zone encore exposée peuvent provoquer une immobilisation ou une perte. Après sortie de la zone simulée, ils ne doivent plus recevoir des impacts locaux. Un bateau détruit ne reste pas sélectionnable pour charger des patients, et son épave ne conserve pas une capacité fictive.

La réserve de MI05 et la dépense de MI06 restent inchangées par la transition. Un repli manuel ne reçoit pas une pompe gratuite pour compenser l’absence de carburant. Si une nouvelle ressource est nécessaire à MI08, elle doit avoir sa propre origine, son accès, sa collecte et son coût.

### Les documents du poste

Le registre de relogement rapproche un quartier d’origine, un lieu d’accueil annoncé et une obligation de travail. Le joueur doit ouvrir le support et copier les pages pertinentes. L’absence d’un nom peut établir une lacune; elle ne prouve pas automatiquement la mort de cette personne. Une copie conservée résiste à la destruction ultérieure de l’original. Sans copie, les ruines du poste ne donnent que ce qui reste matériellement observable.

Ces documents apportent une contradiction locale entre secours et contrat imposé. Leur raccordement à une responsabilité plus large demande un recoupement ultérieur. La mission ne doit pas attribuer une nouvelle preuve PT ou PO simplement parce qu’un terminal est situé près d’une porte impériale.

### Répliques proposées pour la mise en scène

Ces textes sont des propositions de conception, avec leurs conditions de présence. Ils ne sont pas des voix enregistrées ou des dialogues déjà joués.

**Responsable du quai, après consultation de la liste :** « Le deuxième bateau a deux places de brancard. Pas trois. Si vous lui donnez les deux, je garde les autres ici avec moi. »

**Technicien ayant accepté le poste d’amenée :** « Je peux tenir cette vanne. Mais la grande porte, ce sera à vous de la reprendre. »

**Mara, si sa présence et le patient attendu sont établis :** « Il reste un brancard sur le quai. Regardez-le monter avant de compter ce départ. »

**Vann, après accord réel pour cette traversée :** « Je pars à la renverse. Si elle passe avant nous, je rentre au quai. Je ne vais pas vous promettre une mer qui n’existe plus. »

**Sera, si des personnes restent dans l’accueil local :** « Les bateaux sont sortis. Ceux qui sont ici restent sous notre protection jusqu’à la relève. »

**Tess, devant un mécanisme détruit :** « On peut fermer l’eau à côté. On ne peut pas appeler ça une réparation de la porte. »

### Conditions de production

Avant le passage de MI08 en prototype, il faudra exécuter les issues avec deux portes intactes, chaque porte détruite séparément, aucun technicien, aucun bateau disponible et un refuge indisponible. Les essais devront vérifier les transitions de personnes à quai, à bord, en route, arrivées et perdues; une même personne ne peut pas occuper deux états incompatibles.

Les archives devront garder les départs acquis après un dommage tardif, distinguer accueil local et refuge, préserver les copies déjà obtenues et permettre une issue de constat sans source intacte. Ces essais restent à produire. Les contrôles de MI07 ne les couvrent pas.

## Travail ouvert et validation

Les contrats CT03 et CT04 restent conçus. Ils ne doivent pas cacher l’unique preuve indispensable à une issue viable derrière une activité facultative. Leurs services et accords ont leur propre contexte; un résultat de la campagne principale ne les exécute pas rétroactivement.

La finition de l’ambulance, des personnes, du transfert, des voix et de l’environnement reste ouverte. Les capacités amphibies de VE02 ne sont pas livrées par son roulage routier. Les gestes médicaux détaillés, le refuge et les portes de MI08 restent à produire.

Les QA116–QA136 sont vérifiées dans la portée des preuves finales consignées dans [QA_V08.md](QA_V08.md) et [PRODUCTION_V08.md](PRODUCTION_V08.md). Les tests de simulation, les parcours dans un DOM modélisé, les rendus Canvas et les contrôles d’un navigateur réel gardent des portées différentes. Les preuves locales ne revendiquent pas déjà le contrôle du déploiement publié. QA137 reste **À produire** pour l’essai humain de l’ambulance, et QA115 conserve l’essai humain de la digue. Aucune de ces validations ne rend MI08 jouable ni ne valide ses portes, ses embarquements ou son refuge.
