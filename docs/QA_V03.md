# Validation de la 0.3 — Le viaduc et le second dossier

Tranche de travail du **10 novembre 2026**. Le projet reste un prototype. Cette livraison étend la campagne à MI02 et relie son résultat au dossier de MI01. Le [rapport de la 0.2](QA_INTEGRATION.md) est conservé comme historique.

## Résultats vérifiés

| Contrôle | Résultat et portée |
| --- | --- |
| `npm test` | **62 tests réussis** : 18 historiques de simulation, 9 MI01, 14 sauvegarde historiques, 10 MI02, 11 progression/migration. |
| Parcours complets | 12 combinaisons MI01, 6 MI02, 9 opérations indépendantes. Toutes utilisent les commandes publiques, en difficulté Pilote. |
| MI02 sans pertes | Vigie, Bastion et Pèlerin peuvent sauver les huit ouvriers avec chacune des deux décisions. Ce pilote automatisé ne certifie pas la difficulté pour un joueur. |
| Dommages aux wagons | Impacts réels de roquettes, explosion au sol, destruction du registre, pertes partielles et totales. Des ouvriers déjà évacués ou un registre déjà copié restent acquis. |
| Progression | Migration d’un checkpoint v0.2, fin de MI01, réparation de conduite, lancement de MI02, reprise avant décision, compte rendu final, dotation unique et préservation de MI01. |
| Anciennes sauvegardes | Fixture produit par les vrais modules du commit `c7de24a`, avec commandes publiques. Migration sans modification du snapshot MI01 ni des conséquences, copie v1 préservée lors de la première écriture v2. |
| Validation des entrées | Checkpoints croisés, héritage contradictoire, paramètres ferroviaires modifiés, formats étrangers et versions futures refusés ; un ancien secours ne permet pas d’écraser une version future. |
| `npm run check:ui-runtime` | **10 parcours** du véritable script autonome dans un modèle de DOM. Les trois parcours ajoutés couvrent le déblocage de MI02, sa décision/reprise et son résultat/archivage. |
| `npm run check:ui` | Compilation du fichier autonome, 119 identifiants HTML uniques, 107 références littérales JavaScript, 5 vues et 6 dialogues. Ressources embarquées, aucun chargement réseau pour le jeu autonome. |
| `npm run check` | 20 domaines de conception, **446 fiches**, 3 châssis, 3 simulations, 2 missions de campagne. |
| Rendu de MI02 | Trois images Skia depuis des états atteints par commandes publiques : second harpon, freinage, wagon ouvert. Contrôle visuel des positions et de la lisibilité des indications. |
| Excel | 21 onglets dont Synthèse ; 446 fiches et conservation des 429 identifiants précédents. Détails dans [la validation du classeur](validation/workbook-validation.json). |

## Ce que vérifie l’interface exécutée

Le modèle de DOM exécute le script réellement livré dans `dist/Ordre_de_Cendre.html`. Il dispatch les événements des boutons et du clavier, conserve un stockage simulé et fait progresser la boucle d’animation. Les appels Canvas sont neutralisés dans cette suite.

Les contrôles propres à cette tranche établissent que :

1. MI02 reste verrouillée avant le premier compte rendu. Charger un dossier historique terminé sélectionne le nouvel ordre sans réécrire immédiatement la sauvegarde.
2. Le briefing et le lancement prennent le chapitre sélectionné. Une pause puis un rechargement du script reprennent le même train et le même monde.
3. Rejouer MI01 pendant une sortie officielle MI02 conserve le checkpoint du train. Reprendre la campagne revient à MI02 dans le bon mode.
4. Le dialogue de MI02 affiche le sort des ouvriers, se fige pendant le choix et conserve la décision après rechargement avant l’extraction.
5. L’extraction conserve les deux rapports, affiche le bilan ferroviaire et présente MI01 et MI02 séparément dans les archives.

Les communications successives sont mises en file pour éviter que plusieurs répliques émises au même instant ne s’écrasent. Le briefing de MI02 reprend également l’état de la conduite et du signalement, pour que ces éléments restent lisibles avant le départ.

## Navigateur et limites matérielles

`npm run test:browser` a été effectivement tenté avec Playwright et `/usr/bin/chromium`. Chromium a quitté avant toute page avec :

```text
FATAL:chrome/browser/process_singleton_posix.cc:297
socket() failed: Operation not permitted (1)
```

La suite navigateur locale n’est donc **pas validée**. Les tests de DOM modélisé et les images Canvas ne la remplacent pas. Les contrôles de déploiement, documentés séparément dans [DEPLOYMENT.md](DEPLOYMENT.md), ne prouvent pas à eux seuls un parcours de jeu dans un navigateur.

Une tentative d’ouverture directe du fichier autonome dans le navigateur partagé a également été refusée par sa règle de navigation : seuls HTTP et HTTPS sont autorisés, pas le protocole `file:`. Cette tentative n’a exécuté aucune page et ne fournit aucune validation supplémentaire.

Restent à qualifier : CSS et petits écrans dans un navigateur réel, dialogues et focus natifs, audio à l’écoute, téléchargement/import utilisateur, plein écran, périphériques tactiles, performance sur machines cibles et difficulté humaine. Les parcours de sauvegarde couvrent des copies locales ; aucune synchronisation entre appareils n’est annoncée.

## Reproduction

```sh
npm test
npm run build
npm run build:web
npm run check
npm run check:ui
npm run check:ui-runtime
node tools/render-mi02-previews.mjs
```

La dernière commande demande le paquet optionnel `@napi-rs/canvas` du runtime d’auteur. Le jeu et les autres commandes n’en dépendent pas. La suite `npm run test:browser` doit être lancée sur un poste permettant le démarrage de Chromium.
