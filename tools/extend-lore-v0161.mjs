#!/usr/bin/env node
/**
 * Complément de chronique 0.16.1 — histoire, géographie, cultures, équipage et fins.
 * Additif : 63 fiches nouvelles, aucune fiche ni aucun ID retiré, aucun statut promu,
 * aucune mission rendue jouable. La version applicative reste 0.16.0 ; ce complément
 * ne change ni code, ni style, ni asset, donc aucune reconstruction autonome n'est requise.
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
if (beforeIds.length !== 1068 || new Set(beforeIds).size !== 1068) {
  throw new Error('Expected 1,068 unique source IDs as the 0.16 baseline.');
}
const beforeStatus = new Map(bible.sheets.flatMap(s => s.rows.map(r => [r.id, r.status])));

/* ------------------------------------------------------------------ Vision */
sheet('Vision').rows.push(
  {
    id: 'VI34', theme: 'Le titre est une accusation',
    decision: '« Ordre de cendre » est le nom que les soldats donnent à l’annexe C du DC-7 : la réduction en cendre des supports non autorisés après une relève. Le titre ne désigne ni une prophétie ni un ordre chevaleresque, mais un formulaire administratif que Sera transporte. « Chaque pas laisse une trace » est la thèse contraire : la cendre est la tentative d’effacer la trace.',
    acceptance: 'Le joueur rencontre le formulaire avant d’entendre le titre, et aucun personnage ne l’explique deux fois. Aucune scène ne transforme la cendre en esthétique gratuite.',
    status: 'Conçu',
  },
  {
    id: 'VI35', theme: 'Un monde clos, semé et daté',
    decision: 'Dix-neuf mondes furent semés, onze sont morts dans la Dislocation, huit restent reliés par la Ligne. La campagne occupe l’année EC 61, du recompte au dégel. Chaque mission porte une date, un temps de transit et une saison ; rien n’existe hors des huit mondes, de leurs habitants et de la Ligne.',
    acceptance: 'Toute mission possède une date EC et un transit cohérent avec la carte du bassin. Un fait daté ne se réécrit pas ; une archive détruite ne rend pas sa date.',
    status: 'Conçu',
  },
  {
    id: 'VI36', theme: 'Des fins complètes, sans score',
    decision: 'Quatre familles de fins, chacune avec des conditions vérifiables, un épilogue par lieu connu et un coût explicite. Aucune fin ne rend toutes les pertes réversibles ; aucune ne récompense la pureté. Le dénouement se calcule sur les preuves, les services tenus, les pactes, la diffusion, l’équipage et les témoins vivants.',
    acceptance: 'Chaque fin possède au moins une condition technique, une condition testimoniale et une condition politique ; ses sept épilogues citent des lieux déjà joués et des personnes déjà rencontrées.',
    status: 'Conçu',
  },
  {
    id: 'VI37', theme: 'Complétude honnête',
    decision: 'Un jeu complet se décrit par un périmètre fini : huit mondes, trente-deux missions, seize contrats, huit épreuves, quatre fins, un codex des faits, douze châssis, les systèmes de combat et de dossier. La bible distingue le catalogue conçu de ce qui est livré, et publie la liste de ce qui manque.',
    acceptance: 'Aucun document ne confond catalogue et livraison. La liste de complétude renvoie à des IDs vérifiables et signale les critères humains encore ouverts.',
    status: 'Conçu',
  },
);

/* -------------------------------------------------------------- Systèmes */
sheet('Systèmes').rows.push(
  {
    id: 'SY140', system: 'Journal des faits',
    design: 'Un codex qui consigne ce que l’équipage a réellement appris : lieu, date EC, source, provenance, ce qui a été copié, perdu ou refusé. Il n’explique pas la morale des faits et ne complète jamais une source détruite. Il reste consultable en pause et hors mission.',
    counterplay: 'Aucun. La consultation ne modifie pas le dossier ; un fait non acquis n’apparaît pas, et une rumeur reste marquée comme rumeur.',
    acceptance: 'Chaque entrée du journal renvoie à un fait simulé ou à un document réellement lu. Une source perdue laisse une entrée de perte, jamais une reconstitution.',
    priority: 'P0', status: 'Conçu',
  },
  {
    id: 'SY141', system: 'Dates, saisons et transit',
    design: 'Les missions sont datées dans le calendrier EC (dix mois de 36 jours et cinq jours de relève). Le transit entre mondes consomme des jours et déplace la saison : marée de Nacre, glace de Sereis, récolte de Méridien, chaleur de Kharon. Une date affichée vient de la simulation, pas d’un décor.',
    counterplay: 'Choisir un détour, attendre une marée ou renoncer à un contrat. Le temps perdu n’est jamais rendu ; un contrat fermé le reste.',
    acceptance: 'Une mission ne peut pas changer de date en cours de route. Les effets saisonniers annoncés sont ceux que la simulation applique.',
    priority: 'P1', status: 'Conçu',
  },
  {
    id: 'SY142', system: 'Cargaison de bord',
    design: 'La Veilleuse possède deux berceaux de marcheur, une cale de pièces, une réserve d’eau, des places pour les personnes et un carnet tenu par l’infirmier. Chaque caisse montée retire une place ; chaque personne embarquée retire une caisse. La capacité est finie et connue avant le choix.',
    counterplay: 'Répartir, laisser, transférer à un contact ou renoncer à une preuve. Un transfert réel change le poids et le compte.',
    acceptance: 'Le poids embarqué est réconcilié après chaque chargement. Aucune place n’est créée par un dialogue ou par une relecture.',
    priority: 'P0', status: 'Conçu',
  },
  {
    id: 'SY143', system: 'Résolution des fins',
    design: 'La fin combine quatre axes : preuves (techniques, testimoniales, politiques), continuité matérielle (eau, air, soins, nourriture), alliances tenues (pactes, restitutions) et protection des témoins. Le calcul est déterministe et documenté ; il sélectionne une famille et ses sept épilogues locaux.',
    counterplay: 'Le joueur agit sur les axes par des actes de mission, pas par un dernier dialogue. Une preuve diffusée trop tôt ferme certaines issues.',
    acceptance: 'Un dossier ne peut pas atteindre une fin sans ses conditions. Aucun épilogue ne contredit un fait du journal ; les pertes restent nommées.',
    priority: 'P0', status: 'Conçu',
  },
);

/* -------------------------------------------------------------- Factions */
sheet('Factions').rows.push(
  {
    id: 'FA10', name: 'Bureau des Recomptes',
    motive: 'Corriger les comptes pour sauver des personnes précises, un chiffre à la fois.',
    means: 'Greffiers, archivistes et agents de guichet qui modifient des fiches, rouvrent des titres et détournent des lots. Pas d’armes, pas de uniforme, des horaires de bureau.',
    contradiction: 'Chaque fiche sauvée en condamne une autre, et le réseau le sait : il tient sa propre comptabilité des remplacements.',
    relations: 'Infiltre FA01 ; méfié par FA03 qui le juge complice ; chassé par FA07 quand un recompte ne tombe pas juste.',
    status: 'Conçu',
  },
  {
    id: 'FA11', name: 'Veilleurs de Sereis',
    motive: 'Conserver des séries de mesures antérieures à l’Empire et ne rien vendre.',
    means: 'Observatoires, caves de glace, cahiers doublés, piste de traîneaux. Une neutralité stricte, coûteuse et parfois lâche.',
    contradiction: 'Leur neutralité protège les registres et abandonne les personnes qui les tiennent ; ils refusent d’évacuer sans leurs cahiers.',
    relations: 'Tolérés par FA01 tant qu’ils ne publient pas ; courtisés par FA03 et FA05 ; détestés par FA07.',
    status: 'Conçu',
  },
  {
    id: 'FA12', name: 'Tisserands d’Ilex',
    motive: 'Garder les fils de mémoire des cités et empêcher qu’on les copie sans dette.',
    means: 'Jardins de mémoire, gestes et résonances, registres tissés, refus opposables. Aucune armée, mais un droit d’accès qu’ils peuvent retirer.',
    contradiction: 'Ils défendent une mémoire qui ne se traduit pas entièrement : toute restitution humaine en trahit une part.',
    relations: 'Composante autonome de FA05 ; hostiles à l’IMM ; alliés conditionnels de FA03, jamais de FA01.',
    status: 'Conçu',
  },
);

/* ------------------------------------------------------------ Personnages */
sheet('Personnages').rows.push(
  {
    id: 'PN23', name: 'Hela Brunt', role: 'Maîtresse du transport-atelier La Veilleuse',
    desire: 'Garder son bateau et son équipage vivants, et ne plus jamais servir de couverture à une colonne.',
    arc: 'Ancienne capitaine de secours de la génération de la Dislocation. Elle accepte de transporter des marcheurs, refuse que La Veilleuse tire. À MI16, elle choisit ce qui monte à bord ; à MI32, elle choisit où le bateau finit.',
    faction: 'FA08', status: 'Conçu',
  },
  {
    id: 'PN24', name: 'Kader Oyun', role: 'Chef de pont et d’arrimage',
    desire: 'Que le poids soit juste, parce qu’un arrimage faux tue plus vite qu’une balle.',
    arc: 'Originaire de Kharon, il a une sœur dans une station de continuité. Il compte les caisses et les places à voix haute, et refuse de falsifier un manifeste même pour sauver quelqu’un.',
    faction: 'FA08', status: 'Conçu',
  },
  {
    id: 'PN25', name: 'Milo Traen', role: 'Infirmier de bord',
    desire: 'Tenir le carnet des places : qui est monté, qui est resté, qui est mort où.',
    arc: 'Formé par Mara par radio, il n’a jamais vu un hôpital impérial. Il juge les lits, pas les intentions, et devient la mémoire civile de l’équipage.',
    faction: 'FA08', status: 'Conçu',
  },
  {
    id: 'PN26', name: 'Jun Otxoa', role: 'Veilleur radio',
    desire: 'Écouter assez longtemps pour entendre ce que les transmissions ne disent pas.',
    arc: 'Sourd d’une oreille, il reconstruit les messages à partir de fragments. Il fournit les écoutes qui rendent les choix possibles, et paie chaque écoute d’une exposition.',
    faction: 'FA01→FA03', status: 'Conçu',
  },
  {
    id: 'PN27', name: 'Ysolde Karr', role: 'Préfète-adjointe du Directoire',
    desire: 'Prendre la place de Norn sans rendre le programme, et transformer les archives en monnaie d’échange.',
    arc: 'Propose à Sera un exil propre et une réforme sans procès. Elle n’est pas cruelle : elle est compétente, et c’est pour cela qu’elle est dangereuse.',
    faction: 'FA07', status: 'Conçu',
  },
  {
    id: 'PN28', name: 'Sorel Dain', role: 'Directeur des terraformes chez Orison',
    desire: 'Prouver que la dépendance est une sécurité et que l’autonomie tue.',
    arc: 'Peut montrer les carnets d’entretien ou les faire disparaître. Il ne croit pas au complot : il croit à la continuité comme à une assurance.',
    faction: 'FA02', status: 'Conçu',
  },
  {
    id: 'PN29', name: 'Ove Sarn', role: 'Veilleur de l’observatoire de Sereis',
    desire: 'Sauver ses séries de mesures, puis les personnes, dans cet ordre assumé.',
    arc: 'Refuse l’évacuation sans ses cahiers. Il distingue toujours la preuve du secours et le dit à ceux qui veulent les confondre.',
    faction: 'FA11', status: 'Conçu',
  },
  {
    id: 'PN30', name: 'Petra Noll', role: 'Ingénieure des communes de Nacre',
    desire: 'Que l’eau reste aux communes qui la pompent, sans qu’un titre impérial la leur prête.',
    arc: 'Négocie chaque pièce et chaque lot. Elle peut refuser un accord qui sépare l’eau du titre, même si le refus coûte une maison.',
    faction: 'FA03', status: 'Conçu',
  },
  {
    id: 'PN31', name: 'Ish des Tisserands', role: 'Gardien de fil d’Ilex',
    desire: 'Que la mémoire de sa cité ne devienne ni un échantillon impérial ni une pièce de musée humaine.',
    arc: 'Autorise ou retire l’accès aux jardins. Il juge Leth trop liée aux humains et le dit devant elle ; son refus n’est pas une trahison.',
    faction: 'FA05', status: 'Conçu',
  },
  {
    id: 'PN32', name: 'Gan Vey', role: 'Adjoint au guichet du Bureau des Poids',
    desire: 'Que le compte tombe juste, parce qu’un compte faux fait mourir quelqu’un d’autre.',
    arc: 'Frère cadet de Sera, il croit à l’arithmétique plus qu’à sa sœur. Il peut ouvrir un mur de fiches ou le défendre, selon ce qu’on lui montre et ce qu’on protège.',
    faction: 'FA01', status: 'Conçu',
  },
  {
    id: 'PN33', name: 'Ada Rusk', role: 'Vétérane, sœur d’Ilan',
    desire: 'Que le nom des Rusk reste honorable et que son frère rentre sans avoir à renier l’uniforme.',
    arc: 'Amputée après un sauvetage de convoi, elle défend l’armée qui l’a sauvée. Elle rappelle à Ilan que la loyauté se prouve par des actes, pas par un pardon.',
    faction: 'FA01', status: 'Conçu',
  },
  {
    id: 'PN34', name: 'Emre Calt', role: 'Greffier des Chambres de Vérité',
    desire: 'Écrire la phrase recevable, la seule qui protège la ville de la panique.',
    arc: 'Corrige les formulations sans jamais torturer. Il conserve les brouillons corrigés et peut prouver le système par sa grammaire ; il est fier de son travail et c’est ce qui le rend insupportable.',
    faction: 'FA01', status: 'Conçu',
  },
);

/* -------------------------------------------------------------- Narration */
sheet('Narration').rows.push(
  { id: 'NA131', type: 'Chronique', name: 'Les Semeurs', rule: 'Avant les comptes, dix-neuf mondes furent semés : atmosphères, sols, eaux et filtres posés par des ingénieurs dont on ne connaît ni le nom ni la fin. Leurs machines fonctionnent encore ; personne ne sait les refaire entièrement. L’Empire les appelle « les Absents » et se présente comme leur seul héritier légitime.', sources: 'PL01–PL08 ; MI10, MI21 ; NA132.', status: 'Conçu' },
  { id: 'NA132', type: 'Chronique', name: 'La Ligne', rule: 'Les dix-neuf mondes étaient reliés par une chaîne de relais qui transporte la voix et le texte, jamais la matière. Les personnes et les preuves voyagent par remorqueur, en jours ou en semaines. Toute archive physique vaut donc plus qu’une transmission : on coupe un relais, pas un coffre.', sources: 'MI12, MI18, MI24 ; SY138.', status: 'Conçu' },
  { id: 'NA133', type: 'Chronique', name: 'La Dislocation', rule: 'Onze mondes cessèrent de respirer en onze mois. Aucun décompte fiable n’existe : les registres ont brûlé avec les mondes, et l’Empire n’a jamais publié de bilan. L’école impériale parle d’une faute des autonomies ; trois versions circulent, et la campagne n’en tranche aucune avant l’acte IV.', sources: 'NA117 ; PL05 ; MI26 ; NA169.', status: 'Conçu' },
  { id: 'NA134', type: 'Chronique', name: 'L’Acte de Relève', rule: 'Orthe, seul monde dont le régulateur et les chantiers survécurent, proposa secours et tutelle aux huit mondes restants. L’acte fut signé par des notables sans quorum et ratifié par un Conseil de Relève qui ne se réunit plus que pour valider. DC-7 en découle : la dette ne s’éteint pas.', sources: 'NA99 ; FA01 ; FA07 ; MI32.', status: 'Conçu' },
  { id: 'NA135', type: 'Chronique', name: 'Les guerres de recompte', rule: 'Entre EC 8 et EC 21, trois mondes refusèrent le recensement. La Cohorte des Serments fut créée pour les reprendre sans mobiliser l’armée régulière : des pilotes d’élite, une logistique privilégiée, des unités sans insigne de garnison. La doctrine du contre-pilotage vient de là.', sources: 'FA09 ; PN13 ; MI20, MI31.', status: 'Conçu' },
  { id: 'NA136', type: 'Chronique', name: 'La fondation de PALINODE', rule: 'En EC 24, une panne de pompe à Nacre précéda de trois semaines une demande de secours. Elle avait été réglée par un calendrier d’entretien. Le Directoire appela le procédé PALINODE, d’après une vieille chanson de relève : « ce qui revient pour dire la même chose ». Le programme n’a jamais été voté ; il a été constaté.', sources: 'NA126 ; MI05, MI06, MI26 ; FA07.', status: 'Conçu' },
  { id: 'NA137', type: 'Chronique', name: 'L’année des recomptes', rule: 'Tous les dix ans, les huit mondes reliés envoient leurs registres à Orthe pour recompte. EC 61 est une année de recompte : les quotas se resserrent, les catégories se révisent, les colonnes se remplissent. La campagne commence neuf jours avant la clôture.', sources: 'MI01, MI08, MI30 ; SY136.', status: 'Conçu' },
  { id: 'NA138', type: 'Chronique', name: 'L’ordre de cendre', rule: 'L’annexe C du DC-7 ordonne, après « continuité rétablie », la réduction en cendre des supports non autorisés. Les soldats l’appellent l’ordre de cendre. Il ne figure pas dans les briefings : il est déjà dans le dossier, à la dernière page, et il suffit de l’exécuter. La campagne porte ce nom parce que l’équipage finit par le prononcer.', sources: 'NA99, NA103, NA159 ; MI22, MI30 ; VI34.', status: 'Conçu' },
  { id: 'NA139', type: 'Chronologie', name: 'EC 61 — repères datés', rule: 'EC 0 : Acte de Relève. EC 3 : tutelle de Vesper. EC 8 : Cohorte. EC 12 : révolte des Recomptes. EC 19 : hiver des registres. EC 23 : premier ordre de cendre à Ilex. EC 24 : PALINODE. EC 31 : premiers essais de calibration. EC 39 : instruction 27. EC 44 : recompte des absents. EC 52 : Norn préfète. EC 58 : Cales-Basses scellées. EC 61 : la campagne, de la clôture du recompte au dégel.', sources: 'NA133–NA138 ; MI01–MI32.', status: 'Conçu' },
  { id: 'NA140', type: 'Calendrier', name: 'Dix mois et cinq jours de relève', rule: 'L’année dure 365 jours : dix mois de 36 jours et cinq jours de relève, hors mois, consacrés aux comptes et aux morts. Les mois portent Semaille, Pluie, Compte, Poids, Veille, Cendre, Relève, Sel, Fonte, Sceau. Une date s’écrit « 12 Compte EC 61 ». Les missions consignent leur jour ; un fait daté ne se réécrit pas.', sources: 'NA139 ; tous les dossiers ; SY141.', status: 'Conçu' },
  { id: 'NA141', type: 'Rite', name: 'La Veillée', rule: 'On veille un mort une nuit, sans discours. On pose près du corps un objet de son métier : un filtre, une clé, un outil, un jeton de quai. À l’aube, on dit son nom une fois. L’Empire a remplacé la veillée par une déclaration de continuité dans les stations ; les familles la font quand même, en silence, dans les couloirs.', sources: 'MI19, MI22, MI32 ; NA128.', status: 'Conçu' },
  { id: 'NA142', type: 'Rite', name: 'Le fil', rule: 'Chez les Khelt, un nom se tisse : chaque fil porte une voix, une date, une dette. Le fil ne s’écrit pas, il se tend entre deux personnes et se transmet par contact. Copier un fil sans accord est un vol ; le brûler est un meurtre différé. Les noms cousus des stations humaines viennent d’un malentendu : un enfant a vu un fil et l’a imité avec une aiguille.', sources: 'PN21 ; NA122 ; MI22.', status: 'Conçu' },
  { id: 'NA143', type: 'Langue', name: 'Le parler de relève', rule: 'La langue officielle préfère le passif, le numéro et le délai : « la fiche a été révisée », « le douze est au traitement », « la continuité est rétablie ». Elle ne ment pas : elle retire l’agent. Les habitants répondent par des phrases courtes qui ne nomment personne non plus, mais pour une autre raison.', sources: 'NA99–NA130 ; VI31.', status: 'Conçu' },
  { id: 'NA144', type: 'Langue', name: 'Le khelt', rule: 'Le khelt se parle par résonances : une phrase est un accord, un nombre est un intervalle. Les traducteurs impériaux entendent des mots là où il y a des durées, et rendent « évacuation » pour un avertissement qui disait « la saison se déplace ». Aucune restitution française n’est une transcription : le codex le dit, jamais une réplique.', sources: 'MI11 ; PN06, PN31 ; SY108.', status: 'Conçu' },
  { id: 'NA145', type: 'Économie', name: 'La ration, la créance et le lot', rule: 'Trois unités gouvernent la vie matérielle : la ration (ce qu’une bouche reçoit), la créance (ce qu’un secours coûte) et le lot (ce qu’un atelier peut consommer). Il n’existe pas de monnaie commune, seulement des droits et des dettes. Un monde peut donc être riche en eau et insolvable en air.', sources: 'NA102 ; SY137 ; MI25, MI28.', status: 'Conçu' },
  { id: 'NA146', type: 'Économie', name: 'Le prix d’un pas', rule: 'Un marcheur consomme du carburant, des cartouches, des kits et des pièces propriétaires. Chaque pas use des semelles que seul Orison fabrique. L’armée tient un compte par machine, et ce compte explique pourquoi une réparation de guerre n’est jamais gratuite. Refuser un ordre, c’est aussi refuser son approvisionnement.', sources: 'SY40 ; MI16 ; PN28.', status: 'Conçu' },
  { id: 'NA147', type: 'Technique', name: 'Les terraformes', rule: 'Trois familles d’installations : l’air (filtres, épurateurs), l’eau (pompes, digues, canaux) et le sol (semences, symbiontes, régulateurs thermiques). Elles tiennent mal ensemble : couper l’eau compromet le sol, forcer l’air épuise les filtres. Un terraforme n’est pas une machine unique mais un réseau dont personne ne possède le plan complet.', sources: 'MI04, MI06, MI10, MI26 ; FA02.', status: 'Conçu' },
  { id: 'NA148', type: 'Technique', name: 'Le marcheur', rule: 'Les routes des mondes sinistrés ne portent plus les véhicules lourds. Le marcheur franchit une conduite, monte un escalier, enjambe un chenal et pose son pied là où une roue s’enliserait. Il est aussi un objet administratif : un numéro de châssis, une fiche de dette, un propriétaire. Sa masse est une décision politique.', sources: 'WK01–WK12 ; VI30 ; MI01, MI30.', status: 'Conçu' },
  { id: 'NA149', type: 'Technique', name: 'La calibration', rule: 'Un châssis neuf doit prouver sa tolérance à la chaleur, aux agents chimiques et aux chocs. Les bancs existent depuis EC 31. À partir de l’instruction 27, les sujets ne sont plus des instruments mais des catégories C, désignées par un numéro de fiche. La même installation produit un certificat et un charnier ; le jeu ne montre que le certificat, et laisse le registre.', sources: 'NA105 ; MI15, MI29 ; PN09.', status: 'Conçu' },
  { id: 'NA150', type: 'Lieu', name: 'Orthe, la capitale en terrasses', rule: 'Orthe s’élève par paliers : le Parvis des Sceaux, où siège le Conseil de Relève ; les Ateliers enterrés, où l’on fabrique les châssis ; le Mur des charges, où le Bureau des Poids tient une fiche par nom ; les Escaliers, où vivent ceux qui servent le centre ; la Gare des relèves, d’où partent les ordres. On monte par des escaliers mécaniques qui tombent souvent en panne.', sources: 'PL08 ; MI29–MI32 ; NA130.', status: 'Conçu' },
  { id: 'NA151', type: 'Lieu', name: 'Les Cales-Basses', rule: 'Sous Vesper, les galeries abandonnées forment un quartier sans adresse : les Cales-Basses. On y accède par des regards d’aération et des descenderies que le Bureau des Poids ne recense pas. L’air y est filtré par des bricolages de mineurs ; une rue des Cales n’a ni eau ni convoi, mais elle a des noms que personne n’écrit ailleurs.', sources: 'PL01 ; MI01, MI03 ; PN14.', status: 'Conçu' },
  { id: 'NA152', type: 'Lieu', name: 'Aval et la digue', rule: 'Aval est la dernière ville avant la mer ouverte : deux portes, un bassin, un quai où l’on écrit les noms à la craie à chaque marée haute. Derrière, la digue des Trois-Vannes tient l’archipel. Une maison d’Aval vaut ce que vaut son titre ; le quai, lui, ne demande rien à personne.', sources: 'PL02 ; MI06–MI08 ; PN07.', status: 'Conçu' },
  { id: 'NA153', type: 'Lieu', name: 'La Septième Rive', rule: 'La Septième Rive est une cité-jardin de Thyr, bâtie sur trois colonnes vivantes et reliée au sol par des racines porteuses. Les Khelt y tiennent un jardin de mémoire et un atelier d’accord. Leth y a sa place, pas son autorité : la cité parle par délégation et ne délègue pas deux fois la même voix.', sources: 'PL03 ; MI11 ; PN06.', status: 'Conçu' },
  { id: 'NA154', type: 'Lieu', name: 'La banquise de Sereis', rule: 'Trois observatoires, une piste de glace et des caves où l’on conserve les registres au froid. Les Veilleurs y tiennent la météo de tout le bassin depuis avant la Dislocation. La glace garde les dates mieux que le papier ; c’est pourquoi l’Empire y envoie des équipes de purge et pourquoi le dégel est une catastrophe documentaire.', sources: 'PL05 ; MI17–MI20 ; FA11.', status: 'Conçu' },
  { id: 'NA155', type: 'Lieu', name: 'Les jardins d’Ilex', rule: 'Les jardins de mémoire sont des architectures basses, accordées à la résonance d’une cité. Chaque jardin porte un registre vivant : des porteurs, des cristaux, des fils tendus. L’Institut les classe en friches non déclarées ; les Tisserands les entretiennent sans autorisation depuis deux siècles.', sources: 'PL06 ; MI21–MI24 ; PN21, PN31.', status: 'Conçu' },
  { id: 'NA156', type: 'Lieu', name: 'Le Grenier de Méridien', rule: 'Le Grenier n’est pas un bâtiment mais un réseau de silos, de canaux et de portes d’écluse. Celui qui tient les portes tient la ration de quatre villes. Les Gardiens du Sillon y font régner un ordre qui n’est ni impérial ni rebelle : il est affamé.', sources: 'PL07 ; MI25–MI28 ; PN11.', status: 'Conçu' },
  { id: 'NA157', type: 'Mythe', name: 'La Onzième', rule: 'Les enfants chantent la Onzième, le dernier des onze mondes perdus, dont le relais répondrait encore certaines nuits. Les techniciens disent que c’est un écho de la Ligne. Les Veilleurs disent que c’est une station automatique qui n’a jamais reçu l’ordre de s’arrêter. Personne ne tranche, et le jeu ne le fera pas.', sources: 'NA133, NA167 ; PL05 ; FA11.', status: 'Conçu' },
  { id: 'NA158', type: 'Mythe', name: 'Ce que la cendre ne dit pas', rule: 'On dit dans les stations que la cendre garde les noms qu’on brûle, et qu’un nom réduit en cendre revient dans la bouche de celui qui l’a lu. L’Empire dément : la cendre ne témoigne pas. Les deux phrases vivent dans le même couloir, et le joueur les entend sans arbitrage.', sources: 'NA138, NA168 ; MI22, MI32.', status: 'Conçu' },
  { id: 'NA159', type: 'Document', name: 'Annexe C du DC-7', rule: '« Après constat de continuité rétablie, les supports non autorisés seront réduits en cendre. La cendre ne témoigne pas. Le bureau local conservera l’heure et le poids. » Trois phrases, une signature de bureau, aucun nom. C’est le seul document de la liasse qui donne son titre au jeu.', sources: 'NA99, NA138 ; MI22, MI30.', status: 'Conçu' },
  { id: 'NA160', type: 'Document', name: 'Ordre de relève', rule: 'Un formulaire d’une page : monde, secteur, objet de la relève, unités engagées, heure d’ouverture, heure de clôture, « pertes en route tolérées ». L’objet n’est pas décrit. Sera en porte un carnet de vingt-sept ; le vingt-huitième est celui de la campagne.', sources: 'NA108 ; MI01 ; SY136.', status: 'Conçu' },
  { id: 'NA161', type: 'Document', name: 'Inventaire de bord de La Veilleuse', rule: 'Huit noms, deux berceaux de marcheur, quarante tonnes de pièces, une cale d’eau, un carnet de places. L’inventaire est affiché dans le couloir et mis à jour à chaque départ : ce qui monte est nommé, ce qui reste est compté. C’est la seule archive que l’équipage tient lui-même.', sources: 'NA09 ; PN23–PN26 ; MI16.', status: 'Conçu' },
  { id: 'NA162', type: 'Témoignage', name: 'Hela Brunt — « nous étions un bateau de secours »', rule: '« On nous a donnés aux secours en EC 4. On nous a repris en EC 30 pour porter des marcheurs. Je n’ai pas changé de métier : j’ai changé de clients. » La maîtresse du bord refuse que La Veilleuse tire ; elle accepte qu’elle transporte.', sources: 'PN23 ; NA161 ; MI16.', status: 'Conçu' },
  { id: 'NA163', type: 'Témoignage', name: 'Gan Vey — « le guichet ne ment pas »', rule: '« Tu crois que je classe des gens. Je lis des fiches. Une fiche dit l’eau, le rendement, la distance au quai. Si je la corrige, quelqu’un d’autre mange moins. Dis-moi laquelle. » Le frère de Sera travaille au Bureau des Poids et croit à l’arithmétique plus qu’à sa sœur.', sources: 'PN32 ; PN15 ; MI30.', status: 'Conçu' },
  { id: 'NA164', type: 'Témoignage', name: 'Ove Sarn — « la neige garde mieux que nous »', rule: '« J’ai vu trois hivers sans fonte. J’ai noté. Quand ils sont venus, ils ont demandé mes cahiers, pas mes morts. » Le veilleur de Sereis refuse l’évacuation sans ses registres et distingue toujours la preuve du secours.', sources: 'PN29 ; MI18 ; FA11.', status: 'Conçu' },
  { id: 'NA165', type: 'Témoignage', name: 'Petra Noll — « l’eau ne se réquisitionne pas »', rule: '« Une pompe n’appartient pas à celui qui la répare. Elle appartient à ceux qui boivent. » L’ingénieure des communes de Nacre négocie chaque pièce et ne signe aucun accord qui sépare l’eau du titre.', sources: 'PN30 ; MI06 ; FA03.', status: 'Conçu' },
  { id: 'NA166', type: 'Chanson', name: '« Le pas de cendre »', rule: 'Chant de marche : « Un pas, un poids ; deux pas, un compte ; trois pas, une rue ; quatre pas, personne. » Les pilotes la reprennent pour tenir la cadence. Les civils l’entendent comme un décompte.', sources: 'NA123 ; MI01, MI29 ; VI34.', status: 'Conçu' },
  { id: 'NA167', type: 'Chanson', name: '« La Onzième »', rule: 'Comptine : « Onze ont fermé, huit ont payé, la onzième répond, la onzième attend. » Interdite dans les écoles reliées ; reprise par les enfants des stations, qui remplacent le numéro par un prénom.', sources: 'NA122, NA157 ; MI19, MI32.', status: 'Conçu' },
  { id: 'NA168', type: 'Note interne', name: '« Ne pas laisser de traces »', rule: '« Une opération laisse trois traces : les corps, les papiers, les témoins. Les corps sont un problème local. Les papiers et les témoins sont un problème de continuité. Réduire, classer, transférer, dans cet ordre. » Note du Directoire, sans en-tête, jointe à l’annexe C.', sources: 'NA138, NA159 ; FA07 ; MI16.', status: 'Conçu' },
  { id: 'NA169', type: 'Archive', name: 'Registre des désynchronisations', rule: 'Le registre des relais de la Ligne, tenu de aR 40 à aR 0, porte des reports d’entretien signés par le consortium ancêtre d’Orison. Les onze désynchronisations de la Dislocation suivent de onze mois une révision refusée pour défaut de paiement. La catastrophe fondatrice est un calcul, comme PALINODE.', sources: 'NA133 ; MI24, MI26 ; NA127.', status: 'Conçu' },
  { id: 'NA170', type: 'Archive', name: 'Le premier ordre de cendre', rule: 'EC 23, cité de la Cinquième Rive, Ilex. Le rapport de relève tient en deux pages : « continuité rétablie, supports réduits, aucune perte déclarée ». En marge, une main a écrit : « ils comptaient par douze ; nous avons brûlé le douze. » C’est la première fois que l’annexe C s’applique à des personnes et non à des papiers.', sources: 'NA138, NA159 ; MI21, MI22 ; PN31.', status: 'Conçu' },
);

/* ------------------------------------------------------- Fins enrichies */
const ending = (id, rule) => {
  const row = sheet('Narration').rows.find(r => r.id === id);
  if (!row || row.status !== 'Conçu') throw new Error(`${id} must remain designed.`);
  row.rule = rule;
};
ending('FI01',
  'Les communes debout — Conditions : PALINODE arrêté, dossier triangulé (technique, testimonial, politique) distribué à au moins deux dépositaires indépendants, coalition capable de tenir l’eau, l’air et les soins sur trois mondes. Épilogues : le quai d’Aval pompe sans titre ; le verger de Thyr rend une récolte avec la dette écrite ; l’atelier de Kharon rouvre sans poche de froid ; la banquise publie ses dates ; le jardin d’Ilex reçoit une restitution ; Méridien tient un conseil des rations ; Orthe copie le Mur sans le détruire. Coût explicite : les mondes les plus pauvres perdent une saison d’air, et l’équipage ne reçoit aucun pardon officiel.');
ending('FI02',
  'La vérité sous les décombres — Conditions : crimes prouvés et rendus publics, mais réseaux d’eau, d’air ou de soins détruits et alliances rompues. Épilogues : les noms sont lus une fois par an dans une salle vide ; Aval se reconstruit sur pilotis sans registre ; le verger est reverdi par ceux qui restent ; l’atelier est un musée sans machine ; la banquise fond avec ses caves ; Ilex garde un jardin sans porteur ; Méridien compte les morts au lieu des rations ; Orthe expose les fiches sous verre. Coût : la vérité survit aux services, et certains témoins ne survivent pas à la publication.');
ending('FI03',
  'Un autre uniforme — Conditions : le commandement tombe, mais le dossier reste incomplet sur la chaîne politique ; une autorité de remplacement (Karr ou un Conseil recomposé) reprend la continuité avec un vocabulaire neuf. Épilogues : les mêmes guichets, une nouvelle encre ; les communes signent un contrat de secours révisé qui reste une dette ; l’atelier redémarre avec un comité ; la banquise est « modernisée » ; Ilex obtient une restitution partielle ; Méridien garde le quota ; Orthe change les portraits. Coût : les formes changent, la dépendance demeure, et Sera devient un symbole qu’elle refuse.');
ending('FI04',
  'Ceux qui ont traversé — Conditions : le réseau de pouvoir survit à court terme, l’équipage privilégie l’extraction et conserve les preuves pour plus tard ; les personnes sauvées existent et sont nommées. Épilogues : La Veilleuse devient un remorqueur de passage ; le quai d’Aval garde une place pour Milo ; le verger accueille quatre bêtes et aucun tractoriste ; l’atelier tient un an ; la banquise échange des cahiers contre du carburant ; Ilex attend ; Méridien rationne ; Orthe continue. Coût : le programme continue ailleurs, et la vérité reste une cargaison qu’on ne décharge pas.');

/* ------------------------------------------------------------------ Méta */
bible.meta.version = '0.16.0';
bible.meta.loreTranche = {
  id: '0.16.1',
  date: '2026-11-20',
  era: 'EC 61',
  chronicle: 'docs/CHRONIQUE_DES_MONDES.md',
  completeness: 'docs/COMPLETUDE_FR.md',
  receipt: 'docs/QA_LORE_V0161.md',
  added: 63,
  rule: 'Complément additif d’histoire et de lore : aucun code, style ou asset modifié, aucune reconstruction autonome requise, aucun statut promu, aucune mission rendue jouable.',
};
bible.meta.scope = 'MI01–MI14 jouables au stade prototype ; MI15–MI32, les seize contrats de campagne et les huit épreuves de châssis restent conçus. La 0.16 a établi le canon de la Continuité ; le complément de chronique 0.16.1 ajoute 63 fiches d’histoire et de lore : quatre principes de monde et de fin, quatre systèmes de journal, de calendrier, de cargaison et de résolution, trois factions, douze personnes dont l’équipage, quarante entrées de chronique, de langue, de rite, de lieu et d’archive, et le détail des quatre fins. La campagne se situe en EC 61 ; 1 131 fiches, 20 onglets de conception, 133 critères initiaux conservés. Aucun statut promu, aucune fiche ni aucun ID retiré, aucune mission rendue jouable.';
const canon = { ...(bible.meta.canon || {}) };
canon.chronicle = 'docs/CHRONIQUE_DES_MONDES.md';
canon.completeness = 'docs/COMPLETUDE_FR.md';
bible.meta.canon = canon;

/* -------------------------------------------------------------- Contrôles */
const afterIds = bible.sheets.flatMap(s => s.rows.map(r => r.id));
if (new Set(afterIds).size !== afterIds.length) throw new Error('Duplicate source ID after update.');
for (const id of beforeIds) if (!afterIds.includes(id)) throw new Error(`Lost source ID ${id}`);
for (const [id, status] of beforeStatus) {
  const row = bible.sheets.flatMap(s => s.rows).find(r => r.id === id);
  if (row.status !== status) throw new Error(`Promoted status ${id}: ${status} -> ${row.status}`);
}
const counts = Object.fromEntries(bible.sheets.map(s => [s.name, s.rows.length]));
if (counts.Vision !== 37 || counts['Systèmes'] !== 143 || counts.Factions !== 12) throw new Error(JSON.stringify(counts));
if (counts.Personnages !== 34 || counts.Narration !== 170 || counts.Contrats !== 24) throw new Error(JSON.stringify(counts));
if (counts.Campagne !== 32 || counts.Planètes !== 8) throw new Error(JSON.stringify(counts));
bible.meta.sheetCount = bible.sheets.length;
bible.meta.recordCount = bible.sheets.reduce((n, s) => n + s.rows.length, 0);
if (bible.meta.recordCount !== 1131) throw new Error(`Unexpected record count ${bible.meta.recordCount}`);

writeFileSync(file, `${JSON.stringify(bible, null, 2)}\n`);
console.log(JSON.stringify({ version: bible.meta.version, tranche: bible.meta.loreTranche.id, rows: bible.meta.recordCount, sheets: bible.meta.sheetCount, added: afterIds.length - beforeIds.length, preserved: beforeIds.length }));
