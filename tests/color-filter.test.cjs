// Tests sans dépendance : node tests/color-filter.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const app = html.slice(html.indexOf('      function updateMarkerVisibility('), html.indexOf('      function buildBorderButtonsHtml('));
const filter = html.slice(html.indexOf('      function setBorderFilter('), html.indexOf('      function renderSidebarList()'));
assert.ok(app.length && filter.length);
const context = {
  console,
  markersData: [], leafletMarkers: new Map(), activeBorderFilter: 'all', movingMarkerId: null,
  cancelMarkerMove() {},
  map: {
    layers: new Set(),
    hasLayer(layer) { return this.layers.has(layer); },
    removeLayer(layer) { this.layers.delete(layer); }
  },
  getBorderColorById(id) { return { id: ['bleu', 'rouge', 'orange', 'jaune', 'vert'].includes(id) ? id : 'bleu' }; },
  normalizeMarkerColorState() {}, getMarkerDisplayLatLng(m) { return [m.lat, m.lng]; },
  createPinIcon() {}, buildPopupHtml() { return ''; },
  L: { marker() { return {
    addTo(map) { map.layers.add(this); return this; }, bindPopup() {}, on() {},
    setLatLng() {}, setIcon() {}, setPopupContent() {}
  }; } },
  document: { getElementById() { return { addEventListener() {} }; } },
  renderSidebarList() {},
};
vm.createContext(context);
vm.runInContext(app + '\n' + filter, context);
const markers = ['bleu', 'rouge', 'orange', 'jaune', 'vert'].map((borderColor, i) => ({
  id: String(i), borderColor, lat: 45, lng: 4,
  purchase: { quantity: '2-5', previousBorderColor: 'rouge', expiresAt: '2030-01-01' }
}));
context.markersData = markers;
markers.forEach(m => context.addOrUpdateLeafletMarker(m));
const original = JSON.stringify(markers);
for (const marker of markers) {
  context.setBorderFilter(marker.borderColor);
  assert.equal(context.map.layers.size, 1);
  assert.ok(context.map.hasLayer(context.leafletMarkers.get(marker.id)));
  assert.equal(JSON.stringify(markers), original, 'Le filtre ne doit pas modifier les marqueurs ou les achats');
}
context.setBorderFilter('all');
assert.equal(context.map.layers.size, 5);
context.setBorderFilter('jaune');
markers[0].borderColor = 'jaune'; // achat ou changement de couleur
context.addOrUpdateLeafletMarker(markers[0]);
assert.equal(context.map.layers.size, 2);
markers[3].borderColor = 'rouge'; // expiration ou couleur forcée
context.addOrUpdateLeafletMarker(markers[3]);
assert.equal(context.map.layers.size, 1);
const added = { id: 'new', borderColor: 'vert', lat: 45, lng: 4 };
markers.push(added);
context.addOrUpdateLeafletMarker(added);
assert.equal(context.map.layers.size, 1);
context.setBorderFilter('all');
assert.equal(context.map.layers.size, 6);
console.log('Filtre de couleur : tests réussis.');

// Vérifie la syntaxe des scripts exécutables intégrés, sans évaluer les données Markdown.
for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (!/type="text\/markdown"/.test(match[1])) new vm.Script(match[2]);
}
console.log('Syntaxe des scripts intégrés : OK.');
