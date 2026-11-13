/**
 * v0.22 — display-only compatibility layer for literal English labels in
 * Dark Heresy 2E [Apex Edition] 0.1.10 settings, item and effect editors.
 *
 * Never modifies actor/item data, system keys, form control values, data-*
 * attributes, option values, rolls, macros, or content editors. The main
 * dictionary is source-exact and limited to first-party system applications.
 */
import catalog from './hardcoded-ui-data-v022.mjs';

const SYSTEM = 'dark-heresy-2e-apex';
const REGISTRATIONS = new WeakMap();
const SYSTEM_MARKERS = [
  '.dark-heresy-2e-apex', '.dh2e-item-sheet', '.dh2e-gear-sheet',
  '.apex-actor-sheet', '.dh2e-roll-dialog', '.dh2e-steps',
  '.dh2e-fate-menu', '[class*="dark-heresy-2e-apex-"]',
  '[class*="dh2e-"]', '[class*="apex-"]'
].join(',');
const SOURCE_APPS = /^(?:FalloutMaW|Dh2e|DarkHeresy)/u;
const SAFE_TEXT_SELECTORS = [
  'label', 'legend', 'summary', 'th', 'dt', 'button',
  '.apex-cap', '.dh2e-cap', '.dh2e-lbl', '.dh2e-block-hd',
  '.dh2e-veh-weapon .stats i', '.dh2e-veh-tiles .apex-sub',
  '.apex-rule-body em', '.dh2e-roll-m > span',
  '.dh2e-roll-guide-row > span', '.dh2e-steps .step-label',
  '.form-group > span', '.form-footer button',
  '.dh2e-card-label', '.dark-heresy-2e-apex-form-label',
  '.dialog-content .form-group label',
  // Selected first-party UI, not freeform actor notes or document names.
  '.dh2e-item-sheet .dh2e-profile span',
  '.dh2e-item-sheet .dh2e-field-label',
  '.dark-heresy-2e-apex-config-form .form-group span'
].join(',');
const NO_TOUCH = [
  '[contenteditable]:not([contenteditable="false"])', '.ProseMirror',
  '.editor', '.editor-content', '.tinymce', 'pre', 'code',
  'script', 'style', 'textarea',
  '.apex-notes', '.dh2e-notes', '.apex-note',
  '.apex-rule-name', '.apex-gear-name', '.apex-psy-name',
  '.item-name', '.actor-name', '.document-name', '.token-name',
  '[data-tab="notes"]', '[data-tab="description"]'
].join(',');
const ATTRIBUTE_NAMES = ['aria-label', 'title', 'data-tooltip', 'placeholder'];
const has = (object, name) => Object.prototype.hasOwnProperty.call(object ?? {}, name);
const nodeRoot = value => value?.nodeType ? value : value?.[0] ?? value;
const isRussianGame = game => game?.system?.id === SYSTEM && game?.i18n?.lang === 'ru';
const exact = input => typeof input === 'string' && has(catalog.labels, input) ? catalog.labels[input] : null;
const unsupported = element => Boolean(element?.closest?.(NO_TOUCH));

/** Source-exact, whitespace-preserving; zero normalization of user data. */
export function translateHardcodedLiteral(value) {
  if (typeof value !== 'string') return value;
  const original = value.trim();
  if (!original) return value;
  const localized = exact(original);
  if (typeof localized !== 'string' || localized === original) return value;
  const index = value.indexOf(original);
  return value.slice(0, index) + localized + value.slice(index + original.length);
}

function isSystemDialog(root) {
  // System's bare DialogV2 (unlike its sheet applications) has no DH2e class.
  // Require TWO fixed fields together; a generic user-created dialog cannot
  // qualify from a coincidental title alone.
  const title = root?.querySelector?.('.window-title')?.textContent?.trim();
  const amount = root?.querySelector?.('input[name="amount"][type="number"]');
  const label = root?.querySelector?.('.dialog-content .form-group label');
  return title === 'Gain Corruption' && Boolean(amount) && label?.textContent?.trim() === 'Corruption Points';
}
function sourceOwned(app, root) {
  if (!root?.querySelectorAll) return false;
  const dialog = isSystemDialog(root);
  if (dialog) return true;
  const name = String(app?.constructor?.name ?? '');
  if (name && SOURCE_APPS.test(name)) return true;
  try { return Boolean(root.matches?.(SYSTEM_MARKERS) || root.querySelector?.(SYSTEM_MARKERS)); }
  catch { return false; }
}
function safeText(element) {
  if (!element || element.nodeType !== 1 || unsupported(element)) return false;
  if (element.matches?.('option, input, textarea, select, datalist, .window-title')) return false;
  return true;
}
/** Two first-party template fragments concatenate text with a numeric value.
 *  Exact shapes only: do not translate arbitrary item or actor names.
 */
export function translateStockVehicleAndPageLabels(element, value) {
  if (typeof value !== 'string' || !element?.matches) return value;
  if (element.matches('.dh2e-veh-tiles .apex-sub')) {
    // Source: templates/actor/parts/apex-main-tab.hbs: Operate {{operate}}
    return value.replace(/^(\s*)Operate(?=\s+\d+\s*$)/u, '$1Управление');
  }
  if (element.matches('.apex-rule-body em')) {
    // Source: templates/actor/parts/identity-tab.hbs: (p. {{page}})
    return value.replace(/^(\s*)\(p\.\s*(\d+)\)(\s*)$/u, '$1(стр. $2)$3');
  }
  return value;
}
function translateDirectText(element, stats) {
  if (!safeText(element)) return;
  for (const node of element.childNodes ?? []) {
    if (node?.nodeType !== 3 || !node.nodeValue) continue;
    const after = translateHardcodedLiteral(translateStockVehicleAndPageLabels(element, node.nodeValue));
    if (after === node.nodeValue) continue;
    node.nodeValue = after;
    stats.text++;
  }
}
function translateAttributes(element, stats) {
  if (!element?.getAttribute || !element?.setAttribute || unsupported(element)) return;
  for (const name of ATTRIBUTE_NAMES) {
    const before = element.getAttribute(name);
    if (before === null || before === undefined) continue;
    const after = translateHardcodedLiteral(before);
    if (after === before) continue;
    element.setAttribute(name, after);
    stats.attributes++;
  }
}
function translateOptions(root, stats) {
  const options = root.querySelectorAll?.('select option') ?? [];
  for (const option of options) {
    if (unsupported(option) || !option.hasAttribute?.('value')) continue;
    // Tile cover labels need their own context and stock-value checks.
    if (option.closest?.('.dark-heresy-2e-apex-tile-special-property-row select[name$=".coverKey"], select[data-tile-cover-material]')) continue;
    // Option labels are never submitted if value="..." is explicit.
    if (option.children?.length || option.childNodes?.length !== 1 || option.firstChild?.nodeType !== 3) continue;
    const before = option.firstChild.nodeValue;
    const after = translateHardcodedLiteral(before);
    if (before === after) continue;
    option.firstChild.nodeValue = after;
    stats.options++;
  }
}
function translateCorruptionDialog(root, stats) {
  if (!isSystemDialog(root)) return;
  const title = root.querySelector('.window-title');
  const node = [...(title?.childNodes ?? [])].find(n => n.nodeType === 3 && n.nodeValue.trim() === 'Gain Corruption');
  if (node) { node.nodeValue = translateHardcodedLiteral(node.nodeValue); stats.text++; }
  for (const el of root.querySelectorAll('.dialog-content .form-group label, .dialog-buttons button, footer button')) {
    translateDirectText(el, stats);
  }
}

/**
 * May receive a real HTMLFormElement. Do NOT read form[0]: it is often the
 * first input (the v0.14.0 bug). Handles Foundry V14 partial renders.
 */
export function translateHardcodedSystemUI(app, element, { game = globalThis.game } = {}) {
  const stats = {active: false, text: 0, attributes: 0, options: 0};
  if (!isRussianGame(game)) return stats;
  const root = nodeRoot(element);
  if (!sourceOwned(app, root)) return stats;
  stats.active = true;
  translateCorruptionDialog(root, stats);
  const targets = root.querySelectorAll?.(SAFE_TEXT_SELECTORS) ?? [];
  for (const el of targets) translateDirectText(el, stats);
  if (root.matches?.(SAFE_TEXT_SELECTORS)) translateDirectText(root, stats);
  const all = root.querySelectorAll?.('*') ?? [];
  translateAttributes(root, stats);
  for (const el of all) translateAttributes(el, stats);
  translateOptions(root, stats);
  return stats;
}

export function registerHardcodedUiAdapterV022({
  Hooks = globalThis.Hooks,
  game = () => globalThis.game,
  document = globalThis.document,
  MutationObserver = globalThis.MutationObserver
} = {}) {
  if (!Hooks?.on || !Hooks?.off) return null;
  if (REGISTRATIONS.has(Hooks)) return REGISTRATIONS.get(Hooks);
  const currentGame = () => typeof game === 'function' ? game() : game;
  let warningIssued = false;
  const safeApply = (app, root) => {
    try { return translateHardcodedSystemUI(app, root, {game: currentGame()}); }
    catch (error) {
      if (!warningIssued) { console.warn('[DH2e RU v0.22] Auxiliary UI translation skipped', error); warningIssued = true; }
      return {active: false, text: 0, attributes: 0, options: 0};
    }
  };
  const hook = Hooks.on('renderApplicationV2', safeApply);
  let observer = null;
  let disposed = false;
  const observeLatePanels = () => {
    if (disposed || observer || !isRussianGame(currentGame()) || !document?.body || typeof MutationObserver !== 'function') return;
    observer = new MutationObserver(records => {
      const roots = new Set();
      for (const record of records) for (const added of record.addedNodes ?? []) {
        if (added?.nodeType !== 1) continue;
        const host = added.closest?.('.application') ?? added;
        // Observe child insertions, not text/attribute changes: our own
        // translations cannot retrigger the observer. Coalesce per app.
        if (!host?.matches?.(SYSTEM_MARKERS) && !host?.querySelector?.(SYSTEM_MARKERS) && !isSystemDialog(host)) continue;
        roots.add(host);
      }
      for (const root of roots) safeApply(null, root);
    });
    observer.observe(document.body, {childList: true, subtree: true});
  };
  if (isRussianGame(currentGame())) observeLatePanels();
  const readyHook = Hooks.on('ready', observeLatePanels);
  const registration = Object.freeze({hook, readyHook, dispose() {
    if (disposed) return;
    disposed = true;
    Hooks.off('renderApplicationV2', hook);
    Hooks.off('ready', readyHook);
    observer?.disconnect();
    REGISTRATIONS.delete(Hooks);
  }});
  REGISTRATIONS.set(Hooks, registration);
  return registration;
}
