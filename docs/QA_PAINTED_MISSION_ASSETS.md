# QA graphique 0.15.5 — Transports, Nacre et troisième relais

**16 novembre 2026 · Reprise de la tranche locale 0.15.4 puis ajout de 13 atlas**

La suite locale reçoit la simulation, les images décodées, les assemblages Canvas, l’interface modélisée, les deux constructions et le classeur. Les résultats ci-dessous portent sur les fichiers effectivement testés. Les preuves distantes et navigateur sont rattachées séparément à leur commit dans [DEPLOYMENT.md](DEPLOYMENT.md).

## Contrôles exécutés

| Contrôle | Résultat | Preuve |
| --- | --- | --- |
| Suite Node complète | **745 tests réussis, zéro échec ou test ignoré** | [npm-test.txt](validation/release-v0155/npm-test.txt) |
| Catalogue et conception | **1 007 fiches, 6 châssis, 3 opérations, 14 missions** | [check-project.txt](validation/release-v0155/check-project.txt) |
| Comparaison SVG/Canvas historique | **174 / 174 cas** | [assets-render.txt](validation/release-v0155/assets-render.txt) |
| PNG de la nouvelle tranche | **13 / 13 identiques à leurs sorties Imagegen sélectionnées** | [generated-originals.json](validation/release-v0155/generated-originals.json) |
| Transport | **4 atlas, 20 cellules, 5 vues Canvas** | [receipt.json](validation/painted-transport-v0155/receipt.json) |
| Nacre | **6 atlas, 30 cellules, 5 vues Canvas** | [receipt.json](validation/painted-nacre-v0155/receipt.json) |
| Prétoire et relais | **3 atlas, 30 cellules, 9 vues Canvas** | [receipt.json](validation/painted-relay-v0155/receipt.json) |
| Cinq lots précédents | **32 atlas / 306 cellules décodés de nouveau** | [raster-gates.json](validation/release-v0155/raster-gates.json) |
| Interface statique et script autonome | **213 IDs, 185 références, 5 vues, 6 dialogues ; script compilé** | [check-ui.txt](validation/release-v0155/check-ui.txt) |
| Interface en DOM modélisé | **108 parcours réussis** | [check-ui-runtime.txt](validation/release-v0155/check-ui-runtime.txt) |
| HTML autonome | **50 modules, 45 atlas peints, toutes les ressources intégrées** | [build-offline.txt](validation/release-v0155/build-offline.txt) |
| Archive hors ligne | **Entrée unique, extraction exacte, CRC et SHA-256 reçus indépendamment** | [zip-verification.json](../dist/Ordre_de_Cendre.zip-verification.json) |
| Construction web | **Réussie** | [build-web.txt](validation/release-v0155/build-web.txt) |
| Bible | **21 onglets, 126 formules sans erreur, statuts et critères conservés** | [BIBLE_V15_5.md](BIBLE_V15_5.md) |
| Conservation | **1 511 preuves historiques, 32 PNG précédents et 21 sources protégées inchangés** | [preservation.json](validation/release-v0155/preservation.json) |

Les 745 tests incluent les 719 de la tranche précédente et **26 nouveaux tests** : onze transport, six Nacre, six relais et trois pour l’archive hors ligne. Les tests ciblés ne s’ajoutent pas une seconde fois au total. La réception locale utilise Node 24.22.1 ; la CI du dépôt conserve Node 22.x, et sa réussite doit être associée au HEAD distant exact.

## Contrats de rendu reçus

Les 80 cellules des nouveaux lots sont mesurées dans leurs dimensions réelles, non vides et transparentes autour du sujet. Les roues ne sont pas dupliquées dans les carrosseries. Les pièces suivent les ancres et positions existantes : contacts des roues, attelages, plateau, caisses, quilles, pieds du Prétoire et bouche de tir. Les renderers n’altèrent pas les domaines sérialisés.

Les états de perte priment sur les variantes de présentation. Les captifs quittent la fenêtre après résolution du sauvetage. La balise récupérée disparaît de l’ambulance. Les bateaux ne créent pas de passagers prépeints et les copies de preuves ne sont pas effacées par une avarie ultérieure. Le Prétoire reste absent avant son alerte.

Les trois références sont explicitement hors sélection runtime : canon endommagé du Prétoire, cassette isolée et balise récupérée. Aucune santé, présence ou animation nouvelle n’est déduite de ces images. Les huit chargeurs conservent leur repli vectoriel en cas d’absence ou d’échec de décodage.

## Défauts trouvés et corrigés

- **Cabine du porteur trop haute.** La première image empiétait sur les deux caisses réelles. Une édition Imagegen a abaissé la cabine sous le plateau ; les caisses et leurs collisions ont conservé leurs positions.
- **Attelages du train détachés.** Les anciens traits passaient sous les nouvelles ferrures. Des points mesurés dans les PNG raccordent maintenant chaque extrémité. La réception alpha vérifie qu’ils touchent effectivement le métal ; le mode vectoriel conserve ses positions.
- **Roues et corps insuffisamment raccordés.** Les suspensions du train et de l’ambulance ont été ajustées côté présentation. Les contacts, centres et rayons restent ceux du rendu ou de la simulation existante.
- **Caisse de soins détachée du toit.** Un berceau rejoint sa position simulée sans la déplacer, y compris lorsque la carrosserie est endommagée.
- **Capteur du Prétoire flottant.** Son support rejoint la coque en préservant le collider et l’origine de visée.
- **Voile du matériel médical.** Une correction par Imagegen a produit la transparence attendue ; seul ce PNG final est intégré. Aucun script n’a modifié ses pixels.

## Portée des 19 vues nouvelles

Le lot transport produit une planche d’états et quatre scènes MI02/MI13 obtenues par commandes publiques. Le lot relais produit deux planches et sept scènes MI12 ; son pilote public termine le choix de refus en **205,07 secondes simulées**. Ces captures conservent les états de copie, alerte, verrouillage, dégâts et interventions réellement atteints.

Le lot Nacre produit deux planches et trois vues MI05/MI07/MI08. Ces trois vues suivent 120 ticks publics puis un cadrage diagnostique ; elles ne prétendent pas achever une mission. La planche ambulance impose des variantes sur des copies pour vérifier l’art. Les planches comparatives des autres lots sont également des diagnostics, séparés des parcours publics.

Les 19 fichiers ont été ouverts et relus pendant la réception. Ils proviennent du renderer ordinaire avec les PNG réels. **Ils ne sont pas des captures de navigateur.** Les réceptions antérieures restent intactes et les contrôles de régression écrivent dans le dossier 0.15.5.

## Fidélité de l’édition hors ligne

L’HTML mesure **111 037 952 octets**, SHA-256 `bf5151bdffec8653387e1328ca2917071f5cf4870a03c9bf2fbff307364a4ba1`. Il contient exactement les 45 PNG peints, chacun une fois, et 50 modules conformes aux sources courantes. L’audit statique ne trouve ni import non résolu ni ressource distante requise.

Le ZIP local mesure **81 013 964 octets**, SHA-256 `537a123f46e21bac5a79a4b866bc34a974ffab9ae06d904291019351375d6c75`. Python `zipfile` confirme une seule entrée UTF-8, sa date fixe, le CRC32 `92c5bde5` et l’identité de l’HTML extrait. Un second emballage donne les mêmes octets. Une autre version de zlib peut produire une compression différente ; la fidélité reste l’identité de l’HTML extrait. Le [manifeste](../dist/Ordre_de_Cendre.manifest.json) conserve ces empreintes.

## Limites et publication

Aucun nouvel essai Chromium local n’a été tenté après le blocage documenté en 0.15.4. Le DOM modélisé ne vérifie pas la disposition CSS, le focus natif, les téléchargements, l’audio ni un contrôleur physique. Les essais humains et les animations finales gardent leurs critères ouverts ; aucun statut de la Bible n’est promu par cette réception.

Le [suivi de publication](DEPLOYMENT.md) et son reçu rattachent ensuite la CI, la fusion, Vercel et tout contrôle natif au commit réellement observé. La construction locale seule ne constitue pas une publication.
