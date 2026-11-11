# MI06 — Les maisons sous la ligne

**Contrat de la version jouable 0.7.0 · Nacre · Acte I**

La sixième mission s’ouvre après le premier rapport de MI05. Elle ne demande ni passage civil réussi, ni facture de trafic, ni contact avec Vann, ni réserve de carburant. Elle reprend les moyens réellement disponibles et propose une voie manuelle lorsque l’aide manque. MI07–MI08 restent conçues dans [le contrat de Nacre 0.7](NACRE_CONSEQUENCES_V07.md).

## Ordre et enjeu

Holt demande de soutenir la remise en pression de la digue des Trois-Vannes pour rouvrir un quai privé. Les repères prescrits sur deux maisons montrent le coût de cette opération pour un quartier habité. Le joueur doit constater, protéger les personnes, assurer un panneau, choisir un circuit et accomplir les travaux nécessaires.

Les dix habitants — six dans la première maison, quatre dans la seconde — sont des personnes nouvelles. Les deux techniciens forment un autre groupe. Aucun n’est déduit des douze passagers ou des quatre membres de Rive-Courte de MI05.

Mara Eren intervient à la radio après un constat réel. La mission n’inclut pas de personnage physique Mara vulnérable, ne la recrute pas et n’accorde pas une confiance générale. Le constat du quartier ne devient pas une preuve PALINODE.

## Actions et conditions

| Situation | Geste du pilote | Effet réel |
| --- | --- | --- |
| Maison | E lance trois secondes d’inspection à portée. | Seuil et occupation constatés. Les ruines restent constatables. |
| Première maison inspectée | E appelle Mara à la radio. | L’appel lance le départ des dix habitants du quartier encore vivants. Aucun sauvetage crédité par le seul appel. |
| Poste du génie | E appelle les deux techniciens. | Ils rejoignent le chantier par la route héritée du chenal, avec attente face aux menaces. |
| Repère du panneau | Immobiliser la coque, poser tous les pieds et maintenir l’ancrage avec Espace. | Soutien tant que les conditions sont remplies. Une simple proximité n’est pas suffisante. |
| Panneau soutenu et technicien arrivé | Maintenir le soutien pendant six secondes de travail. | Verrou achevé; le panneau n’exige plus le soutien temporaire du marcheur. |
| Repli manuel | E sous ancrage lance l’étai : douze secondes, ou huit avec pompe auxiliaire active. | Étai de secours, possible même si le panneau a été détruit. Sa coque n’est pas réparée. |
| Pompe auxiliaire | E lance un branchement de quatre secondes avec deux lots disponibles. | Deux lots consommés à l’achèvement; aide à la pression et à l’usure du chantier. |
| Commande de circuit | Choisir après les deux inspections et la sécurisation du panneau. | Circuit impérial ou dérivation préparé; la mission continue. |
| Vanne, technicien vivant arrivé | E lance six secondes pour le réglage impérial ou dix pour la dérivation. | Pompes réellement mises en service au terme du travail. |
| Vanne sans technicien arrivé | E lance dix secondes pour le réglage impérial ou dix-huit pour la dérivation. | Même possibilité d’achèvement, avec travail manuel plus long. |

Les durées concernent un travail accompli. Sortir de portée ou perdre une condition requise l’interrompt selon la règle du poste concerné. L’interface donne le prochain geste et la raison d’une indisponibilité. Les interruptions ne doivent pas être décrites comme des travaux terminés.

### Posture de soutien

Le repère de support est centré à x = 2480 unités du niveau. La coque doit rester dans une fenêtre de 60 unités autour de ce point, immobile et ancrée. Tous les pieds doivent être en contact dans la bande de 230 unités de part et d’autre du support. Ces distances sont des unités de simulation, pas des mètres fictionnels.

Lever un groupe ou repartir retire le soutien. Un verrou déjà achevé constitue un état mécanique durable. L’étai est un autre moyen de sécuriser le passage; il ne transforme pas une épave de panneau en installation intacte.

## Habitants en mouvement

L’abri se trouve à x = 760, à l’ouest. Les habitants avancent individuellement à 28 unités par seconde et s’arrêtent devant une menace locale proche. Ils ne sont comptés à l’abri qu’après leur arrivée. Un premier constat suffit pour appeler l’ensemble du quartier; les deux inspections restent nécessaires pour compiler les relevés et ouvrir le choix de circuit.

| État d’une personne | Risque et comptage |
| --- | --- |
| Dans sa maison | Protégée des tirs directs individuels; la destruction ou l’inondation du logement peut la tuer. |
| En trajet | Exposée aux projectiles et à l’attente face aux menaces. Pas encore comptée sauvée. |
| À l’abri | Comptée arrivée et retirée des collisions. |
| Perdue | Conservée dans les pertes; aucun retour provoqué par la décision ou l’extraction. |

La perte d’un logement ne tue pas les habitants qui l’ont quitté. Inversement, une maison intacte ne prouve pas que tous ses habitants sont arrivés. Le bilan des deux façades et celui des dix personnes restent indépendants.

## Techniciens, abris et dommages

Lorsque le chenal est ouvert et que ses passagers ont effectivement atteint le dock, les techniciens viennent par le quai. Sinon, ils utilisent une entrée plus éloignée par la passerelle haute. Les personnes de MI05 ne sont pas transférées dans ces rôles.

Deux abris du chantier bloquent les projectiles réels. Ils peuvent être détruits, ce qui modifie la protection offerte aux intervenants. Les techniciens possèdent leur propre santé; ils attendent face à une menace et leur aide cesse lorsqu’ils sont perdus. Une issue manuelle reste disponible sans eux.

Le panneau, la pompe auxiliaire, les maisons et les abris ont des zones et des dégâts distincts. Une explosion peut atteindre plusieurs éléments par sa portée. Sécuriser un panneau détruit par étai ne restaure pas ses points d’intégrité. Une pompe auxiliaire détruite après branchement cesse d’aider, mais n’annule pas sa dépense.

## Le choix doit encore être réalisé

La décision suspend le monde, puis sa résolution reprend l’opération. Le réglage impérial et la dérivation exigent une manœuvre de vanne. Choisir une option n’achève ni ce travail ni l’évacuation.

Le circuit impérial fait monter l’eau derrière les maisons après la mise en service. Au seuil de 0,65 du niveau simulé, les logements deviennent inhabitables et les occupants encore à l’intérieur sont perdus. La dérivation maintient le niveau bas; elle préserve de cette inondation les maisons qui n’ont pas déjà été détruites.

L’extraction attend les travaux terminés et un bilan déterminé pour les dix habitants. Sous le réglage impérial, elle attend aussi que le niveau ait atteint le seuil qui établit le sort des logements. Le joueur ne peut pas partir avant cette conséquence pour obtenir artificiellement un bilan favorable.

## Carburant et tentatives officielles

La pompe auxiliaire exige deux lots disponibles. Le débit a lieu après quatre secondes de branchement accompli. Une interruption préalable ne consomme rien. Recommencer l’interaction après achèvement n’accorde pas une seconde aide et ne débite pas de nouveau.

Le dossier officiel inscrit la dépense immédiatement. Une défaite, un retour au menu ou un recommencement de la mission conserve donc le stock restant. Si une première tentative a dépensé les deux lots, la suivante part sans eux et conserve la voie manuelle.

Le rapport décrit la consommation de sa propre sortie. Le registre de Nacre décrit la dépense cumulée, y compris celle d’une tentative perdue. Ainsi, une réussite manuelle peut avoir zéro carburant utilisé alors que deux lots ont déjà été dépensés dans le dossier.

Une relecture est isolée : sa simulation peut utiliser ses ressources de contexte, mais elle ne modifie ni stock, ni registre, ni premier rapport officiels. Les lots ne sont pas remboursés en relecture, car aucun débit officiel n’y est fait.

## Rapport, reprise et migration

Le format v6 conserve inspections, appel de secours, habitants, logements, techniciens, verrou ou étai, fatigue, circuit, pompes et dépense de la sortie. Le registre cumulé est séparé du rapport. Le premier résultat et sa dotation restent uniques.

Une reprise restaure les personnes à leur position, le travail en cours et les installations dans leur état. Le point avant décision reste archivé, mais MI06 refuse sa restauration dès qu’il est antérieur à l’horloge officielle courante, même lorsque la dépense est identique. Il ne peut donc pas recréer un ancien chantier ou un stock déjà engagé. Le point courant demeure reprenable.

Les formats historiques connus sont migrés; un vrai dossier v5 reçoit la digue non jouée et zéro dépense antérieure, en conservant son carburant de MI05. Un échec d’écriture est signalé à l’interface; une action simulée ne doit pas être annoncée comme durablement enregistrée si le stockage a refusé l’enregistrement.

## Portée et validations

MI06 fournit un chantier local, des personnes en mouvement, un soutien fondé sur les appuis et un circuit à exécuter après la décision. Le modèle hydraulique général, les charges de tous les quais, l’accueil durable des familles, les voix enregistrées et l’art final restent à produire.

Les tests de simulation et de campagne, les parcours dans un DOM modélisé, les rendus Canvas et les contrôles dans un navigateur réel gardent leurs preuves séparées dans le bilan de livraison. La compréhension humaine du soutien, de l’évacuation et de la dépense demeure un essai distinct, suivi par QA115.
