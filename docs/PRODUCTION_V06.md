# ORDRE DE CENDRE — Tranche de production 0.6

**Version 0.6.0 · 11 novembre 2026**

La 0.6 ouvre Nacre avec **MI05, Le prix du passage**. Elle prolonge les quatre sorties de Vesper par une contrainte de terrain, des fonctions de barge séparées, un passage civil et un cinquième dossier. Le [contrat de mission](CAMPAIGN_MISSION_05.md) décrit cette portée. Le [contrat de Nacre](NACRE_CONSEQUENCES_V06.md) développe les trois missions suivantes en conception.

## Ce que cette tranche ajoute

| Domaine | Version jouable | Travail ouvert |
| --- | --- | --- |
| Campagne | MI01–MI05 dans l’ordre, dont MI05 disponible sans PT01. | MI06–MI32, seize contrats et quatre familles de fins. |
| Terrain | Marée cyclique, deux bancs, appuis exposés, passerelles locales et avantage limité des six appuis sur vase. | Fluide général, fatigue de quais, modules d’estran et locomotion amphibie. |
| Barges | Treuils distincts des coques, inspections, facture et contact conditionnés par l’état réel. | Traction du marcheur par la Barge Croc, équipages animés et scènes de dialogue finales. |
| Passage | Bateau de douze passagers, attente de fenêtre, mouvement et bilan de pertes. | Files de bateaux, embarquement individuel, destinations et refuge de MI08. |
| Ressources | Réserve locale de deux lots collectée et conservée une fois. | Dépense de pompe auxiliaire dans MI06, achats et logistique complète. |
| Dossier | Format v5, Nacre, cinquième rapport et compatibilité historique. | Synchronisation entre appareils et formats futurs inconnus. |
| Conception | Contrats détaillés de MI06, MI07 et MI08, lieux, scènes, variantes et conditions de continuité. | Leur simulation, leur rendu et leurs validations. |

Le passage à Nacre conserve la flotte de six châssis, les trois opérations indépendantes, les munitions finies et le radiateur de la 0.5. Les anciens dossiers et les premiers rapports restent protégés. La relecture ne remplace pas la continuité officielle.

## Cohérence des équipages

Vann Ostre apparaît du côté de Rive-Courte, comme navigateur et passeur intéressé. Le trafic documenté appartient à Saisie. Cette distinction conserve son arc et prépare le contrat CT04. Le contact radio ne crée ni alliance globale ni recrutement. Une barge détruite avant inspection ne transmet pas ce qu’elle contenait.

Le choix de rapport porte sur la déclaration à la hiérarchie. L’état matériel continue d’exister. Une copie acquise reste acquise après la destruction du support; une personne perdue reste perdue après une déclaration favorable. Les passagers et le carburant ne sont pas accordés par une simple sélection de dialogue.

## 643 fiches, avec les acquis antérieurs conservés

Le référentiel compte **643 fiches**, soit **62 ajouts**, sur les vingt domaines existants et vingt et un onglets avec la synthèse. Les **581 identifiants de la 0.5** sont conservés.

| Domaine enrichi | Nouvelles fiches | Contenu |
| --- | ---: | --- |
| Vision | 2 | Nouveau monde par ses usages et responsabilité locale. |
| Systèmes | 10 | Marée, passerelles, appuis, treuils, inspections, bateau, carburant et dispositifs futurs de MI06–MI08. |
| Narration | 8 | Vann, facture, compte rendu, arrivées, Mara, balise, portes et sortie d’arc. |
| Assets | 7 | Matières, barges, dock, sons, digue, ambulance et portes. |
| Production | 10 | MI05, dossier, interface, trois missions suivantes, qualité, relations, essai humain et consommation future. |
| QA | 17 | Scénarios fonctionnels, migrations, interface, fichier Excel et perception humaine. |
| Prototype | 8 | Portée exacte des fonctions de cette tranche. |

Les missions et certaines lignes existantes ont été approfondies sans changer d’identité. MD02 et les capacités complètes de VE08 gardent leur statut de conception. Un rendu procédural de barge ne les livre pas implicitement. MI06–MI08 restent conçues malgré leur contrat plus détaillé.

## Validation du classeur

Le fichier est reconstruit depuis `data/bible.json` avec le générateur existant. Sa synthèse conserve les formules de comptage par statut. Le contrôle de source vérifie les valeurs exportées, la conservation des identifiants, les formules calculées, les tables, les validations de statut, les couleurs conditionnelles et les volets.

Le contrôle rapproche **4 409 cellules** des **643 fiches** et retrouve les **581 identifiants antérieurs**. Les **126 formules** donnent les totaux attendus, sans cellule d’erreur; une modification temporaire de statut est recalculée puis restaurée. Les vingt tables, vingt validations, vingt feuilles avec volets et quatre-vingts règles de format conditionnel sont présentes dans le fichier exporté.

Les preuves sont conservées dans [le contrôle d’export 0.6](validation/workbook-v0.6-export.json), [la revue visuelle](validation/workbook-v0.6-visual-review.json) et le rapport `workbook-validation.json`. La synthèse et les lignes des domaines modifiés ont été rendues et relues. Ces vérifications ne constituent pas une exécution native dans Excel ou LibreOffice.

## Validation du jeu et publication

Les tests MI05 couvrent les deux décisions avec les six châssis par commandes publiques, la perte de sources et de personnes, les fenêtres de marée et la collecte exacte. Un contrôle ciblé de contact pied/eau utilise une fixture locale déclarée; il ne représente pas un parcours complet. Les tests du format v5 couvrent les migrations historiques, la reprise et l’unicité du premier résultat. Le [journal de la suite Node](validation/v06-node-tests.txt) conserve le résultat et le décompte final de ces contrôles avec les régressions existantes.

Les [vingt-six parcours d’interface](validation/v06-ui-runtime.txt) exécutent les gestionnaires dans un **DOM modélisé**. Ils incluent l’import v4 vers MI05, la reprise de marée, les deux rapports, la perte du bateau et la sortie sans carburant. Ils ne constituent pas une session Chrome réelle. Les cinq vues MI05 du [manifeste Canvas](previews/mi05-render-manifest.json) montrent le rendu de production alimenté par des états de simulation; elles ne sont pas des captures de navigateur et n’incluent pas le HUD HTML.

Les statuts QA79–QA94 indiquent les contrôles exécutés et leur portée. QA95 conserve l’essai humain de Nacre comme travail ouvert. Les résultats complets de la livraison figurent dans le bilan QA et les journaux de validation. Une navigation réelle après publication doit être consignée séparément, avec l’environnement et les actions observées. Un nombre de scénarios conçus ne vaut pas un nombre de tests réussis.

Le dépôt et le site possèdent leur propre état de livraison. Seuls un commit distant vérifié et un déploiement associé permettent d’annoncer la version publiée. Les détails de publication figurent dans [DEPLOYMENT.md](DEPLOYMENT.md).

## Suite de fabrication

MI06 doit d’abord démontrer le soutien d’un panneau avec ancrage réel, un technicien qui verrouille et une solution sans carburant. MI07 doit démontrer un arrêt protégé, un examen et une récupération de balise avec provenance. MI08 doit démontrer deux portes indépendantes, une pression lisible et des départs effectivement comptés.

La finition de MI01 comme niveau de référence reste ouverte : animation, environnement, audio, interface, performance mesurée et essai humain. La progression du nombre de missions ne remplace pas ce travail. La qualité finale du projet doit être évaluée sur une scène aboutie et un coût de production observé.
