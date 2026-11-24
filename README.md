# 🗺️ Carte de Lyon — ⚡ 100% Hors-Ligne (données dans index.html)

Application cartographique **totalement autonome (100% hors-ligne)** centrée sur le quartier de **La Guillotière (Place Gabriel Péri, Lyon 7e/3e)** avec une **zone couverte** de 5 km (simple limite d'affichage, sans notion de distance dans les fiches). **Toutes les données sont stockées dans le fichier `index.html`** (bloc embarqué) ; le fichier **Markdown (`.md`)** n'est qu'une sauvegarde externe facultative.

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
      - 🔵 **Non renseigné** (`bleu` — `#2563eb`) — couleur par défaut de tous les points, **non sélectionnable manuellement** ;
      - 🔴 **Achat Interdit** (`rouge` — `#dc2626`) — choix manuel ;
      - 🟠 **Achat déconseillé** (`orange` — `#f97316`) — choix manuel ;
      - 🟡 **Achat Restreint** (`jaune` — `#eab308`) — **sélectionnable** pour deux raisons : « Achat » (carence de 3 semaines) ou « Manque de matériel » (aucune durée de carence) ;
      - 🟢 **Achat libre** (`vert` — `#16a34a`) — choix manuel.
    - **Légende affichée sur la carte** (contrôle en bas à gauche, repliable) : 🔴 Achat Interdit · 🟠 Achat déconseillé · 🟡 Achat Restreint · 🟢 Achat libre, avec un rappel des deux raisons du jaune.
    - **Bouton « 🟡 Achat Restreint »** (sélecteur 🟡, fiche latérale, infobulle et fiche modale) : choix de la raison puis validation. La restriction est mémorisée sans limite de temps et reste visible après l'échéance. Deux raisons sont proposées :
      - 🛒 **Achat** — carence de **3 semaines** : à l'échéance, la couleur d'origine est restaurée automatiquement, y compris après rechargement ou réimport ;
      - 🧰 **Manque de matériel** — **aucune durée de carence** : le jaune reste jusqu'à changement manuel.
      L'utilisateur peut forcer 🔴 Achat Interdit, 🟠 Achat déconseillé ou 🟢 Achat libre à tout moment ; avec « Achat », la couleur d'origine revient à l'échéance. « Annuler la restriction » restaure immédiatement la couleur d'origine ; après expiration, « Supprimer l'historique » retire l'historique sans modifier la couleur courante.
    - ℹ️ Les anciennes sauvegardes avec tranches de quantité (1 objet / 2 à 5 / 6 et plus) restent relues sans perte : « 1 objet » conserve son ancienne durée d'une semaine, « 6 et plus » six semaines ; toute restriction sans durée précisée passe à 3 semaines.
    - **Centre avec logo du type et couleur dédiée pour chacune des 5 catégories** :
      - 🚬 **Tabac / Presse** (`tabac` — Carmin `#be123c`)
      - 📱 **Magasin de téléphonie** (`telephonie` — Bleu `#2563eb`)
      - 🛍️ **Commerce / Boutique** (`commerce` — Ambre `#b45309`)
      - 🏦 **Banque / Distributeur** (`banque` — Cyan `#0891b2`)
      - 🍽️ **Restaurant / Café** (`restauration` — Violet `#7c3aed`)
  - **Données stockées dans le HTML lui-même**, dans le bloc `<script id="embedded-markdown" type="text/markdown">` : c’est la **seule source de vérité**. Le fichier `.md` n’est plus qu’une **sauvegarde externe facultative**.
- **Déplacement volontaire des points** : cliquez sur un point, puis sur « 📍 Déplacer » dans sa fiche et faites un clic gauche sur le nouvel emplacement (ou touchez la carte). Le glisser-déposer direct est désactivé. « Annuler » ou Échap abandonne l'opération ; un clic hors zone est refusé. L'adresse est recalculée et les autres informations, notamment les achats, sont conservées.
- **Filtre de couleur directement sur la carte** : le menu « Toutes les couleurs » permet d'afficher les points selon la couleur actuelle de leur pourtour (bleu, rouge, orange, jaune ou vert). Il est synchronisé avec le filtre de couleur du panneau latéral ; les filtres de catégorie et de recherche ne concernent que la liste. Le filtre masque les points sans les supprimer ni modifier leurs achats, et revient à toutes les couleurs au rechargement.
- **Zone couverte de 5,00 km** autour de la Guillotière (`45.7547, 4.8422`) sans marqueur central encombrant la carte :
  - Tout clic ou déplacement en dehors de cette zone est bloqué (message « hors zone »), sans affichage de distance.
  - Aucune distance au centre n'est affichée : ni dans le tableau `.md`, ni dans les fiches, ni dans les infobulles, ni dans la barre d'état. Les anneaux de distance (1 km / 2,5 km) ainsi que le bouton associé ont été retirés ; seul le contour de la zone subsiste.
- **Aucun stockage dans le navigateur pour les marqueurs** : deux PC qui ouvrent le même fichier `index.html` (y compris sur un lecteur réseau) affichent donc exactement les mêmes données. Une ancienne copie locale éventuelle n’est proposée qu’une seule fois, à la migration.

## 🧭 Interface : trois actions seulement

L’application s’ouvre **directement sur la base** : aucune fenêtre d’identification, aucun journal d’ouvertures, aucun enregistrement d’activité (le trigramme et l’export du journal `.log` ont été retirés).

Trois actions sont disponibles en haut de la page :

| Action | Effet |
|---|---|
| 🔗 **Enregistrer dans index.html** | Lie le fichier `index.html` (y compris sur un lecteur réseau) : chaque modification est écrite directement dedans. |
| 📂 **Charger un fichier .md** | Remplace la base affichée par le contenu d’une sauvegarde `.md` (ou d’un `index.html`). |
| 💾 **Exporter le fichier .md** | Télécharge une sauvegarde externe `marqueurs-guillotiere.md`. |

Le panneau latéral n’affiche plus que la liste des marqueurs (recherche, filtres par catégorie et par couleur), l’indicateur d’enregistrement et le bouton « Tout effacer ».

## 💾 Enregistrer les données (fichier HTML = source de vérité)

1. **Enregistrement direct dans `index.html`** : cliquez sur « 🔗 Enregistrer dans index.html » puis désignez **le fichier `index.html` lui-même** (sur un lecteur réseau, sélectionnez le fichier partagé, par exemple `\\serveur\partage\index.html`). À partir de là, chaque modification (fiche, couleur, achat, déplacement, suppression, expiration d’une restriction) est **écrite immédiatement dans le fichier HTML**.
2. Le navigateur demande l’autorisation d’écriture : acceptez-la. Sans autorisation, rien n’est écrit sur le disque et le voyant passe en orange puis en rouge.
3. Si le fichier choisi contient déjà d’autres données que la page affichée, un choix explicite est proposé : **remplacer le fichier** par les données affichées, ou **charger les données du fichier** dans la page. Aucun écrasement silencieux n’est possible.
4. La liaison ne dure que **le temps de la page** (limite du navigateur) : après un rechargement, réactivez-la en un clic. Le voyant en bas du panneau indique l’état : gris = inactif, bleu = écriture, vert = enregistré, orange = modifications non écrites, rouge = échec.
5. Sur un lecteur réseau, deux PC doivent éviter de modifier **en même temps** : le dernier enregistrement remplace l’autre (le fichier est relu avant chaque écriture pour ne rien casser d’autre). Pour récupérer une version à jour, rechargez simplement la page (F5).
6. « Charger un fichier .md » accepte une sauvegarde `.md` **ou** un `index.html` : seul le bloc de données est repris.
7. « Exporter le fichier .md » produit une **copie externe de secours** dans le dossier de téléchargements ; elle n’est jamais relue automatiquement.

## 📦 Contenu du bloc de données (mise à jour du 27/10/2026)

Le bloc `<script id="embedded-markdown">` de `index.html` (et son export `.md` facultatif) contient la **liste complète des commerces de la zone couverte** :

- **173 marqueurs** au total, répartis dans toute la zone couverte :
  - 🚬 **90 bureaux de tabac / presse** (catégorie `tabac`) ;
  - 📱 **83 magasins de téléphonie** (catégorie `telephonie`), dont **Save — Grande Rue de la Croix-Rousse** (29 bis Grande Rue de la Croix-Rousse, ajouté le 24/10/2026 après comparaison avec l'extraction CSV) ainsi que les **6 grandes enseignes vendeuses de téléphones** ajoutées le 23/10/2026 : **Fnac Lyon Bellecour**, **Fnac Lyon Part-Dieu**, **Fnac Lyon — Gare Part-Dieu**, **Darty Lyon République**, **Darty La Part-Dieu** et **Boulanger Lyon — Les Cordeliers** (catégorisées `shop=electronics` dans OSM, elles n'apparaissaient donc pas dans l'extraction `shop=mobile_phone`). Le Boulanger de la Part-Dieu, fermé, et les magasins hors zone des 5 km (ex. Darty Caluire) n'ont pas été ajoutés.
- **Source** : OpenStreetMap (licence ODbL), requête Overpass sur les tags `shop=tobacco` et `shop=mobile_phone`, données OSM au **03/08/2026** & comparatif CSV ; Fnac / Darty / Boulanger : adresses et coordonnées vérifiées sur les sites officiels des enseignes (oct. 2026).
- **Descriptions nettoyées** : les notes/commentaires génériques présents par défaut dans les 173 fiches ont été supprimés. Le champ « Description / Notes » reste disponible pour vos propres observations.
- **Adresses** : numéro + rue lorsqu'il existe dans OSM, sinon rue la plus proche calculée **hors-ligne** avec le réseau viaire embarqué, puis quartier ou commune.
- **Pourtour = code couleur à 5 états** (et non de proximité) : les 173 marqueurs sont réglés sur 🔵 **Non renseigné**, la couleur par défaut. Elle n'est pas proposée dans les sélecteurs, car elle n'est pas sélectionnable manuellement ; 🔴 Achat Interdit, 🟠 Achat déconseillé et 🟢 Achat libre se choisissent librement dans l'interface, y compris pendant une restriction ; 🟡 Achat Restreint se sélectionne avec une raison — « Achat » (carence de 3 semaines) ou « Manque de matériel » (aucune carence) — puis la couleur d'origine revient à l'expiration (pour « Achat » uniquement).
- **Restrictions persistantes et expiration** : la raison (🛒 Achat ou 🧰 Manque de matériel), la date de début, la durée de carence (3 semaines pour « Achat », aucune pour « Manque de matériel »), la date d'expiration (le cas échéant), une éventuelle couleur forcée et la couleur d'origine sont écrites dans le bloc JSON du `.md` et dans le détail du marqueur. La restriction reste visible indéfiniment, y compris après réimport, export, rechargement ou expiration ; une fois la période écoulée (uniquement pour « Achat »), la couleur d'origine est restaurée automatiquement.
- **Identifiants** : `osm_n_<id>` pour les nœuds OSM et `osm_way_<id>` pour les bâtiments, ce qui permet de retrouver chaque commerce sur OpenStreetMap ; `manuel_<enseigne>_<magasin>` pour les 6 enseignes Fnac / Darty / Boulanger ajoutées manuellement.

> ℹ️ Les données ne sont plus stockées dans le navigateur : elles vivent dans le bloc embarqué de `index.html`, seul fichier à partager entre postes.
