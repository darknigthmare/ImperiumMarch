# Réception Chromium 0.15.4 — lancement refusé

**Date : 16 novembre 2026. Résultat : bloqué avant toute ouverture de page.**

Le script `tools/test-painted-thyr-browser.mjs` a effectué exactement une tentative normale de lancement de Chromium installé à `/usr/bin/chromium`, via Playwright, en mode headless. Aucun argument additionnel, autre navigateur ou autre canal n'a été essayé après l'échec.

Le processus a quitté avec le signal `SIGABRT`. L'erreur fatale conservée dans `report.json` est :

```text
FATAL:chrome/browser/process_singleton_posix.cc:297
Check failed: . socket() failed: Operation not permitted (1)
```

Crashpad a également signalé `ptrace: Operation not permitted (1)`. Le refus intervient au lancement du processus, avant le démarrage du serveur de réception et avant l'ouverture du jeu. Il ne constitue pas une erreur JavaScript observée dans l'application.

## Portée effectivement reçue

| Élément | Résultat observé |
| --- | --- |
| Tentatives de lancement | 1 |
| Navigateur utilisable | Non |
| Pages chargées | 0 |
| Contrôles d'interface exécutés | 0 |
| Captures navigateur | 0 |
| Trente-deux atlas décodés dans Chromium | Non vérifié |
| Import des dossiers MI09/MI11 dans Chromium | Non exécuté |
| Jeu autonome sans requêtes annexes dans Chromium | Non vérifié |
| Essai humain ou interaction de bureau native | Non exécuté |

La précondition du script a lu la version source **0.15.4** et vérifié que l'HTML autonome reconstruit contient cette version ainsi que les champs des nouveaux atlas. Cette lecture n'est pas une exécution dans un navigateur. Les empreintes des sources, de l'HTML et du script ayant servi à cette tentative sont conservées dans `report.json`.

Les réceptions Canvas et les tests automatisés de simulation sont consignés séparément dans leurs propres dossiers. Ils ne remplacent pas cette réception navigateur non accomplie.
