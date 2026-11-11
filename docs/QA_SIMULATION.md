# Vérification du prototype — simulation, campagne et rendu

**Version 0.2.0 · 10 novembre 2026.** Modules concernés : contenu, simulation, campagne et renderer. La portée navigateur est décrite séparément dans [QA_INTEGRATION.md](QA_INTEGRATION.md).

## Résultats exécutés

```sh
npm test
node --check src/renderer.mjs
```

**41 tests réussis, 0 échec.** Les 18 tests des opérations d’origine restent présents. Neuf tests couvrent MI01 et quatorze couvrent le dossier, la reprise et l’atelier.

| Domaine | Vérification |
| --- | --- |
| Marche | 2/4/6 pieds, alternance, pied planté immobile, progression assistée et ancrage. |
| Combat | Chargeur, rechargement, roquettes finies, surchauffe, ventilation et projectile balayé. |
| Opposition et civils | Préparation des tirs, dégâts, destruction, pertes civiles séparées. |
| Opérations | Neuf parcours complets : 3 opérations × 3 châssis, commandes publiques et décision de refus. |
| Première mission | Douze parcours complets : 3 châssis × 2 passages × 2 réponses, commandes publiques. |
| Conduite | Pied réellement posé requis pour rupture ; pied en l’air insuffisant ; dalles protégées. |
| Treuil | 4,5 secondes de travail, proximité, annulation, attente du convoi. |
| Escorte de Sami | Le camion ne dépasse pas le pilote, s’arrête à distance et sa destruction fait échouer la tentative. |
| Livraison et lecture | 24 caisses livrées avant lecture ; arriver seul au manifeste ne l’active pas. |
| Narration | Signalement administratif, aucun gain de preuve PALINODE, choix irréversible dans la sortie. |
| Reprise | État complet déterministe pour les trois châssis, avant/après décision, pas de modification d’un rapport achevé. |
| Dossier | JSON versionné, refus des fichiers incomplets ou incompatibles, secours, panne/quota et future version protégée. |
| Atelier | Attribution unique, coût borné, stock insuffisant refusé, aucun gain sur relecture ou réparation répétée. |

Les **21 parcours victorieux** ne déplacent pas artificiellement le joueur et ne forcent ni objectifs ni points de vie. Les tests isolés de destruction, dégâts ou budget utilisent des fixtures explicitement distinguées. Le pilote automatique sait viser : il ne remplace pas un test humain de difficulté ou de rythme.

## Inspection visuelle de MI01

```sh
node tools/render-campaign-previews.mjs
```

Le script emploie `@napi-rs/canvas` (Skia), le renderer de production et des états obtenus par `createGame`, `commandGame` et `updateGame`.

| Image | État |
| --- | --- |
| [Passage protégé](previews/mi01-secured.png) | À 14,60 secondes, pied sur les dalles, conduite intacte. |
| [Conduite rompue](previews/mi01-direct.png) | À 8,87 secondes, contact réel, fuite et attente du camion. |
| [Livraison](previews/mi01-delivery.png) | À 80,03 secondes, camion vivant arrivé, 24 caisses, manifeste encore non lu. |

Les trois images ont été inspectées. Les libellés qui se recouvraient ont été espacés et les caisses déplacées à côté du camion. Les coordonnées du sol et des appuis proviennent de la simulation. Le [manifeste des captures](previews/campaign-manifest.json) conserve paramètres, états et empreintes de fichiers.

Ces images montrent **le Canvas uniquement**. Les menus HTML, le HUD HTML, les dialogues et la mise en page CSS ne sont pas inclus. Les anciennes images de Vesper/Nacre/Thyr et des trois hangars restent des captures de référence de la 0.1 ; elles ne sont pas présentées comme nouvellement revérifiées.

## Intégration et limites

`npm run check:ui` compile l’édition autonome et vérifie ses références. `npm run check:ui-runtime` exécute son script dans un modèle de DOM, avec sept parcours de liaison UI/état. Ces contrôles sont décrits et limités dans le rapport d’intégration.

Le lancement réel de Chromium a échoué sur un socket interdit avant toute ouverture de page. Le comportement dans un navigateur reste à vérifier. Aucun taux de 60 images/s, aucune certification et aucune difficulté humaine ne sont déduits de ces tests.

Le passage protégé de MI01 est une interaction de dalles sur un trajet unique. La physique complète du sol et des conduites, les routes alternatives libres, les animations finales, les autres missions et les conséquences entre planètes restent en production.
