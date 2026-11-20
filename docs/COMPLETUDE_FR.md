# CE QU’IL FAUT POUR UN JEU COMPLET

**ORDRE DE CENDRE · état de complétude 0.16.1 · 20 novembre 2026**

*Document de production. Il ne promet aucune date, aucun budget et aucune plateforme. Il décrit un périmètre fini et ce qui manque pour l’atteindre. Les statuts renvoient aux définitions de [BIBLE_FR.md](BIBLE_FR.md) : **Conçu**, **Prototype**, **À produire**, **Vérifié**. Un catalogue n’est pas une livraison.*

---

## 1. Ce que « complet » veut dire ici

Un jeu complet n’est pas une bible complète. Six conditions, toutes nécessaires :

1. **Campagne finie** : huit mondes, trente-deux missions principales, seize contrats de campagne, quatre fins atteignables et leurs épilogues.
2. **Systèmes tenus** : marche, appuis, ancrage, chaleur, avaries, munitions finies, sauvegarde et reprise ; pas de mécanique annoncée qui ne fonctionne pas.
3. **Contenu produit** : décors, machines, personnes, effets, sons et voix pour chaque monde livré ; pas de planète en gris.
4. **Lisibilité** : tutoriel, codex des faits, journal des pertes, options d’accessibilité et avertissements de contenu.
5. **Qualité éprouvée** : essais humains sur MI01 finalisée puis sur chaque acte, lecture de sensibilité, performance mesurée.
6. **Chaîne de livraison** : build autonome reproductible, ZIP vérifié, Release signée par empreintes, dossier de campagne migrable.

La 0.16.1 satisfait la **conception narrative** de ce périmètre, pas sa production. Les sections suivantes séparent ce qui existe, ce qui est conçu et ce qui reste à faire.

---

## 2. Ce qui existe réellement (0.16.0)

| Élément | État | Preuve |
| --- | --- | --- |
| Campagne MI01–MI14 | **Prototype** jouable, dossier v14, reprises et migrations | `src/campaign.mjs`, fixtures v1–v14, `npm test` |
| Sept châssis assignables (dont WK14) | **Prototype** ; six avec rendu peint, WK14 vectoriel | `PLAYABLE_WALKERS`, `tests/sentinelle.test.mjs` |
| Trois opérations indépendantes OP01–OP03 | **Prototype** | onglet Prototype |
| Combat : tir, roquettes, ancrage, chaleur, radiateur, kits, réserves | **Prototype** | `src/simulation.mjs`, tests |
| Interface, pause, manette de mission, remap clavier | **Prototype** ; menus manette et matériel réel non reçus | `npm run check:ui-runtime` |
| 95 atlas peints / 700 cellules, 4 panoramas | **Prototype** avec repli vectoriel | manifestes et réceptions Canvas |
| Bible : 1 157 fiches, 20 onglets de conception, 133 critères initiaux | **Conçu** et partiellement **Vérifié** selon les fiches | `data/bible.json` |
| Critères QA de la tranche (`QA232–QA257`) | **À produire** : aucun exécuté | chronologie EC 61, journal `SY140`, cargaison `SY142`, résolution `SY143`, quatre fins |
| Export XLSX | **En retard** : non reconstruit depuis 0.15.11 | `docs/ORDRE_DE_CENDRE_Bible.xlsx` |
| Chronique, canon, campagne, épreuves | **Conçu**, non implémenté | `CHRONIQUE_DES_MONDES.md`, `CANON_EMPIRE.md` |

---

## 3. Ce qui est conçu mais non livré

| Domaine | Conçu | Livré | Manque |
| --- | ---: | ---: | --- |
| Missions de campagne | 32 | 14 | 18 missions MI15–MI32 (dialogues, niveaux, états, réceptions) |
| Contrats de campagne | 16 | 0 | `CT01`–`CT16` : accès, fenêtres, conséquences |
| Épreuves de châssis | 8 | 0 | `CT17`–`CT24` ; sept châssis `WK13`, `WK15`–`WK20` sans marche ni tir |
| Châssis | 12 (`WK01`–`WK12`) + `WK14` | 6 jouables peints + `WK14` vectoriel | aptitudes de tunnel, secours, amphibie, franchissement |
| Armes | 18 familles | 1 famille déclinée (`AR01`) | recul, dispersion, munitions spéciales, composants |
| Modules | 16 | partiels (radiateur, kits, caisses) | nacelles, brouilleurs, plaques, treuils |
| Ennemis | 40 | sous-ensemble | composants localisés, doctrines d’escouade, reddition |
| Véhicules | 18 | quelques-uns | conduite, amphibie, convois |
| Faune / flore | 24 / 24 | décoratif | interactions écologiques, dangers, filtration |
| Fins | 4 familles (`FI01`–`FI04`) | 0 | calcul `SY143`, épilogues, écrans de fin |
| Codex | `SY140` | 0 | interface, déblocage par faits, texte localisé |
| Calendrier et dates | `SY141` | 0 | affichage, saisons, effets de terrain |
| Cargaison de bord | `SY142` | 0 | capacité, réconciliation, choix de MI16/MI17 |
| Factions | 12 | 4 actives dans la campagne | les huit autres à mettre en scène |
| Personnages | 34 | 8 avec présence réelle | 26 fiches à incarner |
| Documents et voix | 170 entrées de narration | quelques textes de mission | dialogues, radio, documents lisibles en jeu |

**Ne pas lire ce tableau comme un pourcentage.** Une mission conçue n’est pas une mission à moitié faite : elle n’a ni niveau, ni timing, ni réception.

---

## 4. Les six chantiers, dans l’ordre

### 1. MI01 finalisée (jalon de référence)

C'est le seul jalon qui compte d'abord : briefing, hangar, marche, combat, conséquence, bilan, retour, audio, interface, performance. Tant qu'il n'existe pas, aucun autre monde ne doit être produit. Critère : une personne non guidée termine MI01 sans aide, et le jeu tient 60 images par seconde sur la machine déclarée.

### 2. Acte I complet (Vesper et Nacre)

MI02–MI08 au niveau de MI01, avec les contrats `CT01`–`CT04`, les conséquences croisées déjà simulées (conduite, panneau, carburant, personnes) et une interface de dossier lisible. Critère : une campagne Acte I entière, exportée et rechargée, sans perte de fait.

### 3. Acte II (Thyr et Kharon) et la défection

MI09–MI16, avec `PT02`, `PT03`, `TE01`, `TE02`, `PT04` et la cargaison de bord (`SY142`). C'est l'acte où le joueur cesse d'être couvert : la logistique doit réellement se dégrader. Critère : la défection change les missions suivantes de façon vérifiable.

### 4. Acte III (Sereis et Ilex) et la coalition

MI17–MI24, `PT05`, `PO01`, `TE04`, les pactes (`NA11`) et la diffusion (`NA12`). Critère : deux chemins de coalition viables, avec des coûts différents et des témoins réellement exposés.

### 5. Acte IV (Méridien et Orthe) et les fins

MI25–MI32, `PO02`, `PO03`, `TE03`, le calcul `SY143` et les vingt-huit épilogues (quatre fins × sept lieux). Critère : les quatre fins atteignables, aucune par un dernier dialogue, chacune avec ses pertes nommées.

### 6. Complétude, accessibilité et livraison

Contrats, épreuves de châssis, codex, calendrier, options d'accessibilité, avertissements de contenu, lecture de sensibilité, performance, build reproductible, Release et dossier migrable. Critère : un dossier v14 d'une version antérieure s'ouvre dans la version finale sans perdre un fait.

---

## 5. Critères de sortie mesurables

- **Narratif** : 32 missions jouables de bout en bout ; 16 contrats ; 8 épreuves ; 4 fins ; 170 entrées de narration disponibles dans le codex quand leur source est acquise.
- **Systèmes** : aucune mécanique affichée sans effet simulé ; aucun état de mission sans reprise ; aucun composant sans dégât localisé.
- **Contenu** : huit mondes avec décor, habitants, véhicules et faune propres ; aucun asset provisoire dans une mission livrée.
- **Qualité** : MI01 et chaque acte reçus par des joueurs non guidés ; performance mesurée ; aucun bloquant de sauvegarde.
- **Sensibilité** : lecture des textes par des personnes concernées avant diffusion ; avertissements et occultations testés.
- **Livraison** : HTML autonome et ZIP reproductibles, manifeste et empreintes publiés, Release vérifiée.

---

## 6. Ce que ce document ne prétend pas

- Il ne fixe ni calendrier, ni budget, ni effectif, ni plateforme.
- Il ne transforme aucune fiche **Conçu** en livrable.
- Il ne remplace pas les registres de production (`PRODUCTION_REGISTER_V15.md`) ni les 133 critères initiaux.
- Il ne certifie pas l'export XLSX, qui reste en retard sur `data/bible.json`.

La liste ci-dessus est vérifiable : chaque ligne renvoie à des identifiants de la bible ou à un fichier du dépôt. C'est le seul sens utile de « jeu complet » à ce stade.
