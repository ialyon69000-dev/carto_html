const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const source = html.slice(html.indexOf('      function buildColorHelpHtml('), html.indexOf('      function buildBorderButtonsHtml('));
const ctx = { escapeHtml: text => text };
vm.createContext(ctx);
vm.runInContext(source, ctx);
for (const [color, text] of Object.entries({
  rouge: 'Problème avec le commerçant', orange: 'Manque régulier de matériel',
  jaune: 'Tout n’est pas disponible', vert: 'Aucun souci'
})) {
  const help = ctx.buildColorHelpHtml(color);
  assert.ok(help.includes(text));
  assert.ok(help.includes('<summary aria-label='));
  assert.ok(help.includes('event.stopPropagation()'), 'La légende ne doit pas déclencher le choix de couleur');
  assert.ok(!help.includes(' open'), 'La légende est repliée au départ');
}
assert.equal(ctx.buildColorHelpHtml('bleu'), '');
console.log('Légendes des couleurs : OK');
