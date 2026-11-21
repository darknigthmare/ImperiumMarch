# MI16 — LE RAPPORT QUI NE PART PAS

**Tranche verticale · spécification d’implémentation · 20 novembre 2026**

*Document de conception. **Aucun code n’est écrit, aucun fichier de `src/` n’est modifié.** MI16 reste **Conçu** : la campagne jouable demeure MI01–MI14 et le dossier v14. Ce document découpe la mission en lots implémentables, fixe les décisions et les constantes du lot 0 et liste les tests dont dépend chaque lot.*

Références : [CAMPAIGN_FR.md](CAMPAIGN_FR.md) §MI16 (Conçu), [CHRONIQUE_DES_MONDES.md](CHRONIQUE_DES_MONDES.md) §11 et §13, `NA28`, `NA108`, `NA161`, `SY142`, `SY143`, `PN23`–`PN26`, `PN05`, `PO04`, `QA243`–`QA247`.

---

## 1. Ce que la tranche doit prouver

MI16 est choisie comme deuxième tranche verticale parce qu’elle est le **test de charge** de toute la conception : elle exige d’un seul tenant une cargaison finie, un équipage qui compte, des preuves déjà acquises qui coûtent des places, un rapport obligatoire et une défection qui change l’état de la campagne.

**À la fin de la tranche, on doit pouvoir répondre oui ou non à cinq questions :**

1. Le joueur ressent-il le poids d’un choix de places, sans interface de score ?
2. Les preuves accumulées depuis MI01 pèsent-elles réellement sur ce choix ?
3. Le rapport est-il un acte, et non un bouton de fin de mission ?
4. La défection est-elle un état vérifiable de la campagne, pas une cinématique ?
5. Une blessure, une mort ou une navette immobilisée sont-elles lisibles, évitables et consignées ?
6. Le coût de maintien (migration, fixtures, six suites de tests) reste-t-il maîtrisé ?

**Ce que la tranche ne prouve pas :** MI15, la production de MI17–MI32, les fins, les contrats, les épreuves de châssis, les assets peints du hangar et de la navette, le codex complet, la localisation.

---

## 2. La mission en une page

| Champ | Valeur |
| --- | --- |
| Identifiant | `MI16` |
| Acte | II — Le coût du silence |
| Planète | Kharon (`PL04`) |
| Date | **3 Cendre EC 61** (acte II : 6 Poids – 9 Cendre) |
| Type | `withdrawal` (nouveau domaine) |
| Titre | Le rapport qui ne part pas |
| Ordre reçu | Remettre pièces, témoins et journaux au vaisseau de commandement, et déclarer la continuité rétablie. |
| Vérité | Le Directoire ne veut ni procès ni témoins. La navette n’a pas de place pour tout, et chaque caisse montée retire une place. |
| Conséquence | Défection opérationnelle : ce qui monte est nommé, ce qui reste est compté et poursuivi par la Cohorte. |
| Décision | `obey` — remettre les preuves au vaisseau de commandement · `defy` — rejoindre le point de rendez-vous avec les preuves |

**Géographie jouable** (une seule scène, longueur ≈ 5 400 unités) : hangar de relève → poste de compte → rampe → navette → cockpit. Le hangar voisin contient la colonne de **340 charges**. La Cohorte arrive après alerte.

**Ce qui est simulé physiquement** : 5 membres d’équipage, 8 candidats à l’embarquement (dont 1 brancard), 9 caisses (5 de preuves, 4 de pièces), 1 navette, 12 silhouettes visibles pour la colonne, 3 unités de Cohorte. L’équipage peut être **blessé ou tué**, la navette **endommagée puis immobilisée** (§8). **La colonne n’est jamais 340 corps simulés** : c’est un groupe compté avec 12 silhouettes représentatives, pour éviter un piège de performance et rester honnête sur ce qui existe.

---

## 3. Déroulé et minutages

| Phase | Action | Durée | Blocage |
| --- | --- | --- | --- |
| P0 | Rejoindre le poste de compte | — | — |
| P1 | **Inventaire réel** : lire le bordereau, compter caisses et candidats | 3 s par relevé | Sans inventaire, l’interface de chargement reste fermée |
| P2 | **Écoute de Jun** : ordre de disparition + heure d’arrivée de la Cohorte | 5 s par écoute, +1 exposition | Deux écoutes max ; chacune avance l’alerte |
| P3 | **Répartition** : affecter les 16 places allouables | instantané, révisable | Aucune validation tant que le total dépasse 16 |
| P4 | **Arrimage** (Kader) : 2 s par caisse, 1,5 s par personne, 4 s par brancard | s | Interruption = travail perdu, rien n’est chargé |
| P5 | **Accord de Hela** au cockpit | 3 s | Sans accord, la navette ne ferme pas |
| P6 | **Rapport** : 3 clauses × 3 s, transmission obligatoire | 9 s | Sans transmission, l’extraction est refusée et la sortie est perdue |
| P7 | **Décision** `obey` / `defy` au poste de navigation | — | Conditionne la défection |
| P8 | **Fermeture de rampe** et départ | 8 s de compte à rebours | Cohorte sur zone à l’expiration |

**Règles de temps** : la pause suspend l’horloge ; une interruption de travail ne consomme aucun matériel ; un chargement interrompu ne crédite rien. La Cohorte n’arrive pas « au début de la mission » : elle arrive après `alert.ready`, déclenchée par P2 ou par un tir.

---

## 4. Cargaison finie — `SY142`

### 4.1 Capacité

| Ressource | Valeur | Justification |
| --- | ---: | --- |
| Places totales de La Veilleuse | **20** | deux berceaux, une cale, une cale d’eau |
| Réservé eau et carburant | **4** | non débarquable, non négociable |
| **Places allouables** | **16** | 20 − 4 |

| Objet | Coût en places |
| --- | ---: |
| Personne valide | 1 |
| Personne sur brancard | 2 |
| Caisse de preuve | 2 |
| Caisse de pièces | 1 |

### 4.2 Offre réelle en scène

| Lot | Quantité | Places si tout monte |
| --- | ---: | ---: |
| Preuves disponibles (`PT01`, `PT02`, `PT03`, `TE01`, `PO04` si acquise) | 5 caisses | 10 |
| Pièces de rechange | 4 caisses | 4 |
| Candidats nommés (dont 1 brancard) | 8 personnes | 9 |
| **Demande totale** | | **23** (**21** sans `PO04`) |

Trois combinaisons montrent la tension : toutes les preuves + tous les candidats = **19** (il faut retrancher 3 places) ; tous les candidats + toutes les pièces = **13** (3 places perdues) ; toutes les preuves + toutes les pièces = **14** (2 places perdues). Aucune combinaison ne satisfait tout le monde. Les trois profils de référence et leur arithmétique sont figés au §16.3.

### 4.3 Candidats (noms stables, à écrire au lot 1)

| ID | Nom | Situation | Coût | Effet s’il embarque |
| --- | --- | --- | ---: | --- |
| `hangar-1` | Mira Solde | contremaîtresse, connaît les registres | 1 | +1 preuve testimoniale au dossier |
| `hangar-2` | Tob | enfant, sans garant | 1 | aucune preuve ; Milo tient sa fiche |
| `hangar-3` | Juno Sark | soudeur blessé | 2 | brancard ; occupe 2 places |
| `hangar-4` | Nad Ruel | archiviste de station | 1 | réduit la copie du bordereau de 3 s à 2 s |
| `hangar-5` | Père Ovin | refuse de partir sans sa sœur | 1 | s’il embarque seul, `refused` consigné |
| `hangar-6` | Sœur Kella | infirmière de station | 1 | +1 kit de soin à bord |
| `hangar-7` | Dara Morn | mécanicienne | 1 | une réparation de coque à −2 lots plus tard |
| `hangar-8` | Ivo Trent | gardien, informateur | 1 | révèle qui a signé le bordereau |

### 4.4 Règles vérifiables

1. Une caisse montée retire ses places **au moment où l’arrimage s’achève**, pas au moment du choix.
2. Une personne embarquée retire sa place au moment où elle franchit la rampe.
3. Aucune place n’est créée par un dialogue, une reprise, une relecture ou un rechargement.
4. Le total est réconcilié après chaque chargement : `places = 20 − 4 − Σ(coûts chargés) ≥ 0`.
5. Un dépassement est refusé avec son motif (`capacité`, `réservé`, `déjà chargé`), jamais rogné en silence.
6. Laisser une caisse de preuve produit un fait daté : ces preuves sont **perdues pour les fins** (`leftBehindProofs`), pas détruites par le joueur.

---

## 5. Équipage

L’état de campagne actuel ne connaît que `crew.tess` et `crew.sami` (confiance). MI16 ajoute **`crew.ilan`**, **`crew.hela`**, **`crew.kader`**, **`crew.milo`**, **`crew.jun`**, en champs additifs et optionnels : les rapports MI01–MI14 existants ne sont pas réécrits.

| Personne | Rôle dans la tranche | Action simulée | Effet sur l’état | Mort possible |
| --- | --- | --- | --- | --- |
| **Hela** (`PN23`) | maîtresse du bord | accord de destination (3 s) ; refuse que La Veilleuse tire | sans accord, pas de départ ; `defy` coûte −3 confiance si la colonne est abandonnée sans explication | **non** (blessée seulement) |
| **Kader** (`PN24`) | arrimage | 2 s par caisse ; compte à voix haute | refuse un manifeste falsifié : le chargement est bloqué jusqu’à correction | **oui** |
| **Milo** (`PN25`) | rampe et carnet | 1,5 s par personne, 4 s par brancard | inscrit les noms ; `carnet` alimente le reçu et les épilogues | **oui** |
| **Jun** (`PN26`) | écoute radio | 5 s par écoute, +1 exposition | révèle l’heure de la Cohorte et l’ordre de disparition | **oui** |
| **Ilan** (`PN05`) | second pilote | compte les places, s’oppose | sa position dépend de qui embarque : `ilanPosition` ∈ `{hostile, divisé, solidaire}` | **oui** |
| **Sera** (`PN01`) | pilote | décision, rapport | — | **non** (blessée seulement) |
| Tess, Nima | hors scène | — | citées dans les lignes de bilan, pas de nouvelle mécanique | non |

Les états de blessure, leurs effets chiffrés et les sources de dégât sont au §8. Les blessures ne sont **jamais aléatoires** : chaque perte est la conséquence d’une exposition identifiable.

**Règle d’écriture.** Aucun membre d’équipage ne change d’avis après un discours : Ilan réagit à un nombre de places cédées et à la présence ou non des preuves. Hela ne tire pas, même si la Cohorte arrive.

---

## 6. Preuves — ce qui existe, ce qui n’est pas inventé

**Entrées possibles** (selon le dossier réel) : `PT01`, `PT02`, `PT03`, `TE01`, et `PO04` produite **dans** MI16. `PT04` et `TE02` appartiennent à MI15 : la tranche ne les crée pas, ne les simule pas et ne les affiche pas.

| Preuve | Condition d’embarquement | Si laissée à quai |
| --- | --- | --- |
| `PT01` | caisse présente, 2 places | perdue pour les fins, mentionnée au reçu |
| `PT02` | idem | idem |
| `PT03` | idem | idem |
| `TE01` | idem + témoin vivant | idem, sans ressusciter le témoin |
| `PO04` | voir ci-dessous | perdue, aucun `PO04` au dossier |

**`PO04` — chaîne politique locale.** Trois actes séparés : deux écoutes de Jun (l’ordre de disparition), copie du bordereau de colonne (3 s, 2 s avec Nad), puis **clause 3 du rapport certifiée**. Si l’un manque, le dossier ne contient qu’un constat, jamais une pièce complète. Aucune preuve n’est reconstituée après perte de sa source.

**Ce que MI16 ne prouve pas** : la chaîne industrielle complète, la totalité de PALINODE, une défection antérieure, ni l’existence de `PT04`/`TE02`.

---

## 7. Rapport obligatoire

Trois clauses, 3 s chacune, au poste de navigation :

1. **Personnes** — présentes, embarquées, laissées, poursuivies.
2. **Preuves et pièces** — liste des caisses montées et de celles restées.
3. **État de la relève** — soit la formule impériale « continuité rétablie », soit l’annexe de constat.

Règles :

- La transmission est **obligatoire avant la fermeture de rampe**. Sans elle, l’extraction est refusée : la sortie est **perdue** (terminale, comme MI06–MI14), le checkpoint est conservé, rien n’est crédité.
- Une clause peut être laissée vide : le rapport est alors **incomplet**, et le reçu le dit. Un rapport incomplet interdit `obey` (on ne peut pas déclarer la continuité rétablie sans les trois clauses) mais autorise `defy` si une preuve est à bord.
- Le rapport ne modifie jamais les faits : il les déclare. Un rapport favorable ne ressuscite personne et ne récupère aucune caisse.
- Le reçu conserve `reportFiled`, `reportClauses` (3 booléens), `reportWording` ∈ `{conformity, annex}`, et `decisionLabel`.
- Le rapport consigne aussi les **blessés, les morts et l’état de la navette** : une clause ne peut pas déclarer « continuité rétablie » en taisant un mort de l’équipage. Le mensonge reste possible, mais il est alors écrit dans le reçu (`reportWording: conformity` avec `crewLost` non vide), jamais effacé.

---

## 8. Vulnérabilité de l’équipage et de la navette

MI16 est la première mission où l’équipage peut être **blessé ou tué** et où le véhicule du départ peut être **immobilisé**. Trois règles de conception : aucune mort aléatoire, aucun dégât invisible, aucune perte sans signal ni moyen d’évitement.

### 8.1 États et protections

| État | Valeur | Effet |
| --- | ---: | --- |
| `indemne` | 3 | actions nominales |
| `blessé` | 2 | action ralentie, ligne de bilan |
| `hors de service` | 1 | ne remplit plus sa fonction principale ; suppléé selon §8.2 |
| `mort` | 0 | retiré de la scène ; compté au reçu |

**Protégés** : Hela et Sera, en cockpit blindé, ne peuvent être que **blessées**. Elles ne s’exposent jamais à la rampe, et leur mort ouvrirait des variantes de canon que la tranche ne finance pas.
**Exposés** : Kader, Milo, Jun, Ilan, et les huit candidats.

Un membre d’équipage passe `indemne → blessé → hors de service → mort` par paliers : **une** touche blesse, **deux** mettent hors de service, **trois** tuent. Aucun jet de dé, aucune mort scriptée sans cause visible.

### 8.2 Effets chiffrés

| Personne | Blessé | Hors de service | Mort |
| --- | --- | --- | --- |
| **Hela** | accord 6 s | Sera donne l’accord à 9 s, `defy` −5 confiance | impossible |
| **Kader** | caisse 3 s, personne 2 s, brancard 6 s | idem, et `manifestVerified:false` | arrimage seul : caisse 4 s, personne 2,5 s, brancard 6 s, `manifestVerified:false`, `cargoSecured:false` |
| **Milo** | personne 2 s, brancard 6 s | carnet suspendu, `namedBoarded:false` | rampe seule : personne 2,5 s, brancard 7 s, aucun nom |
| **Jun** | écoute 8 s, +2 exposition | écoute impossible | écoute impossible ; `PO04` perdue si moins de deux écoutes faites |
| **Ilan** | fermeture 11 s | fermeture 10 s, `pilot:'sera'` | fermeture 9 s, `pilot:'sera'` |
| **Sera** | clause 3 à 4 s, compte à rebours +3 s | Ilan transmet à 5 s ; sans Ilan, rapport impossible → sortie perdue | impossible |

Aucun état ne rend la mission **impossible à terminer** sans échec explicite : Kader, Milo et Jun morts coûtent du temps, des noms et une preuve, pas la sortie. Le seul blocage dur est l’absence simultanée de Sera et d’Ilan pour transmettre : c’est alors un `no-report` annoncé, pas un soft-lock.

### 8.3 Sources de dégât et signaux

| Source | Cible | Dégât | Signal | Évitement |
| --- | --- | --- | --- | --- |
| Rafale de Cohorte | personne la plus exposée | 1 touche = blessé, 2 = hors service, 3 = mort | ligne de visée **2 s** | s’abriter 1 s derrière une caisse, ou reculer hors de portée |
| Charge de brèche (une seule, 60 s après alerte) | navette | coque −60, rampe −30 | sifflement et marquage au sol **5 s** | fermer la rampe ou se placer derrière la cloison |
| Broyage de rampe | ce qui est sur la rampe | candidat mort ; équipage blessé ; rampe −15 | avertissement de fermeture **2 s** | vérifier la rampe avant de fermer |
| Chute de caisse | caisse et assistant | caisse endommagée (`proofDamaged`) ; assistant blessé | la caisse penche **2 s** | reposer la caisse ou dégager |
| Envahissement | tout ce qui est dehors | mort ou capture | compte à rebours **10 s** | fermer la rampe et partir |

Un candidat touché est **blessé** à la première touche, **mort** à la seconde. Une caisse endommagée conserve son contenu mais la preuve associée passe à l’état `damaged` : elle reste une preuve, elle cesse d’être une preuve certifiée.

**Caisse non arrimée** : si Kader est mort ou hors de service, les caisses montées par le joueur seul sont `cargoSecured:false`. Une caisse non arrimée est **perdue au départ** si la coque de la navette est inférieure à 50 : elle était à bord, elle n’arrive pas. Le reçu distingue `boarded` et `arrived`.

### 8.4 Navette

| Système | Départ | Valeur initiale |
| --- | ---: | ---: |
| Coque | ≥ 25 | 100 |
| Moteur | ≥ 30 | 100 |
| Rampe | ≥ 20 | 100 |
| Verrou de soute | ≥ 20 | 100 |

| État | Condition | Conséquence |
| --- | --- | --- |
| `nominal` | tous les systèmes > 60 | départ normal |
| `damaged` | un système ≤ 60 | départ possible, compte à rebours +2 s |
| `critical` | un système ≤ 25 ou moteur ≤ 30 | départ possible, +5 s, une avarie est signalée au reçu |
| `grounded` | un seuil de départ non atteint | décollage refusé |
| `lost` | coque 0 | navette détruite, tout l’équipage à bord meurt, sortie perdue |

**Réparation** : une caisse de pièces peut être consommée sur place (6 s, 4 s avec Dara Morn à bord) pour rendre **+20** au système le plus bas. Elle ne monte alors pas à bord et libère sa place. Une seule réparation par sortie.

**Fenêtre de sortie** : après une brèche à 60 s, **Ilan ferme la rampe (8 s) pendant que Kader répare (6 s)** ; les deux tâches sont parallèles. La navette est prête à **70 s** (73 s en `critical`), dans la fenêtre de 75 s. En séquence, 8 + 6 + 2 = **76 s** : la réparation ne tiendrait pas. Le parallélisme est une règle, pas une optimisation.

La navette n’est pas La Veilleuse : ses dégâts sont propres à la sortie. Le reçu les consigne ; la campagne ne retient que le départ accompli ou non.

**Conséquence de la brèche** : non réparée, la coque tombe à 40 — au-dessus du seuil 25, donc le départ reste possible en `damaged` (+2 s) ; les caisses non arrimées sont perdues (coque < 50), ce qui rend `QA263` éprouvable en jeu. Réparée une fois (+20), la coque remonte à 60 : les caisses non arrimées arrivent, la navette reste `damaged`. P3, sans pièce, part donc toujours mais ne peut pas sauver ses caisses non arrimées. `grounded` et `lost` restent des bornes de validation, produites par état construit : aucun parcours complet ne les déclenche aujourd’hui.

### 8.5 États d’échec

| Motif | Déclencheur | Enregistré |
| --- | --- | --- |
| `walker-lost` | coque du châssis à 0 | `lastFailure`, checkpoint conservé, aucun reçu |
| `no-report` | fermeture de rampe sans transmission | `lastFailure`, aucun reçu |
| `shuttle-grounded` | seuils non atteints, sans pièce ni temps | `lastFailure` avec l’état de la navette |
| `shuttle-lost` | coque à 0 | `lastFailure`, morts à bord comptés |
| `overrun` | Cohorte sur zone, rampe ouverte | `lastFailure`, pertes dehors comptées |
| `left-behind` | ordre radio « fermez sans moi » | `lastFailure`, joueur laissé, équipage parti |
| `abandon` | franchissement de la ligne de sortie | `lastFailure`, aucun embarquement |

Tous les motifs sont **terminaux pour la sortie** : pas de reçu, pas de dotation, pas de défection. Le checkpoint de début de mission reste disponible ; une reprise restaure les blessés, les morts et les dégâts de la tentative abandonnée. Seule une **victoire** écrit les pertes dans la campagne.

### 8.6 Reçu, dossier et bilan d’échec

Le dossier `createWithdrawalDossier()` et le reçu gagnant portent, en plus des champs du §7 :

| Champ | Forme |
| --- | --- |
| `crewState` | `{hela, sera, kader, milo, jun, ilan}` → `{state, hits}` |
| `crewWounded`, `crewLost` | listes d’identifiants, triées |
| `candidatesWounded`, `candidatesLost` | entiers et identifiants nommés |
| `namedBoarded` | booléen : le carnet de Milo a fonctionné |
| `shuttle` | `{hull, engine, ramp, latch, state, cargoSecured}` |
| `repairUsed` | booléen, caisse consommée |
| `manifestVerified` | booléen (faux si Kader hors service) |
| `proofsBoarded`, `proofsArrived` | listes distinctes : ce qui monte et ce qui arrive |
| `leftBehindProofs` | liste des preuves restées à quai |
| `abandoned` | toujours `false` dans un reçu gagnant |

`lastFailure` (nouveau champ de campagne, `null` par défaut) :

```
{ missionId: 'MI16', reason, date, elapsed, reportFiled, boarded,
  crewWounded, crewLost, candidatesLost, shuttle: { hull, engine, ramp, latch, state },
  proofsLeft, note }
```

`lastFailure` ne contient **jamais** `partsGranted`, `decisionLabel` ni `defected` : un échec ne peut pas être lu comme une victoire. La validation le vérifie.

---

## 9. Quitter la scène sans embarquer

Sortir de la zone de chargement est une **défaite**, pas une troisième voie. Aucun secret, aucune fin cachée, aucune preuve emportée.

| Acte | Seuil | Motif |
| --- | --- | --- |
| Reculer à pied vers la sortie du hangar | avertissement dès `x < 1 050`, motif à `x < 900` | `abandon` |
| Reprendre le châssis et gagner le couloir d’extraction sans être monté | zone d’extraction | `abandon` |
| Ordonner par radio « fermez sans moi » | après rapport transmis, 10 s | `left-behind` |
| Être dehors à l’arrivée de la Cohorte | compte à rebours écoulé | `overrun` |

**Conséquences communes** :

1. Aucun reçu, aucune dotation, aucune défection, aucun transfert de preuve.
2. `lastFailure` est écrit et remplace le précédent ; le débrief nomme ceux qui restent et ce qui est perdu.
3. La campagne reste inchangée : pas de confiance modifiée, pas de `crew.*.alive` réécrit, pas de `depots.sealed`.
4. Le checkpoint de début de mission est conservé ; une reprise restaure blessés, morts, caisses et navette.
5. Le châssis n’est pas perdu : il reste affecté à la campagne, même si la sortie n’est pas validée.

**Cas `left-behind`** : l’ordre radio n’est disponible qu’une fois le rapport transmis et au moins une caisse de preuve à bord, sinon l’équipage refuse et la sortie reste bloquée. La navette part avec ce qui est chargé ; le joueur est laissé sur Kharon et compté `captured`. Le refus de Hela est porté par `lastFailure.note` : aucun reçu de mission n’est produit.

**Cas `abandon` avant tout chargement** : rien n’est perdu matériellement, mais la colonne est laissée sans compte rendu. Le débrief le dit sans emphase : « vous êtes parti sans embarquer ».

---

## 10. Défection

**Condition** : `defy` + rapport transmis + au moins une caisse de preuve à bord + accord de Hela + **navette départable** (seuils du §8.4 atteints). Sinon, la décision est refusée avec motif (`no-report`, `no-proof`, `no-accord`, `shuttle-down`).

| État de campagne | `obey` | `defy` |
| --- | --- | --- |
| `authority.defected` | `false` | **`true`** |
| `authority.suspicion` | +4 | +20 |
| `depots.sealed` | `false` | **`true`** (aucun dépôt impérial ensuite) |
| `resources.parts` | +4 (dotation) | **+0** : plus de dotation impériale |
| Preuves embarquées | remises au vaisseau, perdues pour le joueur | **conservées** |
| Personnes embarquées | remises au vaisseau | **conservées** |
| Équipage | pertes écrites dans `crew.*.alive` | idem, y compris les morts de la sortie |
| Cohorte | pas de poursuite | `pursuit = true`, citée à MI17+ |
| Mission suivante | MI17 impériale | MI17 en fuite (variante de gating) |

**Règles** : la défection est un état persistant, pas un écran. Elle ne s’annule pas par une relecture. `finishCampaignMission` doit refuser un reçu `defy` incohérent (preuve absente, rapport absent). Les pertes acquises restent comptées, y compris en défection.

---

## 11. Persistance de la cargaison après MI16

Ce qui survit à MI16 est **ce qui était physiquement à bord au départ**. La cale de La Veilleuse est le seul conteneur persistant ; elle ne crée jamais une preuve, elle enregistre une garde.

### 11.1 Où vivent les choses

| Objet | Vérité source | Copie persistante |
| --- | --- | --- |
| Preuve `PT01`–`PT03`, `TE01`, `PO04` | son dossier d’origine (`world.vesper.industrial`, `world.thyr.chemical`, `world.kharon.foundry`, `world.thyr.voice`, `world.kharon.withdrawal`) | entrée `ship.cargo` qui **référence** l’identifiant, sans recopier le fait |
| Personne embarquée | reçu MI16 (`peopleBoarded`) + `hangar-1`–`hangar-8` du contenu MI16 | entrée `ship.cargo` `kind:'person'`, avec nom et rôle figés |
| Pièces de rechange montées | `resources.parts` à l’arrivée | aucune entrée durable : la caisse devient du stock |
| Eau et carburant | `ship.reserved` | 4 places, jamais débarquables |
| Preuve laissée, détruite ou remise | `world.kharon.withdrawal` et reçu MI16 | **pas** d’entrée dans la cale |

La racine `ship` vaut `{ places: 20, reserved: 4, cargo: [] }`. **Aucun champ `free` n’est stocké** : il est calculé, sinon deux vérités divergent.

| Champ d’une entrée | Forme | Règle |
| --- | --- | --- |
| `id` | `proof:PT03`, `person:hangar-4` | unique ; support de l’idempotence |
| `kind` | `proof` ou `person` | les pièces ne sont pas des entrées durables |
| `ref` | identifiant de preuve ou de candidat | doit exister dans le dossier ou le contenu MI16 |
| `name`, `role` | texte figé | instantané, jamais réécrit par une mission suivante |
| `slots` | 1 ou 2 | figé à l’embarquement |
| `condition` | `intact` ou `damaged` | une preuve `damaged` reste présente |
| `since` | date EC 61 | 3 Cendre pour MI16 |

**Interdit** : une entrée de cale ne peut pas rendre vrai un fait de preuve. Si `PT03` n’est pas acquise dans son dossier, une entrée `proof:PT03` rend la sauvegarde invalide. La cale transporte, elle ne fabrique pas.

### 11.2 Lecture par MI17 et les missions suivantes

Un seul accès, `cargoContextFor(campaign)`, retourne une vue en lecture seule : `{ places: 20, reserved: 4, used, free, proofs, persons }`. Aucune mission ne lit `ship.cargo` directement.

Une mission qui touche la cale le déclare dans sa configuration :

```
hold: {
  requires: ['PT03'],          // refus au briefing si absent
  optional: ['TE01'],
  loads:    [{ kind: 'person', ref: 'hangar-4' }],
  unloads:  ['person:hangar-2'],
  consumes: ['proof:PT02']
}
```

Règles :

1. **Refus au briefing**, motif `hold-insufficient`, si un `requires` manque ou si `free < Σ slots chargés`. Jamais de découverte en cours de mission, jamais de rejet silencieux.
2. Charger et décharger sont des **opérations datées** avec durée, pas un menu d’inventaire. Chaque changement produit un `holdDelta` au reçu.
3. `validateHoldDelta(before, after, delta)` exige : une cause par entrée ajoutée ou retirée, `slots` conservés, aucun doublon d’`id`, `free ≥ 0`.
4. Une mission sans bloc `hold` laisse `ship.cargo` **identique** ; c’est une assertion de validation, pas une convention.
5. Aucune interface libre de déchargement, aucun commerce : un déchargement n’existe que si une mission l’écrit.
6. Une mission ne peut pas ignorer une preuve requise ni la jeter pour faire de la place sans acte explicite consigné.

### 11.3 Coût en places après MI16

| Élément | Places | Durée |
| --- | ---: | --- |
| Preuve embarquée | 2 | jusqu’au déchargement ou à la remise |
| Personne valide | 1 | jusqu’au débarquement |
| Personne montée sur brancard | 2 | figées, même après guérison |
| Pièce de rechange | 0 après arrivée | devient `resources.parts` |
| Réservé eau et carburant | 4 | permanent |

Les **16 places allouables ne grandissent pas** : aucune mission ne les augmente sans module explicitement conçu, hors périmètre de la tranche. Une preuve remise ou laissée libère ses 2 places, une personne débarquée libère sa place ; rien d’autre ne libère de place. Un blessé qui guérit ne récupère pas sa seconde place avant débarquement : la place est figée pour le voyage.

Les personnes embarquées **ne deviennent pas membres d’équipage** : elles n’ouvrent aucune action, aucun poste, aucune ligne de confiance. Leurs effets restent narratifs ou explicitement lus par une mission ultérieure.

### 11.4 Ce qui est perdu, et quand

| Cas | Cale | Preuves | Personnes |
| --- | --- | --- | --- |
| Victoire `defy` | conserve le chargement | à bord, utilisables pour les fins | à bord |
| Victoire `obey` | preuves sorties, places libérées | remises à l’Empire, indisponibles pour les fins | remises au vaisseau de commandement |
| Preuve laissée à quai | pas d’entrée | `left`, perdue pour les fins | — |
| Caisse non arrimée, coque < 50 | pas d’entrée | `lost` au départ | — |
| Preuve endommagée | entrée `damaged` | présente, non certifiée | — |
| Défaite (7 motifs) | **inchangée** | rien de la tentative n’est validé | rien |
| Relecture d’une victoire | **inchangée** | aucune seconde preuve, aucune seconde dotation | aucun doublon |

Aucune preuve perdue n’est reconstituée ; aucune personne morte n’est ressuscitée ; aucune relecture ne redonne une place. La cale d’une défaite est celle du checkpoint de début de mission, blessés et dégâts compris.

### 11.5 Lecture par les fins et les missions ultérieures

- Les quatre fins lisent la **présence**, la **garde** et la **condition** : une preuve `left` compte comme absente, une preuve `delivered` compte pour la faction qui la détient, une preuve `damaged` reste présente mais ne satisfait pas une condition qui exige une pièce certifiée.
- MI17 et suivantes déclarent leurs besoins par `hold.requires` ; une variante sans la preuve doit être une branche de contenu assumée, pas un silence du code.
- Les personnes embarquées peuvent être citées, convoquées ou débarquées par une mission ultérieure ; elles ne produisent jamais de confiance ni de capacité par leur seule présence.

---

## 12. Sauvegarde v15 et migrations

`CAMPAIGN_SAVE_VERSION` passe de **14 à 15**. La migration v14→v15 est **strictement additive** :

| Ajout | Forme | Règle |
| --- | --- | --- |
| `world.kharon.withdrawal` | dossier vide `createWithdrawalDossier()` | aucun rapport, aucune preuve, aucune personne inventée |
| `ship` | `{ places: 20, reserved: 4, cargo: [] }` | cale vide ; aucun `free` stocké, aucun chargement rétroactif |
| `crew.ilan`, `crew.hela`, `crew.kader`, `crew.milo`, `crew.jun` | `{ trust: 50, alive: true, state: 'indemne' }` | valeurs neutres documentées ; aucune blessure rétroactive |
| `crew.tess`, `crew.sami` | ajout de `alive: true, state: 'indemne'` | champs additifs, confiance inchangée |
| `depots.sealed` | `false` | vrai seulement après défection |
| `lastFailure` | `null` | bilan de la dernière sortie échouée, jamais un reçu |
| `journal` | `[]` (ou absent si la tranche se limite au dossier) | voir §15 |

**Interdits** : réécrire un rapport MI01–MI14, changer le carburant, déplacer un checkpoint, régénérer une fixture v1–v14. Les octets des fixtures historiques restent la référence. Aucune fixture v14 n’existe encore : elle doit être produite une fois à la réception, puis migrée en v15 et figée. Le détail est dans [CAMPAIGN_SAVE_V15.md](CAMPAIGN_SAVE_V15.md) §6.

**Compatibilité** : un dossier v14 importé reste lisible ; un v15 dans un build antérieur est refusé avec le message existant, sans écrasement.

---

## 13. Systèmes dépendants et points d’intégration

| Système | Fichier prévu | Dépend de | Bloque |
| --- | --- | --- | --- |
| Simulation du retrait | `src/withdrawal-simulation.mjs` | content, moteur | lots 1–5 |
| Validation du dossier | `src/withdrawal-validation.mjs` | simulation | reçu, campagne |
| Rendu du hangar et de la navette | `src/withdrawal-renderer.mjs` | assets vectoriels existants | UI, navigateur |
| Campagne et reçu | `src/campaign.mjs` | validation, save v15 | progression, défection |
| Cale persistante | `src/cargo.mjs` (registre, `cargoContextFor`, réconciliation des deltas) | dossiers de preuve, save v15 | MI17+, fins |
| HUD et rapport | `src/ui.mjs`, `index.html` | campagne, renderer | tests DOM |
| Audio | `src/audio.mjs` | événements de simulation | ambiance, pas de blocage |
| Archives et carnet | onglet existant `view-archives` | journal minimal | épilogues futurs |
| Garde-fou de projet | `tools/check-project.mjs` | contenu MI16 | `npm run check` |

**Contrat de validation** — même forme que `workshop-validation.mjs` : `createWithdrawalDossier`, `withdrawalContextFor`, `validateWithdrawalFacts`, `withdrawalDossierFromGame`, `validateWithdrawalMission`, `validateWithdrawalReceipt`, `validateWithdrawalSortie`. Aucune nouvelle convention.

---

## 14. Tests dépendants

| Test | Ce qu’il doit assertir | Dépend de |
| --- | --- | --- |
| `tests/mi16-simulation.test.mjs` | 16 places allouables ; coûts 1/2/2/1 ; refus de dépassement avec motif ; arrimage interrompu non crédité ; 340 charges comptées avec 12 silhouettes ; Cohorte absente avant alerte ; déterminisme à graine fixe | lot 1 |
| `tests/mi16-report.test.mjs` | 3 clauses × 3 s ; extraction refusée sans rapport ; rapport incomplet interdit `obey` ; les faits ne sont pas réécrits | lot 1 |
| `tests/mi16-dossier.test.mjs` | `PO04` exige 2 écoutes + bordereau + clause 3 ; sinon constat seul ; reçu = dossier ; effectifs réconciliés ; `PT04`/`TE02` jamais créés ; blessés et morts comptés | lot 1 |
| `tests/mi16-vulnerability.test.mjs` | états 3/2/1/0 ; paliers 1/2/3 touches ; Hela et Sera jamais mortes ; effets chiffrés de §8.2 ; télégraphe ≥ 2 s pour chaque source ; chute de caisse et broyage de rampe ; réparation unique par sortie, une caisse consommée | lot 1 |
| `tests/mi16-failure.test.mjs` | les sept motifs ; `lastFailure` sans champ de victoire ; avertissement d’abandon à 1 050 et motif à 900 ; reprise restaurant blessés, morts et dégâts ; `left-behind` exige rapport + preuve ; `shuttle-grounded` sans reçu | lot 2 |
| `tests/mi16-cargo-persistence.test.mjs` | après victoire, `ship.cargo` = exactement ce qui est arrivé ; `free = 16 − Σ slots` ; `obey` sort les preuves et libère les places ; `defy` les conserve ; défaite et relecture laissent la cale identique ; aucun doublon d’`id` ; `hold.requires` refusé au briefing ; une preuve `left` ou `damaged` n’est jamais reconstituée | lot 2 |
| `tests/mi16-defection.test.mjs` | `defy` sans preuve/rapport/accord/navette départable refusé ; `defected` et `depots.sealed` seulement sur reçu valide ; aucune dotation en défection | lot 2 |
| `tests/campaign-v15.test.mjs` | migration additive ; rapports MI01–MI14 identiques ; `ship` vide, `crew.*.alive`, `withdrawal`, `depots`, `lastFailure` ajoutés ; round-trip ; fixtures v1–v14 inchangées | lot 2 |
| `tests/campaign-mission.test.mjs` (extension) | branche MI16 du reçu ; lignes d’équipage ; mission perdue terminale ; pas de double dotation | lot 2 |
| `tests/campaign-progression.test.mjs` (extension) | déblocage temporaire MI16 après MI14 (voir §16) ; gating de MI17 selon la défection et le contenu de la cale | lot 2 |
| `tests/ui-runtime.test.mjs` (extension) | panneau de places, refus de surcharge, dialogue de rapport, décision, bandeau de défection | lots 3–4 |
| `tests/offline-package.test.mjs` | HTML et ZIP reconstruits identiques, manifeste à jour | lot 5 |

**Ordre imposé** : simulation → validation → campagne/migration → UI → build. Aucun test de campagne ne doit précéder la validation, sous peine de figer un reçu faux.

---

## 15. Journal des faits — périmètre minimal de la tranche

Le journal complet (`SY140`) n’est pas nécessaire à MI16, mais deux entrées le sont, car elles portent la conséquence :

1. **Entrée de preuve** : `PO04` acquise, avec date, source, état.
2. **Entrée de perte** : preuves laissées à quai et personnes poursuivies, avec dénombrement.

Si le journal est reporté, ces deux faits restent dans `world.kharon.withdrawal` et sont repris plus tard ; aucune entrée n’est inventée à la migration.

---

## 16. Décisions tranchées et constantes du lot 0

**Lot 0 clos le 20 novembre 2026.** Aucune décision n’est laissée ouverte : le tableau §16.1 est la référence, §16.2 fige les valeurs, §16.3 vérifie les trois profils de charge. Toute modification ultérieure rouvre une tranche et exige de rejouer §16.3 et les critères de sortie du lot 0.

### 16.1 Décisions

| Décision | Valeur retenue | Effet vérifiable |
| --- | --- | --- |
| Accès sans MI15 | Déblocage **temporaire** `MI14 → MI16` derrière `ENABLE_MI16_SLICE`, testé dans les deux modes, retiré à la livraison de MI15 | Aucun réordonnancement des 32 missions ; deux états testables |
| Colonne de 340 | **12 silhouettes** et un compteur, jamais 340 corps | Plafond de **40** corps dynamiques |
| Tout sauver | **Non** : 16 places pour 23 de demande (§16.3) | Le sujet de la mission |
| Troisième option `refuse` | **Aucune** | Pas de sortie « mains propres » |
| Rapport incomplet | Interdit `obey`, autorise `defy` si une preuve est à bord | Le rapport est un acte |
| Défection sans preuve | Refusée | Une fuite sans contenu ne serait pas une défection |
| Reçu MI16 | Dossier du domaine + champs communs + `defected`, `ilanPosition`, `reportClauses`, `crewLost`, `shuttle` | Même forme que MI13/MI14 |
| Statut pendant la tranche | **Conçu** ; exception explicite dans `check-project.mjs`, jamais une promotion | Le contrôle exige `Prototype` pour une mission de `CAMPAIGN_MISSIONS` |
| Branche de progression | `validateGame` et `validateCampaign` reçoivent `withdrawal` ; aucun autre domaine touché | Isole les sept domaines reçus |
| Qui peut mourir | Hela et Sera **non** ; Kader, Milo, Jun, Ilan **oui**, ainsi que les candidats | Risque réel sans variantes de canon |
| Mort aléatoire | **Jamais** : paliers de touches, télégraphe, évitement nommé | Perte lisible et testable |
| Persistance des pertes | Victoire → `crew.*.alive` et reçu ; échec → `lastFailure` seulement | Une reprise ne mutile pas la campagne |
| Quitter la scène | Échec terminal avec `lastFailure`, jamais une troisième voie | Le canon exclut la sortie propre |
| Réparation navette | **Une seule** caisse de pièces, +20 au système le plus bas | Usage borné des pièces |
| Cargaison après MI16 | Racine `ship`, entrées `ship.cargo` **référençant** les preuves | La cale ne fabrique rien |
| Coût des personnes | 1 ou 2 places, **figées** jusqu’au débarquement | L’embarquement reste coûteux |
| Pièces montées | Deviennent `resources.parts` à l’arrivée, sans place durable | Pas de double comptage |
| Exigence d’une mission suivante | `hold.requires`, refusée au briefing si absente | Pas de rejet en cours de mission |
| Défaite et relecture | Cale inchangée, aucune seconde cargaison | Idempotence vérifiable |
| `PO04` sans MI15 | Trois actes locaux : deux écoutes, bordereau, clause 3 | Aucune dépendance à `PT04`/`TE02` |
| Alerte de la Cohorte | Première écoute ou premier tir ; la seconde écoute avance l’arrivée de 15 s | Deux écoutes restent possibles, à coût croissant |

### 16.2 Constantes figées

| Domaine | Constante | Valeur |
| --- | --- | --- |
| Mission | Identifiant, acte, date | `MI16`, acte II, **3 Cendre EC 61** |
| Mission | Longueur jouable | **5 400** unités |
| Mission | Avertissement / ligne d’abandon | `x < 1 050` / `x < 900` |
| Mission | Colonne | **340** charges, **12** silhouettes, **3** unités de Cohorte |
| Mission | Budget de corps dynamiques | **39** (5 équipage + 8 candidats + 9 caisses + 12 silhouettes + 3 Cohorte + 1 navette + 1 châssis), plafond **40** |
| Places | Total / réservé / allouable | **20** / **4** / **16** |
| Places | Coûts | personne **1**, brancard **2**, preuve **2**, pièce **1** |
| Inventaire | Preuves / pièces / candidats | **5** caisses / **4** caisses / **8** personnes (dont 1 brancard) |
| Inventaire | Demande totale | **23** places (**21** sans `PO04`) |
| Temps | Inventaire | **3 s** par relevé |
| Temps | Écoute de Jun | **5 s**, +1 exposition, **2** maximum, −15 s d’arrivée à la seconde |
| Temps | Arrimage (Kader) | caisse **2 s**, personne **1,5 s**, brancard **4 s** |
| Temps | Accord de Hela | **3 s** |
| Temps | Rapport | **3** clauses × **3 s** |
| Temps | Fermeture de rampe | **8 s** |
| Temps | Charge de brèche | **60 s** après l’alerte, une seule |
| Temps | Arrivée de la Cohorte | **75 s** après l’alerte, avertissement final **10 s** |
| Blessures | États et paliers | 3/2/1/0 ; **1** touche blesse, **2** met hors service, **3** tue ; candidat mort à la **2e** |
| Blessures | Signaux | tir **2 s**, brèche **5 s**, rampe **2 s**, caisse **2 s**, envahissement **10 s** |
| Blessures | Effets d’équipage | §8.2, valeurs inchangées |
| Navette | Systèmes initiaux | coque, moteur, rampe, verrou = **100** |
| Navette | Seuils de départ | **25 / 30 / 20 / 20** |
| Navette | Bandes d’état | `nominal` > 60 ; `damaged` ≤ 60 ; `critical` ≤ 25 ou moteur ≤ 30 |
| Navette | Réparation | **6 s** (**4 s** avec Dara), **+20**, une seule fois |
| Navette | Dommages | brèche **−60** coque / **−30** rampe ; broyage **−15** rampe |
| Navette | Caisse non arrimée | perdue au départ si coque **< 50** |
| Rapport | Clauses | personnes / preuves et pièces / état de la relève |
| Défection | Conditions | rapport + **≥ 1** preuve + accord de Hela + navette départable |
| Défection | Effets | suspicion **+4** en `obey`, **+20** en `defy` ; pièces **+4** / **+0** ; `depots.sealed` en `defy` |
| Persistance | Places après MI16 | **16**, jamais augmentées ; preuve **2**, personne **1/2**, pièce **0** après arrivée |
| Persistance | Calcul | `free = 16 − Σ slots`, jamais stocké |
| Drapeau | Accès à la tranche | `ENABLE_MI16_SLICE` |

### 16.3 Trois profils de charge vérifiés

Inventaire de référence : **5** caisses de preuve à **2** places = **10** ; **8** candidats = **1+1+2+1+1+1+1+1** = **9** ; **4** caisses de pièces = **4**. Total **23**.

| Profil | Preuves | Personnes | Pièces | Calcul | Verdict |
| --- | --- | --- | --- | --- | --- |
| **P1 — Tout le monde et toutes les preuves** | 5 → 10 | 8 → 9 | 0 | 10 + 9 = **19** | **Refusé** : capacité, **3** places de trop |
| **P2 — Matériel seul** | 5 → 10 | 0 | 4 → 4 | 10 + 4 = **14** | **Accepté**, **2** places libres, aucune personne |
| **P3 — Tout le hangar et trois preuves** | 3 → 6 | 8 → 9 | 0 | 6 + 9 = **15** | **Accepté**, **1** place libre |

**Contrôles arithmétiques :**

1. Aucun profil accepté ne dépasse 16 ; P2 et P3 laissent respectivement 2 et 1 place, donc une marge utilisable pour une preuve supplémentaire (P2 → 16) ou une pièce (P3 → 16).
2. P1 reste refusé même sans `PO04` : **4** preuves = 8, donc 8 + 9 = **17**, soit **1** place de trop. La tension ne dépend pas de la présence de `PO04`.
3. P3 reste à **15** quelles que soient les trois preuves choisies : le coût ne dépend pas de l’identité de la caisse.
4. P2 sans `PO04` tombe à **12** (4 preuves + 4 pièces) et laisse 4 places : le profil « matériel seul » est plus permissif, jamais sauveur de personnes.
5. Les trois profils couvrent les trois intentions annoncées — preuves d’abord, personnes d’abord, mixte — et chacun produit un verdict différent.
6. Aucun profil ne crée de place : les totaux sont recalculés à partir des coûts figés, pas d’un compteur affiché.

Ces trois profils sont les cas d’entrée du lot 0 et les scénarios de `QA258`–`QA260`. Une modification de capacité, de coût ou d’inventaire rouvre §16 et invalide ce tableau.

---

## 17. Lots implémentables — plan de production chiffré

### 17.1 Hypothèses de chiffrage

- **Un développeur** qui connaît le dépôt, à **1 jour ouvré = 6 h nettes** ; les estimations incluent l’écriture des tests du lot, pas la revue humaine ni la QA navigateur.
- **MI15 n’est pas livrée** : le déblocage temporaire `MI14 → MI16` et son retrait futur font partie du lot 2.
- **Aucun asset peint** pour le hangar, la navette et la colonne : repli vectoriel assumé.
- Les réceptions navigateur et l’essai humain sont **hors chiffrage** ; le reçu de tranche, lui, est rédigé au lot 5, limites comprises.
- Un jour de marge n’est jamais converti en polish : il absorbe un glissement ou reste non consommé.

### 17.2 Lots, dépendances et jours

| Lot | Contenu | Jours | Dépend de | Risque principal |
| --- | --- | ---: | --- | --- |
| **0** | Lot 0 clos : décisions §16.1, constantes §16.2, profils §16.3, écriture des 8 candidats et des 5 caisses | **1** | — | Équilibre 16/23 injouable |
| **1** | `withdrawal-simulation.mjs`, `withdrawal-validation.mjs`, configuration de mission, blessures, signaux, seuils de navette — détail §17.7 | **7** | Lot 0 | Domaine trop large, piège de performance de la colonne |
| **2** | Save v15, migration v14→v15, reçu, défection, `lastFailure`, cale persistante, progression | **4** | Lot 1 (contrat de validation stable) | Migration qui réécrit un reçu ; fixture v14 absente |
| **3** | Renderer, HUD, panneau de places, dialogue de rapport | **4** | Lots 1 et 2 | Rendu qui invente des positions ; double vérité des places |
| **4** | Lignes d’équipage, archives minimales, audio | **2** | Lots 2 et 3 | Texte hors canon ; dérive audio |
| **5** | Build autonome, contrôles, reçu de tranche | **2** | Tous | Build/ZIP instable, reçu incomplet |
| | **Total** | **20** | | |

**Jalons cumulés** : J1 lot 0 · J8 lot 1 · J12 lot 2 · J16 lot 3 · J18 lot 4 · J20 lot 5.
**Engagement** : **24 jours** avec 4 jours de marge (20 %), fourchette réaliste **18–26 jours**.

### 17.3 Chemin critique et parallélisation

Chemin critique : **0 → 1 → 2 → 3 → 5**, soit **18 jours**. Le lot 4 peut chevaucher la fin du lot 3 (rédaction des lignes et des deux entrées de journal), ce qui donne 20 jours pour un développeur seul.

À deux développeurs, le lot 2 peut démarrer dès que les signatures de validation sont figées (fin J5), pendant que le lot 1 termine configuration et contenu : calendrier ramené à **environ 15 jours**, au prix d’un risque d’interface entre validation et campagne. Ce gain n’est acceptable que si le contrat de `withdrawal-validation` est gelé avant le début du lot 2.

### 17.4 Risques et parades

| Risque | Lot | Probabilité | Impact | Parade | Signal d’alerte |
| --- | --- | --- | --- | --- | --- |
| Les 16 places rendent la mission injouable ou trivialement punitive | 0–1 | Moyenne | Élevé | Trois profils de charge testés avant l’UI : preuves d’abord, personnes d’abord, mixte ; ajuster les coûts, jamais la capacité | Plus de 70 % des essais headless échouent ou aucun profil ne laisse un choix réel |
| Colonne de 340 traitée comme 340 corps | 1 | Moyenne | Moyen | Groupe compté, 12 silhouettes, plafond de 40 corps dynamiques | Chute de frames ou test de rendu instable |
| Domaine trop large en un seul lot | 1 | Élevée | Élevé | Ordre imposé : cargaison → rapport → PO04 → défection → vulnérabilité, chaque étape avec ses tests | Lot 1 encore ouvert à J6 sans simulation de bout en bout |
| La migration réécrit un reçu MI01–MI14 | 2 | Faible | Très élevé | Égalité du **jeu de clés** et des valeurs, migration avant toute UI, fixtures figées | Un reçu gagne `crewLost`, `shuttle` ou `proofsBoarded` |
| Fixture v14 inexistante au moment du lot 2 | 2 | Certaine | Moyen | La produire une fois à J9, l’attester, bloquer le lot 2 tant qu’elle n’est pas figée | Lot 2 démarré sans SHA-256 enregistré |
| Le rendu invente positions ou états | 3 | Moyenne | Élevé | Toute géométrie vient de la simulation ; aucune constante de position dans le renderer | Écart entre reçu et image sur un même pas |
| Deux comptes de places divergents (HUD et campagne) | 3 | Moyenne | Élevé | `cargoContextFor` seule source ; le HUD ne calcule rien | Un total affiché différent du reçu |
| Texte hors canon ou trop long | 4 | Moyenne | Moyen | Budget par ligne, relecture contre la chronique, aucune nouvelle mécanique | Une ligne dépasse 240 caractères ou contredit un fait daté |
| Build, ZIP ou reçu incomplet | 5 | Moyenne | Moyen | Limites écrites, réceptions navigateur et humaine laissées séparées, aucune revendication non exécutée | `check:offline-package` échoue ou le ZIP diffère de l’HTML |
| Dérive vers MI15/MI17 | Tous | Élevée | Élevé | MI16 seule, drapeau de tranche, aucune fiche promue | Une tâche touche MI15, MI17 ou les fins |

### 17.5 Critères de sortie mesurables

| Lot | Sortie vérifiable |
| --- | --- |
| **0** | §16.1 sans question ouverte ; §16.2 figé ; les trois profils de §16.3 recalculés à la main (P1 = 19 refusé, P2 = 14 accepté, P3 = 15 accepté) et reproductibles sans interface. |
| **1** | Quatre suites headless passent (`mi16-simulation`, `mi16-report`, `mi16-dossier`, `mi16-vulnerability`) ; deux exécutions à graine fixe donnent le même état sérialisé ; les 7 motifs d’échec, les 8 candidats et les 5 caisses sont couverts ; trois profils rejoués, dont un refusé à 19 places et deux victoires, sans DOM. Détail, ordre et sorties intermédiaires au §17.7. |
| **2** | Quatre suites passent (`campaign-v15`, `mi16-defection`, `mi16-failure`, `mi16-cargo-persistence`) ; les 14 reçus sont identiques **valeurs et clés** ; deux fixtures v15 produites par migration (`campaign-v15-migrated`, `campaign-v15-chain`) avec leurs SHA-256, plus la fixture MI16 figée après réception ; une double migration donne le même octet ; un v15 sans MI16 est valide. |
| **3** | `check:ui` et `check:ui-runtime` passent ; un parcours clavier complet gagne MI16 ; trois refus visibles (capacité, rapport absent, navette au sol) ; aucun état graphique ajouté au dossier ; aucune constante de position dans le renderer. |
| **4** | Le reçu porte six lignes d’équipage nommées ; deux entrées de journal existent (preuve et perte) ; l’onglet Archives nomme les personnes laissées ; cinq repères audio — rampe, caisse, tampon du rapport, sirène de Cohorte, départ — sont déclenchés par des événements simulés ; aucun nouveau champ de sauvegarde. |
| **5** | `npm test`, `npm run check`, `check:ui`, `check:ui-runtime`, `build` et `check:offline-package` sortent en **code 0** ; le ZIP contient un seul HTML dont le SHA-256 égale le build local ; le reçu de tranche liste ce qui n’a **pas** été testé ; aucun critère `QA258`–`QA277` n’est promu. |

Chaque lot se termine par une revue de statut : tant qu’un lot n’est pas reçu, MI16 reste **Conçu**, pas **Prototype**. Le lot 5 autorise une revendication **Prototype** seulement si les vingt et un critères du §18 sont vérifiés ; sinon MI16 reste **Conçu** avec un reçu partiel.

### 17.6 Budget et coût d’un glissement

| Poste | Jours | Part |
| --- | ---: | ---: |
| Décisions et constantes | 1 | 5 % |
| Simulation et validation | 7 | 35 % |
| Campagne, migration et cale | 4 | 20 % |
| Rendu et interface | 4 | 20 % |
| Écriture et archives | 2 | 10 % |
| Build et réception | 2 | 10 % |
| **Total** | **20** | **100 %** |

Un glissement du lot 2 décale le lot 3 d’autant ; il ne se compense jamais par une compression du lot 5. Si le lot 1 dépasse J8, la marge passe de 4 à 2 jours et le lot 2 démarre sur le contrat de validation déjà figé, pas sur une version mouvante. Un lot 0 qui dépasse un jour est un signal de conception, pas un retard d’exécution : les décisions se tranchent avant d’écrire la simulation.

### 17.7 Lot 1 — plan d’exécution détaillé (7 jours)

**Principe.** Un seul domaine, cinq étapes fonctionnelles puis une étape d’intégration, dans l’ordre imposé, **tests écrits dans la même journée que l’étape** : une étape n’est pas « finie » parce que le code tourne, mais parce que ses scénarios passent et que l’étape suivante peut consommer son contrat. Aucune étape ne touche la sauvegarde, l’interface ou le rendu.

#### Fichiers touchés

| Fichier | Nature | Rôle |
| --- | --- | --- |
| `src/content.mjs` | modifié | entrée `MI16`, bloc `withdrawal`, 8 candidats, 5 caisses, constantes du §16.2 |
| `src/withdrawal-simulation.mjs` | **nouveau** | état `s.withdrawal`, cargaison, rapport, PO04, décision, dommages |
| `src/withdrawal-validation.mjs` | **nouveau** | sept fonctions du contrat, dossier, reçu, sortie |
| `src/simulation.mjs` | modifié | import/export, runtime, création, interaction, choix, mise à jour, solides, pieds, garde des ennemis |
| `tests/helpers/mi16-driver.mjs` | **nouveau** | pilote par `commandGame`/`updateGame`, aucun déplacement direct d’état |
| `tests/mi16-simulation.test.mjs` | **nouveau** | cargaison, décision, motifs, déterminisme |
| `tests/mi16-report.test.mjs` | **nouveau** | rapport bloquant |
| `tests/mi16-dossier.test.mjs` | **nouveau** | PO04, dossier, reçu |
| `tests/mi16-vulnerability.test.mjs` | **nouveau** | blessures, télégraphes, navette, abandon |

**Non touchés au lot 1** : `src/campaign.mjs` (lot 2), `src/main.mjs`, `src/ui.mjs`, `index.html`, les renderers et les assets (lot 3), `CAMPAIGN_SAVE_VERSION`, `data/bible.json`. Le domaine est testé seul, sans campagne et sans DOM.

#### Contrat d’interface à figer (fin J6)

`withdrawal-simulation.mjs` expose : `createWithdrawalMission`, `withdrawalSurface`, `withdrawalSolids`, `refreshWithdrawalFacts`, `withdrawalInteraction`, `interactWithdrawalMission`, `chooseWithdrawalMission`, `withdrawalFootfall`, `hitWithdrawalPart`, `updateWithdrawalMission`, `withdrawalObjectives`, `withdrawalDerivedFacts`, `withdrawalReceiptRoster`, `withdrawalContext`, `withdrawalDecisionBody` — mêmes rôles que le domaine `workshop`.

État minimal `s.withdrawal` : `places {total, reserved, free}`, `cargo`, `operations`, `report`, `proofs`, `po04`, `decision`, `shuttle`, `crew`, `candidates`, `column`, `alert`, `abandon`. Aucun de ces champs ne sort du domaine avant le lot 2.

#### Étape 1 — Cargaison (J1–J2)

- **État et opérations** : inventaire réel (5 preuves si `PO04` est acquise, sinon 4 ; 4 pièces, 8 candidats), affectation des 16 places, arrimage de caisse (2 s), embarquement (1,5 s), brancard (4 s), arrêt et reprise sans crédit partiel, refus motivés `capacité`, `réservé`, `déjà chargé`.
- **Fichiers** : `content.mjs` (bloc et constantes), `withdrawal-simulation.mjs` (places, opérations), `simulation.mjs` (création, interaction, mise à jour), `mi16-driver.mjs` (déplacement et chargement).
- **Tests** : `mi16-simulation` — 20/4/16, coûts 1/2/2/1, trois profils §16.3 (P1 refusé à 19 avec `PO04`, 17 sans ; P2 accepté à 14 ou 12 ; P3 accepté à 15), trois motifs de refus (`capacité`, `réservé`, `déjà chargé`), libération d’une place autorisant exactement son coût, arrimage interrompu non crédité, quatre places réservées non débarquables, aucune place créée par reprise.
- **Sortie mesurable** : P1 produit exactement `capacité` avec 3 places de trop ; P2 et P3 laissent 2 et 1 place ; interrompre à 50 % laisse 0 place créditée et la caisse au quai ; le total recalculé après chaque opération égale l’affichage ; libérer une place ne rend jamais plus que son coût.

#### Étape 2 — Rapport (J3)

- **État et opérations** : trois clauses de 3 s, transmission obligatoire, verrou de fermeture de rampe, rapport incomplet, refus d’extraction, sortie perdue terminale.
- **Fichiers** : `withdrawal-simulation.mjs` (console, clauses, verrou), `simulation.mjs` (interaction console, statut perdu), `mi16-report.test.mjs`.
- **Tests** : `mi16-report` — trois clauses, 9 s cumulées, fermeture refusée sans transmission, sortie perdue sans reçu, clause vide interdit `obey`, `defy` interdit sans preuve, le rapport ne modifie ni morts ni caisses, `reportFiled`, les trois booléens et `reportWording` consignés.
- **Sortie mesurable** : 0 fermeture acceptée sans transmission ; 0 `obey` accepté avec une clause vide ; 1 sortie perdue avec checkpoint et reprise sans crédit ; 3 booléens de clauses et 2 libellés testés ; aucun fait modifié par la rédaction.

#### Étape 3 — PO04 (J4)

- **État et opérations** : deux écoutes de 5 s (+1 exposition chacune), copie du bordereau (3 s, 2 s avec Nad), certification de la clause 3, assemblage conditionnel de `PO04`.
- **Fichiers** : `withdrawal-simulation.mjs` (écoutes, bordereau, assemblage), `withdrawal-validation.mjs` (preuve et constat), `mi16-dossier.test.mjs`.
- **Tests** : `mi16-dossier` — les 8 combinaisons des trois actes, une seule donne `PO04` ; chaque absence produit un constat avec l’acte manquant, sa date et sa source ; `PO04` ne clôt pas la chaîne PALINODE ; `PT04` et `TE02` jamais créés ; caisse endommagée conservée mais non certifiée.
- **Sortie mesurable** : 1 chemin sur 8 produit `PO04` ; 7 constats nomment l’acte manquant ; 3 actes portent date et source dans le dossier ; 0 occurrence de `PT04`/`TE02` dans le dossier sérialisé.

#### Étape 4 — Défection (J5)

- **État et opérations** : options `obey`/`defy`, accord de Hela (3 s), quatre conditions cumulatives, quatre motifs de refus (`no-report`, `no-proof`, `no-accord`, `shuttle-down`), `defected` et `ilanPosition` dans le domaine.
- **Fichiers** : `withdrawal-simulation.mjs` (décision, accord), `withdrawal-validation.mjs` (`validateWithdrawalSortie`), `mi16-simulation` et `mi16-dossier` (cas de décision de domaine). La persistance `defected`/`depots.sealed` et la dotation restent dans `mi16-defection`, lot 2.
- **Tests** : quatre refus, `obey` valide, `defy` valide avec rapport + preuve + accord + navette départable, aucune troisième option, reçu `defy` incohérent rejeté.
- **Sortie mesurable** : 4 motifs distincts ; 2 décisions valides ; 0 reçu `defy` accepté sans preuve ; 0 `defected` sans sortie validée.

#### Étape 5 — Vulnérabilité (J6)

- **État et opérations** : états 3/2/1/0, paliers de touches, effets chiffrés §8.2, alerte à la première écoute ou au premier tir, arrivée à 75 s, brèche à 60 s, broyage de rampe, chute de caisse, seuils de navette, réparation unique, ligne d’abandon 1 050/900, sept motifs d’échec.
- **Fichiers** : `withdrawal-simulation.mjs` (dégâts, signaux, horloges), `withdrawal-validation.mjs` (états et bornes), `mi16-vulnerability.test.mjs`, extension `mi16-simulation`.
- **Tests** : chaque source a un télégraphe ≥ 2 s et un évitement ; Hela et Sera jamais mortes ; Kader, Milo, Jun, Ilan et candidats mortels ; réparation une seule fois ; caisse non arrimée perdue si coque < 50 ; `grounded` et `lost` distincts ; abandon après avertissement ; 7 motifs atteignables.
- **Sortie mesurable** : 7 motifs déclenchés en headless, dont `shuttle-grounded` et `shuttle-lost` par état construit ; 0 mort sans signal ≥ 2 s ; 1 seule réparation acceptée ; brèche non réparée → coque 40, départ possible en `damaged` ; réparée → coque 60 et caisses non arrimées sauvées, fermeture 8 s et réparation 6 s en parallèle, prêt à 70 s ; 4 refus de départ par état construit (coque, moteur, rampe, verrou) ; abandon uniquement après l’avertissement à 1 050 et la ligne à 900 ; les 7 motifs restent des états de domaine, `lastFailure` appartient au lot 2.

#### Étape 6 — Intégration du lot (J7)

- **Contenu** : pilote complet, trois profils de bout en bout, durcissement des bornes, revue du contrat d’interface, documentation des scénarios dans le reçu de lot.
- **Fichiers** : `tests/helpers/mi16-driver.mjs`, les quatre suites, `withdrawal-validation.mjs` (bornes finales).
- **Tests** : `mi16-driver` gagne P2 et P3 avec `obey` et `defy` ; P1 s’arrête sur `capacité` ; deux exécutions à graine fixe donnent le même état sérialisé ; aucune importation DOM dans les deux modules du domaine.
- **Sortie mesurable** : 4 suites vertes ; 3 profils rejoués ; 2 sérialisations identiques ; 0 référence à `document`/`window` dans le domaine et la validation ; suite complète sous 60 s ; contrat d’interface listé ci-dessus figé pour le lot 2.

#### Règle de dépassement du lot 1

Si l’étape 1 dépasse J2, l’étape 2 démarre quand même J3 : le rapport ne dépend pas de l’équilibre des places, seulement du compteur. Si l’étape 4 dépasse J5, la vulnérabilité commence J6 sur les dégâts de navette seuls, et la défection est reprise J7. Un lot 1 qui atteint J8 sans les 4 suites déclenche la revue de périmètre prévue au §17.4 : on retire la chute de caisse et le broyage de rampe du lot, jamais les 16 places ni le rapport.

---

## 18. Critères d’acceptation

1. Une personne termine MI16 sans aide, depuis un dossier v14 migré, avec n’importe lequel des sept châssis assignables.
2. Le total des places ne dépasse jamais 16 ; tout refus est motivé et visible.
3. Le rapport bloque réellement l’extraction ; son absence produit une défaite terminale avec reprise.
4. `PO04` n’existe que si les trois actes sont accomplis ; sinon le dossier porte un constat.
5. La défection n’est possible qu’avec rapport, preuve et accord ; elle change les dotations et le gating de MI17.
6. Les rapports MI01–MI14 restent identiques octet pour octet ; les fixtures v1–v14 ne sont pas régénérées.
7. Aucune preuve `PT04`/`TE02` n’apparaît ; aucune personne de MI15 n’est inventée.
8. La colonne de 340 est comptée, pas simulée ; 12 silhouettes visibles au maximum.
9. Le reçu nomme ce qui monte, ce qui reste et ce qui est poursuivi.
10. Le build autonome reste reproductible et le ZIP identique à l’HTML.
11. Chaque blessure ou mort est précédée d’un signal d’au moins **2 s** et d’une action d’évitement identifiée ; aucune perte n’est aléatoire.
12. Hela et Sera ne meurent jamais ; Kader, Milo, Jun et Ilan le peuvent ; aucun état ne bloque la sortie sans échec explicite et annoncé.
13. Une navette sous les seuils, sans pièce ni temps, produit `shuttle-grounded` : aucun reçu, aucune progression, état consigné.
14. Quitter la scène sans embarquer produit `lastFailure`, aucun reçu, une campagne inchangée ; la reprise restaure blessés, morts et dégâts.
15. Une victoire écrit les pertes dans `crew.*.alive` et dans le reçu ; aucun mort ne réapparaît dans la mission suivante.
16. `lastFailure` ne contient jamais `partsGranted`, `decisionLabel` ni `defected` ; un dossier avec état inconnu, mort non compté ou dégât hors bornes est refusé.
17. Après une victoire, `ship.cargo` contient exactement ce qui est arrivé et `free = 16 − Σ slots` ; aucun doublon, aucun champ `free` stocké.
18. `obey` sort les preuves de la cale et libère leurs places ; `defy` les conserve ; une preuve laissée ou détruite n’est jamais recréée par la cale.
19. Une défaite ou une relecture laisse la cale identique ; une relecture ne redonne ni preuve, ni personne, ni place, ni dotation.
20. Une mission qui déclare `hold.requires` est refusée au briefing si la cale ne suffit pas ; elle ne peut ni ignorer une preuve requise ni la jeter en silence.
21. Une preuve `left` ou `damaged` reste lisible pour les fins ; elle n’est ni restaurée, ni promue, ni transformée en preuve certifiée.

---

## 19. Hors périmètre explicite

- MI15, MI17–MI32, les contrats, les épreuves, les fins.
- Toute nouvelle preuve (`PT04`, `TE02`), tout nouveau personnage de MI15.
- Assets peints du hangar, de la navette et de la colonne : repli vectoriel assumé.
- Codex complet, calendrier complet, contrat de fenêtres.
- Localisation, accessibilité avancée, manette hors mission.
- Interface d’inventaire libre, commerce, déchargement hors mission, modules augmentant les 16 places.
- Toute lecture de la cale par les fins : le présent document décrit ce qu’elles liront, pas leur implémentation.
- Système médical durable, mini-jeu de réparation, gestion des blessures après MI16.
- Variantes de MI17 pour une mort de Hela ou de Sera : elles sont protégées précisément pour ne pas en créer.
- Toute promotion de statut dans la bible : les fiches MI16 et `SY142`/`SY143` restent **Conçu** pendant la tranche.
