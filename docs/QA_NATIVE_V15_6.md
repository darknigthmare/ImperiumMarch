# Réception native ciblée — 0.15.6

**ORDRE DE CENDRE · Chrome · 16 novembre 2026**

La version 0.15.6 a été observée dans Chrome sur [le site de production](https://imperium-march.vercel.app/), avec **trois reprises courtes de MI06, MI10 et MI11 depuis des fixtures historiques importées par l’interface**. Les captures retenues montrent les appareils chimiques de MI10 et l’émetteur de MI11. La vanne de MI06 reste largement masquée par le bandeau d’interaction ; sa réception visuelle native demeure limitée.

**Aucune mission n’a été achevée pendant cette session.** Le dossier initial a été restauré, puis réexporté avec les mêmes 8 480 octets et le même SHA-256. La difficulté, le marcheur assigné, les six réglages relevés et les onze commandes ont retrouvé leurs valeurs initiales.

Le [reçu natif](validation/native-v0156/receipt.json) relie chaque preuve à son empreinte. Il distingue les observations rapportées par l’opérateur de la session, les états visibles dans les captures et les comparaisons documentaires effectuées après sa fin. Aucun navigateur supplémentaire n’a été ouvert pour constituer ce dossier.

## Version et environnement observés

| Élément | Référence |
| --- | --- |
| Application | `https://imperium-march.vercel.app/` |
| Déploiement testé | `dpl_6wyMjPucped9Y5qGGfdjcks5qRBs` |
| Commit applicatif | `036d6efa4be74361450f75b284e3268a12af6f50` |
| Arbre applicatif | `41f45209670e932ea17e5f0c37ac7ba8c7dd33fb` |
| Version affichée | **0.15.6**, pied de page du menu et des réglages finaux |
| Captures retenues | De **16:21:10,510 à 16:28:28,636 UTC** le 16 novembre 2026 |

Ces références de déploiement viennent du suivi de publication et de la séance native. Les contrôles GitHub, CI et Vercel possèdent leur propre portée dans [DEPLOYMENT.md](DEPLOYMENT.md). Les tests Node, le DOM modélisé et les rendus Canvas de la tranche restent décrits séparément dans [QA_PAINTED_INSTALLATIONS.md](QA_PAINTED_INSTALLATIONS.md).

## Préparation des trois reprises

Les fichiers importés sont des extractions exactes du champ `live` de trois fixtures historiques inchangées. Le contrôle documentaire retrouve les six SHA-256 attendus — trois fixtures et trois fichiers préparés — et l’égalité structurelle de chaque extraction avec son champ d’origine. Aucune scène n’a été réécrite pour obtenir ces captures. Les noms, empreintes et conditions de préparation figurent dans le reçu, depuis `publication/native-v0156-inputs.json`.

| Mission | Fixture publique | Version du dossier importé | Rapports déjà présents | Horloge préparée | Marcheur préparé |
| --- | --- | ---: | ---: | ---: | --- |
| MI06 | [campaign-v6-mi06.json](../tests/fixtures/campaign-v6-mi06.json), champ `live` | 6 | 5 | 87,933 s | WK09 Pèlerin |
| MI10 | [campaign-v10-mi10.json](../tests/fixtures/campaign-v10-mi10.json), champ `live` | 10 | 9 | 58,950 s | WK09 Pèlerin |
| MI11 | [campaign-v11-mi11.json](../tests/fixtures/campaign-v11-mi11.json), champ `live` | 11 | 10 | 78,150 s | WK09 Pèlerin |

Les relevés, copies, permissions, personnes déjà à l’abri et autres faits affichés après import appartiennent à ces checkpoints préparés. Ils ne sont pas attribués aux quelques gestes exécutés dans cette nouvelle session.

## Gestes natifs et portée observée

Chaque dossier a été importé, son remplacement confirmé et sa mission reprise au moyen de l’interface. L’opérateur a ensuite effectué les gestes suivants ; les captures conservées attestent les états affichés, sans prétendre enregistrer chaque transition.

| Mission | Gestes exécutés | Observation conservée | Limite |
| --- | --- | --- | --- |
| MI06 | Court déplacement avec A, pause puis reprise | Horloge **01:29 → 01:30** ; commande des trois-vannes et manœuvre affichée à 43 % dans la vue 04, puis invitation à actionner dans la vue 05 | Aucun achèvement de la manœuvre ou de la mission revendiqué ; corps de vanne masqué par le HUD |
| MI10 | Reprise, pause et retour au menu | À **00:59**, préleveur, registre, vanne du collecteur et canal peints visibles ; prélèvement affiché à **46 %** | Aucun prélèvement achevé ni nouvelle acquisition de PT02 revendiqués |
| MI11 | Court déplacement avec A, pause puis reprise | Horloge **01:18 → 01:19** ; échange affiché de **50 à 55 %** ; émetteur peint entièrement visible à gauche dans la vue 08 | Aucun échange achevé, opération de l’émetteur ou nouvelle acquisition de TE01 revendiqués |

### Limite de lisibilité MI06

Dans la capture 04, le corps de vanne est attendu approximativement entre **x 532–591 et y 618–671**, avec le volant centré vers **(562, 646)**. Le bandeau HTML occupe environ **x 527–837 et y 624–663** : il recouvre tout le volant et la majeure partie du corps. Les commandes sont dessinées après le marcheur ; le bandeau est donc l’occultation principale, et le bas est aussi assombri par le HUD.

Cette image ne permet pas de certifier visuellement le PNG de vanne plutôt que son repli vectoriel. Le déplacement de la vue 05 ne fournit pas non plus une vue entièrement dégagée. Les contrôles Canvas des installations Nacre restent valides dans leur propre rapport, mais la présente session ne leur ajoute pas une réception native complète des trente cellules.

## Captures retenues

Les **huit JPG et leurs huit états d’accessibilité** sont copiés octet pour octet, sans recadrage, annotation ni retouche. Ils ont été ouverts et rapprochés des légendes suivantes.

| Capture | Ce qu’elle atteste |
| --- | --- |
| [01 — Menu de production](validation/native-v0156/01-production-menu.jpg) | Menu, pied de page 0.15.6 et confirmation d’export préalable |
| [04 — MI06 en cours](validation/native-v0156/04-nacre-mi06-live.jpg) | Marcheur, commande des trois-vannes et manœuvre à 43 %, avec occultation du matériel par le bandeau |
| [05 — MI06 après déplacement](validation/native-v0156/05-nacre-mi06-valve.jpg) | Nouveau cadrage à 01:30 et commande de vanne ; visibilité encore limitée |
| [06 — MI10 en cours](validation/native-v0156/06-chemical-mi10-live.jpg) | Appareils chimiques peints et prélèvement à 46 % |
| [07 — MI11 repris](validation/native-v0156/07-voice-mi11-live.jpg) | Échange préparé avec Leth et émetteur partiellement hors champ |
| [08 — Émetteur MI11](validation/native-v0156/08-voice-mi11-emitter.jpg) | Émetteur peint entièrement visible à gauche et échange à 55 % |
| [09 — Réglages restaurés](validation/native-v0156/09-preferences-restored.jpg) | Difficulté Récit et réglages retrouvés ; les valeurs exactes et onze commandes sont dans l’état d’accessibilité |
| [10 — Campagne restaurée](validation/native-v0156/10-campaign-restored.jpg) | Retour à 0 / 14 rapports et confirmation d’export ; l’état d’accessibilité identifie l’Arpenteur assigné |

Les captures **02 et 03 sont exclues** : leurs images de transition étaient désynchronisées de l’état d’accessibilité attendu. Elles ne servent donc pas de preuve visuelle de pause ou de reprise dans ce dossier. Aucun export privé du joueur ni fichier de checkpoint importé n’est publié.

## Restauration du dossier et des préférences

Le [constat de restauration](validation/native-v0156/restoration.json) conserve la comparaison avant/après de l’export : **8 480 octets identiques**, SHA-256 **`0fa13fe1ac7191fff04434e0bb6867137936ba43a889208f2a3a88dbb92073e5`**. Les exports eux-mêmes restent hors du dépôt.

Les fixtures avaient sélectionné le **Pèlerin** et la difficulté **Pilote**. Ces deux réglages ont été rétablis via l’interface. L’état final est **A-17 Arpenteur**, **0 / 14 rapports**, difficulté **Récit**, assistance et secousses activées, mouvements réduits et repères renforcés désactivés, volume **55**. Les **onze commandes** correspondent au relevé préalable.

Les relevés [avant](validation/native-v0156/preferences-before.txt) et [après](validation/native-v0156/preferences-after.txt) sont conservés intacts. Le relevé préalable affiche encore le pied de page 0.15.5 ; le relevé final affiche 0.15.6. La comparaison porte sur les six valeurs de réglage et les onze commandes, sans exiger l’identité des numéros de nœuds d’accessibilité ni du texte de version.

## Console et limites générales

L’échantillon de console retourné est plafonné à **30 entrées**. Elles sont toutes au niveau `error`, avec une URL d’origine déclarée `chrome-extension://`, et répètent un seul message distinct. **Aucune erreur d’origine applicative n’est observée dans ces trente entrées.** Cela ne démontre pas que toute la console applicative ou toute la session soit sans erreur. Le reçu conserve la taille et le SHA-256 de `console.json`, ainsi que ce résumé ; le journal brut n’est pas publié.

Cette réception ne revendique aucun essai humain, mesure de performance, parcours complet de mission, matrice de navigateurs ou test de l’édition hors ligne par `file://`. Elle reçoit les trois reprises courtes et la restauration finale décrites ici. Les validations mécaniques, les critères humains et les travaux encore ouverts conservent leurs statuts antérieurs.
