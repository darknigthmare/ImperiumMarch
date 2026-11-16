# Appareils et sites peints de MI11 — 0.15.6

Trois atlas PNG originaux, **21 cellules utilisées au rendu**, aucune référence comptée. Les images proviennent de l’outil Imagegen intégré ; les fichiers sélectionnés sont copiés sans retouche de pixels. Les deux corrections de transparence et leurs sorties sont documentées dans `generation.json`, les demandes initiales dans `prompts.json`.

| Atlas | Familles | Cellules |
| --- | --- | ---: |
| `instruments.png` | Écoute au sol : repos, acquisition, signal enregistré, perte. Récepteur de traduction : texte non copié, copie, copie acquise, perte. | 8 |
| `emitter.png` | Émetteur : transmission, travail, saisi, rétabli, détruit. La sixième case reste vide et n’est pas comptée. | 5 |
| `terrain-sites.png` | Ponte : intacte, perturbée, endommagée, perdue. Repère de corniche : inconnu, reconnu, endommagé, détruit. | 8 |

Les cinq familles remplacent les représentations vectorielles correspondantes dans `voice-renderer.mjs`. Leth et les herbes restent issus du lot Thyr existant. Les postes d’ordre et de rapport gardent leur dessin vectoriel ; aucun appareil additionnel n’est inventé.

Les ancres au sol sont mesurées dans `anchors.json`. L’indexeur `tools/index-painted-voice.py` ne produit que `manifest.json` et `src/painted-voice-layout.mjs`. Les dimensions et empreintes exactes de chaque original sont dans le manifeste. Les petites images d’état saisi ou détruit conservent l’échelle de l’objet intact ; le socle n’est pas agrandi à la hauteur de l’émetteur complet.

Le repère de racines est dessiné près de la commande de reconnaissance. Il ne crée aucun support : la corniche traversable et les pieds restent calculés par `voiceSurfaceAt`. Les nids représentent les trois sites locaux déjà simulés ; leur dessin ne recense pas de nouveaux êtres. Les copies, permissions et pertes restent dans la simulation et la sauvegarde existantes.

Chargement : `loadPaintedVoice`. Observation : `paintedVoiceStatus`. Rendu : `drawPaintedVoiceAsset`. Un PNG absent, mal dimensionné ou indécodable conserve le repli vectoriel. Les appels de rendu ne modifient aucune scène.

Réception : [rapport QA](../../../docs/QA_PAINTED_VOICE.md), [reçu Canvas](../../../docs/validation/painted-voice-v0156/receipt.json), [égalité des originaux](../../../docs/validation/painted-voice-v0156/originals.json).
