# Bible Excel — Ordre de cendre

Le classeur `ORDRE_DE_CENDRE_Bible.xlsx` présente la conception et la réception de production d’**ImperiumMarch**. La source **0.12.0** conserve **21 onglets** et porte le référentiel à **905 fiches**. Les compteurs décrivent vingt domaines; ils ne mesurent pas un pourcentage d’achèvement du jeu.

**MI01–MI11 possèdent une version jouable au stade prototype.** Après Vesper et Nacre, trois sorties locales sur Thyr confrontent route vivante, terrain chimique et source des avertissements Khelt. Les 21 missions MI12–MI32 et les seize contrats restent conçus. Les trois opérations OP01–OP03 gardent leurs rapports indépendants. Six châssis sont jouables.

Les **873 identifiants de la 0.11** sont conservés dans leur ordre de feuille. Les **32 ajouts** se répartissent ainsi :

| Domaine | Nouveaux IDs | Fiches |
| --- | --- | ---: |
| Systèmes | SY105–SY111 | 7 |
| Narration | NA83–NA86 | 4 |
| Production | PR89–PR91 | 3 |
| Prototype | PX99–PX104 | 6 |
| QA | QA180–QA191 | 12 |

Le dossier v11 ajoute seulement le domaine de la voix à Thyr. Il conserve les dix rapports précédents, les anciennes scènes, les ressources et l’ancien marqueur `stage`. La progression propose MI11 après le premier rapport de MI10. TE01 exige trois signaux exploitables, deux copies distinctes et un témoignage consenti achevé. Les pièces acquises peuvent survivre à la perte de leur source; disponibilité de Leth, confiance locale et possibilité de coopération restent des faits séparés. Aucun accord public, recrutement ou départ de l’Empire n’est attribué par cette sortie.

Les **133 lignes initialement À produire** gardent leur [baseline immuable](validation/production-v09-baseline.json) et leur [registre de réception 0.12](PRODUCTION_REGISTER_V12.md). Chaque texte initial, reçu antérieur et travail restant est conservé par ID. Les nouvelles fiches ne gonflent pas ce dénominateur.

## Lire les statuts

| Statut | Signification |
| --- | --- |
| Conçu | Spécification écrite, sans revendication d’implémentation complète. |
| Prototype | Livrable partiel disponible; intégration, usage et limites précisés dans Prototype ou le registre. |
| À produire | Travail identifié dont la réalisation ou le critère de réception reste ouvert. |
| Vérifié | Contrôle réellement exécuté, avec preuve et portée explicites. |

Un scénario QA vérifié ne certifie pas la finition complète du système. Un test DOM ne certifie pas un navigateur, une image Canvas ne certifie pas le HUD HTML et un périphérique simulé ne certifie pas du matériel physique. Les essais humains de Thyr restent ouverts : PR85/QA169 pour MI09, PR88/QA179 pour MI10 et PR91/QA191 pour MI11. Le [protocole MI11](PLAYTEST_VOICE_V12.md) et sa [fiche vierge](validation/human-mi11-session-template-v12.json) préparent une observation; leur présence ne constitue pas une session.

La [réception Chrome 0.10](validation/native-v10/browser-reception.json) reste une preuve historique partielle. **QA19 demeure ouverte** : des pauses avec déplacement sont observées dans une instance dupliquée et un autre contexte conserve un résultat contradictoire. La cause de l’écart est indéterminée et le tir maintenu n’a pas été reçu. **QA20 demeure ouverte** : des vues et actions à 100, 125 et 150 % sont reçues dans une fenêtre de 1363 × 1023 pixels; une vraie petite fenêtre native n’a pas été établie. Les captures disponibles et manquantes restent distinguées dans le [journal d’observations](validation/native-v10/native-observations.json).

La [réception native 0.11](validation/native-v11/browser-reception.json) est bloquée : le navigateur a refusé le chemin local `file://` et le [déploiement Vercel](validation/v11-vercel-initial-blocked.json) a rencontré une limite de quota. Ces échecs ne valent pas une réception MI10. La fixture v10 [authentifiée](validation/v012-historic-v10.json) reprend des exports **préparés en simulation** depuis la publication 0.11, sans les transformer en exports natifs. Le [constat natif 0.12](validation/native-v12/browser-reception.json) porte `not_run` : aucun nouvel essai ni déploiement n’a été tenté. Les observations 0.9 et 0.10 ne sont pas réattribuées aux nouveaux octets 0.12; QA190 reste la réception native à accomplir pour MI11.

## Rechercher et mettre à jour

Les tables proposent filtres, volets figés et listes de statut. Les IDs relient missions, systèmes, assets, production et QA. La synthèse se recalcule quand une fiche change de statut.

Reporter les modifications dans `data/bible.json`, puis régénérer pour conserver une version reproductible. Une édition limitée au XLSX ne modifie pas le JSON et serait remplacée à la génération suivante. Garder les IDs stables et les critères originaux dans le registre lorsque leur réception change.

## Régénérer et contrôler

Le générateur emploie **@oai/artifact-tool** depuis le runtime primaire, sans installer de dépendance dans le dépôt. La configuration `data/bible-v012-previews.json` sélectionne les vingt et un en-têtes dont la version change et les plages de données ajoutées ou modifiées.

```bash
BIBLE_PREVIEW_CONFIG=data/bible-v012-previews.json \
  "$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs . \
  ../outputs/imperium-march-v012
```

Le répertoire de sortie contient le classeur, les inspections et les aperçus. Le générateur copie le XLSX courant dans `docs/ORDRE_DE_CENDRE_Bible.xlsx`. Les arguments optionnels fixent la racine du dépôt et la sortie. `BIBLE_RENDER_SHEETS` et `BIBLE_EXTRA_PREVIEWS` permettent de remplacer les sélections; `BIBLE_RECEIPT_SUFFIX` peut séparer une réception ultérieure de la réception initiale de cette version.

Les reçus 0.12 portent leur propre version. Aucun rapport, aperçu ou fixture historique n’est remplacé. Le fichier générique `workbook-validation.json` garde sa portée historique.

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --reference-report docs/validation/production-v012-reference-audit.json
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/audit-bible-references.py
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/recalculate-bible-libreoffice.py --timeout 180
```

La génération réconcilie comptes et statuts avec le JSON. Elle modifie temporairement un statut, recalcule, contrôle l’effet puis restaure la valeur. Le vérificateur indépendant lit le ZIP/XML : cellules source, caches de formules, tables, validations, règles conditionnelles et volets. Le budget LibreOffice de 180 secondes permet les démarrages lents de l’hôte; il ne modifie pas les critères, et le script rend compte de son attente par intervalles courts. Les options `--workbook` et `--source` permettent de vérifier un couple d’entrées exactes sans remplacer les fichiers courants. [BIBLE_REFERENCES.md](BIBLE_REFERENCES.md) décrit la résolution des IDs, plages et déclarations symboliques ainsi que les sept mutations négatives.

## Conserver la source historique

La baseline courante est la publication 0.11 **`c7f3273a60824ff4e968ea36ab956c6a41710df0`**, dont l’arbre est `7942d22cfdb0b73e42ae0a427a3afbc986f29160`. La fixture `tests/fixtures/bible-v011-ids.json` conserve les 873 IDs, la révision publique, l’arbre, le blob Git et le SHA-256 de cette source. Elle provient du commit local immuable `f75e674313120094b9540603fbfa571d5df2f1d2`, dont l’arbre est identique. Elle n’a pas été reconstruite à partir des fiches 0.12.

Les sept baselines antérieures restent disponibles pour les 845, 816, 769, 705, 643, 581 et 526 IDs de leurs versions exactes. Les huit baselines disposent d’un contrôle dans une copie sans Git; une révision inconnue reste une erreur. Ces fixtures ne reconstituent pas l’ensemble de l’historique Git.

Le [contrôle de conservation](validation/workbook-v0.12-baseline-check.json) compare les IDs ordonnés, les critères et les reçus historiques. Le [contrôle de mise en page](validation/workbook-v0.12-layout.json) compare les cellules non modifiées, styles, géométrie de lignes/colonnes, vues et volets au vrai classeur 0.11. Pour refaire ce dernier contrôle, fournir le classeur et le JSON historiques exacts :

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-layout.py \
  /chemin/vers/la-bible-0.11.xlsx /chemin/vers/la-source-0.11.json
node tools/build-production-register.mjs
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-baseline.py
node tools/build-production-register.mjs --freeze
```

Le classeur historique attendu porte le SHA-256 `21e5cac473dd41254700a873b70f73ea87f32a757e1dfdb15d817a2d1cdcb2d5`. Son JSON porte `0b8777525fd48d3ee2f4d092fc132f27e7785c8eeee518d053e81af3140e9724`. Le registre est d’abord assemblé avec les preuves présentes; le contrôle historique précède le gel de leurs empreintes.

## Réception du classeur 0.12

Le classeur livré et sa source ont passé les contrôles de la 0.12. L’[export indépendant](validation/workbook-v0.12-export.json) compare **6 105 cellules source**, conserve les **873 IDs historiques** et identifie les **32 ajouts**. Il reçoit **21 onglets**, **20 tables**, **126 formules sans erreur**, **20 plages de validation**, **80 règles conditionnelles** et les volets figés des vingt onglets de données.

| Statut | Fiches |
| --- | ---: |
| Conçu | 278 |
| Prototype | 374 |
| À produire | 88 |
| Vérifié | 165 |
| **Total** | **905** |

La [relecture visuelle](validation/workbook-v0.12-visual-review.json) couvre **48 vues** : vingt et un aperçus de feuilles et vingt-sept plages ciblées. Les 48 vues du premier export ont été examinées individuellement. L’export final a régénéré les 48 images : 43 sont octet-identiques aux images déjà relues et les cinq vues modifiées ont été rouvertes et relues. Les dix-neuf lignes historiques modifiées et les trente-deux ajouts disposent chacun d’une vue identifiée; les renvois à la ligne, statuts et textes restent lisibles sans chevauchement observé. Les [inspections](validation/workbook-v0.12-inspection.ndjson) et le [contrôle des formules](validation/workbook-v0.12-formula-check.ndjson) complètent cette réception.

La comparaison avec le classeur 0.11 authentique reçoit **6 694 cellules non modifiées** et **854 anciennes lignes inchangées**. Le fichier XML des styles, la géométrie des colonnes, les vues et les volets restent identiques. Les textes ajoutés ou modifiés sont couverts séparément par la relecture des PNG. Le contrôle de conservation compare également les **519 fichiers historiques** et les **133 critères initiaux** avec leurs réceptions antérieures.

Le XLSX final porte le SHA-256 `e5ffbac8f2bfc252247635eeb76654894a208d12b96ca0771ceba6c1a4644b53`. La source JSON reçue porte `b44100ba2d91fa2f50bfb2c75de8ff61182593d53a90cf165e524476c8d5bfc8`.

## Recalcul dans LibreOffice

Le [recalcul indépendant final](validation/workbook-v0.12-libreoffice.json) a retiré les **126 caches de formules** d’une copie jetable, puis l’a convertie avec **LibreOfficeDev 26.8.0.0.alpha0**, commit `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, en mode headless. La conversion a terminé en **35,922 secondes** : les 126 caches sont reconstruits, les 6 105 cellules source concordent et aucun écart de valeur, de résultat de formule ou de structure contrôlée n’est relevé. LibreOffice normalise l’écriture de cent formules dans sa copie; leurs résultats restent identiques. L’empreinte du classeur livré est inchangée avant et après le contrôle.

Le [journal d’exécution](validation/workbook-v0.12-libreoffice-execution-context.json) conserve le premier dépassement du budget de 55 secondes, un diagnostic annulé et la [conversion du candidat](validation/workbook-v0.12-candidate-libreoffice.json) réussie en 150,213 secondes sur un profil isolé. Le budget explicite de 180 secondes permet ce démarrage plus lent; aucun critère de comparaison n’a été assoupli. Le contrôle final ci-dessus porte sur les octets livrés après consolidation des statuts.

Ce contrôle ne reçoit pas le tri interactif, l’utilisation des filtres, le défilement des volets ou une modification par un utilisateur. **QA29 reste ouverte** pour ces gestes. Aucune exécution dans Excel desktop n’est revendiquée.

Le [bilan de production](PRODUCTION_V12.md), le [contrat MI11](CAMPAIGN_MISSION_11.md), le [contrat du dossier v11](CAMPAIGN_SAVE_V11.md) et le [registre des 133 critères](PRODUCTION_REGISTER_V12.md) expliquent les réalisations et le travail restant. Les documents et preuves des versions précédentes conservent leurs bilans historiques.
