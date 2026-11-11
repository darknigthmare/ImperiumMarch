# Identifiants et références de la bible

Chaque fiche de `data/bible.json` possède un identifiant stable. Le contrôle de références porte sur toutes les chaînes des vingt domaines et sur les métadonnées. Il résout les IDs formés de deux lettres majuscules suivies de deux ou trois chiffres, les plages fermées telles que `QA116–QA136` et les paires abrégées telles que `PT03/04`.

Une plage doit avoir le même préfixe aux deux extrémités, rester croissante et contenir uniquement des identifiants définis. La présence des deux extrémités ne suffit pas si un identifiant intermédiaire manque. Le contrôle refuse aussi les doublons de fiches et les références inconnues.

## Codes narratifs déclarés

Les codes suivants sont des noms d’opérations ou de sources dans la fiction. Ils ne constituent pas des lignes supplémentaires du classeur. Chaque code renvoie à une fiche canonique qui doit encore contenir sa déclaration. Le vérificateur refuse un symbole dont cette déclaration a disparu.

| Code | Nature | Fiche canonique | Signification |
| --- | --- | --- | --- |
| OP01 | Opération autonome | NA17 | Les voix sous la cendre. |
| OP02 | Opération autonome | NA18 | Le dernier bac. |
| OP03 | Opération autonome | NA19 | L’ordre de trop. |
| PT01 | Source technique | NA32 | Journal de maintenance de Vesper, obtenu seulement par copie réelle à MI04. |
| PT02 | Source technique conçue | MI10 | Échantillon de Thyr. |
| PT03 | Source technique conçue | MI13 | Chaîne industrielle de Kharon, recoupement distinct du journal de Vesper. |
| PT04 | Source technique conçue | MI15 | Schémas de Kharon. |
| PT05 | Source technique conçue | MI18 | Corrélation des dates à Sereis. |
| PO01 | Source politique conçue | MI22 | Ordre et archive d’Ilex. |
| PO02 | Source politique conçue | MI26 | Preuve financière de Méridien. |
| PO03 | Source politique conçue | MI30 | Lien entre direction et programme sur Orthe. |
| TE01 | Source testimoniale conçue | MI11 | Témoignage de Leth. |
| TE02 | Source testimoniale conçue | MI15 | Témoignage d’Aline. |

Les familles PT, PO et TE ne sont pas acceptées globalement : seuls ces treize symboles déclarés peuvent résoudre une référence. Les fins FI01–FI04 sont de véritables fiches de l’onglet Narration et suivent le contrôle ordinaire des IDs.

Une référence résolue démontre la cohérence du lien documentaire. Elle ne rend pas la mission jouable, ne crée pas la preuve dans une sauvegarde et ne démontre pas la vérité d’un fait connu seulement par un personnage. Les statuts Conçu, Prototype et Vérifié gardent leur sens propre.

## Exécuter le contrôle

Le contrôle peut être exécuté sans ouvrir ni réécrire le classeur :

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --references-only \
  --reference-report docs/validation/production-v010-final-reference-audit.json
```

L’export complet exécute le même contrôle avant la comparaison ZIP/XML. Sa baseline par défaut est la publication authentique `2bb8d7a708e4fab5ab34b3cac10f2418b60fe037`, version 0.9. La fixture `tests/fixtures/bible-v09-ids.json` conserve les 816 IDs dans leur ordre de feuille, le blob Git et le SHA-256 de la source publiée. Cette source est identique à la base locale `e0026cb3fcd342309f2201a9288f10b78b8cff84`; l’arbre commun est `e8e278cc5c35f0ef0995ff78c8d499961b96cae9`.

Les baselines 0.8, 0.7, 0.6, 0.5 et 0.4 restent disponibles pour leurs révisions exactes lorsque l’historique Git manque. Une révision absente inconnue est refusée. Le [contrôle de conservation](validation/workbook-v0.10-baseline-check.json) compare la fixture au snapshot authentique, préserve les 816 IDs et les 133 critères initiaux, et identifie les 29 nouveaux IDs.

## Réception des références 0.10

Sur la source finale de 845 fiches, le contrôle a parcouru **4 915 champs textuels**, trouvé **1 236 occurrences**, développé **101 plages fermées** et **une paire abrégée**, puis résolu **1 908 références** sans anomalie. Les 845 IDs sont uniques et les treize déclarations symboliques sont présentes. Le [rapport final détaillé](validation/production-v010-final-reference-audit.json) conserve les emplacements, les cibles et l’empreinte de la source auditée. Les deux occurrences ajoutées par les notes de réception ne créent aucune fiche et ne modifient aucun statut.

```bash
BIBLE_RECEIPT_SUFFIX=final "$CODEX_PRIMARY_RUNTIME_PYTHON" tools/audit-bible-references.py
```

Les [sondes négatives finales](validation/production-v010-final-reference-probes.json) utilisent des copies temporaires : ID inconnu à trois chiffres, trou au milieu d’une plage, plage descendante, préfixes mélangés, ID dupliqué, déclaration symbolique supprimée et partenaire abrégé inconnu. Les sept copies incorrectes sont rejetées. Les six baselines historiques fonctionnent sans Git et une révision inconnue est rejetée. Ces mutations de test ne touchent ni la source réelle, ni le classeur, ni les rapports historiques.

Les [références de la 0.9](validation/production-v09-reference-audit.json) et leurs [sondes historiques](validation/production-v09-reference-probes.json) restent conservées avec leur propre source. Le [premier audit 0.10](validation/production-v010-reference-audit.json) et ses [sondes](validation/production-v010-reference-probes.json) sont également préservés. Ces reçus historiques ne sont pas présentés comme des exécutions sur les nouveaux octets. Les rapports finaux portent le suffixe `final`; le rapport générique 0.9 demeure inchangé.
