// Tests sans dépendance : node tests/move-marker.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
function part(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `Bloc introuvable : ${start}`);
  return html.slice(a, b);
}
const move = part('      function cancelMarkerMove()', '      window.__cartoEditMarker =');
const click = part('      map.on("click", (e) => {', '      const offlineSearchInput');
const markerFunction = part('      function addOrUpdateLeafletMarker(', '      function buildBorderButtonsHtml(');
const elements = Object.fromEntries(['moveMarkerControl', 'moveMarkerInstruction', 'btnCancelMove'].map(id => [id, {
  hidden: true, textContent: '', addEventListener(type, fn) { this[type] = fn; }
}]));
const events = {};
let saveCount = 0, modalCount = 0;
const purchase = { quantity: '1', startedAt: 100, expiresAt: 9999999999999, previousBorderColor: 'rouge' };
const purchaseBefore = JSON.stringify(purchase);
const marker = { id: 'point', title: 'Commerce', lat: 45.75, lng: 4.84, address: 'ancienne adresse', borderColor: 'jaune', purchase, description: 'note' };
const context = {
  window: {}, markersData: [marker], movingMarkerId: null,
  document: { getElementById(id) { return elements[id]; } },
  map: { on(type, fn) { events[type] = fn; }, closePopup() {} },
  addOrUpdateLeafletMarker() {}, renderSidebarList() {}, saveAndSyncAll() { saveCount++; },
  reverseGeocodeOffline() { return { fullAddress: 'nouvelle adresse' }; },
  getDistanceFromGuillotiere(lat) { return lat > 46 ? 6000 : 0; }, MAX_RADIUS_METERS: 5000,
  pulseCircleOutOfBounds() {}, showToast() {}, escapeHtml(s) { return s; },
  openMarkerModal() { modalCount++; }
};
vm.createContext(context);
vm.runInContext(move + click, context);
const clickAt = (lat, lng, button = 0) => events.click({latlng: {lat, lng}, originalEvent: {button}});
clickAt(45.76, 4.85);
assert.equal(modalCount, 1, 'Un clic normal permet encore de créer un point');
context.window.__cartoStartMarkerMove('point');
assert.equal(elements.moveMarkerControl.hidden, false);
assert.match(elements.moveMarkerInstruction.textContent, /Commerce/);
clickAt(47, 4.85);
assert.equal(marker.lat, 45.75, 'Un clic hors zone ne déplace pas le point');
assert.equal(context.movingMarkerId, 'point', 'Le déplacement reste possible après un clic hors zone');
clickAt(45.76, 4.85, 2);
assert.equal(marker.lat, 45.75, 'Le bouton droit ne déplace pas le point');
clickAt(45.762345, 4.852345);
assert.equal(marker.lat, 45.76235);
assert.equal(marker.lng, Number((4.852345).toFixed(5)));
assert.equal(marker.address, 'nouvelle adresse');
assert.equal(JSON.stringify(marker.purchase), purchaseBefore);
assert.equal(marker.borderColor, 'jaune');
assert.equal(marker.description, 'note');
assert.equal(saveCount, 1);
assert.equal(context.movingMarkerId, null);
assert.equal(elements.moveMarkerControl.hidden, true);
context.window.__cartoStartMarkerMove('point');
elements.btnCancelMove.click();
assert.equal(context.movingMarkerId, null);
assert.equal(saveCount, 1, "L'annulation ne sauvegarde pas de modification");
assert.match(markerFunction, /draggable:\s*false/, 'Le glisser-déposer direct doit être désactivé');
assert.doesNotMatch(markerFunction, /dragend/);
console.log('Déplacement volontaire : tests réussis.');
