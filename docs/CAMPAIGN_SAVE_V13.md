# Sauvegarde de campagne v13 — reconstruction 0.14.1

## Format et continuité

Le format reste `ordre-de-cendre.campaign`. La clé principale reste `imperium.campaign.v1` et sa copie de secours `imperium.campaign.v1.backup` : le suffixe de la clé est historique, indépendant de la version du contenu JSON. Le schéma courant utilise `version: 13`.

Les migrations acceptent les versions 1 à 12. Une version future est protégée contre l’écrasement. Lire une sauvegarde ne l’écrit pas ; le premier enregistrement réussi après migration conserve le texte original en secours selon le mécanisme existant.

## Deux extensions additives

| Entrée | Extension | Faits conservés |
| --- | --- | --- |
| v11 | `world.thyr.relay`, initialement vide, puis `version: 12` | Onze rapports, contexte, scènes, coordonnées, temps, ressources, atelier, relations et ancien `stage` |
| v12 | `world.kharon.foundry`, initialement vide, puis `version: 13` | Douze rapports et tout l’état de MI12 |

Une migration n’achève pas une mission, ne fournit pas de preuve et n’octroie pas de lot. Le prochain dossier est le premier rapport absent. Un ancien `stage: complete` reste ainsi inchangé tout en ouvrant la mission suivante.

Les imports historiques ne peuvent pas contenir prématurément un relais, Kharon, un checkpoint futur ou un reçu MI12/MI13. Ces contradictions sont rejetées, sans nettoyage silencieux du fichier.

## Fixture historique v11

`tests/fixtures/campaign-v11-mi11.json` provient de deux fichiers déjà présents dans le commit public immuable `0f77235f7545f33b1a4f298b81a44ee2122d46dc` de la 0.12 :

- `docs/validation/native-v12/exchange-paused.json` : échange MI11 en cours ;
- `docs/validation/native-v12/completed-native.json` : premier rapport MI11 achevé.

Ces exports historiques ont été copiés sans exécuter les modules de la reconstruction. Leur source, taille, SHA-256 et identifiant Git sont consignés dans la fixture et dans `docs/validation/rebuild-campaign-v11-provenance.json`. Les dix fixtures v1 à v10 restent inchangées. Leurs hashes sont également protégés.

Le test de migration v12 utilise un dossier réellement obtenu par la reconstruction MI12, ramené à la forme v12 en retirant seulement le futur dossier Kharon. Il ne prétend pas être un export récupéré de la 0.13 perdue. En l’absence de ses octets, l’identité exacte du schéma et des anciens checkpoints locaux ne peut pas être attestée.

## Règles de sortie

Le début de sortie vérifie le rapport précédent. Les missions MI12 et MI13 héritent uniquement des champs de contexte annoncés par leurs validateurs. Un état actif appartient à un seul dossier, un châssis, une graine et une difficulté.

Un checkpoint est une copie profonde. Son import valide le format général, les types, les bornes, la définition de mission, la géométrie des corps, les faits dérivés, les travaux, les dates et les héritages. Les comparaisons entre checkpoints refusent une restauration d’intégrité, une réécriture de perte, une opération antidatée ou un travail accéléré.

Une pause ne fait avancer ni la fenêtre MI12, ni le refroidissement, ni un transfert MI13. Reprendre rétablit le même état. Une sortie perdue ne revient pas vivante à l’import. Le redémarrage explicite ouvre une nouvelle sortie ; il ne transforme pas une perte en victoire.

Le point d’avant décision ne peut servir à remonter avant un état ultérieur de MI12/MI13. Il reste conservé pour le dossier, mais n’est proposé comme reprise que lorsqu’il correspond exactement à l’état officiel encore vivant.

## Reçus et attribution

Le premier résultat gagné ajoute un reçu détaché, actualise le dossier du monde, inscrit le vrai état du marcheur à l’atelier et attribue exactement quatre lots. La dotation initiale est de six lots. Sans frais d’atelier, onze rapports donnent 50 lots, MI12 donne 54 et MI13 donne 58. Les dépenses réelles restent soustraites.

Un rejeu ne remplace pas le reçu initial et ne donne aucune seconde récompense. Les anciennes décisions, pertes et sources sont conservées. `lastDebrief` doit être identique au reçu de la dernière mission achevée.

Les reçus MI12/MI13 comprennent leur roster : le validateur rapproche les agrégats des corps, opérations, sources et dates. Copier une falsification à la fois dans `completed`, `lastDebrief` et le dossier du monde ne suffit pas à la rendre recevable.

## Portée des preuves

MI12 garde des commandes industrielles locales, sans attribuer une nouvelle preuve nommée PALINODE. MI13 n’accorde PT03 qu’avec deux marquages copiés, un bordereau copié et l’analyse terminée. Les rapprochements avec PT01 et MI12 sont conditionnels aux vrais dossiers précédents.

La sauvegarde n’introduit ni diffusion publique, ni recrutement de Leth, ni preuve politique complète, ni défection prématurée. Les tests et rapports de reconstruction indiquent ce qui a été exécuté. Les anciennes preuves 0.12 restent historiques ; les preuves perdues 0.13/0.14 ne sont pas recréées sous leurs anciens identifiants.

## Réception de l’interface reconstruite

Le 12 novembre 2026, la suite complète `node tools/test-ui-runtime.mjs` a reçu **103 parcours sur 103** : 86 parcours antérieurs, huit pour MI12 et neuf pour MI13. Le journal exact, les empreintes des entrées au lancement et le reçu figurent dans `docs/validation/rebuild-campaign-ui/`. Les trente entrées principales, dont le HTML autonome, sont restées identiques entre le lancement et la fin constatée.

Cette suite exécute le script livré et ses gestionnaires réels dans un DOM modélisé. Les checkpoints de départ viennent des commandes publiques de simulation ; les segments contrôlés passent ensuite par les événements de l’interface. Les essais de branches emploient des checkpoints distincts pour la décision et l’approche de l’extraction : ils ne constituent pas une partie continue intégralement pilotée par l’interface. Le contrôle tactile vise les gestionnaires de pointeur, sans appareil physique. La mise en page, le comportement natif du navigateur, les téléchargements, l’écoute audio et la réception humaine restent hors de cette preuve.

