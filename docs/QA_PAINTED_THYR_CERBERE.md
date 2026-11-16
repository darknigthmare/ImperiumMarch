# QA graphique 0.15.4 — Cerbère et vie de Thyr

**16 novembre 2026 · Validation de la tranche issue de `56a1fab0540700dd6a2de789a5577c60a30e7e6e`**

La livraison ajoute neuf atlas au prototype existant. Les contrôles ci-dessous distinguent données, simulation, Canvas, interface modélisée et navigateur. Les résultats locaux ne sont pas présentés comme une réception humaine ou un déploiement.

## Résultats exécutés

| Contrôle | Résultat | Preuve |
| --- | --- | --- |
| Suite complète Node | **719 tests réussis, zéro échec, zéro ignoré** | [npm-test.txt](validation/release-v0154/npm-test.txt) |
| Source de conception et catalogue | **1 007 fiches, 6 châssis, 3 opérations, 14 missions** | [check-project.txt](validation/release-v0154/check-project.txt) |
| Comparaison SVG/Canvas historique | **174 / 174 cas** | [assets-render.txt](validation/release-v0154/assets-render.txt) |
| Origine des nouvelles images | **9 / 9 PNG identiques octet par octet aux générations** | [generated-originals.json](validation/release-v0154/generated-originals.json) |
| Atlas Thyr | **8 images, 62 cellules, 7 vues Canvas** | [receipt.json](validation/painted-thyr-v0154/receipt.json) |
| Atlas Cerbère | **1 image, 16 cellules, 6 poses + 1 scène diagnostiques** | [report.json](validation/painted-cerbere-v0154/report.json) |
| Régression MI14 peint | **8 images, 54 cellules, 33 variantes, 14 scènes** | [receipt.json](validation/release-v0154/mi14/receipt.json) |
| Régression combat peint | **9 images, 78 cellules, 6 vues** | [receipt.json](validation/release-v0154/combat/receipt.json) |
| Régression marcheurs peints | **6 images, 96 cellules, 54 poses, 19 vues** | [receipt.json](validation/release-v0154/walkers/receipt.json) |
| Interface statique et script autonome | **213 IDs uniques, 185 références, 5 vues, 6 dialogues; script compilé** | [check-ui.txt](validation/release-v0154/check-ui.txt) |
| Interface exécutée en DOM modélisé | **108 parcours réussis** | [check-ui-runtime.txt](validation/release-v0154/check-ui-runtime.txt) |
| Construction autonome | **44 modules, 32 atlas, environ 75,54 Mio, sans dépendance distante** | [build-offline.txt](validation/release-v0154/build-offline.txt) |
| Construction web | **Réussie, sortie `web-dist/`** | [build-web.txt](validation/release-v0154/build-web.txt) |
| Classeur | **21 onglets, 126 formules, zéro erreur; IDs/statuts conservés** | [BIBLE_V15_4.md](BIBLE_V15_4.md) |
| Chromium local | **Bloqué avant toute page** | [report.json](validation/browser-v0154/report.json) |

La suite de 719 tests comprend **treize nouveaux tests ciblés**, sept pour Thyr et six pour Cerbère. Les autres groupes annoncés par les sous-lots se recoupent avec cette suite; ils ne s'ajoutent pas une seconde fois au total.

## Contrats graphiques contrôlés

Les 78 nouvelles cellules sont non vides et contenues dans leurs rectangles source réels, avec transparence effective. **69 cellules sont adressables, neuf restent références**. La sélection runtime ne crée pas les systèmes absents : cadavre de Guetteur-racine, outils supplémentaires de Leth, écrasement d'herbe ou santé localisée du boss.

La bouche de Cerbère est vérifiée dans les deux directions, avec la même origine, vitesse et puissance qu'avant le changement. Le télégraphe et le canon suivent ce contrat. Les pieds du boss utilisent leur ancre mesurée, en conservant le contact au sol. Les riggings, états, matériaux et repli vectoriel apparaissent sur le banc diagnostique.

La marche de Thyr suit le déplacement réel. Les tests couvrent l'immobilité, la pause, les états terminaux, le consentement de Leth, les miroirs, le décodage, le dessin et le repli. Chaque état adressable doit réellement produire son sprite, afin qu'une erreur de cadrage ne passe pas silencieusement pour un repli normal.

## Défauts détectés puis corrigés pendant cette tranche

- L'indexation convertissait un masque local en coordonnées absolues avant que les états suivants aient utilisé sa taille. Certaines cibles de deuxième rangée devenaient négatives. Les masques restent désormais immuables pendant les calculs, la sérialisation est séparée et les échelles doivent être finies et positives. Le test de dessin de tous les états reçoit cette régression.
- Les pieds de Cerbère étaient aplatis par l'ancienne contrainte de cheville à huit unités. Son rig de présentation raccorde désormais le segment au récepteur peint sans écraser la chaussure. Les six châssis joueurs gardent leurs propres contacts et ancres.
- La vue des supports de MI09 a révélé une corde de maison non raccordée et une vigne détachée du tronc. Les suspensions utilisent maintenant les points mesurés des PNG, et la vigne est placée sur le support existant. Les textures des racines restent sous le clip du véritable contour de sol.
- Les imports aliasés des wrappers nécessitaient une traduction dans le bundler autonome. La conversion en déstructuration a été ajoutée, puis reçue par compilation et les 108 parcours du script réel dans le modèle de DOM.

## Inspection des scènes

Les sept vues Thyr ont été ouvertes et relues. Les contours sont propres sur les deux fonds de lecture. Les quatre scènes sont obtenues par les commandes publiques de simulation : supports et contacts de MI09, migration effective, échange de Leth réellement consenti à 30 %, faune de OP03. Elles n'injectent ni déplacement, santé ou consentement dans la sauvegarde pour produire leur résultat.

Les trois planches Thyr et les vues Cerbère sont explicitement diagnostiques. Les états y sont choisis pour inspecter l'art; leurs captures ne démontrent pas une mission naturellement terminée. Les deux vues Cerbère ont été relues : mécanique raccordée, pieds proportionnés, canon sur son télégraphe.

## Limite de réception navigateur

Un lancement normal de `/usr/bin/chromium` par Playwright a échoué avant navigation : `socket() failed: Operation not permitted (1)`. Crashpad rapporte également un refus `ptrace`. **Une tentative, zéro page, zéro interaction, zéro capture**. Aucun drapeau de contournement ou nouvel essai local n'a été ajouté.

Le script [test-painted-thyr-browser.mjs](../tools/test-painted-thyr-browser.mjs) reste disponible pour un environnement autorisé. Son précontrôle de version est une lecture de fichiers, pas un navigateur. Le reçu conserve les empreintes du snapshot tenté; les derniers raccords visuels et le bundle final ont été vérifiés ensuite par les autres contrôles, sans nouvel essai Chromium.

L'absence de requêtes externes de l'autonome est reçue par construction et audit statique; elle n'a pas été observée en Chromium local. Les essais humains, écoute audio, contrôleur physique, perception d'accessibilité et animations finales restent ouverts. Les statuts de la Bible ne sont pas promus par ce rapport.

## Publication

Le suivi [DEPLOYMENT.md](DEPLOYMENT.md) reçoit les résultats distants, le commit de la PR, la CI et le déploiement réellement observés. Ces preuves sont séparées de la validation locale et des anciens rapports 0.15.3.
