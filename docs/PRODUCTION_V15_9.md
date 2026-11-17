# 0.15.9 — Les visages et les berges de Nacre

**ORDRE DE CENDRE · 17 novembre 2026**

Cette tranche reprend les fichiers de la 0.15.8 et le lot de personnages de Nacre commencé après elle. La base publique vérifiée au début du travail est `ca5139b276e48be8c20d1d012ec4deefc6130a71`, version 0.15.7. Le commit local `95564d2` conserve la 0.15.8 ; cinq autres atlas et leur première intégration ont été retrouvés dans son arbre de travail. La copie de reprise est isolée : les anciens checkouts restent disponibles.

Les cinq atlas de personnes sont conservés avec leurs prompts et leurs octets d'origine. Deux atlas de décor Nacre sont produits pendant cette reprise. Le [rapport QA](QA_V15_9.md) donne les contrôles du résultat courant ; les reçus 0.15.8 restent historiques. Le [suivi de déploiement](DEPLOYMENT.md) distingue sources publiées, CI, site et archive.

## Contenu livré

| Lot 0.15.9 | Atlas | Cellules | Utilisées au rendu | Références |
| --- | ---: | ---: | ---: | ---: |
| Habitants et services du quai | 5 | 48 | 42 | 6 |
| Matières et petits décors de Nacre | 2 | 10 | 10 | 0 |
| **Ajout à la 0.15.8** | **7** | **58** | **52** | **6** |

Le catalogue atteint **84 atlas / 644 cellules**, dont **600 utilisées au rendu et 44 références**, dans **18 lots**. Les panoramas restent comptés séparément. Par rapport au `main` 0.15.7 au début de la reprise, la livraison réunit **13 atlas / 102 cellules et trois panoramas**, soit **16 nouveaux fichiers PNG**. Ce décompte décrit des images, poses, pièces et états ; il ne représente pas des personnes ou des missions supplémentaires.

## Huit apparences civiles sur leurs trajets existants

Les habitants de la digue et les réfugiés disposent chacun de deux apparences. L'équipage, la responsable du port, Mara et le personnel sanitaire anonyme possèdent chacun une silhouette distincte. Les huit apparences ont une pose d'arrêt et quatre poses de marche, soit **32 poses de marche**.

MI06 conserve ses dix habitants : ils deviennent visibles en quittant leurs maisons, marchent jusqu'à leur abri et disparaissent une fois accueillis. Leurs pertes exposées utilisent les deux poses correspondantes. Les deux techniciens gardent leurs images 0.15.8.

MI08 conserve son recensement, les accords, les places, les brancards et les passages individuels. Une personne embarquée garde un seul indicateur de pont ; le nouveau lot n'ajoute ni corps devant une coque, ni dépouille aux pertes de cette mission. La conductrice et le soignant identifiés gardent leur apparence 0.15.8. Un ancien agrégat sans identité reçoit une apparence de rôle, sans identité historique inventée. L'équipage anonyme n'est pas assimilé à Vann Ostre.

**Mara n'apparaît physiquement que dans MI08**, lorsque son actrice existante a réellement quitté la phase hors site. Ses interventions de MI06 et MI07 restent radiophoniques. Son atlas n'ajoute ni recrutement, ni présence rétroactive, ni nouvelle rencontre.

Les six poses de perte non utilisées restent explicitement des références. Elles sont exclues de la sélection du moteur. Les [originaux, prompts et mesures](../assets/painted/nacre-civilians/README.md) documentent également les frontières de cellules irrégulières, mesurées dans les gouttières transparentes.

## Des sols et des berges propres à Nacre

Quatre matières peintes couvrent le sol existant : roche humide, limon stratifié, maçonnerie salée et métal de digue patiné. Leur projection suit le profil donné au renderer et leurs raccords sont ancrés dans les coordonnées du monde. Le déplacement de caméra ne déplace pas les textures sur le terrain.

Six petits décors remplacent des emplacements décoratifs déjà utilisés : roche basse, galets salés, fleur de sel pâle, algues courtes, petit bollard et bois de quai usé. Leurs ancrages rejoignent le sol. Les silhouettes restent basses pour préserver la lecture des personnes et des installations.

La fleur de sel et l'algue sont **décoratives dans cette tranche**. Elles n'ajoutent aucun signal fiable de marée, de pompe ou de présence ennemie. Le système final de FL06 reste conçu. Les bancs, les portes, les rampes, la profondeur de l'eau et les contacts des pieds conservent leurs données de simulation. Les [deux atlas et leur intégration](../assets/painted/nacre-scenery/README.md) gardent leurs sources Imagegen sans réencodage.

## Correction de la réduction des mouvements

L'audit a reproduit un défaut de sens de marche : lorsque l'horloge décorative était figée par le réglage de réduction des mouvements, les personnages Nacre ne mettaient plus à jour leur orientation. Une personne avançant à gauche pouvait continuer à regarder à droite.

Le renderer fournit désormais le temps simulé réel à l'observation du déplacement, tout en gardant la sélection de pose d'arrêt sous réduction des mouvements. Le test de régression passe par le véritable `Renderer.render()` et couvre résidents et techniciens MI06, soignant MI07, résident et technicien MI08. Il contrôle les deux directions, la pose immobile, les pieds au sol, la pause et l'absence de modification de la simulation.

## Continuité et périmètre ouvert

La sauvegarde reste **v14**, la campagne **MI01–MI14**, avec six marcheurs et trois opérations indépendantes. La Bible conserve ses **1 007 fiches, 21 onglets, statuts et 133 critères initiaux** ; les descriptions du lot sont actualisées sans fermer de critère humain.

MI15–MI32, les seize contrats, les autres populations et variantes de factions, les animations finales et la réception humaine restent à produire. La nouvelle génération s'inscrit dans l'univers original du projet. Le prototype n'est pas présenté comme un jeu AAA achevé.
