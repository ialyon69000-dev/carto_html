# 🗺️ Carte Interactive 100% Hors-Ligne — Lyon Quartier de la Guillotière

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
    - **Pourtour paramétrable à 3 couleurs** (modifiable dans la fiche modale, la fiche latérale ou l'infobulle sur la carte) :
      - 🟢 **Vert** (`vert` — `#16a34a`)
      - 🟠 **Orange** (`orange` — `#f97316`)
      - 🔴 **Rouge** (`rouge` — `#dc2626`)
    - **Centre avec logo du type et couleur dédiée pour chacune des 5 catégories** :
      - 🚬 **Tabac / Presse** (`tabac` — Carmin `#be123c`)
      - 📱 **Magasin de téléphonie** (`telephonie` — Bleu `#2563eb`)
      - 🛍️ **Commerce / Boutique** (`commerce` — Ambre `#b45309`)
      - 🏦 **Banque / Distributeur** (`banque` — Cyan `#0891b2`)
      - 🍽️ **Restaurant / Café** (`restauration` — Violet `#7c3aed`)
  - **Fichier `.md` directement inclus** dans `index.html` (`<script id="embedded-markdown" type="text/markdown">`) et synchronisé en temps réel.
- **Zone couverte de 5,00 km** autour de la Guillotière (`45.7547, 4.8422`) sans marqueur central encombrant la carte :
  - Tout clic ou déplacement en dehors de cette zone est bloqué (message « hors zone »), sans affichage de distance.
  - Aucune distance au centre n'est affichée : ni dans le tableau `.md`, ni dans les fiches, ni dans les infobulles, ni dans la barre d'état. Les anneaux de distance (1 km / 2,5 km) ainsi que le bouton associé ont été retirés ; seul le contour de la zone subsiste.
- **3 modes d'enregistrement** :
  1. **Automatique** dans le navigateur + dans le bloc `<script id="embedded-markdown">` interne.
  2. **Export / Liaison du fichier `marqueurs-guillotiere.md`** (compatible avec l'API *File System Access* pour écriture directe sur disque à chaque clic).
  3. **Bouton « 📦 Exporter HTML tout-en-un »** : génère un nouveau fichier `index.html` contenant à la fois la carte de Lyon hors-ligne ET vos marqueurs `.md` mis à jour.

## 📦 Contenu de `marqueurs-guillotiere.md` (mise à jour du 23/10/2026)

Le fichier Markdown — également embarqué dans `index.html` via `<script id="embedded-markdown">` — contient désormais la **liste complète des commerces de la zone couverte** :

- **166 marqueurs** au total, répartis dans toute la zone couverte :
  - 🚬 **90 bureaux de tabac / presse** (catégorie `tabac`) ;
  - 📱 **76 magasins de téléphonie** (catégorie `telephonie`).
- **Source** : OpenStreetMap (licence ODbL), requête Overpass sur les tags `shop=tobacco` et `shop=mobile_phone`, données OSM au **03/08/2026**.
- **Adresses** : numéro + rue lorsqu'il existe dans OSM, sinon rue la plus proche calculée **hors-ligne** avec le réseau viaire embarqué, puis quartier ou commune.
- **Pourtour = indicateur de visite** (et non de proximité) : les 166 marqueurs sont réglés sur 🔴 **rouge**, c'est-à-dire « à visiter / non visité ». Vous pouvez ensuite passer un point en 🟠 **orange** (en cours) ou 🟢 **vert** (visité) depuis sa fiche.
- **Identifiants** : `osm_n_<id>` pour les nœuds OSM et `osm_way_<id>` pour les bâtiments, ce qui permet de retrouver chaque commerce sur OpenStreetMap.

> ℹ️ La clé de stockage local a été incrémentée (`carto_offline_lyon_guillotiere_v7`) afin que la nouvelle liste embarquée remplace l'ancienne sauvegarde du navigateur au premier chargement.
