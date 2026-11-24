const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const source = html.slice(html.indexOf('      const SESSION_LOG_KEY'), html.indexOf('      function getMarkerDisplayLatLng('));
const store = new Map();
let downloaded = '', confirmations = true, clickFails = false;
const ctx = {
  console, Date, Blob, setTimeout(fn) { fn(); },
  localStorage: { getItem: k => store.get(k) || null, setItem: (k,v) => store.set(k,v), removeItem: k => store.delete(k) },
  URL: { createObjectURL(blob) { downloaded = blob; return 'blob:test'; }, revokeObjectURL() {} },
  window: { confirm() { return confirmations; } }, showToast() {},
  document: { body: { appendChild() {} }, createElement() { return { click() { if (clickFails) throw Error('download'); }, remove() {} }; } }
};
vm.createContext(ctx);
vm.runInContext(source, ctx);
const date = new Date('2026-11-19T14:00:00Z');
ctx.saveSessionOpening('abc', date);
ctx.saveSessionOpening('XYZ', date);
assert.equal(ctx.readSessionLog().length, 2);
assert.equal(ctx.readSessionLog()[0].trigram, 'ABC');
assert.throws(() => ctx.saveSessionOpening('AB', date));
confirmations = false;
ctx.exportSessionLog();
assert.equal(ctx.readSessionLog().length, 2);
confirmations = true; clickFails = true;
ctx.console = { error() {} };
ctx.exportSessionLog();
assert.equal(ctx.readSessionLog().length, 2);
clickFails = false;
ctx.exportSessionLog();
assert.equal(ctx.readSessionLog().length, 0);
downloaded.text().then(text => {
  assert.equal(text, '2026-11-19T14:00:00.000Z — ABC — Ouverture\n2026-11-19T14:00:00.000Z — XYZ — Ouverture\n');
  console.log('Journal des ouvertures : OK');
});
