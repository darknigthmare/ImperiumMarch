# Bible Excel — Ordre de Cendre

Le classeur `ORDRE_DE_CENDRE_Bible.xlsx` présente la conception et le registre de production d’**ImperiumMarch / ORDRE DE CENDRE**. La source courante **0.15.7**, datée du **16 novembre 2026**, contient **1 007 fiches**. La structure conserve **21 onglets**, **20 tables** et **126 formules**. Les compteurs décrivent vingt domaines ; ils ne mesurent pas un pourcentage d’achèvement du jeu.

**MI01–MI14 possèdent une version au stade prototype, avec dossier v14.** Vesper et Nacre sont suivies de quatre sorties de Thyr et de deux missions de Kharon. Les **18 missions MI15–MI32** et les **16 contrats** restent conçus. Les opérations OP01–OP03 gardent leurs rapports indépendants. Six châssis sont jouables.

La 0.15 prolonge la reconstruction locale immuable **0.14.1**, commit `fc9f4af4e103adf93d4310053610ca69bea443b3`. Cette référence n’est pas un commit public ; ses preuves et empreintes restent conservées pendant la reprise de publication de son arbre. Ses **977 identifiants** sont conservés dans leur ordre. Les **30 fiches supplémentaires** couvrent MI14, le piquet, le refroidisseur, les sources locales, la coopération, le dossier v14 et leurs critères de réception.

| Domaine | IDs ajoutés en 0.15 | Fiches |
| --- | --- | ---: |
| Systèmes | SY128–SY135 | 8 |
| Narration | NA95–NA98 | 4 |
| Production | PR98–PR100 | 3 |
| Prototype | PX117–PX121 | 5 |
| QA | QA222–QA231 | 10 |
| **Total** | | **30** |

Le dossier v14 ajoute uniquement `world.kharon.workshop` vide et la version. Les treize rapports précédents, ressources, scènes et marqueur historique `stage` restent exacts. MI14 distingue explication, copie locale, recoupement conditionnel avec PT03, travaux sur le froid, ordre et commande physique. Elle ne produit aucun nouveau PT, TE ou PO et n’avance pas la défection prévue à MI16.

Les **133 lignes initialement À produire** gardent leur [baseline immuable](validation/production-v09-baseline.json). Le [registre 0.15](PRODUCTION_REGISTER_V15.md) conserve leurs textes, reçus antérieurs et travaux restants ; les nouvelles fiches n’augmentent pas ce dénominateur. Le [bilan de production MI14](PRODUCTION_V15.md) décrit la tranche et le [rapport QA 0.15](QA_V15.md) distingue ses exécutions des réceptions historiques. Le [complément 0.15.1](PRODUCTION_V15_1.md) décrit les huit atlas peints et renvoie à leur [réception graphique](QA_PAINTED_MI14.md).

## Réception du classeur courant 0.15.7

La source actualise **29 fiches existantes et 46 champs descriptifs** pour les installations de Vesper, le matériel de route MI09 et les appareils de fonderie MI13. Les fiches Assets décrivent les livrables partiels ; Production et Prototype précisent leur usage et leurs limites. Trois anciennes limites de Prototype sont aussi remises au périmètre déjà disponible de MI01–MI14 et de PT03. Aucun ID, statut, critère d’acceptation ou résultat attendu n’est changé.

| Lot ajouté en 0.15.7 | Atlas | Cellules | Utilisées au rendu | Références |
| --- | ---: | ---: | ---: | ---: |
| Installations et matériel de Vesper | 6 | 38 | 38 | 0 |
| Route de Thyr — MI09 | 3 | 20 | 18 | 2 |
| Installations de Kharon — MI13 | 4 | 23 | 23 | 0 |
| **Nouvelle tranche** | **13** | **81** | **79** | **2** |
| **Total réconcilié, 14 lots** | **71** | **542** | **504** | **38** |

Le [reçu de comptage](validation/painted-counts-v0157.json) vérifie les PNG des quatorze lots contre leurs manifestes. Il corrige **six cellules MI14 de référence auparavant incluses dans le compte runtime** : deux poses agenouillées, trois cellules neutres et le corps dormant de l’automate. MI14 compte ainsi **48 cellules utilisées au rendu et six références**. L’état d’avertissement reste utilisé : le rendu le choisit lorsque le télégraphe d’attaque est actif. Les sources et leurs empreintes sont consignées ; les manifestes, images et preuves historiques restent inchangés. Les 542 cellules représentent des pièces et des états, sans ajout de personnes ni de cycles d’animation finaux.

Le [contrôle de source](validation/workbook-v0.15-v0157-source.json) conserve les **1 007 IDs ordonnés**, les **133 critères initiaux** et tous les statuts : **273 Conçu, 442 Prototype, 100 À produire et 192 Vérifié**. Il compare également les **1 681 fichiers historiques protégés** présents dans la baseline publiée 0.15.6, commit `154f32961123325e40fd29b29d97b979330243ab`. Les 978 autres fiches restent identiques.

La [génération](validation/workbook-v0.15-v0157-validation.json) recalcule le classeur avec **@oai/artifact-tool**, éprouve un changement temporaire de statut puis le restaure avant export. L’[inspection XML indépendante](validation/workbook-v0.15-v0157-export.json) réconcilie **6 767 cellules source et 126 formules sans erreur**, **20 validations de statut**, **80 règles conditionnelles** et les vingt volets de données. L’[audit des références](validation/workbook-v0.15-v0157-references.json) résout **2 464 références développées** ; les [sept mutations négatives](validation/production-v015-v0157-reference-probes.json) sont rejetées. Le contrôle historique des 977 IDs de 0.14.1 utilise sa fixture figée lorsque son commit local est absent ; il ne reconstitue pas un historique Git manquant.

La [comparaison avec le couple source/XLSX 0.15.6](validation/workbook-v0.15-v0157-layout.json) reçoit **7 546 cellules non affectées et 978 fiches inchangées**, avec styles, colonnes, vues et volets identiques. Les [17 vues de cette génération](validation/workbook-v0.15-v0157-visual-review.json) couvrent toutes les lignes modifiées, la synthèse et l’en-tête de version. Leur relecture ne montre ni texte coupé ni chevauchement dans ces plages. Les images sont conservées dans [les aperçus 0.15.7](previews/bible-v0157/00-Synthese.png), avec les [inspections](validation/workbook-v0.15-v0157-inspection.ndjson) et le [contrôle des formules](validation/workbook-v0.15-v0157-formula-check.ndjson) de l’export.

Conduites, plaques et tabliers suivent les surfaces existantes. Bras de barrière, rotors, volants et crochets conservent leurs articulations ; câbles, chaleur, vapeur, lumière, progression et documents restent déterminés par les états du jeu. Les animaux et habitats de Thyr, le porteur MI13 et ses caisses déjà peints sont conservés. La campagne reste à MI01–MI14, six châssis, trois opérations et un dossier v14. Les animations finales, capacités encore conçues et réceptions humaines restent ouvertes. Cette réception du classeur porte sur son moteur de calcul, son export et ses aperçus ; elle ne constitue ni une nouvelle session bureautique native, ni une réception navigateur, ni un essai humain.

## Réception historique du classeur 0.15.6

Le [complément Bible 0.15.6](BIBLE_V15_6.md) décrit les **30 fiches existantes** mises à jour pour les infrastructures de Nacre, les six familles du terrain chimique MI10 et les appareils et nids MI11. Les **13 atlas et 75 cellules nouvelles**, toutes utilisées au rendu, portent le total à **58 atlas et 461 cellules**. Les références des lots antérieurs conservent leur rôle. Les trois cases de grille vides du lot chimique ne sont pas comptées comme sprites.

Les **1 007 IDs ordonnés**, tous les critères et les statuts sont conservés : **273 Conçu, 442 Prototype, 100 À produire et 192 Vérifié**. L’export reçoit **6 767 cellules source et 126 formules sans erreur**. La comparaison avec le couple source/XLSX immuable 0.15.5 conserve **7 543 cellules non affectées et 977 fiches inchangées**, ainsi que les styles, colonnes, vues et volets. Les **18 nouvelles vues** couvrent toutes les lignes modifiées et ont été relues. Les [reçus `patch6`](BIBLE_V15_6.md#conservation-et-contrôles-du-classeur) conservent aussi les empreintes des **1 702 preuves et aperçus historiques** de la baseline.

La mise à jour est graphique : niveaux d’eau, contacts physiques, ouvertures, habitants, pollution, copies, consentement et progression gardent leur simulation. Les bâtiments peints ne créent aucun occupant ni arrivée. Le registre de production 0.15 reste historique. Aucun critère humain, capacité encore conçue, mission ou format de sauvegarde n’est promu par cette tranche. Les contrôles du classeur restent distincts des réceptions du jeu, d’une utilisation bureautique native et d’une séance humaine.

## Réception historique du classeur 0.15.5

Le [complément Bible 0.15.5](BIBLE_V15_5.md) décrit les **28 fiches existantes** mises à jour pour les transports de MI02/MI13, l’ambulance et les bateaux de Nacre, puis le Prétoire et les relais de MI12. Les **13 atlas et 80 cellules nouvelles** portent le total à **45 atlas et 386 cellules**. Le nouveau lot distingue **77 cellules utilisées au rendu et trois références**. Roues, quilles, deux caisses, vrais pieds du Prétoire, dégâts et apparitions conservent leurs états et positions simulés. Les coques vides ne créent aucun passager.

Les **1 007 IDs ordonnés**, tous les critères et les statuts sont conservés : **273 Conçu, 442 Prototype, 100 À produire et 192 Vérifié**. L’export reçoit **6 767 cellules source et 126 formules sans erreur**. La comparaison avec le couple source/XLSX immuable 0.15.4 conserve **7 548 cellules non affectées et 979 fiches inchangées**, ainsi que les styles, colonnes, vues et volets. Les **23 nouvelles vues** couvrent toutes les lignes modifiées et ont été relues. Les [reçus `patch5`](BIBLE_V15_5.md#conservation-et-contrôles-du-classeur) conservent aussi les empreintes des **1 511 preuves et aperçus historiques** de la baseline.

La mise à jour est graphique : elle ne clôture aucun critère humain, ne modifie ni campagne, ni sauvegarde v14, ni capacité encore conçue. Les contrôles du classeur restent distincts des réceptions du jeu, d’une utilisation bureautique native et d’une séance humaine.

## Réception historique du classeur 0.15.4

Le [complément Bible 0.15.4](BIBLE_V15_4.md) décrit vingt fiches enrichies pour Cerbère et la vie de Thyr. Les neuf atlas et 78 cellules ajoutées portaient le total à **32 atlas et 306 cellules**. Tous les statuts et critères étaient conservés; 987 fiches restaient identiques. Les [reçus `patch4`](BIBLE_V15_4.md#conservation-et-contrôles-du-classeur) portent sur 6 767 cellules source, 126 formules sans erreur, 7 557 cellules non affectées, treize vues relues et 1 390 preuves historiques conservées. Ils restent associés aux octets 0.15.4.

## Réception historique du classeur 0.15.3

Le [complément Bible 0.15.3](BIBLE_V15_3.md) décrit les dix-huit fiches mises à jour pour les six marcheurs peints. Les **96 cellules de pièces et états** portent le total à **23 atlas et 228 cellules** avec MI14 et le combat. Les rigs gardent leurs appuis, articulations et montages existants. Le radiateur possède trois états statiques peints; son état touché et sa réparation progressive restent vectoriels.

Tous les statuts sont conservés : **273 Conçu, 442 Prototype, 100 À produire et 192 Vérifié**. L’export reçoit **6 767 cellules source et 126 formules sans erreur**. La comparaison conserve **7 556 cellules non affectées et 989 fiches inchangées**, les styles, colonnes, vues et volets. Onze nouvelles plages couvrant toutes les lignes modifiées sont inspectées visuellement. Les [reçus `patch3`](BIBLE_V15_3.md#conservation-et-contrôles-du-classeur) conservent les critères et les 53 preuves historiques inventoriées avant le patch.

Les cycles, postures, recul et rechargements finaux AS06–AS09 restent À produire. La livraison ne change ni les capacités spécialisées encore conçues, ni MI01–MI14, ni le dossier v14. Cette réception de classeur ne déclare aucune nouvelle interaction bureautique native ou séance humaine.

## Réception historique du classeur 0.15.2

Le [complément Bible 0.15.2](BIBLE_V15_2.md) décrit les onze fiches mises à jour pour les neuf atlas de combat. Les **78 cellules nouvelles**, dont **32 poses de marche**, portent le total à **17 planches et 132 cellules** avec MI14. Le seul changement de statut est **AS14 : À produire → Prototype** ; les rôles humains génériques ne clôturent pas les lots de factions AS11/AS12.

Les comptes sont **273 Conçu, 442 Prototype, 100 À produire et 192 Vérifié**. L’export reçoit 6 767 cellules source et 126 formules sans erreur. La comparaison conserve 7 566 cellules non affectées et 996 fiches inchangées, les styles, colonnes et volets. Six nouvelles plages sont inspectées visuellement. Les [reçus `patch2`](BIBLE_V15_2.md#contrôles-du-classeur) identifient les octets 0.15.2 et conservent les critères et preuves antérieurs.

## Réception historique du classeur 0.15.1

La mise à jour décrit **huit atlas PNG transparents et 54 cellules**, dont seize poses de marche réparties entre deux tenues. Les 24 cellules de personnes comprennent aussi les poses de repos, d’arrivée, de perte et deux poses agenouillées conservées comme références ; les 30 autres cellules couvrent les machines et leurs accessoires. Ces cellules ne sont pas 54 nouveaux personnages. Le jeu garde ses huit personnes locales et ses règles MI14. L’art et les animations restent au stade **Prototype**.

Les fiches **AS19, PR99, PX117, PX118 et PX121** reçoivent des descriptions ciblées. Le [contrôle de source](validation/workbook-v0.15-patch1-source.json) confirme les **1 007 IDs ordonnés**, tous les statuts et les 1 002 autres lignes inchangés par rapport à la source 0.15.0. Aucun ID ni critère de production n’a été ajouté. Les réceptions de la 0.15 initiale restent conservées ; les nouveaux reçus utilisent le suffixe `patch1`.

La [validation de génération](validation/workbook-v0.15-patch1-validation.json) réconcilie les comptes avec le JSON, puis éprouve le recalcul par une modification temporaire de statut, restaurée avant l’export. L’[export indépendant](validation/workbook-v0.15-patch1-export.json) compare **6 767 cellules source**, reçoit les **126 formules sans erreur**, **20 plages de validation**, **80 règles conditionnelles** et les volets figés des vingt onglets de données. L’[audit de références](validation/workbook-v0.15-patch1-references.json) résout **2 428 références développées**, sans erreur.

La [comparaison avec le classeur 0.15.0](validation/workbook-v0.15-patch1-layout.json) conserve **7 584 cellules non concernées** et **1 002 lignes de données inchangées**, ainsi que les styles, la géométrie des colonnes, les vues et les volets. La [relecture visuelle](validation/workbook-v0.15-patch1-visual-review.json) porte sur **cinq nouvelles vues** : la [synthèse](previews/bible-v0151/00-Synthese.png), le [kit Kharon](previews/bible-v0151/kit-kharon.png), la [production des atlas](previews/bible-v0151/production-atlas.png), les [personnes et machines](previews/bible-v0151/personnes-machines.png) et le [kit de l’atelier](previews/bible-v0151/kit-atelier.png). Les cinq fiches modifiées sont lisibles, sans texte coupé ni chevauchement observé dans ces plages. Les [inspections](validation/workbook-v0.15-patch1-inspection.ndjson) et le [contrôle des formules](validation/workbook-v0.15-patch1-formula-check.ndjson) portent sur le même export.

| Statut | Fiches de l’export 0.15.1 |
| --- | ---: |
| Conçu | 273 |
| Prototype | 441 |
| À produire | 101 |
| Vérifié | 192 |
| **Total** | **1 007** |

Cette réception ciblée couvre le moteur de calcul d’**@oai/artifact-tool**, l’export ZIP/XML, les références, la conservation et les cinq aperçus. Le nouveau fichier n’a pas été rééprouvé dans LibreOffice ni dans Excel desktop ; le recalcul historique ci-dessous appartient aux octets 0.15.0. **QA29**, **QA230** et **QA231** restent ouvertes pour leurs réceptions respectives en application bureautique interactive, en navigateur et avec un joueur. Les tests automatiques ne les ferment pas.

## Réception historique du classeur 0.15.0

Les contrôles de l’export initial sont consignés dans `docs/validation/workbook-v0.15-*.json`, sans suffixe `patch1`. Ils décrivent les octets 0.15.0, conservés comme référence du contrôle de mise en page courant. La validation de génération réconcilie les fiches et statuts avec le JSON, puis modifie temporairement un statut pour éprouver le recalcul avant de le restaurer. La comparaison ZIP/XML, l’audit des références, la conservation historique, les vues modifiées et le recalcul LibreOffice ont chacun un reçu distinct.

L’[export indépendant](validation/workbook-v0.15-export.json) reçoit **6 767 cellules source**, les **977 IDs historiques**, les **30 ajouts**, les **126 formules sans erreur**, **20 plages de validation**, **80 règles conditionnelles** et les volets figés des vingt onglets de données. L’[audit de références](validation/workbook-v0.15-references.json) résout **2 426 références développées** sans erreur ; les [sept mutations négatives](validation/production-v015-reference-probes.json) sont rejetées et le contrôle des IDs fonctionne aussi sans historique Git.

La [comparaison de mise en page](validation/workbook-v0.15-layout.json) conserve **7 385 cellules non modifiées** et **971 anciennes lignes inchangées**, le XML des styles, la géométrie des colonnes, les vues et les volets. La [relecture visuelle](validation/workbook-v0.15-visual-review.json) couvre **16 images** nouvellement produites : la [synthèse](previews/bible-v015/00-Synthese.png), les six anciennes lignes modifiées et les trente ajouts. Aucun texte coupé ni chevauchement n’a été observé dans ces plages. Les [inspections](validation/workbook-v0.15-inspection.ndjson) et le [contrôle des formules](validation/workbook-v0.15-formula-check.ndjson) portent sur le même export.

Le [recalcul LibreOffice indépendant](validation/workbook-v0.15-libreoffice.json) a retiré les **126 caches** d’une copie jetable, puis l’a convertie en mode headless avec **LibreOfficeDev 26.8.0.0.alpha0**. Les 126 caches sont reconstruits en **13,434 secondes**, les 6 767 cellules source concordent et aucun écart de valeur, de résultat ou de structure contrôlée n’est relevé. LibreOffice normalise l’écriture de cent formules dans sa copie ; leurs résultats restent identiques. Le fichier livré n’a pas été modifié par ce contrôle.

| Statut | Fiches de cet export |
| --- | ---: |
| Conçu | 273 |
| Prototype | 441 |
| À produire | 101 |
| Vérifié | 192 |
| **Total** | **1 007** |

Les empreintes exactes du XLSX et du JSON figurent dans les reçus. **QA29 reste ouverte** pour les filtres, tris, volets et l’édition dans une application bureautique interactive ; aucun essai dans Excel desktop n’est revendiqué. QA230 et QA231 gardent respectivement la réception navigateur et l’essai humain de MI14. Les tests automatiques ne les ferment pas.

## Lire les statuts

| Statut | Signification |
| --- | --- |
| Conçu | Spécification écrite, sans revendication d’implémentation complète. |
| Prototype | Livrable partiel disponible; intégration, usage et limites précisés dans Prototype ou le registre. |
| À produire | Travail identifié dont la réalisation ou le critère de réception reste ouvert. |
| Vérifié | Contrôle réellement exécuté, avec preuve et portée explicites. |

Un scénario QA vérifié ne certifie pas la finition complète du système. Un test DOM ne certifie pas un navigateur, une image Canvas ne certifie pas le HUD HTML et un périphérique simulé ne certifie pas du matériel physique. Les essais humains de Thyr restent ouverts : PR85/QA169 pour MI09, PR88/QA179 pour MI10 et PR91/QA191 pour MI11. Le [protocole MI11](PLAYTEST_VOICE_V12.md) et sa [fiche vierge](validation/human-mi11-session-template-v12.json) préparent une observation; leur présence ne constitue pas une session.

### Portée des observations historiques

La [réception Chrome 0.10](validation/native-v10/browser-reception.json) reste une preuve historique partielle. **QA19 demeure ouverte** : des pauses avec déplacement sont observées dans une instance dupliquée et un autre contexte conserve un résultat contradictoire. La cause de l’écart est indéterminée et le tir maintenu n’a pas été reçu. **QA20 demeure ouverte** : des vues et actions à 100, 125 et 150 % sont reçues dans une fenêtre de 1363 × 1023 pixels; une vraie petite fenêtre native n’a pas été établie. Les captures disponibles et manquantes restent distinguées dans le [journal d’observations](validation/native-v10/native-observations.json).

La [réception native 0.11](validation/native-v11/browser-reception.json) est bloquée : le navigateur a refusé le chemin local `file://` et le [déploiement Vercel](validation/v11-vercel-initial-blocked.json) a rencontré une limite de quota. Ces échecs ne valent pas une réception MI10. La fixture v10 [authentifiée](validation/v012-historic-v10.json) reprend des exports **préparés en simulation** depuis la publication 0.11, sans les transformer en exports natifs. Le [constat natif avant publication 0.12](validation/native-v12/browser-reception.json) conserve son état `not_run`. La [réception partielle en production 0.12](validation/native-v12/production-reception.json), effectuée ensuite, possède ses propres preuves et sa portée de continuation depuis un checkpoint préparé. Ni ces résultats, ni les observations 0.9 et 0.10 ne sont réattribués aux octets de la reconstruction 0.14.1.

## Rechercher et mettre à jour

Les tables proposent filtres, volets figés et listes de statut. Les IDs relient missions, systèmes, assets, production et QA. La synthèse se recalcule quand une fiche change de statut.

Reporter les modifications dans `data/bible.json`, puis régénérer pour conserver une version reproductible. Une édition limitée au XLSX ne modifie pas le JSON et serait remplacée à la génération suivante. Garder les IDs stables et les critères originaux dans le registre lorsque leur réception change.

## Régénérer et contrôler

Le générateur emploie **@oai/artifact-tool** depuis le runtime primaire, sans installer de dépendance dans le dépôt. La [configuration courante](validation/workbook-v0.15-v0157-preview-config.json) sélectionne la synthèse et seize plages couvrant les 29 fiches modifiées et l’en-tête de Prototype. La source `data/bible.json` porte déjà la version 0.15.7. Les configurations et aperçus antérieurs restent conservés. Le suffixe `v0157` distingue les nouveaux reçus des preuves historiques.

```bash
BIBLE_RECEIPT_SUFFIX=v0157 \
  BIBLE_PREVIEW_CONFIG=docs/validation/workbook-v0.15-v0157-preview-config.json \
  "$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs . \
  ../outputs/bible-v0157/final
```

Le répertoire de sortie contient le classeur, les inspections et les aperçus. Le générateur copie le XLSX courant dans `docs/ORDRE_DE_CENDRE_Bible.xlsx`. Les arguments optionnels fixent la racine du dépôt et la sortie. `BIBLE_RENDER_SHEETS` et `BIBLE_EXTRA_PREVIEWS` permettent de remplacer les sélections; `BIBLE_RECEIPT_SUFFIX` peut séparer une réception ultérieure de la réception initiale de cette version.

Les reçus courants portent la version source et le suffixe de réception, par exemple `workbook-v0.15-v0157-validation.json`. Les preuves antérieures gardent leur propre version ; aucun rapport, aperçu ou fixture historique ne doit être remplacé pour décrire les nouveaux octets. Le fichier générique `workbook-validation.json` d’un répertoire de sortie décrit uniquement cette génération.

```bash
BIBLE_RECEIPT_SUFFIX=v0157 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --reference-report docs/validation/workbook-v0.15-v0157-references.json
BIBLE_RECEIPT_SUFFIX=v0157 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-layout.py \
  /chemin/vers/la-bible-0.15.6.xlsx /chemin/vers/la-source-0.15.6.json
BIBLE_RECEIPT_SUFFIX=v0157 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/audit-bible-references.py
```

La génération réconcilie comptes et statuts avec le JSON. Elle modifie temporairement un statut, recalcule, contrôle l’effet puis restaure la valeur. Le vérificateur indépendant lit le ZIP/XML : cellules source, caches de formules, tables, validations, règles conditionnelles et volets. [BIBLE_REFERENCES.md](BIBLE_REFERENCES.md) décrit la résolution des IDs, plages et déclarations symboliques ainsi que les sept mutations négatives. La comparaison de mise en page reçoit le couple source/XLSX 0.15.6 exact, conservé avant modification et identifié par ses empreintes. Un nouveau recalcul natif, s’il est effectué, doit produire son propre reçu `v0157` ; aucun résultat historique ne peut lui être attribué.

## Conserver les sources historiques

La baseline courante est la reconstruction locale 0.14.1 **`fc9f4af4e103adf93d4310053610ca69bea443b3`**. La fixture `tests/fixtures/bible-v014-ids.json` conserve ses **977 IDs**, son arbre, son blob Git et son SHA-256. Ces valeurs proviennent du commit figé, sans reconstruction depuis les nouvelles fiches MI14. Les 133 critères initiaux et toutes les réceptions antérieures sont comparés octet par octet au périmètre historique protégé. Cette comparaison exige la source historique authentique ; elle ne se déduit pas d’un clone contenant uniquement l’arbre republié.

`tools/update-bible-v015.mjs` lit la fixture figée sans la réécrire. Quand le commit local est disponible, il contrôle aussi son arbre, son blob et sa source. Le [reçu de l’outil](validation/bible-v015-update-tool.json) atteste son idempotence et une exécution dans une copie sans Git ; le JSON, la configuration des aperçus et la fixture gardent exactement les mêmes octets.

`tools/update-bible-v0151.mjs` applique ensuite la mise à jour des cinq fiches du lot peint. Il exige 1 007 IDs uniques, conserve leur ordre et tous les statuts et accepte une source 0.15.0 ou 0.15.1. Son idempotence et la comparaison exacte avec la source locale 0.15.0 sont consignées dans le [reçu de source 0.15.1](validation/workbook-v0.15-patch1-source.json). Cette source locale est identifiée par son SHA-256 ; aucun commit public 0.15.0 n’est inventé.

La baseline historique de la reconstruction était la publication 0.12 **`0f77235f7545f33b1a4f298b81a44ee2122d46dc`**, arbre `f652f75342f66ec5a3bbcb298f4f842ac8a09265`. La fixture `tests/fixtures/bible-v012-ids.json` conserve ses **905 IDs**, son blob Git `250d0807771507f4b6349968d5fbec501c76ee64` et le SHA-256 `b44100ba2d91fa2f50bfb2c75de8ff61182593d53a90cf165e524476c8d5bfc8`. Elle est issue de la source publique authentique, sans utiliser les 72 lignes nouvellement rédigées.

Le contrôle de conservation courant s’exécute avec une sortie distincte :

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-baseline.py \
  --output /chemin/de/sortie/conservation-0.15.1.json
```

Il doit être associé au registre de production courant et aux preuves qui existent réellement. Les réceptions historiques suivantes restent conservées.

### Baseline utilisée lors de la 0.12

La baseline de la livraison historique 0.12 était la publication 0.11 **`c7f3273a60824ff4e968ea36ab956c6a41710df0`**, dont l’arbre est `7942d22cfdb0b73e42ae0a427a3afbc986f29160`. La fixture `tests/fixtures/bible-v011-ids.json` conserve les 873 IDs, la révision publique, l’arbre, le blob Git et le SHA-256 de cette source. Elle provient du commit local immuable `f75e674313120094b9540603fbfa571d5df2f1d2`, dont l’arbre est identique. Elle n’a pas été reconstruite à partir des fiches 0.12.

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

## Réception historique du classeur 0.12 — 11 novembre 2026

Le classeur historique 0.12 et sa source avaient passé les contrôles décrits dans cette section. Ces résultats ne reçoivent pas le nouveau classeur 0.15.1. L’[export indépendant](validation/workbook-v0.12-export.json) compare **6 105 cellules source**, conserve les **873 IDs historiques** et identifie les **32 ajouts**. Il reçoit **21 onglets**, **20 tables**, **126 formules sans erreur**, **20 plages de validation**, **80 règles conditionnelles** et les volets figés des vingt onglets de données.

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

## Recalcul historique de la 0.12 dans LibreOffice

Le [recalcul indépendant final](validation/workbook-v0.12-libreoffice.json) a retiré les **126 caches de formules** d’une copie jetable, puis l’a convertie avec **LibreOfficeDev 26.8.0.0.alpha0**, commit `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, en mode headless. La conversion a terminé en **35,922 secondes** : les 126 caches sont reconstruits, les 6 105 cellules source concordent et aucun écart de valeur, de résultat de formule ou de structure contrôlée n’est relevé. LibreOffice normalise l’écriture de cent formules dans sa copie; leurs résultats restent identiques. L’empreinte du classeur livré est inchangée avant et après le contrôle.

Le [journal d’exécution](validation/workbook-v0.12-libreoffice-execution-context.json) conserve le premier dépassement du budget de 55 secondes, un diagnostic annulé et la [conversion du candidat](validation/workbook-v0.12-candidate-libreoffice.json) réussie en 150,213 secondes sur un profil isolé. Le budget explicite de 180 secondes permet ce démarrage plus lent; aucun critère de comparaison n’a été assoupli. Le contrôle final ci-dessus porte sur les octets livrés après consolidation des statuts.

Ce contrôle ne reçoit pas le tri interactif, l’utilisation des filtres, le défilement des volets ou une modification par un utilisateur. **QA29 reste ouverte** pour ces gestes. Aucune exécution dans Excel desktop n’est revendiquée.

Le [bilan historique de production 0.12](PRODUCTION_V12.md), le [contrat MI11](CAMPAIGN_MISSION_11.md), le [contrat du dossier v11](CAMPAIGN_SAVE_V11.md) et le [registre des 133 critères](PRODUCTION_REGISTER_V12.md) expliquent les réalisations et le travail restant. Les documents et preuves des versions précédentes conservent leurs bilans historiques.

Pour la tranche courante du classeur, consulter le [bilan 0.15.7](PRODUCTION_V15_7.md) et les reçus détaillés en tête de ce guide. Les réceptions historiques restent dans le [complément Bible 0.15.6](BIBLE_V15_6.md), le [complément graphique MI14](PRODUCTION_V15_1.md), le [bilan MI14](PRODUCTION_V15.md), le [dossier v14](CAMPAIGN_SAVE_V14.md), le [rapport QA de la reprise](QA_V15.md) et le [rapport des premiers sprites peints](QA_PAINTED_MI14.md). Les résultats de la reconstruction 0.14.1 restent dans son [bilan](PRODUCTION_V14_RECONSTRUCTION.md) et son [rapport QA](QA_RECONSTRUCTION_014.md).
