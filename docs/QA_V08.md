# Validation de la version 0.8

Ce document distingue les tests de simulation, les transitions d’interface dans un DOM modélisé, les rendus Canvas, le classeur et l’exécution dans Chrome. Une réussite dans une catégorie ne prouve pas les autres.

## Périmètre

La 0.8 ajoute MI07, **Une ambulance sans escorte**, aux six missions précédentes. Les six châssis et les trois opérations indépendantes sont conservés. MI08–MI32 et les seize contrats restent conçus. La nouvelle mission reste un prototype : ses interactions vérifiables ne constituent pas une finition commerciale, une certification de performance ou un essai humain.

## Résultats exécutés sur les sources figées

| Contrôle | Résultat |
| --- | --- |
| Suite Node locale | **212 tests réussis**, zéro échec, zéro ignoré ; Node **v24.22.1**. |
| CI du correctif publié | **212 tests et 45 parcours UI réussis**, Node **v22.23.4**, commit `816a02aec27c5286e20b705fbf234caa269968fb`. |
| Nouveaux tests MI07 | **22 tests**, dont six châssis × deux destinations et repli par remorquage. |
| Nouveaux tests de dossier v7 | **14 tests** : migrations, cohérence, reprises, classement unique et échec terminal. |
| Interface du script autonome | **45 parcours réussis** dans le DOM modélisé, dont onze nouveaux flux MI07. |
| Audit indépendant du dossier | **18 variantes réussies**, **3 054 checkpoints JSON** et **1 878 restaurations exactes**. |
| Contrôle statique UI | **150 IDs uniques**, **139 références littérales**, cinq vues, quatre onglets d’archives et six dialogues. |
| Construction autonome | Six modules intégrés, compilation du script et ressources embarquées contrôlées. |
| Construction web | `web-dist` produit sans dépendance d’exécution supplémentaire. |
| Catalogue | 769 fiches, vingt domaines, six châssis, trois opérations et sept missions de campagne. |
| Aperçus MI07 | Neuf rendus Canvas inspectés et neuf états complets indépendants. |

Les journaux [Node](validation/v08-node-tests.txt), [UI](validation/v08-ui-runtime.txt) et [audit indépendant](validation/v08-campaign-audit.json) conservent les résultats. Les empreintes de livraison identifient l’état utilisé. L’audit indépendant emploie WK09, la graine 1847 et la marche assistée ; la matrice des six châssis appartient aux tests de gameplay séparés.

Le contrôle a corrigé un chevauchement des points radio dans le pilote facultatif : ignorer Mara tout en demandant l’aide technique n’appelle plus Mara. Un onzième flux UI vérifie aussi le clic tactile immédiatement suivi d’une pause, sans avancer une seule frame : les faits et le checkpoint sont cohérents dès l’interaction publique.

## Sauvegardes et provenance

La fixture v6 provient du snapshot public final 0.7 `bc830013455bb8f71e1eaf0316173ac0e91746f8`. La totalité de ses 263 fichiers a été réconciliée au manifeste avant d’importer ses seuls modules historiques. La nouvelle fixture contient une vanne MI06 à 35 %, la continuation réussie du même état et une réussite distincte avec véritable étai manuel.

| Variante historique | État de la digue | Carburant stock / cumul |
| --- | --- | --- |
| `live` | Vanne en cours, panneau verrouillé, dix habitants sauvés, deux techniciens | 0 / 2 |
| `completed` | Dérivation achevée, panneau verrouillé, deux maisons habitables | 0 / 2 |
| `manualCompleted` | WK06, étai manuel, zéro verrou, dix habitants sauvés, deux techniciens | 2 / 0 |

La fixture a pour SHA-256 `e7ea0548ce459ef3a7d378a1892b7bfde4c591630eaec1e67c99c8b75e95b12c`. Les fixtures v1 à v5 ne sont pas réécrites. La migration v7 doit conserver ces objets intégralement et ajouter seulement le dossier sanitaire non visité, avec le nouveau numéro de format.

## Matrice de vérification

Les tests de simulation MI07 vérifient les six châssis, les deux destinations, les interactions distinctes, l’arrivée réelle, les dégâts et les solutions de constat. Les sauvegardes couvrent l’héritage des deux rampes, les travaux partiels, les anciennes versions, le refus de faits contradictoires, le premier rapport unique et la relecture indépendante. Un stimulus de projectile de calibration est explicitement identifié lorsqu’il sert à provoquer un échec terminal ; il ne représente pas une partie de combat naturelle.

Les parcours d’interface exécutent le script autonome et ses gestionnaires dans un modèle de DOM. Les appels Canvas sont neutralisés. Ce contrôle vérifie import, lancement, clavier, pause, reprise, décision, bilan, atelier et archives, mais ne mesure ni CSS, ni images, ni audio, ni dialogues natifs, ni fréquence d’affichage.

Les rendus Canvas sont produits depuis des scènes atteintes par commandes publiques. Le manifeste conserve une copie profonde de chaque état et le renderer est contrôlé pour ne pas modifier la simulation. Ces images ne doivent pas être présentées comme des captures de navigateur.

## Classeur

L’export final contient **769 fiches et 5 225 cellules source réconciliées**, conserve les **705 IDs** précédents et ajoute 64 fiches. Ses 21 onglets comprennent vingt tables, vingt validations de statut, vingt feuilles de données à volets figés, 80 règles conditionnelles et **126 formules calculées sans erreur**. La modification temporaire d’un statut, le recalcul et la restauration sont contrôlés. **Vingt vues de douze onglets** ont été relues.

La répartition finale est **292 Conçu, 244 Prototype, 133 À produire, 100 Vérifié**. QA116–136 sont vérifiées dans leur portée explicite ; QA137 et QA115 gardent les essais humains ouverts. La baseline v07 authentique et les fallbacks v06/v05/v04 sont contrôlés sans Git ; une révision inconnue est rejetée.

Le SHA-256 du XLSX final est `726c2d8a3464af1cd934574942da5c2ccc0cbfc0dcf12d5874fa26deb30835cb`. Les preuves se trouvent dans les rapports `docs/validation/workbook-v0.8-*` et les empreintes figées dans [v08-release-checks.json](validation/v08-release-checks.json).

Les contrôles du véritable XLSX réconcilient ses fiches et cellules avec `data/bible.json`, ses identifiants historiques, ses formules, tables, validations, règles conditionnelles et volets. Les aperçus produits par le moteur de classeur servent à la relecture visuelle. Ils ne constituent pas une exécution native dans Excel ou LibreOffice.

## Publication et navigateur

Les [reçus de publication](validation/v08-publication.json) comparent le snapshot figé à l’arbre distant complet, confirment la CI et le SHA exact du déploiement Vercel, puis vérifient les octets des dix ressources servies. Les observations réalisées dans Chrome partagé sont consignées séparément dans [v08-browser.json](validation/v08-browser.json), avec les points préparés, les actions réellement effectuées et les limites du parcours.

Le [contrôle natif initial](validation/v08-browser-initial.json), sur le commit publié `d79dd2fe832920794d1265271a4bf9cedaca9637`, a confirmé la migration v6 vers v7 : l’ensemble du dossier historique est inchangé après rétablissement du numéro v6 et retrait du nouveau dossier sanitaire. Les six rapports, les ressources et le registre de carburant restent identiques. MI07 a été lancée par l’interface, puis un point de transfert atteint par commandes publiques dans Node a été importé par le sélecteur de fichier.

Les exports réels avant et après rechargement conservent exactement le checkpoint complet, avec un travail de chariots à 36,664 %. Seul le compteur de captures passe de 117 à 119. La progression visible reprend ensuite avec les frames réellement exécutées. Cette première observation a aussi révélé deux cartes Canvas superposées au HUD gauche ; la [capture avant correction](previews/browser-v08-transfer-before-fix.jpg) conserve ce défaut.

Le correctif déplace les cartes sanitaires dans une colonne centrale. Les neuf états complets et leurs métadonnées de scène restent strictement identiques ; les PNG sont régénérés et relus. Les constructions et contrôles requis sont repassés, puis la CI du commit corrigé a réexécuté les 212 tests et les 45 parcours UI. Simulation, campagne, contenu, gestionnaires d’interface et classeur restent inchangés.

### Parcours natif final

Chrome partagé a ouvert le correctif publié `816a02aec27c5286e20b705fbf234caa269968fb`, au viewport **1363 × 936**. La [capture corrigée](previews/browser-v08-transfer.jpg) montre les deux cartes hors des objectifs, de la radio et des jauges. La mesure du Canvas et le placement du renderer donnent environ 219 px de séparation horizontale avec le HUD gauche et 150 px avec la zone radio ; le prompt garde 14 px au-dessus des instruments inférieurs. Ces constats portent sur ce viewport de bureau.

| Étape exécutée dans Chrome | Résultat conservé |
| --- | --- |
| Rechargement sur le déploiement corrigé | Checkpoint entier inchangé, chariots à **74,332 %** ; seul le compteur de captures passe de 124 à 126. |
| Reprise du travail des chariots | Travail terminé à portée ; les personnes passent ensuite en transfert. |
| Arrivées individuelles | Observation intermédiaire de deux patients et deux membres d’équipe arrivés, puis **quatre patients et deux membres d’équipe**, sans perte. |
| Extraction au clavier | Rapport MI07 obtenu après progression par la touche D ; choix civil, ambulance conservée, pièce, attaches et journal de balise conservés. |
| Hangar et export final | **7 rapports**, les six précédents inchangés ; conséquences du chenal et de la digue inchangées ; **34 pièces, stock carburant 0, dépense cumulée 2**. |
| Dernier rechargement et export | **Dossier complet strictement identique**, sans dotation supplémentaire. Le parseur de production et le passage par sérialisation conservent cet export exactement. |

La [capture du rapport](previews/browser-v08-report.jpg) et les exports complets accompagnent la preuve. Le parcours natif a repris un checkpoint préparé par le pilote public dans Node : l’interception, les combats, les examens, les contacts, le choix, la rampe et le trajet initial du véhicule n’ont pas été rejoués depuis le départ dans Chrome. La continuation native couvre le transfert, les arrivées, l’extraction et la persistance avec WK09 vers l’accueil civil. Les autres châssis, destinations et pertes relèvent des tests de simulation séparés.

## Limites maintenues

La jouabilité par commandes publiques et les invariants du dossier ne mesurent pas la compréhension spontanée d’un joueur. La lecture de la signature hostile, le consentement, la conservation de la balise, les états de rampe et la sécurité du transfert demandent encore un essai humain. La finition des animations, personnages, décors, effets, mixage et performance reste à produire ou à mesurer. Les témoins, les personnes de Nacre et les moyens de transport n’accomplissent pas automatiquement les scènes futures de MI08.
