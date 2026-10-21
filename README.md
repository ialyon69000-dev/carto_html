# Carto HTML — Carte de Lyon (La Guillotière, 5 km) 100 % Hors-Ligne & Autonome

Application cartographique **100 % autonome et fonctionnelle hors-ligne** contenue dans **un seul fichier `index.html`** (~945 Ko), incluant à la fois :
1. **Le moteur cartographique (Leaflet 1.9.4)** directement embarqué dans le fichier HTML (aucun CDN requis).
2. **Le fond de carte vectoriel complet de Lyon** centré sur le **quartier de la Guillotière** (`45.7547° N, 4.8422° E` — Place Gabriel Péri) sur un rayon de plus de 5 km :
   - **3 552 rues, avenues, boulevards, places et ponts** avec leurs noms officiels.
   - **Le Rhône, la Saône** et les plans d'eau.
   - **389 parcs, jardins et espaces verts** (Parc Sergent Blandan, Parc de la Tête d'Or, Parc de Gerland, Parc de Parilly…).
   - **Les 30 quartiers et 9 arrondissements de Lyon** + **21 communes limitrophes** (Villeurbanne, Bron, Vénissieux, Oullins, Caluire-et-Cuire…).
   - **Le réseau TCL** : lignes et stations de Métro (A, B, C, D), Funiculaires (F1, F2) et Tramways (T1 à T6).
   - **Les voies ferrées SNCF** et grands axes routiers.
3. **Le fichier Markdown (`.md`) embarqué** directement dans `index.html` (`<script id="embedded-markdown" type="text/markdown">`) et exportable/synchronisable avec `marqueurs-guillotiere.md`.

## Fichiers à emporter

- **Option 1 (1 seul fichier à emporter)** : Emportez uniquement **`index.html`**. Lorsque vous ajoutez ou modifiez des marqueurs hors-ligne, cliquez sur **`📦 Exporter HTML tout-en-un`** pour sauvegarder un nouveau `index.html` contenant la carte hors-ligne **et** votre fichier `.md` mis à jour à l'intérieur.
- **Option 2 (2 fichiers : `index.html` + `marqueurs-guillotiere.md`)** : Utilisez **`💾 Enregistrer .md`** ou **`🔗 Lier fichier .md (Auto)`** pour enregistrer directement vos marqueurs dans `marqueurs-guillotiere.md`, et **`📂 Ouvrir .md`** pour les recharger.
