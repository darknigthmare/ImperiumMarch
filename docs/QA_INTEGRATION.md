# Rapport d’intégration — 0.2.0

Référence : **10 novembre 2026**. Ce rapport couvre la première mission de campagne, son dossier, l’atelier et la livraison autonome. Les limites sont distinctes des résultats réussis.

## Résultats

| Objet | Contrôle exécuté | Résultat |
| --- | --- | --- |
| Simulation et dossier | `npm test` | **41 tests réussis**, 0 échec : 18 historiques, 9 de MI01, 14 de sauvegarde. |
| Parcours de MI01 | Commandes publiques, difficulté Pilote | **12 réussites** : trois marcheurs, deux passages et deux réponses au bordereau. Aucun objectif ou succès forcé. |
| Anciennes opérations | Commandes publiques, difficulté Pilote | **9 réussites** : trois opérations par trois châssis. |
| Structure de contenu | `npm run check` | 20 domaines, 429 fiches, IDs et limites de mission cohérents. |
| Script autonome et UI statique | `npm run build`, `npm run check:ui` | Six modules intégrés, compilation du script, 111 IDs HTML, 99 références littérales, 5 vues, 4 onglets, 6 dialogues. Aucune ressource distante requise. |
| Intégration des gestionnaires | `npm run check:ui-runtime` | **7 parcours réussis** dans un modèle de DOM ; le vrai script autonome est exécuté. |
| Nouveau rendu | `tools/render-campaign-previews.mjs` | 3 captures Canvas de MI01, depuis des états obtenus par commandes publiques ; examinées visuellement. |
| Excel | Artifact Tool, rapprochement JSON et inspection XML | 21 onglets, 429 fiches, 20 tables, 126 formules ; recalcul et restauration d’un changement test confirmés. |
| Préservation Excel | Comparaison avec la 0.1 | 411 IDs conservés, structure et cellules non concernées préservées, 12 plages affectées examinées. |

Le pilote automatique vise avec précision. Les durées et le taux de réussite de ces parcours ne mesurent pas la difficulté ressentie par un joueur.

## Les sept parcours d’intégration

`tools/test-ui-runtime.mjs` charge le script réel de `dist/Ordre_de_Cendre.html` dans une machine virtuelle Node. Son petit modèle de DOM fournit des éléments, des événements, des dialogues simplifiés et un stockage simulé. Les appels Canvas sont neutralisés. Aucune image issue de ce test n’est présentée comme une capture du jeu.

1. Démarrage, cinq vues, choix des trois châssis et lancement d’une simulation indépendante.
2. Déplacement, pause, écriture du checkpoint et reprise identique dans un nouveau contexte du script.
3. Passage d’une campagne à une simulation et retour à la campagne sans perte du checkpoint.
4. Reprise d’un checkpoint atteint par de vraies commandes, choix du bordereau, extraction, bilan, réparation de la conduite et relecture sans deuxième dotation.
5. Dossier de version inconnue conservé jusqu’à une demande explicite de nouveau dossier.
6. Écriture refusée : avertissement visible pendant la partie, simulation toujours utilisable pour la session.
7. Import asynchrone terminé pendant un départ : retour sûr au menu, remplacement cohérent, aucun écran de jeu orphelin.

Ces résultats portent sur la liaison entre les gestionnaires et l’état. Ils ne prouvent pas les propriétés du DOM natif, la disposition CSS, le focus, les dialogues natifs, les téléchargements, le son ou le tactile.

## Sauvegarde et invariants

Les tests de dossier couvrent le format, les IDs, les structures et bornes numériques ; les états endommagés sont refusés. Une version future reste protégée même si une ancienne copie compatible existe.

Une mission reprise conserve les pieds, le convoi, les ennemis, projectiles, événements et l’état du générateur. Pour les trois châssis, une restauration suivie des mêmes entrées produit le même état complet. Le point avant décision reste distinct des autosauvegardes suivantes.

Une première réussite attribue quatre lots d’atelier. Le même bilan répété, un échec ou une relecture ne donne aucune dotation. Une réparation consomme le stock nécessaire une seule fois. La conduite réparée reste signalée comme rompue dans le rapport historique.

Les tests unitaires de panne, de destruction ou de réparation peuvent préparer un état particulier pour isoler une règle. Cela reste distinct des 21 parcours victorieux qui utilisent uniquement les commandes publiques.

## Navigateur : blocage observé

Une tentative réelle de lancement a utilisé le paquet Playwright installé et `/usr/bin/chromium`, en mode headless, avec une page de test vierge prévue avant le chargement du jeu.

Le processus a quitté avant l’ouverture d’une page :

```text
FATAL:chrome/browser/process_singleton_posix.cc:297
socket() failed: Operation not permitted (1)
```

L’isolation interdit le socket nécessaire au démarrage de Chromium. **Aucun parcours dans un navigateur réel n’est déclaré réussi pour cette livraison.** Ce résultat est différent des échecs serveur/protocole observés lors de la création de la 0.1.

La suite optionnelle `npm run test:browser` est fournie pour un poste autorisé. Elle ouvre l’édition autonome via un serveur local, contrôle les cinq vues, la marche, le déploiement des dalles, la pause, la reprise locale, une simulation indépendante et un affichage de 390 pixels. Sa syntaxe a été vérifiée ; la suite complète n’a pas été exécutée dans cet environnement bloqué.

Restent ouverts : PR32, QA37 et QA38, ainsi que CSS sur matériel cible, comportement natif des dialogues, audio, téléchargement/import utilisateur, plein écran, tactile physique, mesure de performance et difficulté humaine. Aucune capture Canvas ni test de DOM simulé ne clôture ces fiches.

## Corrections issues de l’intégration

- Séparation de la campagne et des simulations, y compris le bouton de suite après résultat.
- Mise en place du dossier avant décision et après le choix, plus autosauvegarde à huit secondes simulées.
- Reprise dans l’état réel, sans réinitialiser le convoi ni les objectifs.
- Protection des versions futures, même avec une ancienne copie de secours valide.
- Message d’échec de sauvegarde visible pendant la mission.
- Réinitialisation cohérente du menu, des entrées et de la pause après import asynchrone.
- Suppression des répliques historiques du premier rapport dans le bilan d’une relecture différente.
- Doctrine initiale centrée sur la livraison de filtres, sans révélation prématurée de PALINODE.
- Libellés du treuil et de la conduite rendus lisibles ; 24 caisses placées à côté du camion, au niveau du terrain.
- Conservation des statuts de conception : MI01 reste Prototype, les 31 autres missions restent conçues.

Les rapports détaillés se trouvent dans [QA_SIMULATION.md](QA_SIMULATION.md), [CAMPAIGN_MISSION_01.md](CAMPAIGN_MISSION_01.md) et [validation/workbook-v0.2-checks.json](validation/workbook-v0.2-checks.json).
