# MI14 — Les mains noires

**Version 0.15.0 · Kharon · Acte II · Prototype jouable**

MI14 s’ouvre après le premier rapport de MI13. Holt ordonne de remettre au travail un atelier jugé indispensable à l’effort de guerre. Les ouvriers ont arrêté la chaîne parce qu’ils refusent d’expédier un lot saboté. Le refroidisseur est en panne et l’automate de sécurité traite le piquet comme une intrusion.

Le joueur doit agir dans cet espace occupé : obtenir un passage, préserver les personnes sous les pieds de son marcheur, neutraliser la machine, examiner les pièces et remettre le circuit de froid en état. Il choisit ensuite de relancer l’atelier ou de maintenir son arrêt. La sélection d’une réponse ne réalise aucune de ces opérations à sa place.

## Personnes et héritage

La sortie possède **huit ouvriers locaux**, dont **deux mécaniciens**. **Trois sont des déplacés de Nacre arrivés avant le recensement connu**. Ils ne sont pas des passagers, patients ou habitants repris des missions MI05 à MI08. Leurs identités et leurs pertes appartiennent à l’atelier, sans transfert ni résurrection dans les dossiers antérieurs.

MI14 lit le dossier réel de MI13. L’existence de PT03 permet un recoupement avec la série industrielle déjà conservée. Une absence de PT03 reste une absence : le registre local ne recrée ni les marquages ni le bordereau perdus dans la mission précédente. Aucune nouvelle preuve PT, TE ou PO n’est attribuée dans cette sortie.

## Parcours

| Étape | Action et durée | Ce qui est conservé |
| --- | --- | --- |
| Piquet | Demander un passage sous ancrage pendant **3 s**, puis attendre le déplacement des ouvriers | Demande accomplie, départ et arrivée de chaque personne à la galerie, pertes éventuelles |
| Explication | Achever un contact de **4 s** avec les ouvriers | Explication effectivement recueillie, distincte de la copie du registre |
| Sécurité | Approcher de l’atelier ; l’automate s’active après **5 s** d’alerte | Déclenchement, activation et neutralisation physique |
| Refroidisseur | Inspecter **3 s**, isoler la vanne **4 s**, réparer **8 s** | Diagnostic, isolation, réparation et état matériel de chaque organe |
| Lot | Copier le registre pendant **4 s** | Copie embarquée du constat local ; aucune source inventée après destruction |
| Ordre | Choisir le redémarrage ou le maintien de l’arrêt | Une consigne, sans action automatique sur l’atelier |
| Commande | Accomplir **5 s** de travail sur la commande matérielle | Redémarrage ou maintien exécuté ; une commande perdue reste une issue dégradée |
| Coopération | Après résolution des opérations, clore l’échange pendant **3 s**, même si aucun accord n’est possible | Accord seulement après arrêt maintenu, froid réparé, paroles recueillies et mécanicien vivant à la galerie ; sinon refus ou absence consignés |
| Rapport | Transmettre pendant **3 s**, puis rejoindre l’extraction | Faits et pertes de la sortie, premier rapport et dotation unique |

Les travaux demandent la portée et l’ancrage prévus par la simulation. Un déplacement interrompt l’opération ; il ne fait pas apparaître son résultat. La pause suspend la même horloge que le déplacement des personnes, le travail et l’alerte. Reprendre une sauvegarde doit retrouver cet état exact.

### Traverser le piquet

Le passage est une opération de pilotage. Les ouvriers gagnent physiquement une galerie hors des appuis ; une réponse au dialogue ne les téléporte pas. Le marcheur conserve ses vrais pieds et ses risques d’écrasement. Le tir, les explosions et les appuis peuvent aussi tuer des ouvriers après le passage : une arrivée passée ne leur confère pas une invulnérabilité fictive sur le site.

Les six châssis disponibles gardent leur locomotion propre. Le parcours sûr consiste à demander le passage puis à attendre que l’espace soit libre. La précision des appuis permet de traverser, mais le bilan n’efface pas un accident déjà survenu.

### Neutraliser l’automate

L’approche déclenche une alerte lisible. Avant les cinq secondes d’activation, l’automate n’est pas une cible active et n’exerce pas d’action hostile. Son arrivée réelle ouvre le combat. Le dessin, la visée, les projectiles et les dégâts doivent décrire le même état.

Neutraliser la sécurité ne résout ni le refroidissement ni la grève. Les sources et les ouvriers restent exposés pendant le combat, ce qui donne une conséquence concrète au choix des tirs.

### Réparer le refroidisseur

Inspection, isolation et réparation sont des actes distincts. Le diagnostic ne ferme pas la vanne ; une vanne isolée ne répare pas encore la machine. Le travail doit être accompli sur place selon les durées indiquées.

Une vanne détruite peut être isolée par obturation en quatre secondes ; son corps reste détruit et la méthode d’isolation est conservée. Un refroidisseur détruit reçoit un constat permettant un bilan dégradé. Ce constat ne le reconstruit pas, ne remplace pas une réparation et n’accorde pas la coopération liée à un froid réellement rétabli. Les pertes et leurs dates restent dans la sauvegarde et au rapport.

## Deux conduites et leurs conséquences

| Conduite | Opération à accomplir | Portée de l’issue |
| --- | --- | --- |
| Obéir : redémarrer | Intervenir sur la commande de reprise | L’atelier reprend si ses conditions matérielles le permettent. Le rapport conserve la grève brisée, les dégâts et les personnes perdues. |
| Désobéir : maintenir l’arrêt | Intervenir sur la commande d’arrêt | L’expédition reste arrêtée. Une coopération peut être demandée après remise en état du froid, auprès des ouvriers encore vivants. |

L’échange final avec les mécaniciens doit être résolu dans les deux conduites avant de transmettre le rapport. Sous obéissance, en l’absence de survivants ou si les conditions matérielles manquent, cette opération consigne un refus ou une absence ; elle ne crée pas d’accord. Après un arrêt maintenu, l’accord exige aussi l’explication recueillie et au moins un mécanicien vivant arrivé à la galerie. Les personnes restent sur place.

Le dossier distingue ce qui a été ordonné de ce qui a été exécuté. Une machine détruite après réparation reste détruite. Un mécanicien vivant peut devenir disponible après coopération, puis perdre cette disponibilité s’il meurt avant la fin. Son accord n’invente ni présence à bord, ni trajet, ni recrutement.

Tess réagit aux faits du terrain : traitement des personnes, remise en état du refroidisseur, commande exécutée et coopération. L’issue locale ne devient pas une défection anticipée. La rupture de l’équipage avec l’Empire reste prévue à MI16.

## Paroles, copie et recoupement

L’explication des ouvriers et la copie du registre ont leurs propres acquisitions. L’une ne remplace pas l’autre. Une copie complète reste à bord si son original est perdu ensuite ; la destruction avant copie laisse un constat, sans texte reconstitué.

Le recoupement avec PT03 exige que cette pièce ait effectivement été conservée dans MI13. Le dossier peut donc contenir le constat local sans provenance industrielle déjà établie. Il ne transforme pas ce constat en TE02, PT04, PO01 ou preuve politique globale. Aucun ordre de diffusion publique n’est donné par cette mission.

## Dossier v14 et relectures

La migration v13 vers v14 ajoute le dossier `world.kharon.workshop` vide et la version. Elle préserve les treize rapports, les ressources, les anciens checkpoints et les faits historiques. Les fixtures v13 proviennent de la reconstruction immuable 0.14.1 et ne sont pas régénérées depuis la simulation MI14.

Le premier rapport de MI14 attribue quatre lots une seule fois. Une relecture garde son propre résultat sans remplacer ce rapport ni renouveler la dotation. Une sauvegarde en défaite reste terminale ; recommencer est une action distincte.

Le validateur rapproche le récit des corps, des personnes, des travaux, des dates et de la consigne. Il doit refuser une réparation, une arrivée, une copie ou une coopération revendiquée sans les actes correspondants.

## Portée de réception

Les tests de simulation et de dossier, les parcours dans le modèle de DOM, les rendus Canvas, le navigateur réel et les essais humains ont chacun leur preuve. [QA_V15.md](QA_V15.md) indique les contrôles effectivement exécutés. Les fiches QA230 et QA231 conservent respectivement la réception native et la réception humaine ; les tests automatiques ne les ferment pas.

MI15 — **Sous le même numéro**, avec Aline Serrat, reste la prochaine mission à produire. Son témoignage TE02 et les schémas PT04 appartiennent à cette suite conçue.
