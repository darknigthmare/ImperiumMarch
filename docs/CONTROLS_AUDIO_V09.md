# Commandes, son et accessibilité — version 0.9

## Clavier configurable

Le panneau Réglages permet de changer onze actions de pilotage : directions, deux groupes d’appuis, ancrage, purge, recharge, réparation, interaction, pause et plein écran. Les préférences sont locales et survivent au rechargement. Une touche déjà utilisée est signalée sans modifier la configuration ; Échap annule une capture et demeure toujours disponible pour la pause. Changer de vue annule également la capture. Les touches système et les combinaisons Ctrl/Alt/Meta restent hors de la capture.

Le jeu conserve les codes physiques `KeyboardEvent.code`. Les positions Q et A ainsi que la flèche gauche sont disponibles par défaut pour couvrir AZERTY/QWERTY. Les aides de pilotage, le briefing, la pause, l’étiquette accessible du Canvas et la consigne HTML suivent les affectations. Les actions de tir restent sur les boutons de souris ; les deux groupes d’appuis restent disponibles au tactile.

Les préférences invalides sont remplacées par un ensemble complet de valeurs par défaut. Une donnée partiellement corrompue ne supprime pas silencieusement une action. La reconfiguration et la restauration des valeurs initiales sont des boutons HTML avec focus visible et message d’état accessible.

## Manette standard en mission

| Commande standard | Action |
| --- | --- |
| Stick gauche / croix gauche-droite | Déplacement |
| Stick droit | Orientation de la tourelle, direction conservée après relâchement |
| RT/R2 ; RB/R1 | Canon ; roquette |
| LT/L2 ; LB/L1 | Ancrage ; purge |
| A/✕ ; X/□ ; Y/△ | Interaction ; recharge ; réparation |
| Croix haut-bas | Appuis manuels A/B |
| Start/Options | Pause/reprise |

Le jeu échantillonne l’API Gamepad à chaque image et accepte la disposition `standard`. La zone morte est de 22 %. Les axes sont bornés et les valeurs non finies neutralisées. Une connexion, un remplacement de manette, une perte de focus ou une pause impose le retour des commandes au neutre. Une touche Start maintenue ne bascule pas la pause en boucle. Une déconnexion relâche immédiatement les commandes.

Les menus et les décisions restent pilotés au clavier ou à la souris, ce que le panneau indique. Les tests de manette sont des échantillons synthétiques injectés dans le lecteur pur puis dans le script complet ; aucun matériel physique n’a encore été certifié. Le remappage des boutons de manette, les profils non standard et les vibrations ne sont pas livrés.

## Sons produits et raccordement

`src/audio.mjs` synthétise les mêmes PCM que les WAV exportés dans `assets/production/audio/`. Le lot comprend huit ambiances distinctes, trois motifs et quarante-quatre signaux ; les manifestes décrivent leurs sources et limites. Les WAV ne sont pas téléchargés pendant le jeu. Aucun enregistrement de voix ni morceau tiers n’est incorporé.

Le son attend une interaction et l’autorisation du navigateur. La scène choisit une ambiance planétaire et un motif ; une décision locale ne provoque pas le motif de rupture. Les signaux sanitaires, hydrauliques et de départ sont reliés à des changements effectifs de faits. Une ouverture de dialogue ne vaut pas consentement, une allocation ne vaut pas embarquement et une arrivée n’est pas jouée lors du simple départ.

La première observation d’un checkpoint initialise silencieusement le suivi. Pause, volume nul, changement de scène et sortie nettoient les sources. La limite de 24 sources actives empêche leur accumulation ; les signaux critiques ont priorité. La fin de mission arrête l’ambiance et joue son signal de résultat. La bibliothèque possède une page d’écoute et un montage Nacre de 36 secondes pour une revue de mix.

## Vérifications et reste

Sept tests purs des commandes et quatre parcours du script complet vérifient affectation, conflit, annulation, déplacement reconfiguré, conservation des préférences, neutralisation et pause de manette. Dix-huit tests purs des assets et du son vérifient notamment synthèse déterministe, exports, ressources et transitions sanitaires réelles. Cinq cas de comparaison SVG/Canvas sont exécutés séparément par le checker raster obligatoire. Le journal initial de dix-neuf tests garde sa portée historique, avant cette séparation de la dépendance native. Le détail des exécutions et les essais Chrome sont conservés dans la validation 0.9.

Les critères humains de PR24 et QA62 restent ouverts : confort avec joueurs concernés, manettes physiques, lecture à distance réelle, fatigue et mix écouté. Le protocole `HUMAN_VALIDATION_V09.md` et les fiches vierges permettent de consigner ces essais sans prétendre qu’ils ont été effectués.
