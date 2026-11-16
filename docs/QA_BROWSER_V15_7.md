# QA navigateur 0.15.7 — installations peintes

**Réception locale bloquée — 16 novembre 2026.** Aucun scénario de jeu n’a été exécuté dans un navigateur pour cette tentative : **zéro assertion navigateur reçue et zéro capture**. Les contrôles Canvas et les tests de modules possèdent leurs preuves séparées ; ils ne remplacent pas cette réception.

## Blocage observé

Le [nouveau pilote Chromium](../tools/test-painted-installations-v0157-browser.mjs) a préparé quatre dossiers valides, puis tenté de lancer `/usr/bin/chromium` avec Playwright. Le navigateur s’est arrêté avant l’ouverture d’une page : `ProcessSingleton socket() failed: Operation not permitted (1)`, suivi d’un `SIGABRT`. Le [rapport d’exécution](validation/browser-v0157/source/report.json) conserve le journal, les empreintes du code et `completed: false`.

La voie fournie par l’environnement a ensuite été essayée avec le skill Cloud desktop et l’outil CUA. Le serveur du projet a démarré normalement sur le port neuf **4317**. L’ouverture de `http://127.0.0.1:4317/?test=1` dans un nouvel onglet du navigateur fourni a renvoyé **`net::ERR_CONNECTION_REFUSED`**. Le serveur a été arrêté et la session CUA a reçu sa synthèse de clôture. Les protections de l’environnement n’ont pas été modifiées.

Le [reçu du blocage](validation/browser-v0157/environment-blocker.json) distingue ces deux observations. La présence d’un exécutable Chromium et le démarrage du serveur ne prouvent pas l’ouverture du jeu dans le navigateur.

## Dossiers préparés

Les dossiers sont produits par `parseCampaign`, `beginCampaignMission`, les pilotes existants de `tests/helpers`, puis `checkpointCampaign` et `serializeCampaign`. Le pilote utilise le châssis **WK09**, la difficulté **story** et la graine **157**. Il contrôle le retour exact après sérialisation, la conservation des rapports précédents et l’atteinte de chaque état. Aucune position, santé, horloge ou variable de mission n’est affectée directement.

| Entrée préparée | Origine | État atteint par commandes simulées |
| --- | --- | --- |
| [MI03](validation/browser-v0157/source/mi03-prepared-input.json) | Fixture historique après MI02 | Inspection du dispensaire en cours au-delà de 45 %, avant identification. |
| [MI04](validation/browser-v0157/source/mi04-prepared-input.json) | Fixture historique après MI03 | Refroidissement de la première turbine en cours au-delà de 45 %, avant achèvement. |
| [MI09](validation/browser-v0157/source/mi09-prepared-input.json) | Fixture historique après MI08 | Carte relevée, décision résolue, barrière encore fermée et deux habitats simulés. |
| [MI13](validation/browser-v0157/source/mi13-prepared-input.json) | Fixture après MI11, puis MI12 terminée par son pilote public | Première vanne thermique au-delà de 45 %, avant isolation du circuit. |

Ces fichiers sont des **entrées préparées hors navigateur**. Les empreintes de chaque entrée, de sa fixture et des pilotes figurent dans le rapport. Le succès de cette préparation ne constitue pas un parcours natif de ces missions.

## Couverture prévue par le pilote

Les scénarios ci-dessous sont écrits dans le script, mais **non exécutés** dans cet environnement :

| Scénario | Vérifications prévues |
| --- | --- |
| Chargement | 71 atlas décodés, répartis dans 14 groupes du hook de lecture ; 6 nouveaux atlas Vesper, 3 de route et 4 de fonderie. |
| MI03 | Import par le vrai sélecteur de fichier et sa confirmation, reprise, commandes Espace/E, inspection achevée du dispensaire et rapports antérieurs conservés. |
| Pause et reprise | État de simulation complet figé pendant 700 ms, rechargement de page, restauration du checkpoint exact et conservation de la vérification du dispensaire. |
| MI04 | Reprise du chantier et refroidissement réel de la première turbine par les commandes clavier. |
| MI09 | Carte relevée présentant les deux habitats existants, avec ouverture physique de barrière égale à zéro. |
| MI13 | Reprise et achèvement réel de la première vanne ; circuit isolé, vanne intacte et rapports précédents conservés. |
| Mobile | Fenêtre émulée de 390 × 844, absence de débordement horizontal et navigation tactile émulée vers le hangar. |
| Échec de chargement | Blocage effectif des 13 nouvelles requêtes PNG, états `failed`, 58 atlas antérieurs prêts et inspection MI03 fonctionnelle avec repli vectoriel. |
| HTML autonome | 71 atlas intégrés prêts, import MI13 et achèvement de vanne, sans requête supplémentaire au document HTML initial. |

L’évaluation dans la page est limitée au hook `window.__IMPERIUM_TEST__.snapshot()` en lecture et aux mesures du DOM. Les changements de jeu passent par les boutons, l’import et les touches du navigateur. Chaque capture prévue conserve le PNG original ainsi que les snapshots immédiatement avant et après la prise de vue, avec leurs empreintes ; les deux horloges délimitent la prise de vue sans prétendre à une correspondance artificielle avec une seule frame.

## HTML identifié, volet navigateur non exécuté

Le fichier `dist/Ordre_de_Cendre.html` présent au moment de la tentative mesure **170 475 459 octets**. Son SHA-256 est :

```text
ecf7eb97d83481c9dc1661f55017ef0d1f0b0a3f42980af98415db4941ab5b94
```

Cette identification rattache la tentative à un livrable concret. Elle ne certifie ni son chargement dans Chromium ni l’absence de requêtes supplémentaires : le volet autonome n’a pas été lancé après le blocage commun du navigateur.

## Réexécuter sur un environnement compatible

Le script utilise Playwright depuis le runtime primaire et le Chromium installé. Ses deux modes de réception sont indépendants. Choisir un nouveau dossier de sortie pour conserver cette tentative et ses preuves :

```bash
"$CODEX_PRIMARY_RUNTIME_NODE" tools/test-painted-installations-v0157-browser.mjs \
  --mode=source --output=docs/validation/browser-v0157/source-reception

"$CODEX_PRIMARY_RUNTIME_NODE" tools/test-painted-installations-v0157-browser.mjs \
  --mode=standalone --output=docs/validation/browser-v0157/standalone-reception
```

`--mode=prepare` produit uniquement les quatre entrées par commandes publiques. `--port` permet de choisir un port local libre. Les contextes Chromium du script sont éphémères et n’utilisent aucun dossier de production ou donnée de joueur existante.

Une future exécution doit conserver son propre rapport, les octets réellement testés et ses observations. Même lorsqu’elle réussira, cette suite ciblée restera distincte d’un parcours complet de campagne, d’un essai humain, d’une écoute audio et d’un test sur matériel tactile ou manette physique.
