# Protocole des essais humains — tranche 0.9

**Protocole préparé; aucune session humaine n’est rapportée par ce document.** Les lignes QA62, QA78, QA95, QA115, QA137 et QA158 restent ouvertes. La présence de consignes et de fiches d’observation fait avancer la préparation des essais, sans fournir leurs résultats.

Ce protocole sert à observer la compréhension du jeu, les difficultés d’entrée et la perception des conséquences. Les tests automatiques ont déjà leurs rapports séparés. Ils permettent de choisir des scénarios valides et reproductibles; ils ne répondent pas à la question « une personne comprend-elle la situation sans explication extérieure ? ».

## 1. Préparer une session reproductible

Consigner avant la session : version affichée, commit réellement servi ou empreinte du fichier autonome, date, navigateur/version, système, écran et viewport, zoom du navigateur, niveau de son, sortie audio, périphériques et réglages du jeu. Pour une manette, noter le modèle et les axes/boutons effectivement reconnus. Une option Gamepad présente dans le code ne prouve pas qu’un périphérique physique a fonctionné.

Utiliser un identifiant de participant sans nom dans les observations partagées. Noter son expérience pertinente : jeux d’action latéraux, clavier/manette, connaissance préalable du projet et besoins d’accès qu’il souhaite signaler. Une personne ayant développé ou répété le scénario ne doit pas être présentée comme découvrant spontanément la mission.

Le dossier de départ doit être un export valide du jeu, avec son empreinte et sa provenance. Si un point avancé vient d’un pilote de commandes publiques, préciser exactement ce qui a été joué avant l’arrivée du participant. Une fixture technique contenant plusieurs variantes n’est pas directement un fichier d’import destiné au joueur. Préparer un véritable export accepté par le parseur et vérifier son contenu avant la session.

Garder une copie du dossier initial et utiliser une session de test séparée du dossier personnel. Après le parcours, conserver un export final pour comparer les faits aux observations. En cas de capture, demander l’accord de la personne avant l’enregistrement et ne conserver que les informations utiles au test.

La [fiche de session](validation/human-session-template-v09.json) contient les champs à remplir. Ses résultats commencent à `not_observed`; aucune valeur « réussi » n’est préremplie.

## 2. Conduire le test sans enseigner la réponse

Présenter l’objectif de la sortie avec les mots du jeu. Laisser les aides normales, briefings et commandes affichées disponibles. Ne pas expliquer à l’avance le radiateur, la différence entre treuil et coque, le verrou, la provenance de balise ou le sens du carburant cumulé : ces distinctions font partie de ce qu’on mesure.

Au lancement, dire : **« Jouez cette sortie jusqu’au bilan. Vous pouvez consulter les informations proposées par le jeu. Dites ce que vous cherchez à faire quand vous hésitez. »** Il est également possible de demander une description après un moment difficile plutôt qu’une parole continue, si parler perturbe le pilotage.

Pendant le parcours, noter ce qui est observable : action, objet visé, texte consulté, hésitation, retour en arrière, erreur, conséquence et éventuelle demande d’aide. Une interprétation de l’observateur doit rester séparée des paroles de la personne. Écrire « elle tire trois fois sur la coque puis cherche le câble » plutôt que « elle ne comprend pas les bateaux ».

Si une aide extérieure devient nécessaire, l’apporter pour poursuivre le travail, mais enregistrer son instant et son contenu. La partie qui suit ne valide plus la découverte spontanée de cette même notion. Un arrêt pour fatigue, inconfort ou difficulté reste une observation utile; il ne doit pas être effacé par un second parcours guidé présenté comme premier essai.

Après la sortie, commencer par une restitution libre : **« Racontez ce qui s’est passé et ce qui restera pour la suite. »** Poser ensuite les questions ciblées ci-dessous. Ne pas corriger avant d’avoir noté la réponse. Toute correction ultérieure sert à vérifier une nouvelle version ou à recueillir des suggestions, pas à transformer la première réponse en réussite.

## 3. Scénarios et critères de réception

### Accès et commandes — QA62, PR24 et PR42

Faire choisir un châssis, lire un briefing, lancer une mission, mettre en pause et atteindre une décision au clavier. Pour la partie sans audio, couper réellement le son. Pour vérifier l’information qui ne dépend pas de la couleur, demander à la personne comment elle identifie une menace, une cible protégée et un objectif; noter les supports qu’elle a utilisés.

Observer l’ordre et la visibilité du focus, les boutons atteignables, les éventuels pièges dans un dialogue, la fermeture par Échap et la conservation des réglages. Une capture où les boutons sont visibles ne prouve pas que leur ordre de focus est utilisable.

Tester la reconfiguration avec une action réellement changée, puis son usage en mission, sa réinitialisation et sa persistance. Pour une manette physique disponible, observer connexion, déconnexion, reprise, boutons et zone neutre. Si aucun appareil n’est utilisé, conserver cette branche comme non observée.

Pour PR42, présenter les six silhouettes à la même échelle et les faire piloter. Demander quelles différences de gabarit, d’appui et de rôle ont été reconnues. Le fait que six images existent ne mesure pas leur distinction perceptive. Les conclusions restent limitées aux personnes, appareils et réglages effectivement observés.

**Critères à conserver séparément :** navigation au clavier; danger compris sans audio; faction comprise avec un indice autre que la couleur; réglage effectivement utilisable; modèle de manette réellement testé; distinction des silhouettes en mouvement. Un seul point satisfait ne clôt pas PR24 ou QA62.

### Radiateur et héritage de Vesper — QA78, AS36 et PR52

Utiliser une séquence où le radiateur peut être réellement touché. Si le départ se fait après un impact préparé par le moteur, documenter cette préparation. Ne pas affecter directement une santé dans le dossier pour prétendre à une rencontre jouée.

Laisser la personne diagnostiquer l’avarie et trouver une réponse avec l’interface du jeu. Noter le premier indice utilisé, la pièce désignée, le recours éventuel à une fiche technique, la commande choisie, les interruptions et la compréhension du stock de kits. Vérifier ensuite le retour effectif de fonction dans l’état sauvegardé.

Question après parcours : **« Qu’est-ce qui avait été touché ? Comment l’avez-vous su ? Qu’avez-vous fait et qu’est-ce que cela a changé ? »** Une identification donnée après que l’observateur a nommé le radiateur n’est pas spontanée.

Pour l’héritage, employer un dossier dont les actes antérieurs sont connus. Demander : **« Qu’est-ce qui vous a aidé ou gêné dans cette sortie, et d’où cela venait-il ? »** Vérifier si la personne relie elle-même la conduite, les ouvriers ou le dispensaire aux conditions observées à MI04. Le texte du débrief seul ne prouve pas qu’elle a compris la continuité.

QA78 demande également une écoute réelle et un environnement consigné. AS36 peut recevoir une observation de lisibilité de la pièce, mais la finition globale de Vesper reste distincte de cet unique critère.

### Chenal — QA95, PR65 et PR63

Commencer MI05 depuis un dossier MI04 valide. Laisser le participant choisir attente, passerelle ou traversée. Observer s’il consulte le niveau d’eau avant de s’engager, s’il repère une zone d’attente et s’il relie la variation de marée au passage du bateau.

Ne pas dire quel élément viser. Relever les tirs sur câble, tête de treuil et coque, les dégâts réellement produits, la réaction de la personne et sa lecture des deux barges. La découverte d’une erreur puis sa correction est une observation différente d’une lecture immédiate correcte.

Après le bilan, demander : **« Qui était sur les deux barges ? Qu’est-il arrivé au bateau ? Qu’avez-vous réellement récupéré ? »** Comparer la réponse à la facture lue, au contact effectué, aux pertes et au prélèvement de carburant. Un contact disponible mais jamais accompli ne doit pas être crédité dans l’interprétation du test.

Pour PR63, noter aussi la lisibilité des matières, les objets masqués, les signaux concurrents et la fatigue visuelle durant le combat. Un passage fonctionnel réussi ne suffit pas à conclure que l’art ou le mixage est final.

### Digue — QA115 et PR73

Préparer au moins deux conditions valides : une réserve de carburant disponible et une réserve déjà consommée dans une tentative antérieure. Dans ce second cas, la provenance du registre de dépense doit être conservée, avec coût de la sortie actuelle distinct du cumul officiel.

Observer comment la personne établit les appuis, s’ancre, suit les techniciens, comprend le verrou ou le repli manuel, puis termine le travail après son choix de circuit. Ne pas expliquer que le dialogue ne fait pas la vanne : l’action après décision fait partie du critère.

Demander après le bilan : **« Qu’est-ce qui tenait le panneau ? À quel moment le travail était-il fini ? Où sont les habitants et que reste-t-il de leurs maisons ? Qu’est-il arrivé au carburant ? »** Comparer chaque réponse aux faits du dossier. Dix habitants sauvés et deux maisons perdues ne constituent pas une contradiction.

Une reprise après consommation peut servir à vérifier si l’absence de remboursement est comprise. Si la condition a été montrée ou expliquée auparavant au même participant, la qualifier de test de rétention ou d’usage, pas de première compréhension.

### Ambulance — QA137 et PR80

Laisser la personne protéger l’arrêt, consulter le personnel, traiter les sources, choisir une destination et achever le transfert. Observer les actions et les moments où elle considère l’objectif terminé. Relever si elle confond arrivée du véhicule, chariots déployés et arrivée des patients à l’accueil.

Après une restitution libre, demander : **« Quels accords avez-vous obtenus ? Qu’avez-vous appris sur la caisse et la balise ? Savez-vous qui a posé le boîtier ? Qui est réellement arrivé et où ? »** Comparer avec l’accord d’examen, le témoignage facultatif, l’identité de son auteur, les relevés, la récupération et les admissions.

Employer des héritages de rampe différents dans des sessions distinctes ou annoncer clairement la répétition. Demander comment l’aide technique a été obtenue; un technicien vivant dans le dossier ne doit pas être perçu comme une assistance déjà accomplie sans appel.

Une variante avec perte de la conductrice permet d’observer le repli par remorquage. Une perte de source permet de voir si le constat est compris sans journal inventé. Ces variantes doivent venir de dégâts réels et garder leur provenance; leur préparation n’est pas un combat joué par le participant.

### Portes d’Aval — QA158

Employer un dossier MI07 valide et documenté. Ne pas expliquer les capacités des deux bateaux, le rôle de chaque porte ou la différence entre destination, départ et arrivée avant la partie. Observer les contacts consultés, la préparation de l’accueil, le moment où la personne croit avoir obtenu un accord et celui où elle pense avoir terminé la fermeture ou le transfert.

Demander après restitution libre : **« Qui était présent et d’où venaient ces personnes ? Qui a accepté quel service ? Où sont-elles maintenant ? Qu’avez-vous réellement fermé et à quel moment ? »** Comparer aux trajectoires, accords, ouvertures et derniers états du recensement. Les techniciens accueillis à Aval ne doivent pas être attribués au refuge en aval.

Une seconde condition peut perdre une passerelle ou la radio avant contact. Déclarer si cette perte a été préparée par un parcours de commandes publiques. Observer si la personne cherche une nouvelle place, comprend l’absence de capacité confirmée et utilise l’accueil local. Une explication donnée pour débloquer la partie reste une aide enregistrée; elle ne valide pas la compréhension spontanée.

Pour les trois conduites, employer des sessions distinctes ou qualifier explicitement la répétition. Une personne connaissant déjà le fonctionnement du niveau peut tester la cohérence d’une autre branche, sans représenter une nouvelle découverte. Conserver également les erreurs de lecture du registre : pages copiées, support détruit et auteur de la balise sont trois sujets différents.

## 4. Restituer des observations utiles

Pour chaque critère, conserver l’un des résultats **observé**, **partiellement observé**, **non observé** ou **échec observé**, accompagné des faits. « Aucun problème signalé » sans tâche exécutée n’est pas une réussite.

Une observation exploitable contient : l’instant ou le repère du jeu, l’action, la parole exacte si nécessaire, le fait du dossier, l’aide éventuellement donnée et le défaut à reproduire. Classer ensuite le problème par conséquence concrète : progression bloquée, mauvaise décision due à une information absente, mauvaise lecture d’un résultat, difficulté de contrôle ou gêne visuelle/sonore.

Pour corriger, relier le problème à un fichier et à une modification vérifiable. Conserver le premier résultat et ajouter une nouvelle session ou reprise datée après correction. Ne pas remplacer l’échec initial par le succès du second passage. Une répétition avec la même personne peut contrôler l’usage corrigé; elle ne retrouve pas la naïveté de la première découverte.

Le bilan doit indiquer le nombre réel de sessions, leur portée et leurs contradictions. Il ne doit pas généraliser à tous les joueurs, toutes les situations ou toutes les configurations à partir d’un petit groupe de développement. Aucune taille d’échantillon ou réussite globale n’est imposée ici sans objectif d’étude déclaré.

## 5. Mesures de fabrication et niveau de référence

PR27, PR46 et PR56 nécessitent des données de travail réellement observées. Le [journal de fabrication](validation/production-worklog-template-v09.json) commence vide. Une entrée doit nommer le lot, la discipline, le travail effectué, le livrable, la durée observée, les reprises et leur cause. Les durées d’une simulation accélérée et le nombre de fiches ne sont pas des temps de fabrication.

Séparer production initiale, intégration, correction et contrôle. Relever les travaux abandonnés et le temps de reprise au lieu de ne compter que la dernière exportation réussie. Définir le niveau de qualité effectivement atteint avant d’extrapoler un lot Nacre à partir de MI01. Tant que MI01 n’a pas reçu la finition et les essais de référence, présenter les valeurs comme celles d’un prototype.

Pour QA23, déclarer avant mesure scénario chargé, appareil, résolution, réglages, budget visé et méthode de capture. Conserver durée, nombre d’entités, temps de frame et anomalies; distinguer simulation, rendu et pauses. Ce protocole ne fournit aucune mesure de performance ni aucun appareil cible par défaut.

## 6. Contrôles spécialisés encore distincts

**QA29 — logiciel bureautique.** Utiliser une copie du XLSX final dans Excel ou LibreOffice natif. Consigner l’application/version, ouvrir Synthèse et une table, trier/filtrer, vérifier les volets, modifier temporairement un statut puis constater le recalcul. Restaurer la valeur et confirmer le total. Les rendus du moteur de génération et la lecture XML du fichier ne remplacent pas ces actions.

**PR26 — préparation commerciale.** Établir les marchés et boutiques visés, l’inventaire exact des assets, les droits/documentations disponibles et les questions à examiner avec les personnes compétentes. Une liste d’origines ou un résultat de génération ne constitue pas à lui seul cette revue.

**PR48 — lecture narrative finale.** Préparer les tables d’états et les parcours de fins lorsqu’ils seront exécutables, puis faire relire les sources connues, témoins disponibles, pactes et conclusions. La lecture des sept premières missions ne valide pas les quatre familles d’épilogues.

Ces travaux gardent leur entrée dans le registre des 133 livrables. Ils peuvent être préparés et instrumentés maintenant; leur statut ne change qu’après le travail et les observations correspondants.
