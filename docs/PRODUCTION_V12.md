# Production 0.12 — Une voix au ras du sol

**ORDRE DE CENDRE — Chaque pas laisse une trace.** La 0.12 poursuit Thyr avec MI11 et le format de dossier v11. Onze missions de campagne, six châssis et trois opérations indépendantes sont jouables au stade prototype. Cette tranche transforme une rencontre et une divergence de traduction en actes, sources et conséquences vérifiables dans le jeu.

## Livrables reçus

| Domaine | Réalisation de cette tranche | Portée conservée |
| --- | --- | --- |
| MI11 | Trois écoutes, corniche, trois sites de ponte, deux copies, rencontre, accord, échange protégé, forces privées, choix, opération d’émetteur, rapport et extraction. | MI12–MI32 et les seize contrats restent conçus. |
| Appuis et silence | Écoutes de quatre secondes sous ancrage ; vrais pieds sur la corniche reconnue ; tirs, explosions et contacts dangereux peuvent dégrader le site. | Aucun mouvement ni protection inventé par le dessin. Les six châssis gardent leurs dimensions et leurs pieds. |
| Leth | Un interprète original PN06, rencontre et consentement séparés, refus ou retrait, vingt secondes d’échange, pertes et disponibilité future. | Leth reste sur le site ; ni recrutement ni autorisation publique ne sont attribués. AS13 est reçu seulement comme Prototype partiel. |
| Sources | Signal d’origine, texte impérial et témoignage distincts ; trois comparaisons françaises révélées selon les pièces acquises. | Les restitutions ne sont pas une transcription linguistique khelte. Une source manquante reste absente. |
| TE01 | Trois signaux exploitables, les deux copies et l’échange consenti achevé. Conservation des archives après perte ultérieure de l’original ou du témoin. | Cette pièce établit localement la déformation des avertissements. Elle ne prouve pas les ordres industriels de MI12 ou toute la chaîne PALINODE. |
| Émetteur | Saisie ou remise en service de cinq secondes après choix ; perte matérielle irréversible. | Le signal local vibratoire est présent au départ ; le canal d’avis est rétabli seulement après intervention. |
| Dossier v11 | Migration v10, reprise précise des travaux, bilan physique, premier rapport immuable et attribution unique de quatre lots. | Les dix rapports précédents, ressources, flotte et checkpoints restent conservés. La fixture v10 est issue d’une simulation historique figée, pas d’un navigateur natif. |
| Graphisme | Six composants, vingt-six SVG, deux planches et rendu partagé avec le Canvas. | Une représentation locale de Leth et de son équipement ; diversité khelte, architecture complète, animation finale et voix restent à produire. |
| Bible | 905 fiches sur 21 onglets, 32 ajouts, 873 IDs antérieurs conservés. | Les 133 critères initiaux restent consultables avec leurs exigences d’origine ; aucun pourcentage d’achèvement n’est déduit du nombre de fiches. |

Le [contrat de MI11](CAMPAIGN_MISSION_11.md), le [format v11](CAMPAIGN_SAVE_V11.md) et le [lot graphique](../assets/voice/README.md) détaillent les comportements et leur intégration.

## Ce que le jeu fait réellement

La mission commence sans localisation acquise, sans rencontre et sans témoignage. Les trois postes livrent leurs signaux seulement après une écoute accomplie. Le repère de corniche permet de reconnaître un passage qui modifie réellement la hauteur d’appui des pieds. La destruction de cette surface ou le passage au sol expose la ponte ; un relevé ultérieur ne restaure aucun dommage.

Le récepteur impérial et l’émetteur ont chacun leur propre copie. Rencontrer Leth ne vaut pas son accord. Obtenir cet accord ne vaut pas un témoignage achevé. Pendant l’échange, les forces privées apparaissent après leur délai réel et les menaces sont simulées. Une sortie de la zone interrompt le travail, qui doit être relancé.

Le dossier conserve les trois restitutions françaises selon les sources effectivement acquises. La colonne impériale dépend de la copie du récepteur. Celle de Leth dépend de l’échange terminé. Les archives distinguent un témoin encore disponible d’un témoignage conservé : décès ou retrait ultérieur ne retirent pas une copie déjà enregistrée, mais modifient les possibilités futures.

Le choix retient la saisie ou la remise en service. Il faut revenir au dispositif et accomplir le travail. La perte de l’émetteur donne un constat matériel ; elle n’est pas réparée par le choix. Le rapport et l’extraction terminent la sortie. Une relecture reste isolée et ne remplace pas ce premier bilan.

## Réception et preuves

La [validation 0.12](QA_V12.md) rassemble 516 tests Node réussis, 86 parcours d’interface dans un DOM modélisé et les contrôles distincts des variantes graphiques et du classeur. Ces familles ont des portées distinctes.

La [preuve de simulation](previews/mi11-simulation-validation.json) consigne 35 tests MI11 dans une passe de 120 tests avec régressions partagées. Les douze parcours standards couvrent les six châssis et les deux conduites, avec 572 checkpoints périodiques. La [réception Canvas](previews/mi11-canvas-validation.json) contient 25 images issues de dix-huit parcours complets et cinq exports préparés. Les scènes sont copiées profondément, acceptées par le validateur de campagne et rendues sans modifier l’état.

La [revue visuelle](validation/v12-canvas-visual-review.json) couvre les 25 scènes en planche, cinq scènes en pleine résolution et les deux planches d’assets. Les 90 comparaisons raster conservent le seuil de recouvrement antérieur. Ces preuves ne valident ni le CSS natif, ni le focus d’une fenêtre réelle, ni le confort de jeu humain.

Le [registre 0.12](PRODUCTION_REGISTER_V12.md) relie les livrables aux critères, reçus et éléments restants. Le [guide du classeur](BIBLE_README.md) distingue cellules source, formules recalculées, revue visuelle et réception bureautique interactive.

## Publication et travail restant

Le [suivi de publication](DEPLOYMENT.md) conserve le commit GitHub, la CI et les éventuels déploiements réellement reçus. Le site Vercel observé demeure la 0.10 ; le refus de quota constaté en 0.11 impose un délai de nouvelle tentative de vingt-quatre heures. La réception native 0.12 est [non effectuée](validation/native-v12/browser-reception.json). Aucune copie préparée ni preuve automatisée n’est renommée en essai natif.

La prochaine mission est **MI12 — Le troisième relais**. Le jeu complet conserve vingt et une missions principales et seize contrats à produire, ainsi que les autres mondes, composants ennemis, doctrines, animations et voix. Le [protocole humain MI11](PLAYTEST_VOICE_V12.md) et son [formulaire vierge](validation/human-mi11-session-template-v12.json) restent prêts pour une vraie session sans guidage. PR91 et QA191 restent ouverts.
