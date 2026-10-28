// node tests/markdown-save.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
function part(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `Bloc introuvable : ${start}`);
  return html.slice(a, b);
}
const elements = Object.fromEntries(['embedded-markdown', 'mdLiveOutput', 'markerCountBadge', 'exportCount', 'syncStatusText', 'btnBindFile', 'bindFileLabel'].map(id => [id, {
  textContent: '', value: '', classList: { add() {} }
}]));
const notices = [];
let storageFails = false;
const context = {
  console: { warn() {}, error() {} }, Promise,
  document: { getElementById(id) { return elements[id]; } },
  localStorage: { setItem(k, v) { if (storageFails) throw Error('quota'); this.value = v; } },
  STORAGE_KEY: 'test', markersData: [], fileHandle: null, fileWriteQueue: Promise.resolve(), fileSaveVersion: 0, localStorageFailed: false,
  generateMarkdownContent() { return JSON.stringify(context.markersData); },
  showToast(message, type) { notices.push([message, type]); },
  escapeHtml(s) { return s; }, window: {}, confirm() { return true; }, downloadMarkdownFile() { notices.push(['download']); }
};
vm.createContext(context);
vm.runInContext(part('      function saveAndSyncAll() {', '      function downloadMarkdownFile()') +
  part('      async function bindLocalMarkdownFile() {', '      function getMarkerDisplayLatLng'), context);

(async () => {
  context.markersData = [{ id: 'a', purchase: { quantity: '1' } }];
  assert.equal(await context.saveAndSyncAll(), false);
  assert.match(elements.syncStatusText.textContent, /inactive/);
  assert.equal(JSON.parse(context.localStorage.value)[0].purchase.quantity, '1');

  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const written = [];
  let call = 0;
  context.fileHandle = { name: 'sauvegarde.md', async createWritable() {
    const n = ++call;
    return { async write(content) { if (n === 1) await gate; this.content = content; }, async close() { written.push(this.content); } };
  } };
  const first = context.saveAndSyncAll();
  context.markersData = [{ id: 'b', purchase: { quantity: '2-5' } }];
  const second = context.saveAndSyncAll();
  await Promise.resolve();
  assert.equal(call, 1, 'Les écritures doivent être sérialisées');
  release();
  assert.equal(await first, true);
  assert.equal(await second, true);
  assert.deepEqual(written.map(s => JSON.parse(s)[0].id), ['a', 'b']);
  assert.equal(JSON.parse(written[1])[0].purchase.quantity, '2-5');
  assert.match(elements.syncStatusText.textContent, /Sauvegardé dans sauvegarde.md/);

  let aborted = false;
  context.fileHandle = { name: 'erreur.md', async createWritable() { return { async write() { throw Error('denied'); }, async abort() { aborted = true; } }; } };
  assert.equal(await context.saveAndSyncAll(), false);
  assert.ok(aborted);
  assert.match(elements.syncStatusText.textContent, /Échec/);
  assert.equal(notices.at(-1)[1], 'error');
  // Une erreur ne bloque pas les écritures suivantes.
  context.fileHandle = { name: 'ok.md', async createWritable() { return { async write() {}, async close() {} }; } };
  assert.equal(await context.saveAndSyncAll(), true);
  assert.match(elements.syncStatusText.textContent, /Sauvegardé dans ok.md/);

  storageFails = true;
  context.fileHandle = null;
  await context.saveAndSyncAll();
  assert.match(elements.syncStatusText.textContent, /navigateur impossible/);
  assert.ok(notices.some(([msg, type]) => type === 'error' && msg.includes('navigateur')));

  // Une sélection annulée ne remplace pas la liaison précédente.
  const old = context.fileHandle = { name: 'ancien.md' };
  context.window.showSaveFilePicker = async () => { throw Object.assign(Error(), { name: 'AbortError' }); };
  await context.bindLocalMarkdownFile();
  assert.equal(context.fileHandle, old);
  // Une erreur à la première écriture ne doit pas afficher de succès.
  storageFails = false;
  context.window.showSaveFilePicker = async () => ({ name: 'refus.md', async createWritable() { throw Error('denied'); } });
  const count = notices.length;
  await context.bindLocalMarkdownFile();
  assert.ok(notices.slice(count).some(([, type]) => type === 'error'));
  assert.ok(!notices.slice(count).some(([, type]) => type === 'success'));
  // Teste la restauration, y compris une sauvegarde vide et le refus de remplacement.
  const events = {};
  let currentContent = '', confirms = false, syncs = 0;
  const importContext = {
    document: { getElementById() { return { addEventListener(type, fn) { events[type] = fn; } }; } },
    FileReader: class { readAsText() { this.onload({ target: { result: currentContent } }); } },
    parseMarkdownToMarkers(text) { return text === 'valide' ? [{ id: 'restauré', lat: 45, lng: 4 }] : []; },
    getDistanceFromGuillotiere() { return 0; }, MAX_RADIUS_METERS: 5000,
    fileHandle: { name: 'lié.md' }, confirm(message) { assert.match(message, /écrasé/); return confirms; },
    markersData: [{ id: 'original' }], leafletMarkers: new Map(), map: { removeLayer() {} },
    cancelMarkerMove() {}, closePurchaseDialog() {}, expireDuePurchases() { return []; },
    addOrUpdateLeafletMarker() {}, renderSidebarList() {}, saveAndSyncAll() { syncs++; },
    updatePurchaseCountdownLabels() {}, showToast() {}, escapeHtml(s) { return s; }
  };
  vm.createContext(importContext);
  vm.runInContext(part('      document.getElementById("fileImportInput").addEventListener', '      document.getElementById("btnClearAll").addEventListener'), importContext);
  const open = content => { currentContent = content; events.change({ target: { files: [{ name: 'test.md' }], value: 'test.md' } }); };
  open('valide');
  assert.equal(importContext.markersData[0].id, 'original');
  assert.equal(syncs, 0);
  confirms = true;
  open('valide');
  assert.equal(importContext.markersData[0].id, 'restauré');
  assert.equal(syncs, 1);
  open('<!-- CARTO_GUILLOTIERE_DATA_START\n[]\nCARTO_GUILLOTIERE_DATA_END -->');
  assert.equal(importContext.markersData.length, 0);
  assert.equal(syncs, 2);
  open('contenu invalide');
  assert.equal(syncs, 2);
  console.log('Sauvegarde Markdown : OK');
})().catch(err => { console.error(err); process.exitCode = 1; });
