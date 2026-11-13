/**
 * Source-scoped UI adapter for two Dark Heresy 2E [Apex Edition] sheet dialogs.
 *
 * Uses the synchronous renderApplicationV2 hook. It only accepts a real DialogV2
 * under the target system and Russian locale, then verifies the whole known
 * title/field/label signature before writing. It does not intercept prompt(),
 * alter Application options, read/write Documents, or serialize submitted forms.
 *
 * The sole attribute write pins the existing implicit values of the three
 * audited severity options. Their submitted English enums remain unchanged.
 */
import runtimeLiterals from './runtime-literals.mjs';

export const DIALOG_UI_SYSTEM_ID = "dark-heresy-2e-apex";
export const DIALOG_UI_MODULE_ID = "dark-heresy-2e-apex-ru";

const SCHEMA_ID = "sheet-dialogs";
const SEVERITIES = Object.freeze(["Minor", "Severe", "Acute"]);
const GAIN_SOURCE = Object.freeze({ title: "Gain Corruption", points: "Corruption Points", apply: "Apply" });
const installations = new WeakMap();
const RECEIPT_SOURCE = Object.freeze({
  title: 'Unfinished item use',
  content: "The previous use is unfinished. Make sure the player who started it has stopped, check the target's state, and choose the outcome. Effects are not applied again.",
  consumed: 'Effect applied: consume the item',
  cancelled: 'No effect: release the item',
  close: 'Keep for review'
});
const normalize = value => typeof value === "string" ? value.trim() : "";

function validEntry(entry, source) {
  return entry?.en === source && typeof entry.ru === "string" && entry.ru.trim().length > 0;
}

function validDictionary(dictionary) {
  return dictionary?._meta?.schemaVersion === 1
    && dictionary?._meta?.systemId === DIALOG_UI_SYSTEM_ID
    && dictionary?._meta?.adapterId === SCHEMA_ID
    && validEntry(dictionary.gainCorruption?.title, GAIN_SOURCE.title)
    && validEntry(dictionary.gainCorruption?.points, GAIN_SOURCE.points)
    && validEntry(dictionary.gainCorruption?.apply, GAIN_SOURCE.apply)
    && validEntry(dictionary.disorder?.titlePrefix, "Disorder")
    && validEntry(dictionary.disorder?.severityLabel, "Severity")
    && SEVERITIES.every(value => validEntry(dictionary.disorder?.severity?.[value], value))
    && ["title", "content", "consumed", "cancelled", "close"].every(key =>
      validEntry(dictionary.inventoryReceipt?.[key], RECEIPT_SOURCE[key]));
}

export function isDialogUiAdapterActive(game = globalThis.game) {
  return game?.system?.id === DIALOG_UI_SYSTEM_ID && game?.i18n?.lang === "ru";
}

function translated(entry, game) {
  if (entry.key && typeof game?.i18n?.localize === "function") {
    const value = game.i18n.localize(entry.key);
    if (typeof value === "string" && value && value !== entry.key && value !== entry.en) return value;
  }
  return entry.ru;
}

function allowedText(entry, game) {
  return new Set([entry.en, entry.ru, translated(entry, game)]);
}

/** Only one nonempty direct text node; child icons may exist but contain no text. */
function directText(element) {
  if (!element || element.nodeType !== 1) return null;
  const nodes = [...element.childNodes].filter(node => node.nodeType === 3 && normalize(node.nodeValue));
  if (nodes.length !== 1) return null;
  const node = nodes[0];
  const text = normalize(node.nodeValue);
  if (normalize(element.textContent) !== text) return null;
  return { element, node, text };
}

/** Field labels contain a control; only the static text immediately around it is read. */
function fieldLabel(field) {
  const element = field?.parentElement;
  if (element?.tagName !== "LABEL" || element.children.length !== 1 || element.firstElementChild !== field) return null;
  const nodes = [...element.childNodes].filter(node => node.nodeType === 3 && normalize(node.nodeValue));
  return nodes.length === 1 ? { element, node: nodes[0], text: normalize(nodes[0].nodeValue) } : null;
}

function writeText(record, text, counters) {
  if (!record || record.text === text) return;
  const source = record.node.nodeValue;
  const start = source.indexOf(record.text);
  record.node.nodeValue = source.slice(0, start) + text + source.slice(start + record.text.length);
  counters.translatedText++;
}

function surface(application, element, DialogV2) {
  if (typeof DialogV2 !== "function" || !(application instanceof DialogV2)) return null;
  const root = element?.nodeType ? element : (element?.[0] ?? element);
  if (root?.nodeType !== 1 || typeof root.querySelectorAll !== "function") return null;
  const forms = [...root.querySelectorAll("form")];
  if (root.matches?.("form")) forms.unshift(root);
  if (forms.length !== 1) return null;
  const form = forms[0];
  // These source-authored prompts have no editor or rich user content surface.
  if (form.querySelector("textarea,prose-mirror,[contenteditable],.editor,.ProseMirror")) return null;
  const titles = [...root.querySelectorAll(".window-header > .window-title")];
  if (titles.length !== 1) return null;
  const title = directText(titles[0]);
  if (!title) return null;
  const sourceTitle = normalize(application.options?.window?.title ?? application.title);
  if (!sourceTitle) return null;
  return { root, form, title, sourceTitle, fields: [...form.querySelectorAll("input,select,textarea")] };
}

function matchGainCorruption(view, dictionary, game) {
  if (view.sourceTitle !== GAIN_SOURCE.title) return null;
  const labels = dictionary.gainCorruption;
  if (!allowedText(labels.title, game).has(view.title.text)) return null;
  if (view.fields.length !== 1) return null;
  const input = view.fields[0];
  if (input.tagName !== "INPUT" || input.getAttribute("name") !== "amount"
      || input.getAttribute("type") !== "number" || input.getAttribute("min") !== "1"
      || input.getAttribute("step") !== "1" || input.hasAttribute("max")
      || input.hasAttribute("disabled") || input.hasAttribute("readonly")) return null;
  const group = input.parentElement;
  if (!group?.matches("div.form-group") || group.children.length !== 2
      || group.lastElementChild !== input || group.firstElementChild.tagName !== "LABEL") return null;
  const points = directText(group.firstElementChild);
  if (!points || !allowedText(labels.points, game).has(points.text)) return null;
  const buttons = [...view.form.querySelectorAll("button[data-action]")];
  if (buttons.length !== 1 || buttons[0].getAttribute("data-action") !== "ok"
      || buttons[0].hasAttribute("name")) return null;
  const apply = directText(buttons[0]);
  if (!apply || !allowedText(labels.apply, game).has(apply.text)) return null;
  return { title: view.title, points, apply };
}

function matchDisorder(view, dictionary, game) {
  // The suffix is an actor's name, so this title is inspected but never rewritten.
  if (view.sourceTitle !== view.title.text) return null;
  const prefixes = allowedText(dictionary.disorder.titlePrefix, game);
  if (![...prefixes].some(prefix => view.sourceTitle.startsWith(`${prefix}: `)
      && view.sourceTitle.slice(prefix.length + 2).trim().length > 0)) return null;
  if (view.fields.length !== 2) return null;
  const names = view.fields.filter(field => field.tagName === "INPUT" && field.getAttribute("name") === "name"
    && field.getAttribute("type") === "text");
  const severities = view.fields.filter(field => field.tagName === "SELECT" && field.getAttribute("name") === "severity");
  if (names.length !== 1 || severities.length !== 1) return null;
  const name = names[0], select = severities[0];
  if (name.hasAttribute("disabled") || name.hasAttribute("readonly") || select.hasAttribute("disabled")
      || select.hasAttribute("multiple")) return null;
  const listId = name.getAttribute("list");
  if (!/^dh2e-disorders-[A-Za-z0-9_-]+$/.test(listId ?? "")) return null;
  const lists = [...view.form.querySelectorAll("datalist")];
  if (lists.length !== 1 || lists[0].id !== listId) return null;
  const nameLabel = fieldLabel(name), severityLabel = fieldLabel(select);
  if (!nameLabel || !severityLabel || !prefixes.has(nameLabel.text)
      || !allowedText(dictionary.disorder.severityLabel, game).has(severityLabel.text)) return null;
  const options = [...select.children];
  if (options.length !== SEVERITIES.length) return null;
  const plan = [];
  for (let index = 0; index < SEVERITIES.length; index++) {
    const option = options[index], value = SEVERITIES[index];
    if (option.tagName !== "OPTION" || option.children.length || option.hasAttribute("disabled")
        || option.hasAttribute("label")) return null;
    const record = directText(option);
    if (!record) return null;
    const explicit = option.hasAttribute("value");
    if (explicit && option.getAttribute("value") !== value) return null;
    // An already-translated label is accepted only with its original explicit enum.
    // An unknown implicit label is never interpreted, even if it resembles a translation.
    const entry = dictionary.disorder.severity[value];
    if (record.text !== value && !(explicit && allowedText(entry, game).has(record.text))) return null;
    plan.push({ option, record, value, explicit, text: translated(entry, game) });
  }
  // Chromium/Foundry datalist keeps the source name in option.value. Setting
  // only the presentation label exposes the Cyrillic suggestion without
  // changing the saved choice, its English source key or the form value.
  const suggestions = [];
  for (const option of [...lists[0].querySelectorAll('option')]) {
    if (option.tagName !== 'OPTION' || option.children.length || !option.hasAttribute('value')) continue;
    const value = option.getAttribute('value');
    const fragments = value.split(': ');
    if (fragments.length < 1 || fragments.length > 2) continue;
    const parts = fragments.map(part => runtimeLiterals?.labels?.[part]);
    if (parts.some(part => !part)) continue;
    const label = parts.join(': ');
    if (option.hasAttribute('label') && option.getAttribute('label') !== label) continue;
    suggestions.push({option, label});
  }
  return { severities: plan, suggestions };
}

/** Only the source-authored inventory receipt recovery dialog (not user dialogs). */
function matchInventoryReceipt(view, dictionary, game) {
  if (view.sourceTitle !== RECEIPT_SOURCE.title || view.fields.length !== 0) return null;
  if (!allowedText(dictionary.inventoryReceipt.title, game).has(view.title.text)) return null;
  const paragraphs = [...view.form.querySelectorAll('p')];
  if (paragraphs.length !== 1) return null;
  const content = directText(paragraphs[0]);
  if (!content || !allowedText(dictionary.inventoryReceipt.content, game).has(content.text)) return null;
  const buttons = [...view.form.querySelectorAll('button[data-action]')];
  if (buttons.length !== 3) return null;
  const records = {title: view.title, content};
  for (const action of ['consumed', 'cancelled', 'close']) {
    const match = buttons.filter(button => button.getAttribute('data-action') === action);
    if (match.length !== 1 || match[0].hasAttribute('name')) return null;
    const label = directText(match[0]);
    if (!label || !allowedText(dictionary.inventoryReceipt[action], game).has(label.text)) return null;
    records[action] = label;
  }
  return records;
}

/** Apply to a rendered DialogV2. This function and every hook callback are synchronous. */
export function applyDialogUiTranslations(application, element, {
  dictionary,
  game = globalThis.game,
  DialogV2 = globalThis.foundry?.applications?.api?.DialogV2
} = {}) {
  const counters = { active: false, matched: null, translatedText: 0, pinnedOptionValues: 0 };
  if (!isDialogUiAdapterActive(game) || !validDictionary(dictionary)) return counters;
  const view = surface(application, element, DialogV2);
  if (!view) return counters;
  counters.active = true;
  const corruption = matchGainCorruption(view, dictionary, game);
  if (corruption) {
    counters.matched = "gainCorruption";
    for (const key of ["title", "points", "apply"]) writeText(corruption[key], translated(dictionary.gainCorruption[key], game), counters);
    return counters;
  }
  const inventoryReceipt = matchInventoryReceipt(view, dictionary, game);
  if (inventoryReceipt) {
    counters.matched = 'inventoryReceipt';
    for (const key of ['title','content','consumed','cancelled','close'])
      writeText(inventoryReceipt[key], translated(dictionary.inventoryReceipt[key], game), counters);
    return counters;
  }
  const disorder = matchDisorder(view, dictionary, game);
  if (!disorder) return counters;
  counters.matched = "disorder";
  // Validate the full three-option set before any attribute or label is touched.
  for (const entry of disorder.severities) {
    if (!entry.explicit) {
      entry.option.setAttribute("value", entry.value);
      counters.pinnedOptionValues++;
    }
  }
  for (const entry of disorder.severities) writeText(entry.record, entry.text, counters);
  for (const {option, label} of disorder.suggestions) {
    if (option.getAttribute('label') === label) continue;
    option.setAttribute('label', label);
    counters.translatedText++;
  }
  return counters;
}

/**
 * Connect from the module using a statically imported dictionary:
 *   registerDialogUiAdapter({dictionary});
 * The optional Hooks/game/DialogV2 parameters are injectable for isolated QA.
 */
export function registerDialogUiAdapter({
  dictionary,
  Hooks = globalThis.Hooks,
  game = () => globalThis.game,
  DialogV2
} = {}) {
  if (!validDictionary(dictionary)) throw new Error(`${DIALOG_UI_MODULE_ID}: preload a valid dialog UI dictionary before registration`);
  if (!Hooks || typeof Hooks.on !== "function" || typeof Hooks.off !== "function") {
    throw new Error(`${DIALOG_UI_MODULE_ID}: Foundry Hooks are unavailable`);
  }
  if (installations.has(Hooks)) return installations.get(Hooks);
  const currentGame = () => typeof game === "function" ? game() : game;
  const apply = (application, element) => applyDialogUiTranslations(application, element, {
    dictionary, game: currentGame(), DialogV2: DialogV2 ?? globalThis.foundry?.applications?.api?.DialogV2
  });
  let warned = false, disposed = false;
  const hookId = Hooks.on("renderApplicationV2", (application, element) => {
    try { apply(application, element); }
    catch (error) {
      if (!warned) console.warn(`${DIALOG_UI_MODULE_ID}: dialog UI adapter skipped a render`, error);
      warned = true;
    }
  });
  const adapter = Object.freeze({
    hookId, apply,
    dispose() {
      if (disposed) return;
      disposed = true;
      Hooks.off("renderApplicationV2", hookId);
      if (installations.get(Hooks) === adapter) installations.delete(Hooks);
    }
  });
  installations.set(Hooks, adapter);
  return adapter;
}
