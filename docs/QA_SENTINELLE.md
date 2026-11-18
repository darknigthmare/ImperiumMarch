# Réception — Sentinelle S-3 pilotable (0.15.12)

**Date :** 17 novembre 2026. **Portée :** rendre WK14 assignable au départ avec sa propre géométrie de production, ses contacts simulés et ses tests. Le répertoire WK13–WK20 reste une conception pour les sept autres châssis.

## 1. Ce qui est livré

| Élément | Contenu | Autorité |
| --- | --- | --- |
| Fiche jouable | `PLAYABLE_WALKERS` = six profils peints + WK14 ; `WALKERS` inchangé | `src/content.mjs` |
| Appuis | `footOffsets: [-52, 52]`, deux groupes alternés, terrain de mission | `src/simulation.mjs` |
| Géométrie | `SENTINELLE_RIG`, coque, tourelle, segments, genou, semelle, radiateur | `src/production-assets.mjs` |
| Lot d'assets | 33 SVG + `rig.json` + manifeste d'empreintes (34 fichiers, 6 assemblages de contacts réels) | `assets/production/sentinelle/` |
| Assignation | Parc de campagne complet ; WK14 entre au parc à son premier déploiement sur un dossier antérieur | `src/campaign.mjs` |
| Interface | Septième carte du Hangar, dossier du répertoire marqué PILOTABLE | `src/main.mjs`, `src/walker-corps-ui.mjs` |
| Sauvegarde | v14 conservée ; aucune fixture, aucun rapport ni checkpoint réécrit | `src/campaign.mjs` |

## 2. Commandes exécutées

```text
node tools/build-sentinelle-assets.mjs
{"files":34,"svg":33,"rigs":1,"parts":8,"assemblies":6}

npm test
ℹ tests 891   ℹ pass 891   ℹ fail 0

node tools/check-project.mjs
Project checks passed: 20 design sheets, 1007 source rows, 7 playable chassis,
3 independent operations, 14 campaign missions.

npm run build
Offline game built: dist/Ordre_de_Cendre.html (220.14 MiB), 87 modules, no remote dependencies.

npm run check:ui
STATIC UI AUDIT PASSED: 216 unique HTML IDs; 187 literal JS ID references; 6 views;
4 archive tabs; 6 dialogs.
OFFLINE BUNDLE AUDIT PASSED: one inline script compiled by vm.Script without executing.

npm run check:ui-runtime
PASS cold start, five views, seven selectable chassis and independent simulation launch
UI STATE INTEGRATION PASSED: 108 flows against the actual offline application script in a modeled DOM.

npm run check:offline-package
{"status":"verified","entry":"Ordre_de_Cendre.html","htmlFileCompared":true,
 "html":{"bytes":230834288,"sha256":"1e7f2e2565c6e88c27bea8ef2bcbc68e0a45752483cf2b25264d27dc22db9069"},
 "zip":{"sha256":"23511f266aded9775f87054506da91a2f211a6e86ed8732cdca00daa088a08dd"}}
```

`tests/sentinelle.test.mjs` ajoute dix tests : cohérence fiche/rig, contacts initiaux et alternance, marche publique sur deux missions, pièces vectorielles et pieds autoritaires, rendu de repli sans atlas ni mutation d'état, bouche de tir inchangée, assignation et atelier, sauvegarde antérieure sans réécriture, sortie MI02 complète avec reçu WK14 accepté, intégrité du manifeste du lot.

## 3. Limites explicites

- **Aucun atlas peint** pour WK14 : le rendu emploie ses pièces vectorielles. Ce n'est ni une réception peinte ni une animation finale.
- **Aucun essai navigateur ni humain** n'a été exécuté pour cette tranche. Le parcours des sept cartes du Hangar est vérifié dans le DOM modélisé, pas dans un navigateur ; le CSS, le focus natif et l'audio n'ont pas été exercés.
- Les **sept autres châssis** restent conçus : ni marche, ni tir, ni sauvegarde. Les silhouettes du répertoire sont des dessins de conception.
- **Bible intacte** : aucun ID, onglet, statut ou critère initial ajouté. WK14 n'a pas de fiche de Bible et n'est pas promu « Vérifié ».
- La campagne reste **MI01–MI14** et le dossier **v14**. Le tableau de bord du Hangar et le manifeste 0.9 ne sont pas réécrits.
