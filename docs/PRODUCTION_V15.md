# ORDRE DE CENDRE — production 0.15.0

**16 novembre 2026 · ImperiumMarch · Dossier de campagne v14**

La 0.15.0 poursuit la reconstruction 0.14.1 par **MI14 — Les mains noires**. La campagne propose maintenant **quatorze missions au stade prototype**, six châssis et trois opérations indépendantes. Les **dix-huit missions MI15 à MI32**, les seize contrats et la finition de production restent ouverts.

## L’atelier de Kharon

Après le convoi de MI13, Sera reçoit l’ordre de briser l’arrêt d’un atelier. Huit ouvriers refusent un lot saboté. Le joueur doit dégager un passage sans écraser les personnes, neutraliser l’automate et réparer le refroidisseur avant de donner une suite matérielle à son choix.

Cette mission réunit quatre opérations dont les conséquences restent séparées : protéger des personnes en mouvement, rétablir une machine, conserver une source et exécuter un ordre. Les détails de portée, de durée et de causalité figurent dans le [contrat MI14](CAMPAIGN_MISSION_14.md).

| Livrable | Présent dans cette tranche | Travail restant |
| --- | --- | --- |
| Piquet ouvrier | Huit personnes locales, demande de passage, déplacement vers la galerie et pertes individuelles | Animation finale, voix et réception humaine du pilotage |
| Automate | Alerte, activation différée et neutralisation physique | Variété finale des unités industrielles |
| Refroidisseur | Inspection, isolation, réparation et pertes d’organes | Équilibrage matériel et sensations thermiques reçues sur une partie humaine |
| Récit de l’atelier | Explication distincte de la copie, recoupement conditionnel avec PT03 | Missions MI15–MI16, chaîne politique et défection |
| Deux conduites | Redémarrage ou maintien de l’arrêt avec commande de terrain | Réception native et humaine des enchaînements |
| Coopération | Demande réelle après arrêt et froid réparé ; mécaniciens vivants disponibles | Usage ultérieur de ce contact dans les missions suivantes |
| Dossier v14 | Migration additive, sauvegardes et premier rapport unique | Contrôles humains d’usage et suite de la campagne |
| Kit graphique | Géométrie d’atelier originale reliée aux états de simulation | Art final de Kharon et Sereis |

Les trois ouvriers venus de Nacre sont une cohorte locale arrivée avant le recensement connu. Aucun individu des missions MI05–MI08 n’est déplacé ou ressuscité pour compléter le nouveau piquet. Les deux mécaniciens restent sur le site : leur disponibilité n’est pas un recrutement.

Le [kit de l’atelier](../assets/workshop/manifest.json) comporte **sept composants**, **33 SVG**, **33 PNG transparents** et **deux planches**. Les variantes comprennent les mécaniciens ; elles ne constituent pas une planche complète d’animation. Le [contrôle raster](validation/mi14-raster.json) compare les 33 silhouettes SVG/Canvas, avec un recouvrement minimal de **99,89 %**. Les [scènes de mission](validation/mi14-canvas.json) documentent quatorze vues, quatre parcours achevés et sept exports. Leurs rapports conservent les empreintes des modules et leur portée exacte ; l’art final et les sensations humaines restent ouverts.

## Continuité de livraison

Le commit local de reconstruction `fc9f4af4e103adf93d4310053610ca69bea443b3` est la baseline immuable de cette tranche. Il n’est pas disponible comme commit public : la reprise de publication transporte son arbre sous une nouvelle révision, identifiée dans le [suivi de déploiement](DEPLOYMENT.md). Ses fixtures, empreintes et preuves sont conservées. La 0.15 ne réécrit ni les rapports historiques, ni les fixtures, ni leurs preuves de réception.

La migration ajoute seulement le dossier d’atelier vide. Le premier rapport donne quatre lots une fois. La relecture reste indépendante ; la reprise d’une défaite ne relance pas une partie vivante. Les absences de preuves, les corps détruits et les pertes restent des faits jusqu’à l’extraction.

## Bible et registre

La source conserve les **977 identifiants** de la 0.14.1 et reçoit **30 nouvelles fiches**, pour un total de **1 007**. Le classeur garde **21 onglets**, **20 tables** et **126 formules**. Les comptes de la synthèse proviennent des fiches et ne représentent pas un pourcentage d’achèvement du jeu.

| Domaine | Nouveaux identifiants | Fiches |
| --- | --- | ---: |
| Systèmes | SY128–SY135 | 8 |
| Narration | NA95–NA98 | 4 |
| Production | PR98–PR100 | 3 |
| Prototype | PX117–PX121 | 5 |
| QA | QA222–QA231 | 10 |
| **Total** | | **30** |

Le [registre de production 0.15](PRODUCTION_REGISTER_V15.md) conserve les **133 critères initiaux** et leurs réceptions antérieures. Cette tranche ne gonfle pas ce dénominateur. Un prototype d’atelier ne ferme pas les critères d’art final, de campagne entière ou d’essai humain.

Le [guide du classeur](BIBLE_README.md) donne les commandes de génération, la provenance de la baseline et les contrôles de l’export courant. La source reste `data/bible.json` ; le XLSX est sa version consultable et éditable, régénérée avec le même outillage.

## Réception et suite

[QA_V15.md](QA_V15.md) rassemble les résultats exécutés sur les fichiers de cette tranche. Les preuves de simulation, de DOM, de Canvas, de navigateur et d’essai humain restent séparées. Aucun résultat historique n’est réattribué à la 0.15 par simple copie.

La prochaine mission conçue est **MI15 — Sous le même numéro**. Elle doit extraire Aline Serrat d’un laboratoire détruit par la sécurité privée et ouvrir les acquisitions propres à TE02 et PT04. MI14 prépare les conséquences locales de Kharon sans anticiper ces événements ni la défection de MI16.
