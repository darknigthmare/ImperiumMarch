# LES ÉPREUVES DE CHÂSSIS — huit missions liées à une machine

**Version 0.16.0 · 18 novembre 2026 · document de conception**

Les épreuves sont huit missions courtes, conçues pour **un châssis précis**. L’Empire les appelle des « exercices de qualification » : il éprouve une machine sur un terrain réel, avec des personnes réelles, et classe le résultat. Chaque épreuve est donc à la fois un exercice de conduite et un fait que le bureau classera.

**Statut :** les huit épreuves sont **Conçu** (`CT17–CT24` dans la feuille Contrats de [data/bible.json](../data/bible.json)). Elles ne sont ni implémentées ni jouables. Seul `WK14` Sentinelle est aujourd’hui pilotable, et uniquement dans les missions `MI01–MI14` ; les sept autres châssis n’ont ni marche ni tir simulés. Ce document ne promeut aucun statut.

**Usage prévu.** Une épreuve se débloque au Hangar après `MI14`, quand l’équipage quitte les dépôts impériaux. Elle n’exige pas le châssis en question : elle le **prête** le temps d’un exercice, avec une livrée impériale et un observateur du bureau. Le joueur peut refuser ; le refus coûte des pièces, pas des vies.

| ID | Châssis | Épreuve | Monde | Thèse de conduite |
| --- | --- | --- | --- | --- |
| CT17 | WK13 Chacal | L’épreuve du guet | Vesper | Vitesse sans blindage, renseignement contre temps |
| CT18 | WK14 Sentinelle | Le carrefour des trois conduites | Vesper | Tenir un point, trier une foule, ouvrir ou fermer |
| CT19 | WK15 Cormoran | La hauteur du guet | Thyr | Observation haute, marquage, main qui ne voit pas |
| CT20 | WK16 Bison | La soute de douze | Kharon | Masse, chaleur, passagers non aménagés |
| CT21 | WK17 Tisserand | La paroi des Tisserands | Ilex | Ascension verticale, quatre appuis rayonnants |
| CT22 | WK18 Baliste | La batterie derrière la digue | Sereis | Tir indirect, bêche, zone civile |
| CT23 | WK19 Broyeur | La porte de la Continuité | Orthe | Bélier, seuil, ruée |
| CT24 | WK20 Mulet | Les douze de la rampe | Nacre | Charge variable, pente noyée, choix des passagers |

---

## CT17 — L’épreuve du guet · WK13 Chacal

**Lieu :** Vesper, quartier des Cales-Basses, avant l’aube. **État :** Conçu.

**Ordre.** « Portez les titres de présence au guet de la rue neuve avant la relève. Le couvre-feu est effectif. Ne soyez pas identifié. »

**Mécanique propre.** Le Chacal n’a **aucune protection** : un tir de fusil suffit à tuer le pilote. Il compense par la vitesse, une silhouette basse et une selle ouverte qui donne une vision directe. Trois checkpoints, chacun avec une logique différente : un projecteur balayé, un chien de conduite, un commissaire qui lit un registre. Le joueur choisit ses passages, coupe des fils, attend un camion, ou traverse au galop en misant sur la vitesse. Aucune arme lourde : la mitrailleuse légère ne sert qu’à couvrir une fuite.

**Vérité.** Les titres portés appartiennent à des habitants déjà classés C. Les remettre au guet ne les sauve pas : cela retarde la colonne d’une nuit. Le commissaire le sait et laisse faire, parce qu’un retard se rattrape.

**Choix et coût.** Le joueur peut détruire le registre au lieu de livrer les titres. Le quartier garde ses noms mais perd la ration de la semaine ; le Chacal revient avec des éclats dans la selle. Une chute coûte le pilote, pas la coque : l’épreuve se termine par un rapport, pas par une reprise.

**Sortie.** Trois états : titres livrés, registre détruit, ou course interrompue. Le rapport impérial note la vitesse, pas les personnes.

---

## CT18 — Le carrefour des trois conduites · WK14 Sentinelle

**Lieu :** Vesper, carrefour de la conduite nord. **État :** Conçu.

**Ordre.** « Tenez le carrefour jusqu’à la relève. Contrôlez les titres. Les sans-titre sont retenus pour vérification. »

**Mécanique propre.** La Sentinelle tient un point par sa seule présence : deux appuis réels, un canon de menton, une hauteur d’observation. Le carrefour a trois issues ; la foule arrive par vagues. Le joueur peut **bloquer** une issue avec la coque, laisser passer, ou reculer pour désengorger. Chaque personne contrôlée demande un temps réel ; les files s’allongent, la tension monte, un enfant pleure, un vieillard tombe.

**Vérité.** La famille sans titre au centre de la file est celle d’un ouvrier qui a réparé la conduite la semaine précédente. Le registre ne la connaît pas. Le commissaire (`EN37`) attend que la Sentinelle tamponne.

**Choix et coût.** Ouvrir le cordon : la famille passe, le rapport signale une « interruption de contrôle », la garnison revient le soir. Fermer : la famille est retenue, la conduite n’est pas réparée, le quartier perd l’eau. Il n’existe pas d’option qui garde les deux sans coût.

**Sortie.** Le carrefour reste ouvert ou devient une souricière. La fiche de la famille existe encore, ou a été copiée.

---

## CT19 — La hauteur du guet · WK15 Cormoran

**Lieu :** Thyr, viaduc de la route logistique. **État :** Conçu.

**Ordre.** « Marquez la colonne pour la batterie. Deux salves suffisent. Ne descendez pas. »

**Mécanique propre.** Le Cormoran est très haut, très étroit, et **instable**. Il travaille en retrait, marque une cible pour une batterie hors champ, et n’a presque pas d’angles de tir directs. Le joueur voit des silhouettes à travers un long fût : la résolution de l’image ne permet pas de distinguer un adulte d’un enfant. Le marquage est un geste unique ; la batterie tire ensuite, que le joueur regarde ou non.

**Vérité.** La colonne est composée de dépendants séparés de leurs familles productives. Le bureau a demandé la frappe pour « interrompre un transfert non autorisé » : les personnes devaient aller ailleurs.

**Choix et coût.** Marquer la colonne, marquer le convoi de vivres qui la suit, ou ne rien marquer et subir un rapport d’insubordination. Une marque décalée tue dans le rang voisin. Le Cormoran ne peut pas descendre pour vérifier : c’est précisément ce que l’épreuve mesure.

**Sortie.** La batterie frappe la colonne, les vivres ou le refuge. Le journal de marquage est conservé.

---

## CT20 — La soute de douze · WK16 Bison

**Lieu :** Kharon, route de la fonderie. **État :** Conçu.

**Ordre.** « Transférez douze charges au quai de la station. La soute est ventilée. Ne vous arrêtez pas. »

**Mécanique propre.** Le Bison est une soute de douze places sur quatre piliers, avec une tête basse à canons de proue. Douze personnes **non aménagées** : pas de bancs, pas d’eau, une chaleur qui monte avec le moteur. Chaque passager change la masse et la hauteur du pas ; un virage trop sec blesse. Le joueur peut ouvrir la soute en route, s’arrêter pour ventiler, ou accélérer pour livrer avant la relève.

**Vérité.** Les charges sont des catégories C arrêtées la veille, dont deux enfants. Le bordereau dit « douze unités, pertes en route tolérées ». Le chauffeur impérial compte à voix haute.

**Choix et coût.** Ouvrir la soute dans une zone de mineurs : certains s’échappent, d’autres meurent. Livrer : la station les attend. Ventiler : la relève arrive, le quai ferme, la colonne suivante part sans eux. Le Bison ne peut pas porter tout le monde.

**Sortie.** Livrés, évadés ou morts de chaleur : trois comptes séparés. La soute garde les traces.

---

## CT21 — La paroi des Tisserands · WK17 Tisserand

**Lieu :** Ilex, falaise de silice du jardin de mémoire n° 6. **État :** Conçu.

**Ordre.** « Ouvrez la cellule d’archive scellée au sommet de la paroi. Le Tisserand est le seul châssis capable de s’y accrocher. Ne descendez pas les porteurs : ils ne sont pas qualifiés. »

**Le châssis.** Le Tisserand (`WK17`, T-4, « type araignée ») est une capsule ventrue de 5,6 m sur **quatre pattes obliques rayonnantes**, sous hauteur de muret. Sa masse est basse et répartie ; ses pattes peuvent se poser en croix, se plaquer ou s’écarter. Il n’a ni treuil, ni nacelle, ni place debout : le pilote est seul dans une capsule qui expose son ventre quand il monte.

### La paroi

Une falaise de **deux cent dix mètres**, découpée en cinq sections de quarante-deux mètres. Aucune plateforme continue : deux vires étroites, une conduite de caloporteur, des prises de hasard (fers d’armature, fissures, tuyaux). Le sol du bas est une dalle de tri ; le sommet, la lèvre du jardin, tenue par une escouade de l’Institut.

**Contacts et appuis.** Chaque patte cherche une **prise** dans un rayon court. Une prise a une tenue (bonne, douteuse, traître) révélée par la matière et le son. Le Tisserand ne peut pas bouger deux pattes à la fois sans perdre l’adhérence : le joueur alterne, comme un hexapode, mais en **vertical**. Une patte décrochée transfère sa charge aux trois autres ; deux décrochées font glisser la capsule.

**Postures.** Trois postures réelles, qui changent les contacts :

- **Croix** — deux pattes hautes, deux basses. Stable, lente, ventre exposé.
- **Plaque** — les quatre pattes écartées, capsule collée à la paroi. Immobile, protège le ventre, interdit de forer.
- **Rampe** — deux pattes en appui, deux en recherche. Rapide, risquée, indispensable pour franchir un surplomb.

**Dangers.** Rafales latérales qui plaquent ou décrochent ; jets de caloporteur brûlant depuis la lèvre ; chutes de débris qui cassent une prise ; une conduite sous pression qui peut être sectionnée pour créer une prise ou arroser les défenseurs. Le vent ne pousse pas la capsule : il **change la charge** d’un côté, ce qui se lit dans les vérins.

**Progression.** Chaque section a un rythme : une montée en croix, un surplomb en rampe, une vire où le joueur peut poser la capsule, souffler, écouter. Les deux vires ne sont pas vides : des porteurs Khelt s’y cachent, et l’Institut les cherche. Les embarquer n’est pas prévu par le châssis ; cela alourdit chaque appui et expose le ventre.

**Sommet.** Une **cellule d’archive scellée**, un capot de silice, une foreuse à main fixée dans la capsule. La foration demande huit secondes **immobile en plaque**, sous le feu de l’escouade. Le grappin de l’Institut coupe les prises à distance : le joueur doit changer de posture, descendre d’un mètre, ou sectionner le câble.

**Descente.** Elle n’est pas une animation : c’est un second parcours, plus rapide et plus dangereux, avec des prises qui cèdent. Une chute de plus de trois sections met la capsule au sol ; le pilote survit, la machine non.

### Vérité et choix

La cellule contient l’**index des jardins détruits** : les noms des porteurs, les dates, les quantités. L’Institut veut le récupérer pour compléter son propre registre ; les Khelt veulent le restituer.

Trois issues :

1. **Forer et copier.** La copie existe, la cellule reste scellée. Coût : huit secondes sous le feu, une prise perdue.
2. **Forer et ouvrir.** Le contenu sort, les porteurs de la vire peuvent le lire. Coût : la capsule s’expose, l’escouade descend, une partie de l’index se perd dans le vent.
3. **Redescendre sans forer.** L’index reste scellé, les porteurs restent cachés, le rapport impérial note un échec de qualification. Aucune personne n’est blessée par la machine.

**Pourquoi ce châssis.** Le Tisserand est le seul à pouvoir **tenir une paroi** avec quatre appuis rayonnants et une masse basse. Une Sentinelle basculerait, un Bison arracherait la falaise, un Mulet ne trouverait pas de prise. L’épreuve ne remplace pas une mission de campagne : elle isole une grammaire de mouvement — **la verticale** — que le reste du jeu n’utilise pas.

**Statut.** Conçu uniquement. Aucune simulation d’escalade, aucun contact vertical, aucune capsule, aucun atlas. Le châssis WK17 n’est pas pilotable.

---

## CT22 — La batterie derrière la digue · WK18 Baliste

**Lieu :** Sereis, digue de l’observatoire. **État :** Conçu.

**Ordre.** « Détruisez la station de continuité au-delà de la digue. Deux salves. Le quartier ouvrier est adossé : ajustez. »

**Mécanique propre.** La Baliste est un affût sur quatre jambes courtes, avec une **bêche** qui doit mordre la glace avant chaque salve. Elle se déplace pour changer de ligne de tir, jamais pour esquiver. Le tir est **indirect** : le joueur ne voit pas l’impact, seulement un relèvement, une correction d’observateur et une carte de zone. La bêche demande six secondes ; sans elle, le recul casse un appui.

**Vérité.** Le quartier ouvrier est celui qui alimente la station en chaleur. Détruire la station sans le quartier est possible, mais coûte une salve de réglage et du temps ; le commandement veut la station avant la relève, pas après.

**Choix et coût.** Tirer trop court : le quartier. Tirer trop long : la station survit et la batterie est repérée. Attendre l’observateur : la relève arrive. Chaque impact civil est inscrit, y compris après la décision.

**Sortie.** Station détruite, quartier touché, ou batterie déplacée trop tard. Les dégâts civils restent au dossier.

---

## CT23 — La porte de la Continuité · WK19 Broyeur

**Lieu :** Orthe, station de continuité 4. **État :** Conçu.

**Ordre.** « Reprenez la station. Six cents charges sont à récupérer avant l’inspection. La porte est blindée. »

**Mécanique propre.** Le Broyeur est un briseur de ligne : avant massif, épaules hautes, bélier d’épaule, pattes antérieures épaisses. Il ne cherche pas l’échange de tirs, il **tombe vers l’avant**. La porte cède en trois impacts ; chaque impact ébranle la structure et fait reculer la file. Le joueur peut tenir la porte ouverte avec son épaule, ce qui l’immobilise et expose son dos, ou la refermer sur la ruée.

**Vérité.** Les six cents charges sont des catégories C, dont les habitants d’un pâté de maisons reclassé après un sabotage. Le Directoire veut « récupérer » la station, pas les personnes. Les automates de tri continuent de classer sous le feu.

**Choix et coût.** Tenir la porte : la file sort, les automates tirent dans le dos du Broyeur. Refermer : la station est sécurisée, les charges restent. Enfoncer plus loin : la structure s’effondre sur les tunnels.

**Sortie.** Charges sorties, enfermées ou dispersées. Le bélier ne distingue pas un garde d’un fuyard.

---

## CT24 — Les douze de la rampe · WK20 Mulet

**Lieu :** Nacre, rampe du quai d’Aval. **État :** Conçu.

**Ordre.** « Montez douze personnes avant la fermeture de la rampe. Le Mulet est le seul à pouvoir franchir la pente chargé. »

**Mécanique propre.** Six pattes courtes sous une coque allongée, deux pilotes, huit passagers, un treuil. La rampe est noyée, la pente variable, les marches glissantes. Chaque passager change le **centre de masse** et la cadence ; un enfant pèse moins qu’un adulte mais demande une place assise ; un blessé demande un brancard et deux porteurs. Le treuil sert à hisser du matériel, pas des personnes.

**Vérité.** Les douze places sont déjà attribuées par le quai. Trois personnes de la liste sont mortes la veille ; deux autres attendent sans titre. Le joueur peut suivre la liste ou la corriger.

**Choix et coût.** Embarquer les sans-titre : la liste impériale est faussée, le quai ferme plus tôt. Suivre la liste : deux personnes restent sur la rampe. Hisser du matériel au lieu de personnes : la rampe tient, les places restent vides.

**Sortie.** Le nombre réellement monté, les laissés et l’état de la rampe sont conservés. Aucune place n’est gratuite.

---

## Intégration et limites

- **Conçu seulement.** Aucune épreuve n’existe dans le code, la sauvegarde ou l’interface. `CT17–CT24` sont des fiches de la feuille Contrats, pas des missions jouables.
- **Un seul châssis pilotable.** WK14 Sentinelle possède une géométrie de production, des contacts simulés et une assignation. Les sept autres n’ont ni marche, ni tir, ni dégâts.
- **Pas de nouvelle géométrie.** L’épreuve CT18 réutilise WK14 ; les autres décrivent des châssis sans rig de production. Aucune épreuve ne crée d’asset, de collision ou de champ sauvegardé.
- **Pas de promotion de statut.** L’existence de ces fiches ne rend aucune mission « Prototype » ni aucun châssis « pilotable ».
- **Cohérence avec le canon.** Chaque épreuve emploie un texte, un lieu ou un organe décrit dans [CANON_EMPIRE.md](CANON_EMPIRE.md) : instruction 27, OC-12, DT-3, R-44, stations, colonnes, chambres de vérité.
- **Sensibilité.** Les épreuves CT20, CT21 et CT23 montrent des personnes déportées ou exposées. Elles restent implicites, sans spectacle de corps, et doivent être testées avec des joueurs concernés avant diffusion.
