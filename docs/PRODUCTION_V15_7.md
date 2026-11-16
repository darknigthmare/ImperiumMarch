# Production 0.15.7 — Vesper, route vivante et installations de Kharon

**ORDRE DE CENDRE · Chaque pas laisse une trace.**

Cette tranche habille les installations existantes de MI01–MI04, MI09 et MI13. Elle ajoute **13 PNG originaux et 81 cellules**, dont **79 utilisées par le rendu et deux références**. Les quatorze lots réunissent maintenant **71 atlas et 542 cellules**. La campagne conserve quatorze missions, six châssis jouables, trois opérations indépendantes et le dossier de sauvegarde v14.

## Base vérifiée et reprise

La reprise part du `main` public **`154f32961123325e40fd29b29d97b979330243ab`**, version 0.15.6, arbre **`ac67a90e02ef4bf35051397968a66fcd220353d0`**. Cette base contient 58 atlas et 461 cellules. Les mentions antérieures d’une 0.15.7 non publiée n’ont pas permis de retrouver ses fichiers ; les nouveaux PNG de cette livraison ont donc été produits de nouveau. Ils ne sont pas présentés comme les octets d’un ancien lot récupéré.

Les originaux sélectionnés, prompts, dimensions, empreintes, rectangles et ancres sont conservés avec chaque lot. Les indexeurs mesurent les images et produisent des métadonnées ; ils ne retouchent aucun pixel. Deux premières sorties Vesper ont reçu une correction Imagegen de transparence, documentée avec son prompt complet.

## Contenu ajouté

| Lot | Atlas | Cellules | Utilisées | Références | Objets concernés |
| --- | ---: | ---: | ---: | ---: | --- |
| [Vesper](../assets/painted/vesper/README.md) | 6 | 38 | 38 | 0 | Relais militaire, dispensaire, logements, Poste 42, filtres, maintenance, pompe, turbines, radio, treuil, harpons, bornes, conduite et dalles. |
| [Route vivante MI09](../assets/painted/route/README.md) | 3 | 20 | 18 | 2 | Barrière articulée, postes de contact et de rapport, carte, éclairage et camion logistique. |
| [Installations MI13](../assets/painted/foundry-sites/README.md) | 4 | 23 | 23 | 0 | Vannes, grues, consoles, manifeste, ponts thermiques et grilles de vapeur. |
| **Ajout 0.15.7** | **13** | **81** | **79** | **2** | **Trois lots intégrés aux missions existantes.** |
| **Total vérifié** | **71** | **542** | **504** | **38** | **Quatorze lots.** |

Le [reçu de comptage](validation/painted-counts-v0157.json) recoupe les fichiers et manifestes. La réconciliation corrige une ancienne classification : six cellules MI14 — deux poses agenouillées, trois références neutres et l’automate dormant — étaient comptées comme utilisées alors qu’aucun appelant ne les sélectionne. L’alerte de l’automate reste bien utilisée pendant son télégraphe d’attaque. La base corrigée est donc 425 cellules utilisées et 36 références ; l’ajout de 79 et deux conduit à 504 et 38. Les rapports historiques restent intacts.

## Raccords avec la simulation

### Vesper

Les trois familles de bâtiments MI03 possèdent cinq états : actif, coupé, endommagé, coupé et endommagé, détruit. Le dessin lit la santé, la coupure et la destruction existantes. La borne de protection reste un objet distinct : son blindage ne répare ni les murs ni le relais. Les ruines gardent une hauteur réduite.

Dans MI01, la roue du treuil est indépendante de sa carcasse. Les dalles et la conduite sont découpées au dessin pour suivre le terrain existant ; la rupture de la conduite garde sa vraie interruption. Les 24 caisses de filtres n’apparaissent au Poste 42 qu’après la livraison. Dans MI02, le tambour du harpon est séparé et le câble rejoint toujours le train réel, tant que le harpon n’est pas libéré.

MI04 distingue pompe déconnectée ou raccordée, turbine chaude ou refroidie, radio indisponible, disponible ou effectivement appelée. Le rotor tourne autour de l’axe mesuré dans son carter et respecte la réduction des mouvements. Le poste de maintenance a trois états de dommage ; son terminal documentaire garde les opérations et copies existantes.

### Route vivante

La barrière conserve son pivot historique `[-76, -77]`. Sa progression de travail n’est pas convertie en ouverture anticipée ; le bras suit l’ouverture réellement inscrite dans la mission. La carte inspectée montre les deux habitats issus de `homes`. Sa fenêtre utilise la matière de la planche peinte, tandis que le contenu informatif est dessiné depuis les objets simulés.

Le camion suit sa position et ses dégâts existants. Ses roues figurent déjà dans ses corps peints : la roue isolée demeure une référence. La ruine de terminal demeure également une référence, puisque ces postes ne possèdent pas de santé simulée. Les cartes et silhouettes ne créent aucun habitant, animal, décès ou accueil.

### Installations de Kharon

Les vannes montrent leurs travaux et leur ouverture réels ; leurs volants restent séparés. Les grues, consoles et manifeste suivent l’inspection, la copie et le transfert. Les crochets sont des pièces de présentation : les caisses continuent de suivre leurs objets physiques indépendants.

Les ponts épousent `foundrySurfaceAt`. Leur état thermique et les grilles de vapeur lisent les températures et phases existantes ; ni les surfaces porteuses ni les zones dangereuses ne sont déplacées pour convenir aux images.

Les trois modules de chargement exposent leur état dans l’observation de test en lecture seule. En cas d’image absente ou de décodage refusé, les chemins vectoriels restent disponibles. Aucun champ graphique n’entre dans la sauvegarde v14.

## Réception et preuves

Les réceptions de lots décodent les PNG, vérifient les empreintes et rectangles, contrôlent les états et l’absence de mutation de la simulation, puis produisent **30 vues Canvas** : **neuf diagnostics** et **21 scènes obtenues par commandes publiques**. Le pilote MI09 termine la sortie avec les quatre migrateurs et le camion arrivés ; le pilote MI13 termine sa sortie avec PT03. Les scènes Vesper ne revendiquent pas une campagne complète.

| Périmètre | Réception |
| --- | --- |
| Vesper : 38 cellules, cinq diagnostics et neuf scènes publiques | [Rapport QA](QA_PAINTED_VESPER.md) · [reçu](validation/painted-vesper-v0157/receipt.json) |
| MI09 : 20 cellules, deux diagnostics et six scènes publiques | [Guide du lot](../assets/painted/route/README.md) · [reçu](validation/painted-route-v0157/receipt.json) |
| MI13 : 23 cellules, deux diagnostics et six scènes publiques | [Rapport QA](QA_PAINTED_FOUNDRY_SITES.md) · [reçu](validation/painted-foundry-sites-v0157/receipt.json) |
| Bible : données, formules, export et relecture des aperçus | [Guide du classeur](BIBLE_README.md) |

Les scènes Canvas et leurs états JSON sont des preuves de rendu automatisé. La réception Chromium, les parcours du DOM modélisé, la publication distante et un essai humain ont des portées différentes ; leurs résultats et identités sont consignés séparément. Les critères historiques de réception humaine restent ouverts.

La [réception locale complète](QA_V15_7.md) reçoit **795 tests**, **174 comparaisons SVG/Canvas** et **108 parcours du DOM modélisé**, ainsi que les constructions web, HTML et ZIP. Son [reçu](validation/v0157-local-checks.json) conserve les logs et empreintes de source. Le [rapport navigateur](QA_BROWSER_V15_7.md) décrit séparément les blocages de l’environnement et les contrôles distants éventuellement accomplis.

## Bible et distribution

La Bible conserve **1 007 IDs, 21 onglets, 133 critères initiaux et les mêmes statuts**. Les descriptions des fiches concernées et les comptes d’assets sont actualisés ; les nouveaux sprites ne ferment pas automatiquement une fiche de gameplay ou de réception.

Le ZIP complet dépasse maintenant la limite des fichiers Git. L’HTML et le ZIP restent construits localement ; la distribution binaire passe à une **GitHub Release**, avec manifeste et empreintes. L’archive conserve une seule entrée, `Ordre_de_Cendre.html`, et toutes les images originales. Le [contrat de distribution](OFFLINE_DISTRIBUTION.md) décrit les vérifications CRC/SHA-256 et la comparaison de l’HTML avec le manifeste relu. Le [suivi de publication](DEPLOYMENT.md) identifie les commits et déploiements effectivement reçus.

## Périmètre restant

MI15–MI32, les seize contrats, les autres décors, les factions complètes, certains animaux et les animations finales restent à produire. Les arrière-plans et éléments non couverts conservent leur rendu existant. Les 542 cellules sont des pièces, poses et états de présentation ; elles ne représentent ni 542 objets nouveaux, ni des missions supplémentaires, ni une réception humaine finale.
