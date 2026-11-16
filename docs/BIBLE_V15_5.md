# Bible 0.15.5 — Transports, Nacre et relais

La [Bible Excel](ORDRE_DE_CENDRE_Bible.xlsx) décrit les treize atlas peints ajoutés aux véhicules et objets déjà simulés. Les **1 007 fiches, leurs identifiants, leur ordre, les 133 critères initiaux et tous les statuts sont conservés**. La [source JSON](../data/bible.json) demeure la référence éditable. Ce document reçoit le classeur; les contrôles graphiques du jeu possèdent leurs propres preuves.

## Lot enregistré

| Sujet | Atlas | Cellules | Utilisées au rendu | Références |
| --- | ---: | ---: | ---: | ---: |
| Locomotive et wagons de MI02 | 2 | 12 | 12 | 0 |
| Porteur et caisses de série de MI13 | 2 | 8 | 8 | 0 |
| Ambulance et matériel de MI07 | 2 | 10 | 9 | 1 |
| Rive-Courte, Veille d’Aval, bateau de passage et Saisie | 4 | 20 | 20 | 0 |
| Prétoire, mâts et consoles de MI12 | 3 | 30 | 28 | 2 |
| **Nouveau lot** | **13** | **80** | **77** | **3** |

Les 32 atlas et 306 cellules antérieurs restent conservés. Le total décrit atteint **45 atlas et 386 cellules**. Ces nombres comptent des pièces, poses, états et références, sans ajouter autant de véhicules, individus ou cycles complets. Les comptes et les SHA-256 des treize PNG ont été contrôlés à partir des manifestes [transport](../assets/painted/transport/manifest.json), [Nacre](../assets/painted/nacre/manifest.json) et [relais](../assets/painted/relay/manifest.json).

La balise récupérée de Nacre, le canon endommagé du Prétoire et la cassette isolée des relais sont les trois références du nouveau lot. Elles ne créent aucun état de dommage, équipement récupéré ou renseignement supplémentaire. Les coques de bateaux sont vides : leurs occupants et les arrivées comptées restent séparés et déterminés par la simulation. Roues, quilles, charges, dommages et conditions d’apparition conservent leurs positions et règles.

Le Prétoire possède quatre véritables pieds simulés. Ses pièces peintes suivent ces contacts, son capteur, son verrou et sa bouche de tir existante. Cette articulation reste distincte des jambes visuelles de Cerbère. Le porteur garde ses quatre roues et ses deux caisses physiques; sa cabine basse laisse leur emplacement libre.

## Portée conservée

Le script [update-bible-v0155.mjs](../tools/update-bible-v0155.mjs) exige les trois manifestes définitifs et vérifie les octets des images avant de modifier la source. Il cible **28 fiches descriptives** :

| Domaine | Identifiants |
| --- | --- |
| Véhicules | VE02, VE12, VE17 |
| Assets | AS14, AS17, AS18, AS19, AS30, AS38, AS45, AS46, AS49, AS50 |
| Production | PR12, PR93, PR96 |
| Prototype | PX24, PX32, PX58, PX59, PX73, PX74, PX78, PX81, PX106, PX109, PX111, PX115 |

Les métadonnées courantes et la description de l’onglet Prototype passent à 0.15.5. **979 fiches restent identiques** à la source 0.15.4. Aucun identifiant n’est ajouté, retiré ou déplacé; aucun statut, critère de réception ou résultat attendu n’est réécrit. Les métadonnées de la reconstruction et des versions historiques sont conservées.

| Statut | Fiches, inchangées depuis 0.15.4 |
| --- | ---: |
| Conçu | 273 |
| Prototype | 442 |
| À produire | 100 |
| Vérifié | 192 |
| **Total** | **1 007** |

La campagne reste **MI01–MI14**, six châssis et trois opérations autonomes, avec sauvegardes **v14**. MI15–MI32 et les seize contrats restent conçus. Cette tranche graphique ne clôture aucun critère humain : animations finales, équipages, gestes sanitaires, compréhension des transferts, autres environnements et capacités encore conçues restent ouverts.

## Conservation et contrôles du classeur

La comparaison utilise la source et le XLSX du commit local immuable 0.15.4 **`b39133c32cf001e64d3526edbc4a43dfd9e0e715`**. Elle ne suppose aucune publication de ce commit. Le [contrôle de source](validation/workbook-v0.15-patch5-source.json) reçoit les 1 007 identifiants ordonnés, tous les statuts, tous les textes actuels des critères et résultats attendus, la portée jouable, les 28 modifications ciblées et l’idempotence de l’outil. Les **1 511 preuves et aperçus historiques** suivis par ce commit conservent leurs octets et empreintes.

Les 133 critères initiaux restent dans leur [baseline immuable](validation/production-v09-baseline.json). La différence de rédaction historique de QA25 est conservée et explicitée dans le reçu; elle n’est pas introduite par ce patch.

Le builder existant emploie `@oai/artifact-tool` depuis le runtime primaire. Le [contrôle ZIP/XML](validation/workbook-v0.15-patch5-export.json) reçoit :

- **6 767 cellules source** réconciliées avec le JSON;
- **126 formules calculées**, sans cellule en erreur;
- **21 onglets, vingt tableaux, vingt plages de validation, quatre-vingts règles conditionnelles et vingt jeux de volets figés**;
- les comptes de statut, avec modification temporaire, recalcul puis restauration vérifiés par le générateur.

Le [contrôle des références](validation/workbook-v0.15-patch5-references.json) ne relève aucun identifiant non résolu. Les [sondes de référence](validation/production-v015-patch5-reference-probes.json) rejettent sept mutations incorrectes et vérifient onze cas de chargement des baselines sans Git, dont le rejet d’une révision inconnue. Ces sondes s’exécutent dans des copies jetables.

La [comparaison de mise en page](validation/workbook-v0.15-patch5-layout.json) reçoit **7 548 cellules non affectées et 979 fiches inchangées**. Le XML des styles, la géométrie des colonnes, les vues et les volets restent identiques à la Bible 0.15.4. Les hauteurs des lignes non modifiées sont préservées; les lignes enrichies gardent le calcul de hauteur du builder existant.

Trois vues de référence — Synthèse, Assets et Prototype — ont été rendues puis inspectées avant modification. Les **23 nouvelles vues** couvrent ensuite toutes les lignes modifiées : la [Synthèse](previews/bible-v0155/00-Synthese.png), trois vues Véhicules, six plages Assets, trois vues Production et dix plages Prototype. Le [reçu visuel](validation/workbook-v0.15-patch5-visual-review.json) associe chaque image à sa plage, ses identifiants et son empreinte. Toutes ont été ouvertes et relues : fins de texte, limites, critères et statuts restent visibles dans les cellules modifiées, sans chevauchement ni troncature observés.

Les [inspections](validation/workbook-v0.15-patch5-inspection.ndjson) et le [contrôle des formules](validation/workbook-v0.15-patch5-formula-check.ndjson) complètent cette réception. Les nouveaux reçus portent le suffixe `patch5`; les aperçus sont rangés dans `docs/previews/bible-v0155/`. Ces contrôles ne constituent ni interaction native avec un tableur, ni réception navigateur du jeu, ni séance humaine.

## Reproduction

Conserver la source et le classeur exacts 0.15.4 hors du dépôt, puis exécuter :

```bash
"$CODEX_PRIMARY_RUNTIME_NODE" tools/update-bible-v0155.mjs
BIBLE_RECEIPT_SUFFIX=patch5 BIBLE_PREVIEW_CONFIG=data/bible-v0155-previews.json \
  "$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs \
  "$PWD" "${PWD}/../outputs/bible-v0155/final"
BIBLE_RECEIPT_SUFFIX=patch5 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --reference-report docs/validation/workbook-v0.15-patch5-references.json
BIBLE_RECEIPT_SUFFIX=patch5 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-layout.py \
  /chemin/vers/baseline/bible.xlsx /chemin/vers/baseline/bible.json
BIBLE_RECEIPT_SUFFIX=patch5 "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/audit-bible-references.py
```

Toute modification ultérieure des descriptions exige un nouvel export et une relecture des plages concernées. Les reçus historiques restent associés aux octets qu’ils décrivent.
