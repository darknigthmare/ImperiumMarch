# MI05 — Le prix du passage

**Contrat de la version jouable 0.6.0 · Nacre · Acte I**

La cinquième mission s’ouvre après le premier rapport de MI04. Elle fonctionne avec ou sans PT01. Le prototype comporte une première traversée de Nacre, ses deux bancs, deux barges, un bateau civil et une réserve locale. Les suites MI06–MI08 restent conçues dans [le contrat de Nacre](NACRE_CONSEQUENCES_V06.md).

## Ordre et enjeu

Holt demande de lever un blocus sur le chenal d’approvisionnement. Deux treuils retiennent le passage. La mission a une utilité immédiate : rendre la route au bateau qui attend. Les inspections permettent ensuite de distinguer le trafic de la barge Saisie et le passage assuré par Vann Ostre sur Rive-Courte.

Vann garde son rôle de navigateur intéressé. Son équipage et celui de Saisie ne représentent pas tous les Brisants. La facture de trafic établit un fait local, sans ajouter une preuve technique ou politique à la chaîne PALINODE.

## Actions du pilote

| Situation | Action disponible | Résultat réel |
| --- | --- | --- |
| Banc de vase | Choisir la fenêtre de marée et poser ses appuis. | Ralentissement de surface; la submersion expose les appuis. Les six appuis atténuent la pénalité de vase. |
| Commande de passerelle | Rester à portée et accomplir la pose de quatre secondes. | Tablier permanent sur le banc correspondant; alternative sûre à l’attente de marée. |
| Treuil | Interaction de deux secondes et demie ou tir local. | Le câble est libéré. La coque peut rester intacte. |
| Barge Saisie | Inspection de trois secondes. | Facture copiée si elle demeure accessible; constat d’épave sinon. |
| Rive-Courte | Inspection et contact de trois secondes. | Échange avec Vann si l’équipage peut encore répondre; constat des pertes sinon. |
| Bateau civil | Protéger le chenal et laisser la fenêtre d’eau s’ouvrir. | Déplacement réel vers le dock, avec arrivée ou perte des douze passagers. |
| Réserve locale | Collecte de trois secondes, si la réserve est intacte. | Deux lots de carburant chargés. Le premier dossier réussi les conserve une seule fois. |
| Poste de sortie | Décider après les deux inspections et le résultat du bateau. | Compte rendu scellé ou distinction des équipages, puis extraction. |

Les durées ci-dessus concernent des interventions achevées. Un travail commencé ne donne pas son résultat avant la fin. La marée utilise le temps de simulation et s’arrête à la pause. Le cycle comporte basse eau, montée, haute eau et descente. Les quais et les passerelles évitent d’imposer une traversée dangereuse lorsque la fenêtre est défavorable.

## Objets indépendants

Les barges, leurs treuils, leur contenu et le bateau ne partagent pas une seule jauge. Neutraliser un treuil n’impose pas la destruction de sa barge. Une explosion peut cependant toucher plusieurs éléments selon sa portée. Les tirs sur les coques et le bateau produisent leurs dégâts et leurs pertes.

La réserve de carburant possède sa propre condition. Elle n’apparaît pas comme récompense automatique du sauvetage ou du contact avec Vann. Elle peut être ignorée, collectée ou perdue. Une réserve déjà chargée reste chargée si son ancien emplacement est touché ensuite.

## Sources et personnes

| État observé | Ce qui peut être écrit | Ce qui demeure inconnu |
| --- | --- | --- |
| Saisie inspectée avant destruction | Une facture de trafic a été copiée. | Organisation complète du réseau et commanditaires politiques. |
| Saisie détruite avant lecture | Une épave a été constatée. | Noms ou contenu du document détruit. |
| Facture copiée, coque détruite ensuite | Copie conservée et support perdu. | Tout élément qui ne figurait pas sur la copie. |
| Rive-Courte encore en état, contact effectué | Échange réellement obtenu et fonction locale de passeur. | Accord pour toutes les missions futures. |
| Rive-Courte détruite avant contact | Pertes constatées. | Paroles, consentement ou coopération jamais obtenus. |
| Bateau arrivé au dock | Passagers arrivés selon le bilan de la simulation. | Lieu d’accueil futur qui n’aurait pas encore été montré. |
| Bateau détruit | Échec du passage et pertes correspondantes. | Aucun sauvetage hors scène. |

Les pertes restent pertinentes jusqu’à l’extraction. Le choix final ne répare pas une coque, ne recrée pas un document et ne rend pas la vie aux passagers. Le constat d’une épave permet de terminer le dossier sans inventer son contenu.

## Rapport et campagne

Le premier résultat officiel conserve l’état du chenal, les inspections, la facture, le contact, les pertes et la collecte de carburant. Une relecture n’écrase pas ce premier dossier et ne donne pas à nouveau ses lots d’atelier ou de carburant.

Le format v5 ajoute l’état local de Nacre et une réserve de carburant distincte. Les anciens dossiers reçoivent zéro carburant et aucun passage déjà accompli. Les sauvegardes historiques gardent leurs rapports, décisions, usure et ressources. Une reprise MI05 doit conserver la marée, les travaux en cours, les coques, les documents et le bateau dans leur état exact.

Le carburant n’est pas encore consommable dans une autre mission jouable. Son emploi dans MI06 reste un travail identifié. L’interface doit donc parler d’une réserve conservée.

## Portée et limites

Cette mission valide une interaction de référence avec le chenal. Elle ne fournit pas un système de fluides général, un véhicule amphibie, un génie libre ou la résistance structurelle complète des quais. Le module MD02, la traction du marcheur par une Barge Croc VE08, les animations individuelles de passagers et l’art définitif restent séparés de cette tranche.

Les parcours automatisés et leurs limites sont répertoriés dans `tests/mi05-mission.test.mjs`, `tests/campaign-v5.test.mjs` et le bilan de livraison. Les cases de la bible passent à Vérifié seulement après une exécution correspondante. Une capture d’un rendu procédural ou un test de DOM ne remplace pas un essai humain de lisibilité, d’audio ou de difficulté.
