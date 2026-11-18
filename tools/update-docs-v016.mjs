#!/usr/bin/env node
/** Met à jour les documents de campagne et de bible pour la tranche 0.16. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(root, p), 'utf8');
const write = (p, s) => writeFileSync(resolve(root, p), s);
const must = (haystack, needle, label) => {
  if (!haystack.includes(needle)) throw new Error(`Missing ${label}: ${needle.slice(0, 60)}`);
};

/* ------------------------------------------------------- corrections de forme */
const typo = (p, pairs) => {
  let text = read(p);
  for (const [from, to] of pairs) {
    if (!text.includes(from)) continue;
    text = text.split(from).join(to);
  }
  write(p, text);
};
typo('data/bible.json', [['Refuser l’aide ettenir une voie locale', 'Refuser l’aide et tenir une voie locale']]);
typo('docs/CANON_EMPIRE.md', [
  ['noms confusqués', 'noms confisqués'],
]);
{
  const canonPath = resolve(root, 'docs/CANON_EMPIRE.md');
  const canon = readFileSync(canonPath, 'utf8').replace(/relev\u00ad?ent/g, 'relèvent');
  writeFileSync(canonPath, canon);
}
typo('docs/EPREUVES_CHASSIS.md', [
  ["n’a presque pas d'angles", 'n’a presque pas d’angles'],
  ['Hissser du matériel', 'Hisser du matériel'],
]);

/* ------------------------------------------------------------- CAMPAIGN_FR */
let campaign = read('docs/CAMPAIGN_FR.md');
must(campaign, '**Version de conception et de production 0.15.0 · 16 novembre 2026**', 'campaign header');
campaign = campaign.replace(
  '**Version de conception et de production 0.15.0 · 16 novembre 2026**',
  '**Version de conception et de production 0.16.0 · 18 novembre 2026**',
);
campaign = campaign.replace(
  'Ce document décrit la campagne cible : **32 missions principales, 16 contrats, 4 actes et 4 familles de fins**. **MI01–MI14 sont jouables au stade prototype**, avec progression, **dossier v14** et reprise. Les **18 missions MI15–MI32** et les seize contrats restent conçus.',
  'Ce document décrit la campagne cible : **32 missions principales, 16 contrats de campagne, 8 épreuves de châssis, 4 actes et 4 familles de fins**. **MI01–MI14 sont jouables au stade prototype**, avec progression, **dossier v14** et reprise. Les **18 missions MI15–MI32**, les seize contrats et les huit épreuves restent conçus.',
);
campaign = campaign.replace(
  'La source de la Bible contient **1 007 fiches** ; son contrat de classeur conserve **21 onglets, 20 tables et 126 formules**. La réception du nouvel export reste distincte de cette description de périmètre.',
  'La source de la Bible contient **1 068 fiches** depuis la 0.16 ; elle conserve **20 onglets de conception**, soit **21 onglets avec la synthèse**, **20 tables** et **126 formules**. Le canon de l’appareil impérial est détaillé dans [CANON_EMPIRE.md](CANON_EMPIRE.md) et les épreuves dans [EPREUVES_CHASSIS.md](EPREUVES_CHASSIS.md). L’export XLSX de cette tranche n’a pas été reconstruit : la réception de l’export reste distincte de cette description de périmètre.',
);

const missionBlock = `#### MI15 — Sous le même numéro

**Lieu :** Kharon (PL04) · **État :** Conçu

**Ordre reçu.** Saisir l’ingénieure Aline Serrat pour interrogatoire, avant que la sécurité privée n’efface le laboratoire.

**Déroulement jouable.** Descendre un laboratoire que la sécurité purge étage par étage. Les salles de calibration retiennent des charges C utilisées pour mesurer la tolérance thermique des châssis : chaque porte ouverte coûte du temps et de la place. Extraire Aline, ses schémas et, si la coque le permet, les personnes encore vivantes.

**Ce que la mission révèle.** L’instruction 27 porte la signature d’Aline : les essais ont été autorisés, pas seulement subis. Les ordres d’arrêt viennent d’une délégation de la Continuité. Aline reconnaît sa part et refuse de la réduire à une erreur de laboratoire.

**Ce qui reste après la mission.** TE02 vivant, PT04 copié, et des corps que l’équipage doit décider d’embarquer. La dissension avec Ilan devient ouverte : il a vu les salles et compte les places disponibles.

#### MI16 — Le rapport qui ne part pas

**Lieu :** Kharon (PL04) · **État :** Conçu

**Ordre reçu.** Remettre les pièces, témoins et journaux au vaisseau de commandement, et déclarer la continuité rétablie.

**Déroulement jouable.** Préparer deux voies de sortie et répartir un poids fini entre caisses de preuves, personnes et pièces de rechange. Une colonne de trois cent quarante charges attend au hangar voisin ; l’ordre de disparition d’Aline circule déjà dans les transmissions.

**Ce que la mission révèle.** Le Directoire ne veut ni procès ni témoins. Le rapport signé doit déclarer « continuité rétablie » ; la navette n’a pas de place pour tout, et chaque caisse montée retire une place.

**Ce qui reste après la mission.** Défection opérationnelle. Ce qui monte à bord existe et est nommé ; ce qui reste est compté et poursuivi par la Cohorte. Perte des dépôts impériaux.

#### MI17 — Sans balise amie

**Lieu :** Sereis (PL05) · **État :** Conçu

**Ordre reçu.** Rejoindre un observatoire de secours avant la tempête.

**Déroulement jouable.** Marcher sur une banquise sondée, choisir la route lente ou la crête exposée, et décider si les fuyards d’une colonne prennent la place du ravitaillement. La glace porte mal deux charges ; chaque personne embarquée retire une caisse.

**Ce que la mission révèle.** La station voisine a « perdu » ses charges dans la tempête. Les fuyards ont des numéros cousus et aucun titre de présence. La Ligue aide sous conditions : ce n’est pas un pardon.

**Ce qui reste après la mission.** Carburant, chaleur, places et intégrité du marcheur. Le froid tue ce qu’on laisse ; une caisse abandonnée n’est pas un choix neutre.

#### MI18 — La neige a gardé la date

**Lieu :** Sereis (PL05) · **État :** Conçu

**Ordre reçu.** Récupérer l’historique climatique hors réseau impérial.

**Déroulement jouable.** Rétablir une antenne, protéger trois batteries et copier l’archive avant la coupure. Le dégel a ouvert une fosse que l’ordre impérial classe en aléa climatique ; les relevés doivent être sortis avant la perte d’alimentation.

**Ce que la mission révèle.** Les ordres de semis précèdent les demandes d’aide. Les dates rendent la thèse accidentelle intenable, et la fosse n’est pas un accident non plus.

**Ce qui reste après la mission.** PT05 corrélé. Publier les dates expose les fuyards ; les taire laisse la fosse sans nom. La copie survit à la perte de l’antenne.

#### MI19 — Les noms du convoi

**Lieu :** Sereis (PL05) · **État :** Conçu

**Ordre reçu.** Évacuer les familles que l’Empire a localisées en suivant un message.

**Déroulement jouable.** Organiser une traversée sur les plaques solides, immobiliser les traqueurs et choisir quelles familles montent avant la fermeture. Les bracelets de conduite signalent les enfants ; les chiens suivent les titres révoqués à travers la foule.

**Ce que la mission révèle.** Un membre de la Ligue a transmis les coordonnées trop tôt. La colonne n’emporte pas des travailleurs : elle prend les dépendants pour séparer les familles productives.

**Ce qui reste après la mission.** Comptage nominal des évacués et des laissés. Mara juge les lits, pas les intentions. Le réseau doit répondre de sa fuite.

#### MI20 — Celle qui tient encore

**Lieu :** Sereis (PL05) · **État :** Conçu

**Ordre reçu.** Faire sortir l’équipage avant l’encerclement de la Cohorte.

**Déroulement jouable.** Duel contre Edda Renn sur une station fissurée. La chambre de vérité du niveau bas enregistre des confirmations ; on peut la libérer, la sceller ou passer. Chaque choix laisse des personnes derrière une porte ou sur la glace.

**Ce que la mission révèle.** Edda a reçu les preuves et ne peut pas abandonner ses blessés. Les prisonniers ne demandent pas une libération spectaculaire mais un enregistrement qui ne soit pas retourné contre eux.

**Ce qui reste après la mission.** Passage négocié, prisonnière ou ennemie durable. Libérer la chambre sans protection produit une fuite sur la glace ; la sceller laisse les confirmations intactes.

#### MI21 — Entrer sans laisser d’empreinte

**Lieu :** Ilex (PL06) · **État :** Conçu

**Ordre reçu.** Demander asile et accès aux archives d’une cité Khelt.

**Déroulement jouable.** Traverser des sols résonants à cadence basse, arrêter un automate intrus et respecter les voies signalées. Les porteurs reconnaissent la silhouette du châssis avant de reconnaître la pilote.

**Ce que la mission révèle.** Votre machine ressemble à celle qui a scellé un jardin. Le titre de présence est une dette ; les Khelt comptent autrement, et le disent.

**Ce qui reste après la mission.** Accès négocié. Endommager les archives ferme une voie diplomatique sans bloquer la campagne ; la confiance de Leth et celle d’Hadr restent séparées.

#### MI22 — Ce qu’on efface en premier

**Lieu :** Ilex (PL06) · **État :** Conçu

**Ordre reçu.** Empêcher une équipe de purge d’atteindre les jardins de mémoire.

**Déroulement jouable.** Protéger des supports fragiles, isoler les brouilleurs et récupérer l’ordre de purge. Les porteurs dont le corps garde la mémoire sont classés catégorie C ; les sortir coûte des places et du temps.

**Ce que la mission révèle.** Les cibles nommées sont des écoles, des langues, des filiations et des porteurs. L’effacement n’est pas un dommage collatéral : c’est le programme.

**Ce qui reste après la mission.** PO01 et TE04. Une archive copiée survit ; un porteur tué ne se reconstitue pas. La restitution reste une dette vérifiable, pas une générosité.

#### MI23 — L’accord n’est pas le silence

**Lieu :** Ilex (PL06) · **État :** Conçu

**Ordre reçu.** Obtenir une coalition sans imposer les objectifs de la Ligue.

**Déroulement jouable.** Tenir un périmètre pendant une rencontre, empêcher un attentat de radicaux et escorter les délégations sans confisquer leurs armes. Un prisonnier impérial veut parler ; une faction veut le pendre devant les caméras.

**Ce que la mission révèle.** Hadr exige autonomie et restitution. La Ligue n’est pas innocente : elle a transmis des coordonnées et veut une vengeance. Les deux vérités tiennent ensemble.

**Ce qui reste après la mission.** Pacte, engagement de restitution et capacité à tenir un cessez-le-feu. Sera doit appliquer à ses alliés les règles qu’elle imposait à l’Empire.

#### MI24 — Le monde répond

**Lieu :** Ilex (PL06) · **État :** Conçu

**Ordre reçu.** Transmettre un dossier vérifiable avant la fermeture du réseau interplanétaire.

**Déroulement jouable.** Défendre plusieurs relais et choisir entre protéger les témoins sur place et renforcer le canal de diffusion. Le dossier contient le registre des charges et les noms cousus ; le diffuser expose des familles entières.

**Ce que la mission révèle.** Les trois familles de preuves se recoupent. Publier les sources brutes livre des personnes au reclassement ; publier seulement les conclusions laisse le Directoire nier.

**Ce qui reste après la mission.** Portée et qualité distinctes de la survie des témoins. L’insurrection devient publique ; le Directoire aussi.

#### MI25 — Le pain des autres

**Lieu :** Méridien (PL07) · **État :** Conçu

**Ordre reçu.** Ouvrir un passage vers les dépôts agricoles sans interrompre les récoltes.

**Déroulement jouable.** Protéger des machines civiles, contourner des serres et désarmer une batterie qui utilise un silo comme bouclier. La ration punitive est déjà appliquée au secteur voisin ; le quota du centre exige que d’autres restent sous le seuil.

**Ce que la mission révèle.** La famine est administrée. Jo connaît le chiffre et le cache parce qu’il doit choisir quel quartier mange. Personne ne propose une solution sans perte.

**Ce qui reste après la mission.** Stocks et confiance. Un silo touché affame un quartier nommé ; les rations sont une arme, pas une générosité.

#### MI26 — Les comptes de la pluie

**Lieu :** Méridien (PL07) · **État :** Conçu

**Ordre reçu.** Saisir le centre de gestion des crédits de terraformation.

**Déroulement jouable.** Neutraliser la défense par les alimentations militaires, maintenir les pompes civiles et copier les contrats. Le mur des fiches relie chaque catastrophe à une dette et chaque dette à une signature.

**Ce que la mission révèle.** Les bénéfices des catastrophes financent les rations bon marché d’Orthe. Des fonctionnaires signent sans lire ; d’autres lisent et appellent cela de la continuité.

**Ce qui reste après la mission.** PO02, réseaux d’eau tenus, soutien de fonctionnaires dissidents. Détruire les fiches efface des droits autant que des crimes.

#### MI27 — Une ville ne se prend pas

**Lieu :** Méridien (PL07) · **État :** Conçu

**Ordre reçu.** Obtenir la sortie d’une garnison sans bataille dans les rues.

**Déroulement jouable.** Couvrir une négociation, tenir les groupes impatients et escorter les soldats désarmés jusqu’au point convenu. Une cellule de la Ligue veut violer l’accord et filmer une exécution.

**Ce que la mission révèle.** La garnison a exécuté la circulaire 9-B la semaine précédente. Les soldats sont des exécutants et des voisins ; les deux faits tiennent ensemble.

**Ce qui reste après la mission.** Fiabilité du pacte, survivants de la garnison et attitude d’Ilan. Une exécution rend la reddition impossible ailleurs.

#### MI28 — La ligne que nous choisissons

**Lieu :** Méridien (PL07) · **État :** Conçu

**Ordre reçu.** Empêcher le rationnement punitif et préparer la route de la capitale.

**Déroulement jouable.** Séparer un train de ravitaillement d’une batterie mobile, protéger les aiguillages et répartir les wagons. Chaque wagon envoyé au front est retiré à un secteur nommé.

**Ce que la mission révèle.** Approvisionner l’offensive seule gagnerait du temps en affamant des secteurs déjà fragiles. Le choix est un partage, pas une collecte.

**Ce qui reste après la mission.** Logistique du dernier acte, confiance des communes et population évacuée. Aucune répartition ne satisfait tout le monde.

#### MI29 — Retour par les ateliers

**Lieu :** Orthe (PL08) · **État :** Conçu

**Ordre reçu.** Entrer sur Orthe par les installations où la machine a été construite.

**Déroulement jouable.** Progression basse sous les portiques, coopération avec les ateliers en grève et désactivation d’identifiants impériaux. Sous la chaîne, une chambre de mesure où les châssis étaient calibrés sur des charges C.

**Ce que la mission révèle.** Les ouvriers ont fabriqué les berceaux de calibration sans savoir. Certains refusent d’aider tant que les faits restent vagues ; d’autres veulent que la chambre soit montrée, pas seulement détruite.

**Ce qui reste après la mission.** Accès de secours ouvert. Les anciens contacts réapparaissent selon les preuves diffusées. La chambre reste un lieu de la campagne, pas un niveau supplémentaire.

#### MI30 — Les marches du ministère

**Lieu :** Orthe (PL08) · **État :** Conçu

**Ordre reçu.** Extraire les délégations signées et protéger les agents prêts à témoigner.

**Déroulement jouable.** Franchir les terrasses sans effondrer les voies basses, contenir la contre-attaque et tenir les ascenseurs civils. Le bureau des charges est un mur de fiches, un nom par fiche, classé par rue et par rendement.

**Ce que la mission révèle.** La responsabilité est distribuée entre signatures, délégations et tampons. Détruire le mur libère du classement et efface des droits à la ration ; le copier conserve les deux.

**Ce qui reste après la mission.** PO03 et le choix du mur : copier, saisir, détruire ou publier. Les témoins du centre et les archives ne sont pas la même protection.

#### MI31 — Le dernier ordre de Holt

**Lieu :** Orthe (PL08) · **État :** Conçu

**Ordre reçu.** Atteindre le centre de diffusion avant le verrouillage des quartiers.

**Déroulement jouable.** Affronter le marcheur de Holt ; casser son armement ou obtenir un passage en tenant un corridor de secours sous ses yeux. Il a ordonné le verrouillage de trois districts après un sabotage.

**Ce que la mission révèle.** Holt peut reconnaître les faits et refuser l’effondrement de l’armée. Le verrouillage est une représaille collective : un acte, trois districts, aucun nom.

**Ce qui reste après la mission.** Sort de Holt, de la Cohorte et du corridor. Aucune discussion ne ressuscite les pertes ; aucun ordre ne les annule.

#### MI32 — Après le fracas

**Lieu :** Orthe (PL08) · **État :** Conçu

**Ordre reçu.** Arrêter la purge des réseaux et rendre le dossier accessible à des dépositaires indépendants.

**Déroulement jouable.** Tenir trois sites : arrêt des terraformes, station de preuves et voie d’évacuation. La station de continuité d’Orthe retient quatre mille charges ; Norn propose de sauver le réseau en effaçant les ordres.

**Ce que la mission révèle.** Le réseau peut survivre sans les archives ; les archives peuvent survivre sans le réseau. Nell et les noms cousus peuvent être publiés ou protégés, pas les deux sans coût.

**Ce qui reste après la mission.** FI01–FI04 selon preuves, survie, coalition et continuité. Les épilogues montrent les lieux et les noms, pas un score.

`;

const start = campaign.indexOf('#### MI15 — Sous le même numéro');
const end = campaign.indexOf('## 5. Les contrats');
if (start < 0 || end < 0 || end < start) throw new Error('Campaign block markers not found');
campaign = `${campaign.slice(0, start)}${missionBlock}${campaign.slice(end)}`;

const contractAnchor = '| CT16 | Orthe | Les archives de ceux d’en bas | **Collectif des locataires :** Ouvrir une administration verrouillée et préserver les registres de logement contre la purge. **Retour :** Empêche une expulsion collective après la bataille; contrepoint à la grande histoire politique. |\n';
must(campaign, contractAnchor, 'contracts table end');
const trialSection = `${contractAnchor}
### Les huit épreuves de châssis

Huit exercices de qualification éprouvent un châssis sur un terrain réel, avec des personnes réelles. L’Empire les appelle des « exercices de continuité » ; le joueur y découvre une machine et un crime dans le même geste. Ils se débloquent au Hangar après MI14 et restent **conçus**. Le détail des parcours, des appuis et des issues figure dans [EPREUVES_CHASSIS.md](EPREUVES_CHASSIS.md).

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

**CT21 — La paroi des Tisserands** est l’ascension demandée pour l’araignée : le WK17 Tisserand, quadrupède bas à pattes rayonnantes, escalade une falaise de silice de deux cent dix mètres pour ouvrir une cellule d’archive scellée. Quatre appuis réels, trois postures (croix, plaque, rampe), des prises qui cèdent, un jet de caloporteur et un grappin qui coupe les ancrages. La descente est un second parcours. Aucune plateforme, aucun treuil, aucune place pour un passager : le châssis ne peut sauver que ce qu’il copie.
`;
campaign = campaign.replace(contractAnchor, trialSection);

const proofAnchor = '| PO03 | MI30, Orthe | Des délégations signées et journaux d’autorisation relient les décisions à la direction. | Une justice immédiate ou une reconstruction automatique. |\n';
must(campaign, proofAnchor, 'proof table end');
campaign = campaign.replace(proofAnchor, `${proofAnchor}| PO04 | MI16, Kharon | Un bordereau de colonne et le registre des noms confisqués relient le transfert au Bureau des Poids. | La responsabilité pénale de chaque agent, ni le nombre exact de personnes déplacées. |\n| TE03 | MI32, Orthe | Nell Ash décrit la station 4, les numéros, les noms cousus et la séparation des familles. | La chaîne de décision politique ; son récit reste celui d’une enfant. |\n| TE04 | MI22, Ilex | Tava relie la destruction des jardins à l’Institut de la Mémoire Matérielle et aux porteurs vivants. | La totalité des cités Khelt ni l’accord de toutes les cités. |\n`);

write('docs/CAMPAIGN_FR.md', campaign);

/* ---------------------------------------------------------------- BIBLE_FR */
let bibleFr = read('docs/BIBLE_FR.md');
must(bibleFr, '**Nom de code :** ImperiumMarch · **Version de conception :** 0.15.1 · **Date :** 16 novembre 2026', 'bible header');
bibleFr = bibleFr.replace(
  '**Nom de code :** ImperiumMarch · **Version de conception :** 0.15.1 · **Date :** 16 novembre 2026',
  '**Nom de code :** ImperiumMarch · **Version de conception :** 0.16.0 · **Date :** 18 novembre 2026',
);
bibleFr += `
## 15. Le canon de la Continuité — 0.16

La 0.16 complète la bible narrative par un canon explicite de l’appareil impérial : [CANON_EMPIRE.md](CANON_EMPIRE.md). Il décrit la doctrine de la Continuité, le lexique officiel et ce qu’il couvre, les décrets et règlements, les neuf organes, la chaîne ordinaire du crime en sept étapes, les lieux, la langue, les exécutants et les victimes. Il fixe aussi les règles de représentation : aucun symbole réel, aucune torture montrée, aucun charnier en spectacle, aucune animalisation des victimes. Le canon cite les pièces du monde — pages d’école, formulaires, feuilles de greffe, affiches, calendriers d’entretien — sans traduire les termes officiels à la place des personnages. La peur vient de ce que ces documents sont sincères et de ce qu’ils permettent.

**Ce que la source contient désormais.** \`data/bible.json\` passe de 1 007 à **1 068 fiches**, sans retirer aucun ID ni promouvoir aucun statut. Les ajouts sont : cinq principes de représentation (\`VI29–VI33\`), quatre systèmes de classement, dette, effacement et confirmation (\`SY136–SY139\`), quatre unités de répression (\`EN37–EN40\`), huit portraits d’exécutants et de victimes (\`PN15–PN22\`), trente-deux documents, formulaires, registres, slogans, témoignages et lieux (\`NA99–NA130\`), et huit épreuves de châssis (\`CT17–CT24\`). Les planètes et les factions gagnent des descriptions de l’occupation ; les missions \`MI15–MI32\` reçoivent un déroulement, une vérité et une conséquence détaillés.

**Épreuves de châssis.** [EPREUVES_CHASSIS.md](EPREUVES_CHASSIS.md) décrit huit missions liées à une machine, dont **CT21 — La paroi des Tisserands** : une ascension verticale de deux cent dix mètres pour le WK17 Tisserand, quadrupède bas à pattes rayonnantes, avec quatre appuis réels, trois postures, des prises qui cèdent et une descente qui est un second parcours. Aucune épreuve n’est implémentée ; seul WK14 est pilotable.

**Limites.** Aucune mission \`MI15–MI32\` n’est jouable, aucun châssis \`WK13, WK15–WK20\` n’a de marche simulée, et l’export \`docs/ORDRE_DE_CENDRE_Bible.xlsx\` n’a pas été reconstruit : le générateur exige le runtime \`@oai/artifact-tool\`, absent de l’environnement. La source JSON fait foi ; l’écart d’export est signalé, pas masqué. Les avertissements de contenu et les options de représentation restent à éprouver avec des joueurs concernés.
`;
write('docs/BIBLE_FR.md', bibleFr);

/* ------------------------------------------------------------- BIBLE_README */
let bibleReadme = read('docs/BIBLE_README.md');
must(bibleReadme, 'La source courante **0.15.11**, datée du **17 novembre 2026**, contient **1 007 fiches**.', 'readme header');
bibleReadme = bibleReadme.replace(
  'La source courante **0.15.11**, datée du **17 novembre 2026**, contient **1 007 fiches**. La structure conserve **21 onglets**, **20 tables** et **126 formules**.',
  'La source courante **0.16.0**, datée du **18 novembre 2026**, contient **1 068 fiches**. La structure conserve **20 onglets de conception**, soit **21 avec la synthèse**, **20 tables** et **126 formules**. L’export XLSX n’a pas été reconstruit pour cette tranche : le générateur exige `@oai/artifact-tool`, absent de l’environnement ; les sections de réception ci-dessous restent historiques et décrivent l’export 0.15.11.',
);
bibleReadme = bibleReadme.replace(
  '**MI01–MI14 possèdent une version au stade prototype, avec dossier v14.** Vesper et Nacre sont suivies de quatre sorties de Thyr et de deux missions de Kharon. Les **18 missions MI15–MI32** et les **16 contrats** restent conçus. Les opérations OP01–OP03 gardent leurs rapports indépendants. Six châssis sont jouables.',
  '**MI01–MI14 possèdent une version au stade prototype, avec dossier v14.** Vesper et Nacre sont suivies de quatre sorties de Thyr et de deux missions de Kharon. Les **18 missions MI15–MI32**, les **16 contrats de campagne** et les **8 épreuves de châssis** restent conçus. Les opérations OP01–OP03 gardent leurs rapports indépendants. Sept châssis sont assignables au départ, dont WK14 Sentinelle.',
);
bibleReadme = bibleReadme.replace(
  'Le dossier v14 ajoute uniquement `world.kharon.workshop` vide et la version.',
  'La 0.16 ajoute 61 fiches narratives et de conception au canon de la Continuité (décrets, formulaires, registres, propagande, témoignages, portraits, épreuves) sans retirer aucun ID et sans promouvoir aucun statut. Voir [CANON_EMPIRE.md](CANON_EMPIRE.md) et [EPREUVES_CHASSIS.md](EPREUVES_CHASSIS.md).\n\nLe dossier v14 ajoute uniquement `world.kharon.workshop` vide et la version.',
);
write('docs/BIBLE_README.md', bibleReadme);

/* -------------------------------------------------------------- MARCHEURS_FR */
let walkers = read('docs/MARCHEURS_FR.md');
must(walkers, '## 6. Tranches suivantes', 'walkers section 6');
walkers = walkers.replace(
  '## 6. Tranches suivantes',
  `## 6. Épreuves de châssis

Chaque châssis reçoit une épreuve conçue, décrite dans [EPREUVES_CHASSIS.md](EPREUVES_CHASSIS.md) : vitesse sans blindage pour le Chacal, tenue de carrefour pour la Sentinelle, marquage haut pour le Cormoran, soute et chaleur pour le Bison, tir indirect pour la Baliste, bélier de seuil pour le Broyeur et charge variable sur rampe pour le Mulet.

**WK17 Tisserand — La paroi des Tisserands** est l’épreuve verticale : une falaise de silice de deux cent dix mètres, quatre appuis rayonnants, trois postures (croix, plaque, rampe), des prises qui cèdent, un jet de caloporteur et un grappin qui coupe les ancrages. La descente est un second parcours. Rien de tout cela n’est simulé : le Tisserand reste conçu, sans marche, sans contact vertical et sans assignation.

## 7. Tranches suivantes`,
);
write('docs/MARCHEURS_FR.md', walkers);

/* ----------------------------------------------------------------- AGENTS */
let agents = read('AGENTS.md');
agents += `
## Canon de la Continuité et épreuves de châssis — 0.16

- \`docs/CANON_EMPIRE.md\` est la référence du caractère dictatorial, sanguinaire et impitoyable de l'Empire d'Orthe. Il décrit la doctrine, le lexique officiel, les textes (DC-7, OC-12, DT-3, CB-3, R-44, instruction 27, règlement 61, circulaire 9-B), les neuf organes, la chaîne du crime, les lieux, les exécutants et les victimes. \`data/bible.json\` porte les fiches correspondantes (NA99–NA130, PN15–PN22, SY136–SY139, EN37–EN40, VI29–VI33).
- La représentation reste implicite : aucun symbole, uniforme ou nom d'un régime historique réel ; aucune torture montrée ; aucun charnier en spectacle ; aucune animalisation des victimes. La peur ne vient pas du tampon mais de la pièce : un document impérial doit avoir l'air écrit par quelqu'un qui veut que la ligne passe avant la relève, et aucun terme officiel n'est traduit dans la même réplique. Ne pas introduire d'imagerie réelle ni de contenu gratuit.
- Les victimes gardent leur agentivité : elles négocient, mentent, refusent, collaborent parfois. Ne pas les réduire à des objets de compassion ni à des récompenses morales pour Sera.
- \`CT17–CT24\` sont huit **épreuves de châssis** conçues, dont \`CT21 — La paroi des Tisserands\` (WK17, ascension verticale de 210 m, quatre appuis rayonnants, postures croix/plaque/rampe). Elles se débloquent après MI14 dans la conception mais ne sont ni implémentées ni jouables. Seul WK14 est pilotable ; les châssis WK13 et WK15–WK20 n'ont ni marche ni tir.
- MI15–MI32 restent **Conçu**. Leur détail enrichi ne les rend pas jouables et ne modifie ni le dossier v14, ni les fixtures, ni les statuts. Aucun ID existant n'est retiré : la source passe de 1 007 à 1 068 fiches, 20 onglets de conception (21 avec la synthèse).
- L'export \`docs/ORDRE_DE_CENDRE_Bible.xlsx\` n'a pas été reconstruit en 0.16 : \`tools/build-bible.mjs\` exige \`@oai/artifact-tool\`, absent de l'environnement. La source \`data/bible.json\` fait foi. Signaler l'écart, ne pas présenter l'export comme à jour, et ne pas régénérer les preuves historiques.
- Vérifications de la tranche : \`npm run check\` puis \`npm test\`. Aucun changement de code, de style ou d'asset : la reconstruction autonome n'est pas requise par cette tranche, mais un \`npm run build\` reste valable si un fichier embarqué change.
`;
write('AGENTS.md', agents);

/* --------------------------------------------------------------- README & pkg */
let readme = read('README.md');
readme = readme.replace(
  'La Bible contient **1 007 fiches sur 21 onglets**. Les dix-huit missions MI15–MI32, les seize contrats et la qualité de production visée restent à construire.',
  'La Bible contient **1 068 fiches sur 20 onglets de conception** (21 avec la synthèse). Le [canon de l’Empire](docs/CANON_EMPIRE.md) détaille l’appareil dictatorial et les [huit épreuves de châssis](docs/EPREUVES_CHASSIS.md) incluent l’ascension verticale du Tisserand. Les dix-huit missions MI15–MI32, les seize contrats, les huit épreuves et la qualité de production visée restent à construire.',
);
write('README.md', readme);

const pkg = JSON.parse(read('package.json'));
pkg.version = '0.16.0';
write('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

console.log(JSON.stringify({ campaign: 'MI15–MI32 détaillés', contracts: 24, trials: 8, bibleRows: 1068, version: pkg.version }));
