# Dossier de campagne v10 — le champ chimique de Thyr

## Migration additive et lecture protégée

Le format reste `ordre-de-cendre.campaign`, la clé principale `imperium.campaign.v1` et la clé de secours `imperium.campaign.v1.backup`. Le dossier **version 10** accepte les versions historiques 1 à 9. La lecture ne réécrit jamais le stockage ; la première écriture d’un dossier ancien valide conserve son texte d’origine dans la clé de secours. Une version future, un format inconnu ou une taille non prise en charge protège le dossier principal contre son remplacement automatique.

La migration **v9 → v10 ajoute uniquement `world.thyr.chemical` vide et le numéro de version 10**. Elle conserve `stage`, les neuf premiers reçus lorsqu’ils existent, le bilan courant, les checkpoints et points avant décision, leurs horloges et graines, les positions, les dégâts, les commandes, les munitions, le parc, les relations, l’entretien et les ressources. L’ajout ne donne ni prélèvement, ni marquage, ni provenance, ni carburant.

Un ancien dossier `stage: complete` conserve cette valeur. La progression cherche le premier rapport manquant : MI10 après neuf rapports, MI09 après huit, même lorsque le fichier a déjà traversé une précédente migration. Une mission active conserve sa priorité jusqu’à sa fin ou son redémarrage explicite. Les anciennes migrations continuent de s’appliquer dans leur ordre avant l’unique addition du domaine chimique.

Un prétendu dossier v9 contenant déjà un rapport MI10, une mission active MI10, un checkpoint `chemical` ou `world.thyr.chemical` est refusé. Les champs futurs ne sont pas supprimés pour rendre le fichier acceptable.

## Fixture v9 authentique

`tests/fixtures/campaign-v9-mi09.json` conserve deux exports réels de Chrome archivés dans la publication 0.10 :

| Variante | Source historique | État reçu |
| --- | --- | --- |
| `live` | `docs/validation/native-v10/native-v9-focus-export.json` | MI09 en cours, huit rapports ; la portée de cette capture ne ferme pas QA19. |
| `completed` | `docs/validation/native-v10/native-v9-after-reload.json` | MI09 terminée puis effectivement rechargée, neuf rapports ; sa réception distingue l’état préparé de simulation des gestes natifs d’extraction, export et rechargement. |

Le commit public d’archivage est **`4846d0270b2976877f9b202848bfde6d2127fb1d`**, arbre **`ef7b912c27fa672f1930c980ee529c165e3f77ec`**. La source applicative des observations natives est `158a10f7e963f3f5effbb71fc3e8b4588d209d5a`. Les 1 099 blobs du snapshot immuable `publication-v10-final-reviewed` ont été vérifiés contre l’arbre public avant copie.

Aucun module de gameplay actuel ou historique n’a été exécuté pour fabriquer ces états. Les deux contenus ont été copiés depuis leurs exports natifs et comparés profondément. Les huit anciennes fixtures de campagne et les exports d’origine sont conservés octet par octet ; aucun fichier v1–v8 n’est régénéré.

La fixture v9 mesure **246 853 octets**, SHA-256 **`d5f6f49a02e8fb40f5bf830c7fcb40c5e2677dff3e2b0e0dbb7ea1a48ce42084`**. Les empreintes des sources, leurs blobs Git, les huit fixtures protégées et le reçu de publication sont consignés dans [l’attestation historique](validation/v011-historic-v9.json).

Un troisième export natif, `native-v9-after-upgrade.json`, conserve `stage: complete` avec seulement huit rapports. Il est testé directement pour vérifier que MI09 reste la première mission manquante. Il n’est pas modifié pour le transformer en état à neuf rapports.

## Ouverture et contexte

MI10 s’ouvre uniquement après le premier reçu MI09. Son contexte exact comporte cinq champs :

| Champ | Provenance / effet |
| --- | --- |
| `routeRecorded` | Présence du rapport MI09. |
| `routeChoice` | Premier choix `obey` ou `defy`, ou `none` hors héritage. |
| `routeApproach` | Approche réellement acquise : `unprepared`, `surveyed` ou `guided`. Seul `guided` réduit la fermeture du collecteur de 5 à 3 s. |
| `routePassagePreserved` | Continuité matérielle inscrite au premier rapport de la route. |
| `routeHarvestFragile` | Fragilité des cultures constatée à la fin de MI09. |

Ce contexte ne contient aucun nouvel acteur. Les quatre longues-dorses de MI09 et les personnes de Nacre gardent leurs scènes et leurs rapports. Deux maisons locales ne deviennent pas deux personnes. Aucune TE01, défection ou conclusion globale PALINODE n’est importée dans le domaine chimique.

## Trois niveaux de données cohérents

`game.chemical` porte les objets individuels : trois cuves, collecteur, poste de confinement, préleveur, registre, poste d’ordres, deux canaux, deux maisons, poste d’eau, poste de rapport, fuite en attente, nappes et état d’alerte. Les corps destructibles ont une santé, une capacité et une date de destruction ; les travaux ont une progression et des dates ; les copies et les pertes ont leurs propres traces.

`game.campaign` porte les faits dérivés de ces objets, le plan `unselected` / `demolish` / `secure`, la phase, le contexte et l’état du tutoriel. Les objectifs, la preuve générique et l’extraction doivent être cohérents avec ces faits.

`world.thyr.chemical` est le dossier durable du premier rapport. Il contient le plan, les faits finaux, les volumes et `roster`, une copie profonde de la scène et des trois forces privées. Avant tout rapport, il demeure exactement vide : valeurs nulles ou initiales du dossier, et `roster: null`. Un état en cours ne se substitue pas à un premier reçu.

Le reçu final conserve notamment les inspections et marquages, les cuves intactes isolées et celles détruites, la source restante, le confinement, les masses libérées/retenues/livrées/en transit, les deux canaux et leurs expositions, les maisons habitables, la disposition de l’eau, les copies, le prélèvement, PT02, l’alerte, les trois neutralisations et la transmission. Le dossier durable et le bilan courant doivent correspondre exactement à ce reçu.

## Validation matérielle

`src/chemical-validation.mjs` rapproche les déclarations des objets. Le contrôle porte sur les identifiants, rôles, capacités, géométries, états de santé, nombres d’objets, types, clés autorisées, préconditions et dates. Les corps ne sont pas créés ou déplacés par un import ; les capacités privées doivent provenir d’une même difficulté.

Le bilan réconcilie les 300 unités initiales, cuve par cuve, avec les cinq unités prélevées lorsqu’elles existent, les stocks, la fuite en attente et les nappes. Un bilan de masse équilibré ne suffit pas : le débit doit correspondre à l’horloge et au confinement, les positions et arrivées aux durées de trajet, et une nappe ne peut traverser un collecteur fermé lors de son passage. Les deux expositions de canal sont recalculées depuis les dépôts de toutes les nappes.

Une inspection après destruction est un constat sans marquage. La copie du registre doit précéder la perte de son original ; les vingt secondes du prélèvement doivent précéder la collecte ; celle-ci doit précéder la perte de la source ou de l’appareil. L’alerte garde sa première cause et son délai de cinq secondes. Les travaux, relevés, pertes ou collecte, arrivée des forces et disposition de l’eau doivent précéder la transmission correspondante. La tolérance d’arrondi est bornée au pas public maximal de simulation de 50 ms.

PT02 est recalculée comme `sampleCollected && copiedMarks === 3 && orisonRecordCopied`. Modifier ensemble le reçu, le dossier du monde et le bilan n’autorise pas une preuve sans matière ni provenance. Des copies acquises restent valides lorsque leurs originaux ont ensuite disparu. Le code ne transforme pas un prélèvement perdu en défaite automatique : la sortie peut finir sans preuve matérielle complète.

Les effets tardifs sont conservés. La matière captée reste dans le bassin distinct après ouverture ou rupture de sa vanne. Un nouveau déversement après transmission peut fermer l’extraction jusqu’à sa résolution, sans effacer l’ancien acte de transmission. Couvrir un canal ou remettre l’eau en circulation ne nettoie pas ses dépôts et ne répare pas sa structure.

## Reprise et sortie officielle

Le checkpoint conserve toute la simulation : objets, progression des travaux, horloge, générateur aléatoire, pieds, radiateur, coque, munitions, projectiles, événements et commandes. La restauration en retourne une copie détachée. Les essais publics vérifient une continuation identique depuis la manœuvre du collecteur, le prélèvement sous attaque et la matière en transit.

La sortie officielle ne peut pas changer de châssis, de graine, de difficulté ou de contexte. Son horloge ne recule pas, son choix acquis ne s’annule pas, ses copies et pertes ne disparaissent pas. Un checkpoint ultérieur ne restaure pas la santé d’un objet, un volume consommé, une force neutralisée, un canal pollué ou une nappe disparue. Les dates historiques restent conservées ; une masse arrivée ou retenue ne repart pas.

Le point avant choix n’est jouable que s’il reste exactement identique au checkpoint officiel. Un choix instantané bloque donc déjà le retour, même sans changement d’horloge. Un point historique peut être conservé comme archive sans redevenir une reprise qui efface les conséquences.

Une coque détruite produit un checkpoint `lost`, conservé à l’import. Les commandes ne le réaniment pas et une sauvegarde plus ancienne ne le remplace pas dans la même sortie. Un redémarrage explicite ouvre une nouvelle sortie avec le stock de campagne restant ; il ne crée aucun rapport ni récompense.

## Premier reçu et ressources

Le premier succès attribue **quatre lots d’atelier**. Dix succès sans dépense donnent au maximum **46 lots**, en incluant les six lots initiaux. MI10 ne collecte ni ne consomme de carburant : le stock et la dépense cumulée de Nacre gardent leur sens historique.

Le rapport final conserve les pièces réellement obtenues, y compris l’absence de PT02. Réenregistrer la même victoire ne paie pas de nouveau. Une relecture peut obtenir un meilleur résultat local, mais elle ne remplace pas le premier reçu, ne complète pas rétroactivement sa preuve et ne change ni ressources, ni parc, ni relations. Le reçu possède ses propres copies et ne suit pas les mutations d’une autre simulation.

## Vérifications et portée

[La suite campagne v10](../tests/campaign-v10.test.mjs) vérifie l’authenticité de la fixture, les dix-huit variantes historiques, la migration exacte, la conservation du stockage, les refus de versions futures, la progression, les douze combinaisons châssis/choix, les reprises, les pertes, la prime unique et les falsifications synchronisées de reçu/monde/bilan.

Les résultats et empreintes effectivement testés sont consignés dans [le reçu campagne 0.11](validation/v011-campaign-validation.json), avec le [journal TAP](validation/v011-campaign-tests.tap). Les suites antérieures gardent leurs invariants ; seules les attentes mécaniques de version, de liste des missions et de prochaine mission évoluent.

Ces contrôles établissent une cohérence matérielle et chronologique du prototype. Un JSON n’est pas une preuve cryptographique de toute l’histoire d’une partie. Les parcours de simulation, les rendus Canvas, les gestionnaires de DOM modélisés et les observations natives dans Chrome conservent des provenances distinctes ; aucun de ces tests ne remplace un essai humain ou une manette réelle.
