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

// --- Achat : carence de 3 semaines puis retour automatique ---
const achat = context.normalizePurchase({ reason: 'achat', durationWeeks: 3, startedAt: NOW, expiresAt: NOW + 3 * WEEK_MS, previousBorderColor: 'vert' }, 'bleu');
assert.equal(achat.reason, 'achat');
assert.equal(achat.durationWeeks, 3);
assert.equal(achat.expiresAt, NOW + 3 * WEEK_MS);
assert.equal(context.isPurchaseActive(achat, NOW), true);
assert.equal(context.isPurchaseExpired(achat, NOW + 3 * WEEK_MS + 1), true);
const yellowWhileActive = context.normalizeMarkerColorState({ id: 'a', borderColor: 'jaune', purchase: achat });
assert.equal(yellowWhileActive.borderColor, 'jaune');
const restored = context.normalizeMarkerColorState({ id: 'a', borderColor: 'jaune', purchase: achat });
assert.equal(restored.borderColor, 'jaune'); // encore actif : reste jaune
const expiredAchat = context.normalizePurchase({ reason: 'achat', durationWeeks: 3, startedAt: NOW - 4 * WEEK_MS, expiresAt: NOW - WEEK_MS, previousBorderColor: 'rouge' }, 'jaune');
const afterExpiry = context.normalizeMarkerColorState({ id: 'a', borderColor: 'jaune', purchase: expiredAchat });
assert.equal(afterExpiry.borderColor, 'rouge', 'À l’échéance, la couleur d’origine est restaurée');

// expirePurchase : jaune restauré vers la couleur d'origine, achat conservé
const marker = { id: 'b', borderColor: 'jaune', purchase: context.normalizePurchase({ reason: 'achat', durationWeeks: 3, startedAt: NOW - 4 * WEEK_MS, expiresAt: NOW - WEEK_MS, previousBorderColor: 'orange' }, 'jaune') };
assert.equal(context.expirePurchase(marker), true);
assert.equal(marker.borderColor, 'orange');
assert.ok(marker.purchase.expiredAt, 'la date de fin de carence est mémorisée');
assert.equal(context.expirePurchase(marker), false, 'déjà expiré : pas de double bascule');

// --- Manque de matériel : aucune durée de carence (jamais expiré) ---
const manque = context.normalizePurchase({ reason: 'manque-materiel', startedAt: NOW, previousBorderColor: 'bleu' }, 'bleu');
assert.equal(manque.reason, 'manque-materiel');
assert.equal(manque.durationWeeks, null);
assert.equal(manque.expiresAt, null);
assert.equal(context.isPurchaseExpired(manque, NOW), false);
assert.equal(context.isPurchaseExpired(manque, NOW + 400 * WEEK_MS), false, 'sans carence, jamais expiré');
const manqueMarker = context.normalizeMarkerColorState({ id: 'c', borderColor: 'bleu', purchase: manque });
assert.equal(manqueMarker.borderColor, 'jaune');
assert.equal(context.expirePurchase(manqueMarker), false, 'aucune carence : pas d’expiration automatique');
assert.equal(context.getRemainingPurchaseLabel(manque.expiresAt, NOW), 'aucune durée de carence');

// --- Couleur forcée pendant une restriction active ---
const forced = context.normalizePurchase({ reason: 'achat', durationWeeks: 3, startedAt: NOW, expiresAt: NOW + 2 * WEEK_MS, forcedColor: 'vert', previousBorderColor: 'bleu' }, 'jaune');
const forcedMarker = context.normalizeMarkerColorState({ id: 'd', borderColor: 'jaune', purchase: forced });
assert.equal(forcedMarker.borderColor, 'vert', 'une couleur forcée prime pendant la carence');

// --- Rétro-compatibilité du format d'export ---
const legacy1 = context.normalizePurchase({ quantity: '1', startedAt: NOW }, 'jaune');
assert.equal(legacy1.reason, 'achat');
assert.equal(legacy1.durationWeeks, 1, 'legacy 1 objet conserve sa durée d’origine');
const legacy25 = context.normalizePurchase({ quantity: '2-5', startedAt: NOW }, 'jaune');
assert.equal(legacy25.durationWeeks, 3);
const legacy6 = context.normalizePurchase({ quantity: '6-plus', startedAt: NOW }, 'jaune');
assert.equal(legacy6.durationWeeks, 6);
const legacyUnspecified = context.normalizePurchase({ quantity: 'unspecified', startedAt: NOW }, 'jaune');
assert.equal(legacyUnspecified.durationWeeks, 3, 'sans précision, la carence est de 3 semaines');

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
