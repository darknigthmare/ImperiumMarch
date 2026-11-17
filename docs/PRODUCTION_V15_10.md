# 0.15.10 — Sols de Thyr et Kharon, fumée et poussière

**ORDRE DE CENDRE · 17 novembre 2026**

Cette tranche poursuit la génération depuis le `main` 0.15.9 publié, commit `2be40743cbc0ac436786882e314e6c4c289ff31f`. Elle ajoute trois lots aux scènes déjà jouables : les matières et petits décors de Thyr, ceux de Kharon, puis deux séquences de particules pour les émissions existantes du moteur. Les originaux et les preuves des versions antérieures sont conservés.

## Contenu ajouté

| Lot | Atlas PNG | Cellules | Utilisées au rendu | Références |
| --- | ---: | ---: | ---: | ---: |
| Matières et petits décors de Thyr | 2 | 10 | 10 | 0 |
| Matières et petits décors de Kharon | 2 | 10 | 10 | 0 |
| Six phases de fumée et six de poussière | 2 | 12 | 12 | 0 |
| **Ajout 0.15.10** | **6** | **32** | **32** | **0** |

Le [comptage vérifié](validation/painted-counts-v01510.json) porte le catalogue à **90 atlas et 676 cellules**, dont **632 utilisées au rendu et 44 références**, dans **21 lots**. Les quatre panoramas restent comptés séparément. Une cellule est une matière, une pièce ou un état d'image ; elle ne représente pas un individu ou une mission supplémentaire.

## Thyr : humus, fibres et sous-bois

Quatre matières habillent le terrain de PL03 : humus sombre, argile fibreuse brun-violet, schiste humide moussu et tourbe stratifiée. Six silhouettes basses occupent les emplacements décoratifs existants : pierre moussue, feuilles tombées, écorce morte creuse, fougère rampante, coques de graines ouvertes et lichen sur galet.

Les cellules complètent les missions MI09–MI12 et l'opération de Thyr. Elles ne remplacent pas les racines porteuses, les plantes réactives ou les sites de ponte déjà représentés. Les feuilles et les coques tombées restent des débris végétaux décoratifs, sans population ou cycle écologique déduit de leur présence. Le [README du lot](../assets/painted/thyr-scenery/README.md) relie les prompts, mesures, sources sélectionnées et scènes reçues.

## Kharon : basalte, scories et cuivre froid

Les matières de PL04 sont le basalte fissuré, la scorie compacte, la maçonnerie réfractaire et le métal graphite aux joints de cuivre terni. Les petits décors sont un bloc de basalte, du gravier de scorie, une pierre soufrée, une mousse de scorie, une fougère de fonte basse et un tronçon de conduite froide.

Le lot apparaît dans MI13 et MI14. OP03 reste sur Thyr, PL03. Les lumières fortes, la vapeur et les états thermiques viennent des faits simulés ; aucune chaleur n'est prépeinte dans ces décors. La fougère FL10 et la mousse FL11 sont décoratives dans cette tranche : elles ne signalent pas un flux de vapeur, ne modifient pas le bruit et n'ajoutent pas de croûte fragile. Leurs capacités finales gardent le statut conçu dans la Bible.

Le [README Kharon](../assets/painted/kharon-scenery/README.md) précise les ancrages, le terrain, les replis et les scènes de réception. Les ponts thermiques et la galerie continuent d'utiliser leurs surfaces physiques propres.

## Projection du sol et correction des raccords

Les matières suivent le profil `terrainAt` et des fenêtres de texture attachées aux coordonnées du monde. Les raccords entre matières utilisent un fondu de 96 unités. Les décorations rejoignent les emplacements au sol déjà employés par le renderer, sans ajouter de collider ou de ressource.

La relecture des premières scènes a révélé de fines coutures verticales entre bandes lorsque la caméra était fractionnaire. Les limites de dessin sont désormais alignées sur les pixels de sortie. Les échantillons source, le profil du relief et les états de mission restent inchangés. Les premières preuves signalant le défaut sont conservées ; les réceptions corrigées possèdent leurs propres dossiers et des contrôles d'opacité à plusieurs cadrages et échelles.

## Particules : les émissions existantes reçoivent leurs textures

Les deux atlas fournissent **six phases de fumée grise et six de poussière minérale**. L'âge de la particule choisit sa phase, sans boucle. Les sprites remplacent les cercles du rendu historique uniquement pour les types et palettes effectivement émis par le moteur. Les tirs, impacts et appuis continuent de créer les mêmes particules, aux mêmes positions et avec les mêmes vitesses, tailles, durées et règles d'expiration.

Le rayon de fumée conserve sa croissance historique ; le rayon de poussière reste celui de la particule. L'opacité continue d'être calculée par le renderer. L'ancrage mesure l'enveloppe utile de l'image ; le dessin est limité au cercle historique. Les rares pixels de halo alpha 1/255 n'étirent pas cette mesure. Les PNG conservent tous leurs pixels et seuls les fragments hors du cercle sont masqués au rendu. La réduction des mouvements fixe la phase peinte tout en conservant la trajectoire, le rayon et la disparition simulés. La pause ne fait pas avancer les phases.

Les couleurs personnalisées de sauvegardes, les étincelles, les autres types et les images indisponibles gardent leur rendu de repli. Aucun historique graphique n'entre dans le dossier de campagne. Le [lot de particules](../assets/painted/particles/README.md) documente ces choix et les émissions reçues par commandes publiques.

Les premières sorties Imagegen avaient un halo trop étendu entre les cellules. Elles sont rejetées et documentées dans les prompts. Une édition Imagegen a resserré les six bouffées de chaque planche et rétabli leur séparation transparente. Les deux sorties sélectionnées sont conservées octet pour octet ; aucun script ne retouche, ne réduit ou ne réencode les PNG.

## Continuité et portée

Le [contrôle de conservation](validation/v01510-final/preservation.json) compare les assets, aperçus, validations et fixtures historiques à la base 0.15.9. La Bible conserve ses **1 007 fiches, 21 onglets, 133 critères initiaux et tous les statuts**. La campagne reste **MI01–MI14**, avec six marcheurs, trois opérations et une sauvegarde **v14**.

Cette tranche reçoit une partie des kits AS18/AS19 et des effets AS22. Les impacts propres aux matériaux, les ricochets, les flammes, les débris physiques, les traces persistantes, les animations finales et les critères humains restent ouverts. Les acteurs actuellement simulés possédaient déjà leurs lots peints ; aucun captif individuel, ouvrier de MI13 ou habitant supplémentaire n'a été inventé pour remplir un atlas.

Le [rapport QA](QA_V15_10.md) distingue les tests, les scènes Canvas, le DOM modélisé et la réception native. Le [suivi de déploiement](DEPLOYMENT.md) identifie séparément les sources publiées et la version effectivement reçue par Vercel.
