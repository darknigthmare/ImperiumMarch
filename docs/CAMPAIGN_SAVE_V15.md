# Sauvegarde de campagne v15 — Retrait de Kharon

**Version du jeu 0.16.0 · tranche documentaire 0.16.2 · 20 novembre 2026**

*Spécification de migration. **Aucun code n’est écrit, `src/` n’est pas modifié.** Le dossier courant reste **v14**, la campagne jouable reste **MI01–MI14**, et MI16 reste **Conçu**. Ce document décrit ce que la migration v14→v15 devra faire, ce qu’elle ne pourra jamais faire, et comment le prouver.*

Références : [MI16 — tranche verticale](MI16_TRANCHE_VERTICALE.md) §11 et §12, [dossier v14](CAMPAIGN_SAVE_V14.md), `AGENTS.md` (fixtures historiques), `QA258`–`QA277`.

---

## 1. Format et principe

Le format reste `ordre-de-cendre.campaign`. Les clés de stockage restent `imperium.campaign.v1` et `imperium.campaign.v1.backup` : leur suffixe est historique, seul `version` change. Le contenu courant passe de `version: 14` à `version: 15`.

La migration est **strictement additive** : elle ajoute des champs absents, ne renomme rien, ne supprime rien, ne recalcule rien et ne réécrit aucun fait. Un dossier v14 valide devient un dossier v15 valide sans avoir joué MI16. La seule différence observable, hors champs ajoutés, est le numéro de version.

Trois interdits fondateurs :

1. **Aucun rapport MI01–MI14 n’est réécrit**, y compris pour y ajouter les nouveaux champs d’équipage ou de cale.
2. **Aucun fait n’est inventé** : pas de preuve, pas de personne embarquée, pas de blessure, pas de dégât de navette, pas de défection.
3. **Aucune migration rétroactive** : un dossier v14 importé reste la référence de ce qui a été joué ; la migration ne « corrige » pas une sauvegarde ancienne.

---

## 2. État v14 de référence

Un dossier v14 valide porte exactement : `format`, `version`, `revision`, `stage`, `activeMissionId`, `completed` (0 à 14 reçus), `resources {parts, fuel}`, `crew {tess, sami}`, `authority {reportFiled, suspicion}`, `world {vesper, nacre, thyr, kharon}`, `fleet`, `checkpoint`, `preDecisionCheckpoint`, `lastDebrief`, `maintenanceLog`.

La migration reçoit cet objet, vérifie sa forme, ajoute les champs du §3, passe `version` à 15 en dernier, puis appelle la validation complète. En cas d’échec, **le texte sur disque n’est pas modifié** : ni écrasement, ni sauvegarde partielle, ni « réparation » silencieuse.

---

## 3. Champs ajoutés

| Champ | Valeur initiale | Règle |
| --- | --- | --- |
| `world.kharon.withdrawal` | dossier vide `createWithdrawalDossier()` | aucun état de sortie avant MI16 |
| `ship` | `{ places: 20, reserved: 4, cargo: [] }` | cale vide ; aucun `free` stocké |
| `crew.ilan`, `crew.hela`, `crew.kader`, `crew.milo`, `crew.jun` | `{ trust: 50, alive: true, state: 'indemne' }` | valeurs neutres, documentées |
| `crew.tess`, `crew.sami` | ajout de `alive: true` et `state: 'indemne'` | confiance existante conservée (50 et 25) |
| `depots` | `{ sealed: false }` | aucun dépôt fermé avant une défection |
| `journal` | `[]` | journal des faits vide, aucune entrée rétroactive |
| `lastFailure` | `null` | aucun bilan d’échec antérieur |

`lastFailure` ne figurait pas dans la liste initiale de la tranche, mais MI16 ne peut pas enregistrer un abandon, un `shuttle-grounded` ou un `left-behind` sans lui. Il est ajouté à v15, `null`, et ne contient jamais de champ de victoire.

### 3.1 Dossier `withdrawal` vide

Le dossier vide ne préremplit **aucune exécution** : ni blessé, ni nom, ni dégât, ni destination. Les champs d’exécution restent neutres tant que la sortie n’a pas eu lieu.

```
{
  reportFiled: false,
  reportClauses: [false, false, false],
  reportWording: null,
  cargoLoaded: { proofs: [], parts: 0, persons: [] },
  peopleLeft: 0,
  crewWounded: [], crewLost: [],
  candidatesWounded: [], candidatesLost: [],
  shuttle: null,
  repairUsed: false,
  manifestVerified: null,
  namedBoarded: null,
  proofsBoarded: [], proofsArrived: [], leftBehindProofs: [],
  po04: { acquired: false, reason: null },
  defected: false,
  ilanPosition: null,
  destination: null,
  abandoned: false
}
```

`shuttle: null` signifie « aucune navette engagée » ; une valeur à 100 supposerait une sortie qui n’a pas eu lieu. `manifestVerified` et `namedBoarded` restent `null` : ils décrivent une opération, pas un état initial.

### 3.2 Cale

`ship.cargo` ne contient que ce qui est **physiquement à bord**, avec des entrées `{id, kind, ref, name?, role?, slots, condition, since}`. Une cale vide suffit à valider un dossier migré : aucune preuve n’est créée par la migration, même si `PT01`–`PT03` ou `TE01` sont acquises dans leurs dossiers d’origine. Les places sont calculées, jamais stockées.

### 3.3 Équipage

Les deux membres existants gardent leur identifiant, leur confiance et leur place dans le récit. Les cinq nouveaux sont ajoutés avec la même forme. Aucun reçu MI01–MI14 ne reçoit de ligne supplémentaire : les anciens rapports restent lisibles avec `tessLine` et `samiLine` seuls.

---

## 4. Invariants additifs

Chaque invariant est vérifiable par comparaison canonique (`JSON.stringify` stable ou `deepEqual`) après avoir retiré les champs ajoutés.

| ID | Invariant |
| --- | --- |
| **I1** | `format` inchangé ; `version` passe de 14 à 15, et seulement en dernière étape. |
| **I2** | Aucune clé existante supprimée, renommée ou déplacée ; aucun type modifié. |
| **I3** | `completed` est identique : mêmes clés MI01–MI14, mêmes reçus, mêmes champs, **aucune clé ajoutée aux anciens reçus**. |
| **I4** | `lastDebrief` est identique au reçu qu’il désignait. |
| **I5** | `checkpoint` et `preDecisionCheckpoint` sont identiques, y compris les scènes imbriquées ; la migration ne leur ajoute ni `withdrawal`, ni `ship`, ni `crew`. |
| **I6** | `resources`, `fleet`, `authority`, `maintenanceLog`, `stage`, `activeMissionId` et `revision` sont identiques. |
| **I7** | `world` est identique à l’exception de `world.kharon.withdrawal` ; `foundry` et `workshop` ne sont ni réinitialisés ni complétés. |
| **I8** | `crew.tess.trust` et `crew.sami.trust` sont identiques ; les nouveaux membres n’écrasent aucun membre existant. |
| **I9** | La migration est déterministe : même entrée, même sortie octet pour octet ; une seconde exécution sur un dossier déjà v15 est un **no-op** validé, jamais une re-migration. |
| **I10** | Un dossier v14 avec un champ futur inattendu (`withdrawal`, `ship`, `depots`, `journal`, `lastFailure`) est **refusé**, pas fusionné. |
| **I11** | Un dossier v15 sans reçu MI16 est valide : `validateCampaign` accepte une cale vide et un dossier `withdrawal` vide. |
| **I12** | Les invariants de cohérence ne s’appliquent qu’aux faits présents : `depots.sealed` implique `authority.defected` ; `authority.defected` implique un reçu MI16 `defy`. L’inverse n’est pas vrai par défaut. |

---

## 5. Procédure de migration

1. **Lire** le JSON et vérifier `format`, `version === 14`, présence des clés de §2.
2. **Refuser** toute clé future (§4 I10) et tout `checkpoint` dont `missionId` dépasse MI14 ou qui contient une scène `withdrawal`.
3. **Construire** les ajouts à partir des constructeurs vides, jamais à partir de valeurs déduites du jeu.
4. **Attacher** `world.kharon.withdrawal` sans toucher au reste de `world`, puis `ship`, `depots`, `journal`, `lastFailure`, puis les membres d’équipage.
5. **Passer** `version` à 15, appeler `validateCampaign`, puis retourner l’objet. Tout échec rejette la lecture : l’ancien texte reste intact et la copie de secours n’est pas consommée.

**Lecture et écriture.** La lecture ne réécrit jamais le fichier. Le premier enregistrement après migration conserve l’ancien texte en secours, comme pour les migrations précédentes. Un build antérieur qui reçoit un v15 doit le refuser avec le message existant, sans l’écraser : la liste des versions acceptées par `unsupportedDossier` doit inclure 15 **après** le passage de `CAMPAIGN_SAVE_VERSION`.

**Point d’insertion.** Une branche `if (value.version === 14)` dans `migrateCampaign`, avant le `return`, sur le modèle des branches v11→v12 et v13→v14. Aucune autre branche n’est modifiée.

---

## 6. Fixtures et provenance

**Constat de départ :** il n’existe aujourd’hui **aucune fixture v14**. Les fixtures figées s’arrêtent à `campaign-v13-mi13.json` et `campaign-v13-mi13-transfer.json`. La migration v15 doit donc produire ses propres sources, une seule fois, puis les figer.

| Fixture | Origine | Contenu | Statut |
| --- | --- | --- | --- |
| `campaign-v14-mi14.json` | 0.16.0, parcours MI14 réel (pilote existant) | 14 reçus, `workshop` renseigné | **à produire une fois**, puis figée et attestée |
| `campaign-v15-migrated.json` | migration réelle de la fixture ci-dessus | 14 reçus + champs v15 vides | produite par migration, puis figée |
| `campaign-v15-chain.json` | `campaign-v13-mi13.json` → v14 → v15 | 13 reçus, chaîne de deux migrations | produite par migration, puis figée |
| `campaign-v15-mi16.json` | sortie MI16 gagnée, après réception | cale et reçu MI16 | **pas** une fixture de migration |

**Règles :**

- Une fixture est écrite par une commande unique, en `JSON.stringify(value, null, 2) + '\n'`, et son SHA-256 est enregistré dans `docs/validation/v0162-migration.json` avec la date, la source et le commit outil.
- Une fixture v15 est **produite par la migration**, jamais éditée à la main, jamais reconstruite depuis un état intermédiaire.
- Les fixtures v1–v13 restent inchangées, octets et empreintes compris. Aucune n’est régénérée depuis le code courant.
- La fixture v14 source est nouvelle : elle ne remplace aucune preuve historique et ne prétend pas décrire une livraison antérieure. Elle est attestée comme production 0.16.0.
- Un test vérifie que les fixtures v15 sont stables : deux exécutions de la migration sur la même source donnent le même SHA-256.

---

## 7. Non-régression des rapports MI01–MI14

La migration ne doit rien changer aux quatorze rapports. Les contrôles portent sur les valeurs, pas sur la simple absence d’exception.

| Test | Assertions |
| --- | --- |
| `tests/campaign-v15.test.mjs` | `CAMPAIGN_SAVE_VERSION === 15` ; migration du v14 source ; `world.kharon.withdrawal` égal au dossier vide ; `ship` égal à `{20,4,[]}` ; `crew` complet ; `depots`, `journal`, `lastFailure` présents ; en retirant les ajouts, l’objet est **deepEqual** au v14 source ; `parseCampaign(serializeCampaign(v15))` égal au v15 |
| `tests/campaign-v15.test.mjs` | Pour chacun des 14 reçus : **jeu de clés exact** identique au v14 source (aucun `crewLost`, `shuttle` ou `proofsBoarded` ajouté), valeurs identiques, `tessLine`/`samiLine`/`decisionLabel` inchangés |
| `tests/campaign-v15.test.mjs` | `lastDebrief`, `checkpoint`, `preDecisionCheckpoint`, `resources`, `fleet`, `authority`, `maintenanceLog` et `stage` identiques au v14 source |
| `tests/campaign-v15.test.mjs` | Chaîne v13→v15 : 13 reçus identiques, `nextCampaignMissionId` inchangé, aucun reçu réécrit, `withdrawal` vide |
| `tests/campaign-v15.test.mjs` | Rejets : v14 avec `ship` ou `withdrawal` déjà présent ; v14 avec checkpoint MI16 ; v14 sans `world.kharon.workshop` ; v15 re-migré (no-op validé, pas de doublon) |
| `tests/campaign-v15.test.mjs` | `depots.sealed` sans `authority.defected` refusé ; `authority.defected` sans reçu MI16 `defy` refusé ; cale avec preuve non acquise refusée ; `free` stocké refusé |
| `tests/campaign-save.test.mjs` (extension) | Export/import v15 ; lecture d’un v14 migré ; un build ancien refuse le v15 sans écraser ; la copie de secours conserve l’ancien texte |
| `tests/campaign-mission.test.mjs` (extension) | Les 14 reçus restent lisibles et complets ; un reçu MI14 relu ne reçoit aucune clé v15 ; `nextCampaignMissionId` reste celui de v14 hors drapeau de tranche |
| `tests/campaign-v14.test.mjs` (inchangé) | La suite v14 existante passe encore : elle prouve que le format précédent reste lisible après l’ajout de v15 |
| `tests/campaign-progression.test.mjs` (extension) | Sans `ENABLE_MI16_SLICE`, aucune proposition de MI16 ; avec le drapeau, MI16 n’est proposée qu’après MI14 ; un dossier migré non joué ne saute aucune mission |
| `tests/mi16-cargo-persistence.test.mjs` | Une cale issue d’un dossier migré est vide ; aucune preuve MI01–MI14 n’y apparaît sans embarquement réel |
| Empreintes | Les SHA-256 de `campaign-v1` à `campaign-v13` sont identiques à `docs/validation/` ; aucune fixture historique n’est modifiée par la migration |

**Ce que ces tests ne prouvent pas** : la jouabilité de MI16, la qualité du rapport, l’équilibre des places, les parcours navigateur et l’essai humain. Ces portées restent celles de `QA258`–`QA277` et des reçus de tranche.

---

## 8. Critères de réception

1. Un dossier v14 valide se lit, se migre et s’exporte sans perte, et reste valide avec une cale vide.
2. Retirer les champs ajoutés rend l’objet strictement égal au v14 source, y compris les 14 reçus, `lastDebrief` et les deux checkpoints.
3. Aucun ancien reçu ne gagne de clé ; aucun `crewLost` rétroactif n’apparaît.
4. La migration est déterministe et une seconde exécution est un no-op.
5. Les fixtures v15 sont produites par migration, figées, et leurs empreintes sont attestées.
6. Les fixtures v1–v13 gardent leurs octets et leurs empreintes.
7. Un v15 est refusé par un build antérieur sans écrasement ; la copie de secours reste lisible.
8. Un dossier v15 sans MI16 est accepté ; un dossier avec défection incohérente est refusé.
9. Le journal reste vide et aucune entrée de preuve, de perte ou de défection n’est créée à la migration.
10. `npm run check` et `npm test` passent après réception, sans qu’un test de migration soit présenté comme un essai navigateur ou humain.

---

## 9. Hors périmètre

- L’implémentation de MI16, de son domaine, de sa simulation et de ses écrans.
- La modification d’un reçu MI01–MI14, même pour l’enrichir.
- Le passage de la version applicative à 0.16.2 : seule la tranche documentaire porte ce numéro.
- Une interface de gestion de sauvegarde, un import/export nouveau, une migration v15→v16.
- Les preuves navigateur et l’essai humain, qui restent des réceptions distinctes.
