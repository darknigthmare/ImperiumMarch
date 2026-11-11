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

La liaison a été contrôlée en recherchant les projets rattachés à l’identifiant du dépôt GitHub. Le domaine est attribué et vérifié. Une adresse attribuée ne prouve pas qu’une version du jeu a déjà été construite : le commit et l’état du déploiement doivent être contrôlés séparément.

La protection Vercel par défaut est conservée (`all_except_custom_domains`). L’accès aux adresses `vercel.app` peut donc demander une connexion Vercel autorisée. Aucune ouverture publique ni modification des droits n’est effectuée implicitement.

## Historique de publication 0.3–0.4

Les versions locales 0.3 et 0.4 n’ont pas été publiées lors de leurs préparations : la revue automatique de l’action demandait de retrouver l’autorisation explicite de publication sur le dépôt public. Aucun transfert par une autre voie n’a été utilisé pour contourner ce refus.

## Préparation et contrôle initial de la 0.5

La reprise de la 0.5 a retrouvé les instructions originales : mettre l’ensemble du projet sur `darknigthmare/ImperiumMarch`, puis la confirmation de publication sur `main` et de liaison à Vercel. La livraison suit ce périmètre déjà demandé.

Au contrôle initial de cette reprise, `git ls-remote` indiquait encore `be63e872a6d315aa5e803fc366686d8c01c37bf7` sur `main`. L’API Vercel confirmait le projet `imperium-march` de l’équipe ci-dessus, `live: false` et `latestDeployment: null`. Ces observations décrivent l’état **avant la publication 0.5**, pas l’état futur du site.

La livraison 0.5 se construit à partir d’un commit vérifié, avec le classeur, les sources, le HTML autonome, les visuels et les preuves locales. Après publication, vérifier que `main` porte ce commit et que le déploiement de production correspond à son SHA. Un projet simplement lié, une adresse attribuée ou une construction locale ne suffisent pas à annoncer le jeu disponible. Les vérifications distantes et leurs adresses sont indiquées dans le compte rendu de livraison.

## Dossier du joueur

La sauvegarde reste locale au navigateur et à l'adresse du site. Utiliser l'adresse de production stable pour continuer une partie. Une adresse de prévisualisation, un autre domaine et le fichier autonome disposent de stockages distincts. Pour déplacer une partie, utiliser **Exporter le dossier**, puis importer le JSON sur la nouvelle adresse.

## Édition autonome

`npm run build` conserve son rôle : produire `dist/Ordre_de_Cendre.html`, qui s'ouvre hors ligne. Ce fichier et le classeur de conception sont inclus dans le dépôt et le pack de la 0.5. La construction web ne les modifie pas.

## Contrôles avant publication

- `npm run build`, `npm run build:web` et `npm run check`.
- `npm test`, `npm run check:ui` et `npm run check:ui-runtime` après reconstruction du fichier autonome.
- Vérifier que la page d'accueil, les modules, les styles et les images sont présents dans la sortie web.
- Après déploiement, contrôler le commit servi, la disponibilité des ressources et le lancement de la campagne dans un navigateur réel.

Les tests de simulation et d'intégration sont documentés dans [QA_V05.md](QA_V05.md). Un déploiement prêt ne remplace pas une validation navigateur.
