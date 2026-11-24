// Test sans dépendance : node tests/fiche-popup.test.cjs
// Vérifie que la fiche affichée au clic sur un point présente TOUJOURS les zones
// « Date / Matériel acheté / Acheteur » et « Commentaires », avec le texte
// associé quand il existe (et une mention explicite quand il est vide).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');

// --- Récupération du générateur de fiche + de ses dépendances ---
const start = html.indexOf('      function escapeHtml(str) {');
const end = html.indexOf('      function refreshOpenMarkerModalAfterPurchase(', start);
// Les générateurs de boutons/pastilles sont neutralisés : seul le contenu de la
// fiche compte ici, pas les interactions (testées ailleurs).
assert.ok(start > 0 && end > start, 'buildPopupHtml introuvable');

const context = {
  console,
  CATEGORIES: [{ id: 'tabac', label: 'Tabac / Presse', icon: '🚬', bg: '#fff', color: '#000', svg: '' }],
  BORDER_COLORS: [{ id: 'vert', label: 'Achat libre', dot: '🟢', color: '#16a34a', bg: '#dcfce7', text: '#15803d', aliases: [] }],
  DEFAULT_BORDER_COLOR: 'bleu',
  PURCHASE_BORDER_COLOR: 'jaune',
  getCategoryById: () => context.CATEGORIES[0],
  getBorderColorById: () => context.BORDER_COLORS[0],
  normalizeMarkerColorState: (m) => m,
  buildBorderButtonsHtml: () => '',
  isPurchaseActive: () => false,
  buildPurchaseBarHtml: () => '',
  window: { __cartoOriginalHtml: '' }
};
vm.createContext(context);
let source = html.slice(start, end);
source = source
  .replace(/      function buildBorderButtonsHtml\([\s\S]*?\n      }\n/, '      function buildBorderButtonsHtml() { return ""; }\n')
  .replace(/      function buildPurchaseBarHtml\([\s\S]*?\n      }\n/, '      function buildPurchaseBarHtml() { return ""; }\n');
vm.runInContext(source + '\n;this.buildPopupHtml = buildPopupHtml;', context);

const render = (marker) => context.buildPopupHtml({
  id: 'x',
  title: 'Point test',
  category: 'tabac',
  borderColor: 'vert',
  address: 'Rue test',
  lat: 45.75,
  lng: 4.84,
  description: '',
  comments: '',
  ...marker
});

// --- Avec du texte : libellés + valeurs ---
const filled = render({
  description: '12/11/2026 – 2 cartes SIM – Acheteur : J.',
  comments: 'Refus de vente le soir.'
});
assert.match(filled, /Date \/ Matériel acheté \/ Acheteur/);
assert.match(filled, /12\/11\/2026 – 2 cartes SIM – Acheteur : J\./);
assert.match(filled, /Commentaires/);
assert.match(filled, /Refus de vente le soir\./);
assert.doesNotMatch(filled, /class="popup-field-value empty"/, 'un texte présent ne doit pas être marqué vide');

// --- Sans texte : les deux zones restent affichées ---
const empty = render({});
assert.match(empty, /Date \/ Matériel acheté \/ Acheteur/, 'la zone Date/Matériel doit rester affichée');
assert.match(empty, /Commentaires/, 'la zone Commentaires doit rester affichée');
assert.equal((empty.match(/Non renseigné/g) || []).length, 2, 'les deux zones vides sont signalées');

// --- Uniquement l'une des deux ---
const onlyDesc = render({ description: '21/10/2026 RAS' });
assert.match(onlyDesc, /21\/10\/2026 RAS/);
assert.match(onlyDesc, /Commentaires/);
assert.equal((onlyDesc.match(/Non renseigné/g) || []).length, 1);

// --- Le contenu est échappé (pas d'injection HTML) ---
const evil = render({ description: '<img src=x onerror=alert(1)>' });
assert.doesNotMatch(evil, /<img src=x/, 'le texte doit être échappé');
assert.match(evil, /&lt;img src=x/);

// --- Multiligne conservé ---
const multi = render({ description: 'ligne 1\nligne 2' });
assert.match(multi, /ligne 1\nligne 2/);

// --- La fiche latérale utilise le même principe ---
assert.match(html, /function buildCardFieldHtml\(label, value\)/);
assert.match(html, /buildCardFieldHtml\("Date \/ Matériel acheté \/ Acheteur", m\.description\)/);
assert.match(html, /buildCardFieldHtml\("Commentaires", m\.comments\)/);
assert.doesNotMatch(html, /m\.description \? `<div class="marker-card-desc">/, 'les zones ne doivent plus être masquées quand elles sont vides');

// --- Les données du fichier sont intactes ---
const jsonStart = html.indexOf('<!-- CARTO_GUILLOTIERE_DATA_START');
const jsonEnd = html.indexOf('CARTO_GUILLOTIERE_DATA_END -->');
const data = JSON.parse(html.slice(html.indexOf('\n', jsonStart) + 1, jsonEnd).trim());
assert.equal(data.length, 190, '190 marqueurs attendus');
assert.ok(data.some((m) => (m.description || '').trim()), 'au moins un marqueur doit conserver son texte');

console.log('Fiche au clic (Date / Matériel / Acheteur + Commentaires) : OK');
