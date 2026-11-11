# MI09 — La route des vivants

**Planète :** Thyr (PL03). **Acte :** II — Le coût du silence. **Accès :** après le bilan des portes d’Aval en MI08. **Châssis :** WK01, WK02, WK05, WK06, WK09 et WK10. **Dossier :** v9. **Statut de la tranche :** prototype jouable ; essais de réception humaine distincts.

## Situation et portée du constat

Holt demande de dégager une route logistique dans une zone déclarée sauvage. Le terrain contient deux habitats suspendus aux colonnes vivantes, des racines porteuses et une piste de migration qui rejoint les vergers. La carte militaire ne relève pas les habitats. Le poste local explique le rôle des longues-dorses et offre un passage adapté aux appuis du marcheur.

Le relevé de la carte, l’écoute du poste, le trajet des animaux et le rapport constituent des actes séparés. L’ordre choisi ne fait bouger ni la barrière ni le troupeau. L’arrivée au verger, le déplacement vers la zone d’exclusion et la perte d’un animal sont conservés individuellement.

La sortie établit une omission locale et les conséquences physiques d’une route. Elle ne révèle ni PT02, ni TE01, ni le fonctionnement général de PALINODE. Sera reste dans son affectation impériale ; la défection de MI16 n’est pas avancée. Le nom de Leth n’est pas attribué à la liaison locale.

## Un milieu porteur

| Élément | Positions x | Corps simulé | Conséquence physique |
| --- | ---: | --- | --- |
| Colonnes-mères FL07 | 1 260 / 3 560 | Deux troncs, 92 × 420 ; 620 points chacun | Projectiles et explosions les touchent. Détruire une colonne effondre son habitat et détruit sa colonie d’éventails. |
| Racines porteuses | 1 260 / 3 560 | Deux emprises de 340, relief de 28 ; 360 points chacune | Les vrais pieds et la référence de hauteur de coque suivent le relief. Une racine rompue ne porte plus l’habitat qui en dépend. |
| Habitats suspendus | 1 365 / 3 665 | Deux corps de 144 × 94 ; 260 points chacun | Leur support et leur habitabilité sont distincts de l’intégrité du tronc. Ils peuvent être touchés directement. Aucun effectif humain n’est supposé. |
| Éventails de Thyr FU08 | 1 220 / 3 520 | Deux colonies rattachées à leur colonne | Les projecteurs et les flashs proches les dispersent. Le calme les ramène après cinq secondes. Une colonne détruite ne recrée pas son nid. |
| Longues-dorses FU07 | 1 880 / 1 960 / 2 040 / 2 120 | Deux adultes et deux jeunes ; quatre intégrités et destinations | Les individus marchent, perçoivent un bruit proche, ralentissent sous la peur et peuvent être perdus avant leur destination. Un adulte attend son jeune s’il prend trop d’avance. |

Les identifiants `thyr-longue-dorse-1` à `thyr-longue-dorse-4` désignent des animaux observés dans cette scène. Les personnes recensées à Nacre ne deviennent pas des habitants de Thyr. Le poste local est une liaison de scène sans nom propre ajouté au canon. Les habitats n’ont aucun compteur d’occupants : leur destruction ne fabrique ni décès ni survivants humains.

Les éléments FL08, FL09 et les comportements finaux de FU09 ne sont pas promus par cette mission. La simulation n’attribue pas une interaction aux plantes simplement dessinées en décor.

## Gabarit et cadence avec les commandes existantes

Le passage sous la première branche offre une hauteur de 185. La comparaison emploie le gabarit réel de la coque : hauteur du châssis plus demi-hauteur du corps. Vigie et Arpenteur doivent préparer le contournement avant de passer. Les autres profils peuvent emprunter la voie initiale ; leurs pieds restent soumis aux racines et au troupeau.

Le repère à x=850 prépare une voie latérale qui évite la branche et la piste des animaux. Le travail demande un marcheur ancré, immobile et tous ses pieds en contact. Un relevé sans aide prend huit secondes. Une écoute réellement terminée au poste x=540 donne les repères locaux et réduit le travail à quatre secondes. Une approche déjà relevée peut ensuite être améliorée par cette aide.

La voie guidée espace les groupes d’appuis à 1,15 seconde au voisinage des racines et ralentit la progression sur leur relief. Le joueur peut aussi désactiver l’assistance et espacer ses appuis J/L. Une succession plus rapide, sans le balisage guidé, fatigue la racine en fonction de la masse du châssis. Les pieds d’un même groupe ne sont comptés qu’une fois pour cette charge. La station de travail utilise E et l’ancrage Espace ; aucune commande de réglage de hauteur inexistante n’est annoncée.

La géométrie des pieds, les contacts, les positions des racines et le point de référence de coque appartiennent à la simulation. `livingRouteSurfaceAt` fournit au rendu la même hauteur que celle sur laquelle se posent les pieds.

## Postes et opérations

| Poste | Position x | Travail | Résultat vérifiable |
| --- | ---: | --- | --- |
| Liaison des vergers | 540 | Écoute de 3 s | `localsHeard`, puis accès au balisage guidé ; aucun témoignage TE01. |
| Repère d’approche | 850 | 4 s avec aide ou 8 s sans aide, sous ancrage | Contournement préparé, hauteur praticable 300, voie séparée de la piste animale. |
| Commande des projecteurs | 1 660 | Coupure de 2 s | Les colonies peuvent revenir après le calme ; le simple passage du marcheur ne coupe pas la lumière. |
| Commande de barrière | 2 200 ; barrière 2 420 | 6 s sous ancrage après choix | Destination affectée aux animaux vivants et départ physique de la migration. |
| Cartes de route | 2 680 | Relevé de 3 s | Deux habitats omis consignés ; ouverture du choix de route. |
| Commande logistique | 3 020 ; véhicule 2 860 | Départ de 3 s après résolution du troupeau | Le transport est libéré ; il reste à l’escorter jusqu’à 5 500. |
| Poste de bilan | 5 660 | Transmission de 3 s | Rapport après troupeau résolu, transport arrivé et deux tireurs neutralisés. |
| Sortie orientale | 6 060 | Approche avec tous les objectifs achevés | Fin de la mission et premier reçu officiel. |

S’éloigner d’un poste interrompt son travail. Quitter l’ancrage ou lever un pied interrompt aussi les opérations qui exigent un support. Une progression interrompue n’est pas une opération accomplie. Le choix ne commence pas automatiquement le travail de barrière.

La barrière détruite laisse une brèche, mais ne décide pas de la route des animaux. Une pose manuelle des guides prend huit secondes au même poste, sous ancrage. Cette solution ne répare ni l’intégrité ni le passage traditionnel détruit.

## Deux routes, quatre destinations effectives

| Choix | Affectation après manœuvre | Destinations x | Conséquences possibles |
| --- | --- | --- | --- |
| `obey` | Couloir impérial ; troupeau vers l’exclusion | 3 260 / 3 340 / 3 420 / 3 500 | Les individus arrivés restent vivants et comptent comme déplacés. Ils ne fertilisent pas les vergers. La récolte est fragilisée. |
| `defy` | Passage traditionnel maintenu ; logistique en attente | 4 660 / 4 740 / 4 820 / 4 900 | Chaque arrivée au verger est conservée. Le passage féconde les cultures ; les pertes et les appuis détruits ne sont pas effacés. |

Les animaux ont une vitesse maximale de 64 unités par seconde, réduite à 18 lorsqu’ils sont très effrayés. Ils ne sont jamais téléportés sur le choix ni sur la fin du travail. La peur provient d’un bruit situé à moins de 520 ; elle retombe quand ce bruit cesse. La protection des jeunes est une condition locale de déplacement, sans perception d’un adversaire à l’autre bout de la mission.

Un individu est terminal lorsqu’il est arrivé au verger, déplacé dans l’exclusion ou perdu. Les quatre termes du bilan doivent être résolus avant la suite. Les individus parvenus à leur destination ont quitté le corridor exposé et ne subissent pas de dégâts rétroactifs. Ceux perdus avant le départ conservent leur destination non sélectionnée et leur position d’origine ; aucune arrivée n’est reconstituée.

`cropsFertilized` devient vrai après au moins une arrivée effective au verger. Il ne garantit pas une saison entière. `harvestFragile` est vrai après résolution si moins de quatre animaux ont atteint le verger, si une colonne est détruite ou si une colonie d’éventails est perdue. `passagePreserved` exige la route du verger, une barrière manœuvrée et intacte et les deux racines encore présentes. Ces faits sont calculés séparément.

## Tireurs et logistique

Deux tireurs d’élite prennent position à x=4 080 et x=5 200 après manœuvre de la barrière et résolution complète des animaux. Leurs emplacements sont réservés dans la sauvegarde ; avant ce déclenchement, ils ne sont ni présents dans le monde actif ni des cibles endommageables. Le rendu doit respecter cette même condition.

Ils annoncent leurs tirs par une préparation de 1,4 seconde, puis tirent à une portée de 960. Ils peuvent viser le transport s’il est sorti et plus proche que le marcheur. Les colonnes, les racines et les habitats interceptent les projectiles : tirer à travers un habitat pour atteindre un adversaire est un dommage réel.

Le transport commence à x=2 860 et atteint réellement le dépôt à x=5 500. Il suit le marcheur à une distance comprise entre 135 et 850, attend une menace proche et ne roule pas sous un pied annoncé en descente. Il possède sa propre intégrité de 720. Sa perte termine la sortie en défaite ; le choix de route, les animaux arrivés et les dommages déjà causés restent dans le point de contrôle. Une arrivée acquise sort le véhicule du corridor exposé et interdit des dégâts rétroactifs.

L’escorte peut échouer par perte du transport ou immobilisation du marcheur. Un rapport n’est pas transmis à la place d’une arrivée. La mission s’achève seulement après le bilan matériel puis l’extraction.

## Contrat de sauvegarde et reçu

Le domaine `game.livingRoute` n’existe que dans MI09. Il contient les colonnes, racines, habitats, colonies, animaux, barrière, transport, postes, état d’alerte et dernier bruit local. Les anciens modèles de missions ne reçoivent pas un champ `livingRoute: null`.

Le contexte hérité comprend uniquement la présence du rapport MI08, son choix, son nombre d’arrivées au refuge et ses pertes. Un rappel radio peut lire ces données ; il ne s’agit pas d’un nouveau recensement. Le dossier durable est `world.thyr.route`, initialement non visité lors de la migration d’une ancienne sauvegarde. Les scènes et reçus historiques MI01–MI08 restent inchangés.

La sauvegarde conserve les travaux en cours, les positions individuelles, les destinations, la peur, les appuis, les dommages et les munitions. Un instant repris au milieu de la manœuvre ou du déplacement doit évoluer exactement comme l’original soumis aux mêmes commandes. Les données dérivées sont rapprochées des objets physiques : un compteur d’arrivées isolé ne suffit pas.

`livingRouteReceiptRoster` copie profondément tous les objets de Thyr et le bilan de chacun des deux tireurs. Le premier rapport fait foi. Une relecture ne remplace pas ce reçu et ne redonne pas la dotation. Un point de contrôle terminal en défaite reste terminal après reprise ; une ancienne scène ne restitue pas un transport ou un animal perdu dans la sortie officielle.

## Vérifications livrées

`tests/helpers/mi09-driver.mjs` pilote par déplacement, visée, tir, ancrage, interaction et choix publics. Il ne modifie directement ni position, ni santé, ni horloge, ni résultat. Ses captures copient profondément l’état au moment demandé.

`tests/mi09-simulation.test.mjs` vérifie les douze combinaisons des six châssis et des deux routes, les contacts physiques sur racines, le gabarit haut, la cadence manuelle, l’écoute et le guidage, la dispersion locale des éventails, le choix sans manœuvre distante, la reprise exacte, l’absence préalable des tireurs, les avaries des appuis et de la barrière, les pertes du troupeau, la terminalité des destinations, la perte logistique et la défaite sous des tirs effectifs. Les tests de dossier, de migration v8 et de reçu complètent ces parcours dans les suites de campagne.

Les scènes exportées par `tools/render-mi09-previews.mjs` sont des états réellement atteints par ce pilote, rendus par Canvas. Leur manifeste décrit les sources et le point de capture. Elles ne constituent pas une preuve de clic natif, de manipulation humaine, d’enregistrement vocal ou d’essai avec un matériel de contrôle. Les éventuels contrôles dans un navigateur réel ont leur propre provenance.

## Limites de la tranche

Le milieu est une simulation simplifiée en vue latérale. La voie préparée représente un contournement balisé ; elle n’ajoute pas une caméra ni un pilotage en profondeur. Les populations des habitats, les contrats CT05/CT06, les cultures sur plusieurs saisons, la propagation du feu, les interactions finales des autres espèces, les voix humaines et l’équilibrage par des joueurs restent à produire. Une fertilisation locale constatée n’annonce pas une récolte future certaine.
