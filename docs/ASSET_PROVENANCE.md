# Provenance des assets — Ordre de Cendre

Référence mise à jour : 11 novembre 2026. Les images sont des créations visuelles produites pour ce projet. Aucune capture, texture ou bande-son de BE-A Walker ou d’une autre franchise n’a été incorporée.

## Images générées

| Fichier | Usage | Production |
| --- | --- | --- |
| `assets/art/key-art.png` | Illustration du menu et image de direction artistique. | Génération intégrée image_gen, sans image de référence, fond opaque. |
| `assets/art/vesper-panorama.png` | Plan distant du théâtre Vesper. | Génération intégrée image_gen, sans image de référence, fond opaque. |

Les sorties PNG ont été copiées dans le dépôt sans retouche. Le cadrage, les dégradés d’interface et le déplacement de parallaxe se font au rendu. L’illustration du menu exprime une cible artistique ; les machines jouables sont celles dessinées par le renderer.

### Prompt de l’illustration du menu

> Use case: stylized-concept. Asset type: cinematic main menu key art for an original premium 2D science-fiction walker combat game, ORDRE DE CENDRE, codename ImperiumMarch. Widescreen 16:9, high resolution. No text, no logo, no UI. Hand-painted cinematic hard-surface science-fiction concept illustration, incredible thoughtful material detail, matte painted industrial war atmosphere, nuanced cinematic light, not photoreal render, not pixel art. On the right two thirds, one enormous original two-legged imperial walking combat vehicle strides across a devastated ash desert: squat angular olive-gray armored cabin, asymmetrical sensor brow with very thin amber slit, offset cannon and ammunition drums, visible articulated hydraulic knees and broad three-toed industrial feet, believable load-bearing geometry, subtle ivory identification stripe, heavily weathered steel. A smaller low quadruped support walker far behind, silhouettes of a ruined mining outpost on the horizon and tiny logistics crew at base for scale. Background: alien planet Vesper, gigantic pale ringed planet in dusty sky, chalk cliffs, distant vertical refinery stacks, dry basalt, burnt rust-orange sunlight cutting through smoke, muted ash teal shadows. Strong readable silhouette, dramatic scale and human vulnerability. Keep left third very dark and atmospheric with open smoky sky for later typography overlay. Ground line in lower quarter. No humanoid robots, no head shaped like an animal, no recognizable Star Wars AT-AT or AT-ST design, no branded franchise elements, no gore. A premium original military science-fiction game art cover, subtle grain and masterful painted textures.

### Prompt du panorama de Vesper

> Use case: stylized-concept. Asset type: side-scrolling 2D game distant background panorama for original science fiction game ORDRE DE CENDRE. Ultra wide 3:1 landscape panorama, painterly 2D premium game background, no UI, no text. Alien industrial ash desert planet Vesper at dawn: desaturated slate teal sky at top fading to dust peach at horizon, giant pale planet and a very thin ring diagonally at upper left, far distant refinery silhouettes with small warm orange glows, eroded mesa cliffs and volcanic spires, heavy atmospheric perspective. Horizon and distant ground at lower 70 percent, open sky above. Foreground is empty dusty terrain in lower 25 percent, no rocks blocking a player. The playable character will be drawn separately in front. Multi-layer matte painting quality with dramatic shape design, delicate haze and exquisite texture. Distant scenery only, no humans, absolutely no walker vehicles, no robots, no cars, no spaceships. Make visual composition read as a side-view scrolling battlefield background, long continuous panorama, everything small and far away with broad open middle ground. Steel gray, muted rust, ochre, very restrained orange, sophisticated contrast, no neon. Illustration not photograph.

## Assets construits par le code

`src/renderer.mjs` dessine six châssis dans trois familles de locomotion, leurs articulations, les ennemis, les civils, le convoi, le train, les stations de MI03, les installations de MI04, les radiateurs, les plantes et les plans procéduraux de Nacre et Thyr. Les aperçus de jeu dans `docs/previews/` sont des rendus Skia de ce code ; ils n’incluent pas les menus et le HUD HTML. Les vues du classeur dans ce dossier proviennent de son moteur de rendu, et ne sont pas des images du jeu.

Les cinq nouveaux aperçus de la 0.4 sont reproductibles avec `tools/render-v04-previews.mjs`. Le panneau des six machines utilise les vues de hangar à une même échelle. Les quatre états MI03 sont atteints par les commandes publiques : relevé du dispensaire, contrôle de Holt, maisons vérifiées avant choix, puis variante de dispensaire détruit par trois tirs réels de roquettes. `docs/previews/v04-render-manifest.json` conserve les états et les limites. Les fenêtres, ruines, antennes et boîtiers sont construits par le code, sans nouvel asset généré ni contenu externe extrait.

Les six aperçus de la 0.5 se reproduisent avec `tools/render-v05-previews.mjs`. Cinq montrent MI04, depuis un vrai dossier v3 migré : pompe remise en pression, vanne à mi-parcours, liaison radio en cours, journal copié, puis variante du poste détruit avant lecture. Le sixième montre un radiateur atteint par les ennemis de MI01, à mi-réparation. Aucun état de victoire ni point de santé n’est affecté directement par ce générateur. `docs/previews/v05-render-manifest.json` fige chaque état par copie profonde au moment de son rendu ; les étapes suivantes ne modifient pas les preuves antérieures. Les nouveaux bâtiments, ventilateurs, pompes, boîtiers et ailettes sont procéduraux.

Les rendus Skia utilisent Liberation Mono comme remplacement métrique de Courier et DejaVu Sans pour le titre du panneau lorsque ces polices système sont disponibles. Elles ne sont pas embarquées dans le jeu. Aucune capture navigateur n’est revendiquée pour ces aperçus.

`assets/emblem.svg` est un emblème géométrique original. Les icônes et la typographie utilisent le code de l’interface et les polices système. Aucun fichier de police tiers n’est distribué.

`src/audio.mjs` crée les effets de tir, d’appui, de rechargement, d’impact et de liaison avec des oscillateurs et du bruit synthétisé. Il ne contient aucun échantillon audio externe. Une bande-son, le doublage et le mixage définitifs restent à produire.

## Référence de conception

La [page officielle de BE-A Walker sur Steam](https://store.steampowered.com/app/864160/BEA_Walker/) a servi à vérifier le principe de contrôle volontaire des jambes et l’usage tactique des pas. Le projet n’incorpore pas de contenu extrait de ce jeu. Les noms, mondes, factions, personnages et missions décrits ici appartiennent à la fiction proposée pour ImperiumMarch.
