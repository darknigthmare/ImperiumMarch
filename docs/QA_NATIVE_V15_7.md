# Réception navigateur limitée — 0.15.7

## Portée et identification

Réception réelle effectuée par l’agent dans le navigateur CUA fourni, sur un nouvel origin d’aperçu. Ce contrôle ne constitue pas un essai humain ni un parcours complet de campagne.

- Aperçu : https://imperium-march-iwanu9i1s-darknigthmares-projects.vercel.app/?test=1
- Déploiement : `dpl_ETi2p8RrLsmCeQBRxTBwoDrNMeaq`.
- Commit de cet aperçu : `9b61a9f96b7308f8edb6b2b9e02ef11addac3eea`.
- Version affichée et observée : **0.15.7**, notamment dans le pied du menu Simulations.

Le contrôle navigateur porte sur cet aperçu. Il est distinct du contrôle HTTP de production effectué par l’agent principal sur le commit `1235102b25a531a90feeb0d1b38a37482a928c5d` / déploiement `dpl_EWsKifPhgoRLqE6ds2N1j9vhW6xm`. Aucune interaction de jeu ni import n’a été réalisé sur l’origin de production dans cette réception.

## Accès

L’ouverture initiale de l’aperçu a redirigé vers la page de connexion Vercel. L’agent principal a ensuite fourni un lien temporaire créé par la connexion Vercel autorisée. Le navigateur a ouvert le jeu et retiré automatiquement le paramètre de partage de l’URL. Aucune protection n’a été modifiée et aucune connexion interactive n’a été effectuée. Ce rapport ne conserve aucun jeton d’accès.

## Gestes et résultats observés

| Contrôle | Geste réel | Résultat visible |
| --- | --- | --- |
| Navigation | Ouverture de Campagne, Hangar, Archives, Réglages et Simulations par les boutons du menu | Les cinq vues et leurs contenus correspondants s’affichent. Les options de réglage n’ont pas été modifiées. |
| MI01 | Commencer la campagne, puis Déployer le marcheur dans le briefing | MI01 « Le couloir quarante-deux » se lance avec le M-12 Vigie, difficulté Pilote, marche assistée. |
| Marche | Maintiens successifs de D par l’API de clavier documentée | Le marcheur se déplace à l’écran ; le convoi devient « EN MOUVEMENT » et sa progression visible passe de 4 % à 14 %. |
| Treuil | Approche à pied, arrêt, puis Espace + E ; maintien d’Espace sur place | Le HUD indique « Déploiement des dalles 28 % » ; une capture ultérieure montre 68 %. Après l’opération, le Canvas affiche « DALLES VERROUILLÉES » et « PASSAGE PROTÉGÉ ». Le treuil est donc reçu jusqu’à l’achèvement visible de cette opération. |
| Pause | Échap | L’écran « Un instant de silence » indique « La simulation est suspendue ». |
| Reprise | Clic sur Reprendre après l’interruption consacrée au formulaire GitHub | Le jeu revient avec le chronomètre à 00:14, valeur observée avant la pause ; une capture suivante montre 00:15. Cette observation ne mesure pas l’immobilité de tous les champs internes du modèle. |
| Retour au menu | Nouvelle pause, puis Retour au pont de commandement | Le menu de campagne affiche « Reprendre MI01 » et signale une sortie en cours. Le bouton de reprise du dossier n’a pas été utilisé ; aucune restauration après rechargement n’est attestée. |

## Imports non reçus

La documentation CUA exposait le sélecteur de fichier : attente de l’événement `filechooser`, clic sur le bouton d’import, puis `chooser.setFiles` avec un chemin partagé. Les quatre fixtures publiques avaient été copiées sans modification depuis `docs/validation/browser-v0157/source` dans le répertoire partagé.

Un appel a été entrepris pour `mi03-prepared-input.json`. Il n’a rendu aucun résultat observable, puis a été signalé « aborted by user after 953.6s ». La réinitialisation de l’environnement a ensuite été constatée. Il n’est pas possible de déterminer, à partir de cette sortie, quelle étape du sélecteur avait été atteinte. Aucun import MI03 n’est confirmé, et aucun essai MI04, MI09 ou MI13 n’a été entrepris ensuite.

**Aucune réception navigateur des scènes MI03, MI04, MI09 ou MI13 ne découle de ce contrôle.** Les validations Canvas et les suites automatisées publiées restent des preuves distinctes.

## État des captures et clôture

Les captures originales JPEG avaient été affichées dans les sorties CUA et enregistrées sous `/workspace/shared/v0157-preview-browser`. Un contrôle exécuté avant la réinitialisation avait copié 14 fichiers JPEG hors checkout, dans `/workspace/scratch/68048c52946b/v0157-preview-browser`. Deux captures supplémentaires avaient ensuite été enregistrées dans le répertoire partagé.

Après la réinitialisation, les deux répertoires ont été vérifiés et étaient absents. Le runtime CUA avait perdu ses variables ; l’onglet 121 était introuvable et l’inventaire Chrome indiquait une liste d’onglets vide. Les captures ne sont donc **plus disponibles comme fichiers archivés**, et aucune empreinte de capture finale n’est fournie. Les observations et les images affichées dans la conversation sont la seule trace de cette réception. Les noms utilisés lors de leur création ne doivent pas être présentés comme des liens vers des fichiers existants.

La clôture CUA a été envoyée : « Terminé le contrôle limité MI01 ». Aucun nouvel onglet ni nouveau scénario n’a été ouvert pour reconstituer les preuves après la réinitialisation. La disparition des onglets a empêché de conserver un livrable navigateur final. Ce rapport texte a été rédigé après le reset, à partir des sorties de la session ; il n’est pas une nouvelle capture ni une nouvelle exécution.

## Publication hors ligne : action refusée

L’interface GitHub Actions était accessible dans une session connectée. Le formulaire du workflow **Publish the complete offline game** (`offline-release.yml`) a été ouvert et rempli avec :

- branche : `main` ;
- tag : `v0.15.7` ;
- commit : `1235102b25a531a90feeb0d1b38a37482a928c5d`.

L’examen automatique a rejeté le clic final **Run workflow**, jugeant que le message utilisateur visible demandant de reprendre ne constituait pas une autorisation explicite de cet effet de publication externe. Aucun nouvel essai ni moyen indirect n’a été utilisé. Aucune exécution de publication n’est confirmée. Le formulaire était resté préparé, puis son onglet a disparu lors de la réinitialisation. Le reçu texte séparé conserve les paramètres et le motif exact ; aucune capture GitHub comportant des informations de compte n’est jointe.

## Limites

- Pas de lecture ni d’injection d’état caché du jeu ; interactions par menus et touches réelles uniquement.
- Pas de comptage des 71 PNG décodés ou de validation exhaustive de leurs états.
- Pas de parcours complet, de QA humaine, d’essai mobile distant, de test de manette ou de mesure de performance.
- Pas de restauration par rechargement, de validation des quatre imports ou de test du HTML autonome dans cette session distante.
- Les preuves historiques et les fichiers du jeu n’ont pas été modifiés pour ce contrôle.
