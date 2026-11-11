# Dossier de campagne v5 — ouverture de Nacre

La version applicative 0.6.0 écrit le format **v5**. Le [contrat v4](CAMPAIGN_SAVE_V4.md) reste l'historique de Vesper et du radiateur. `src/campaign.mjs` est l'autorité exécutable pour les formes, les limites et les transitions.

## Nouveaux faits persistants

`resources.fuel` est un entier de zéro à deux. Il est distinct de `resources.parts`, destiné aux réparations. Il commence à zéro. La seule acquisition disponible dans cette tranche est le prélèvement effectif du dépôt de MI05. Aucun consommateur de carburant n'est encore livré.

`world.nacre.passage` contient le bilan officiel de la première réussite MI05 : treuils libérés, barges inspectées, facture vérifiée, contact effectué, population initiale du bateau, réfugiés passés et perdus, membres d'équipage perdus, résolution du passage, ouverture du chenal, dépôt récupéré et quantité, manifeste constaté et mode de rapport. Avant MI05, ces faits sont vides ou nuls ; `refugeesTotal` vaut zéro pour ne pas prétendre qu'une visite a eu lieu.

La mission active possède `game.channel` avec sa marée, deux bancs, deux treuils, deux barges, un bateau et un dépôt. Ces objets ne sont pas ajoutés aux checkpoints MI01–MI04. Le [contrat MI05](CAMPAIGN_MISSION_05.md) décrit leur géométrie, leur progression, leurs collisions et leurs relations.

Le contexte fourni à MI05 contient seulement `technicalEvidence`, `railHostagesRescued` et `railRecordFiled`, dérivés des rapports officiels. L'accès exige MI04 terminée, sans exiger la présence de PT01. Une facture de trafic et une liaison radio ne créent pas une nouvelle preuve technique.

## Migration des versions antérieures

Les v1, v2 et v3 traversent leurs migrations documentées avant v4. La conversion v4→v5 ajoute exclusivement le carburant initial nul, le dossier Nacre non visité et le numéro de format. Elle conserve rapports, pièces, flotte, usure, choix, checkpoints, décisions, travaux et état du radiateur.

La fixture `tests/fixtures/campaign-v4-mi04.json` a été construite avec le code historique `d7d76b61ee9e97e27c611e06905f32f70633cb8e`, grâce au pilote public MI04 de cette version. Elle comprend un état avant décision et un dossier après extraction. Elle ne doit pas être régénérée avec le code courant. Les fixtures v1/v2/v3 restent inchangées.

La lecture migre en mémoire. Elle n'écrit pas dans le stockage. La première écriture conserve une copie de l'ancien dossier selon les règles existantes. Les formats futurs, étrangers ou incohérents ne sont pas remplacés par une autosauvegarde ; un remplacement explicite conserve la confirmation visible dans l'interface.

## Cohérence d'un checkpoint MI05

Le validateur vérifie l'identité et le nombre des objets, les seuils et valeurs bornées, les positions fixes, la marée calculée depuis `elapsed` et la correspondance entre objets et dossier de mission. Les travaux actifs, sources détruites, inspections et stocks ne peuvent pas affirmer des états incompatibles.

Un bateau arrivé a débarqué ses douze passagers et ne peut pas être détruit ensuite. Un bateau perdu avant arrivée donne zéro passage et douze décès. Une facture récupérée et un contact effectué peuvent subsister après destruction de leur source ; cette persistance est volontaire. Une source détruite avant inspection ne donne ni son contenu ni sa voix.

Le dépôt fournit exactement deux lots quand il a été prélevé, zéro sinon. Les rapports terminés, le monde persistant et le stock de carburant doivent s'accorder. L'état de marée reste figé lors d'une pause ou d'un dialogue ; la reprise continue la même horloge.

## Validation, relecture et ressources

Le premier succès ajoute un rapport MI05 et quatre lots de pièces, puis les éventuels deux lots de carburant. Le maximum sans dépense atteint donc 26 lots d'atelier depuis le début de campagne. Une nouvelle validation et une relecture ne réattribuent rien et ne remplacent pas les conséquences du premier rapport.

`tests/campaign-v5.test.mjs` contrôle la fixture historique, la lecture et l'écriture, les protections, le déblocage avec ou sans PT01, une reprise partielle, les six châssis avec les deux décisions et les imports contradictoires. La [QA 0.6](QA_V06.md) indique les preuves et les limites exactes.
