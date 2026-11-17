# 0.15.8 — Des mondes habités

**ORDRE DE CENDRE · 17 novembre 2026**

Cette tranche poursuit le `main` public **`ca5139b276e48be8c20d1d012ec4deefc6130a71`**, reçu en version 0.15.7. Les neuf nouveaux PNG, leur intégration, le classeur et les premiers reçus ont été produits dans la session précédente. La reprise du 17 novembre a retrouvé ce lot dans le checkout `codex/painted-worlds-people-v0158` : elle conserve ses fichiers et termine leur validation et leur préparation de publication, sans les régénérer. Les prompts, sources sélectionnées et empreintes d’origine restent ceux de cette première production.

La [préservation](validation/v0158-preservation.json) rapproche les 2 682 fichiers historiques protégés de la base publique et les neuf nouvelles images de leurs sorties Imagegen sélectionnées. Le [rapport QA](QA_V15_8.md) distingue les reçus de la session précédente des contrôles exécutés après la reprise. La publication GitHub et la disponibilité Vercel sont attestées séparément dans le [suivi de déploiement](DEPLOYMENT.md).

## Ce qui entre dans le jeu

| Lot | Fichiers PNG | Cellules utilisées | Usage réel |
| --- | ---: | ---: | --- |
| Personnes de Nacre | 3 atlas | 28 | Techniciens de la digue, conductrice, soignant et patients de l’ambulance ; réemploi des rôles identifiés au départ d’Aval. |
| Décor de Vesper | 3 atlas | 16 | Quatre matériaux de terrain, six petits décors et six éléments du viaduc ferroviaire. |
| Horizons de Nacre, Thyr et Kharon | 3 panoramas | Sans grille | Fonds peints des trois mondes, cadrés et défilants dans le renderer. |

Les nouveaux atlas apportent **44 cellules**, toutes adressables au rendu, dont **12 poses de marche** pour trois rôles humains. Les cellules sont des états et des pièces, pas de nouveaux habitants. Le catalogue de sprites atteint **77 atlas / 586 cellules**, dont **548 utilisées et 38 références**, dans **16 lots**. Les **trois nouveaux panoramas** sont comptés à part. Le panorama et l’illustration de Vesper déjà présents restent conservés.

## Nacre : personnes, déplacements et pertes

Le nouveau lot habille les personnages déjà suivis par les missions MI06, MI07 et MI08. Les conditions de présence restent celles de la simulation : un patient à bord ne se dédouble pas sur la route, une personne arrivée ne redevient pas un départ en cours, et une perte n’est pas effacée par son dessin.

Les techniciens disposent de poses de marche, d’attente, d’intervention et d’abri. La conductrice et le soignant ont des silhouettes distinctes. Quatre apparences de patients et leurs états de perte accompagnent les brancards existants. Les variations graphiques ne permettent pas de déduire une identité historique qu’un ancien dossier ne conserve pas.

La marche suit la distance réellement parcourue. Son historique appartient à la présentation, hors sauvegarde. Une horloge arrêtée conserve la pose, et la réduction des mouvements désactive les cycles. Les ancrages mesurés posent les pieds et les brancards sur les coordonnées de leur personnage. Les légendes et les indications de dégâts existantes sont conservées.

## Vesper : terrain et voie ferrée

Les textures de roche suivent le profil de `terrainAt`. Les rochers et lichens utilisent des emplacements décoratifs stables. Leur apparence ne crée aucun obstacle et n’altère pas les appuis du marcheur.

La relecture de reprise a révélé des raccords verticaux trop durs entre les tuiles de terrain. Un fondu de 96 unités, attaché aux coordonnées du monde, adoucit désormais ces frontières au rendu. Les PNG, le profil du sol et les contacts physiques restent inchangés. Le [rapport QA](QA_V15_8.md) distingue les premières vues de la réception après ce correctif.

Le viaduc reçoit des pièces peintes pour les supports et la structure du tablier. Ses rails, sa rupture et sa surface de passage restent ceux de MI02. Les poutres rejoignent les points de leur structure existante ; les pièces ne déplacent ni le train, ni la passerelle, ni les harpons.

## Horizons des trois mondes

Nacre ouvre sur un estuaire industriel habité, Thyr sur une vallée forestière et Kharon sur des fonderies ancrées dans le basalte. Chaque panorama de **2 172 × 724 pixels** garde son rapport 3:1. Le cadrage parcourt une portion finie de l’image, sans bouclage ni bord découvert en fin de mission. La réduction des mouvements fixe la vue du panorama au centre.

Ces fonds remplacent les horizons procéduraux de leur planète lorsqu’ils sont chargés. Les décors vectoriels restent disponibles en cas d’échec. La météo et les installations de mission restent séparées du fond. Un bâtiment lointain peint ne devient pas un objet destructible et ne crée aucun effectif de population.

Le cadrage du panorama historique de Vesper emploie également une projection proportionnée. Ses octets et les propriétés publiques du renderer restent compatibles avec les outils antérieurs.

## Fabrication et raccordement

Les PNG sélectionnés sont des sorties **Imagegen intégrées sans modification de pixels**. Les prompts exacts, dimensions, empreintes et mesures des cellules figurent dans les trois dossiers :

- [Personnes de Nacre](../assets/painted/nacre-people/README.md).
- [Décor de Vesper](../assets/painted/vesper-scenery/README.md).
- [Horizons des mondes](../assets/painted/worlds/README.md).

Les loaders et leurs états sont raccordés à `main.mjs`. Les URL littérales permettent au constructeur autonome d’intégrer les octets des PNG. La construction web reprend les mêmes sources. Chaque banque conserve son repli indépendant si une image manque ou ne peut plus être dessinée.

## Périmètre de campagne et suite

La sauvegarde demeure **v14**. Les missions jouables restent **MI01–MI14**, avec six châssis et trois opérations indépendantes. La tranche ne change pas la simulation, les ressources, les preuves, les décisions ou les fixtures historiques. La Bible conserve **1 007 fiches, 21 onglets, tous ses statuts et ses 133 critères initiaux**.

Les missions MI15–MI32, les variantes complètes de factions et de populations, les animations finales, les autres mondes, la recette de campagne intégrale et les essais humains restent des travaux à poursuivre. Le [rapport QA de cette tranche](QA_V15_8.md) précise les contrôles réellement reçus. Le [suivi de déploiement](DEPLOYMENT.md) reste la source de vérité pour la publication des sources, du site et du ZIP.
