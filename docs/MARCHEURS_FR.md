# ORDRE DE CENDRE — Répertoire des appuis

**Huit châssis conçus · WK14 Sentinelle pilotable**

Ce répertoire ajoute huit marcheurs au corps expéditionnaire. Ils reprennent les **archétypes classiques des marcheurs de guerre** (éclaireur découvert, patrouilleur de blocage, transport blindé, batterie mobile, etc.) pour leur **apparence et leur fonctionnement**, sans copier une franchise : noms, coques, récits et silhouettes restent propres au projet, comme l’exige la direction artistique.

Les huit silhouettes du répertoire sont des **dessins de conception générés** dans le jeu (`src/walker-corps.mjs`). Depuis la tranche Sentinelle, la S-3 (WK14) est **pilotable** : géométrie de production, contacts de pieds simulés et assignation au départ. Les sept autres restent des silhouettes de conception : elles ne marchent pas, ne tirent pas et ne se sauvegardent pas.

## 1. Ce que le répertoire apporte

| Besoin | Châssis | Ce qu’il change dans une sortie |
| --- | --- | --- |
| Voir sans être vu longtemps | Chacal | Renseigne, marque, rompt le contact ; ne tient aucun secteur. |
| Tenir un point | Sentinelle | Occupe carrefours, ponts et quais ; paie ses genoux exposés. |
| Surveiller un axe | Cormoran | Voit très loin, désigne pour la batterie, ne peut pas se masquer. |
| Porter une section | Bison | Douze places, blindage de proue, lenteur et ventre vulnérable. |
| Prendre un angle mort | Tisserand | Se plaque sous les lignes de tir et frappe par le bas. |
| Battre un point fixe | Baliste | S’installe, plante sa bêche, exige trois minutes de calme. |
| Ouvrir une position | Broyeur | Charge, brise, maintient la brèche ; dos aveugle. |
| Franchir chargé | Mulet | Six appuis, huit places, treuil ; tolère la marche dégradée. |

## 2. Les huit fiches

### WK13 · CH-8 Chacal — éclaireur de proximité
2 appuis · 4,8 m · 8 t · 1 pilote à découvert · mitrailleuse J-9.
Poste ouvert sur deux longues échasses. Il précède la colonne, marque les appuis douteux et décroche à la première arme lourde. Sa valeur est le renseignement transmis.
*Archétype de référence :* éclaireur bipède découvert (type AT-RT).

### WK14 · S-3 Sentinelle — patrouilleur de blocage
2 appuis · 8,6 m · 21 t · 2 pilotes · double canon de menton.
La machine de contrôle la plus répandue. Elle avance par bonds courts, s’arrête pour tirer, reprend son secteur. Genoux et chevilles découverts.
*Archétype de référence :* marcheur de patrouille bipède (type AT-ST).
**État : pilotable.** Assignable depuis le Hangar avant une sortie. Deux appuis réels à ±52 unités, coque de 70 unités, canon de menton à 92 unités. Aucun atlas peint : le rendu emploie ses pièces vectorielles de production.

### WK15 · C-11 Cormoran — veilleur de corridor
2 appuis · 11,4 m · 18 t · 2 pilotes · canon long et marqueur de cible.
Tête étroite au bout d’un long fût. Travaille en hauteur et en retrait, marque puis laisse la batterie conclure. Transfert de masse interminable.
*Archétype de référence :* marcheur de surveillance très haut (type AT-DP).

### WK16 · B-30 Bison — transport blindé
4 appuis · 14,2 m · 96 t · 3 servants + 12 passagers · quadruple canon de proue et tourelles de flanc.
Soute blindée sur quatre piliers, tête basse. Il choisit son axe, l’annonce par son pas, et écrase ce qui reste dessous. Vulnérable sous le ventre et aux articulations.
*Archétype de référence :* transport blindé quadrupède (type AT-AT).

### WK17 · T-4 Tisserand — assaut rampant
4 appuis · 5,6 m · 26 t · 1 pilote en capsule · éclateur court et charges de démolition.
Capsule ventrue sur pattes obliques, sous hauteur de muret. Il contourne, se plaque, attend, puis frappe par le bas. Doit s’immobiliser pour viser.
*Archétype de référence :* marcheur d’assaut quadrupède bas (type araignée).

### WK18 · BL-9 Baliste — batterie mobile
4 appuis · 7,8 m · 44 t · 3 servants · fauconneau dorsal et roquettes de saturation.
Affût sur quatre jambes courtes, fauconneau vers le ciel, bêche qui mord le sol. Se déplace pour changer de ligne de tir, jamais pour esquiver.
*Archétype de référence :* marcheur d’artillerie quadrupède à bêche (type AT-AP).

### WK19 · BR-2 Broyeur — briseur de ligne
4 appuis · 10,2 m · 78 t · 2 pilotes · double automatique lourd et bélier d’épaule.
Épaules hautes, avant blindé, pattes antérieures épaisses : dessiné pour tomber vers l’avant. Cherche le contact, pas l’échange de tirs. Dos aveugle, demi-tour très long.
*Archétype de référence :* marcheur de siège quadrupède à avant massif (type AT-M6).

### WK20 · MU-6 Mulet — porteur de section
6 appuis · 9,4 m · 64 t · 2 pilotes + 8 passagers · canon de toit et treuil.
Six pattes courtes sous une coque allongée. Le seul du répertoire à franchir une pente chargée et repartir sans aide. Tourelle exposée, large sur un quai étroit.
*Archétype de référence :* porteur d’assaut hexapode (type AT-TE).

## 3. Fonctionnement commun

Les huit machines partagent la grammaire du projet : joints lisibles, plaques remplaçables, vérins protégés, cabine identifiable, maintenance standard. Leur différence ne vient pas du nombre de pieds dessinés mais du **centre de masse** :

- **avant massif** (Bison, Broyeur) : contact et rupture, demi-tour coûteux ;
- **masse haute** (Cormoran, Sentinelle) : observation, stabilité précaire ;
- **masse basse rayonnante** (Tisserand, Baliste) : angles morts, installation ;
- **masse répartie** (Mulet, Chacal) : franchissement et cadence.

Chaque fiche indique la décision qu’il favorise et le coût qu’il impose. Aucun ne rend un châssis existant inutile.

## 4. Illustrations à produire

Huit portraits (AW13–AW20) et une planche comparée. Les briefs complets figurent dans chaque fiche et dans le répertoire du Hangar ; le format visé est celui de la direction artistique : peinture militaire, échelle donnée par une silhouette humaine, matière et usage lisibles.

| ID | Sujet | Point de lecture attendu |
| --- | --- | --- |
| AW13 | Chacal, trois quarts avant | Poste ouvert, pilote exposé, harnais. |
| AW14 | Sentinelle à un carrefour | Deux visées, canon de menton, foule maintenue à distance. |
| AW15 | Cormoran sur un viaduc | Hauteur, appui unique, câbles au premier plan. |
| AW16 | Bison écrasant une barricade | Soute ouverte, section qui embarque, échelle. |
| AW17 | Tisserand accroché à un quai | Quatre pattes ancrées, menace cherchée au-dessus. |
| AW18 | Baliste en batterie | Fauconneau incliné, bêche plantée, serviteurs. |
| AW19 | Broyeur dans une palissade | Bélier d’épaule, mouvement, éclats. |
| AW20 | Mulet sur une passerelle | Six appuis sur deux niveaux, treuil tendu, houle. |
| AW21 | Planche comparée des huit | Même échelle, même sol, hiérarchie des masses. |

## 5. Intégration et limites

- **Livré :** données des huit châssis, silhouettes vectorielles de conception, filtres par nombre d’appuis, dossier détaillé et briefs d’illustration dans le Hangar.
- **Pilotable :** WK14 Sentinelle — lot de production propre (`assets/production/sentinelle/`, 34 fichiers et manifeste d’empreintes), contacts réels issus de la simulation, assignation au départ, migration de parc additive et tests dédiés. Aucun atlas peint.
- **Conçu seulement pour les sept autres :** marche simulée, équilibrage, dégâts par composant, atlas peints, animation et assignation au départ.
- **Intact :** les six profils peints (WK01, WK02, WK05, WK06, WK09, WK10) et leur lot 0.9, la sauvegarde v14, les 1 007 IDs et les 21 onglets de Bible, la campagne MI01–MI14.
- Le répertoire ne crée aucune fiche de Bible et ne modifie aucun statut existant : « Conçu » reste distinct de « Prototype » et de « Vérifié ».

## 6. Épreuves de châssis

Chaque châssis reçoit une épreuve conçue, décrite dans [EPREUVES_CHASSIS.md](EPREUVES_CHASSIS.md) : vitesse sans blindage pour le Chacal, tenue de carrefour pour la Sentinelle, marquage haut pour le Cormoran, soute et chaleur pour le Bison, tir indirect pour la Baliste, bélier de seuil pour le Broyeur et charge variable sur rampe pour le Mulet.

**WK17 Tisserand — La paroi des Tisserands** est l’épreuve verticale : une falaise de silice de deux cent dix mètres, quatre appuis rayonnants, trois postures (croix, plaque, rampe), des prises qui cèdent, un jet de caloporteur et un grappin qui coupe les ancrages. La descente est un second parcours. Rien de tout cela n’est simulé : le Tisserand reste conçu, sans marche, sans contact vertical et sans assignation.

## 7. Tranches suivantes

La Sentinelle a servi de premier passage : elle prouve qu’un châssis du répertoire peut recevoir une géométrie de production, des contacts réels et une assignation sans réécrire les six profils peints ni les fixtures historiques.

1. **Atlas peint WK14** : les seize cellules habituelles (coque, tourelle, segments, genou, semelle, radiateur) et leurs ancres mesurées, pour remplacer le repli vectoriel sans changer les contacts.
2. **Portraits AW13–AW21** : la direction artistique attend les planches avant toute multiplication d’assets.
3. **Châssis suivant** : le Chacal (WK13) partage le rig bipède et peut réutiliser la même chaîne de production ; le Bison et le Mulet demandent d’abord des variantes à quatre et six appuis.

Chaque passage reste une tranche à part entière : géométrie, lot d’assets, contacts, assignation, migration additive et tests.
