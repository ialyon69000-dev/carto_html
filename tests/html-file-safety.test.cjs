// node tests/html-file-safety.test.cjs
// Non-régression : le fichier index.html ne doit jamais être tronqué ni écrasé
// par erreur. Le bug corrigé venait de showSaveFilePicker (« Enregistrer sous »),
// qui vidait le fichier dès la sélection : la relecture donnait une page vide,
// l'application la refusait, et le fichier restait tronqué.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');

function part(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `Bloc introuvable : ${start}`);
  return html.slice(a, b);
}

const notices = [];
let confirmations = [];
let pickerCalls = [];
const elements = {};
['markerCountBadge', 'syncStatusText', 'syncDot', 'btnBindFile', 'bindFileLabel', 'embedded-markdown']
  .forEach((id) => { elements[id] = { textContent: '', className: '', classList: { s: new Set(), add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); }, contains(c) { return this.s.has(c); } } }; });

let fakeFileText = '';
const ctx = {
  console: { warn() {}, error() {} }, Promise, Date, JSON, setTimeout,
  document: {
    getElementById: (id) => elements[id],
    documentElement: { outerHTML: '<!DOCTYPE html>\n<html><body>\n  <script id="embedded-markdown" type="text/markdown">\n<!-- CARTO_GUILLOTIERE_DATA_START\n[{"id":"page"}]\nCARTO_GUILLOTIERE_DATA_END -->\n  </script>\n  <script id="app-inline-js">/* carte */</script>\n</body></html>' }
  },
  markersData: [{ id: 'page', lat: 45, lng: 4 }],
  leafletMarkers: new Map(), map: { removeLayer() {} },
  fileHandle: null, fileHandleLinked: false, fileWriteQueue: Promise.resolve(), fileSaveVersion: 0,
  writtenSnapshot: null, dirtyWarned: false, dataOrigin: 'embedded-html',
  showToast(message, type) { notices.push([message, type]); },
  escapeHtml: (s) => s,
  window: {
    addEventListener() {},
    confirm(message) { confirmations.push(message); return ctx.__confirmAnswer; },
    // « Enregistrer sous » : ne doit JAMAIS être utilisé pour lier le fichier.
    showSaveFilePicker() { pickerCalls.push('save'); throw new Error('showSaveFilePicker ne doit pas être utilisé'); },
    showOpenFilePicker(options) {
      pickerCalls.push('open');
      ctx.__lastPickerOptions = options;
      return [{ name: 'index.html', async getFile() { return { async text() { return fakeFileText; } }; },
        async createWritable() { const chunks = []; return { async write(c) { chunks.push(c); }, async close() { fakeFileText = chunks.join(''); }, async abort() {} }; } }];
    }
  },
  confirm(message) { confirmations.push(message); return ctx.__confirmAnswer; },
  cancelMarkerMove() {}, closePurchaseDialog() {},
  expireDuePurchases() { return []; }, addOrUpdateLeafletMarker() {}, renderSidebarList() {}, updatePurchaseCountdownLabels() {},
  applyMarkersFromSource(list) { ctx.markersData = list; },
  generateMarkdownContent() { return '# Marqueurs\n<!-- CARTO_GUILLOTIERE_DATA_START\n' + JSON.stringify(ctx.markersData) + '\nCARTO_GUILLOTIERE_DATA_END -->'; },
  parseMarkdownToMarkers(text) {
    const m = text.match(/CARTO_GUILLOTIERE_DATA_START\s*([\s\S]*?)\s*CARTO_GUILLOTIERE_DATA_END/);
    return m ? JSON.parse(m[1]) : [];
  },
  __confirmAnswer: true,
  // IndexedDB absent dans ce contexte : les fonctions de mémorisation doivent
  // rester silencieuses et ne rien casser.
  window_: null
};
ctx.window.indexedDB = undefined;
// IndexedDB factice minimal pour vérifier la mémorisation du fichier.
const fakeStore = new Map();
ctx.window.indexedDB = {
  open() {
    const request = { result: null, onupgradeneeded: null, onsuccess: null, onerror: null };
    setTimeout(() => {
      request.result = {
        objectStoreNames: { contains: () => true },
        createObjectStore() {},
        transaction() {
          const tx = { oncomplete: null, onerror: null };
          tx.objectStore = () => ({
            put(value, key) { fakeStore.set(key, value); setTimeout(() => tx.oncomplete && tx.oncomplete(), 0); },
            get(key) { setTimeout(() => { this._r = fakeStore.get(key); tx._req && tx._req.onsuccess && tx._req.onsuccess(); }, 0); return null; },
            delete(key) { fakeStore.delete(key); setTimeout(() => tx.oncomplete && tx.oncomplete(), 0); }
          });
          return tx;
        },
        close() {}
      };
      request.onsuccess && request.onsuccess();
    }, 0);
    return request;
  }
};
vm.createContext(ctx);
vm.runInContext(
  part('      // Le fichier index.html est la seule source', "      // Remplace l'état affiché"),
  ctx
);

const fullPage = (data) => '<!DOCTYPE html>\n<html><body>\n  <script id="embedded-markdown" type="text/markdown">\n'
  + '<!-- CARTO_GUILLOTIERE_DATA_START\n' + JSON.stringify(data) + '\nCARTO_GUILLOTIERE_DATA_END -->\n  </script>\n'
  + '  <script id="app-inline-js">/* gros script de la carte */</script>\n</body></html>';

(async () => {
  // 1. Le sélecteur de fichier ouvre en lecture/écriture, jamais « Enregistrer sous ».
  fakeFileText = fullPage([{ id: 'page', lat: 45, lng: 4 }]);
  const handle = await ctx.pickHtmlFileForWriting();
  assert.deepEqual(pickerCalls, ['open'], 'showOpenFilePicker doit être utilisé, pas showSaveFilePicker');
  assert.ok(handle, 'Un handle doit être retourné');
  assert.equal(ctx.__lastPickerOptions.multiple, false);

  // 2. Un fichier vide n'est jamais écrasé sans confirmation explicite.
  fakeFileText = '';
  ctx.fileHandle = null; ctx.fileHandleLinked = false;
  ctx.__confirmAnswer = false;
  confirmations = [];
  const before = notices.length;
  await ctx.bindLocalHtmlFile();
  assert.equal(fakeFileText, '', 'Le fichier vide ne doit pas être écrit sans accord');
  assert.ok(confirmations.some((m) => /vide/i.test(m)), 'La question doit signaler un fichier vide');
  assert.ok(notices.slice(before).some(([msg]) => /Aucune modification/.test(msg)));
  assert.equal(ctx.fileHandle, null, 'Aucun fichier ne doit être lié si l’utilisateur refuse');

  // 3. Confirmation acceptée : la page COMPLÈTE est écrite (jamais un fichier
  //    réduit au seul bloc de données).
  ctx.__confirmAnswer = true;
  ctx.window.__cartoPageSourceHtml = ctx.document.documentElement.outerHTML;
  await ctx.bindLocalHtmlFile();
  assert.match(fakeFileText, /<script id="app-inline-js">/, 'La page complète doit être écrite');
  assert.match(fakeFileText, /CARTO_GUILLOTIERE_DATA_END -->\n  <\/script>/);
  assert.equal(ctx.fileHandleLinked, true);

  // 3b. Une modification ultérieure conserve la page complète.
  ctx.markersData = [{ id: 'modifie', lat: 45, lng: 4 }];
  assert.equal(await ctx.saveAndSyncAll(), true);
  assert.match(fakeFileText, /<script id="app-inline-js">/, 'La page complète doit rester intacte');
  assert.match(fakeFileText, /"id":"modifie"/);

  // 6. Si la construction de la page est invalide, l'écriture est annulée (pas de troncature).
  const originalRead = ctx.readMarkdownFromHtmlDocument;
  ctx.readMarkdownFromHtmlDocument = () => null;
  let writeAttempted = false;
  ctx.fileHandle = {
    name: 'index.html',
    async getFile() { return { async text() { return 'x'; } }; },
    async createWritable() { writeAttempted = true; return { async write() {}, async close() {}, async abort() {} }; }
  };
  const failedNoticeCount = notices.length;
  assert.equal(await ctx.saveAndSyncAll(), false, 'Une page invalide doit faire échouer l’écriture');
  assert.equal(writeAttempted, false, 'Le fichier ne doit pas être ouvert en écriture');
  assert.ok(notices.slice(failedNoticeCount).some(([, type]) => type === 'error'));
  ctx.readMarkdownFromHtmlDocument = originalRead;

  console.log('Sécurité du fichier HTML (pas de troncature) : OK');
})().catch((err) => { console.error(err); process.exitCode = 1; });
