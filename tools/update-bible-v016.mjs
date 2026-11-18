#!/usr/bin/env node
/**
 * Tranche 0.16 — canon de la Continuité et épreuves de châssis.
 * Additif : 61 fiches nouvelles, aucune fiche ni aucun ID retiré, aucun statut promu.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'data/bible.json');
const bible = JSON.parse(readFileSync(file, 'utf8'));
const sheet = name => {
  const found = bible.sheets.find(s => s.name === name);
  if (!found) throw new Error(`Missing sheet ${name}`);
  return found;
};
const beforeIds = bible.sheets.flatMap(s => s.rows.map(r => r.id));
if (beforeIds.length !== 1007 || new Set(beforeIds).size !== 1007) {
  throw new Error('Expected 1,007 unique source IDs as the 0.15 baseline.');
}
const beforeRows = new Map(beforeIds.map(id => [id, true]));

/* ------------------------------------------------------------------ Vision */
sheet('Vision').rows.push(
  {
    id: 'VI29', theme: 'L’abominable administratif',
    decision: 'L’Empire d’Orthe ne tue pas par fureur mais par classement : recensement, catégories, titres révoqués, colonnes, stations de rendement. La terreur est un service public qui tient des registres.',
    acceptance: 'Chaque violence visible possède en amont un document, un agent et un délai. Le joueur peut retrouver la fiche avant de voir la fosse.',
    status: 'Conçu',
  },
  {
    id: 'VI30', theme: 'Complicité de la machine',
    decision: 'Le marcheur est l’instrument du classement : il bloque une rue, escorte une colonne, porte des charges, tire sur un cordon. Sa masse rend la participation physique et non abstraite.',
    acceptance: 'Une mission d’occupation ne peut pas être terminée sans que le joueur ait vu ce que sa coque empêche ou permet.',
    status: 'Conçu',
  },
  {
    id: 'VI31', theme: 'Euphemisme jouable',
    decision: 'Le vocabulaire impérial est employé sans traduction automatique. « Transfert de rendement », « charge non récupérable », « continuité rétablie » sont dits tels quels ; le joueur apprend ce qu’ils couvrent par les faits.',
    acceptance: 'Aucun sous-titre ne moralise le terme à la place du joueur. Le glossaire reste consultable hors mission.',
    status: 'Conçu',
  },
  {
    id: 'VI32', theme: 'Victimes agissantes',
    decision: 'Les personnes classées ne sont pas un décor de compassion : elles marchandent, mentent, cachent, résistent, cousent des noms, choisissent qui monte. Leur survie n’est pas une récompense morale.',
    acceptance: 'Au moins deux victimes refusent une aide, une autre négocie un prix, une autre collabore par peur ; aucune n’existe seulement pour valider Sera.',
    status: 'Conçu',
  },
  {
    id: 'VI33', theme: 'Représentation du crime',
    decision: 'Aucun symbole, uniforme ou emblème d’un régime historique réel. Pas de spectacle de charnier, pas de torture montrée. Le canon cite les pièces du monde — pages d’école, formulaires, feuilles de greffe, affiches, calendriers d’entretien — sans traduire les termes officiels à la place des personnages. La peur vient de ce que ces documents sont sincères et de ce qu’ils permettent.',
    acceptance: 'Une scène de crime de masse peut être lue sans image explicite ; les avertissements de contenu et l’occultation des corps restent disponibles.',
    status: 'Conçu',
  },
);

/* -------------------------------------------------------------- Systèmes */
sheet('Systèmes').rows.push(
  {
    id: 'SY136', system: 'Titres et catégories',
    design: 'Le titre de présence relie identité, ration et travail. La catégorie A (rendement utile), B (charge récupérable) ou C (non récupérable) ouvre ou ferme les portes, les dialogues et les convois. Révoquer un titre ne déplace personne : cela rend le déplacement légal.',
    counterplay: 'Copier un registre, restaurer un titre, cacher une fiche ou faire témoigner un agent. Détruire le registre libère du classement et efface aussi des droits à la ration.',
    acceptance: 'Un titre modifie l’accès au monde et le sort d’un groupe, pas seulement un indicateur. Aucune fiche détruite ne réapparaît sans copie.',
    priority: 'P0', status: 'Conçu',
  },
  {
    id: 'SY137', system: 'Dette de protection',
    design: 'Un secours impérial crée une dette : travail, récolte, filiation ou nom donnés en garantie. La dette se contracte avant le sauvetage et se rembourse après, parfois par des personnes qui n’ont pas consenti.',
    counterplay: 'Refuser l’aide ettenir une voie locale, payer avec du matériel, contester la créance ou la rendre publique. Chaque issue conserve un coût daté.',
    acceptance: 'Le joueur voit la créance avant d’accepter. Un sauvetage réussi ne l’annule jamais silencieusement.',
    priority: 'P1', status: 'Conçu',
  },
  {
    id: 'SY138', system: 'Effacement mémoriel',
    design: 'Les archives sont des objets : papiers, cristaux, jardins de mémoire et porteurs vivants. Une copie survit à son original ; un porteur tué ne se reconstitue pas. L’effacement vise des écoles, des langues et des filiations, pas seulement des fichiers.',
    counterplay: 'Copier, répartir, confier à des dépositaires indépendants, protéger les porteurs. Publier sans précaution expose les personnes nommées.',
    acceptance: 'Aucune archive ni aucun porteur perdu ne revient sans source conservée. La restitution reste une dette vérifiable, pas une générosité.',
    priority: 'P0', status: 'Conçu',
  },
  {
    id: 'SY139', system: 'Chambres de vérité',
    design: 'Un tribunal de confirmation exige que l’accusé prononce la cause officielle d’une catastrophe. La phrase enregistrée vaut preuve ; le doute vaut catégorie C. Le juge ne torture pas : il attend, il corrige la formulation, il tamponne.',
    counterplay: 'Refuser et payer le prix, enregistrer la séance, substituer un aveu, faire parler un greffier. Une confirmation obtenue sous peur reste utilisable par l’Empire.',
    acceptance: 'Refuser n’est jamais gratuit et accepter ne produit pas une vérité. Le dossier distingue aveu, confirmation et témoignage spontané.',
    priority: 'P1', status: 'Conçu',
  },
);

/* --------------------------------------------------------------- Ennemis */
sheet('Ennemis').rows.push(
  {
    id: 'EN37', name: 'Commissaire des Poids', faction: 'FA01',
    behavior: 'Avance avec quatre gardes, ne tire pas : il lit des numéros et tamponne des révocations. Sa présence transforme une foule en files. Abattu, il devient un martyr et la garnison durcit le couvre-feu.',
    telegraph: 'Formulaire levé, tampon en main, lecture lente du registre ; les gardes écartent les personnes.',
    response: 'Interrompre le tampon, confisquer le registre, ouvrir une porte ou faire parler un greffier. Le tuer ferme des dialogues et accélère les représailles.',
    status: 'Conçu',
  },
  {
    id: 'EN38', name: 'Escouade de reclassement', faction: 'FA01',
    behavior: 'Quatre soldats et un camion à ridelles : ils appellent des numéros au haut-parleur, séparent les dépendants des productifs et chargent les catégories C. Ils ne poursuivent pas un marcheur, ils bouclent un pâté de maisons.',
    telegraph: 'Haut-parleur, barrières posées, moteur du camion maintenu au ralenti.',
    response: 'Bloquer le camion, ouvrir le cordon, couper le haut-parleur, détourner l’escorte. Tirer dans la file tue les personnes que l’on prétend libérer.',
    status: 'Conçu',
  },
  {
    id: 'EN39', name: 'Chien de conduite', faction: 'FA01',
    behavior: 'Quadrupède de pistage accouplé aux bracelets de conduite. Il suit un titre révoqué à travers les foules et signale la position sans combattre. Les civils le craignent plus qu’une patrouille.',
    telegraph: 'Oreilles qui pivotent, pulsation basse, arrêt net devant une piste.',
    response: 'Couper les bracelets, masquer une odeur, noyer le signal sous un bruit industriel. L’abattre attire l’escouade sans supprimer les fiches.',
    status: 'Conçu',
  },
  {
    id: 'EN40', name: 'Automate de tri', faction: 'FA02',
    behavior: 'Bras de tri sur convoyeur, dans une station : il mesure chaleur, masse et démarche, puis oriente vers l’atelier, l’infirmerie ou la colonne. Il ne poursuit personne et continue de classer sous le feu.',
    telegraph: 'Cône de balayage, aiguillage qui s’oriente, tampon automatique avant le basculement.',
    response: 'Enrayer le convoyeur, couper l’aiguillage, sortir des files. Le détruire arrête le tri local sans restaurer les fiches déjà émises.',
    status: 'Conçu',
  },
);

/* ------------------------------------------------------------ Personnages */
sheet('Personnages').rows.push(
  {
    id: 'PN15', name: 'Orlan Voss', role: 'Commissaire des Poids et des Conduites',
    desire: 'Que le compte tombe juste. Il croit que l’arithmétique est une miséricorde : un chiffre exact vaut mieux qu’une foule incertaine.',
    arc: 'Révoque un quartier entier sans élever la voix. Confronté à une fiche portant son propre nom, il cherche d’abord l’erreur de procédure avant de reconnaître la machine.',
    faction: 'FA01', status: 'Conçu',
  },
  {
    id: 'PN16', name: 'Ilse Varne', role: 'Médecin des commissions de tri',
    desire: 'Sauver ceux qu’on peut. Son tri exige d’en condamner d’autres, et elle préfère ce calcul à l’absence de calcul.',
    arc: 'Justifie chaque sélection par une statistique. Un patient classé C qui revient vivant fissure son récit ; elle peut livrer ses feuilles de tri ou les brûler.',
    faction: 'FA01', status: 'Conçu',
  },
  {
    id: 'PN17', name: 'Berth Malen', role: 'Juge des Chambres de Vérité',
    desire: 'Prévenir le désordre en faisant confirmer la version officielle, une phrase à la fois.',
    arc: 'Ne torture pas : il attend, corrige la formulation, tamponne. Sa signature transforme un doute en catégorie C. Il croit que sans lui, les garnisons feraient pire.',
    faction: 'FA01', status: 'Conçu',
  },
  {
    id: 'PN18', name: 'Néra Sand', role: 'Voix de la Continuité',
    desire: 'Croire que la propagande évite la panique, et donc des morts. Ancienne infirmière, elle parle des rendements comme d’autres parlent de fièvre.',
    arc: 'Découvre que ses bulletins ont préparé les colonnes. Sa voix peut publier le dossier ou le couvrir ; elle choisit selon ce qu’on lui montre et ce qu’on protège.',
    faction: 'FA01', status: 'Conçu',
  },
  {
    id: 'PN19', name: 'Sarre Kadak', role: 'Colonel d’une station de continuité',
    desire: 'Tenir le rendement et les vivres. Il ne se voit pas comme un bourreau mais comme un gestionnaire de pénurie.',
    arc: 'Peut livrer un registre pour sauver sa station et son personnel. Ne reconnaît aucun crime personnel : les colonnes venaient d’ailleurs.',
    faction: 'FA01', status: 'Conçu',
  },
  {
    id: 'PN20', name: 'Nell Ash', role: 'Enfant de la station 4',
    desire: 'Retrouver le nom de sa sœur et le faire dire à voix haute par quelqu’un qui ait le droit de parler.',
    arc: 'Témoin TE03. Garde les noms cousus dans la doublure de son manteau. Ne témoigne que si un adulte garant et un lieu sûr existent ; sinon elle marchande sa mémoire.',
    faction: 'FA03', status: 'Conçu',
  },
  {
    id: 'PN21', name: 'Tava', role: 'Porteuse de mémoire Khelt',
    desire: 'Transmettre avant de mourir et refuser d’être un échantillon dans un rapport humain.',
    arc: 'Ses souvenirs se lisent par gestes et vibrations. Une copie peut être extraite sans consentement ; elle exige que la restitution soit écrite et que le jardin survive.',
    faction: 'FA05', status: 'Conçu',
  },
  {
    id: 'PN22', name: 'Deni Vorel', role: 'Archiviste des effacements',
    desire: 'Que quelqu’un sache ce qu’il a classé. Il n’a jamais signé une mort, seulement des transferts.',
    arc: 'Fournit l’index des destructions. Sa coopération dépend d’une garantie pour sa famille, pas d’un pardon ; il ment tant qu’il croit négocier.',
    faction: 'FA01', status: 'Conçu',
  },
);

/* -------------------------------------------------------------- Narration */
sheet('Narration').rows.push(
  { id: 'NA99', type: 'Décret', name: 'DC-7 — Décret de Continuité', rule: 'Tout monde dont les services passent sous le seuil est placé sous tutelle de rendement. Ses habitants reçoivent des titres provisoires. La tutelle ne s’éteint que par l’extinction de la dette, jamais par le retour à l’autonomie.', sources: 'Vesper, Nacre, Thyr; MI01, MI05, MI26.', status: 'Conçu' },
  { id: 'NA100', type: 'Décret', name: 'OC-12 — Ordonnance des charges', rule: 'Trois catégories : A rendement utile, B charge récupérable, C charge non récupérable. La catégorie se transmet aux dépendants et se révise sur formulaire 12, sans recours.', sources: 'Bureau des Poids; MI08, MI16, MI19.', status: 'Conçu' },
  { id: 'NA101', type: 'Décret', name: 'DT-3 — Décret des titres de présence', rule: 'Le titre lie identité, ration et travail. Sa révocation ne déplace personne : elle rend le déplacement légal. Un sans-titre n’existe plus pour la route, le quai ou l’hôpital.', sources: 'MI08, MI16, MI30.', status: 'Conçu' },
  { id: 'NA102', type: 'Décret', name: 'CB-3 — Code des bouches', rule: 'La ration est proportionnelle au rendement. Un enfant, un vieillard ou un blessé exige un garant productif. Sans garant, la bouche est dite non productive et rattachée à une colonne.', sources: 'Méridien; MI25, MI28.', status: 'Conçu' },
  { id: 'NA103', type: 'Règlement', name: 'R-44 — Supports de mémoire', rule: 'Toute archive non déclarée est un support non autorisé. Les porteurs Khelt dont le corps conserve une mémoire sont classés supports vivants et soumis à l’Institut de la Mémoire Matérielle.', sources: 'Ilex; MI21–MI22.', status: 'Conçu' },
  { id: 'NA104', type: 'Procédure', name: 'Circulaire 9-B — Reclassement de voisinage', rule: 'Un sabotage non résolu entraîne le reclassement du pâté de maisons. L’enquête est remplacée par l’arithmétique : un acte, un quartier, une colonne.', sources: 'Vesper, Orthe; MI01, MI24, MI27.', status: 'Conçu' },
  { id: 'NA105', type: 'Procédure', name: 'Instruction 27 — Calibration', rule: 'Les charges C peuvent servir à mesurer la tolérance thermique, chimique et mécanique des châssis. La signature d’un ingénieur vaut autorisation ; le nombre de sujets est fixé par le rendement attendu.', sources: 'Kharon; MI15.', status: 'Conçu' },
  { id: 'NA106', type: 'Procédure', name: 'Règlement 61 — Chambres de vérité', rule: 'L’accusé confirme la cause officielle d’un désastre. La confirmation enregistrée vaut preuve ; le doute vaut catégorie C. Le greffier corrige la formulation jusqu’à ce qu’elle soit recevable.', sources: 'Sereis, Orthe; MI20, MI30.', status: 'Conçu' },
  { id: 'NA107', type: 'Formulaire', name: 'Formulaire 12 — Changement de catégorie', rule: 'Trois cases, un motif, un tampon, aucun recours. C’est le seul instant où l’administration touche une personne ; tout le reste est du transport.', sources: 'Tous les mondes occupés.', status: 'Conçu' },
  { id: 'NA108', type: 'Formulaire', name: 'Bordereau de colonne', rule: 'Nombre de charges, tonnage, destination, Garde, pertes en route comptées en unités. Une colonne n’a pas de passagers ; elle a un chargement et un rendement prévisionnel.', sources: 'MI16, MI19, MI32.', status: 'Conçu' },
  { id: 'NA109', type: 'Registre', name: 'Registre des noms confisqués', rule: 'À l’entrée d’une station, chaque nom est remplacé par un numéro. Les noms ne sont pas détruits : ils sont conservés dans un hangar, au cas où un ayant droit les réclamerait contre paiement.', sources: 'MI16, MI30, MI32.', status: 'Conçu' },
  { id: 'NA110', type: 'Registre', name: 'Registre de rendement', rule: 'Chaque station affiche le rendement par charge. Une baisse justifie la réduction de ration, puis le transfert des bouches non productives. La faim est présentée comme une mesure technique.', sources: 'MI20, MI29; NA102.', status: 'Conçu' },
  { id: 'NA111', type: 'Propagande', name: 'Slogan — « La Continuité ne pardonne pas ; elle compte. »', rule: 'Affiché aux entrées de stations et sur les formulaires. Le verbe compter est employé à la fois comme calcul et comme énumération des personnes.', sources: 'Orthe; MI29–MI32.', status: 'Conçu' },
  { id: 'NA112', type: 'Propagande', name: 'Slogan — « Ton nom est une dette. »', rule: 'Campagne du Bureau des Poids. Le nom se mérite par le rendement et se perd par la conduite. Les enfants l’apprennent avant de savoir écrire leur propre nom.', sources: 'Tous les mondes; MI08, MI21.', status: 'Conçu' },
  { id: 'NA113', type: 'Affiche', name: '« Une main tient le filtre »', rule: 'Un adulte tend un filtre à un enfant derrière une vitre. Légende : « Nous ne vous abandonnons pas. » Le filtre est vendu à crédit ; la vitre est celle d’une station de tri.', sources: 'Vesper, Nacre; MI01, MI08.', status: 'Conçu' },
  { id: 'NA114', type: 'Radio', name: 'Voix de la Continuité — bulletin des rendements', rule: 'Liste quotidienne des mondes reliés, des interruptions et des charges reclassées. Lue par Néra Sand sur un ton de météo. Les noms des morts ne sont jamais prononcés, seulement les totaux.', sources: 'Toutes les planètes; PN18.', status: 'Conçu' },
  { id: 'NA115', type: 'Radio', name: 'Causerie — « La pitié est un gaspillage de rations »', rule: 'Sand explique qu’une compassion non comptée met en danger le monde entier. Elle cite des chiffres exacts et une famille qu’elle dit avoir sauvée.', sources: 'Méridien; MI25, MI28.', status: 'Conçu' },
  { id: 'NA116', type: 'École', name: 'Leçon de calcul des charges', rule: 'Les enfants comptent les unités d’un convoi : si douze charges consomment trois rations, combien en reste-t-il pour la garnison ? Le corrigé est affiché au tableau.', sources: 'Orthe; MI29.', status: 'Conçu' },
  { id: 'NA117', type: 'École', name: 'Leçon de la Dislocation', rule: 'La Dislocation est enseignée comme la faute des autonomies. L’Empire est la seule continuité possible ; douter est un privilège de monde relié.', sources: 'Orthe; MI30.', status: 'Conçu' },
  { id: 'NA118', type: 'Témoignage', name: 'Nell Ash — « J’ai cousu les noms »', rule: '« Ils nous ont appelés 4-17. J’ai cousu les noms dans la doublure. Le fil a tenu mieux qu’eux. » Le témoignage nomme des personnes, pas seulement un système.', sources: 'MI32; PN20; TE03.', status: 'Conçu' },
  { id: 'NA119', type: 'Témoignage', name: 'Tava — « Ils ont brûlé le jardin, pas la saison »', rule: '« Ce que je porte ne s’éteint pas avec moi, mais il s’éteint si personne ne l’écoute. » La restitution et la copie sont deux actes distincts.', sources: 'MI22; PN21; TE04.', status: 'Conçu' },
  { id: 'NA120', type: 'Témoignage', name: 'Deni Vorel — « Je n’ai jamais signé une mort »', rule: '« J’ai signé des transferts. Le tampon ne dit pas où l’on arrive. » Un archiviste complice peut fournir l’index sans devenir innocent.', sources: 'MI30; PN22.', status: 'Conçu' },
  { id: 'NA121', type: 'Témoignage', name: 'Ouvrier de Kharon — « La pièce revenait toujours »', rule: '« On la remettait. On ne demandait pas où elle allait. » La chaîne industrielle est faite de gestes répétés, pas de vocations criminelles.', sources: 'MI13–MI15.', status: 'Conçu' },
  { id: 'NA122', type: 'Chanson', name: '« Le compte des absents »', rule: 'Comptine de station. Les enfants y glissent les numéros de ceux qui ne sont pas revenus. La chanter est interdit ; la savoir par cœur est une preuve de séjour.', sources: 'MI32; NA109.', status: 'Conçu' },
  { id: 'NA123', type: 'Chanson', name: '« La relève »', rule: 'Chant de garnison sur la fatigue et la propreté des machines. Les soldats le chantent sans écouter les paroles ; les civils l’entendent comme une horloge.', sources: 'MI27, MI31.', status: 'Conçu' },
  { id: 'NA124', type: 'Note interne', name: '« Ne pas employer le mot déportation »', rule: 'Le mot officiel est transfert de rendement. Colonne est préféré à convoi, station à camp, charge à personne. Le Directoire vérifie la formulation des rapports avant diffusion.', sources: 'Directoire; NA99–NA108.', status: 'Conçu' },
  { id: 'NA125', type: 'Note interne', name: '« Le témoin est une charge »', rule: 'Un témoin vivant coûte plus qu’un dossier. Le Directoire ordonne la disparition d’Aline et de quiconque peut relier les signatures aux colonnes.', sources: 'MI16; FA07.', status: 'Conçu' },
  { id: 'NA126', type: 'Archive', name: 'Ordre de semis', rule: 'Un échec de récolte programmé, présenté comme sécheresse. La date précède la demande d’aide de plusieurs semaines ; le rendement attendu est calculé avant le semis.', sources: 'PT02, PT05; MI18, MI26.', status: 'Conçu' },
  { id: 'NA127', type: 'Archive', name: 'Délégation signée', rule: 'Une seule signature autorise une opération sans nommer son objet. La chaîne passe par trois bureaux : poids, dettes, continuité. Chacun peut affirmer n’avoir signé qu’un principe.', sources: 'PO03; MI30.', status: 'Conçu' },
  { id: 'NA128', type: 'Procédure', name: 'Confirmation de continuité', rule: 'Avant de quitter un monde, la garnison fait signer aux notables une déclaration de continuité rétablie. Les absents ne signent pas ; leur absence est comptée comme accord tacite.', sources: 'MI08, MI27, MI32.', status: 'Conçu' },
  { id: 'NA129', type: 'Lieu', name: 'Station de continuité', rule: 'Hangar de tri, atelier, infirmerie de fortune, hangar aux noms. Le rendement s’affiche à l’entrée ; les numéros remplacent les noms à la porte. Ce n’est pas un lieu secret : il a une adresse postale.', sources: 'MI16, MI19, MI32.', status: 'Conçu' },
  { id: 'NA130', type: 'Lieu', name: 'Bureau des charges', rule: 'Un mur de fiches, un nom par fiche, classées par rue et par rendement. Détruire le mur libère du classement et efface des droits à la ration ; copier le mur conserve les deux.', sources: 'MI30, MI32.', status: 'Conçu' },
);

/* ---------------------------------------------------------------- Contrats */
sheet('Contrats').rows.push(
  { id: 'CT17', planet: 'PL01', title: 'L’épreuve du guet', requester: 'Bureau des Poids et des Conduites (épreuve WK13)', action: 'Courir trois checkpoints de couvre-feu sans être identifié, en portant des titres de présence à un quartier promis au reclassement. Le Chacal n’a ni blindage ni place pour un passager.', outcome: 'Le quartier garde ses titres ou perd une nuit. Une chute coûte le pilote, pas la coque.', status: 'Conçu' },
  { id: 'CT18', planet: 'PL01', title: 'Le carrefour des trois conduites', requester: 'Garnison d’Orthe (épreuve WK14)', action: 'Tenir un carrefour de contrôle, trier une foule selon les fiches et décider d’ouvrir ou de fermer le cordon à une famille sans titre. La Sentinelle bloque la rue par sa seule présence.', outcome: 'Le carrefour reste ouvert ou devient une souricière. La fiche de la famille existe encore, ou a été copiée.', status: 'Conçu' },
  { id: 'CT19', planet: 'PL03', title: 'La hauteur du guet', requester: 'Cohorte des Serments (épreuve WK15)', action: 'Depuis un viaduc, marquer une colonne de reclassement pour une batterie. Le Cormoran voit des silhouettes, pas des visages ; une marque décalée tue dans le rang voisin.', outcome: 'La batterie frappe la colonne, le convoi de vivres ou le refuge. Le marquage est conservé dans le journal.', status: 'Conçu' },
  { id: 'CT20', planet: 'PL04', title: 'La soute de douze', requester: 'Service des Rations (épreuve WK16)', action: 'Transporter douze charges dans une soute non aménagée : la chaleur, le poids et les secousses changent la marche du Bison. Ouvrir la soute en route ou livrer au quai.', outcome: 'Les personnes livrées, évadées ou mortes de chaleur restent comptées séparément. La soute garde les traces.', status: 'Conçu' },
  { id: 'CT21', planet: 'PL06', title: 'La paroi des Tisserands', requester: 'Institut de la Mémoire Matérielle (épreuve WK17)', action: 'Escalader une falaise de silice de deux cent dix mètres pour ouvrir une cellule d’archive scellée. Quatre appuis rayonnants, aucune plateforme, des prises de hasard et un jet de caloporteur depuis la lèvre.', outcome: 'La cellule est ouverte, copiée ou refermée. Une chute laisse la machine et l’équipage sur la paroi ; les noms du jardin restent scellés.', status: 'Conçu' },
  { id: 'CT22', planet: 'PL05', title: 'La batterie derrière la digue', requester: 'Garnison de Sereis (épreuve WK18)', action: 'Détruire une station de continuité au tir indirect sans écraser le quartier ouvrier adossé. La Baliste doit mordre la glace avec sa bêche avant chaque salve.', outcome: 'La station tombe, le quartier encaisse ou la batterie se déplace trop tard. Les dégâts civils restent inscrits.', status: 'Conçu' },
  { id: 'CT23', planet: 'PL08', title: 'La porte de la Continuité', requester: 'Directoire de la Continuité (épreuve WK19)', action: 'Enfoncer la porte d’une station pour reprendre six cents charges. La ruée rencontre les automates de tri ; le Broyeur peut tenir la porte ouverte ou la refermer sur la file.', outcome: 'Les charges sortent, restent enfermées ou se dispersent dans les tunnels. Le bélier d’épaule ne distingue pas un garde d’un fuyard.', status: 'Conçu' },
  { id: 'CT24', planet: 'PL02', title: 'Les douze de la rampe', requester: 'Compagnies de secours libres (épreuve WK20)', action: 'Monter douze personnes par une rampe noyée avant que l’eau ne la ferme. Chaque passager change l’appui du Mulet ; deux enfants et un informateur demandent une place.', outcome: 'Le nombre réellement monté, les laissés et l’état de la rampe sont conservés. Le treuil ne remplace pas une place.', status: 'Conçu' },
);

/* --------------------------------------------------------------- Planètes */
const planet = (id, society, reveal) => {
  const row = sheet('Planètes').rows.find(r => r.id === id);
  if (!row) throw new Error(id);
  row.society = society;
  row.reveal = reveal;
};
planet('PL01',
  'Mineurs, convoyeurs et garnisons vivent de filtres fournis à crédit par Orison. Le Bureau des Poids tient un registre par rue ; une rue sans fiche n’a droit ni à l’eau ni au convoi. Les Cales-Basses existent dans les murs et pas sur le manifeste.',
  'Un rejet prétendument accidentel suit une commande de maintenance militaire antidatée. La même circulaire classe la rue voisine en charge non récupérable avant l’incident.');
planet('PL02',
  'Les communes de marée dépendent des pompes et des titres de présence. Les noyades servent à transformer des habitants sans titre en main-d’œuvre sous contrat ; les enfants sont rattachés au rendement d’un adulte, pas à leurs parents.',
  'Les inondations ne sont pas seulement des accidents : elles précèdent les colonnes et les contrats de dette. Une maison sauvée reste une maison sans titre si le registre a brûlé.');
planet('PL03',
  'Communautés humaines et Khelt entretiennent des sols symbiotiques. L’Empire y voit des rendements non déclarés. Les jardins de mémoire et les porteurs sont classés supports non autorisés ; les récoltes se synchronisent avec une faune que les colonnes déplacent.',
  'Les relevés de stérilité sont fabriqués pour justifier l’expulsion et la destruction des mémoires de culture. Effacer une langue est traité comme une opération d’assainissement, pas comme un dommage.');
planet('PL04',
  'Ouvriers spécialisés, garnisons et sous-traitants partagent une économie d’énergie dangereuse. Les stations de continuité fournissent la main-d’œuvre que les ateliers ne déclarent pas ; la chaleur sert aussi à mesurer la tolérance des châssis.',
  'Les lignes de production portent les pièces conçues pour provoquer les ruptures des terraformes. L’instruction 27 autorise la calibration sur des charges non récupérables.');
planet('PL05',
  'Observateurs climatiques et caravanes de secours conservent des historiques que l’Empire veut purger. Les stations de la banquise « perdent » leurs charges dans les tempêtes ; les bracelets de conduite signalent les fuyards sous la neige.',
  'Une archive météorologique indépendante prouve la simultanéité planifiée des désastres. Le dégel a ouvert une fosse que l’Empire classe en aléa climatique.');
planet('PL06',
  'Les Accords Khelt organisent des cités indépendantes autour d’archives matérielles partagées. L’Institut de la Mémoire Matérielle y voit des supports à déclarer ; les porteurs vivants sont des catégories C à « préserver » sous contrôle.',
  'L’effacement des archives n’est pas un dommage secondaire : les ordres nomment des écoles, des lignées, des langues et des porteurs. La restitution est une dette, pas une faveur.');
planet('PL07',
  'Grenier impérial protégé par des milices locales ; les villes du cœur ignorent l’origine de leur abondance. Le code des bouches attache la ration au rendement, et la Chambre des Dettes convertit les sécheresses en créances.',
  'Les contrats révèlent le financement de PALINODE par les rations et crédits du centre. La famine d’un secteur est le prix comptable du ravitaillement d’un autre.');
planet('PL08',
  'Fonctionnaires, vétérans, familles et dissidents vivent sous une surveillance normalisée. Le Bureau des Poids tient le mur des charges ; les Chambres de Vérité enregistrent les confirmations ; les stations de continuité ont une adresse et un rendement affiché.',
  'Les décisions signées et les journaux de délégation relient le programme à la hiérarchie dirigeante. Détruire le registre libère du classement et efface des droits : la vérité et la protection ne sont pas le même acte.');

/* --------------------------------------------------------------- Campagne */
const campaign = (id, play, truth, consequence) => {
  const row = sheet('Campagne').rows.find(r => r.id === id);
  if (!row) throw new Error(id);
  if (row.status !== 'Conçu') throw new Error(`${id} must remain designed.`);
  row.play = play; row.truth = truth; row.consequence = consequence;
};
campaign('MI15',
  'Descendre un laboratoire que la sécurité privée purge étage par étage. Les salles de calibration retiennent des charges C utilisées pour mesurer la tolérance thermique des châssis ; chaque porte ouverte coûte du temps et de la place. Extraire Aline, ses schémas et, si la coque le permet, les personnes encore vivantes.',
  'L’instruction 27 porte la signature d’Aline : les essais ont été autorisés, pas seulement subis. Les ordres d’arrêt viennent d’une délégation de la Continuité. Aline reconnaît sa part et refuse de la réduire à une erreur de laboratoire.',
  'TE02 vivant, PT04 copié, et des corps que l’équipage doit décider d’embarquer. La dissension avec Ilan devient ouverte : il a vu les salles et compte les places disponibles.');
campaign('MI16',
  'Préparer deux voies de sortie et répartir un poids fini entre caisses de preuves, personnes et pièces de rechange. Une colonne de trois cent quarante charges attend au hangar voisin ; l’ordre de disparition d’Aline circule déjà dans les transmissions.',
  'Le Directoire ne veut ni procès ni témoins. Le rapport signé doit déclarer « continuité rétablie » ; la navette n’a pas de place pour tout, et chaque caisse montée retire une place.',
  'Défection opérationnelle. Ce qui monte à bord existe et est nommé ; ce qui reste est compté et poursuivi par la Cohorte. Perte des dépôts impériaux.');
campaign('MI17',
  'Marcher sur une banquise sondée, choisir la route lente ou la crête exposée, et décider si les fuyards d’une colonne prennent la place du ravitaillement. La glace porte mal deux charges ; chaque personne embarquée retire une caisse.',
  'La station voisine a « perdu » ses charges dans la tempête. Les fuyards ont des numéros cousus et aucun titre de présence. La Ligue aide sous conditions : ce n’est pas un pardon.',
  'Carburant, chaleur, places et intégrité du marcheur. Le froid tue ce qu’on laisse ; une caisse abandonnée n’est pas un choix neutre.');
campaign('MI18',
  'Rétablir une antenne, protéger trois batteries et copier l’archive avant la coupure. Le dégel a ouvert une fosse que l’ordre impérial classe en aléa climatique ; les relevés doivent être sortis avant la perte d’alimentation.',
  'Les ordres de semis précèdent les demandes d’aide. Les dates rendent la thèse accidentelle intenable, et la fosse n’est pas un accident non plus.',
  'PT05 corrélé. Publier les dates expose les fuyards ; les taire laisse la fosse sans nom. La copie survit à la perte de l’antenne.');
campaign('MI19',
  'Organiser une traversée sur les plaques solides, immobiliser les traqueurs et choisir quelles familles montent avant la fermeture. Les bracelets de conduite signalent les enfants ; les chiens suivent les titres révoqués à travers la foule.',
  'Un membre de la Ligue a transmis les coordonnées trop tôt. La colonne n’emporte pas des travailleurs : elle prend les dépendants pour séparer les familles productives.',
  'Comptage nominal des évacués et des laissés. Mara juge les lits, pas les intentions. Le réseau doit répondre de sa fuite.');
campaign('MI20',
  'Duel contre Edda Renn sur une station fissurée. La chambre de vérité du niveau bas enregistre des confirmations ; on peut la libérer, la sceller ou passer. Chaque choix laisse des personnes derrière une porte ou sur la glace.',
  'Edda a reçu les preuves et ne peut pas abandonner ses blessés. Les prisonniers ne demandent pas une libération spectaculaire mais un enregistrement qui ne soit pas retourné contre eux.',
  'Passage négocié, prisonnière ou ennemie durable. Libérer la chambre sans protection produit une fuite sur la glace ; la sceller laisse les confirmations intactes.');
campaign('MI21',
  'Traverser des sols résonants à cadence basse, arrêter un automate intrus et respecter les voies signalées. Les porteurs reconnaissent la silhouette du châssis avant de reconnaître la pilote.',
  'Votre machine ressemble à celle qui a scellé un jardin. Le titre de présence est une dette ; les Khelt comptent autrement, et le disent.',
  'Accès négocié. Endommager les archives ferme une voie diplomatique sans bloquer la campagne ; la confiance de Leth et celle d’Hadr restent séparées.');
campaign('MI22',
  'Protéger des supports fragiles, isoler les brouilleurs et récupérer l’ordre de purge. Les porteurs dont le corps garde la mémoire sont classés catégorie C ; les sortir coûte des places et du temps.',
  'Les cibles nommées sont des écoles, des langues, des filiations et des porteurs. L’effacement n’est pas un dommage collatéral : c’est le programme.',
  'PO01 et TE04. Une archive copiée survit ; un porteur tué ne se reconstitue pas. La restitution reste une dette vérifiable, pas une générosité.');
campaign('MI23',
  'Tenir un périmètre pendant une rencontre, empêcher un attentat de radicaux et escorter les délégations sans confisquer leurs armes. Un prisonnier impérial veut parler ; une faction veut le pendre devant les caméras.',
  'Hadr exige autonomie et restitution. La Ligue n’est pas innocente : elle a transmis des coordonnées et veut une vengeance. Les deux vérités tiennent ensemble.',
  'Pacte, engagement de restitution et capacité à tenir un cessez-le-feu. Sera doit appliquer à ses alliés les règles qu’elle imposait à l’Empire.');
campaign('MI24',
  'Défendre plusieurs relais et choisir entre protéger les témoins sur place et renforcer le canal de diffusion. Le dossier contient le registre des charges et les noms cousus ; le diffuser expose des familles entières.',
  'Les trois familles de preuves se recoupent. Publier les sources brutes livre des personnes au reclassement ; publier seulement les conclusions laisse le Directoire nier.',
  'Portée et qualité distinctes de la survie des témoins. L’insurrection devient publique ; le Directoire aussi.');
campaign('MI25',
  'Protéger des machines civiles, contourner des serres et désarmer une batterie qui utilise un silo comme bouclier. La ration punitive est déjà appliquée au secteur voisin ; le quota du centre exige que d’autres restent sous le seuil.',
  'La famine est administrée. Jo connaît le chiffre et le cache parce qu’il doit choisir quel quartier mange. Personne ne propose une solution sans perte.',
  'Stocks et confiance. Un silo touché affame un quartier nommé ; les rations sont une arme, pas une générosité.');
campaign('MI26',
  'Neutraliser la défense par les alimentations militaires, maintenir les pompes civiles et copier les contrats. Le mur des fiches relie chaque catastrophe à une dette et chaque dette à une signature.',
  'Les bénéfices des catastrophes financent les rations bon marché d’Orthe. Des fonctionnaires signent sans lire ; d’autres lisent et appellent cela de la continuité.',
  'PO02, réseaux d’eau tenus, soutien de fonctionnaires dissidents. Détruire les fiches efface des droits autant que des crimes.');
campaign('MI27',
  'Couvrir une négociation, tenir les groupes impatients et escorter les soldats désarmés jusqu’au point convenu. Une cellule de la Ligue veut violer l’accord et filmer une exécution.',
  'La garnison a exécuté la circulaire 9-B la semaine précédente. Les soldats sont des exécutants et des voisins ; les deux faits tiennent ensemble.',
  'Fiabilité du pacte, survivants de la garnison et attitude d’Ilan. Une exécution rend la reddition impossible ailleurs.');
campaign('MI28',
  'Séparer un train de ravitaillement d’une batterie mobile, protéger les aiguillages et répartir les wagons. Chaque wagon envoyé au front est retiré à un secteur nommé.',
  'Approvisionner l’offensive seule gagnerait du temps en affamant des secteurs déjà fragiles. Le choix est un partage, pas une collecte.',
  'Logistique du dernier acte, confiance des communes et population évacuée. Aucune répartition ne satisfait tout le monde.');
campaign('MI29',
  'Progression basse sous les portiques, coopération avec les ateliers en grève et désactivation d’identifiants impériaux. Sous la chaîne, une chambre de mesure où les châssis étaient calibrés sur des charges C.',
  'Les ouvriers ont fabriqué les berceaux de calibration sans savoir. Certains refusent d’aider tant que les faits restent vagues ; d’autres veulent que la chambre soit montrée, pas seulement détruite.',
  'Accès de secours ouvert. Les anciens contacts réapparaissent selon les preuves diffusées. La chambre reste un lieu de la campagne, pas un niveau supplémentaire.');
campaign('MI30',
  'Franchir les terrasses sans effondrer les voies basses, contenir la contre-attaque et tenir les ascenseurs civils. Le bureau des charges est un mur de fiches, un nom par fiche, classé par rue et par rendement.',
  'La responsabilité est distribuée entre signatures, délégations et tampons. Détruire le mur libère du classement et efface des droits à la ration ; le copier conserve les deux.',
  'PO03 et le choix du mur : copier, saisir, détruire ou publier. Les témoins du centre et les archives ne sont pas la même protection.');
campaign('MI31',
  'Affronter le marcheur de Holt ; casser son armement ou obtenir un passage en tenant un corridor de secours sous ses yeux. Il a ordonné le verrouillage de trois districts après un sabotage.',
  'Holt peut reconnaître les faits et refuser l’effondrement de l’armée. Le verrouillage est une représaille collective : un acte, trois districts, aucun nom.',
  'Sort de Holt, de la Cohorte et du corridor. Aucune discussion ne ressuscite les pertes ; aucun ordre ne les annule.');
campaign('MI32',
  'Tenir trois sites : arrêt des terraformes, station de preuves et voie d’évacuation. La station de continuité d’Orthe retient quatre mille charges ; Norn propose de sauver le réseau en effaçant les ordres.',
  'Le réseau peut survivre sans les archives ; les archives peuvent survivre sans le réseau. Nell et les noms cousus peuvent être publiés ou protégés, pas les deux sans coût.',
  'FI01–FI04 selon preuves, survie, coalition et continuité. Les épilogues montrent les lieux et les noms, pas un score.');

/* ------------------------------------------------------------------ Méta */
bible.meta.version = '0.16.0';
bible.meta.date = '2026-11-18';
bible.meta.previousRelease = { version: '0.15.11', recordCount: 1007 };
bible.meta.canon = {
  regime: 'docs/CANON_EMPIRE.md',
  chassisTrials: 'docs/EPREUVES_CHASSIS.md',
  campaign: 'docs/CAMPAIGN_FR.md',
};
bible.meta.scope = 'MI01–MI14 jouables au stade prototype ; MI15–MI32, les seize contrats et les huit épreuves de châssis restent conçus. La 0.16 ajoute 61 fiches au canon de la Continuité : cinq principes de représentation, quatre systèmes de classement et de dette, quatre unités de répression, huit portraits d’exécutants et de victimes, trente-deux documents (décrets, formulaires, registres, propagande, témoignages, lieux) et huit épreuves de châssis. 1 068 fiches, 20 onglets de conception, 133 critères initiaux conservés. Aucun statut promu, aucune fiche ni aucun ID retiré, aucune mission rendue jouable.';

/* -------------------------------------------------------------- Contrôles */
const afterIds = bible.sheets.flatMap(s => s.rows.map(r => r.id));
if (new Set(afterIds).size !== afterIds.length) throw new Error('Duplicate source ID after update.');
for (const id of beforeRows.keys()) if (!afterIds.includes(id)) throw new Error(`Lost source ID ${id}`);
const counts = {};
for (const s of bible.sheets) counts[s.name] = s.rows.length;
if (counts.Vision !== 33 || counts['Systèmes'] !== 139 || counts.Ennemis !== 40) throw new Error(JSON.stringify(counts));
if (counts.Personnages !== 22 || counts.Narration !== 130 || counts.Contrats !== 24) throw new Error(JSON.stringify(counts));
if (sheet('Campagne').rows.length !== 32) throw new Error('Campaign must keep 32 missions.');
bible.meta.sheetCount = bible.sheets.length;
bible.meta.recordCount = bible.sheets.reduce((n, s) => n + s.rows.length, 0);
if (bible.meta.recordCount !== 1068) throw new Error(`Unexpected record count ${bible.meta.recordCount}`);

writeFileSync(file, `${JSON.stringify(bible, null, 2)}\n`);
console.log(JSON.stringify({ version: bible.meta.version, rows: bible.meta.recordCount, sheets: bible.meta.sheetCount, added: afterIds.length - beforeIds.length, preserved: beforeIds.length }));
