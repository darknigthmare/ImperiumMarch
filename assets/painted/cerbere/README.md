# Cerbère — pièces peintes 0.15.4

Un atlas RGBA original de **1254 × 1254 pixels**, en quatre colonnes et quatre lignes : **16 pièces et états**, dont **11 utilisés au rendu et cinq références**. Génération intégrée `image_gen.imagegen`; PNG conservé à l'identique.

| Famille | Cellules | État effectivement utilisé |
| --- | ---: | --- |
| Coque | 3 | Normale, endommagée selon santé globale, verrouillée en attaque |
| Canon | 1 | Montage indépendant, pivot et bouche physiques du boss |
| Segments supérieur et inférieur | 4 | Deux pièces intactes; variantes endommagées en référence |
| Hanche et genou | 2 | Articulations du rig de présentation |
| Pied | 3 | Normal et verrouillé; pied endommagé en référence |
| Radiateur | 3 | Pièce normale; dommages/réparation en référence |

Les [prompts](prompts.json), [ancres mesurées](anchors.json) et [manifestes](manifest.json) conservent le contrat de production. [L'indexeur](../../../tools/index-painted-cerbere.py) écrit les rectangles et corrections optiques dans [le layout](../../../src/painted-cerbere-layout.mjs), sans éditer les pixels.

## Montage

Cerbère garde sa propre identité et ne reçoit jamais l'ID ni la peau d'un marcheur joueur. Le canon, le télégraphe et le projectile partagent [cerbere-weapon-pose.mjs](../../../src/cerbere-weapon-pose.mjs) : pivot au centre physique de l'ennemi, bouche à `w / 2`, soit **89 unités** dans son gabarit existant. Un support ventral relie visuellement le canon à la coque. Vitesse, dégâts et origine historique des tirs restent conservés.

Les pieds du boss sont un **rig de présentation**, distinct des contacts physiques individuels des châssis joueurs. Les semelles restent à leurs points au sol et les segments rejoignent les récepteurs des chaussures peints. Les chaussures gardent leurs proportions; leurs chevilles sont mesurées à environ **−28,91 unités** au-dessus de la semelle. Les chevilles des marcheurs joueurs ne sont pas modifiées.

L'animation suit le déplacement réel et respecte la réduction des mouvements. L'ennemi en garde ou immobile ne marche plus sur place. Les cellules d'avarie locale ne créent aucune santé de jambe ou de radiateur, et la mort n'ajoute pas de corps persistant.

## Réception

```sh
python tools/index-painted-cerbere.py
npm run check:cerbere -- docs/validation/painted-cerbere-v0154
```

Le [rapport](../../../docs/validation/painted-cerbere-v0154/report.json) contrôle les seize cellules, six poses diagnostiques et les deux directions de tir. Les [vues Canvas](../../../docs/PRODUCTION_V15_4.md) sont distinctes d'une partie naturelle ou d'une réception navigateur. Le [rapport QA commun](../../../docs/QA_PAINTED_THYR_CERBERE.md) délimite les autres vérifications.
