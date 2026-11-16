# Réception 0.15 — Les mains noires

**16 novembre 2026 · Consolidation de la reprise MI14 · Dossier de campagne v14**

La reprise de la 0.15 conserve quatorze missions jouables au stade prototype, les six châssis et les trois opérations indépendantes. Les contrôles ci-dessous ont été exécutés à nouveau sur les fichiers récupérés de MI14. Ils reçoivent cette reprise avant l'intégration de nouveaux sprites peints ; une modification graphique ultérieure possède ses propres contrôles.

Le [reçu de consolidation](validation/mi14-recovery/receipt.json) relie les résultats aux journaux et au [snapshot de sources testé](validation/mi14-recovery/tested-recovery-sources.json). Le commit local de base est `55f384291a7bc00163315ae38c2b682332edf5e4`, augmenté des fichiers MI14 récupérés. Ce commit seul ne décrit donc pas tout l'arbre testé et n'est pas présenté comme une publication distante.

## Contrôles exécutés

| Contrôle | Résultat de cette exécution | Preuve et portée |
| --- | --- | --- |
| `npm test` | **683/683 tests**, aucun échec, aucune annulation ni omission | [Journal complet](validation/mi14-recovery/tests.txt) ; simulation, progression, sauvegardes, géométrie et contrats de source |
| `npm run check` | **20 feuilles de conception, 1 007 fiches, six châssis, trois opérations et quatorze missions** | [Journal du catalogue](validation/mi14-recovery/project-check.txt) |
| `npm run check:ui-runtime` | **108/108 parcours**, dont cinq parcours propres à MI14 | [Journal du DOM modélisé](validation/mi14-recovery/ui-runtime.txt) ; script réel du HTML autonome et ses gestionnaires, sans navigateur |

Le runtime local est **Node 24.22.1**. La suite de tests complète a pris **49,78 secondes**. La configuration de publication reste Node `22.x` ; aucune CI distante n'est déduite de cette exécution locale.

Les sources récupérées contenaient déjà les corrections des deux attentes obsolètes de l'essai précédent : le catalogue inclut MI14 et la version future est définie au-delà de la version courante du format. L'ancien [journal 681/683](validation/v015-tests.txt) est conservé comme essai antérieur en échec. Il n'est pas la preuve de réussite de cette consolidation. Aucun correctif supplémentaire de gameplay n'a été nécessaire pour obtenir les résultats ci-dessus.

## Comportements vérifiés de MI14

Les tests parcourent les deux conduites avec chacun des six châssis. Le passage demandé prend trois secondes sous ancrage, puis les huit personnes gagnent réellement la galerie. Leurs identités, leurs coordonnées, leurs arrivées et leurs pertes restent distinctes. Les contacts de pieds proviennent de la simulation ; forcer le piquet peut provoquer des pertes persistantes. Un ouvrier déjà arrivé reste vulnérable aux dégâts ultérieurs.

L'automate ne peut agir ni recevoir de dégâts pendant les cinq secondes d'activation. Diagnostic, isolation et réparation conservent leurs durées séparées ; quitter une intervention inachevée l'interrompt. Une vanne détruite peut être obturée sans reconstruire son corps. Un refroidisseur détruit ne reprend pas la production, même si une réparation avait été accomplie auparavant.

Le choix de redémarrer ou de maintenir l'arrêt ne manœuvre pas automatiquement la commande. Les cinq secondes de travail restent nécessaires. La coopération exige un échange distinct après les actes requis, un froid rétabli et un mécanicien vivant à la galerie. Une perte après accord conserve l'accord historique et retire la disponibilité de la personne perdue.

L'explication et la copie du lot restent des acquisitions différentes. La copie achevée survit à la destruction ultérieure de son original ; une source détruite avant copie ne fournit aucun relevé inventé. Le recoupement avec PT03 dépend de son acquisition dans MI13. MI14 ne crée ni nouveau PT, TE ou PO, ni diffusion publique, ni défection anticipée.

Les migrations v13→v14 conservent les treize rapports et les checkpoints antérieurs et ajoutent seulement le dossier d'atelier vide et la nouvelle version. Les fixtures historiques restent inchangées. Les reprises retrouvent la même horloge, les mêmes corps et les mêmes opérations. Les falsifications de corps, de dates, de trajet, de copie et de coopération sont refusées. Le premier rapport attribue quatre lots une fois ; la relecture n'efface pas le rapport officiel et ne paie pas de nouveau. Une défaite demeure terminale.

## Interface : ce que mesure le contrôle DOM

Les cinq parcours MI14 vérifient le déblocage après MI13 et l'instrument de mission, la pause et la reprise d'une réparation, les deux commandes suivies de leur rapport, puis la conservation dans les archives d'une copie acquise et d'une perte humaine ultérieure. Les 108 parcours incluent aussi les missions précédentes et leurs sauvegardes.

Le test exécute le script livré et ses gestionnaires dans un modèle de DOM. Le Canvas y est simulé. Ce résultat ne vérifie ni la mise en page CSS, ni le focus natif, ni une vraie navigation Chrome, ni l'écoute audio, ni un périphérique tactile ou une manette physique. Les scènes préparées par les pilotes de simulation sont identifiées comme telles.

## Preuves graphiques conservées de la reprise

| Preuve antérieure récupérée | Contenu attesté par son rapport | Limite |
| --- | --- | --- |
| [Comparaison raster MI14](validation/mi14-raster.json) | 33 états transparents SVG/Canvas ; recouvrement minimal de 99,89 % | Géométrie procédurale de la reprise, aucune validation automatique de nouveaux sprites peints |
| [Scènes Canvas MI14](validation/mi14-canvas.json) | Quatorze vues, quatre parcours achevés, sept exports de campagne | Images Canvas produites dans Node, sans interface HTML ni gestes de navigateur |
| [Réception du classeur](validation/workbook-v0.15-validation.json) | Contrôles de l'export 0.15, avec ses rapports de références, mise en page et recalcul | Preuve conservée de l'export concerné ; pas un nouvel essai interactif d'Excel |

Ces rapports gardent leurs dates, empreintes et portée. Les relire ne les transforme pas en nouvelles exécutions. Dès qu'un module graphique ou un asset change, ces images restent une référence de la reprise ; la réception de la nouvelle livraison doit identifier les fichiers effectivement testés.

## Contrôles et production encore ouverts

- **QA230 :** réception de MI14 dans un navigateur réel, avec environnement et gestes documentés. Le contrôle DOM ci-dessus ne la ferme pas.
- **QA231 :** essai humain de pilotage, de lisibilité et de compréhension des conséquences. Une réussite de pilote automatisé ne le remplace pas.
- **QA19, QA20 et QA29 :** limites historiques concernant focus, petite fenêtre réelle et usage bureautique interactif ; aucune clôture n'est déduite de ces tests.
- **Production :** MI15–MI32, les seize contrats, les animations complètes, les voix et les critères d'art final restent ouverts. La prochaine mission conçue est MI15, **Sous le même numéro**.

La publication GitHub, son arbre exact, la CI et Vercel doivent être constatés séparément dans le [suivi de déploiement](DEPLOYMENT.md). Les tests locaux ne constituent pas une preuve de publication.
