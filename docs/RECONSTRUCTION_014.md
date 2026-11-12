# Reconstruction 0.14.1 — ORDRE DE CENDRE

## Origine et portée

Le 12 novembre 2026, une maintenance automatique de l’espace de travail a retiré le checkout et les livraisons locales 0.13/0.14. Le propriétaire du projet a demandé de reconstruire tous les éléments manquants depuis les traces conservées et de les publier sur `darknigthmare/ImperiumMarch`.

La base récupérée est le commit public `0f77235f7545f33b1a4f298b81a44ee2122d46dc`, version 0.12.0. Elle conserve MI01–MI11, six châssis, trois opérations autonomes, la Bible, les sources et les preuves historiques. Les objets locaux 0.13 et 0.14 n’étaient pas présents sur GitHub. Cette reconstruction produit de nouveaux fichiers et de nouvelles vérifications ; elle ne prétend pas rétablir les anciens octets, commits ou rapports d’exécution.

## Exigences retrouvées — MI12 « Le troisième relais »

- Mission sur Thyr après le premier rapport MI11 ; trois relais distincts et le Prétoire VE12 avec capteur et verrou fonctionnels.
- Une copie réelle de 24 secondes dans une fenêtre de 45 secondes. Une copie acquise survit à la destruction ultérieure de sa source ; une source perdue avant copie ne livre aucun texte.
- Trois conduites : effacer les trois relais ; effacer deux relais et isoler le troisième ; refuser ouvertement l’ordre et isoler les trois relais intacts.
- Les décisions ne remplacent pas les opérations sur le terrain. Les travaux, dommages, interruptions et pertes persistent jusqu’au rapport et à l’extraction.
- Les conséquences concernent Ilan, Holt et les possibilités de refuge. Les ordres industriels sont une pièce locale, sans preuve politique globale, diffusion publique ni défection avant MI16.
- Migration v11 vers v12 additive, conservation des onze rapports et des stocks, quatre lots au premier rapport uniquement.

## Exigences retrouvées — MI13 « Pièces de rechange »

- Ouverture de Kharon après MI12 ; porteur physique à quatre roues et deux caisses distinctes.
- Deux ponts thermiques portent les vrais pieds et roues. Chaleur de contact, ambiance et vapeur restent distinctes ; avertissement de vapeur 3 secondes, jet 2 secondes, repos 7 secondes.
- Chaque vanne demande 4 secondes sous ancrage ; elle ferme le circuit, arrête le jet et refroidit progressivement le pont de 90 à 28 °C.
- Deux drones et une tourelle arrivent réellement 6 secondes après déclenchement de l’embuscade ; aucun comportement, dégât ou rendu avant leur arrivée.
- Deux marquages copiés en 3 secondes chacun, bordereau en 4 secondes, analyse de Tess en 8 secondes. PT03 exige ces quatre acquisitions ; les copies restent à bord après perte des originaux.
- La provenance industrielle locale ne recoupe PT01 et les ordres MI12 que s’ils ont effectivement été obtenus. Aucune PT04, TE02 ou PO01 ni défection anticipée.
- Livrer ou mettre en quarantaine choisit une destination ; le porteur doit la rejoindre. Chaque caisse demande un transfert physique de 5 secondes, puis un rapport de 3 secondes et une extraction.
- La perte du porteur est terminale. La perte de caisses ou du bordereau permet un bilan dégradé, sans données inventées. Une interruption du transfert conserve sa progression physique ; les autres travaux interrompus repartent de zéro. La pause conserve l’état exact.
- Migration v12 vers v13 additive, quatre lots au premier rapport seulement et relectures indépendantes.
- Le HUD doit refléter immédiatement la surchauffe et la ventilation ; l’armement ne se déverrouille qu’en dessous de 48 %. Une caisse endommagée n’est pas qualifiée d’intacte.

## Méthode et réception

Les modules de simulation restent déterministes et indépendants du DOM. Les nouvelles formes SVG et Canvas partagent leur géométrie. Les anciens fichiers et fixtures sont conservés. La Bible reste issue de `data/bible.json`, avec ses identifiants existants et ses critères de production historiques.

La réception de la reconstruction doit distinguer : tests de simulation, parcours de DOM modélisé, rendu Canvas, essais dans un navigateur réel et critères humains encore ouverts. Les résultats historiques 0.13/0.14 décrivent les anciennes livraisons seulement ; de nouveaux résultats seront consignés dans `docs/QA_RECONSTRUCTION_014.md`.

Le chantier démarre en version 0.14.1 pour distinguer clairement cette reconstruction de la 0.14 perdue. MI14 « Les mains noires » reste la suite prévue ; sa conception existante n’est pas transformée en mission jouable par cette reconstruction.
