// node tests/markdown-save.test.cjs
// Le fichier index.html est la seule source de vérité des marqueurs :
// lecture exclusive depuis le bloc embarqué du HTML, écriture directe dans le
// fichier lié, et sauvegarde .md réduite à un export externe facultatif.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
function part(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `Bloc introuvable : ${start}`);
  return html.slice(a, b);
}

const elements = Object.fromEntries(
  ['embedded-markdown', 'markerCountBadge', 'syncStatusText', 'syncDot', 'btnBindFile', 'bindFileLabel']
    .map(id => [id, {
      textContent: '', value: '', className: '',
      classList: {
        set: new Set(),
        add(c) { this.set.add(c); }, remove(c) { this.set.delete(c); }, contains(c) { return this.set.has(c); }
      }
    }])
);

const notices = [];
const ctx = {
  console: { warn() {}, error() {} }, Promise, Date, JSON, setTimeout,
  document: { getElementById(id) { return elements[id]; } },
  markersData: [], fileHandle: null, fileHandleLinked: false, fileWriteQueue: Promise.resolve(),
  writtenSnapshot: null, dirtyWarned: false,
  fileSaveVersion: 0, dataOrigin: 'embedded-html',
  generateMarkdownContent() {
    return "<!-- CARTO_GUILLOTIERE_DATA_START\n" + JSON.stringify(ctx.markersData) + "\nCARTO_GUILLOTIERE_DATA_END -->";
  },
  showToast(message, type) { notices.push([message, type]); },
  escapeHtml(s) { return s; }, window: { confirm() { return true; }, addEventListener() {} }, confirm() { return true; },
  parseMarkdownToMarkers(text) {
    const match = text.match(/<!--\s*CARTO_GUILLOTIERE_DATA_START\s*([\s\S]*?)\s*CARTO_GUILLOTIERE_DATA_END\s*-->/);
    return match ? JSON.parse(match[1]) : [];
  },
  map: { removeLayer() {} }, leafletMarkers: new Map(),
  cancelMarkerMove() {}, closePurchaseDialog() {}, expireDuePurchases() { return []; },
  addOrUpdateLeafletMarker() {}, renderSidebarList() {}, updatePurchaseCountdownLabels() {}
};
vm.createContext(ctx);
vm.runInContext(
  part('      // Le fichier index.html est la seule source', "      // Remplace l'état affiché") +
  part("      // Remplace l'état affiché", '      function getMarkerDisplayLatLng'),
  ctx
);

const dataBlock = (data) => "<!-- CARTO_GUILLOTIERE_DATA_START\n" + JSON.stringify(data) + "\nCARTO_GUILLOTIERE_DATA_END -->";
const goodHtml = (data) => '<!DOCTYPE html>\n<html><body>\n  <script id="embedded-markdown" type="text/markdown">\n# Titre\n\n'
  + dataBlock(data) + '\n  </script>\n  <p>reste du fichier</p>\n</body></html>';

(async () => {
  // 1. Lecture : seules les données du fichier HTML comptent.
  const parsed = ctx.parseHtmlDocumentToMarkers(goodHtml([{ id: 'a', lat: 45, lng: 4 }]));
  assert.equal(parsed.markers.length, 1);
  assert.equal(parsed.hasDataBlock, true);
  assert.equal(ctx.parseHtmlDocumentToMarkers('<html><body>rien</body></html>'), null);

  // 2. Le démarrage ne lit plus le stockage du navigateur et n'écrit rien.
  const initSource = part('      function initApp()', '      // Ouverture directe');
  assert.ok(!/localStorage/.test(initSource), 'initApp ne doit pas utiliser le stockage navigateur');
  assert.match(html, /const LEGACY_STORAGE_KEY/, 'seule une migration ponctuelle peut relire l’ancienne clé');

  // 3. Sans fichier lié : rien n'est écrit sur le disque, l'interface le dit.
  ctx.markersData = [{ id: 'z', lat: 45, lng: 4 }];
  await ctx.saveAndSyncAll();
  assert.match(elements.syncStatusText.textContent, /inactif/);
  assert.equal(elements.syncDot.className, 'sync-dot idle');
  assert.equal(elements.btnBindFile.classList.contains('active-sync'), false);
  assert.equal(elements.markerCountBadge.textContent, 1);
  assert.match(elements["embedded-markdown"].textContent, /"id":"z"/);

  // 4. Écriture sérialisée dans le fichier HTML lié, sans altérer le reste du fichier.
  let disk = goodHtml([]);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const written = [];
  let call = 0;
  ctx.fileHandle = {
    name: 'index.html',
    async getFile() { return { async text() { return disk; } }; },
    async createWritable() {
      const n = ++call;
      return {
        async write(content) { this.content = content; if (n === 1) await gate; },
        async close() { written.push(this.content); disk = this.content; },
        async abort() {}
      };
    }
  };
  ctx.fileHandleLinked = true;
  ctx.markersData = [{ id: 'a', lat: 45, lng: 4 }];
  const first = ctx.saveAndSyncAll();
  ctx.markersData = [{ id: 'b', lat: 45, lng: 4 }];
  const second = ctx.saveAndSyncAll();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(call, 1, 'Les écritures doivent être sérialisées');
  release();
  assert.equal(await first, true);
  assert.equal(await second, true);
  const ids = written.map(s => JSON.parse(s.match(/CARTO_GUILLOTIERE_DATA_START\s*([\s\S]*?)\s*CARTO_GUILLOTIERE_DATA_END/)[1])[0].id);
  assert.deepEqual(ids, ['a', 'b']);
  assert.match(elements.syncStatusText.textContent, /Enregistré dans index\.html/);
  // Le fichier écrit reste une page complète, avec sa balise fermante et le bloc de données.
  for (const out of written) {
    assert.match(out, /<p>reste du fichier<\/p>/);
    assert.match(out, /CARTO_GUILLOTIERE_DATA_END -->\n  <\/script>/);
  }
  assert.equal(ctx.readMarkdownFromHtmlDocument(written[1]).includes('"id":"b"'), true);

  // 5. Une erreur d'écriture est signalée sans bloquer les suivantes.
  let aborted = false;
  ctx.fileHandle = {
    name: 'index.html',
    async getFile() { return { async text() { return disk; } }; },
    async createWritable() { return { async write() { throw Error('denied'); }, async abort() { aborted = true; } }; }
  };
  assert.equal(await ctx.saveAndSyncAll(), false);
  assert.ok(aborted);
  assert.match(elements.syncStatusText.textContent, /Échec/);
  assert.equal(notices.at(-1)[1], 'error');

  // 6. Le .md est un export externe : générer le Markdown n'écrit jamais sur le disque.
  const diskBefore = disk;
  ctx.markersData = [{ id: 'c', lat: 45, lng: 4 }];
  ctx.generateMarkdownContent();
  assert.equal(disk, diskBefore, 'la génération du .md ne doit rien écrire');

  // 7. Import : fichier HTML (source de vérité) ou sauvegarde .md.
  const applied = [];
  const events = {};
  const importCtx = {
    document: { getElementById() { return { addEventListener(type, fn) { events[type] = fn; } }; } },
    __content: '',
    FileReader: class { readAsText() { this.onload({ target: { result: importCtx.__content } }); } },
    parseMarkdownToMarkers: ctx.parseMarkdownToMarkers,
    readMarkdownFromHtmlDocument: ctx.readMarkdownFromHtmlDocument,
    getDistanceFromGuillotiere() { return 0; }, MAX_RADIUS_METERS: 5000,
    fileHandle: null, confirm() { return true; }, showToast() {}, escapeHtml(s) { return s; },
    applyMarkersFromSource(list, origin) { applied.push([list.length, origin]); }
  };
  vm.createContext(importCtx);
  vm.runInContext(
    part('      document.getElementById("fileImportInput").addEventListener', '      document.getElementById("btnClearAll").addEventListener'),
    importCtx
  );
  const open = (content, name) => {
    importCtx.__content = content;
    events.change({ target: { files: [{ name, type: name.endsWith('.html') ? 'text/html' : '' }], value: name } });
  };
  open(goodHtml([{ id: 'x', lat: 45, lng: 4 }]), 'index.html');
  assert.deepEqual(applied.at(-1), [1, 'import']);
  open('# rien\n' + dataBlock([]) + '\n', 'sauvegarde.md');
  assert.deepEqual(applied.at(-1), [0, 'import']);
  const before = applied.length;
  open('<html><body>sans données</body></html>', 'autre.html');
  assert.equal(applied.length, before, 'Un HTML sans bloc de données est refusé');

  console.log('Sauvegarde HTML (source de vérité) : OK');
})().catch(err => { console.error(err); process.exitCode = 1; });
