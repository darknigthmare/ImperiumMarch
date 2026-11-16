# Bible 0.15.6 — Infrastructures de Nacre et sites de Thyr

La [Bible Excel](ORDRE_DE_CENDRE_Bible.xlsx) décrit les treize atlas ajoutés aux sites déjà simulés de Nacre, au terrain chimique de MI10 et aux appareils et nids de MI11. Les **1 007 fiches, leurs identifiants, leur ordre, les 133 critères initiaux et tous les statuts sont conservés**. La [source JSON](../data/bible.json) demeure la référence éditable. Cette réception porte sur le classeur; les contrôles graphiques et jouables possèdent leurs propres preuves.

## Lot enregistré

| Sujet | Atlas | Cellules | Utilisées au rendu | Références nouvelles |
| --- | ---: | ---: | ---: | ---: |
| Nacre : panneaux, hydraulique, maisons, accueils, quais, rampes et treuils | 5 | 30 | 30 | 0 |
| MI10 : cuves, prélèvement, registre, vannes, canaux et maisons | 5 | 24 | 24 | 0 |
| MI11 : écoute, traduction, émetteur, nids et repère de passage | 3 | 21 | 21 | 0 |
| **Nouveau lot** | **13** | **75** | **75** | **0** |

Les **45 atlas et 386 cellules antérieurs** sont conservés. Le total décrit atteint **58 atlas et 461 cellules**, en conservant le rôle des références antérieures. Les nombres comptent des pièces et des états, sans ajouter autant de personnes, machines ou cycles complets. Les trois cases de grille vides du lot chimique ne sont pas des sprites.

Les comptes, dimensions, tailles et SHA-256 des treize PNG retenus ont été contrôlés à partir des manifestes [Nacre](../assets/painted/nacre-sites/manifest.json), [chimique](../assets/painted/chemical/manifest.json) et [voix](../assets/painted/voice/manifest.json). Les originaux retenus représentent **22 619 392 octets** : 7 779 670 pour Nacre, 7 841 342 pour MI10 et 6 998 380 pour MI11. Les images sélectionnées restent inchangées; l’indexation mesure les découpes et les ancres sans réécrire les pixels.

## Correspondance avec le jeu

Nacre couvre les treuils et lames de tablier de MI05; le panneau, l’hydraulique, les maisons et l’abri de MI06; la rampe et les accueils civil et impérial de MI07; puis les vantaux, commandes, quais, passerelles et refuges de MI08. Les pièces suivent les sites existants. Les bâtiments ne contiennent aucun occupant peint : les personnes, les secours et les arrivées restent issus de la simulation. Les repères de marée précis, les radios et le registre gardent leur rendu vectoriel. L’eau, les ouvertures et la progression des interventions restent dynamiques.

Les six familles de MI10 partagent cinq atlas, le prélèvement et le registre se trouvant sur la même image. Les cuves, canaux, vannes et maisons conservent leurs états physiques. Masses émises, retenues ou livrées, pollution, copies et acquisition de PT02 restent déterminées par les opérations existantes. La peinture des canaux ne remplace pas leur surface d’appui simulée.

Les trois atlas de MI11 couvrent cinq familles de sites. Le repère peint du passage ne remplace pas la corniche physique; les vrais contacts des pieds restent ceux de la simulation. Les nids ne créent aucune nouvelle population ou phase biologique. Leth conserve ses huit cellules de la 0.15.4, dont deux références d’outils. Écoutes, copies, consentement, disponibilité du témoin, état de l’émetteur et acquisition de TE01 gardent leurs conditions existantes.

## Portée conservée

Le script [update-bible-v0156.mjs](../tools/update-bible-v0156.mjs) exige les trois manifestes définitifs et vérifie les octets, dimensions et usages des images avant de modifier la source. Il cible **30 fiches descriptives** :

| Domaine | Identifiants |
| --- | --- |
| Assets | AS17, AS18, AS30, AS38, AS44, AS45, AS46, AS48, AS49, AS50, AS52 |
| Production | PR12, PR86, PR89 |
| Prototype | PX24, PX57, PX62, PX64, PX67, PX70, PX75, PX78, PX79, PX82, PX95, PX96, PX97, PX100, PX102, PX103 |

Les métadonnées courantes et la description de l’onglet Prototype passent à 0.15.6. **977 fiches restent identiques** à la source 0.15.5. Aucun identifiant n’est ajouté, retiré ou déplacé; aucun statut, critère de réception ou résultat attendu n’est réécrit. Les métadonnées de la reconstruction et des versions historiques sont conservées. Le registre de production 0.15 reste associé à sa réception historique; cette tranche ne le présente pas comme un nouveau registre reçu.

| Statut | Fiches, inchangées depuis 0.15.5 |
| --- | ---: |
| Conçu | 273 |
| Prototype | 442 |
| À produire | 100 |
| Vérifié | 192 |
| **Total** | **1 007** |

La campagne reste **MI01–MI14**, six châssis et trois opérations autonomes, avec sauvegardes **v14**. MI15–MI32 et les seize contrats restent conçus. Les nouveaux dessins ne clôturent aucun critère humain. Animations finales, gestes de secours, audio, autres environnements et compréhension humaine restent ouverts.

## Conservation et contrôles du classeur

La comparaison utilise la source et le XLSX exacts de l’arbre 0.15.5 **`9f0c3ae87920b1665a25f15cb03add6a85bf3b7a`**, publié par le commit **`5171ae2aabb74915d944f1e487bea0433f76f51f`**. La copie locale immuable porte le commit `65b14f2eb10a94c7c45ed73db944eebb5158bca5`, avec le même arbre. Les deux fichiers de référence ont été copiés avant modification.

Le [contrôle de source](validation/workbook-v0.15-patch6-source.json) reçoit les 1 007 identifiants ordonnés, tous les statuts, tous les textes actuels des critères et résultats attendus, la portée jouable, les trente modifications ciblées et l’idempotence de l’outil. Les **1 702 preuves et aperçus historiques** suivis dans l’arbre de référence conservent leurs octets et empreintes.

Les 133 critères initiaux restent dans leur [baseline immuable](validation/production-v09-baseline.json). La différence de rédaction historique de QA25 est conservée et explicitée dans le reçu; elle n’est pas introduite par ce patch.

Le builder existant emploie `@oai/artifact-tool` depuis le runtime primaire. Le [contrôle ZIP/XML](validation/workbook-v0.15-patch6-export.json) reçoit :

- **6 767 cellules source** réconciliées avec le JSON;
- **126 formules calculées**, sans cellule en erreur;
- **21 onglets, vingt tableaux, vingt plages de validation, quatre-vingts règles conditionnelles et vingt jeux de volets figés**;
- les comptes de statut, avec modification temporaire, recalcul puis restauration vérifiés par le générateur.

Le [contrôle des références](validation/workbook-v0.15-patch6-references.json) résout **2 451 références développées**, sans identifiant non résolu. Les [sondes de référence](validation/production-v015-patch6-reference-probes.json) rejettent sept mutations incorrectes et vérifient onze cas de chargement des baselines sans Git, dont le rejet d’une révision inconnue. Ces sondes s’exécutent dans des copies jetables.

La [comparaison de mise en page](validation/workbook-v0.15-patch6-layout.json) reçoit **7 543 cellules non affectées et 977 fiches inchangées**. Le XML des styles, la géométrie des colonnes, les vues et les volets restent identiques à la Bible 0.15.5. Les hauteurs des lignes non modifiées sont préservées; les lignes enrichies gardent le calcul de hauteur du builder existant.

Quatre vues de référence — Synthèse, kits Assets, infrastructures Nacre et fiches Thyr — ont été rendues puis inspectées avant modification. Les **18 nouvelles vues** couvrent ensuite toutes les lignes modifiées : la [Synthèse](previews/bible-v0156/00-Synthese.png), six plages Assets, trois plages Production et huit plages Prototype. Le [reçu visuel](validation/workbook-v0.15-patch6-visual-review.json) associe chaque image à sa plage, ses identifiants et son empreinte. Toutes ont été ouvertes et relues : fins de texte, limites, critères et statuts restent visibles, sans chevauchement ni troncature observés dans les cellules modifiées.

Les [inspections](validation/workbook-v0.15-patch6-inspection.ndjson) et le [contrôle des formules](validation/workbook-v0.15-patch6-formula-check.ndjson) complètent cette réception. Les nouveaux reçus portent le suffixe `patch6`; les aperçus sont rangés dans `docs/previews/bible-v0156/`. Ces contrôles ne constituent ni interaction native avec un tableur, ni réception navigateur du jeu, ni séance humaine.

## Reproduction

Conserver la source et le classeur exacts 0.15.5 hors du dépôt, puis exécuter :

```bash
"$CODEX_PRIMARY_RUNTIME_NODE" tools/update-bible-v0156.mjs
BIBLE_RECEIPT_SUFFIX=patch6 BIBLE_PREVIEW_CONFIG=data/bible-v0156-previews.json \
  "$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs \
  "$PWD" "${PWD}/../outputs/bible-v0156/final"
BIBLE_RECEIPT_SUFFIX=patch6 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --reference-report docs/validation/workbook-v0.15-patch6-references.json
BIBLE_RECEIPT_SUFFIX=patch6 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-layout.py \
  /chemin/vers/baseline/bible.xlsx /chemin/vers/baseline/bible.json
BIBLE_RECEIPT_SUFFIX=patch6 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/audit-bible-references.py
```

Toute modification ultérieure des descriptions exige un nouvel export et une relecture des plages concernées. Les reçus historiques restent associés aux octets qu’ils décrivent.
