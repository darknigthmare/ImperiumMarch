# MI11 — Une voix au ras du sol

## Place dans la campagne

La troisième sortie sur Thyr suit le premier rapport de MI10. Holt demande la capture d’un émetteur que le poste impérial classe en coordination hostile. Sera doit retrouver sa source par les vibrations du sol, éviter un site de ponte, puis protéger Leth de la Septième Rive pendant un échange.

Leth est l’interprète PN06 des Accords Khelt. Son témoignage porte sur les avis d’évacuation de cette vallée et sur leur traduction déformée par le poste. Il ne parle pas au nom de toutes les cités Khelt. Un accord privé pour conserver ses paroles ne constitue ni un accord de diffusion publique, ni un recrutement, ni une alliance militaire.

Le contexte reçu de MI10 comprend seulement l’existence du rapport, sa conduite, la présence de PT02, l’habitabilité du village et la remise en circulation de l’eau. Ces faits peuvent être évoqués à la radio. Ils ne déplacent aucun habitant, n’inventent pas une rencontre passée avec Leth et ne remplacent aucune opération de MI11.

## Parcours matériel

| Étape | Action | Condition et conséquence |
| --- | --- | --- |
| Écoute | Relever les trois points de vibration | Quatre secondes par point, marcheur immobile et ancré, sans tir. Le temps de pause ou de dialogue ne compte pas. Trois signaux exploitables localisent l’émetteur ; en cas de signal perdu, son inspection physique permet encore de l’identifier. |
| Passage | Reconnaître la corniche | Quatre secondes au repère. La surface reconnue porte réellement les pieds au-dessus des trois nids ; le renderer utilise ces mêmes contacts. Une perte de ponte déjà acquise n’est pas réparée par la reconnaissance. |
| Traduction | Copier le texte du poste impérial | Trois secondes devant le récepteur. La copie reste conservée si le récepteur est détruit ensuite. Un constat de ruines ne crée pas le texte manquant. |
| Source | Copier le signal de l’émetteur Khelt | Trois secondes devant l’appareil retrouvé sur place, après les trois relevés ou constats. Source reçue et traduction impériale sont deux pièces distinctes. |
| Rencontre | Établir un échange avec Leth | Trois secondes à portée. Rencontre, demande d’accord, consentement et enregistrement sont des événements séparés. |
| Accord | Demander la conservation de ses paroles | Deux secondes. Leth doit être vivant et disponible ; les atteintes à la ponte peuvent provoquer un refus ou un retrait. Le jeu conserve ce refus au lieu de fabriquer un témoignage. |
| Protection | Tenir l’échange jusqu’à son terme | Vingt secondes effectives dans le périmètre de protection. Les trois forces privées deviennent présentes seulement après leur délai d’arrivée de six secondes. |
| Conduite | Choisir capture ou restauration | Le choix fixe l’opération prévue. Il ne capture, ne répare et ne rétablit pas immédiatement l’appareil. |
| Émetteur | Accomplir l’opération sur place | Cinq secondes pour une capture ou une restauration. Un appareil perdu impose un constat de perte ; aucune source détruite ne revient. |
| Rapport | Transmettre les résultats matériels | Le bilan attend les inspections ou constats, le sort de l’échange, les trois forces neutralisées et l’opération ou la perte de l’émetteur. |
| Extraction | Rejoindre physiquement la sortie | Le rapport précède le déplacement de retour. Les dommages ultérieurs restent présents dans le bilan final. |

Les six châssis utilisent leurs vrais appuis et leurs réserves finies. La corniche est un passage reconnu dans la géométrie de la scène, pas une immunité abstraite attribuée au dialogue. Les nids possèdent chacun leur intégrité ; aucun nombre d’œufs ou de futurs individus n’est déduit de ces trois supports.

## Pièces, paroles et disponibilité

**TE01 exige trois signaux exploitables conservés, la copie de la source, la copie de la traduction impériale et un échange consenti enregistré jusqu’à son terme.** Un constat de perte remplit le relevé matériel sans produire un signal. Ces éléments établissent que des avertissements Khelt ont été reçus et déformés. Ils n’établissent pas tous les détails des commandes industrielles, le financement de PALINODE ou les responsabilités du pouvoir central.

Un relevé ou une copie déjà conservés survivent à la destruction ultérieure de leur original. Un enregistrement achevé avec accord reste un témoignage enregistré si son auteur meurt ensuite. La disponibilité actuelle de Leth doit alors être déclarée perdue ; elle ne se déduit pas de la présence de TE01.

La confiance de Leth suit les actes observés dans cette sortie, notamment le respect du site et le sort de la liaison. La possibilité d’une coopération d’interprétation reste distincte de la survie, de la rencontre et du témoignage. MI11 ne crée ni consentement public ni engagement dans la flotte. La défection reste prévue à MI16 ; les commandes conservées au troisième relais restent associées à MI12.

### Trois formulations à confronter

Ces phrases sont des restitutions françaises présentées au joueur, pas une transcription de la langue Khelt. La colonne impériale devient disponible après copie du récepteur. L’explication de Leth est conservée dans les archives après l’échange privé achevé ; une traduction perdue reste signalée comme absente même si Leth a pu parler.

| Pièce | Version conservée au poste impérial | Sens expliqué par Leth |
| --- | --- | --- |
| Évacuation | Retenez les habitants dans les cultures. | Faites quitter les cultures aux habitants. |
| Passage | Fermez le passage aux familles de la rive. | Ouvrez le passage aux familles qui quittent la rive. |
| Ponte | Avancez les machines lourdes vers le site de ponte. | Maintenez les machines lourdes à l’écart du site de ponte. |

La source de ces trois paires est `VOICE_TRANSLATION_PAIRS` dans `src/content.mjs`. Leur confrontation documente l’inversion de ces avertissements locaux ; elle n’invente pas les commandes industrielles réservées à MI12.

## Reprises et issues dégradées

Le dossier v11 conserve les progressions en cours, les dates d’actes, les dommages individuels, les copies et l’état de chaque menace. Reprendre un checkpoint n’avance pas la simulation et ne rend aucun point de vie. Un ancien point de décision ne permet pas d’effacer des pertes survenues depuis.

Une source perdue, une traduction illisible ou un échange refusé peuvent être consignés sans inventer leurs données. Le rapport doit garder les pièces réellement obtenues et le sort de Leth. Une relecture peut explorer une autre conduite, mais elle ne remplace pas le premier rapport de campagne et n’attribue pas une seconde dotation.

## Réception

La validation du moteur relève de `tests/mi11-simulation.test.mjs` et du pilote `tests/helpers/mi11-driver.mjs`. La persistance et les rejets de dossiers contradictoires relèvent de `tests/campaign-v11.test.mjs`. Les parcours pilotés, scènes Canvas, contrôles du DOM modélisé, gestes natifs et essais humains gardent des preuves séparées.

La suite de persistance MI11 comporte **41 tests réussis**. Elle reçoit les douze couples châssis/conduite en difficulté Normale, sept issues dégradées et cinq reprises pendant une action, avec continuation déterministe. Elle vérifie aussi la mort après consentement, le retrait avant ou après enregistrement, les travaux antidatés, la perte terminale et la dotation unique. Un retrait avant le début de l’échange ne produit aucun témoignage ni phrase de bilan prétendant conserver un enregistrement antérieur. Avec les régressions antérieures, **224 tests de campagne sur 224 passent** : le [reçu de validation](validation/v012-campaign-validation.json) conserve les empreintes de leurs sources et le [journal TAP](validation/v012-campaign-tests.tap) leurs résultats exécutés.

Le [contrat du dossier v11](CAMPAIGN_SAVE_V11.md) documente la provenance historique et les règles de migration. La production de documents ou de tests ne constitue pas à elle seule une réception native ou un essai humain.
