# ORDRE DE CENDRE — AFFRONTEMENTS

**Banc d’essai des Sept Appuis · Tranche de conception · 17 novembre 2026**

**Statut : conçu. Menu livré dans le prototype. Duels non simulés.**
Le menu **Affrontements**, son bracket, ses huit dossiers d’histoire et ses 35 planches décrites existent dans le prototype (HTML autonome et sortie web). Le duel 1 contre 1, l’IA de ring, les arènes jouables et les illustrations restent à produire. Aucune sauvegarde de campagne n’est modifiée et aucune fiche de la Bible n’est ajoutée : les 1 007 IDs, les 21 onglets et les 133 critères initiaux restent inchangés.

---

## 1. Pourquoi un tournoi, et pourquoi celui-là

Un mode tournoi de combat classique repose sur des duels, des rivaux et des fins par personnage. **ORDRE DE CENDRE** ne peut pas importer telle quelle la logique d’un jeu de combat : ses machines sont lentes, ses personnages meurent dans la campagne et sa faune n’existe pas pour être frappée. Le mode doit donc partir d’un fait du monde, pas d’un écran de sélection posé au-dessus.

Ce fait existe déjà dans la fiction : **les carrières de Vesper réglaient l’eau et les passages par des duels d’appuis** avant la standardisation impériale. Deux machines entraient dans un ring de pierres, sans munitions réelles, et la première à trois marques prenait le terrain. L’Empire a conservé le rite, l’a bridé et le diffuse. Une machine qui gagne sans tuer prouve mieux sa supériorité qu’un charnier, et le spectacle occupe les équipages entre deux affectations.

C’est le **Concours des Sept Appuis**, tenu dans la **Carrière des Cendres** à Vesper. Sept blocs de taille marquent les niveaux du rite ; les duels ordinaires se jouent sur le quatrième, le titre sur le septième. Le cadre autorise enfin ce qu’un mode versus exige :

- des duels répétés entre combattants identifiés ;
- des rivaux et des gardiens par dossier ;
- des fins personnelles ;
- et une raison interne pour que les mêmes machines se rencontrent sans que la campagne soit réécrite.

### Ce que le rite interdit

- **Aucune mort.** Les munitions sont des charges de marquage et des impulsions. On prend le sol, on ne détruit pas l’adversaire.
- **Aucune capture d’animal.** Les bêtes du catalogue ne sont jamais amenées au ring. Le **banc de reconstitution** rejoue leurs enregistrements de terrain sous forme d’**ombres** : mêmes habitudes, mêmes réactions, aucun spécimen prélevé. Un comportement non reproductible est consigné « non concluant », jamais inventé.
- **Aucun fait de campagne.** Les épilogues sont des pièces d’archive du banc. Ils n’accordent ni preuve PALINODE, ni recrutement, ni défection, ni mort de personnage. Un dossier peut finir mal sans qu’un seul fait du dossier v14 change.
- **Aucune supériorité gratuite.** Le Décret gagne parce que le ring a été construit à son échelle, pas parce qu’il est « le plus fort ». Le jeu doit montrer le coût du rite, pas célébrer une hiérarchie.

---

## 2. Le menu

Le menu principal gagne une entrée **Affrontements** entre *Simulations* et *Hangar*. La vue titre garde les matières du pont de commandement : bandeau d’aube ocre, poussière de carrière, portraits en vignette, aucune couleur de faction dominante.

Quatre sous-menus, en onglets accessibles au clavier (rôle `tab`, `aria-selected`) :

| Sous-menu | Contenu | État |
| --- | --- | --- |
| **Tournoi** | Les Sept Appuis : bracket à huit, quarts, demi-appuis, Septième Appui. | Livré (lecture) |
| **Histoire** | Huit dossiers : introduction, 7 adversaires, rival, gardien, épilogue. | Livré (lecture) |
| **Chroniques** | Les 35 planches à produire, filtrables par lot. | Livré (briefs) |
| **Règlement** | Le rite, les marques, le bridage, les bêtes, les terrains, les commandes, le statut. | Livré |

Le bouton **Ouvrir le bracket** ne lance encore aucun duel : il affiche un message explicite. C’est volontaire. Le prototype ne doit pas laisser croire qu’un mode de combat est branché alors que seule sa couche de conception existe.

### Hiérarchie de lecture

1. **Le tournoi** donne la structure et les règles.
2. **L’histoire** donne le sens : chaque combattant a une raison d’entrer, un miroir et une fin.
3. **Les chroniques** donnent la fabrication : ce qu’il faut peindre, pour quel usage, avec quels interdits.
4. **Le règlement** tranche les ambiguïtés et rappelle le statut de production.

---

## 3. Le règlement du rite

### 3.1 Marques et manches

- Une manche se gagne à **trois marques**.
- Une marque s’obtient par **sortie du ring** (un appui hors des sept pierres), par **rupture d’appui** (les deux groupes hors contact ou coque basculée) ou par **tenue du centre** au compte de cinq.
- Un duel se joue en **deux manches gagnantes**.
- La chaleur et le recul restent ceux du moteur : une machine bridée chauffe, tousse et boite comme une vraie. La purge reste une fenêtre de vulnérabilité.

### 3.2 Appuis

Les appuis sont la ressource du mode. Un pas déplace la coque ; un appui posé peut être pris, une cadence répétée peut être lue. Les combattants du roster ont chacun une manière de **lire les appuis** :

- Cerbère occupe le centre et oblige l’autre à venir.
- Le Prétoire ferme une bande et punit le tir intérieur.
- L’Automate ne marche pas : il se treuille, et son câble est une ligne de vie visible.
- Le Guetteur-racine écoute les trois premiers pas identiques.
- Le Guetteur des Rives ne tient jamais le centre, il choisit le côté.
- L’Aile-miroir ne pose pas de pied : elle plonge sur une optique éclairée.
- Le Harponneige frappe sous l’appui resté immobile.
- Le Décret joue par phases et expose une pièce par phase.

### 3.3 Bridage

- Les tirs réels sont remplacés par des **charges de marquage** et des **impulsions**.
- Les armes lourdes conservent leur préparation, leur recul et leur chaleur.
- Les avaries de coque, de pied et de radiateur restent visibles et réparables à l’arrêt (T), comme en mission.
- Aucun sang, aucune décapitation, aucun trophée.

### 3.4 Terrains

Chaque arène impose une règle et un état de sol. Le ring ne s’aplatit pas pour rendre les duels interchangeables.

| Arène | Monde | Règle de terrain |
| --- | --- | --- |
| Carrière des Cendres | Vesper | Scories glissantes après un tir lourd ; sept pierres de taille. |
| Cour des Appuis | Orthe | Dallage poli, projecteurs chauds, foule proche. |
| Atelier des Mains noires | Kharon | Pont roulant, câble de treuil, chaleur d’atelier. |
| Clairière des racines | Thyr | Racines porteuses qui glissent ou résonnent. |
| Digue des Deux-Rives | Nacre | Marée montante : le ring rétrécit ; les flaques conduisent les impulsions. |
| Canyon des reflets | Ilex | Lampes et miroirs : une optique allumée attire la plongée. |
| Glace de l’Écluse | Sereis | Glace fine : l’immobilité fissure la plaque. |
| Terrasse du Décret | Orthe | Ring trop petit pour un croiseur ; les pierres deviennent des marches. |

### 3.5 Commandes

Les commandes du mode reprennent celles de la mission, sans en inventer de nouvelles : Q/A et D pour la coque, J et L pour les groupes d’appuis, souris pour viser, clic pour marquer, Espace pour l’ancrage, V pour purger, E pour les relais et les prises, T pour réparer à l’arrêt. Les contrôles AZERTY/QWERTY, la pause et les états de victoire/défaite restent ceux du jeu.

---

## 4. Le roster

Huit combattants, tous issus du canon existant. Deux sont des machines de la campagne ou du prototype, deux sont des bêtes reconstituées, une est un éclaireur de la Ligue, un est un croiseur de commandement conçu, un est un automate d’atelier, un est un prédateur de Sereis.

| Id | Nom | Source | Monde / arène | Archétype |
| --- | --- | --- | --- | --- |
| CER | **Cerbère** | OP03, marcheur de garde | Vesper / Carrière | Pression, tenue du centre |
| PRE | **Prétoire** | VE12, MI12 | Orthe / Cour des Appuis | Contrôle d’espace |
| AUT | **Automate** | MI14, atelier | Kharon / Atelier | Zone et contre, treuil |
| GUE | **Guetteur-racine** | FU09 | Thyr / Clairière | Embuscade, prise |
| RIV | **Guetteur des Rives** | EN21, Ligue des Rives | Nacre / Digue | Évasion, relais |
| AIL | **Aile-miroir** | FU18 | Ilex / Canyon | Aérien, plongée |
| HAR | **Harponneige** | FU13 | Sereis / Écluse | Piège, immobilité |
| DEC | **Décret** | VE16, Cohorte | Orthe / Terrasse | Gardien à phases |

### 4.1 Précisions de canon

- **Cerbère** reste le gardien relevé d’OP03. Le mode ne lui rend pas sa garde : il le reclasse comme banc d’instruction. Ses phases mécaniques finales, son équipage et sa reddition restent ouverts dans la Bible ; le dossier ne les clôt pas.
- **Le Prétoire** conserve ses vrais pieds, son capteur supérieur et son verrou frontal. Le dossier invente seulement l’équipe de maintenance qui le présente, pas une variante du véhicule.
- **L’Automate** ne marche pas. C’est une contrainte du modèle, pas un choix de mise en scène : le treuil est la seule translation autorisée.
- **Le Guetteur-racine** est une ombre de reconstitution. Aucun spécimen n’est prélevé, aucune cellule morte n’est ajoutée, aucune territo­rialité complète n’est simulée.
- **Le Guetteur des Rives** reste un éclaireur qui observe, appelle une embuscade et se retire. Il ne devient jamais un bretteur lourd.
- **L’Aile-miroir** et le **Harponneige** sont des reconstitutions. Leurs comportements viennent du catalogue : plongée sur optique, frappe sous l’appui immobile. Ils ne sont pas inventés pour remplir un slot.
- **Le Décret** garde ses phases et ses pièces exposées. Le miroir « unité de réserve » est le même modèle, pas un nouveau véhicule ni une nouvelle fiche.

---

## 5. Le tournoi des Sept Appuis

**Huit combattants, élimination directe, deux manches gagnantes, trois marques par manche.**

### 5.1 Graines

| Graine | Combattant |
| ---: | --- |
| 1 | Décret |
| 2 | Cerbère |
| 3 | Prétoire |
| 4 | Guetteur des Rives |
| 5 | Automate |
| 6 | Guetteur-racine |
| 7 | Harponneige |
| 8 | Aile-miroir |

### 5.2 Bracket

- **Quart 1** : Décret / Aile-miroir
- **Quart 2** : Guetteur des Rives / Automate
- **Quart 3** : Prétoire / Guetteur-racine
- **Quart 4** : Cerbère / Harponneige
- **Demi-appui 1** : vainqueur quart 1 / vainqueur quart 2
- **Demi-appui 2** : vainqueur quart 3 / vainqueur quart 4
- **Septième Appui** : finale

### 5.3 Règles de tournoi

1. Le combattant choisi prend la graine de son camp ; les sept autres remplissent le bracket.
2. Le Décret entre comme premier appui. Le battre en quart ne donne aucun titre : le règlement prévoit qu’il revient en finale.
3. Une bête reconstituée ne peut pas remporter le titre : son ombre quitte le ring à la dernière marque et le titre reste vacant.
4. Le titre s’accompagne d’une marque gravée sur la pierre, jamais d’une exécution.
5. Le bracket est déterministe à graine identique : mêmes quarts, mêmes adversaires, mêmes commentaires d’archive.

### 5.4 Déblocage

Le Décret est verrouillé au départ. Il s’ouvre en gagnant le tournoi **ou** en classant trois dossiers d’histoire. Son dossier est le huitième et le seul à comporter huit duels.

---

## 6. Le mode Histoire

Chaque dossier suit la même structure, mais avec ses propres enjeux :

- **une introduction** : qui entre, pourquoi, et ce que le règlement ne prévoit pas ;
- **cinq épreuves** contre cinq autres combattants ;
- **un rival** : le miroir personnel du dossier ;
- **un gardien** : l’obstacle institutionnel ou matériel ;
- **sept adversaires à battre** (huit pour le Décret) ;
- **un épilogue** : une pièce d’archive, avec un titre, un texte et une phrase finale ;
- **une planche d’ouverture et une planche de fin** décrites dans les Chroniques.

### 6.1 Cerbère — *Le gardien relevé*

- **Introduction** : relevé après OP03, Cerbère attend une commission de démontage. Son équipage de relève l’inscrit au tournoi pour forcer un regard.
- **Adversaires : 7.** Automate, Harponneige, Aile-miroir, Guetteur des Rives, Guetteur-racine.
- **Rival** : le **Prétoire**, construit pour tenir les corridors que Cerbère gardait.
- **Gardien** : le **Décret**, qui rappelle que le titre se joue sous son règlement.
- **Épilogue — Tenir le centre d’un ring vide** : il gagne, n’est pas réinstallé, et devient banc d’instruction. Le sceau de l’unité est repeint au pochoir sur les noms de l’équipage. « Une garde sans ordre, ça s’appelle une école. »

### 6.2 Prétoire — *Le corridor vendu*

- **Introduction** : Orison veut vendre un contrat de contrôle de corridor après MI12. Une équipe de maintenance, pas des pilotes, suit un manuel.
- **Adversaires : 7.** Cerbère, Guetteur-racine, Aile-miroir, Harponneige, Décret.
- **Rival** : l’**Automate**, version d’atelier du même programme.
- **Gardien** : le **Guetteur des Rives**, sur un terrain où un corridor n’existe pas.
- **Épilogue — Démonstration conforme** : il gagne, Orison repeint la coque et retire les noms de l’équipe. Le corridor d’affectation reprend les mesures du ring. Personne ne demande ce qu’est devenu l’équipage.

### 6.3 Automate — *L’ordre de dégagement*

- **Introduction** : réarmé pour le tournoi sans consulter les mécaniciens qui l’ont réparé. Il ne marche pas ; un treuil le déplace.
- **Adversaires : 7.** Harponneige, Aile-miroir, Guetteur-racine, Cerbère, Guetteur des Rives.
- **Rival** : le **Prétoire**, la version propre du même programme.
- **Gardien** : le **Décret**, donneur d’ordre qui n’a jamais signé le constat.
- **Épilogue — Exécution conforme** : il gagne sans quitter son rail. Les mécaniciens refusent de signer le reçu. L’archive garde « exécution conforme ». Le jeu ne tranche pas s’il a gagné ou seulement obéi.

### 6.4 Guetteur-racine — *L’habitude sans la bête*

- **Introduction** : aucune capture. Le banc rejoue les enregistrements de MI09 dans une clairière projetée.
- **Adversaires : 7.** Décret, Harponneige, Cerbère, Guetteur des Rives, Prétoire.
- **Rival** : l’**Aile-miroir**, ce qui ne vient pas au sol.
- **Gardien** : l’**Automate**, l’engin qui ouvre les layons de Thyr.
- **Épilogue — Aucun spécimen prélevé** : l’ombre retourne sous les racines. Le rapport constate la reproduction du comportement, pas une victoire. Une seule empreinte reste dans la terre.

### 6.5 Guetteur des Rives — *Le regard qui recule*

- **Introduction** : la Ligue inscrit son éclaireur pour prouver qu’on peut gagner sans tenir le centre.
- **Adversaires : 7.** Cerbère, Automate, Guetteur-racine, Aile-miroir, Harponneige.
- **Rival** : le **Prétoire**, gardien de corridor.
- **Gardien** : le **Décret**, qui occupe tout l’espace où le guetteur pourrait être.
- **Épilogue — Le titre reste vacant** : il obtient sa troisième marque puis quitte le ring. Le règlement note un « refus de victoire ». Le miroir reste sur la septième pierre.

### 6.6 Aile-miroir — *La plongée sur optique*

- **Introduction** : reconstitution d’Ilex ; les lampes du canyon sont la gâchette. Le public peut les éteindre.
- **Adversaires : 7.** Cerbère, Prétoire, Automate, Guetteur des Rives, Harponneige.
- **Rival** : le **Guetteur-racine**, désaccord sur la verticale.
- **Gardien** : le **Décret**, couvert de lampes de commandement.
- **Épilogue — Dossier non concluant** : la plongée s’arrête au bord du vide, le modèle se répète. Le banc conserve l’échec au lieu d’inventer une bête.

### 6.7 Harponneige — *Ce qui frappe sous le pied*

- **Introduction** : reconstitution sur une écluse gelée de Sereis. Interdiction de tirer pour réchauffer le sol.
- **Adversaires : 7.** Aile-miroir, Automate, Guetteur-racine, Prétoire, Guetteur des Rives.
- **Rival** : **Cerbère**, la masse la plus immobile du ring.
- **Gardien** : le **Décret**, qui ne peut pas danser sur une plaque fine.
- **Épilogue — La glace cède avant le titre** : le protocole interrompt le duel. Aucun animal blessé, aucune machine détruite. Le titre n’est pas attribué.

### 6.8 Décret — *Le septième appui*

- **Introduction** : huit duels, dont un miroir contre l’unité de réserve. On ne joue pas le Décret pour une place : on le joue pour voir ce que le rite devient quand il est assez grand pour contenir la carrière.
- **Adversaires : 8.** Cerbère, Prétoire, Automate, Guetteur-racine, Guetteur des Rives, Aile-miroir.
- **Rival** : le **Harponneige**, seul terrain qui rend la masse vulnérable.
- **Gardien** : le **Décret de réserve**, même modèle, même institution.
- **Épilogue — Il n’y a pas eu de combat** : le contrat est signé avant la dernière marque ; la cérémonie est annulée faute de place. Le ring a été construit à l’échelle du croiseur.

---

## 7. Les illustrations à produire

**35 planches en six lots.** Le sous-menu **Chroniques** du jeu contient le brief complet de chacune : format, cadrage, lumière, interdits de canon, usage et statut. Le tableau ci-dessous en donne la direction et la priorité.

### 7.1 Visuel d’ouverture (1 planche)

| Id | Planche | Direction |
| --- | --- | --- |
| key-01 | **La carrière aux sept pierres** | Vue large à hauteur de coque, 16:9 2560 × 1440. Sept blocs en gradins, le quatrième marqué, le septième dans l’ombre. Huit silhouettes aux bords du cadre, jamais face à face. Aube ocre, poussière, longues ombres. Aucun logo, aucun titre, aucune foule armée. |

### 7.2 Portraits d’affrontement (8 planches, 1:1 1024)

Usage : sélection, bracket, cartes de duel. Même cadrage, même échelle de buste, même direction de lumière, pour que la grille reste lisible. Chaque portrait doit dire l’archétype sans légende.

| Id | Sujet | Détail qui porte le personnage |
| --- | --- | --- |
| por-CER | Cerbère | Trois solutions de tir visibles, aucune braquée vers le spectateur ; pochoir à moitié repeint ; câble de relevage à l’épaule. |
| por-PRE | Prétoire | Quadrupède bas de face, capteur et verrou distincts, badge Orison collé près d’un numéro gratté. |
| por-AUT | Automate | Sur son rail de treuil : chariot, câble, butée visibles ; canon séparé par un joint ; étiquette de lot contesté. |
| por-GUE | Guetteur-racine | Émerge à moitié des racines, deux appuis distincts, liseré de projection discret, aucun sang. |
| por-RIV | Guetteur des Rives | Miroir à hauteur d’épaule, relais dans l’autre main, corps déjà tourné vers la sortie. |
| por-AIL | Aile-miroir | Plongée, ailes ouvertes, tête vers une source hors cadre, une patte repliée, aucun harnais. |
| por-HAR | Harponneige | À ras de glace, corps partiellement sous la surface, un appui mécanique immobile au second plan. |
| por-DEC | Décret | Trop large pour le cadre : les épaules sortent de l’image. Relais sur le flanc, passerelle ouverte. |

### 7.3 Cartes d’ouverture (8 planches, 16:9 1920 × 1080)

Une carte par dossier, jouée avant la première épreuve. Elle installe le lieu, l’enjeu et l’absence de combat.

| Id | Carte | Direction |
| --- | --- | --- |
| intro-CER | La commission | Carrière à l’aube. Cerbère entre deux pierres, trois officiers à une table pliante, équipage en combinaison. Aucun affrontement. |
| intro-PRE | La démonstration | Cour d’Orthe. Bande peinte au sol, manuel déplié, représentant Orison qui filme, foule loin derrière une rambarde. |
| intro-AUT | Le treuil | Atelier en contre-plongée. Automate suspendu au-dessus du lot emballé, mécaniciens derrière une rambarde, câble en diagonale. |
| intro-GUE | La clairière projetée | Anneau de projecteurs, racines refermées, ombre basse entre deux colonnes, techniciens au premier plan. Aucune cage. |
| intro-RIV | Le miroir sur la digue | Pluie, miroir incliné vers une lampe, mât de relais, adversaire sous un auvent au loin. |
| intro-AIL | Les lampes du canyon | Nuit, parois de silice, file de lampes, aile déjà en l’air, sol du ring vide et luisant. |
| intro-HAR | L’écluse gelée | Plaque fissurée, repères de sécurité, forme sombre sous la surface, marcheur à l’arrêt sur la berge. |
| intro-DEC | La terrasse | Croiseur sur presque toute la largeur, sept pierres en escalier, officier montant la passerelle avec une mallette. |

### 7.4 Cartes de fin (8 planches, 16:9 1920 × 1080)

Une carte par épilogue, après le gardien. Elles doivent être **plus vides** que les cartes d’ouverture : la foule parte, les machines restent.

| Id | Carte | Direction |
| --- | --- | --- |
| end-CER | Tenir le centre d’un ring vide | Ring au matin, foule partie, Cerbère seul, un ouvrier au pochoir repeint les noms de l’équipage. |
| end-PRE | Démonstration conforme | Corridor identique au ring, machine repeinte à la marque Orison, plaque des noms au sol face contre terre. |
| end-AUT | Exécution conforme | Atelier vide, Automate seul sur son rail, lampe de balayage au-dessus d’une caisse ouverte, reçu non signé. |
| end-GUE | Aucun spécimen prélevé | Clairière rendue au silence, projecteurs éteints, une seule empreinte mécanique dans la terre. |
| end-RIV | Le titre vacant | Ring vide sous la pluie, miroir sur la septième pierre, foule qui sort, silhouette sur la digue. |
| end-AIL | Dossier non concluant | Canyon noir, une plongée figée sans sol visible, reflet incomplet dans la silice. |
| end-HAR | La glace cède avant le titre | Écluse fissurée, eau noire au centre, un appui isolé sur la rive, balises de sécurité. |
| end-DEC | Le titre signé | Carrière vide depuis la terrasse, formulaire et signature au premier plan, sept pierres désertes. |

### 7.5 Arènes (8 planches, 16:9 1920 × 1080)

Fonds jouables en couches : sol sans personnage, profondeur, particules. Les reflets et la poussière ne doivent jamais créer de fausses surfaces physiques.

| Id | Arène | Point de fabrication |
| --- | --- | --- |
| are-quarry | Carrière des Cendres | Sept pierres différenciées par la taille, pas par un chiffre peint. Scories, gradins, poussière. |
| are-court | Cour des Appuis | Dallage poli, rambarde proche, tribune, façade coupée. Aucun emblème lisible. |
| are-workshop | Atelier des Mains noires | Pont roulant, rail de treuil, cuves, caisse contestée. Câble visible et attaché. |
| are-grove | Clairière des racines | Colonnes vivantes, racines porteuses lisibles comme appuis, anneau de projecteurs, sous-bois. |
| are-dike | Digue des Deux-Rives | Béton mouillé, repères de marée, lampes de quai, flaques. Deux états de marée. |
| are-canyon | Canyon des reflets | Parois de silice, lampes alignées, sol luisant, vide au fond. Réflexions hors plan de collision. |
| are-lock | Glace de l’Écluse | Rive de sel, balises, fissures sous la surface. États intact et fissuré, sans sang. |
| are-terrace | Terrasse du Décret | Sept pierres en escalier, ville lointaine, passerelle au premier plan. Cadrage large pour le croiseur. |

### 7.6 Emblème et bracket (2 planches)

| Id | Planche | Direction |
| --- | --- | --- |
| emb-01 | Emblème du Septième Appui | Sept pierres en escalier, la septième plus large, une marque d’appui gravée. Lisible à 32 px. Aucun aigle, aucun chiffre de corps. |
| emb-02 | Fond de bracket | Carrière en légère plongée, sept pierres en colonne, espaces vides pour les portraits. Très désaturé. |

### 7.7 Règles de fabrication des images

- **Format et provenance.** Chaque planche indique son format, son usage et son statut. Une planche livrée ne passe pas à « Vérifié » sans inspection en jeu.
- **Pas de texte dans l’image.** Les titres, noms et chiffres sont posés par l’interface.
- **Pas d’interface dans l’image.** Aucun HUD, aucun curseur, aucun cadre de sélection.
- **Cohérence de monde.** Les matières, palettes et lumières suivent `docs/ART_DIRECTION.md`. Une arène de Nacre reste mouillée ; Kharon reste chaud ; Sereis reste froid.
- **Canon.** Aucun cadavre, aucun sang, aucun trophée, aucun animal capturé. Les bêtes sont des ombres avec un liseré de reconstitution discret.
- **Silhouettes avant décoration.** Chaque combattant doit être identifiable en noir et blanc, à la taille d’une vignette de bracket.

---

## 8. Ce qui est livré dans le prototype

### 8.1 Fichiers

- `src/arena.mjs` — données du mode : sous-menus, règlement, arènes, roster, tournoi, huit dossiers d’histoire, 35 briefs d’illustration.
- `src/arena-ui.mjs` — rendu HTML des quatre sous-menus, sans DOM global et sans simulation.
- `src/main.mjs` — entrée **Affrontements**, état local des onglets et délégation des clics.
- `index.html` — bouton de navigation et section `view-arena`.
- `src/style.css` — mise en page du menu, du bracket, des dossiers, des chroniques et du règlement.
- `tests/arena.test.mjs` — cohérence du roster, des dossiers, du bracket et des planches.
- `tools/test-ui.mjs` — la liste des vues accepte désormais `arena`.

### 8.2 Ce qui n’est pas livré

- Le duel 1 contre 1 et son IA de ring.
- Les arènes jouables, les collisions de ring et les règles de marque en simulation.
- Le bracket interactif avec résultats et reprise.
- Le déblocage du Décret et la sauvegarde des titres.
- Les 35 illustrations.
- Les portraits, voix, sons et transitions du mode.

### 8.3 Garde-fous respectés

- Aucune fiche ni ID de Bible ajouté ; les compteurs 1 007 / 21 onglets / 133 critères restent stables.
- Aucun champ ajouté au dossier de campagne v14.
- Aucun réseau dans le jeu autonome.
- Le menu est navigable au clavier et respecte les focus visibles.
- Le bouton de lancement annonce l’absence de simulation au lieu de simuler une victoire.

---

## 9. Prochaine tranche recommandée

1. **Duel d’appui prototype** : un ring, un adversaire, trois marques, aucune campagne modifiée. Réutiliser la marche, la chaleur, l’ancrage et la purge existants.
2. **Deux combattants seulement** : Cerbère et le Prétoire, pour valider la lecture des appuis et la caméra de ring.
3. **Une arène** : la Carrière des Cendres, avec les sept pierres et les scories.
4. **Un dossier complet** : Cerbère, de l’introduction à l’épilogue, avec ses sept duels et son gardien.
5. **Les portraits et la carte d’ouverture de Cerbère** avant toute multiplication d’assets.
6. **Réception** : simulation, DOM modélisé, navigateur, puis essai humain. Une scène Canvas ne vaut pas une session de ring.

Le mode ne doit pas grandir en largeur avant d’avoir prouvé un duel lisible. Un tournoi de huit combattants sans un seul duel juste n’est qu’un bracket décoré.
