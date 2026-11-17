# Diagnostic intermédiaire, non réception

Le reçu incomplet conserve une assertion initiale trop stricte sur une mire Canvas uniforme : la conversion de couleur arrondissait le bleu de 188 à 189. Le contrôle final tolère une unité RGB mais exige toujours un alpha de 255, ce qui ne peut masquer de bord transparent.

Une exécution suivante sans capture a été interrompue par SIGKILL lorsque la mire Canvas mutable était redessinée par bandes. La mire est maintenant décodée une fois en Image, comme les atlas réels. Les douze cas passent dans `../raster-corrected/receipt.json`. Aucun PNG généré n’a été retouché.
