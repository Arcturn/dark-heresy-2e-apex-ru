/** Bare DialogV2 pickers opened by the Actor sheet's talent/trait + buttons. */
import progression from './progression-data.mjs';
import rules from './actor-rules-data.mjs';

const SYSTEM = 'dark-heresy-2e-apex';
const REGISTRATIONS = new WeakMap();
const own = (object, key) => Object.prototype.hasOwnProperty.call(object ?? {}, key);
const active = game => game?.system?.id === SYSTEM && game?.i18n?.lang === 'ru';
const rootOf = element => element?.nodeType ? element : element?.[0] ?? element;
const current = value => typeof value === 'function' ? value() : value;
const entryFor = (kind, key) => {
  const catalog = kind === 'talent' ? progression.talents : kind === 'trait' ? rules.traits : null;
  return own(catalog, key) ? catalog[key] : null;
};
function replaceCore(text, before, after) {
  const start = text.indexOf(before);
  return text.slice(0, start) + after + text.slice(start + before.length);
}

/** Only canonical keys plus unchanged stock names qualify; homebrew names stay intact. */
export function translateRulePickerLabel(kind, key, text) {
  const entry = entryFor(kind, key);
  if (!entry || typeof text !== 'string') return text;
  const core = text.trim();
  if (core === entry.en) return replaceCore(text, core, entry.ru);
  const tier = kind === 'talent' && /^T([1-3])\s*·\s*(.+)$/u.exec(core);
  if (tier && tier[2] === entry.en) return replaceCore(text, core, `Ранг ${tier[1]} · ${entry.ru}`);
  return text;
}

export function translateRulePickerSpecialisation(value, text) {
  if (typeof value !== 'string' || typeof text !== 'string' || text.trim() !== value) return text;
  const translation = own(progression.specialisations, value) ? progression.specialisations[value]
    : own(progression.terms, value) ? progression.terms[value] : null;
  return typeof translation === 'string' ? replaceCore(text, value, translation) : text;
}

function isDialog(app, DialogV2) {
  return typeof DialogV2 === 'function' ? app instanceof DialogV2 : app?.constructor?.name === 'DialogV2';
}
function picker(root) {
  const select = root?.querySelector?.('select[name="key"]');
  if (!select) return null;
  if (root.querySelector('[data-talent-spec-pick] select[name="specPick"]')
    && root.querySelector('[data-talent-spec-own] input[name="specOwn"]')) return {kind: 'talent', select};
  const spec = root.querySelector('[data-trait-spec] input[name="spec"][list^="dh2e-trait-specs-"]');
  if (spec && root.querySelector('[data-trait-value] input[name="value"][type="number"]')
    && [...root.querySelectorAll('datalist')].some(list => list.id === spec.getAttribute('list')))
    return {kind: 'trait', select};
  return null;
}
function changeOption(option, translate) {
  // An explicit value prevents visible text from changing FormData's result.
  if (!option.hasAttribute?.('value') || option.children?.length) return 0;
  let changes = 0;
  for (const node of option.childNodes ?? []) {
    if (node.nodeType !== 3) continue;
    const after = translate(node.nodeValue);
    if (after !== node.nodeValue) {node.nodeValue = after; changes++;}
  }
  return changes;
}
function isStockTalentOption(option) {
  const entry = entryFor('talent', option?.getAttribute?.('value'));
  if (!entry) return false;
  const label = option.textContent.trim();
  if (label === entry.en || label === entry.ru) return true;
  const match = /^(?:T|Ранг )([1-3])\s*·\s*(.+)$/u.exec(label);
  return Boolean(match && [entry.en, entry.ru].includes(match[2]));
}

export function applyRulePickerTranslations(app, element, {
  game = globalThis.game, DialogV2 = globalThis.foundry?.applications?.api?.DialogV2
} = {}) {
  const result = {active: false, kind: null, translated: 0};
  const root = rootOf(element);
  if (!active(game) || !isDialog(app, DialogV2) || !root?.querySelectorAll) return result;
  const match = picker(root);
  if (!match) return result;
  result.active = true; result.kind = match.kind;
  for (const option of match.select.querySelectorAll('option[value]')) {
    if (match.kind === 'trait' && (!option.hasAttribute('data-value') || !option.hasAttribute('data-spec'))) continue;
    result.translated += changeOption(option, text => translateRulePickerLabel(match.kind, option.value, text));
  }
  if (match.kind === 'talent' && isStockTalentOption(match.select.selectedOptions?.[0])) {
    for (const option of root.querySelectorAll('[data-talent-spec-pick] select[name="specPick"] option[value]'))
      result.translated += changeOption(option, text => translateRulePickerSpecialisation(option.value, text));
  }
  return result;
}

/** Reapply after the source's change listener rebuilds specialisation options. */
export function registerRulePickerUiAdapter({
  Hooks = globalThis.Hooks, game = () => globalThis.game,
  DialogV2 = globalThis.foundry?.applications?.api?.DialogV2,
  MutationObserver = globalThis.MutationObserver
} = {}) {
  if (!Hooks?.on || !Hooks?.off) return null;
  if (REGISTRATIONS.has(Hooks)) return REGISTRATIONS.get(Hooks);
  const watched = new Map();
  let warned = false;
  function release(app) {
    const state = watched.get(app);
    if (!state) return;
    state.observer?.disconnect();
    state.root.removeEventListener('change', state.change, true);
    watched.delete(app);
  }
  function apply(app, root) {
    try {return applyRulePickerTranslations(app, root, {
      game: current(game), DialogV2: DialogV2 ?? globalThis.foundry?.applications?.api?.DialogV2
    });}
    catch (error) {
      if (!warned) console.warn('dh2e-ru: rule picker translation unavailable', error);
      warned = true;
      return {active: false};
    }
  }
  const renderHook = Hooks.on('renderApplicationV2', (app, element) => {
    const supplied = rootOf(element);
    const root = picker(supplied) ? supplied : rootOf(app?.element ?? supplied);
    if (!apply(app, root).active) {release(app); return;}
    if (watched.get(app)?.root === root) return;
    release(app);
    const state = {root, observer: null, change: null};
    // Capture also covers target listeners that stop propagation. The microtask
    // runs after the source has synchronously replaced its options.
    state.change = () => queueMicrotask(() => {if (watched.get(app) === state) apply(app, root);});
    root.addEventListener('change', state.change, true);
    if (typeof MutationObserver === 'function') {
      state.observer = new MutationObserver(() => {if (watched.get(app) === state) apply(app, root);});
      state.observer.observe(root, {childList: true, subtree: true});
    }
    watched.set(app, state);
  });
  const closeHook = Hooks.on('closeApplicationV2', release);
  const api = Object.freeze({dispose() {
    Hooks.off('renderApplicationV2', renderHook);
    Hooks.off('closeApplicationV2', closeHook);
    for (const app of [...watched.keys()]) release(app);
    REGISTRATIONS.delete(Hooks);
  }});
  REGISTRATIONS.set(Hooks, api);
  return api;
}
