# Production 0.10 — La route des vivants

**ORDRE DE CENDRE — Chaque pas laisse une trace.** La 0.10 ouvre Thyr avec MI09, étend le dossier de campagne au format v9 et ajoute un kit visuel réutilisable. Neuf missions principales et six châssis sont jouables au stade prototype. Les trois opérations autonomes gardent leurs propres rapports.

## Livrables reçus

| Domaine | Réalisation 0.10 | Portée et limites |
| --- | --- | --- |
| Campagne | MI09 après le premier rapport de MI08, deux conduites, approche, carte, projecteurs, barrière, migration, tireurs, escorte et transmission. | Le choix ne remplace aucune opération physique. MI10–MI32 et les seize contrats restent conçus. |
| Supports vivants | Deux colonnes FL07 et leurs racines portent deux habitats; gabarit réel et appuis déterminent le passage. | Habitabilité conservée sans effectif humain supposé. Le contournement balisé ne constitue pas un nouveau pilotage en profondeur. |
| Migrateurs FU07 | Deux adultes et deux jeunes gardent santé, peur, trajet et destination. | Au bilan résolu, arrivées au verger, exclusions vivantes et pertes totalisent quatre. Une fertilisation locale ne garantit pas une saison entière. |
| Colonies FU08 | Deux colonies réagissent aux projecteurs, flashs locaux et retour du calme. | Une colonne détruite ne retrouve pas son nid. L’écologie générale de la forêt reste conçue. |
| Dossier v9 | Migration authentique v8, checkpoints physiques, premier rapport immuable, relecture isolée et dotation unique de quatre lots. | Le marqueur historique `stage:'complete'` est conservé. La progression propose MI09 à partir du rapport manquant; les personnes de Nacre ne deviennent pas des habitants de Thyr. |
| Visuels Thyr | Onze composants, trente-cinq SVG et deux planches PNG, avec primitives partagées entre exports et renderer. | FL08 est décorative. FL09 possède une réaction visuelle; aucune filtration de l’air, fumée toxique ou perception simulée n’est ajoutée par ces dessins. |
| Interface | Briefing, instrument de route, bilan et journal distinguent les quatre animaux, les deux habitats et les résultats logistiques. | Un DOM modélisé ne certifie ni navigateur natif ni compréhension par un joueur. |
| Entrées | Relâchement lors de la navigation, focus des boutons HUD, répétitions anciennes neutralisées, pause remappée et perte de capture du pointeur. | D+Tab est reçu dans Chrome. Les essais de changement d’onglet et de barre d’adresse donnent des résultats différents selon l’instance ; QA19 reste ouverte, sans cause présumée ni réception du tir maintenu. |
| Conception | 845 fiches, 29 ajouts et 816 identifiants historiques conservés. | Le classeur et le registre décrivent une réception; leurs compteurs ne mesurent pas un pourcentage du jeu terminé. |

Le [contrat de MI09](CAMPAIGN_MISSION_09.md) fixe les opérations et leurs conditions. Le [contrat du dossier v9](CAMPAIGN_SAVE_V9.md) décrit les migrations, les refus d’états incohérents et la conservation des anciens faits. Le [guide du kit Thyr](../assets/thyr/README.md) relie les composants à leurs usages et limites.

## Une route accomplie

Holt demande un passage logistique dans un secteur déclaré sauvage. L’écoute du poste local permet un guidage plus court; les grandes coques doivent préparer un contournement. La carte, relevée matériellement, constate deux habitats omis. Ce constat ne donne ni PT02 ni TE01 et ne révèle pas le mécanisme global de PALINODE. La défection reste située en MI16.

La conduite impériale dirige les animaux vers une zone d’exclusion. La conduite de migration maintient leur passage vers les vergers. Dans les deux cas, il faut manœuvrer la barrière puis attendre la résolution des quatre individus. Une brèche due à une destruction ne choisit pas leur destination; des guides manuels demandent encore du travail.

Deux tireurs deviennent actifs après cette résolution. Le véhicule logistique doit être libéré, escorté et réellement atteindre le dépôt. Une transmission de bilan puis l’extraction achèvent la mission. La perte du véhicule demeure une défaite; les animaux déjà arrivés, les supports perdus et les dommages ne disparaissent pas lors du retour au dossier.

## Vérifications et preuves

La [réception QA 0.10](QA_V10.md) sépare les familles de contrôles. La [suite Node consignée](validation/v10-node-tests.json) comporte **356 tests réussis**, dont **28 tests de simulation MI09**, **34 tests de dossier v9** et **trois tests du kit Thyr**. Ces sous-suites sont incluses dans le total. Les [**66 parcours du script autonome en DOM modélisé**](validation/v10-ui-validation-final.json) couvrent la nouvelle mission et les transitions précédentes. Les [**40 comparaisons SVG/Canvas**](validation/v10-raster-validation.json) portent sur cinq références précédentes et les trente-cinq états Thyr, au même seuil de recouvrement.

Les [22 scènes Canvas](previews/mi09-render-manifest.json) proviennent de 17 sorties conduites par commandes publiques. Le manifeste conserve des copies profondes au moment de la capture. Le [reçu Canvas](previews/mi09-canvas-validation.json) vérifie que le rendu ne modifie pas l’état autoritaire et que les exports de campagne se relisent. Il ne prétend pas avoir exercé le HUD HTML, le navigateur, le matériel ou l’audio.

La [preuve de simulation](previews/mi09-simulation-validation.json), la [preuve de campagne](validation/v010-campaign-validation.json) et la [preuve de focus modélisé](validation/v10-focus-modeled.json) indiquent leurs sources et leurs limites. Le journal global conserve aussi la modification de texte observée pendant l’exécution consignée; la livraison finale et son contrôle CI sont des étapes distinctes.

La réception du classeur, des cellules source, des formules et des vues est détaillée dans [BIBLE_README.md](BIBLE_README.md). Un recalcul LibreOffice en mode headless reste différent du tri, des filtres, du défilement des volets ou d’une modification dans une interface bureautique. QA29 conserve ce besoin interactif.

Le [reçu Chrome 0.10](validation/native-v10/browser-reception.json) ajoute une migration réelle v8→v9, les contrôles de briefing, décision et bilan aux zooms déclarés, puis une extraction depuis un checkpoint préparé, suivie d’un export et d’une recharge. Les neuf rapports et les 42 lots d’atelier sont conservés. Les checkpoints préparés sont distingués des gestes natifs ; aucune partie humaine complète n’est revendiquée. La petite fenêtre native et la perte de focus complète restent à recevoir : QA20 et QA19 gardent leur statut À produire.

La première publication est attestée par une CI sur le commit exact et une correspondance de 18 ressources HTTP avec leurs octets source. Le [suivi de déploiement](DEPLOYMENT.md) conserve les reçus initiaux et identifie séparément la livraison finale et ses quatre libellés corrigés.

## Les critères « À produire » restent traçables

Le [registre 0.10](PRODUCTION_REGISTER_V10.md) conserve les **133 critères initiaux de la 0.8** : 56 assets, 38 tâches de production et 39 QA. Il reprend leurs lignes d’origine et leurs réceptions 0.9, puis ajoute les nouveaux travaux par identifiant. Le kit AS18 passe au stade Prototype; son critère de finition reste présent. Le lot biologique AS21 et l’Acte II complet PR18 restent À produire malgré leur première tranche disponible.

Les nouvelles fiches de Thyr ne sont pas ajoutées à ce dénominateur historique. Le registre suit 36 réceptions Prototype, 16 critères Vérifié dans leur portée et 81 critères encore À produire. Ces nombres ne signifient pas que 52 livrables finaux ou critères humains sont achevés.

Les travaux encore ouverts comprennent la finition de MI01 comme niveau de référence, les missions et contrats suivants, l’animation et les matières finales, les voix, l’écoute sur matériel déclaré, la manette physique et les essais humains sans guidage. PR85 et QA169 décrivent explicitement la réception humaine de Thyr. QA19 garde son problème natif jusqu’à une nouvelle observation concluante.
