# Validation 0.12 — Une voix au ras du sol

La réception porte sur le prototype MI01–MI11, les six châssis et les trois opérations indépendantes. Moteur sans DOM, script en DOM modélisé, rendu Canvas, classeur et navigateur natif sont des environnements distincts. Les reçus indiquent leurs commandes, résultats et empreintes ; aucune validation humaine n’est déduite d’un contrôle automatique.

## Contrôles globaux sur les sources figées

La [suite Node finale](validation/v12-node-validation.json) passe **516 tests sur 516**, sans échec, annulation, omission ni test à faire. Elle est exécutée sous **Node 24.22.1** ; les empreintes des entrées restent identiques pendant les 76,8 secondes de cette passe. Le moteur déclaré pour la publication est Node 22.x ; sa réception distante est consignée séparément après publication.

Le [reçu de construction](validation/v12-build-validation.json) confirme l’édition autonome de **10 507 813 octets**, vingt modules intégrés, 189 identifiants HTML et 178 références JavaScript littérales. La construction web et l’audit statique rapprochent **442 médias sources et 442 copies web**, sans entrée inconnue. Les trois fichiers image demandés par le jeu restent intégrés dans l’édition autonome ; les formes sont dessinées en code et les sons synthétisés.

Les sous-suites de simulation et campagne ci-dessous sont incluses dans les 516 tests globaux ; elles ne doivent pas être additionnées à ce total. Les parcours du DOM modélisé, les images Canvas et le recalcul de classeur ont chacun leur reçu distinct.

### Corrections issues de la revue

Quatre contre-exemples atteints par les commandes publiques ont été corrigés : rencontre avant les deux inspections, mort avant le constat de rencontre, défaite avec émetteur intact sans liaison rétablie, et retrait de coopération avant tout témoignage. Les priorités du HUD suivent maintenant les prérequis réellement manquants. Le bilan conserve l’existence du signal local. Les archives et la réaction de Sami n’évoquent un ancien enregistrement que s’il a été achevé. Aucun fait matériel n’a été fabriqué pour rendre ces textes cohérents.

Le premier contrôle global avait aussi trouvé une ancienne assertion de portée limitée à MI01–MI10 dans le test de MI02. Seule sa liste de missions courantes a été étendue à MI11 ; les contrôles ferroviaires et les autres assertions matérielles restent conservés.

## Simulation et campagne

Le [reçu de simulation MI11](previews/mi11-simulation-validation.json) et son [journal](validation/v12-simulation-tests.tap) conservent **120 tests réussis : 35 MI11 et 85 régressions partagées**. Douze parcours complets utilisent seulement les commandes publiques, sur six châssis et deux conduites en difficulté normale, avec 572 checkpoints périodiques. Ils vérifient les trois écoutes, les appuis réellement surélevés, la ponte préservée, les sources, le témoignage protégé, l’opération d’émetteur et l’extraction.

Les cas de perte utilisent des tirs et états physiques. Le refus, le retrait avant et après témoignage, le décès de Leth avant et après enregistrement, la perte des originaux et la défaite restent distincts. Un Leth déjà mort ne prononce aucune nouvelle phrase. Son décès ajoute une seule perte non combattante ; les nids ne sont pas transformés en population.

Le [reçu de campagne](validation/v012-campaign-validation.json) passe **224 tests**, dont 41 MI11. Le [contrat v11](CAMPAIGN_SAVE_V11.md) décrit les migrations et la validation. Les travaux partiels doivent avoir des dates et préconditions causales, tout comme les travaux terminés. La comparaison entre checkpoints interdit d’antidater une reprise, de recréditer une progression interrompue ou d’effacer une perte. Les premiers rapports et leurs dotations restent immuables.

## Interface exécutée dans le modèle de DOM

Le [reçu d’interface](validation/v12-ui-validation.json) et le [journal](validation/v12-ui-runtime.txt) confirment **86 parcours sur 86**, dont les 71 parcours antérieurs et 15 parcours MI11. La passe finale dure 164,5 secondes ; 46 entrées comparées avant et après, dont l’HTML autonome exact, restent identiques. Le reçu a été produit comme contrôle préparatoire puis repris dans la livraison après rapprochement de toutes ses empreintes, sans modifier ses octets.

Les nouveaux parcours vérifient migration du dossier v10, briefing, HUD, écoute interrompue et relancée, rencontre et accord sans témoignage anticipé, pause et reprise de l’échange, deux conduites avec intervention matérielle, extraction réelle au clavier depuis un point préparé, onze rapports et dotation unique. Les quatre combinaisons de présence des colonnes d’archive sont vérifiées, ainsi que la perte ultérieure du témoin.

Les quatre contre-exemples de la revue sont exécutés séparément dans le même HTML final. Le pilote de contrôle de la copie a aussi été ajusté pour conserver une marge de freinage : son premier arrêt se trouvait hors du rayon réel d’interaction. Aucun rayon de jeu n’a été augmenté pour faire passer le test.

La relecture est contrôlée au lancement, pendant un déplacement et à la pause, sans écriture du dossier officiel ; sa fin complète est couverte dans les tests de campagne. Le DOM modélisé exécute les gestionnaires livrés, mais ne valide pas le CSS natif, un dialogue système, le focus d’une vraie fenêtre ou une partie humaine.

## Provenance du dossier v10

La fixture [campaign-v10-mi10.json](../tests/fixtures/campaign-v10-mi10.json) provient des exports de la 0.11 figée, produits avec les commandes publiques. L’[attestation](validation/v012-historic-v10.json) identifie les octets et leur arbre historique. **Ce dossier n’est pas présenté comme un export natif de navigateur.** Les fixtures antérieures gardent leur provenance propre et leurs octets.

La migration ajoute seulement le domaine voix non visité et le numéro v11. Elle conserve dix rapports, ressources, flotte, scènes anciennes et marqueur historique. MI11 se déduit du premier rapport manquant. Un dossier sans dépense peut passer de 46 à 50 lots après sa première réussite ; une relecture ne reçoit aucune nouvelle dotation.

## Rendu et assets

La [réception Canvas](previews/mi11-canvas-validation.json) comprend **25 images, dix-huit parcours complets et cinq exports de campagne**. Le générateur part du dossier v10 figé et n’utilise aucun setter de position, santé, temps, permission ou résultat. Les captures copient profondément l’état ; le rendu doit le laisser strictement inchangé. Les six châssis sont observés avec un vrai pied sur la corniche.

Les cinq exports préparent l’écoute, l’échange, la décision, l’avant-extraction et le dossier terminé. Ils sont destinés à une réception native future, qui devra déclarer ce point de départ préparé.

La [revue visuelle](validation/v12-canvas-visual-review.json) porte sur les 25 scènes en planche d’ensemble, cinq scènes nommées en pleine résolution et les deux planches d’assets. Le refus n’affiche aucun témoignage acquis ; la perte ultérieure de Leth conserve TE01 tout en retirant sa disponibilité. L’émetteur saisi laisse un socle vide. Les libellés de monde peuvent passer derrière la machine ; les panneaux de statut restent distincts.

Le [journal raster](validation/v12-assets-render.txt) passe **90 comparaisons**, dont les 26 nouveaux états de voix, au seuil de recouvrement conservé de 92 %. Le lot comprend six composants, vingt-six SVG et deux PNG. Cette concordance de géométrie ne constitue ni une validation artistique finale, ni un essai de performance.

## Classeur et registre

La Bible reçoit **905 fiches sur 21 feuilles**, avec 6 105 cellules source, 20 tables et 126 formules. Les 873 IDs précédents restent présents et 32 fiches sont ajoutées. Le [guide](BIBLE_README.md) et le [registre](PRODUCTION_REGISTER_V12.md) indiquent les réceptions réellement obtenues : correspondance de cellules, conservation de baseline, recalcul indépendant et vues examinées.

Le [recalcul final](validation/workbook-v0.12-libreoffice.json), exécuté avec LibreOfficeDev 26.8.0.0.alpha0 sur une copie isolée, a retiré puis reconstruit les 126 caches de formule en **35,922 secondes**. Les 6 105 cellules source, résultats et structures restent identiques ; le classeur livré n’a pas été modifié par ce contrôle. Une première exécution avait dépassé le délai court ; le budget explicite a été augmenté sans assouplir les critères de réception.

La [revue visuelle finale](validation/workbook-v0.12-visual-review.json) porte sur **48 vues** : les cinq vues modifiées ont été relues, les 43 autres sont octet-identiques aux vues déjà examinées. La [baseline](validation/workbook-v0.12-baseline-check.json) conserve **519 fichiers historiques**, 873 identifiants et les 133 critères initiaux. Sept sondes négatives et huit baselines sans Git vérifient séparément les contrôles de référence et de conservation.

Le registre initial compte désormais **37 Prototype, 16 Vérifié et 80 À produire**. Une seule ligne initiale change de statut : AS13, reçue partiellement. La source complète compte **278 Conçu, 374 Prototype, 88 À produire et 165 Vérifié** ; ces compteurs décrivent des fiches, pas un pourcentage du jeu achevé.

Les 133 critères initiaux gardent leur exigence d’origine. AS13 est un **Prototype partiel**, limité à un interprète local et ses outils. Les Khelt complets, leurs animations finales et leurs voix restent ouverts. Le recalcul automatique ne vaut pas réception interactive dans Excel ou Calc ; QA29 n’est pas clôturée par celui-ci.

## Réception native non effectuée

Le [constat 0.12](validation/native-v12/browser-reception.json) n’enregistre **aucun nouvel essai natif**. Il référence deux contraintes déjà observées en 0.11 : Vercel a refusé la création du déploiement par HTTP 402, ressource `api-deployments-free-per-day`, avec `Retry-After: 86400` ; le navigateur de contrôle refuse les URL `file://` et a interdit un autre chemin local destiné à contourner ce refus.

Le site observé demeure la 0.10. Aucune nouvelle demande explicite de déploiement n’est effectuée pendant le délai annoncé. Aucun serveur indirect, proxy, autre surface ou changement de sécurité n’est employé. Les observations natives 0.9 et 0.10 restent historiques et ne sont pas étendues à MI11.

Migration native, interruption d’écoute, protection et pause de l’échange, décisions, opération, extraction, archives, recharge, petite fenêtre réelle, focus, manette physique et écoute sonore restent à recevoir dans l’environnement approprié. Le [protocole humain](PLAYTEST_VOICE_V12.md) possède un [formulaire non exécuté](validation/human-mi11-session-template-v12.json) ; PR91, QA190 et QA191 restent ouverts.
