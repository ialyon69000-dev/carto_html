// Test sans dépendance : node tests/page-integrity.test.cjs
// Garde-fou contre les régressions qui rendent la page blanche : un patch qui
// duplique un bloc de l'interface ou supprime une fonction utilitaire du script
// applicatif laisse la carte vide (seuls l'en-tête et le menu s'affichent).
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

// --- Le document est complet et non dupliqué ---
assert.match(html.trimStart().slice(0, 200).toLowerCase(), /^<!doctype html>/);
assert.ok(html.trimEnd().endsWith('</html>'), 'la page doit se terminer par </html>');

const countOf = (needle) => html.split(needle).length - 1;
const uniqueMarkers = [
  '<body>',
  '</body>',
  '</head>',
  '<!-- Header -->',
  'id="sidebar"',
  'id="markerModal"',
  'id="purchaseModal"',
  'id="markerCountBadge"',
  '<script id="app-inline-js">',
  '<script id="leaflet-inline-js">',
  '<script id="lyon-offline-map-data">',
  'const BORDER_COLORS = [',
  'const CATEGORIES = ['
];
uniqueMarkers.forEach((marker) => {
  assert.equal(countOf(marker), 1, `« ${marker} » doit apparaître exactement une fois (trouvé ${countOf(marker)})`);
});

// Une seule vraie balise de données embarquée (les autres occurrences sont des
// références dans le code, sous forme de chaîne '<script id="..."')
const dataTagCount = (html.match(/^\s*<script id="embedded-markdown"/gm) || []).length;
assert.equal(dataTagCount, 1, `une seule balise <script id="embedded-markdown"> (trouvé ${dataTagCount})`);

// Un seul bloc de données embarqué complet
// Le code applicatif mentionne ces marqueurs dans des constantes/expressions :
// on ne compte ici que les lignes réelles du document (en début de ligne).
const dataBlockBounds = (html.match(/^<!-- CARTO_GUILLOTIERE_DATA_START$/gm) || []).length;
assert.equal(dataBlockBounds, 1, `un seul bloc de données complet (trouvé ${dataBlockBounds})`);
const dataEndCount = (html.match(/^CARTO_GUILLOTIERE_DATA_END -->$/gm) || []).length;
assert.equal(dataEndCount, 1, `une seule fin de bloc de données (trouvé ${dataEndCount})`);

// --- Les fonctions utilitaires du script applicatif sont bien présentes ---
const appStart = html.indexOf('<script id="app-inline-js">');
const appEnd = html.indexOf('</script>', appStart);
assert.ok(appStart > 0 && appEnd > appStart, 'script applicatif introuvable');
const appJs = html.slice(appStart, appEnd);

[
  'function escapeHtml(',
  'function buildPopupHtml(',
  'function buildPurchaseBarHtml(',
  'function generateMarkdownContent(',
  'function normalizeMarkerColorState(',
  'function initApp('
].forEach((fn) => {
  assert.equal(appJs.split(fn).length - 1, 1, `« ${fn} » doit être défini une seule fois`);
});

// Toutes les fonctions appelées via escapeHtml(...) supposent sa présence
assert.ok(/function escapeHtml\(str\)/.test(appJs), 'escapeHtml doit rester défini (utilisé partout)');

// --- Les données de l'utilisateur sont intactes ---
const jsonStart = html.indexOf('<!-- CARTO_GUILLOTIERE_DATA_START');
const jsonEnd = html.indexOf('CARTO_GUILLOTIERE_DATA_END -->');
const data = JSON.parse(html.slice(html.indexOf('\n', jsonStart) + 1, jsonEnd).trim());
assert.equal(data.length, 190, 'les 190 marqueurs du fichier doivent être conservés');
assert.ok(data.every((m) => typeof m.lat === 'number' && typeof m.lng === 'number'), 'coordonnées valides');

// --- Aucun historique d'achat dans l'interface ---
assert.doesNotMatch(appJs, /getRemainingPurchaseLabel|purchase-remaining|data-purchase-expires/);
assert.doesNotMatch(appJs, /L’achat reste mémorisé|Supprimer l’historique/);
assert.doesNotMatch(appJs, /expiredAt/);

console.log('Intégrité de la page (structure, fonctions, données) : OK');
