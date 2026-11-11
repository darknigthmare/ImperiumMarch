# Production 0.11 — Le champ que personne n’a semé

**ORDRE DE CENDRE — Chaque pas laisse une trace.** La 0.11 poursuit Thyr avec MI10 et le dossier de sauvegarde v10. Dix missions de campagne, six châssis et trois opérations indépendantes sont jouables au stade prototype. Le champ chimique relie combat, prélèvement matériel, écoulement et préservation des canaux ; les conséquences restent inscrites au dossier.

## Livrables de cette tranche

| Domaine | Réalisation | Portée réelle |
| --- | --- | --- |
| MI10 | Trois cuves, collecteur amont, confinement, prélèvement, registre, forces privées, ordre, pontages, eau, transmission et extraction. | MI11–MI32 et les seize contrats restent conçus. Le choix administratif ne réalise aucune opération physique. |
| Matière | Trois stocks initiaux de cent unités, fuite, nappes en déplacement, bassin distinct, contamination cumulative et prélèvement de cinq unités. | La conservation des volumes est vérifiable. Le bassin ne possède pas de simulation de destruction ; aucune dépollution n’est inventée. |
| Défense | Trois forces privées deviennent présentes après leur délai d’arrivée. Le prélèvement demande vingt secondes effectives dans la zone de protection. | Le temps de pause et le dialogue ne font pas avancer le travail. Une source perdue avant collecte ne peut pas être reconstituée. |
| Preuve PT02 | Prélèvement accompli, trois marquages copiés et registre matériel conservé. | Cette pièce relie le produit aux terraformes d’Orison. Elle n’établit ni TE01, ni toute la chaîne de financement ou de commandement ; la défection reste prévue à MI16. |
| Canaux | Deux couvertures portent les pieds réels. Le bilan distingue intégrité, couverture, contamination, circulation de l’eau et habitabilité. | Couvrir ne dépollue pas. Rétablir la circulation ne reconstruit pas un habitat détruit et ne rend pas propre une eau contaminée. Aucun effectif humain n’est supposé. |
| Sauvegarde v10 | Migration depuis une fixture v9 authentique, reprise du travail, bilan physique, premier rapport conservé, relecture isolée et dotation unique. | Les neuf anciens rapports, le carburant, la flotte et les scènes historiques sont conservés. La dotation de MI10 ajoute quatre lots une seule fois. |
| Interface | Briefing, instrument du champ, trois objectifs prioritaires visibles, dialogue, bilan, archives et atelier. | Les faits matériels et le plan retenu restent distincts. La réception dans un DOM modélisé et la réception Chrome possèdent des preuves séparées. |
| Graphisme original | Six composants, vingt-quatre SVG et deux planches PNG ; mêmes formes dans les exports et le renderer Canvas. | Les planches sont des bancs graphiques. Les vingt-deux scènes Canvas sont identifiées comme telles, sans les présenter comme des captures de navigateur. |
| Bible | 873 fiches sur 21 onglets, 28 ajouts, 845 identifiants antérieurs conservés. | Le registre garde les 133 critères initiaux et leurs exigences. Le nombre de fiches ne mesure pas un pourcentage d’achèvement du jeu. |

Le [contrat de MI10](CAMPAIGN_MISSION_10.md), le [contrat du dossier v10](CAMPAIGN_SAVE_V10.md) et le [guide des éléments graphiques](../assets/chemical/README.md) détaillent les opérations et leurs limites.

## Ce que le joueur accomplit

L’ordre de Holt demande la destruction d’une réserve attribuée aux rebelles. Le joueur découvre trois matières différentes. Il doit relever chaque marquage, maîtriser la fuite et obtenir le registre matériel. Le collecteur amont peut envoyer les nappes dans un bassin séparé ; la fermeture est plus rapide si le guidage local a réellement été accompli pendant MI09.

Le prélèvement lance une opération exposée. Les forces privées ne sont actives qu’après leur arrivée effective. Quitter la zone interrompt le travail ; perdre la source ou l’appareil avant la collecte empêche l’obtention de l’échantillon. Une perte constatée permet de poursuivre le rapport, sans fabriquer une preuve absente. Une copie et un prélèvement déjà conservés restent à bord après la destruction de leurs originaux.

Le poste d’ordre propose la démolition ou la mise en sécurité. Chaque cuve encore intacte demande ensuite sa propre intervention. Un rapport qui clôt une sortie avec des cuves perdues ne prétend pas qu’elles ont été isolées. Les volumes libérés continuent leur trajet ; une décision ne les efface pas et une vanne détruite ne fait pas disparaître les masses déjà retenues dans le bassin.

Les deux canaux demandent un pontage avant un passage protégé. Le joueur peut rétablir la circulation après résolution des écoulements, puis transmettre le bilan. L’extraction reste un déplacement physique. Un déversement tardif après transmission verrouille de nouveau la sortie jusqu’à sa résolution ; le rapport final reflète les dégâts réellement survenus.

## Réception et preuves

La [validation 0.11](QA_V11.md) réunit **440 tests Node réussis, 71 parcours du script autonome en DOM modélisé et 64 comparaisons raster SVG/Canvas**. Les 193 tests de campagne, dont 47 nouveaux MI10, sont inclus dans la suite globale. La [preuve de simulation MI10](previews/mi10-simulation-validation.json) consigne 34 tests ciblés, douze parcours complets couvrant les six châssis et les deux conduites, ainsi que 828 contrôles de conservation de matière. Ces contrôles restent des essais automatisés.

Les [scènes Canvas](previews/mi10-scenes.json) proviennent de dix-sept sorties conduites par commandes publiques, dont les cas de pollution et de perte de source. Le [reçu de rendu](previews/mi10-canvas-validation.json) conserve les empreintes de sources et d’images, la copie profonde des états et l’absence de mutation par le renderer. Les quatre exports associés permettent la reprise de scènes préparées ; ils ne constituent pas des parties natives déjà jouées.

Le [registre 0.11](PRODUCTION_REGISTER_V11.md) relie les livrables aux critères et aux preuves. La [réception du classeur](BIBLE_README.md) distingue la correspondance des cellules, les formules recalculées, la revue visuelle des pages et l’usage interactif dans Excel ou Calc. Le [suivi de publication](DEPLOYMENT.md) identifie séparément le snapshot, le commit public, la CI, le déploiement et les ressources réellement servies.

## Travail restant inscrit

AS18 conserve sa portée de prototype. AS21 n’est pas achevé par les seuls éléments végétaux et animaux de Thyr. PR18 exige encore les missions MI11–MI16 et les contrats de l’acte II ; PR17 garde notamment les quatre contrats de l’acte I. Les six autres châssis, les composants ennemis, les voix, l’animation finale, les performances sur matériel déclaré et les essais humains restent suivis dans leurs fiches.

Le [protocole humain de MI10](PLAYTEST_CHEMICAL_V11.md) et son [formulaire vierge](validation/human-mi10-session-template-v11.json) préparent une réception sans guidage. PR88 et QA179 restent ouverts tant qu’une session réelle n’a pas produit ses observations. QA19, QA20 et QA29 conservent leurs limites natives et bureautiques antérieures ; les nouveaux contrôles automatiques ne les clôturent pas.
