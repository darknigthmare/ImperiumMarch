# Bible Excel — Ordre de cendre

Le classeur `ORDRE_DE_CENDRE_Bible.xlsx` présente la conception et la réception de production d’**ImperiumMarch**. La version **0.11.0** conserve **21 onglets** et porte le référentiel à **873 fiches**. Les compteurs décrivent vingt domaines; ils ne mesurent pas un pourcentage d’achèvement du jeu.

**MI01–MI10 possèdent une version jouable au stade prototype.** Après Vesper et les quatre sorties de Nacre, MI09 ouvre une route locale sur Thyr et MI10 explore les cuves chimiques qui menacent son eau. Les 22 missions MI11–MI32 et les seize contrats restent conçus. Les trois opérations OP01–OP03 gardent leurs rapports indépendants. Six châssis sont jouables.

Les **845 identifiants de la 0.10** sont conservés dans leur ordre de feuille. Les **28 ajouts** se répartissent ainsi :

| Domaine | Nouveaux IDs | Fiches |
| --- | --- | ---: |
| Systèmes | SY99–SY104 | 6 |
| Narration | NA79–NA82 | 4 |
| Production | PR86–PR88 | 3 |
| Prototype | PX94–PX98 | 5 |
| QA | QA170–QA179 | 10 |

Le dossier v10 ajoute le terrain chimique de Thyr. Il conserve les neuf rapports précédents, les anciennes scènes, les ressources et même l’ancien marqueur `stage:'complete'`; la progression propose ensuite MI10 à partir du rapport manquant. PT02 exige matière collectée, trois marquages et copie du registre d’Orison. Une maison ou un canal n’est pas un effectif humain.

Les **133 lignes initialement À produire** gardent leur [baseline immuable](validation/production-v09-baseline.json) et leur [registre de réception 0.11](PRODUCTION_REGISTER_V11.md). Chaque texte initial, reçu 0.9, reçu 0.10 et travail restant est conservé par ID. Les nouvelles fiches ne gonflent pas ce dénominateur.

## Lire les statuts

| Statut | Signification |
| --- | --- |
| Conçu | Spécification écrite, sans revendication d’implémentation complète. |
| Prototype | Livrable partiel disponible; intégration, usage et limites précisés dans Prototype ou le registre. |
| À produire | Travail identifié dont la réalisation ou le critère de réception reste ouvert. |
| Vérifié | Contrôle réellement exécuté, avec preuve et portée explicites. |

Un scénario QA vérifié ne certifie pas la finition complète du système. Un test DOM ne certifie pas un navigateur, une image Canvas ne certifie pas le HUD HTML et un périphérique simulé ne certifie pas du matériel physique. Les essais humains de la route vivante et du terrain chimique restent ouverts dans PR85, PR88, QA169 et QA179. Le [protocole MI10](PLAYTEST_CHEMICAL_V11.md) et sa [fiche vierge](validation/human-mi10-session-template-v11.json) préparent ces observations sans en inventer les résultats.

La [réception Chrome 0.10](validation/native-v10/browser-reception.json) reste une preuve historique partielle. **QA19 demeure ouverte** : des pauses avec déplacement sont observées dans une instance dupliquée et un autre contexte conserve un résultat contradictoire. La cause de l’écart est indéterminée et le tir maintenu n’a pas été reçu. **QA20 demeure ouverte** : des vues et actions à 100, 125 et 150 % sont reçues dans une fenêtre de 1363 × 1023 pixels; une vraie petite fenêtre native n’a pas été établie. Les captures disponibles et manquantes restent distinguées dans le [journal d’observations](validation/native-v10/native-observations.json). Ces preuves ne sont pas réattribuées aux nouveaux octets 0.11.

## Rechercher et mettre à jour

Les tables proposent filtres, volets figés et listes de statut. Les IDs relient missions, systèmes, assets, production et QA. La synthèse se recalcule quand une fiche change de statut.

Reporter les modifications dans `data/bible.json`, puis régénérer pour conserver une version reproductible. Une édition limitée au XLSX ne modifie pas le JSON et serait remplacée à la génération suivante. Garder les IDs stables et les critères originaux dans le registre lorsque leur réception change.

## Régénérer et contrôler

Le générateur emploie **@oai/artifact-tool** depuis le runtime primaire, sans installer de dépendance dans le dépôt. La configuration `data/bible-v011-previews.json` rend les vingt et un en-têtes dont la version change et vingt-deux plages ajoutées ou modifiées.

```bash
BIBLE_PREVIEW_CONFIG=data/bible-v011-previews.json \
  "$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs . \
  ../outputs/imperium-march-v011
```

Le répertoire de sortie contient le classeur, les inspections et les aperçus. Le générateur copie le XLSX courant dans `docs/ORDRE_DE_CENDRE_Bible.xlsx`. Les arguments optionnels fixent la racine du dépôt et la sortie. `BIBLE_RENDER_SHEETS` et `BIBLE_EXTRA_PREVIEWS` permettent de remplacer les sélections; `BIBLE_RECEIPT_SUFFIX` peut séparer une réception ultérieure de la réception initiale de cette version.

Les reçus 0.11 portent leur propre version. Aucun rapport, aperçu ou fixture historique 0.9–0.10 n’est remplacé. Le fichier générique `workbook-validation.json` garde sa portée historique.

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --reference-report docs/validation/production-v011-reference-audit.json
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/audit-bible-references.py
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/recalculate-bible-libreoffice.py
```

La génération réconcilie comptes et statuts avec le JSON. Elle modifie temporairement un statut, recalcule, contrôle l’effet puis restaure la valeur. Le vérificateur indépendant lit le ZIP/XML : cellules source, caches de formules, tables, validations, règles conditionnelles et volets. [BIBLE_REFERENCES.md](BIBLE_REFERENCES.md) décrit la résolution des IDs, plages et déclarations symboliques ainsi que les sept mutations négatives.

## Conserver la source historique

La baseline courante est la publication 0.10 **`4846d0270b2976877f9b202848bfde6d2127fb1d`**, dont l’arbre est `ef7b912c27fa672f1930c980ee529c165e3f77ec`. La fixture `tests/fixtures/bible-v010-ids.json` conserve les 845 IDs, la révision publique, l’arbre, le blob Git et le SHA-256 de cette source. Elle provient du commit local immuable `073003075bf8921aab25b1a9200b9d360c1ab391`, dont l’arbre est identique. Elle n’a pas été reconstruite à partir des fiches 0.11.

Les six baselines antérieures restent disponibles pour les 816, 769, 705, 643, 581 et 526 IDs de leurs versions exactes. Les sept baselines fonctionnent dans une copie sans Git; une révision inconnue reste une erreur. Ces fixtures ne reconstituent pas l’ensemble de l’historique Git.

Le [contrôle de conservation](validation/workbook-v0.11-baseline-check.json) compare les IDs ordonnés, les critères et les reçus historiques. Le [contrôle de mise en page](validation/workbook-v0.11-layout.json) compare les cellules non modifiées, styles, géométrie de lignes/colonnes, vues et volets au vrai classeur 0.10. Pour refaire ce dernier contrôle, fournir le classeur et le JSON historiques exacts :

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-layout.py \
  /chemin/vers/la-bible-0.10.xlsx /chemin/vers/la-source-0.10.json
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-baseline.py
node tools/build-production-register.mjs --freeze
```

Le classeur historique attendu porte le SHA-256 `7bd75161f5d10026d5e0101d9d052c439d1ff342bfba1a72a9b2329fc001cd60`. Son JSON porte `8e2647a4b601ab2b454496b8b5ede38afbd87f3db8c6422ea57e2fceb57dc771`. Le contrôle du registre se termine après présence des preuves, avant le gel de leurs empreintes.

## Réception du classeur 0.11

L’export réconcilie **873 fiches et 5 897 cellules source**, avec **845 IDs historiques conservés** et 28 ajouts. Les 21 onglets comportent **20 tables, 126 formules calculées sans erreur, 20 plages de validation, 80 règles conditionnelles et 20 feuilles de données aux volets figés**. La modification temporaire d’un statut et sa restauration ont été contrôlées dans le moteur de génération.

| Statut | Fiches |
| --- | ---: |
| Conçu | 281 |
| Prototype | 351 |
| À produire | 86 |
| Vérifié | 155 |
| **Total** | **873** |

Les preuves comprennent la [réconciliation de l’export](validation/workbook-v0.11-export.json), la [relecture visuelle](validation/workbook-v0.11-visual-review.json), l’[inspection de la synthèse](validation/workbook-v0.11-inspection.ndjson), le [contrôle des formules](validation/workbook-v0.11-formula-check.ndjson) et le [contrôle des plages inchangées](validation/workbook-v0.11-layout.json).

Les **43 vues** couvrent les en-têtes et la synthèse des 21 feuilles ainsi que les 22 plages modifiées ou ajoutées. La relecture visuelle porte sur ces images. Les anciennes images 0.9–0.10 restent associées à leurs reçus historiques, sans duplication ni attribution à la nouvelle version. Les styles, largeurs, volets et cellules non concernés par les modifications sont comparés séparément au classeur précédent : 6 520 cellules inchangées et 830 anciennes fiches sont contrôlées; le XML des styles est identique. Les sous-titres Campagne et Prototype ont été corrigés puis relus avant réception.

Empreinte SHA-256 du classeur : `21e5cac473dd41254700a873b70f73ea87f32a757e1dfdb15d817a2d1cdcb2d5`.

## Recalcul dans LibreOffice

Le [rapport de recalcul](validation/workbook-v0.11-libreoffice.json) consigne l’exécution de **LibreOfficeDev 26.8.0.0.alpha0** en mode headless sur une copie jetable, après retrait des **126 caches de formules**. Les 126 résultats ont été recalculés : aucune erreur, aucune différence de résultat et aucune différence parmi les 5 897 cellules source. Les tables, validations, règles conditionnelles et volets sont également comparés. Le classeur livré demeure inchangé; le rapport donne la version complète et la commande effectivement exécutée.

Ce contrôle ne reçoit pas le tri interactif, l’utilisation des filtres, le défilement des volets ou une modification par un utilisateur. **QA29 reste ouverte** pour ces gestes. Aucune exécution dans Excel desktop n’est revendiquée.

Le [bilan de production](PRODUCTION_V11.md), le [contrat MI10](CAMPAIGN_MISSION_10.md), le [contrat du dossier v10](CAMPAIGN_SAVE_V10.md) et le [registre des 133 critères](PRODUCTION_REGISTER_V11.md) expliquent les réalisations et le travail restant. Les documents et preuves des versions précédentes conservent leurs bilans historiques.
