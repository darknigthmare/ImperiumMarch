# Déploiement web — ORDRE DE CENDRE

## Construction

```sh
npm run build:web
```

Cette commande produit `web-dist/` avec `index.html`, les modules et styles de `src/`, ainsi que les images de `assets/`. La racine du site ouvre le jeu. Aucune dépendance à installer, fonction serveur, base de données ou variable secrète n'est nécessaire.

`vercel.json` sélectionne le préréglage **Other**, ignore l'installation de dépendances, exécute `npm run build:web` et publie `web-dist`. La navigation entre campagne, simulations, hangar, archives et réglages reste dans la page : aucune réécriture de routes n'est nécessaire.

Le dépôt source est [darknigthmare/ImperiumMarch](https://github.com/darknigthmare/ImperiumMarch), branche de production : `main`. La liaison Git Vercel a été créée et vérifiée le 10 novembre 2026 dans l’équipe **darknigthmare’s projects**. Les nouveaux commits de cette branche peuvent déclencher une construction automatique.

## Liaison vérifiée

| Élément | Valeur |
| --- | --- |
| Projet Vercel | `imperium-march` |
| Identifiant projet | `prj_ggDB98oddkTTzVPiGQrtxnj7frcr` |
| Équipe | `darknigthmares-projects` |
| Identifiant équipe | `team_VrIjq2UWV6VaHZr7DdQFwvfu` |
| Dépôt GitHub | `darknigthmare/ImperiumMarch` · `1453177984` |
| Adresse de production attribuée | [imperium-march.vercel.app](https://imperium-march.vercel.app) |
| Runtime de construction | Node.js `22.x` |
| Construction / sortie | `npm run build:web` / `web-dist` |

La liaison a été contrôlée en recherchant les projets rattachés à l'identifiant du dépôt GitHub. Le domaine est attribué et le jeu y est déployé. Le premier déploiement complet, vérifié READY, correspond au commit `c8f1a4dcfe1c65e15c032bac009ee249aa324469` de la version 0.5. Les publications suivantes doivent également être rattachées à leur SHA exact.

La protection Vercel existante est conservée (`all_except_custom_domains`). Le domaine de production a effectivement ouvert le jeu dans Chrome partagé le 11 novembre 2026, sans modification de cette configuration. Les adresses de prévisualisation peuvent demander une connexion autorisée.

## Historique de publication 0.3–0.4

Les versions locales 0.3 et 0.4 n’ont pas été publiées lors de leurs préparations : la revue automatique de l’action demandait de retrouver l’autorisation explicite de publication sur le dépôt public. Aucun transfert par une autre voie n’a été utilisé pour contourner ce refus.

## Préparation et contrôle initial de la 0.5

La reprise de la 0.5 a retrouvé les instructions originales : mettre l’ensemble du projet sur `darknigthmare/ImperiumMarch`, puis la confirmation de publication sur `main` et de liaison à Vercel. La livraison suit ce périmètre déjà demandé.

Au contrôle initial de cette reprise, `git ls-remote` indiquait encore `be63e872a6d315aa5e803fc366686d8c01c37bf7` sur `main`. L’API Vercel confirmait le projet `imperium-march` de l’équipe ci-dessus, `live: false` et `latestDeployment: null`. Ces observations décrivent l’état **avant la publication 0.5**, pas l’état futur du site.

## Publication 0.5 accomplie

Le commit `c8f1a4dcfe1c65e15c032bac009ee249aa324469`, enfant du README initial, a publié 160 fichiers. Son arbre distant a été comparé aux empreintes locales. La [CI GitHub](https://github.com/darknigthmare/ImperiumMarch/actions/runs/42972756981) a réussi. Vercel a automatiquement construit `dpl_8KqVrP25Y4ueXws2to9g6wY3ZNsN`, état READY, pour ce même SHA et la cible production.

La racine, les six modules, les deux feuilles de style et l'emblème ont répondu HTTP 200. Chrome partagé a ensuite ouvert le site, sélectionné le Pèlerin, lancé MI01 et repris son point après pause et rechargement. Ces contrôles sont distincts du lancement Chromium local, bloqué avant navigation par les permissions de socket.

## Publication 0.6

La 0.6 ajoute MI05 et le dossier v5, avec un classeur de 643 fiches. `package.json` fixe maintenant `engines.node` à `22.x` : l'ancienne plage ouverte avait laissé Vercel choisir Node 26 malgré le réglage de projet. La CI utilise également Node 22.

Les contrôles et livrables sont consignés dans [QA_V06.md](QA_V06.md). La publication du snapshot final et le contrôle navigateur de MI05 suivent ces vérifications locales. Le reçu de publication doit préciser la tête GitHub, le déploiement correspondant, son état, la CI et les ressources servies.

## Dossier du joueur

La sauvegarde reste locale au navigateur et à l'adresse du site. Utiliser l'adresse de production stable pour continuer une partie. Une adresse de prévisualisation, un autre domaine et le fichier autonome disposent de stockages distincts. Pour déplacer une partie, utiliser **Exporter le dossier**, puis importer le JSON sur la nouvelle adresse.

## Édition autonome

`npm run build` conserve son rôle : produire `dist/Ordre_de_Cendre.html`, qui s'ouvre hors ligne. Ce fichier et le classeur de conception sont inclus dans le dépôt. La construction web ne les modifie pas.

## Contrôles avant publication

- `npm run build`, `npm run build:web` et `npm run check`.
- `npm test`, `npm run check:ui` et `npm run check:ui-runtime` après reconstruction du fichier autonome.
- Vérifier que la page d'accueil, les modules, les styles et les images sont présents dans la sortie web.
- Après déploiement, contrôler le commit servi, la disponibilité des ressources et le lancement de la campagne dans un navigateur réel.

Les tests courants sont documentés dans [QA_V06.md](QA_V06.md). Les rapports précédents restent conservés comme historique. Un déploiement prêt ne remplace pas une validation navigateur.
