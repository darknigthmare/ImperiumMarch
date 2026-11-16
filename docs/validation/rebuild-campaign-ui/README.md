# Réception DOM — reconstruction 0.14.1

La commande `node tools/test-ui-runtime.mjs` s’est terminée avec le code 0 et **103 parcours réussis**, sans échec. Le lancement a eu lieu le 12 novembre 2026 à 18:53:14 UTC ; la fin a été constatée à 18:58:29 UTC.

- `receipt.json` : résultat, portée, limites, liste des parcours et empreintes complémentaires.
- `ui-runtime.log` : sortie exacte de la suite complète.
- `inputs-at-start.json` : SHA-256 et tailles du HTML autonome, de l’outil et des 28 modules présents au lancement ; les trente entrées sont identiques à la fin.

Les 86 parcours antérieurs restent exécutés. Les huit parcours MI12 vérifient l’import natif v11, l’instrument, la copie et sa fenêtre en pause/reprise, les trois branches, l’archive après expiration, la perte réelle du troisième relais et la visée tactile du Prétoire après son arrivée. Les neuf parcours MI13 vérifient l’ouverture après MI12, les instruments, les reprises de vanne et d’analyse, les deux destinations, le transfert partiel, la perte des originaux avant ou après copie et le verrou thermique instantané avec reprise strictement sous 48 %.

Le script autonome et ses gestionnaires sont exécutés dans un DOM modélisé par Node. Les checkpoints de préparation sont obtenus par commandes publiques ; les assertions d’interface utilisent les vrais gestionnaires de clic, clavier, pointeur et animation. Certains essais importent successivement des checkpoints préparés à plusieurs étapes : il ne s’agit pas de parcours continus complets joués uniquement à travers l’interface.

Cette preuve ne reçoit pas la mise en page CSS, le rendu Canvas, un navigateur natif, ses boîtes de dialogue ou son stockage, un téléchargement réel, l’écoute audio, une manette ou un écran tactile physique. Les rendus Canvas et les réceptions humaines ou natives ont leurs propres dossiers.
