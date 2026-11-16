# Distribution de l’édition hors ligne

**ORDRE DE CENDRE · transition après la 0.15.6 · 16 novembre 2026**

L’édition hors ligne conserve un **HTML autonome complet dans un seul ZIP**. Le fichier contient le code, les styles et les images originales intégrées. Les PNG ne sont ni réduits, ni rééchantillonnés, ni réencodés pour la distribution. Le ZIP applique seulement une compression sans perte à l’HTML ; l’extraction retrouve ses octets exacts.

Le ZIP de la 0.15.6 atteignait déjà 103 369 632 octets, soit moins de 1,5 Mio de marge avant la limite d’un fichier Git. Les nouveaux lots dépassent cette marge. La distribution passe donc aux **fichiers joints à une GitHub Release**, tandis que les sources, atlas et métadonnées restent suivis dans le dépôt. GitHub recommande les releases pour distribuer de gros binaires et accepte des fichiers joints de taille strictement inférieure à 2 Gio : voir [les limites des fichiers Git](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github) et [les limites des releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases).

Ce changement ne publie pas lui-même une nouvelle version. Une release doit être observée avec ses trois fichiers vérifiés avant que son lien soit annoncé comme disponible. Le suivi des publications effectives reste dans [DEPLOYMENT.md](DEPLOYMENT.md).

## Pour jouer

Dans la release correspondant à la version souhaitée, télécharger **Ordre_de_Cendre.zip**, l’extraire puis ouvrir **Ordre_de_Cendre.html** dans un navigateur de bureau. Aucun serveur ou outil de développement n’est nécessaire pour jouer. Le son commence après une interaction.

Exporter le dossier de campagne avant de changer de fichier, navigateur ou appareil, puis l’importer dans la nouvelle édition compatible. Les sauvegardes ne sont pas incluses dans le ZIP public.

La release fournit aussi :

| Fichier | Usage |
| --- | --- |
| `Ordre_de_Cendre.manifest.json` | Version, commit source, arbre Git, environnement de compression, nombre d’octets, CRC32 et SHA-256 de l’HTML et du ZIP. |
| `Ordre_de_Cendre.sha256` | Empreintes du ZIP et du manifeste téléchargés. |

Le fichier ZIP est généré localement mais n’est plus destiné à un nouveau commit Git. Ses éditions historiques restent dans l’historique du dépôt. Il n’y a pas d’archive à assembler en plusieurs morceaux.

## Construire et vérifier localement

Depuis les sources du projet, avec Node.js 22 :

```sh
npm run build
node tools/build-offline-package.mjs --verify
```

La construction produit `dist/Ordre_de_Cendre.html`, `dist/Ordre_de_Cendre.zip`, le manifeste et le fichier d’empreintes. Elle ne modifie aucun asset. Le HTML, le ZIP et le fichier d’empreintes sont des sorties locales ignorées par Git ; le manifeste relu est conservé avec les sources pour donner l’empreinte de l’HTML à reconstruire lors de la publication.

La vérification contrôle :

- Une seule entrée ZIP, avec le nom exact `Ordre_de_Cendre.html`.
- Les en-têtes local et central, leurs limites, leur concordance et le CRC32 du contenu extrait.
- Le SHA-256 et la taille du ZIP ainsi que ceux de l’HTML extrait, comparés au manifeste.
- L’identité octet pour octet avec le fichier HTML local lorsqu’il existe.

Un ZIP et un manifeste téléchargés peuvent aussi être placés dans `dist/` puis vérifiés avant extraction. Si un HTML local d’une autre version existe dans ce dossier, sa différence est signalée ; la vérification ne le remplace pas.

Le champ `source.workingTree` déclare les sources locales comme `clean`, `modified` ou `unavailable`. Les sorties de `dist/` ne comptent pas comme des modifications de source. Un export sans dossier Git reste constructible ; son commit vaut `null`. Un travail non commité ne reçoit pas artificiellement l’identité du prochain commit.

Le ZIP est reproductible pour un même HTML et une même implémentation de zlib. Le manifeste enregistre les versions réelles de Node et de zlib. Entre environnements différents, les octets compressés peuvent varier ; l’empreinte de l’HTML extrait demeure l’invariant comparé à la livraison relue.

## Publier une version vérifiée

La workflow [offline-release.yml](../.github/workflows/offline-release.yml) s’exécute après un push de tag `v*`, ou par **Run workflow** avec un tag de version et un SHA de commit complet. Le tag doit correspondre exactement à `package.json`, par exemple `v0.15.7` pour la version `0.15.7`.

Avant de déclencher une publication :

1. Construire et vérifier les livrables, puis conserver le manifeste de l’HTML relu dans le commit de livraison.
2. Publier les sources, les PNG originaux, leurs métadonnées et les preuves correspondant à ce commit. Le ZIP généré ne doit pas être ajouté au commit.
3. Choisir le commit exact, puis pousser son tag de version ou saisir ce même SHA dans la workflow manuelle.

La workflow résout et vérifie ce SHA avant le checkout. Un tag existant qui pointe ailleurs provoque un échec ; il n’est jamais déplacé. Pour une exécution manuelle visant un nouveau tag, celui-ci n’est créé qu’après les contrôles, sur le SHA demandé.

Le job utilise Node.js 22.23.4, exécute les tests du projet et les contrôles de données et d’interface, reconstruit l’autonome, puis exige que l’HTML corresponde au manifeste relu dans le commit. La version, le commit exact et l’état propre des sources figurent dans le manifeste produit sur le runner. Une seconde extraction par Python `zipfile` recoupe l’entrée unique, le CRC et le SHA-256.

Les fichiers vérifiés sont conservés comme artefact Actions pendant quatorze jours. Ils sont ensuite joints à une release créée en brouillon. Le job vérifie les tailles et empreintes SHA-256 retournées par GitHub avant de publier ce brouillon. Une release déjà publiée n’est réutilisée que si ses trois fichiers ont exactement les empreintes attendues. Aucun fichier existant n’est écrasé.

Si une publication s’interrompt après la création du brouillon, ce brouillon peut rester visible aux mainteneurs. Une relance peut compléter ses fichiers manquants après avoir vérifié son tag et tous les fichiers déjà présents. Un fichier différent ou un tag sans provenance vérifiable provoque un échec, sans écrasement. La workflow ne présente pas un résultat incomplet comme publié. L’artefact Actions permet de récupérer le paquet effectivement vérifié. Les captures et essais humains restent hors de cette validation automatisée.

La permission `contents: write` est limitée au job de publication. Le jeton temporaire `GITHUB_TOKEN` est fourni automatiquement par GitHub Actions ; aucun jeton personnel ni secret supplémentaire n’est demandé. Le checkout ne conserve pas de credentials Git. Voir [l’authentification des workflows](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token) et [les événements déclencheurs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

## Transition du dépôt

Le responsable de la livraison retire le ZIP courant de l’index Git, sans supprimer le fichier de son poste :

```sh
git rm --cached -- dist/Ordre_de_Cendre.zip
```

Le ZIP précédent reste accessible dans les commits historiques. Les liens du README et du suivi de déploiement doivent ensuite pointer vers la release réellement reçue, en gardant les rapports et empreintes antérieurs inchangés. La configuration Vercel continue de construire `web-dist/` à partir des sources ; elle ne dépend pas du ZIP.
