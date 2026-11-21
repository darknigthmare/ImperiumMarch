# 3Dviz Pro Max dans ce dépôt

Le skill [3dviz-pro-max](https://github.com/viettranx/3dviz-pro-max) complète les
outils IA du projet pour concevoir, améliorer et vérifier des scènes 3D,
des objets, des décors, des caméras, des éclairages et des interactions.
Il aide à choisir la géométrie, les proportions, les matériaux et les animations
en fonction du sujet, puis à examiner le résultat réellement rendu.

## Une copie commune et deux points d’entrée

Le dossier canonique complet est conservé dans
`.ai-tools/3dviz-pro-max/skill/`. Il contient **805 fichiers amont**, auxquels
s’ajoute la **licence MIT** de l’auteur. Les données, références, scripts,
modèles, kits et quatre fichiers GLB accompagnent donc `SKILL.md`.

| Client | Point d’entrée du projet | Invocation explicite après découverte |
| --- | --- | --- |
| Codex | `.agents/skills/3dviz-pro-max/SKILL.md` | `$3dviz-pro-max` |
| Claude Code | `.claude/skills/3dviz-pro-max/SKILL.md` | `/3dviz-pro-max` |

Ces deux petits adaptateurs demandent de lire le skill complet dans le dossier
commun. Ils partagent ses 806 fichiers, soit **9 831 343 octets**, sans dupliquer
les ressources ni dépendre de liens symboliques. Les chemins restent utilisables
dans un checkout Windows. Les adaptateurs sont propres à cette intégration ;
les fichiers amont dans `skill/` sont conservés sans modification.

La révision intégrée est
[`d077e0e68915c25be8e71d74684d3144fd1c2aca`](https://github.com/viettranx/3dviz-pro-max/tree/d077e0e68915c25be8e71d74684d3144fd1c2aca/skills/3dviz-pro-max),
version de catalogue `0.1.0`. La provenance, la taille et les empreintes de chaque
fichier figurent dans [source.json](source.json), qui distingue les fichiers
amont des deux adaptateurs locaux.

La découverte dépend du client, de sa version et de ses réglages. Vérifier
le point d’entrée réellement chargé et l’accès au dossier commun avant
d’annoncer le skill actif. La présence des fichiers dans GitHub ne prouve ni
leur chargement par une application hébergée, ni l’exécution d’un moteur 3D,
ni l’observation d’une image. Éviter de charger simultanément une autre version
du même skill comme plugin.

Exemple pour reprendre un jeu existant :

> Utilise 3dviz-pro-max pour examiner la perspective, l’échelle des objets,
> les raccords de géométrie, les matériaux, l’éclairage et les caméras de ce jeu.
> Reprends son moteur et ses conventions, corrige les défauts pertinents,
> puis vérifie les vues et les interactions concernées dans le rendu réel.

Pour vérifier la reconnaissance sans créer de scène :

> Trouve le skill 3dviz-pro-max du dépôt. Indique le point d’entrée chargé,
> le chemin du skill complet et la recette du catalogue adaptée à un petit
> village fantastique. Ne génère pas encore la scène.

## Articulation avec les autres outils

Reprendre les instructions, plans, documents et autorisations du projet.
Spec Kit peut cadrer une évolution ; Superpowers accompagne l’implémentation,
le diagnostic et la revue ; Claude Code Game Studios apporte les compétences
jeu pertinentes dans Claude Code. 3dviz-pro-max apporte son raisonnement
spatial et ses ressources visuelles lorsque la tâche concerne la 3D.
Obscura peut aider à inspecter une page si son moteur est disponible ; les
contrôles WebGL et les comportements doivent aussi être vérifiés dans
le navigateur prévu par le projet.

Conserver le moteur existant : l’intégration d’un skill Three.js/Blender
ne demande pas de convertir un jeu Unity, Godot, Unreal ou 2D.
Utiliser les références adaptées au changement, y compris dans un dépôt
sans jeu, sans imposer le workflow complet à une petite correction.
Les choix de caméra, de mouvement et de direction artistique déjà validés
restent la référence. Les consignes et les contrôles d’accès applicables
à l’environnement restent en vigueur.

## Vérification locale des fichiers

Depuis la racine du dépôt :

```bash
python3 -B .ai-tools/3dviz-pro-max/verify.py
```

Sous Windows, `py -3` peut remplacer `python3`.
Le vérificateur fonctionne hors ligne. Il contrôle les chemins, tailles,
SHA-256 et identifiants Git des 806 fichiers communs, ainsi que les empreintes
des deux points d’entrée. La licence fait partie des fichiers contrôlés.
Il ne télécharge rien et ne modifie aucun fichier. Un fichier absent,
différent ou lié symboliquement entraîne un code de sortie non nul.
Les fichiers locaux supplémentaires ne sont pas supprimés ; seuls les fichiers
décrits par le manifeste sont couverts par cette vérification.

Les fonctions de recherche du catalogue utilisent Python et sa bibliothèque
standard. Exemples depuis la racine :

```bash
python3 -B .ai-tools/3dviz-pro-max/skill/scripts/search.py "fantasy village" --collection recipes --limit 3
python3 -B .ai-tools/3dviz-pro-max/skill/scripts/resolve.py recipe.fantasy-village-diorama
```

Pour d’autres recettes, reprendre l’identifiant exact renvoyé par la recherche.
Les commandes abrégées `scripts/...` du skill se lancent
depuis le dossier commun `skill/`, ou avec son préfixe complet comme ci-dessus.
Exécuter les commandes de build du jeu dans le dossier du jeu.

## Outils optionnels et limites du paquet

Le skill apporte des instructions et des ressources. Les outils nécessaires
à une scène restent ceux du projet et de la machine d’exécution :

- **Three.js, Node et le gestionnaire de paquets** : nécessaires si le projet
  ou un modèle choisi les utilise ; ils ne sont pas ajoutés aux dépendances
  du jeu par cette intégration.
- **Playwright et son navigateur** : nécessaires au helper optionnel
  `scripts/capture.py`. L’inspection dans un navigateur disponible est aussi
  possible. Sans capture ou inspection effective, ne pas déclarer une vue
  observée. Installer les dépendances éventuelles dans l’environnement
  d’outils approprié, selon les règles du projet.
- **Blender** : optionnel pour la modélisation et les opérations de bake.
  Sa présence ne certifie pas la qualité d’une scène. Les niveaux T0–T4
  décrivent les pipelines des kits fournis, pas une limite de créativité.

Le dépôt amont contient également des exemples, une galerie et des outils
de développement du catalogue qui ne font pas partie du dossier canonique.
Leur absence n’empêche pas la recherche ni l’utilisation des ressources
installées. Le helper `quality_brief.py` possède son propre mode de repli
lorsque le validateur de développement amont n’est pas présent.

Pour `hero-tier.py`, préciser **`--root CHEMIN_DU_PROJET`** dans cette installation.
Son export automatique par `scripts/kit_proof_harness.py` appartient aux outils
de développement amont et n’est pas fourni ici. Pour lancer un bake à partir
d’un export existant, fournir aussi **`--t1-glb CHEMIN_DU_GLB`**, en plus des
autres arguments requis ; vérifier auparavant Blender et la compatibilité
de cette commande avec le système. Un statut `unavailable`, `skipped` ou
`timeout` n’est pas un bake réussi.

Les scripts amont restent des outils explicites. Cette intégration ne lance
aucun de ces scripts au démarrage du jeu, dans ses builds ou dans Vercel.

## Mise à jour

Examiner la nouvelle révision amont, puis copier à nouveau tout le dossier
canonique et la licence dans **le dossier commun `skill/`**. Comparer les
changements locaux avant remplacement, actualiser le commit et les empreintes
de `source.json`, puis relancer `verify.py` et une recherche du catalogue.
Si les adaptateurs changent, actualiser aussi leurs deux empreintes dans
`source.json`. Conserver une seule copie des ressources partagées.

Ne pas remplacer uniquement `SKILL.md` : ses ressources doivent rester
cohérentes avec lui. La révision est volontairement épinglée ; aucune
mise à jour automatique n’est configurée.

## Sources et droits

- [Dossier canonique à la révision intégrée](https://github.com/viettranx/3dviz-pro-max/tree/d077e0e68915c25be8e71d74684d3144fd1c2aca/skills/3dviz-pro-max).
- [Instructions d’installation amont](https://github.com/viettranx/3dviz-pro-max/blob/d077e0e68915c25be8e71d74684d3144fd1c2aca/docs/installation.md).
- [Compatibilité déclarée par l’auteur](https://github.com/viettranx/3dviz-pro-max/blob/d077e0e68915c25be8e71d74684d3144fd1c2aca/docs/compatibility.md).
- [Licence MIT de Viettranx](https://github.com/viettranx/3dviz-pro-max/blob/d077e0e68915c25be8e71d74684d3144fd1c2aca/LICENSE).

Conserver les mentions de licence lors des copies. Le dossier intégré ne
comprend pas la galerie, le site, les fontes ni les meshes anatomiques des
exemples amont. Les assets externes ajoutés ultérieurement au jeu conservent
leurs propres conditions et leur provenance.
