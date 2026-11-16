# MI13 — Pièces de rechange

## Statut de cette reconstruction

Cette mission reconstruit la tranche locale 0.14 connue à partir de la base publique 0.12, de la fiche MI13 et des traces conservées. Elle ouvre Kharon après le premier rapport MI12. Les anciens octets, captures et rapports de la 0.14 perdue ne sont pas réinventés : le code, les formes et les vérifications de cette livraison portent la provenance de la reconstruction 0.14.1.

Le résultat reste un prototype. Il propose une source industrielle locale PT03 ; la preuve politique globale, la diffusion publique et la défection à MI16 restent ultérieures.

## Cargaison et géométrie

Le porteur industriel possède un corps de 242 × 48 unités et quatre roues. Deux caisses sont deux corps destructibles indépendants, avec marquage, intégrité, trajet de transfert et reçu propres. Le bordereau est fixé au porteur ; sa position suit le convoi. Les quatre roues et les vrais pieds du marcheur utilisent la même surface de pont fournie par la simulation.

| Élément | Position ou étendue | Opération |
| --- | --- | --- |
| Porteur initial | x = 1050 | Libération sous ancrage, 2 secondes |
| Premier pont | x = 1780 à 2390 | Vanne à x = 1530 |
| Second pont | x = 3400 à 4020 | Vanne à x = 3140 |
| Déclenchement de l’embuscade | x = 2700 | Arrivée des forces 6 secondes après alerte |
| Poste d’attente et d’ordre | x = 4740 | Destination choisie après relevés, analyse et défense |
| Quai de livraison | x = 5200 | Deux transferts distincts, 5 secondes chacun |
| Quai de quarantaine | x = 5740 | Même opération réelle de réception |
| Poste de rapport | x = 6300 | Transmission sous ancrage, 3 secondes |
| Extraction | x = 6800 | Trajet effectif après rapport |

Les positions ne sont pas des destinations instantanées. Le porteur avance à proximité du marcheur, lorsque celui-ci lui ouvre la route. Il attend si le joueur est trop éloigné, s’il se tient derrière, s’il est ancré ou si un travail sur la cargaison est en cours. Avant choix, il s’arrête au point d’attente.

## Chaleur

Les deux tabliers restent des supports physiques fixes. Chaque circuit commence à 90 °C. La vanne prend 4 secondes sous ancrage ; sa manœuvre isole l’apport de chaleur, coupe le jet et refroidit progressivement le pont vers 28 °C, à 8 °C par seconde simulée.

Un circuit encore fermé suit un cycle visible de 3 secondes d’avertissement, 2 secondes de jet et 7 secondes de repos. L’avertissement et l’état actif doivent rester lisibles en mode mouvement réduit. La simulation distingue trois apports : chaleur ambiante, conduction au contact des appuis et vapeur. La conduction exige un contact réel sur le pont. Les roues du porteur enregistrent elles aussi leur surface de contact et les dommages thermiques acquis.

Le verrou de surchauffe et le refroidissement appartiennent au moteur commun. Le HUD doit refléter immédiatement ce verrou ; la reprise est autorisée sous le seuil strict de 48 %. Isoler un circuit ne retire aucun dommage déjà reçu.

## Embuscade et relevés

Deux drones et une tourelle convergent après le déclenchement. Ils sont absents des comportements, cibles et collisions avant leur arrivée. Les marquages deviennent inspectables après cette entrée en scène, conformément au relevé du chargement après l’embuscade.

| Source ou travail | Durée | Ce qui est conservé |
| --- | --- | --- |
| Marquage de caisse 1 | 3 secondes | Copie de sa série si sa source existe encore |
| Marquage de caisse 2 | 3 secondes | Copie distincte de la seconde série |
| Bordereau | 4 secondes | Copie du document si son original existe encore |
| Analyse en liaison avec Tess | 8 secondes | Analyse des seules pièces effectivement relevées |

Tous ces travaux demandent ancrage et proximité. Une perte antérieure donne un constat, sans recréer le marquage ou le bordereau. Les copies déjà acquises restent à bord si l’original est détruit ensuite.

PT03 est acquise si, et seulement si, les deux marquages ont été copiés, le bordereau a été copié et l’analyse est terminée. L’analyse peut se terminer avec des sources manquantes : son résultat explique alors l’insuffisance du dossier et n’accorde pas PT03.

La provenance PT03 peut être établie sans PT01. Un rapprochement avec PT01 ou les commandes de MI12 n’est déclaré que si la copie concernée existe dans le vrai rapport historique. Cette distinction conserve la branche où le journal de Vesper a été perdu.

## Destination et transferts

`obey` retient la livraison à la fonderie ; `defy` retient la quarantaine. Le choix ne transporte rien, ne restaure aucune caisse et n’accorde pas la preuve à lui seul.

Après l’arrivée réelle du porteur dans la bonne baie, le poste de transfert permet de déplacer chaque caisse encore présente pendant 5 secondes. La caisse suit une position intermédiaire calculée par la simulation. Une interruption conserve sa position et sa durée déjà accomplie ; revenir au poste permet de reprendre. Les autres travaux ancrés interrompus recommencent à zéro. Une pause fige tous les travaux exactement.

Le rapport exige la résolution des deux caisses : chacune a été transférée ou a été perdue. Il distingue les caisses intactes, endommagées, perdues et effectivement transférées. Une destruction ultérieure n’efface pas un transfert déjà accompli. Une caisse endommagée ne doit jamais être annoncée « intacte ».

La destruction du porteur est terminale. Les pertes de caisses ou de bordereau autorisent un bilan dégradé lorsque le porteur peut encore atteindre sa destination. Le rapport précède le déplacement vers l’extraction.

## Persistance et réception

Le dossier `world.kharon.foundry` garde les faits, la provenance, les circuits, le porteur, les caisses, les transferts, les forces arrivées et leurs dates. Le premier rapport donne quatre lots ; un rejeu ne remplace ni les treize dossiers ni leur attribution initiale.

`tests/campaign-v13.test.mjs` vérifie les checkpoints des travaux, les deux destinations, les reçus falsifiés, les comparaisons avec les sources antérieures et la perte terminale. Il comprend une chaîne physique depuis la fixture historique v3 : le journal de MI04 est détruit par de vrais tirs, MI05 à MI13 sont jouées, puis PT03 est acquise sans inventer PT01. Les modules de simulation et leurs tests couvrent la chaleur, les surfaces et les opérations locales.

Les captures Canvas et les planches d’assets restent des rendus préparés. Les résultats réellement exécutés sont indiqués dans le rapport de reconstruction ; aucun résultat de navigateur ni essai humain n’est déduit d’un test de simulation.

