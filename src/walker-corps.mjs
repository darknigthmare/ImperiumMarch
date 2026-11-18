/**
 * Répertoire des appuis — huit châssis conçus d'après les grands archétypes
 * de marcheurs de guerre (éclaireur découvert, patrouilleur de blocage,
 * transport blindé, batterie mobile, briseur de ligne, porteur de section).
 *
 * Ces machines sont ORIGINALES : aucune silhouette, aucun nom et aucun récit
 * ne reprend une franchise existante. Les archétypes de référence servent
 * seulement de brief de conception (fonction et proportions).
 *
 * État : conçu, sauf WK14. Depuis la tranche Sentinelle, la S-3 possède une
 * géométrie de production, des contacts simulés et une assignation au départ
 * (`PLAYABLE_WALKERS` dans content.mjs). Les sept autres restent des dessins
 * de conception : ni marche, ni tir, ni sauvegarde.
 */

export const CORPS_FILTERS = [
  { id: 'all', label: 'Tous les appuis', short: 'TOUS' },
  { id: '2', label: 'Bipèdes', short: 'II APPUIS' },
  { id: '4', label: 'Quadrupèdes', short: 'IV APPUIS' },
  { id: '6', label: 'Hexapodes', short: 'VI APPUIS' },
];

export const CORPS_STATUS = {
  level: 'Conçu',
  note: 'Silhouettes de conception et fiches de fonction. La Sentinelle S-3 est désormais pilotable : géométrie de production, contacts simulés et assignation au départ. Les sept autres restent non assignables.',
};

export const WALKER_CORPS = [
  {
    id: 'WK13', name: 'Chacal', designation: 'CH-8', legs: 2,
    role: 'ÉCLAIREUR DE PROXIMITÉ',
    archetype: 'Marcheur éclaireur léger, poste découvert',
    heightM: 4.8, massT: 8, crew: '1 pilote, à découvert',
    weapon: 'Mitrailleuse légère J-9', secondary: 'Fumigènes de repli',
    mobility: 'Très rapide', armor: 'Nulle',
    function: 'Reconnaissance rapprochée, guidage de tir et harcèlement des flancs.',
    description: 'Une selle mécanique ouverte sur deux longues échasses. Le pilote voit tout et ne peut rien encaisser : le Chacal existe pour renseigner, pas pour tenir.',
    doctrine: 'Il précède la colonne, marque les appuis douteux et rompt le contact dès qu’une arme lourde se déploie. Sa valeur se mesure en renseignement transmis, jamais en dégâts.',
    strengths: ['Silhouette basse et rapide', 'Vision directe du pilote', 'Coût de production dérisoire'],
    weaknesses: ['Aucune protection d’équipage', 'Deux appuis très fins', 'Emporte peu de munitions'],
    illustration: { id: 'AW13', label: 'Portrait du Chacal', brief: 'Chacal de trois quarts avant, pilote penché sur la mitrailleuse, sangle de harnais et poussière de Vesper ; échelle donnée par un technicien debout à hauteur de selle.' },
    accent: '#d8b079',
    geometry: {
      ground: 186,
      hulls: [[[112, 92], [150, 80], [176, 86], [182, 100], [150, 112], [116, 108]]],
      views: [[[128, 84], [148, 78], [156, 86], [136, 94]]],
      gun: { x: 176, y: 92, len: 46, t: 5 },
      mast: [[130, 80], [120, 48]],
      trim: [[[118, 101], [152, 104]], [[120, 108], [140, 111]]],
      legs: [
        { hip: [118, 106], knee: [100, 142], foot: [96, 186], depth: 'far', footW: 22 },
        { hip: [152, 110], knee: [168, 144], foot: [172, 186], depth: 'near', footW: 24 },
      ],
    },
  },
  {
    id: 'WK14', name: 'Sentinelle', designation: 'S-3', legs: 2, playable: true,
    role: 'PATROUILLEUR DE BLOCAGE',
    archetype: 'Marcheur de patrouille blindé, canon de menton',
    heightM: 8.6, massT: 21, crew: '2 pilotes en cabine',
    weapon: 'Double canon de menton S-3', secondary: 'Lance-grenades fumigènes',
    mobility: 'Rapide', armor: 'Moyenne',
    function: 'Tenir un carrefour, un pont ou un quai, et contester l’infanterie à courte portée.',
    description: 'La cabine angulaire sur deux pattes d’oiseau : c’est la machine de contrôle la plus répandue du corps expéditionnaire. Elle voit loin, tourne court et paie chaque regard par des genoux exposés.',
    doctrine: 'La Sentinelle occupe le terrain plutôt qu’elle ne le traverse. Elle avance par bonds courts, s’arrête pour tirer, puis reprend son secteur ; l’équipage travaille en binôme, l’un aux capteurs, l’autre à l’arme.',
    strengths: ['Poste d’observation surélevé', 'Tir de menton précis à courte portée', 'Entretien standardisé'],
    weaknesses: ['Genoux et chevilles découverts', 'Cabine étroite à deux', 'Recul important sans ancrage'],
    illustration: { id: 'AW14', label: 'Portrait de la Sentinelle', brief: 'Sentinelle en arrêt à un carrefour de Nacre, canon de menton braqué, deux visées rondes allumées, reflets mouillés et foule civile maintenue en retrait.' },
    accent: '#b9c3ac',
    geometry: {
      ground: 186,
      hulls: [[[104, 64], [162, 60], [182, 78], [184, 106], [160, 120], [112, 118], [98, 92]]],
      views: [[[156, 74], [174, 80], [176, 92], [154, 88]], [[116, 76], [134, 72], [136, 84], [116, 86]]],
      gun: { x: 184, y: 104, len: 38, t: 6 },
      mast: [[118, 64], [110, 38]],
      trim: [[[108, 110], [162, 112]], [[108, 96], [178, 100]]],
      legs: [
        { hip: [126, 118], knee: [104, 150], foot: [100, 186], depth: 'far', footW: 26 },
        { hip: [158, 118], knee: [176, 150], foot: [180, 186], depth: 'near', footW: 28 },
      ],
    },
  },
  {
    id: 'WK15', name: 'Cormoran', designation: 'C-11', legs: 2,
    role: 'VEILLEUR DE CORRIDOR',
    archetype: 'Marcheur de surveillance très haut et étroit',
    heightM: 11.4, massT: 18, crew: '2 pilotes, cellule étroite',
    weapon: 'Canon long C-11', secondary: 'Marqueur de cible pour batterie',
    mobility: 'Rapide en ligne droite', armor: 'Faible',
    function: 'Surveiller un corridor, désigner une cible à distance et interdire un axe découvert.',
    description: 'Une tête étroite au bout d’un long fût. Le Cormoran domine les toits et les digues, mais son équilibre tient à un transfert de masse interminable : le moindre contact sur une jambe se lit dans toute la coque.',
    doctrine: 'Il travaille en hauteur et en retrait, marque puis laisse la batterie conclure. Son équipage accepte d’être vu pour n’avoir jamais à être atteint.',
    strengths: ['Ligne de vue maximale', 'Marquage pour l’artillerie', 'Progression rapide sur sol ferme'],
    weaknesses: ['Silhouette impossible à masquer', 'Stabilité précaire', 'Coque fine'],
    illustration: { id: 'AW15', label: 'Portrait du Cormoran', brief: 'Cormoran debout sur un viaduc au crépuscule, tête inclinée vers un convoi, longue jambe en appui unique, halo de projecteur et câbles du viaduc au premier plan.' },
    accent: '#c9b996',
    geometry: {
      ground: 186,
      hulls: [[[124, 44], [150, 38], [166, 52], [164, 84], [144, 94], [122, 88], [116, 64]]],
      views: [[[150, 46], [166, 54], [164, 64], [148, 58]]],
      gun: { x: 164, y: 66, len: 40, t: 4 },
      mast: [[128, 42], [122, 16]],
      trim: [[[122, 78], [158, 82]], [[126, 90], [146, 93]]],
      legs: [
        { hip: [130, 90], knee: [112, 140], foot: [108, 186], depth: 'far', footW: 22 },
        { hip: [150, 92], knee: [166, 142], foot: [170, 186], depth: 'near', footW: 24 },
      ],
    },
  },
  {
    id: 'WK16', name: 'Bison', designation: 'B-30', legs: 4,
    role: 'TRANSPORT BLINDÉ',
    archetype: 'Transport lourd quadrupède à soute',
    heightM: 14.2, massT: 96, crew: '3 servants + 12 passagers',
    weapon: 'Quadruple canon de proue', secondary: 'Tourelles de flanc',
    mobility: 'Lente', armor: 'Très lourde',
    function: 'Porter une section entière à travers un terrain tenu et ouvrir la route par la seule masse.',
    description: 'Une soute blindée sur quatre piliers, une tête basse à canons de proue. Le Bison ne se faufile pas : il choisit son axe, l’annonce par son pas, et tout ce qui reste dessous est écrasé.',
    doctrine: 'Il avance sans s’arrêter, couvert par son escorte. Sa faiblesse n’est pas la coque mais les articulations et le ventre : une section qui l’accompagne doit nettoyer les fossés avant son passage.',
    strengths: ['Soute de douze places', 'Blindage de proue', 'Effet de rupture sur l’infanterie'],
    weaknesses: ['Très lente et très haute', 'Vulnérable sous le ventre', 'Exige une route reconnue'],
    illustration: { id: 'AW16', label: 'Portrait du Bison', brief: 'Bison de profil écrasant une barricade de Vesper, trappe de soute ouverte et section en cours d’embarquement, poussière dense et silhouettes minuscules des défenseurs.' },
    accent: '#a9b3a2',
    geometry: {
      ground: 186,
      hulls: [
        [[48, 48], [192, 42], [208, 58], [210, 92], [194, 108], [62, 110], [44, 92], [42, 62]],
        [[196, 76], [228, 82], [232, 102], [204, 106], [192, 94]],
      ],
      views: [[[210, 86], [228, 90], [226, 98], [208, 94]]],
      gun: { x: 230, y: 102, len: 14, t: 4, twin: true },
      trim: [[[60, 66], [188, 60]], [[56, 88], [192, 82]], [[120, 56], [120, 104]]],
      legs: [
        { hip: [82, 110], knee: [66, 148], foot: [60, 186], depth: 'far', footW: 30 },
        { hip: [150, 110], knee: [136, 148], foot: [130, 186], depth: 'far', footW: 30 },
        { hip: [100, 110], knee: [94, 150], foot: [88, 186], depth: 'near', footW: 32 },
        { hip: [176, 110], knee: [186, 150], foot: [190, 186], depth: 'near', footW: 32 },
      ],
    },
  },
  {
    id: 'WK17', name: 'Tisserand', designation: 'T-4', legs: 4,
    role: 'ASSAUT RAMPANT',
    archetype: 'Marcheur bas quadrupède à pattes rayonnantes',
    heightM: 5.6, massT: 26, crew: '1 pilote en capsule',
    weapon: 'Éclateur court T-4', secondary: 'Charges de démolition',
    mobility: 'Très manœuvrant', armor: 'Moyenne',
    function: 'S’infiltrer sous les lignes de tir, occuper les angles morts et détruire un appui fixe.',
    description: 'Une capsule ventrue sur quatre pattes obliques, si basse qu’elle disparaît derrière un muret. Le Tisserand grimpe, se plaque et attend ; sa menace commence quand l’adversaire ne le voit plus.',
    doctrine: 'Il contourne, se colle aux structures et frappe par le bas. Son pilote unique ne peut ni observer ni tirer correctement en marche : chaque attaque exige une immobilité franche.',
    strengths: ['Profil sous hauteur de muret', 'Pattes préhensiles sur gravats', 'Charges de démolition embarquées'],
    weaknesses: ['Capsule unique sans second pilote', 'Portée de tir très courte', 'Pattes vulnérables aux cisailles'],
    illustration: { id: 'AW17', label: 'Portrait du Tisserand', brief: 'Tisserand accroché à une paroi de quai, quatre pattes ancrées dans les éboulis, capsule fendue par la lumière d’un projecteur, adversaires cherchant la menace au-dessus d’eux.' },
    accent: '#b7bfa0',
    geometry: {
      ground: 186,
      hulls: [[[102, 96], [128, 88], [160, 92], [178, 104], [176, 120], [150, 130], [118, 128], [98, 112]]],
      views: [[[160, 102], [174, 106], [172, 116], [158, 112]]],
      gun: { x: 176, y: 110, len: 18, t: 5 },
      trim: [[[110, 100], [150, 96]], [[116, 122], [158, 124]]],
      legs: [
        { hip: [110, 120], knee: [78, 142], foot: [62, 186], depth: 'far', footW: 18 },
        { hip: [158, 122], knee: [192, 144], foot: [206, 186], depth: 'far', footW: 18 },
        { hip: [126, 128], knee: [100, 160], foot: [94, 186], depth: 'near', footW: 20 },
        { hip: [170, 126], knee: [186, 160], foot: [192, 186], depth: 'near', footW: 20 },
      ],
    },
  },
  {
    id: 'WK18', name: 'Baliste', designation: 'BL-9', legs: 4,
    role: 'BATTERIE MOBILE',
    archetype: 'Marcheur d’artillerie quadrupède à bêche',
    heightM: 7.8, massT: 44, crew: '3 servants',
    weapon: 'Fauconneau dorsal BL-9', secondary: 'Roquettes de saturation',
    mobility: 'Lente, positionnelle', armor: 'Moyenne',
    function: 'Portée une pièce là où un tracteur ne passe pas, puis battre un point fixe à distance.',
    description: 'Un affût sur quatre jambes courtes, un fauconneau dorsal pointé vers le ciel et une bêche qui mord le sol. La Baliste se déplace pour une seule raison : changer de ligne de tir.',
    doctrine: 'Elle se déplace démontée, s’installe, plante sa bêche et demande trois minutes de calme. Toute attaque qui l’oblige à décrocher coûte une salve entière : c’est son vrai prix.',
    strengths: ['Tir indirect très puissant', 'Bêche d’ancrage stabilisatrice', 'Se pose hors des routes carrossables'],
    weaknesses: ['Immobile pendant la mise en batterie', 'Cadence très lente', 'Quatre appuis encombrants'],
    illustration: { id: 'AW18', label: 'Portrait de la Baliste', brief: 'Baliste en batterie sur un replat de Thyr, fauconneau dorsal incliné, bêche plantée dans la terre meuble, serviteurs passant une charge, fumée de la salve précédente.' },
    accent: '#c6ad86',
    geometry: {
      ground: 186,
      hulls: [[[68, 74], [150, 62], [190, 78], [192, 100], [150, 112], [74, 108]], [[72, 104], [58, 103], [46, 142], [58, 147]]],
      views: [[[160, 74], [184, 82], [182, 94], [158, 88]]],
      dorsal: { points: [[132, 70], [86, 24]], t: 7 },
      gun: { x: 190, y: 98, len: 30, t: 5 },
      trim: [[[92, 84], [176, 84]], [[146, 108], [166, 108]]],
      legs: [
        { hip: [86, 108], knee: [72, 146], foot: [66, 186], depth: 'far', footW: 22 },
        { hip: [164, 108], knee: [150, 148], foot: [144, 186], depth: 'far', footW: 22 },
        { hip: [104, 108], knee: [96, 150], foot: [90, 186], depth: 'near', footW: 24 },
        { hip: [180, 106], knee: [186, 150], foot: [192, 186], depth: 'near', footW: 24 },
      ],
    },
  },
  {
    id: 'WK19', name: 'Broyeur', designation: 'BR-2', legs: 4,
    role: 'BRISEUR DE LIGNE',
    archetype: 'Marcheur lourd quadrupède à avant massif',
    heightM: 10.2, massT: 78, crew: '2 pilotes, soute de siège',
    weapon: 'Double automatique lourd', secondary: 'Bélier de contact',
    mobility: 'Lente, en charge', armor: 'Très lourde à l’avant',
    function: 'Ouvrir une position retranchée par le contact, puis y maintenir une brèche.',
    description: 'Épaules hautes, avant blindé, pattes antérieures épaisses et postérieures courtes : le Broyeur est dessiné pour tomber vers l’avant. Tout son poids travaille dans un seul geste.',
    doctrine: 'Il ne cherche pas l’échange de tirs mais le contact : une charge annoncée, une brèche, puis les sections qui entrent. Reculer lui coûte plus cher qu’avancer.',
    strengths: ['Bélier et blindage d’épaule', 'Charge qui disloque une barricade', 'Deux canons jumelés'],
    weaknesses: ['Angle mort dans le dos', 'Demi-tour très long', 'Consommation et entretien élevés'],
    illustration: { id: 'AW19', label: 'Portrait du Broyeur', brief: 'Broyeur lancé dans une palissade de Kharon, bélier d’épaule enfoncé, plaques arrachées, deux pilotes cramponnés ; le mouvement doit se lire dans la poussière et les éclats.' },
    accent: '#b3a48f',
    geometry: {
      ground: 186,
      hulls: [[[94, 66], [168, 54], [202, 72], [206, 104], [184, 124], [112, 126], [88, 100]]],
      views: [[[176, 74], [198, 82], [196, 96], [174, 88]]],
      dorsal: { points: [[112, 62], [86, 26]], t: 6 },
      gun: { x: 206, y: 100, len: 26, t: 7 },
      trim: [[[100, 84], [192, 78]], [[96, 108], [186, 104]], [[152, 60], [154, 118]]],
      legs: [
        { hip: [108, 124], knee: [80, 152], foot: [72, 186], depth: 'far', footW: 34 },
        { hip: [160, 124], knee: [142, 156], foot: [136, 186], depth: 'far', footW: 32 },
        { hip: [130, 126], knee: [116, 158], foot: [110, 186], depth: 'near', footW: 34 },
        { hip: [186, 122], knee: [196, 154], foot: [200, 186], depth: 'near', footW: 30 },
      ],
    },
  },
  {
    id: 'WK20', name: 'Mulet', designation: 'MU-6', legs: 6,
    role: 'PORTEUR DE SECTION',
    archetype: 'Porteur hexapode bas, tourelle de toit',
    heightM: 9.4, massT: 64, crew: '2 pilotes + 8 passagers',
    weapon: 'Canon de toit MU-6', secondary: 'Treuil de dépannage',
    mobility: 'Régulière', armor: 'Lourde',
    function: 'Porter une escouade et son matériel sur un terrain accidenté, sans route et sans arrêt.',
    description: 'Six pattes courtes sous une coque allongée, une tourelle de toit et un treuil à l’arrière. Le Mulet est le seul châssis du répertoire à pouvoir franchir une pente chargée et repartir sans aide.',
    doctrine: 'Il avance à cadence constante, sa tourelle travaillant pour lui. Son équipage compte en appuis disponibles : perdre deux pattes d’un même côté ne l’arrête pas, mais lui interdit la pente.',
    strengths: ['Six appuis, marche dégradée tolérée', 'Huit places et treuil', 'Tourelle de toit indépendante'],
    weaknesses: ['Large et haut sur un quai étroit', 'Tourelle exposée', 'Cadence de marche moyenne'],
    illustration: { id: 'AW20', label: 'Portrait du Mulet', brief: 'Mulet franchissant une passerelle de Nacre, six pattes sur deux niveaux, section arrimée sous la coque, treuil tendu vers un blessé ; houle et embruns visibles sous le tablier.' },
    accent: '#aeb7a0',
    geometry: {
      ground: 186,
      hulls: [
        [[46, 96], [90, 84], [160, 86], [214, 94], [216, 112], [164, 124], [78, 122], [42, 110]],
        [[124, 82], [154, 74], [164, 86], [152, 96], [126, 94]],
      ],
      views: [[[136, 80], [152, 78], [158, 86], [138, 88]]],
      gun: { x: 164, y: 88, len: 34, t: 4 },
      trim: [[[56, 100], [206, 98]], [[72, 114], [196, 114]], [[110, 90], [110, 118]], [[150, 90], [150, 120]]],
      legs: [
        { hip: [72, 120], knee: [56, 150], foot: [50, 186], depth: 'far', footW: 20 },
        { hip: [132, 122], knee: [116, 152], foot: [110, 186], depth: 'far', footW: 20 },
        { hip: [190, 120], knee: [176, 150], foot: [170, 186], depth: 'far', footW: 20 },
        { hip: [88, 122], knee: [84, 154], foot: [78, 186], depth: 'near', footW: 22 },
        { hip: [148, 124], knee: [152, 156], foot: [156, 186], depth: 'near', footW: 22 },
        { hip: [204, 120], knee: [210, 152], foot: [214, 186], depth: 'near', footW: 22 },
      ],
    },
  },
];

const round = value => Math.round(value * 10) / 10;
const points = list => list.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
const line = ([x1, y1], [x2, y2]) => `M${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}`;

/** Les châssis correspondant à un filtre d'appuis, dans l'ordre du répertoire. */
export function corpsChassis(filter = 'all') {
  return filter === 'all' ? WALKER_CORPS : WALKER_CORPS.filter(chassis => String(chassis.legs) === String(filter));
}

export function corpsChassisById(id) {
  return WALKER_CORPS.find(chassis => chassis.id === id) || WALKER_CORPS[0];
}

/**
 * Silhouette de conception, vue de profil. Purement décorative : elle ne
 * représente ni un rig simulé, ni un atlas peint, ni une pose de jeu.
 */
export function walkerBlueprintSvg(chassis, { width = 260, className = 'corps-svg' } = {}) {
  const geometry = chassis.geometry;
  const ground = geometry.ground ?? 186;
  const far = geometry.legs.filter(leg => leg.depth === 'far');
  const near = geometry.legs.filter(leg => leg.depth !== 'far');
  const legMarkup = (legs, color, widthScale) => legs.map(leg => {
    const toeX = round(leg.foot[0] - leg.footW / 2);
    return `<path d="${line(leg.hip, leg.knee)}${line(leg.knee, leg.foot)}" fill="none" stroke="${color}" stroke-width="${widthScale}" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="M${toeX} ${ground - 11}h${leg.footW}l4 7v4h-${leg.footW + 4}z" fill="${color}" stroke="#111c1e" stroke-width="1.4" stroke-linejoin="round"/>`
      + `<circle cx="${round(leg.knee[0])}" cy="${round(leg.knee[1])}" r="${round(widthScale * 0.72)}" fill="${color}" stroke="#111c1e" stroke-width="1.6"/>`
      + `<circle cx="${round(leg.hip[0])}" cy="${round(leg.hip[1])}" r="${round(widthScale * 0.5)}" fill="${color}" stroke="#111c1e" stroke-width="1.4"/>`
      + `<circle cx="${round(leg.foot[0])}" cy="${ground - 13}" r="2.6" fill="${color}" stroke="#111c1e" stroke-width="1.2"/>`;
  }).join('');
  const hullMarkup = geometry.hulls.map(hull =>
    `<polygon points="${points(hull)}" fill="#b4bba6" stroke="#111c1e" stroke-width="2" stroke-linejoin="round"/>`).join('');
  const trimMarkup = (geometry.trim || []).map(([a, b], index) =>
    `<path d="${line(a, b)}" fill="none" stroke="${index === 0 ? chassis.accent : '#3c4d4a'}" stroke-width="${index === 0 ? 2.4 : 1.2}"/>`).join('');
  const viewMarkup = geometry.views.map(view =>
    `<polygon points="${points(view)}" fill="#eac386" stroke="#111c1e" stroke-width="1.6" stroke-linejoin="round"/>`).join('');
  const mastMarkup = geometry.mast
    ? `<path d="${line(geometry.mast[0], geometry.mast[1])}" fill="none" stroke="#4a5b56" stroke-width="2.2"/><circle cx="${geometry.mast[1][0]}" cy="${geometry.mast[1][1]}" r="2.4" fill="${chassis.accent}"/>`
    : '';
  const dorsalMarkup = geometry.dorsal
    ? `<path d="${line(geometry.dorsal.points[0], geometry.dorsal.points[1])}" fill="none" stroke="#2b3a37" stroke-width="${geometry.dorsal.t}" stroke-linecap="round"/>`
    : '';
  const gunMarkup = `<rect x="${geometry.gun.x - 9}" y="${geometry.gun.y - 7}" width="13" height="14" rx="2" fill="#3d4e49" stroke="#111c1e" stroke-width="1.6"/>`
    + `<path d="M${geometry.gun.x} ${geometry.gun.y}h${geometry.gun.len}" fill="none" stroke="#2b3a37" stroke-width="${geometry.gun.t}" stroke-linecap="round"/>`
    + (geometry.gun.twin ? `<path d="M${geometry.gun.x} ${geometry.gun.y + 6}h${geometry.gun.len}" fill="none" stroke="#2b3a37" stroke-width="${geometry.gun.t}" stroke-linecap="round"/>` : '')
    + `<circle cx="${geometry.gun.x}" cy="${geometry.gun.y}" r="${round(geometry.gun.t * 0.9)}" fill="#1a2624"/>`;
  return `<svg class="${className}" viewBox="0 0 260 200" width="${width}" role="img" aria-label="Silhouette de conception ${chassis.designation} ${chassis.name}">`
    + `<title>${chassis.designation} ${chassis.name} — silhouette de conception</title>`
    + `<ellipse cx="132" cy="${ground + 3}" rx="98" ry="7" fill="#0b1214" opacity=".45"/>`
    + legMarkup(far, '#4c5c56', 7)
    + hullMarkup + trimMarkup + viewMarkup + mastMarkup + dorsalMarkup + gunMarkup
    + legMarkup(near, '#97a498', 8)
    + `</svg>`;
}
