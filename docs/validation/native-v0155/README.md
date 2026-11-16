# Réception native — 0.15.5

Observation courte sur Chrome partagé, à `https://imperium-march.vercel.app/`, le **16 novembre 2026, de 14:59:57 à 15:06:50 UTC**. Les sept JPG et sept textes AX sont copiés octet pour octet. Les images ont été ouvertes et confrontées aux légendes, sans retouche ni nouvelle session navigateur.

Le [reçu JSON](receipt.json) conserve empreintes, dimensions, heures et provenance. Application : commit `a0ae19542b384144ab4a6ce96562288c821879c4`, arbre `743dfca080436dceb0fb1c25fa5ea40061b0661c`, déploiement `dpl_rCFt5nX8QSsZQFkyvtcanAATk2fS`. L’heure READY, recalculée depuis `1794841154151` ms, est **2026-11-16T14:59:14.151Z**.

| Capture et texte AX | Observation |
| --- | --- |
| [01 — Campagne](01-campaign-v0155.jpg) · [AX](01-campaign-v0155.txt) | Version 0.15.5, 0 / 14 rapports, Arpenteur assigné. |
| [02 — MI12](02-mi12-praetor-copy.jpg) · [AX](02-mi12-praetor-copy.txt) | Prétoire, relais et poste peints ; capteur perdu, ancrage verrouillé. |
| [03 — Pause](03-mi12-paused.jpg) · [AX](03-mi12-paused.txt) | Dialogue de pause et bouton Reprendre. |
| [04 — Reprise](04-mi12-resumed.jpg) · [AX](04-mi12-resumed.txt) | Champ de bataille, pose et cadrage changés après D demandé 1200 ms. |
| [05 — MI07](05-mi07-ambulance.jpg) · [AX](05-mi07-ambulance.txt) | Ambulance, caisse vérifiée, balise récupérée absente du véhicule. |
| [06 — MI13](06-mi13-carrier-transfer.jpg) · [AX](06-mi13-carrier-transfer.txt) | Porteur, caisse sur plateau, transfert interrompu, zéro transfert acquis. |
| [07 — Restauration](07-restored-campaign.jpg) · [AX](07-restored-campaign.txt) | Campagne initiale et sélection Arpenteur restaurées. |

Les trois missions proviennent de checkpoints historiques importés par l’UI. La tentative MI13 **Space + E, 6000 ms demandés**, n’a montré aucun transfert acquis. Aucune mission achevée ni nouvelle copie ou opération sanitaire réussie n’est revendiquée.

MI12 a été observée de 01:10 à 01:15 dans la session ; les captures conservées commencent à 01:11. La reprise affiche 01:14 dans le JPG et 01:15 dans l’AX ; MI07 affiche 02:56 puis 02:57. Ces relevés ne sont pas atomiques ; plusieurs AX sont des diffs.

Les exports privés initial et restauré font chacun **8 480 octets identiques**, SHA-256 `0fa13fe1ac7191fff04434e0bb6867137936ba43a889208f2a3a88dbb92073e5`. Ils ne sont pas publiés, ni les checkpoints importés. La sélection Arpenteur est restaurée ; toutes les préférences initiales n’ont pas été comparées.

Les trente erreurs console échantillonnées proviennent toutes d’une extension : aucune erreur d’origine application dans **cet échantillon seulement**. Cette réception automatique native reste distincte d’un essai humain et d’une mesure de performance.
