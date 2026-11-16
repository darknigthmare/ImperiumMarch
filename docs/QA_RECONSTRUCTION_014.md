# Réception de la reconstruction 0.14.1

**MI01–MI13 sont jouables au stade prototype.** Cette livraison reconstruit les travaux manquants des versions locales 0.13 et 0.14 à partir de la source publique 0.12 et des spécifications conservées. Les fichiers, captures et résultats ci-dessous ont été produits à nouveau. Ils ne prétendent pas récupérer les anciens octets ou leurs anciennes empreintes.

Base historique : [`0f77235f7545f33b1a4f298b81a44ee2122d46dc`](https://github.com/darknigthmare/ImperiumMarch/commit/0f77235f7545f33b1a4f298b81a44ee2122d46dc). Le [cahier de reconstruction](RECONSTRUCTION_014.md), les [règles de MI12](CAMPAIGN_MISSION_12.md), les [règles de MI13](CAMPAIGN_MISSION_13.md) et le [dossier v13](CAMPAIGN_SAVE_V13.md) définissent la portée.

## Résultats exécutés

| Domaine | Résultat de cette reconstruction | Preuve |
| --- | --- | --- |
| Suite de source complète | **623/623 tests**, aucune annulation ni omission | [Reçu](validation/rebuild-global/tests-final.json), [journal](validation/rebuild-global/tests-final.txt) |
| Campagne et sauvegardes | **262 contrôles** inclus dans la suite globale ; migrations, reprises, reçus, ressources et relectures | Tests `campaign-*.test.mjs` et reçu global |
| Simulation MI12 | **36/36 tests**, dont les six châssis dans les trois conduites | [Journal dédié](validation/rebuild-mi12/simulation-tests.tap), [reçu MI12](validation/rebuild-mi12/reconstruction-receipt.json) |
| Simulation MI13 | **33/33 tests**, dont les six châssis dans les deux destinations | `tests/mi13-simulation.test.mjs`, reçu global |
| Interface livrée | **103/103 parcours** du script autonome dans un DOM modélisé : 86 historiques, huit MI12 et neuf MI13 | [Reçu et limites](validation/rebuild-campaign-ui/receipt.json), [journal](validation/rebuild-campaign-ui/ui-runtime.log) |
| Géométrie graphique | **141/141 comparaisons raster SVG/Canvas**, dont 22 états relay et 29 états foundry | [Reçu raster](validation/rebuild-global/assets-raster.json) |
| Scènes MI12 | **22 images Canvas**, 24 parcours complets et cinq exports | [Contrôle Canvas MI12](validation/rebuild-mi12/canvas-validation.json) |
| Scènes MI13 | **23 images Canvas**, six parcours gagnés, une défaite du porteur et sept dossiers importables | [Contrôle Canvas MI13](validation/rebuild-mi13-canvas.json) |
| Catalogue | **20 feuilles de conception, 977 fiches, six châssis, trois opérations et treize missions** | [Contrôle du projet](validation/rebuild-global/project-check.txt) |
| Interface statique | IDs, références, écrans et compilation du HTML contrôlés | [Contrôle statique](validation/rebuild-global/ui-static.txt) |
| Classeur | **21 onglets, 20 tables, 126 formules, 6 571 cellules source rapprochées, aucune erreur** | [Audit XLSX](validation/workbook-v0.14-reconstruction-export.json) |
| Recalcul indépendant | **126 caches supprimés puis recalculés dans LibreOffice sans interface**, aucun écart et original préservé | [Reçu LibreOffice](validation/workbook-v0.14-reconstruction-libreoffice.json) |
| Continuité | **905 IDs et 720 fichiers historiques conservés**, 72 nouveaux IDs ; 133 critères initiaux inchangés | [Contrôle historique](validation/workbook-v0.14-reconstruction-baseline-check.json) |
| Médias | **497 médias sources identifiés et rapprochés de leurs copies web**, aucune anomalie | [Manifeste de distribution](../assets/production/distribution-manifest.json) |

Le runtime local des tests est **Node 24.22.1**. La configuration de publication reste **Node 22.x**. La CI distante doit être attribuée séparément à son SHA exact ; le résultat local ne lui est pas substitué.

Un premier passage global a obtenu 622/623 : un test de catalogue MI02 énumérait encore les onze missions historiques. Sa liste attendue a été étendue exactement à MI12 et MI13, sans changer ses assertions physiques. Le passage complet suivant donne les 623 réussites ci-dessus ; le [premier journal](validation/rebuild-global/tests-initial.txt) reste conservé.

## Comportements reconstruits

### MI12 — Le troisième relais

Les trois relais sont des corps distincts, avec inspection, dégâts et travail propres. La copie exige 24 secondes sous ancrage dans une fenêtre de 45 secondes. Une interruption ne conserve pas un fragment exploitable ; la perte ou l’expiration interdit de révéler les commandes. Une copie terminée reste à bord après destruction de son original.

Le Prétoire apparaît après les six secondes annoncées. Il est absent des collisions et de la visée avant cette arrivée. La destruction du capteur retire sa fonction de visée longue portée ; la destruction du verrou modifie réellement son ancrage et sa protection. La visée tactile du modèle DOM ne cible que ses composants vivants.

Les trois choix ne réalisent aucune opération automatiquement : purge des trois relais ; purge de deux et isolement du troisième ; refus ouvert et isolement des trois. Chaque opération se fait sur place, puis le rapport et l’extraction restent nécessaires. Les pertes sont décrites comme telles, même si le plan prévoyait une conservation. Ilan ne cite que les pièces acquises, Holt conserve les conséquences locales et le refus ferme le refuge sans anticiper la défection de MI16.

### MI13 — Pièces de rechange

Le porteur transporte deux caisses et un bordereau distincts. Les quatre roues et les pieds plantés utilisent les vraies surfaces. Les deux tabliers conduisent la chaleur seulement aux contacts réels. Les vannes exigent quatre secondes d’ancrage ; l’isolation fait ensuite refroidir progressivement le tablier de 90 à 28 °C. La vapeur garde son cycle de trois secondes d’annonce, deux de jet et sept de repos, y compris avec mouvements réduits.

Les deux drones et la tourelle deviennent actifs seulement après six secondes. Les marquages, le bordereau et l’analyse sont des acquisitions distinctes : **PT03 exige les deux marquages, le bordereau et les huit secondes d’analyse terminées**. Les sources détruites avant copie ne sont pas inventées. Une route réellement pilotée depuis l’ancien dossier MI04 perd le journal technique, poursuit jusqu’à MI13 et obtient PT03 sans PT01.

La livraison et la quarantaine exigent le trajet du porteur, le transfert de cinq secondes par caisse, le rapport et l’extraction. Les transferts interrompus conservent leur position et le temps acquis. La perte du porteur reste une défaite terminale, même si le marcheur survit. Aucune destination n’accorde automatiquement diffusion publique, TE02, PT04, PO01 ou défection.

### Sauvegarde et sécurité thermique

Les migrations v11→v12 et v12→v13 ajoutent les domaines des relais et de Kharon. La fixture v11 provient des exports natifs publics de MI11 ; sa [provenance exacte](validation/rebuild-campaign-v11-provenance.json) est conservée. Les anciens rapports, ressources et conséquences ne sont pas réécrits. Les validateurs rapprochent dates, corps, travaux, copies, composants, transferts et agrégats ; les reçus contradictoires sont refusés.

Chaque premier rapport donne quatre lots une seule fois. Relecture et import ne créent pas de nouvelle récompense. La reprise d’une défaite ne ressuscite pas le véhicule ; recommencer reste une action distincte.

Le signal de verrou thermique est actualisé à chaque frame. La ventilation interdit le tir et la sécurité de surchauffe ne se lève que **strictement sous 48 %**. QA06 est reçue pour le comportement automatisé et l’affichage du DOM modélisé ; cela ne constitue pas une réception matérielle ou humaine.

## Ce que les preuves visuelles établissent

Les 45 scènes sont des rendus du véritable renderer Canvas depuis des états obtenus avec les commandes publiques. Les états capturés sont profondément copiés ; les outils vérifient que la continuation et le renderer ne les modifient pas. Ce sont des images Canvas produites dans Node, sans affirmation de navigation native.

Le DOM modélisé exécute le script du HTML autonome et ses véritables gestionnaires de boutons, touches, pointeur et frames. Des checkpoints préparés avec les pilotes publics sont importés explicitement. Les contrôles couvrent les segments annoncés, notamment les choix, travaux, pauses, reprises et franchissements d’extraction. Ils ne prétendent pas être des missions entièrement parcourues à la main ni une mesure de la mise en page CSS dans Chrome.

La Bible possède **41 vues bornées**. Les cellules non modifiées, styles, colonnes, volets et hauteurs historiques sont rapprochés de la source 0.12 dans le [contrôle de mise en page](validation/workbook-v0.14-reconstruction-layout.json). Les réceptions visuelles séparées indiquent les images effectivement ouvertes, leurs empreintes et les éventuelles corrections. Le recalcul LibreOffice sans interface ne remplace pas la manipulation interactive de Calc ou Excel.

## Contrôles encore ouverts

- **QA206 et QA220 :** réception humaine des nouvelles missions, de leur lisibilité et de leurs sensations.
- **QA219 :** parcours MI12 et MI13 dans un navigateur réel. Le [lancement Chromium local](validation/rebuild-global/native-browser-attempt.json) a été bloqué avant chargement de l’application : `socket() failed: Operation not permitted`. Aucun scénario navigateur n’a été exécuté par cette tentative.
- **QA19, QA20 et QA29 :** les limites natives historiques restent conservées : focus et tir maintenu, petite fenêtre réelle et usage bureautique interactif. Les nouveaux tests automatisés ne les ferment pas.
- **Production :** MI14–MI32, les seize contrats et les critères d’art final restent distincts du prototype reçu. Le [registre des 133 critères](PRODUCTION_REGISTER_V14.md) conserve leur texte original et le travail restant.

## Conservation sur GitHub

Le cahier de reconstruction a été publié d’abord dans [`06a6b0b15c504cb5f185c407e551cb15da64270a`](https://github.com/darknigthmare/ImperiumMarch/commit/06a6b0b15c504cb5f185c407e551cb15da64270a). La publication des artefacts reconstruits doit être constatée sur l’arbre distant avant de clore QA221. Les références de commit, l’égalité des fichiers, la CI et Vercel sont consignées dans le [suivi de déploiement](DEPLOYMENT.md), après leurs contrôles effectifs.

Ce rapport concerne exclusivement les preuves de la reconstruction 0.14.1. Les reçus 0.12 et antérieurs restent historiques, sans leur attribuer la validation des nouveaux octets.
