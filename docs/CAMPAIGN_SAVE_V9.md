# Dossier de campagne v9 — la route des vivants

## Migration et authenticité

Le format reste `ordre-de-cendre.campaign` et la clé locale reste `imperium.campaign.v1`. La version **9** accepte les dossiers historiques 1 à 8. La lecture ne réécrit pas le stockage ; la première écriture d’un ancien dossier valide conserve le texte original dans la clé de secours. Un numéro futur ou un format inconnu protège l’original contre l’autosauvegarde.

La migration **v8 → v9 ajoute exclusivement `world.thyr.route` non visité et change le numéro de version**. Elle conserve les scènes en cours, les huit premiers rapports, le registre individuel d’Aval, les positions, l’horloge, les graines aléatoires, les munitions, le parc, l’entretien, les relations et les ressources. `resources.fuel` reste le stock disponible ; `world.nacre.fuelSpent` reste la dépense cumulée. Thyr n’attribue ni ne restitue de carburant.

Les sauvegardes v1 à v7 traversent leurs migrations documentées avant cette unique addition. Les fichiers de fixtures historiques v1 à v7 ne sont jamais régénérés depuis le code courant.

La nouvelle fixture `tests/fixtures/campaign-v8-mi08.json` contient deux exports réels de l’interface dans Chrome, archivés dans la publication 0.9 :

| Variante | Source historique | État conservé |
|---|---|---|
| `live` | `docs/validation/v09-browser-mi08-gate-after-reload.json` | MI08 en cours après rechargement, sept rapports antérieurs, manœuvre de départ différé |
| `completed` | `docs/validation/v09-browser-postfix-completed.json` | MI08 terminée, huit rapports, 34 arrivées au refuge, 2 personnes à l’accueil local, aucune perte |

La provenance publique est le commit `2bb8d7a708e4fab5ab34b3cac10f2418b60fe037`, arbre `e8e278cc5c35f0ef0995ff78c8d499961b96cae9`. Les **889 blobs** du snapshot immuable ont été comparés à cet arbre avant copie. Aucun module actuel ou historique n’a été exécuté pour fabriquer les états de la fixture. Les sources natives et les sept anciennes fixtures étaient identiques, octet par octet, aux fichiers publiés.

SHA-256 de la fixture v8 : `19f66185e9a9997dae5e0e72b83954e6b3f865354ac348802045f1bc38aa6007` ; taille : **182 074 octets**. Le détail des sources, des empreintes et du reçu de publication figure dans `validation/v010-historic-v8.json`.

Un dossier prétendument v8 qui contient déjà Thyr, une scène `livingRoute`, un rapport MI09 ou une mission active MI09 est refusé. La migration n’efface jamais un champ contradictoire pour le rendre acceptable.

## Ouverture et héritage

**MI09 — La route des vivants** s’ouvre seulement après le premier rapport complet de MI08. Le contexte comporte quatre champs : présence du rapport de départ, choix de départ, nombre d’arrivées et nombre de pertes. Ce contexte sert à un écho radio provenant du dossier de Nacre. Il ne déplace aucune ancienne personne sur Thyr, ne change aucun consentement et n’invente aucune rencontre passée.

Les quatre longues-dorses, les deux colonnes, leurs racines, les habitats et les éventails de Thyr appartiennent à une nouvelle scène `livingRoute`, présente uniquement dans MI09. Un habitat endommagé ne produit pas un nombre de morts supposé. Les informations locales de cette mission ne créent aucune nouvelle preuve PT, PO ou PALINODE ; PT02 et l’échange avec Leth restent ultérieurs.

`obey` demande la route impériale et `defy` demande le passage migratoire. Le troisième choix `delay` reste limité à MI08. Un choix de route ne suffit pas à accomplir la manœuvre de barrière, le déplacement des animaux ni l’arrivée logistique.

## Scène physique et reçu

Un checkpoint conserve la scène entière avec les progrès de travail, les états structurels, les animaux, l’éclairage et les pollinisateurs, le contact local, le relevé des cartes, les tireurs et le transport logistique. Les données ordinaires de simulation — pieds, coque, radiateur, projectiles, commandes, temps et générateur aléatoire — restent dans le même instantané.

Le rapport final distingue notamment :

- les longues-dorses arrivés au verger, déplacés hors de leur route et perdus ;
- l’état individuel de chaque colonne, racine et habitat ;
- l’écoute des habitants et la préparation effective de l’approche ;
- l’éclairage coupé, les pollinisateurs encore vivants et ceux revenus sur les colonnes ;
- la route demandée, la manœuvre accomplie et la continuité réellement préservée ;
- la présence de migration dans les cultures et la fragilité de la récolte ;
- le départ, le trajet et l’arrivée du transport logistique ;
- la lecture des cartes et la transmission effective du rapport.

Le reçu garde les objets individuels nécessaires pour confronter les totaux à la scène. La copie est profonde : un nouveau tour de simulation ou une relecture ne peut pas modifier un rapport déjà classé.

## Validation et irréversibilité

`src/thyr-validation.mjs` rapproche les compteurs de leurs objets physiques et vérifie identifiants, capacités, géométrie, santé, phases, préconditions et destinations. Le contexte doit être identique à celui dérivé du premier rapport MI08. Le résultat déclaré dans les faits de mission n’est pas accepté seul.

Une arrivée exige le trajet correspondant. La destruction d’une colonne affecte l’habitat qui en dépend. Un piquetage de secours n’efface pas une barrière détruite. Un animal perdu n’est pas compté au verger. Une carte ou une transmission ne remplace pas les opérations manquantes. L’état du transport conditionne la réussite et sa perte reste un échec de la sortie.

Le checkpoint officiel MI09 ne peut pas reculer dans le temps ni changer de sortie, d’héritage ou de choix acquis. Les faits irréversibles ne sont pas annulés par un checkpoint ultérieur. Une sortie perdue est conservée comme `lost` ; sa restauration conserve cet état terminal. Repartir exige un redémarrage explicite.

Le point avant décision n’est proposé comme reprise que lorsqu’il est encore identique au checkpoint officiel. Cela empêche aussi d’annuler un choix instantané en conservant la même horloge. Le point historique peut rester archivé sans devenir une reprise qui efface les conséquences déjà enregistrées.

Le premier succès attribue **quatre lots d’atelier**. Neuf succès sans dépense donnent donc au maximum **42 lots**. Réenregistrer la même victoire ou rejouer la mission conserve les premiers rapports, les ressources, les relations et l’état du parc. Les résultats de Nacre et Vesper restent indépendants des essais de Thyr.

## Vérification et portée

`tests/campaign-v9.test.mjs` vérifie l’authenticité des fichiers, la migration exacte, le stockage, les refus de données futures et contradictoires, la progression, les reprises, les reçus et l’absence de prime répétée. Le pilote de MI09 utilise les commandes publiques de simulation ; ses parcours automatiques ne sont pas des essais humains ni des captures de navigateur.

Ces validations assurent la cohérence des dossiers importés et des transitions du prototype. Les fichiers JSON ne constituent pas une preuve cryptographique de toutes les actions d’une partie ni un système contre la triche. Les vérifications natives de l’interface et leurs limites doivent être rapportées séparément.
