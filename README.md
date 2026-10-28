# 🗺️ Carte de Lyon — ⚡ 100% Hors-Ligne (Carte + .md inclus)

Application cartographique **totalement autonome (100% hors-ligne)** centrée sur le quartier de **La Guillotière (Place Gabriel Péri, Lyon 7e/3e)** avec une **zone couverte** de 5 km (simple limite d'affichage, sans notion de distance dans les fiches) et sauvegarde dans un fichier **Markdown (`.md`)** intégré et exportable.

## ✨ Fonctionnalités (0 connexion Internet requise)

- **1 seul fichier `index.html` tout-en-un** :
  - Moteur **Leaflet 1.9.4** (CSS + JS) directement intégré dans le fichier HTML.
  - **Fond de carte vectoriel de Lyon embarqué** (rendu HTML5 Canvas haute définition à tous les niveaux de zoom, thèmes *Clair* et *Sombre*) :
    - **Réseau routier continu et mis à jour** (plus de 3 350 rues et axes continus couvrant la Guillotière, Presqu'île, Confluence, Vieux-Lyon, Croix-Rousse, Part-Dieu, Gerland, Villeurbanne et la métropole dans la zone couverte) avec détection automatique du nom de rue au survol et au clic.
    - **Le Rhône, la Saône** et les bassins fluviaux.
    - **389 parcs et jardins** (Parc de la Tête d'Or, Parc Sergent Blandan, Parc de Gerland, Berges du Rhône...).
    - **30 quartiers officiels**, les 9 arrondissements de Lyon et **12 communes limitrophes** (Villeurbanne, Bron, Vénissieux, Oullins-Pierre-Bénite, Caluire-et-Cuire, Sainte-Foy-lès-Lyon, La Mulatière, Tassin...).
    - **Réseau TCL** : lignes et stations de **Métro (A, B, C, D)**, **Funiculaires (F1, F2)** et **Tramways (T1 à T6)**.
  - **Icônes à double codage visuel (Pourtour + Centre)** :
    - **Pourtour à 5 couleurs** (visible dans la fiche modale, la fiche latérale et l'infobulle sur la carte) :
      - 🔵 **Bleu** (`bleu` — `#2563eb`) — couleur par défaut de tous les points, **non sélectionnable manuellement** ;
      - 🔴 **Rouge** (`rouge` — `#dc2626`) — couleur choisie dans l'interface ;
      - 🟠 **Orange** (`orange` — `#f97316`) — couleur choisie dans l'interface ;
      - 🟡 **Jaune** (`jaune` — `#eab308`) — **imposé par l'interface** après validation d'un achat, jamais sélectionné manuellement ;
      - 🟢 **Vert** (`vert` — `#16a34a`) — couleur choisie dans l'interface.
    - **Bouton « 🛒 Achat »** sur chaque fiche et infobulle : choix de la tranche achetée (**1 objet**, **2 à 5 objets** ou **6 objets et plus**) puis validation. L'achat est mémorisé sans limite de temps et reste visible après l'échéance. Le 🟡 jaune est proposé pendant **1 semaine**, **3 semaines** ou **6 semaines** respectivement, mais l'utilisateur peut forcer 🔴 rouge, 🟠 orange ou 🟢 vert à tout moment. À l'échéance, la couleur d'origine est restaurée automatiquement, y compris après rechargement ou réimport. « Annuler l'achat » restaure immédiatement la couleur d'origine ; après expiration, « Supprimer l'achat » retire l'historique sans modifier la couleur courante.
    - ℹ️ « Plus de 6 objets » est traité comme « 6 objets et plus » afin qu'un achat de 6 objets ne soit laissé sans durée.
    - **Centre avec logo du type et couleur dédiée pour chacune des 5 catégories** :
      - 🚬 **Tabac / Presse** (`tabac` — Carmin `#be123c`)
      - 📱 **Magasin de téléphonie** (`telephonie` — Bleu `#2563eb`)
      - 🛍️ **Commerce / Boutique** (`commerce` — Ambre `#b45309`)
      - 🏦 **Banque / Distributeur** (`banque` — Cyan `#0891b2`)
      - 🍽️ **Restaurant / Café** (`restauration` — Violet `#7c3aed`)
  - **Fichier `.md` directement inclus** dans `index.html` (`<script id="embedded-markdown" type="text/markdown">`) et synchronisé en temps réel.
- **Déplacement volontaire des points** : cliquez sur un point, puis sur « 📍 Déplacer » dans sa fiche et faites un clic gauche sur le nouvel emplacement (ou touchez la carte). Le glisser-déposer direct est désactivé. « Annuler » ou Échap abandonne l'opération ; un clic hors zone est refusé. L'adresse est recalculée et les autres informations, notamment les achats, sont conservées.
- **Filtre de couleur directement sur la carte** : le menu « Toutes les couleurs » permet d'afficher les points selon la couleur actuelle de leur pourtour (bleu, rouge, orange, jaune ou vert). Il est synchronisé avec le filtre de couleur du panneau latéral ; les filtres de catégorie et de recherche ne concernent que la liste. Le filtre masque les points sans les supprimer ni modifier leurs achats, et revient à toutes les couleurs au rechargement.
- **Zone couverte de 5,00 km** autour de la Guillotière (`45.7547, 4.8422`) sans marqueur central encombrant la carte :
  - Tout clic ou déplacement en dehors de cette zone est bloqué (message « hors zone »), sans affichage de distance.
  - Aucune distance au centre n'est affichée : ni dans le tableau `.md`, ni dans les fiches, ni dans les infobulles, ni dans la barre d'état. Les anneaux de distance (1 km / 2,5 km) ainsi que le bouton associé ont été retirés ; seul le contour de la zone subsiste.
- **3 modes d'enregistrement** :
  1. **Automatique** dans le navigateur + dans le bloc `<script id="embedded-markdown">` interne.
  2. **Export / Liaison du fichier `marqueurs-guillotiere.md`** (compatible avec l'API *File System Access* pour écriture directe sur disque à chaque clic).
  3. **Bouton « 📦 Exporter HTML tout-en-un »** : génère un nouveau fichier `index.html` contenant à la fois la carte de Lyon hors-ligne ET vos marqueurs `.md` mis à jour.

## 📦 Contenu de `marqueurs-guillotiere.md` (mise à jour du 27/10/2026)

Le fichier Markdown — également embarqué dans `index.html` via `<script id="embedded-markdown">` — contient désormais la **liste complète des commerces de la zone couverte** :

- **173 marqueurs** au total, répartis dans toute la zone couverte :
  - 🚬 **90 bureaux de tabac / presse** (catégorie `tabac`) ;
  - 📱 **83 magasins de téléphonie** (catégorie `telephonie`), dont **Save — Grande Rue de la Croix-Rousse** (29 bis Grande Rue de la Croix-Rousse, ajouté le 24/10/2026 après comparaison avec l'extraction CSV) ainsi que les **6 grandes enseignes vendeuses de téléphones** ajoutées le 23/10/2026 : **Fnac Lyon Bellecour**, **Fnac Lyon Part-Dieu**, **Fnac Lyon — Gare Part-Dieu**, **Darty Lyon République**, **Darty La Part-Dieu** et **Boulanger Lyon — Les Cordeliers** (catégorisées `shop=electronics` dans OSM, elles n'apparaissaient donc pas dans l'extraction `shop=mobile_phone`). Le Boulanger de la Part-Dieu, fermé, et les magasins hors zone des 5 km (ex. Darty Caluire) n'ont pas été ajoutés.
- **Source** : OpenStreetMap (licence ODbL), requête Overpass sur les tags `shop=tobacco` et `shop=mobile_phone`, données OSM au **03/08/2026** & comparatif CSV ; Fnac / Darty / Boulanger : adresses et coordonnées vérifiées sur les sites officiels des enseignes (oct. 2026).
- **Descriptions nettoyées** : les notes/commentaires génériques présents par défaut dans les 173 fiches ont été supprimés. Le champ « Description / Notes » reste disponible pour vos propres observations.
- **Adresses** : numéro + rue lorsqu'il existe dans OSM, sinon rue la plus proche calculée **hors-ligne** avec le réseau viaire embarqué, puis quartier ou commune.
- **Pourtour = code couleur à 5 états** (et non de proximité) : les 173 marqueurs sont réglés sur 🔵 **bleu**, la couleur par défaut. Le bleu n'est pas proposé dans les sélecteurs, car il n'est pas sélectionnable manuellement ; 🔴 Rouge, 🟠 Orange et 🟢 Vert se choisissent librement dans l'interface, y compris pendant un achat ; 🟡 Jaune est proposé lorsqu'un achat est validé, puis la couleur d'origine revient à l'expiration.
- **Achats persistants et expiration** : la tranche validée, la date de début, la durée, la date d'expiration, une éventuelle couleur forcée et la couleur d'origine sont écrites dans le bloc JSON du `.md` et dans le détail du marqueur. L'achat reste visible indéfiniment, y compris après réimport, export, rechargement ou expiration ; une fois la période écoulée, la couleur d'origine est restaurée automatiquement.
- **Identifiants** : `osm_n_<id>` pour les nœuds OSM et `osm_way_<id>` pour les bâtiments, ce qui permet de retrouver chaque commerce sur OpenStreetMap ; `manuel_<enseigne>_<magasin>` pour les 6 enseignes Fnac / Darty / Boulanger ajoutées manuellement.

> ℹ️ La clé de stockage local a été incrémentée (`carto_offline_lyon_guillotiere_v12`) afin que la nouvelle liste embarquée — en bleu par défaut, sans descriptions génériques et avec historique d'achat déverrouillé — remplace l'ancienne sauvegarde du navigateur au premier chargement.
