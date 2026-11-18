# L’EMPIRE D’ORTHÉ — la liasse de la Continuité

**Version 0.16.0 · révision de registre, 18 novembre 2026 · document de conception**

Ce dossier est une liasse. On y a rangé ce que l’équipage a pu copier, photographier ou entendre entre Vesper et Orthe : des papiers officiels, des pages d’école, des formulaires, des bribes de radio, des phrases de file d’attente. Les pièces sont citées telles quelles. Ce qui les entoure est de nous.

Il complète [la bible narrative](BIBLE_FR.md) et [la campagne](CAMPAIGN_FR.md). La source structurée est [data/bible.json](../data/bible.json) : `NA99–NA130` pour les pièces, `PN15–PN22` pour les personnes, `SY136–SY139` pour les mécanismes, `EN37–EN40` pour les unités, `VI29–VI33` pour les principes de représentation, `MI15–MI32` pour les missions.

**Statut :** tout est **Conçu**. Rien de ce dossier n’est implémenté : ni scène, ni dialogue joué, ni niveau. `MI01–MI14` restent seules jouables au stade prototype.

**Note de contenu.** Déportation, travail forcé, séparation des familles, effacement culturel, crimes de masse. Aucune torture montrée, aucun charnier en scène, aucun symbole réel. Avertissement au lancement, occultation des corps, réduction des cris et des haut-parleurs.

---

## 0. Deux voix, et ne pas les mélanger

Une pièce ne s’explique pas. Si un commissaire dit « transfert de rendement », personne ne traduit à sa place, ni le jeu, ni un personnage, ni la ligne suivante. Le joueur comprend par la file, le camion, le numéro cousu.

Un document impérial ne doit jamais avoir l’air écrit par quelqu’un qui le trouve monstrueux. Il doit avoir l’air écrit par quelqu’un qui veut que la ligne passe avant la relève. C’est cette fatigue-là qui fait peur, pas le tampon.

Et les mots ne sont pas un déguisement posé sur une chose simple. « Rapprocher les charges de leur emploi » n’est pas une façon polie de dire « déporter » : c’est la phrase avec laquelle un agent de bureau ouvre son registre à huit heures et rentre chez lui à dix-sept. Les deux choses sont vraies en même temps.

---

## 1. La leçon

> **ABRÉGÉ DE LA CONTINUITÉ — à l’usage des écoles de monde relié, page 12**
>
> **Leçon 4. Pourquoi nous comptons.**
>
> Avant la Dislocation, chaque monde croyait pouvoir tenir seul. Onze mondes ont cessé de respirer dans la même année. Personne n’a été puni : personne n’avait compté.
>
> Nous comptons parce que ce qui n’est pas compté n’existe pas. Un filtre pour cent personnes est un filtre. Un filtre pour cent une personnes est une promesse qu’on n’a pas les moyens de tenir.
>
> Aider n’est jamais gratuit. Celui qui reçoit doit. Celui qui doit travaille. Celui qui travaille mange. La chaîne tient parce qu’elle se referme sur elle-même.
>
> **Exercice.** Un convoi de douze charges reçoit trois rations. La garnison en garde une. Combien de charges peuvent poursuivre le trajet ?
> *Corrigé affiché au tableau. La réponse n’est pas un nombre de personnes.*

`DC-7` (`NA99`) en découle sans une ligne de plus : la tutelle ne s’éteint que par extinction de la dette. Un monde peut donc être secouru quarante ans. La maîtresse qui lit cette page y croit. C’est ce qui la rend utile au Directoire et insupportable au joueur.

`NA116`, `NA117`.

## 2. Le guichet

> **MANUEL DU LECTEUR — Bureau des Poids et des Conduites, chapitre 4, « Lire une rue »**
>
> 4.1 — Se présenter à huit heures. Le registre est ouvert avant le public.
> 4.2 — Lire les fiches par rue, jamais par nom. Un nom ne dit rien. Une rue dit le rendement, l’eau, la distance au quai.
> 4.3 — Une fiche sans adresse est une fiche sans ration. Ne pas la rétablir de mémoire : la mémoire n’est pas une pièce.
> 4.4 — En cas de contestation, remettre le formulaire 12. Ne pas discuter la catégorie. La catégorie n’est pas une opinion.
> 4.5 — Tenir sa voix. Le public confond la colère avec la décision.

> **FORMULAIRE 12 — Changement de catégorie** (`NA107`)
>
> Rue : ......... Fiche : ......... Catégorie actuelle : A / B / C
> Motif (cocher un seul) : rendement insuffisant — conduite — dépendance — autre
> Catégorie demandée : A / B / C
> Visa du lecteur : ......... Tampon : .........
> *Le demandeur reconnaît que la catégorie peut être révisée sans recours.*
> *Délai de traitement : onze jours ouvrés. La ration suit la catégorie en vigueur.*

Onze jours, ce n’est pas un délai : c’est la durée pendant laquelle on mange en C. Et la mention « sans recours » est imprimée sur le papier que la personne signe. Personne ne cache rien. C’est le guichet qui est terrible, pas le secret.

> — « Vous êtes C depuis le 4. »
> — « J’ai déposé un douze. »
> — « Le douze est au traitement. Onze jours. »
> — « Et je mange quoi ? »
> — « Ce que dit la carte. »
>
> *La carte dit : dépendant, voir garant.*

## 3. Les catégories

> **OC-12 — ORDONNANCE DES CHARGES** (`NA100`)
>
> Art. 1 — Toute personne recensée dans un monde sous tutelle est une charge.
> Art. 2 — **A**, rendement utile : ration complète, déplacement autorisé.
> Art. 3 — **B**, charge récupérable : travail non déclaré, ration réduite, déplacement soumis à autorisation.
> Art. 4 — **C**, charge non récupérable : transfert, calibration ou préservation, à la discrétion du Directoire.
> Art. 5 — La catégorie se transmet aux dépendants. Elle se révise sur formulaire 12.
> Art. 6 — Le Directoire ne motive pas ses décisions de préservation.

L’article 6 est tout le régime. « Non récupérable » ne veut pas dire « qu’on va réparer » : veut dire qu’on ne compte pas la récupérer. Le mot est exact, et c’est pour ça qu’il faut le laisser tel quel.

## 4. Le titre

> **DT-3 — art. 6.** La révocation du titre ne déplace personne. Elle rend le déplacement légal. (`NA101`)

> **NOTIFICATION DE RÉVOCATION** — souche conservée par la famille
>
> Titulaire : ......... Fiche : .........
> Motif : ............................
> Le titre de présence est révoqué à compter de la présente notification.
> L’intéressé demeure à son domicile jusqu’à décision d’affectation.
> *Le port de la présente tient lieu de pièce d’identité pendant trente jours.*

La même souche fait de son porteur un homme qu’on peut charger dans un camion et une personne qui passe encore un contrôle. Les deux pendant trente jours. C’est cette double lecture qui doit rester visible dans une scène, sans qu’aucun personnage ne la commente.

## 5. La faim

> **CB-3 — CODE DES BOUCHES** (`NA102`)
>
> Art. 3 — La ration est proportionnelle au rendement déclaré.
> Art. 7 — L’enfant, le vieillard et le blessé exigent un garant productif.
> Art. 8 — À défaut de garant, la bouche est dite non productive et rattachée à la colonne de son foyer.
> Art. 9 — Le garant répond du rendement de ses dépendants.

> **CARTE DE RATION — recto**
>
> Charge : .......... Catégorie : ......
> Ration : ...... unités par jour
> Dépendants : ...... *(voir garant)*
> *Toute surcharge manuscrite annule la carte.*

« Voir garant » tient lieu d’enfance. Sur Méridien, la ration n’est pas seulement une privation : c’est le levier du quota du centre (`MI25`), et la répartition des wagons (`MI28`) est un partage, pas une collecte.

## 6. Les supports

> **R-44 — art. 2.** Toute archive non déclarée est un support non autorisé. Sa détention est un délit de conservation. (`NA103`)
> **art. 9.** Les porteurs dont le corps conserve une mémoire lisible sont classés supports vivants. Ils relèvent de l’Institut de la Mémoire Matérielle et ne peuvent être ni copiés, ni déplacés, ni restitués sans ordre de prélèvement.

> **ORDRE DE PRÉLÈVEMENT — Institut de la Mémoire Matérielle, jardin n° 6**
>
> Objet : relevé des supports vivants.
> Opération : 1) relevé contradictoire ; 2) mise en fût ; 3) restitution sur demande écrite de l’ayant droit.
> Durée : trois jours. Escorte : une escouade.
> *Le jardin sera classé friche non déclarée à l’issue du relevé.*

« Restitution sur demande écrite de l’ayant droit » : l’ayant droit est dans le fût. Et un jardin de mémoire devient une friche en une phrase de bas de page.

## 7. Instruction 27

> **INSTRUCTION 27 — Calibration** (`NA105`)
>
> 1. Les charges de catégorie C peuvent être affectées à la mesure de la tolérance thermique, chimique et mécanique des châssis.
> 2. La signature d’un ingénieur du bureau compétent vaut autorisation d’essai.
> 3. Le nombre de sujets est fixé par le rendement attendu, non par la durée de l’essai.
> 4. Les sujets sont désignés par leur numéro de fiche. Aucun nom n’est porté au registre d’essai.
> 5. Le compte rendu emploie le terme « sujet », jamais « personne ».
>
> **Annexe — barème.** Tolérance thermique : 40 sujets, 3 essais. Tolérance chimique : 25 sujets, 2 essais. Tolérance mécanique : 60 sujets, 5 essais.
>
> Visa : *A. Serrat, ingénieure, 4e bureau.*

C’est une page de barème. C’est là que la signature d’Aline est posée, et c’est pour ça qu’elle ne peut pas répondre « je ne savais pas ». Dans `MI15` elle ne parle ni d’erreur ni de laboratoire :

> « J’ai signé une tolérance. On m’a demandé combien de sujets par essai. J’ai répondu. Après, c’est du transport. »

Le reste de la mission est du transport, en effet : des portes, des salles, des vivants qu’on peut asseoir ou non.

## 8. Règlement 61

> **RÈGLEMENT 61 — Chambres de vérité** (`NA106`)
>
> Art. 4 — L’accusé est invité à confirmer la cause officielle du désastre.
> Art. 5 — La confirmation enregistrée vaut preuve. Le doute exprimé vaut catégorie C.
> Art. 6 — Le greffier corrige la formulation jusqu’à ce qu’elle soit recevable. La correction est lue à l’accusé avant signature.
> Art. 7 — La séance est diffusée. Une séance non diffusée n’a pas eu lieu.

> **FEUILLE DE SÉANCE** — brouillon annoté par le greffe
>
> Déclaration : « La pompe a cédé. »
> Recevable : « La pompe a cédé après sabotage. »
> Observation du greffe : *« après sabotage » suffit. Ne pas nommer. Ne pas dater.*
> Refus de l’accusé : « Je ne sais pas qui. »
> Mention portée : *l’accusé confirme le sabotage et déclare ignorer son auteur.*

Aucun aveu de culpabilité n’est demandé. On ne demande que l’accord sur la version — et un refus devient une confirmation par la grâce d’une mention portée. Tout est sur la page, à l’encre, sans mensonge.

## 9. Circulaire 9-B

> **CIRCULAIRE 9-B — Reclassement de voisinage** (`NA104`)
>
> 1. Un sabotage non résolu entraîne le reclassement du pâté de maisons où le fait a été constaté.
> 2. Le reclassement ne suppose ni identification ni aveu. Il constate une insuffisance de conduite collective.
> 3. Le pâté reclassé fournit une colonne, dirigée vers la station la plus proche.
> 4. Les autorités locales affichent la décision. L’affichage vaut notification.

> **AFFICHE — porte de la mairie de quartier**
>
> « Le pâté 14 est reclassé à compter de ce jour. Les titres de présence y sont suspendus jusqu’à établissement des responsabilités.
> Les familles sont priées de ne pas déplacer les dépendants.
> *La Continuité ne pardonne pas ; elle compte.* »

C’est la deuxième phrase de l’affiche qui dit ce qui vient. Holt l’applique dans `MI31` sans élever la voix, et c’est pour cette raison qu’il faut l’entendre avant de le combattre.

## 10. PALINODE

> **[page sans en-tête, trouvée dans un classeur d’entretien à Nacre]**
>
> Semaine 12 — Pompe 3 : révision anticipée. Retirer le joint de seconde barrière. Ne pas consigner.
> Semaine 13 — Filtre 2 : nettoyage reporté. Créer la demande de pièce. La pièce n’arrivera pas.
> Semaine 14 — Régulation : desserrer d’un quart. Noter « usure normale ».
> Semaine 15 — Sol : rien. Le sol n’a pas besoin de nous.
>
> *Rappel : l’intervention de secours ne peut être demandée qu’après constat officiel de défaillance. Le constat appartient au bureau local.*

Le crime tient dans un calendrier d’entretien. Personne ne signe un massacre ; quelqu’un signe un nettoyage reporté. Et comme le constat appartient au bureau local, celui qui doit diagnostiquer la panne est celui qui l’a programmée. C’est toute la mécanique de PALINODE, et elle n’a besoin d’aucun secret.

## 11. Ce qu’on entend dans les files

- « Il est C. »
- « Elle est à la salle depuis mardi. »
- « Ils ont pris la rue. »
- « Le compte est passé. »
- « Il a fait sa phrase. »
- « Le jardin a brûlé. »
- « On a payé pour un autre. »
- « Il est parti. » — « Parti où ? » — « Parti. »
- « Ne dis pas son nom dehors. »

Aucun de ces mots n’est de l’argot. Ce sont les mots qui tiennent dans une bouche quand il n’y en a pas d’autres. Sur Kharon, « la salle » ne désigne qu’une pièce, et le voisin qui l’entend regarde le sol. À Orthe, « il est parti » ne veut pas dire qu’il est mort : ça veut dire qu’on ne le reverra pas et qu’il n’y a pas de mot pour ça.

## 12. Les neuf organes

Ils ne forment pas une conscience. Ils se jalousent, se couvrent et se contredisent — ce qui rend chaque papier contestable et chaque crime partagé.

| Organe | Ce qu’il tient | Sa méthode | Ce qui le fait céder |
| --- | --- | --- | --- |
| **Directoire de la Continuité** (`FA07`) | La décision politique, neuf sièges tournants | Délégations signées, unités sans insigne | Successions, dépendance aux archivistes |
| **Bureau des Poids et des Conduites** (BPC) | Recensement, titres, catégories | Fiches, guichet, lecture de numéros, chiens | Un agent pour quatre cents personnes ; un mur de fiches est fragile |
| **Chambre des Dettes de Protection** (CDP) | Convertir le secours en créance | Contrats, garanties, saisies de récolte | Une créance est écrite ; un registre copié vaut preuve |
| **Section des Filtres** (SdF) | Air et eau sous contrôle | Compatibilité exclusive, pièces propriétaires | Ses ingénieurs connaissent la fraude |
| **Institut de la Mémoire Matérielle** (IMM) | L’effacement des filiations | R-44, jardins noyés, porteurs « préservés » | Chaque destruction laisse un index |
| **Cohorte des Serments** (`FA09`) | Application, pilotes d’élite | Contre-pilotage, logistique privilégiée | Loyautés personnelles, doute sur l’ordre |
| **Service des Rations et des Récoltes** (SRR) | Nourrir le centre, punir les périphéries | Quotas, rationnement punitif, silos | Le compte est local et vérifiable |
| **Chambres de Vérité** (CdV) | Fabriquer la version officielle | Confirmation, greffe, diffusion | Un refus enregistré fissure le récit |
| **Stations de continuité** (SdC) | Trier, faire rendre, stocker les noms | Numéros, rendement affiché, colonnes | Une adresse postale, un registre, du personnel local |

### Le Directoire

> **DÉLÉGATION — Autorisation d’opération**
> Objet : non communiqué.
> Contreseing : Bureau des Poids — Chambre des Dettes — Continuité.
> *La présente autorise l’opération sans en désigner l’objet. Chaque bureau contresigne un principe.*

Neuf personnes qui ne se réunissent jamais toutes ensemble et qui ne croient pas au mal. Elles croient à la continuité du centre. Le résultat est qu’un monde peut être retourné sans qu’aucun des neuf n’ait ordonné la chose par son nom.

### Le Bureau des Poids

Le vrai cœur du système. Un agent, quatre gardes, un registre. Il ne tue pas : il lit. Il révoque un quartier avant le petit matin, rattache trois enfants au rendement d’un adulte, envoie une rue entière en C sans quitter sa chaise. Sa violence est une voix égale et une file qui avance. `EN37`, `PN15`.

### La Chambre des Dettes

> **CONTRAT DE SECOURS — art. 1.** Le secours est avancé sans frais.
> **art. 2.** La créance est exigible sur la récolte, le travail ou le nom.
> **art. 3.** Le défaut de paiement entraîne la saisie du titre.

Elle ne prête pas : elle constate une dette déjà contractée par le fait d’avoir survécu dans un monde relié. Une famille sauvée peut devoir une récolte, un enfant ou un nom.

### L’Institut de la Mémoire

Il ne dit pas « brûler des livres ». Il dit « assainir des supports non autorisés », et il a des horaires, des camions-citernes et des formulaires de restitution. `PN21`. `Tava`.

## 13. La chaîne ordinaire

Sept étapes, chacune avec son papier, sa phrase et sa fissure. C’est cette chaîne que le joueur doit pouvoir remonter.

1. **Recenser.** *Papier :* le registre de rue. *On dit :* « Vous n’êtes pas sur la feuille. » *Casse :* une rue absente du registre n’a ni ration — ni colonne.
2. **Classer.** *Papier :* formulaire 12. *On dit :* « Le douze est au traitement. » *Casse :* un tampon volé, un greffier acheté, une fiche recousue.
3. **Révoquer.** *Papier :* notification DT-3. *On dit :* « Votre titre est suspendu. Vous restez chez vous. » *Casse :* restaurer un titre, cacher une fiche.
4. **Transférer.** *Papier :* bordereau de colonne (`NA108`). *On dit :* « Douze unités, pertes en route tolérées. » *Casse :* bloquer le camion, couper le haut-parleur, ouvrir un cordon.
5. **Trier.** *Papier :* feuille de tri. *On dit :* « Atelier, infirmerie, départ. » *Casse :* enrayer le convoyeur, confisquer les feuilles.
6. **Faire rendre.** *Papier :* registre de rendement (`NA110`). *On dit :* « Le rendement baisse. La ration suit. » *Casse :* publier le registre, couper l’énergie, nourrir sans autorisation.
7. **Effacer.** *Papier :* ordre de prélèvement. *On dit :* « Relevé, mise en fût, restitution sur demande. » *Casse :* copier, répartir, restituer, protéger.

**Règle de conception.** Une mission ne montre jamais l’étape 7 sans avoir laissé voir au moins une des étapes 1 à 4. Sans ça, l’effacement n’est qu’un décor.

## 14. Les lieux

- **La station de continuité** (`NA129`). Hangar de tri, atelier, infirmerie de fortune, hangar aux noms. Le rendement s’affiche à l’entrée ; à la porte, on échange un nom contre un numéro. Elle a une adresse postale et un vaguemestre. Ce n’est pas un secret : c’est une administration, et c’est pour ça qu’on peut y écrire.
- **La chambre de vérité.** Une salle propre, des chaises, un micro, une horloge. On y entre pour confirmer une phrase. La séance est diffusée : la ville l’entend, et le greffier corrige en direct.
- **Le jardin de mémoire.** Un jardin minéral Khelt où la mémoire pousse dans des supports vivants. L’Empire le classe « friche non déclarée » et le noie de caloporteur. Les noms restent dans la terre, et l’index dans un fût.
- **La salle de calibration.** Des cellules thermiques, des bancs, des instruments étalonnés. Un registre d’essai sans noms, seulement des numéros de fiche. Le compte rendu parle de « sujets ».
- **La colonne.** Des camions à ridelles, un haut-parleur, des bracelets. Les familles sont séparées par rendement : les productifs d’un côté, les dépendants de l’autre. Le haut-parleur répète les numéros, pas les noms.
- **Le bureau des charges** (`NA130`). Un mur de fiches, un nom par fiche, classées par rue. Détruire le mur libère du classement et efface des droits à la ration. Copier le mur conserve les deux.
- **La fosse de dégel.** Sur Sereis, la glace fond et rend visibles des corps que l’Empire classe en aléa climatique. Rien à voir : une ligne de neige creusée, des objets, un relevé, une date. `MI18`.

## 15. Ceux qui tiennent le stylo

L’abominable ne demande pas des sadiques. Il demande des gens compétents, partiels, et fatigués à dix-sept heures.

- **Orlan Voss**, comptable (`PN15`). « Si je laisse une erreur, quelqu’un mangera à la place d’un autre. Vous préférez lequel ? » Il ne hausse jamais la voix. Il peut révoquer un quartier en lisant une liste.
- **Ilse Varne**, médecin (`PN16`). « Je peux sauver onze personnes ou en perdre vingt-trois. Vous voulez que je vous fasse un discours ? » Son tri est rationnel, et il est faux, et elle le sait.
- **Berth Malen**, juge (`PN17`). « Je ne vous demande pas d’avoir fait. Je vous demande de confirmer. » Il croit éviter pire, et parfois c’est vrai.
- **Aline Serrat**, ingénieure. « J’ai signé une tolérance. » Sa fissure n’est pas le remords : c’est qu’elle refuse de se traiter comme une victime de son propre bureau.
- **Néra Sand**, la voix (`PN18`). « Je ne cache rien. Je lis les chiffres. » Ancienne infirmière, elle croit que la panique tue plus que la vérité. Ses bulletins ont préparé les colonnes sans jamais nommer un mort.
- **Sarre Kadak**, gardien de station. « Les colonnes venaient d’ailleurs. Moi, je tenais l’horaire. » Il gère une usine, avec des équipes, des pannes et des livraisons.
- **Deni Vorel**, archiviste (`PN22`). « Je n’ai jamais signé une mort. J’ai signé des transferts. Le tampon ne dit pas où l’on arrive. » Sa coopération n’est pas une absolution ; c’est une transaction.

Chacun a une raison de tenir et une fissure. Aucun n’est converti par un discours : une pièce peut le faire hésiter, une menace peut le faire taire, rien ne l’absout.

## 16. Ceux qu’on classe

Les personnes classées ne sont pas un décor de compassion. Elles ont des stratégies, des mensonges, des préférences et des torts.

- **Nell Ash** (`PN20`) a cousu les noms dans la doublure de son manteau et récite les numéros sans hésiter. Elle ne témoigne que si un adulte garant et un lieu sûr existent ; sinon elle marchande sa mémoire, et elle a raison de le faire.
- **Tava** (`PN21`) est une porteuse Khelt. Elle refuse d’être un échantillon et exige une restitution écrite. Sa mémoire peut être copiée sans consentement : c’est un crime, pas une collecte.
- **Les noms cousus** sont une pratique de station (`NA122`) : chaque enfant coud un nom qu’on lui a pris. La doublure tient mieux que les registres, et la comptine qui va avec est interdite.
- **Les collaborateurs** existent : un contremaître qui choisit les listes pour sauver sa fille, un gardien qui vend des rations, un voisin qui parle. Ils ne sont pas des monstres ; ils sont dans la chaîne, et le jeu ne les en sort pas.
- **Les refus** existent aussi : une famille refuse l’évacuation parce qu’elle perdrait son titre, un vieillard refuse de quitter sa maison, une mère refuse de donner son nom. On ne sauve personne malgré lui sans le dire.

## 17. Ce que le joueur doit ressentir

1. **La complicité physique.** La coque bloque une rue, porte des charges, écrase un cordon. La machine ne laisse pas de place propre.
2. **Le vertige du compte.** Une colonne de trois cent quarante personnes tient dans un bordereau. Le joueur voit d’abord les chiffres, puis les visages — jamais l’inverse.
3. **L’absence de catharsis.** Détruire une station ne ressuscite personne. Libérer une chambre de vérité peut produire une fuite sur la glace.
4. **La fatigue du refus.** Désobéir coûte des places, du carburant, des alliés. Le jeu n’achète pas la pureté ; il enregistre le prix.
5. **Le silence après.** Les épilogues montrent les lieux et les noms, pas un score. Une rue sauvée reste une rue sans titre si le registre a brûlé.

## 18. Table de travail — lexique

*Hors fiction. Cette table sert à écrire les textes ; elle ne doit jamais apparaître dans une réplique.*

| Terme officiel | Ce que ça désigne | Ce qu’on entend | Piège d’écriture |
| --- | --- | --- | --- |
| Continuité | L’ordre impérial et la dépendance matérielle | « la chaîne » | Ne pas la faire prononcer par un habitant sans ironie |
| Remise aux normes | Reprise en main d’un service autonome | « la saisie » | L’agent, lui, dit « remise aux normes » sans malice |
| Tutelle de rendement | Occupation d’un monde jugé non viable | « le compte » | Ne pas expliquer la durée ; la laisser constater |
| Titre de présence | Papier qui lie identité, ration et travail | « le titre » | Le mot populaire est le même : il n’y a pas d’autre mot |
| Charge | Personne recensée dans une colonne | « une tête », ou rien | Un impérial ne dit jamais « personne » |
| Catégorie C | Personne promise au transfert | « il est C » | Trois lettres suffisent ; ne pas les commenter |
| Transfert de rendement | Déportation | « le départ » | « Colonne » est le mot officiel, pas l’argot |
| Reclassement de voisinage | Représaille sur un quartier | « on a payé pour un autre » | Ne pas nommer la circulaire dans la rue |
| Station de continuité | Camp de tri et de travail | « la station » | Aucun euphémisme : c’est le nom, et il est dans l’adresse |
| Chambre de vérité | Tribunal de confirmation | « la phrase » / « la chambre » | Ne jamais montrer un aveu : seulement une formulation |
| Assainissement mémoriel | Destruction d’archives et de langues | « le jardin a brûlé » | Le verbe officiel est « assainir », pas « détruire » |
| Calibration | Expérimentation sur des catégories C | « la salle » | Sur Kharon, « la salle » ne désigne qu’une pièce |
| Calme rétabli | Fin d’une opération, souvent par déportation | « ils sont partis » | La phrase sert aussi aux morts ; ne pas trancher |

## 19. Règles de représentation

- **Aucun symbole réel.** Pas d’emblème, d’uniforme ni de nom d’un régime historique. L’iconographie d’Orthe est géométrique : cercles concentriques, barres de comptage, numéros.
- **Rien à voir.** Aucun charnier à l’écran, aucune torture montrée, aucun corps d’enfant. L’horreur est dans la file, la phrase, le numéro cousu et la date au bas d’un relevé.
- **Pas d’animalisation.** Les victimes parlent, négocient, résistent et se trompent. Leur mort n’est pas un effet visuel.
- **Pas de pornographie de la culpabilité.** Pas de musique larmoyante pour forcer l’émotion. On montre les conséquences et on laisse le joueur avec.
- **Avertissements et options.** Avertissement au lancement, occultation des corps, réduction des cris et des haut-parleurs, journal des faits consultable hors mission.
- **Preuves distinctes.** Un document montre une décision ; un témoignage montre une expérience ; aucun ne remplace l’autre.

## 20. Traçabilité dans la campagne

| Mission | Pièce ou mécanisme | Ce que le joueur peut faire | Preuve |
| --- | --- | --- | --- |
| MI15 | Instruction 27, salle de calibration | Extraire Aline, ouvrir les cellules, choisir qui embarque | PT04, TE02 |
| MI16 | Ordre de disparition, bordereau de colonne | Répartir un poids fini entre preuves et personnes | PO04 |
| MI17 | Colonne « perdue » dans la tempête | Donner des places ou du carburant | — |
| MI18 | Ordres de semis, fosse de dégel | Copier les dates, nommer la fosse ou la taire | PT05 |
| MI19 | Bracelets de conduite, listes de familles | Choisir les familles, couper les bracelets | — |
| MI20 | Chambre de vérité, confirmations | Libérer, sceller ou passer | — |
| MI21 | Titre de présence, jardin scellé | Négocier l’accès, éviter les dégâts | — |
| MI22 | R-44, ordre de prélèvement | Copier, protéger, restituer | PO01, TE04 |
| MI23 | Prisonniers impériaux, accord de coalition | Empêcher l’exécution, tenir le pacte | — |
| MI24 | Registre des charges, noms cousus | Publier, protéger, ou les deux avec un coût | — |
| MI25 | Ration punitive, quota du centre | Nourrir un secteur, en affamer un autre | — |
| MI26 | Créances, mur des fiches | Copier les contrats, tenir les pompes | PO02 |
| MI27 | Circulaire 9-B, reddition | Escorter les soldats, empêcher la vengeance | — |
| MI28 | Wagons, aiguillages | Répartir la nourriture | — |
| MI29 | Salle de calibration d’Orthe, ateliers | Montrer les faits, ouvrir un accès | — |
| MI30 | Bureau des charges, délégations | Copier, saisir, détruire ou publier le mur | PO03 |
| MI31 | Verrouillage de trois districts | Casser l’armement, tenir un corridor | — |
| MI32 | Station d’Orthe, noms confisqués | Publier ou protéger, arrêter les terraformes | TE03 |

Les preuves `PO04`, `TE03` et `TE04` s’ajoutent à la chaîne existante sans la remplacer. Aucune ne prouve seule la totalité du programme.

## 21. Limites

- Aucun de ces contenus n’est implémenté : ni cinématique, ni dialogue joué, ni niveau, ni asset.
- Les missions `MI15–MI32` restent **Conçu**. Leur présence détaillée ne les rend pas jouables.
- Les huit épreuves de châssis (`CT17–CT24`, voir [EPREUVES_CHASSIS.md](EPREUVES_CHASSIS.md)) restent conçues ; seul `WK14` est pilotable, et les sept autres châssis n’ont ni marche ni tir simulés.
- L’export `docs/ORDRE_DE_CENDRE_Bible.xlsx` n’a pas été reconstruit en 0.16 : le générateur exige le runtime `@oai/artifact-tool`, absent de cet environnement. La source `data/bible.json` fait foi ; l’écart est signalé, pas masqué.
- Les pièces citées ici sont des textes de conception. Aucune n’a été relue par un lecteur concerné, et aucune validation de sensibilité n’a été conduite. Les avertissements et les options de représentation restent à éprouver avec des joueurs avant toute diffusion.
