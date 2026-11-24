// Test sans dépendance : node tests/achat-restreint.test.cjs
// Vérifie la logique « 🟡 Achat Restreint » : raison « Achat » (carence 3 semaines)
// ou « Manque de matériel » (aucune durée de carence), rétro-compatibilité du format.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');

const constStart = html.indexOf('      const BORDER_COLORS = [');
const constEnd = html.indexOf('      const CATEGORIES = [');
const fnStart = html.indexOf('      function getBorderColorById(');
const fnEnd = html.indexOf('      function parsePurchaseDetails(');
assert.ok(constStart > 0 && constEnd > constStart, 'Constantes introuvables');
assert.ok(fnStart > 0 && fnEnd > fnStart, 'Fonctions introuvables');

const context = { console, Date, Number, Math, JSON, String, Boolean, Array, Object };
vm.createContext(context);
vm.runInContext(html.slice(constStart, constEnd) + '\n' + html.slice(fnStart, fnEnd)
  + '\n;this.BORDER_COLORS = BORDER_COLORS; this.RESTRICTION_REASONS = RESTRICTION_REASONS; this.PURCHASE_RANGES = PURCHASE_RANGES;', context);

const NOW = Date.parse('2026-11-18T12:00:00Z');
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// --- Étiquettes obligatoires de la légende ---
const labelOf = (id) => context.BORDER_COLORS.find((b) => b.id === id).label;
assert.equal(labelOf('rouge'), 'Achat Interdit');
assert.equal(labelOf('orange'), 'Achat déconseillé');
assert.equal(labelOf('jaune'), 'Achat Restreint');
assert.equal(labelOf('vert'), 'Achat libre');
assert.equal(labelOf('bleu'), 'Non renseigné');

// --- getBorderColorById : anciens et nouveaux libellés ---
assert.equal(context.getBorderColorById('Achat Restreint').id, 'jaune');
assert.equal(context.getBorderColorById('achat restreint').id, 'jaune');
assert.equal(context.getBorderColorById('Achat Interdit').id, 'rouge');
assert.equal(context.getBorderColorById('achat déconseillé').id, 'orange');
assert.equal(context.getBorderColorById('Achat libre').id, 'vert');
assert.equal(context.getBorderColorById('Non renseigné').id, 'bleu');
assert.equal(context.getBorderColorById('bleu').id, 'bleu');

// --- Achat : une simple date de fin, aucun historique ---
const achat = context.normalizePurchase({ reason: 'achat', startedAt: NOW, expiresAt: NOW + 3 * WEEK_MS, previousBorderColor: 'vert' }, 'bleu');
assert.equal(achat.reason, 'achat');
assert.equal(achat.endedAt, NOW + 3 * WEEK_MS, 'la date de fin est conservée');
assert.equal(achat.previousBorderColor, 'vert');
assert.deepEqual(Object.keys(achat).sort(), ['endedAt', 'forcedColor', 'previousBorderColor', 'reason'],
  'aucun historique (recordedAt, expiredAt, quantity, durationWeeks…) n’est conservé');
assert.equal(context.isPurchaseActive(achat, NOW), true);
assert.equal(context.isPurchaseExpired(achat, NOW), false);
assert.equal(context.isPurchaseExpired(achat, NOW + 3 * WEEK_MS + 1), true);

const yellowWhileActive = context.normalizeMarkerColorState({ id: 'a', borderColor: 'jaune', purchase: achat });
assert.equal(yellowWhileActive.borderColor, 'jaune');
assert.equal(yellowWhileActive.purchase.endedAt, NOW + 3 * WEEK_MS);

// À l'échéance : retour à la couleur d'origine et oubli de la restriction
const expiredAchat = context.normalizePurchase({ reason: 'achat', startedAt: NOW - 4 * WEEK_MS, expiresAt: NOW - WEEK_MS, previousBorderColor: 'rouge' }, 'jaune');
assert.equal(expiredAchat, null, 'une restriction échue n’est plus conservée');
const afterExpiry = context.normalizeMarkerColorState({ id: 'a', borderColor: 'jaune', purchase: { reason: 'achat', endedAt: NOW - WEEK_MS, previousBorderColor: 'rouge' } });
assert.equal(afterExpiry.borderColor, 'rouge', 'À l’échéance, la couleur d’origine est restaurée');
assert.equal(afterExpiry.purchase, null, 'aucun historique après l’échéance');

// expirePurchase : retour silencieux à la couleur d'origine
const marker = { id: 'b', borderColor: 'jaune', purchase: { reason: 'achat', endedAt: NOW - WEEK_MS, previousBorderColor: 'orange' } };
assert.equal(context.expirePurchase(marker), true);
assert.equal(marker.borderColor, 'orange');
assert.equal(marker.purchase, null);
assert.equal(context.expirePurchase(marker), false, 'sans restriction : pas de double bascule');
assert.equal(context.expireDuePurchases([{ id: 'z', borderColor: 'jaune', purchase: { reason: 'achat', endedAt: NOW - 1, previousBorderColor: 'vert' } }]).length, 1);

// --- Manque de matériel : aucune date de fin (jamais expiré) ---
const manque = context.normalizePurchase({ reason: 'manque-materiel', startedAt: NOW, previousBorderColor: 'bleu' }, 'bleu');
assert.equal(manque.reason, 'manque-materiel');
assert.equal(manque.endedAt, null);
assert.equal(context.isPurchaseExpired(manque, NOW), false);
assert.equal(context.isPurchaseExpired(manque, NOW + 400 * WEEK_MS), false, 'sans date de fin, jamais échu');
const manqueMarker = context.normalizeMarkerColorState({ id: 'c', borderColor: 'bleu', purchase: manque });
assert.equal(manqueMarker.borderColor, 'jaune');
assert.equal(context.expirePurchase(manqueMarker), false, 'aucune date de fin : pas d’expiration automatique');

// --- Couleur forcée pendant une restriction active ---
const forced = context.normalizePurchase({ reason: 'achat', startedAt: NOW, expiresAt: NOW + 2 * WEEK_MS, forcedColor: 'vert', previousBorderColor: 'bleu' }, 'jaune');
const forcedMarker = context.normalizeMarkerColorState({ id: 'd', borderColor: 'jaune', purchase: forced });
assert.equal(forcedMarker.borderColor, 'vert', 'une couleur forcée prime pendant la restriction');

// --- Rétro-compatibilité : anciens enregistrements (expiresAt, quantity) ---
const legacy1 = context.normalizePurchase({ quantity: '1', startedAt: NOW, expiresAt: NOW + WEEK_MS }, 'jaune');
assert.equal(legacy1.reason, 'achat');
assert.equal(legacy1.endedAt, NOW + WEEK_MS, 'l’ancienne date de fin est reprise');
const legacyNoDate = context.normalizePurchase({ quantity: '2-5', startedAt: NOW }, 'jaune');
assert.equal(legacyNoDate.endedAt, NOW + 3 * WEEK_MS, 'sans date, la carence par défaut est de 3 semaines');
const jauneSansPurchase = context.normalizePurchase(null, 'jaune');
assert.equal(jauneSansPurchase.reason, 'achat');
assert.ok(jauneSansPurchase.endedAt > Date.now(), 'un jaune orphelin obtient une date de fin');
assert.equal(context.normalizePurchase(null, 'vert'), null, 'aucune restriction sur une autre couleur');

// --- buildPurchaseBarHtml : uniquement la date de fin, aucun historique ---
const barContext = {
  getRestrictionReasonById: context.getRestrictionReasonById,
  getBorderColorById: context.getBorderColorById,
  getSafeManualBorderColor: context.getSafeManualBorderColor,
  formatPurchaseDate: context.formatPurchaseDate,
  escapeHtml: (s) => String(s)
};
const barStart = html.indexOf('      function buildPurchaseBarHtml(');
const barEnd = html.indexOf('      function buildPopupHtml(', barStart);
assert.ok(barStart > 0 && barEnd > barStart, 'buildPurchaseBarHtml introuvable');
vm.createContext(barContext);
vm.runInContext(html.slice(barStart, barEnd), barContext);
const activeBar = barContext.buildPurchaseBarHtml({ id: 'x', title: 'Test', purchase: { reason: 'achat', endedAt: Date.parse('2026-12-09T10:30:00Z'), forcedColor: null } }, 'sidebar');
assert.match(activeBar, /Date de fin/);
assert.match(activeBar, /09\/12\/2026/);
assert.doesNotMatch(activeBar, /enregistré le|période terminée|Restriction terminée|conservé|historique/i);
const manqueBar = barContext.buildPurchaseBarHtml({ id: 'x', title: 'Test', purchase: { reason: 'manque-materiel', endedAt: null } }, 'sidebar');
assert.match(manqueBar, /Sans date de fin/);
assert.doesNotMatch(manqueBar, /historique/i);

// --- Le jaune s'applique dès l'achat et la couleur d'origine revient à la fin ---
const applied = { borderColor: 'vert', purchase: null };
const view = context.normalizeMarkerColorState({
  borderColor: 'vert',
  purchase: { reason: 'achat', endedAt: NOW + 3 * WEEK_MS, previousBorderColor: 'vert', forcedColor: null }
});
assert.equal(view.borderColor, 'jaune', 'un achat en cours force le pourtour jaune');
const ended = { borderColor: 'jaune', purchase: { reason: 'achat', endedAt: NOW - 1000, previousBorderColor: 'vert', forcedColor: null } };
context.normalizeMarkerColorState(ended);
assert.equal(ended.borderColor, 'vert', 'à la fin de la période, la couleur d’origine revient');
assert.equal(ended.purchase, null, 'la restriction est oubliée à la fin de la période');

// Une couleur choisie pendant la restriction ne doit jamais casser le jaune :
// la restriction prime, la couleur choisie est celle qui reviendra à la fin.
const withBase = context.normalizeMarkerColorState({
  borderColor: 'bleu',
  purchase: { reason: 'achat', endedAt: NOW + WEEK_MS, previousBorderColor: 'bleu', forcedColor: null }
});
assert.equal(withBase.borderColor, 'jaune', 'enregistrer une couleur pendant la restriction ne retire pas le jaune');

// --- L'interface ne doit plus réécrire la couleur par-dessus une restriction ---
// (régression : « Modifier la fiche » + Enregistrer remettait la couleur d'origine)
const formSubmit = html.slice(html.indexOf('document.getElementById("markerForm").addEventListener("submit"'), html.indexOf('document.getElementById("btnCloseModal")'));
assert.match(formSubmit, /if \(existing\.purchase\)/, 'la validation de fiche doit traiter le cas d’une restriction en cours');
assert.match(formSubmit, /existing\.purchase\.previousBorderColor = manualBorderColor/);
assert.match(formSubmit, /existing\.purchase\.forcedColor = null/);
assert.doesNotMatch(formSubmit, /existing\.borderColor = manualBorderColor;\s*\n\s*normalizeMarkerColorState\(existing\);/,
  'la couleur choisie ne doit pas écraser le jaune pendant une restriction');

// La pastille « Achat Restreint » de la fiche latérale applique le jaune tout de suite
assert.match(html, /const keepEditing = editingMarkerId;\s*\n\s*closeMarkerModal\(\);\s*\n\s*openPurchaseDialog\(keepEditing\);/,
  'depuis la modale d’édition, l’achat doit être enregistré (jaune immédiat)');

// --- Aucune trace d'historique dans l'interface ---
assert.doesNotMatch(html, /Supprimer l[’']historique/);
assert.doesNotMatch(html, /getRemainingPurchaseLabel|purchase-remaining|semaines restantes/);
assert.doesNotMatch(html, /enregistré le \$\{/);
assert.doesNotMatch(html, /data-purchase-expires/);

// --- Légende de la carte nettoyée + absence de légende dans le formulaire ---
assert.doesNotMatch(html, /form-hint/, 'La légende du formulaire et son style inutilisé doivent être retirés');
assert.doesNotMatch(html, /map-legend-dot/, 'La pastille redondante .map-legend-dot doit être retirée');
assert.doesNotMatch(html, /<div class="map-legend-row">\s*<\/span>/, 'Aucune balise </span> orpheline dans la légende');

const legendStart = html.indexOf('      const LEGEND_COLOR_IDS = [');
const legendEnd = html.indexOf('      const offlineVectorLayer =');
assert.ok(legendStart > 0 && legendEnd > legendStart, 'Bloc légende introuvable');
let toggleClick = null;
const toggleBtnMock = {
  attrs: { 'aria-expanded': 'true' },
  getAttribute(k) { return this.attrs[k]; },
  setAttribute(k, v) { this.attrs[k] = v; },
  addEventListener(type, fn) { if (type === 'click') toggleClick = fn; }
};
const bodyMock = { hidden: false };
const iconMock = { textContent: '▾' };
let renderedLegendHtml = '';
const legendContext = {
  getBorderColorById: context.getBorderColorById,
  escapeHtml: (s) => String(s),
  map: {},
  L: {
    control() {
      return {
        addTo() {
          this.onAdd();
          return this;
        }
      };
    },
    DomUtil: {
      create() {
        return {
          set innerHTML(val) { renderedLegendHtml = val; },
          get innerHTML() { return renderedLegendHtml; },
          querySelector(sel) {
            if (sel === '#mapLegendToggle') return toggleBtnMock;
            if (sel === '#mapLegendBody') return bodyMock;
            if (sel === '#mapLegendToggleIcon') return iconMock;
            return null;
          }
        };
      }
    },
    DomEvent: { disableClickPropagation() {}, disableScrollPropagation() {} }
  }
};
vm.createContext(legendContext);
vm.runInContext(html.slice(legendStart, legendEnd), legendContext);
assert.match(renderedLegendHtml, /🔴 Achat Interdit/);
assert.match(renderedLegendHtml, /🟠 Achat déconseillé/);
assert.match(renderedLegendHtml, /🟡 Achat Restreint/);
assert.match(renderedLegendHtml, /🟢 Achat libre/);
assert.equal(typeof toggleClick, 'function');
toggleClick();
assert.equal(bodyMock.hidden, true);
assert.equal(iconMock.textContent, '▸');
assert.equal(toggleBtnMock.getAttribute('aria-expanded'), 'false');
toggleClick();
assert.equal(bodyMock.hidden, false);
assert.equal(iconMock.textContent, '▾');
assert.equal(toggleBtnMock.getAttribute('aria-expanded'), 'true');

console.log('Achat restreint (Achat / Manque de matériel) : tests réussis.');
