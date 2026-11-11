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
| PT02 | Source technique | MI10 | Matière collectée à Thyr, avec trois marquages et registre matériel d’Orison copiés. |
| PT03 | Source technique conçue | MI13 | Chaîne industrielle de Kharon, recoupement distinct du journal de Vesper. |
| PT04 | Source technique conçue | MI15 | Schémas de Kharon. |
| PT05 | Source technique conçue | MI18 | Corrélation des dates à Sereis. |
| PO01 | Source politique conçue | MI22 | Ordre et archive d’Ilex. |
| PO02 | Source politique conçue | MI26 | Preuve financière de Méridien. |
| PO03 | Source politique conçue | MI30 | Lien entre direction et programme sur Orthe. |
| TE01 | Source testimoniale | MI11 | Trois signaux exploitables, copies de l’avertissement et de sa traduction, puis témoignage privé consenti et achevé avec Leth. |
| TE02 | Source testimoniale conçue | MI15 | Témoignage d’Aline. |

Les familles PT, PO et TE ne sont pas acceptées globalement : seuls ces treize symboles déclarés peuvent résoudre une référence. Les fins FI01–FI04 sont de véritables fiches de l’onglet Narration et suivent le contrôle ordinaire des IDs.

Une référence résolue démontre la cohérence du lien documentaire. Elle ne rend pas la mission jouable, ne crée pas la preuve dans une sauvegarde et ne démontre pas la vérité d’un fait connu seulement par un personnage. Les statuts Conçu, Prototype et Vérifié gardent leur sens propre.

## Exécuter le contrôle

Le contrôle peut être exécuté sans ouvrir ni réécrire le classeur :

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/verify-bible-export.py . \
  --references-only \
  --reference-report docs/validation/production-v012-reference-audit.json
```

L’export complet exécute le même contrôle avant la comparaison ZIP/XML. Sa baseline par défaut suit `meta.previousRelease.sourceRevision`. Pour la 0.12, il s’agit de la publication authentique `c7f3273a60824ff4e968ea36ab956c6a41710df0`, version 0.11. La fixture `tests/fixtures/bible-v011-ids.json` conserve les 873 IDs dans leur ordre de feuille, le blob Git et le SHA-256 de la source publiée. Elle provient du commit local immuable `f75e674313120094b9540603fbfa571d5df2f1d2`; l’arbre commun avec la publication est `7942d22cfdb0b73e42ae0a427a3afbc986f29160`.

Les baselines 0.10, 0.9, 0.8, 0.7, 0.6, 0.5 et 0.4 restent disponibles pour leurs révisions exactes lorsque l’historique Git manque. Une révision absente inconnue est refusée. Le [contrôle de conservation 0.12](validation/workbook-v0.12-baseline-check.json) compare la nouvelle fixture au snapshot authentique, préserve les 873 IDs et les 133 critères initiaux, puis identifie les 32 nouveaux IDs. Tous les anciens reçus gardent leurs propres sources et empreintes.

## Réception des références 0.12

L’[audit 0.12](validation/production-v012-reference-audit.json) résout les **905 IDs**, **1 404 occurrences** et **2 151 références développées**, dans **5 247 champs textuels**. Il examine **115 plages fermées** et une paire abrégée; aucune référence irrésolue ni aucun ID dupliqué n’est relevé. TE01 reste lié à sa déclaration canonique dans MI11 et à ses conditions de récit, sans assimiler sa présence dans la Bible à une preuve acquise dans une partie.

Les [sondes négatives 0.12](validation/production-v012-reference-probes.json) rejettent les sept mutations incorrectes : ID absent, trou dans une plage, plage descendante, préfixes incompatibles, doublon, déclaration symbolique supprimée et partenaire abrégé inexistant. Les **huit baselines authentiques** sont également acceptées dans une copie sans Git. Le neuvième cas de cette série refuse une révision inconnue; il ne constitue pas une neuvième baseline.

La source courante conserve les **873 IDs de la 0.11** et ajoute **32 fiches**. Le contrôle de conservation compare les anciens reçus et les 133 critères initiaux séparément. Les nouvelles lignes ne changent pas le dénominateur du registre. Les rapports 0.11 et antérieurs restent inchangés, avec leur source et leur portée historiques.

## Réception des références 0.11

La source de **873 fiches** contient **5 070 champs textuels** contrôlés, **1 314 occurrences**, **108 plages fermées** et **une paire abrégée**. Le contrôle résout **2 024 références** sans anomalie. Les 873 IDs sont uniques et les treize déclarations symboliques sont présentes. Le [rapport détaillé](validation/production-v011-reference-audit.json) conserve les emplacements, les cibles et l’empreinte de la source auditée.

```bash
"$CODEX_PRIMARY_RUNTIME_PYTHON" tools/audit-bible-references.py
```

Les [sondes 0.11](validation/production-v011-reference-probes.json) reprennent les sept mutations négatives décrites ci-dessous sur des copies temporaires. Elles contrôlent également les sept baselines authentiques dans un dossier sans Git et le refus d’une révision inconnue. Ces mutations ne modifient pas la source, le classeur ou les reçus historiques.

## Réception des références 0.10

Sur la source finale de 845 fiches, le contrôle a parcouru **4 915 champs textuels**, trouvé **1 236 occurrences**, développé **101 plages fermées** et **une paire abrégée**, puis résolu **1 908 références** sans anomalie. Les 845 IDs sont uniques et les treize déclarations symboliques sont présentes. Le [rapport final détaillé](validation/production-v010-final-reference-audit.json) conserve les emplacements, les cibles et l’empreinte de la source auditée. Les deux occurrences ajoutées par les notes de réception ne créent aucune fiche et ne modifient aucun statut.

Les [sondes négatives finales](validation/production-v010-final-reference-probes.json) utilisent des copies temporaires : ID inconnu à trois chiffres, trou au milieu d’une plage, plage descendante, préfixes mélangés, ID dupliqué, déclaration symbolique supprimée et partenaire abrégé inconnu. Les sept copies incorrectes sont rejetées. Les six baselines historiques fonctionnent sans Git et une révision inconnue est rejetée. Ces mutations de test ne touchent ni la source réelle, ni le classeur, ni les rapports historiques.

Les [références de la 0.9](validation/production-v09-reference-audit.json) et leurs [sondes historiques](validation/production-v09-reference-probes.json) restent conservées avec leur propre source. Le [premier audit 0.10](validation/production-v010-reference-audit.json) et ses [sondes](validation/production-v010-reference-probes.json) sont également préservés. Ces reçus historiques ne sont pas présentés comme des exécutions sur les nouveaux octets. Les rapports finaux 0.10 portent le suffixe `final`; le rapport générique 0.9 demeure inchangé.
