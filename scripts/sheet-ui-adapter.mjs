/**
 * Russian UI adapter for Dark Heresy 2E [Apex Edition] V2.
 *
 * This adapter is deliberately limited to known Actor/Item sheet classes and
 * source-audited UI positions. It never walks arbitrary text, changes a
 * Document/render context or serializes a form. The only data-* write is the
 * display tooltip on a verified, fixed characteristic chip in the step editor;
 * all mechanical data attributes remain unchanged.
 * Load the dictionary once during init/setup, then register the synchronous
 * renderApplicationV2 hook before sheets can first render.
 */
export const SHEET_UI_SYSTEM_ID = "dark-heresy-2e-apex";
export const SHEET_UI_MODULE_ID = "dark-heresy-2e-apex-ru";

const ACTOR_CLASSES = new Set(["FalloutMaWActorSheet"]);
const ITEM_CLASSES = new Set([
  "FalloutMaWItemSheet", "Dh2eItemSheet", "Dh2eGearSheet", "FalloutMaWContainerSheet"
]);
const PROTECTED_CONTENT = [
  "prose-mirror", "textarea", "datalist", "pre", "code", "script", "style",
  '[contenteditable]:not([contenteditable="false"])',
  ".editor", ".editor-content", ".ProseMirror", ".tinymce",
  '[data-tab="notes"]', '[data-tab="description"]',
  ".dark-heresy-2e-apex-description-panel", ".dh2e-notes", ".apex-notes",
  ".apex-psy-fx", ".dh2e-code-rule", ".window-title",
  ".apex-psy-name", ".apex-gear-name", ".item-name", ".actor-name", ".document-name",
  'input[name="name"]', 'input[name$=".name"]'
].join(",");

/** A closed list: selectors only target UI positions verified in system sources. */
const TEXT_RULES = Object.freeze([
  ["actor", ".apex-chars > .apex-char > .apex-ab", "characteristicAbbreviations"],
  ["actor", ".apex-skills > .apex-skill > .apex-skill-char", "characteristicAbbreviations"],
  ["actor", ".apex-manual-unnatural > label > span", "characteristicAbbreviations"],
  ["actor", '.apex-manual-chip[data-field="weaponTraining"]', "weaponTrainingGroups"],
  ["actor", ".dh2e-veh-weapon > .stats > span > i", "weaponColumns"],
  ["actor", ".apex-psy-prof > div > span.apex-cap", "weaponColumns"],
  ["actor", ".dh2e-cargo-weight > b > small", "units"],
  ["actor", ".apex-encumbrance > .apex-block-hd > .apex-ctl", "units"],
  ["actor", ".dh2e-veh-tiles .apex-row > .apex-val > small", "units"],
  ["actor", ".apex-stats-tab .apex-row > .apex-cap > small", "units"],
  ["actor", ".apex-gear-profile > span", "units"],
  ["actor", ".apex-advances > .apex-block > .apex-block-hd > .apex-ctl", "units"],
  ["actor", ".apex-psy-power > summary > .apex-psy-act", "actions"],
  ["actor", ".apex-psy-sus > em", "actions"],
  ["actor", ".apex-soul-lists > div:first-child > .apex-list > li > em", "severity"],
  ["item", ".dh2e-rof-row > .dh2e-rof-cell > small", "rateOfFire"]
]);

const ARIA_RULES = Object.freeze([
  ["actor", ".apex-sheet-header > nav.apex-gm-bar"],
  ["actor", ".apex-stats-tab input.apex-value-input[aria-label]"],
  ["actor", ".apex-advances input.apex-value-input[aria-label]"],
  ["actor", '.apex-psy-pr > input.apex-psy-input[name="system.dh2e.psyRating"]'],
  ["actor", '.apex-psy-class-row > select[name="system.dh2e.psykerClass"]'],
  ["actor", '.apex-list > li > a[aria-label="Remove"]'],
  ["item", ".dh2e-step-head > a.dh2e-step-remove[aria-label]"]
]);

/** These selects contain enum labels; catalog/document pickers are never included. */
const OPTION_RULES = Object.freeze([
  ["item", "system.dh2e.reload", "reload"],
  ["item", "system.dh2e.severity", "severity"],
  ["item", "system.dh2e.discipline", "disciplines"],
  ["item", "system.dh2e.action", "actions"],
  ["item", "system.dh2e.sustained", "actions"],
  ["item", "system.dh2e.focus.resist", "focusResist"],
  ["item", "system.dh2e.location", "criticalLocations", "criticalEffect"]
]);

const installations = new WeakMap();
const own = (object, key) => Object.prototype.hasOwnProperty.call(object ?? {}, key);
const normalize = value => String(value ?? "").trim();

export function isSheetUiAdapterActive(game = globalThis.game) {
  return game?.system?.id === SHEET_UI_SYSTEM_ID && game?.i18n?.lang === "ru";
}

function sheetScope(application) {
  const document = application?.document ?? application?.actor ?? application?.item;
  if (!document || !["Actor", "Item"].includes(document.documentName)) return null;
  const expected = document.documentName === "Actor" ? ACTOR_CLASSES : ITEM_CLASSES;
  // Accept actual system classes and subclasses; a matching CSS class alone is
  // insufficient authority to translate another application's contents.
  for (let ctor = application?.constructor; typeof ctor === "function"; ctor = Object.getPrototypeOf(ctor)) {
    if (expected.has(ctor.name)) return document.documentName === "Actor" ? "actor" : "item";
    if (ctor === Function.prototype) break;
  }
  return null;
}

function protectedElement(element, allowControl = false) {
  if (!element || element.closest(PROTECTED_CONTENT)) return true;
  return !allowControl && Boolean(element.closest("input,select,option,button[name]"));
}

function query(root, selector) {
  const matches = [...root.querySelectorAll(selector)];
  if (root.matches?.(selector)) matches.unshift(root);
  return matches;
}

function localized(entry, game) {
  if (typeof entry === "string") return entry;
  if (!entry || typeof entry.ru !== "string") return null;
  if (entry.key && typeof game?.i18n?.localize === "function") {
    const value = game.i18n.localize(entry.key);
    if (typeof value === "string" && value && value !== entry.key) return value;
  }
  return entry.ru;
}

/** Keep whitespace and all child nodes/listeners; never assign element.innerHTML. */
function replaceDirectText(element, transform, counters, allowControl = false) {
  if (protectedElement(element, allowControl)) return;
  for (const node of element.childNodes) {
    if (node.nodeType !== 3) continue;
    const current = node.nodeValue ?? "";
    const core = current.trim();
    if (!core) continue;
    const replacement = transform(core);
    if (typeof replacement !== "string" || replacement === core) continue;
    const start = current.indexOf(core);
    node.nodeValue = current.slice(0, start) + replacement + current.slice(start + core.length);
    counters.translatedText++;
  }
}

function exactMap(map, game) {
  return text => own(map, text) ? localized(map[text], game) : null;
}

function translateOptions(select, map, counters, game, transform) {
  if (protectedElement(select, true)) return;
  // Read only the select's own options. Never use an option without an explicit
  // value: changing its text would otherwise change submitted form data.
  for (const option of [...select.options]) {
    if (!option.hasAttribute("value")) {
      counters.skippedOptions++;
      continue;
    }
    const value = option.getAttribute("value");
    const source = normalize(option.textContent);
    let replacement;
    if (transform) replacement = transform(source, value);
    else {
      if (!own(map, value)) continue;
      const entry = map[value];
      const expected = typeof entry === "object" && entry.en !== undefined ? entry.en : value;
      if (source !== expected) continue;
      replacement = localized(entry, game);
    }
    if (typeof replacement !== "string" || replacement === source) continue;
    // Native selectOptions output has one text node. Fail closed if a future
    // version introduces child markup, so no unexpected HTML is flattened.
    if (option.children.length || option.childNodes.length !== 1 || option.firstChild.nodeType !== 3) continue;
    replaceDirectText(option, () => replacement, counters, true);
    counters.translatedOptions++;
  }
}

/** Fixed CHARACTERISTICS from dh2e-critical-step-editor.mjs, never catalog rows. */
function translateCriticalCharacteristics(root, dictionary, counters, game) {
  const names = dictionary.characteristicNames;
  if (!names) return;
  for (const select of query(root, '.dh2e-steps select[data-step-field="characteristic"][data-step-type="text"]')) {
    translateOptions(select, names, counters, game);
  }
  for (const button of query(root, '.dh2e-steps button.dh2e-step-chip[data-step-chip-field="characteristics"][data-step-chip]')) {
    if (protectedElement(button)) continue;
    const key = button.getAttribute("data-step-chip");
    if (!own(names, key)) continue;
    const entry = names[key];
    const abbreviation = dictionary.characteristicAbbreviations?.[entry.short];
    if (abbreviation) replaceDirectText(button, text => text === entry.short ? abbreviation : null, counters);
    // Explicitly authorized display-only exception. Both the canonical key and
    // exact English label must match; no data-step-* attribute is ever written.
    const tooltip = button.getAttribute("data-tooltip");
    if (tooltip !== entry.en) continue;
    const replacement = localized(entry, game);
    if (replacement && replacement !== tooltip) {
      button.setAttribute("data-tooltip", replacement);
      counters.translatedAttributes++;
    }
  }
}

/**
 * Dark Heresy 2e creates every Lore / Linguistics / Navigate / Operate / Trade
 * specialisation from English literals rather than i18n keys. Translate only
 * the visible actor-sheet text and accessibility label, keyed by the exact
 * mechanical data-skill-key. Never modify a skill key, rank value or stored name.
 */
function translateActorSkillBoard(root, dictionary, counters, game) {
  if (!dictionary.coreSkillNames || !dictionary.specialistSkillNames || !dictionary.specialistGroups) return;

  const shortToFull = Object.create(null);
  for (const info of Object.values(dictionary.characteristicNames ?? {})) {
    if (info?.short && info?.ru) {
      const shown = dictionary.characteristicAbbreviations?.[info.short] ?? info.short;
      shortToFull[shown] = info.ru;
      shortToFull[info.en] = info.ru;
      if(info.short==='WS')shortToFull['Рукопашная']=info.ru;
      if(info.short==='BS')shortToFull['Стрельба']=info.ru;
    }
  }
  for (const chip of query(root, '.apex-chars > .apex-char[data-tooltip]')) {
    const ab = normalize(chip.querySelector(':scope > .apex-ab')?.textContent);
    const full = shortToFull[ab];
    if (!full || protectedElement(chip)) continue;
    const tooltip = chip.getAttribute('data-tooltip');
    // Only a characteristic prefix, optionally followed by aptitude markup.
    const prefix = tooltip?.split(' · ')[0];
    if (!prefix || prefix === full || ![ab, ...Object.keys(shortToFull).filter(k => shortToFull[k] === full)].includes(prefix)) continue;
    chip.setAttribute('data-tooltip', full + tooltip.slice(prefix.length));
    counters.translatedAttributes++;
  }

  for (const row of query(root, '.apex-skills > .apex-skill')) {
    const label = row.querySelector(':scope > a.apex-skill-name[data-skill-key]');
    if (!label) continue;
    const key = label.getAttribute('data-skill-key');
    const special = dictionary.specialistSkillNames[key];
    const entry = special ?? dictionary.coreSkillNames[key];
    if (!entry || protectedElement(label)) continue;
    replaceDirectText(label, text => text === entry.en ? entry.ru : null, counters);

    const rankSelector = row.querySelector(':scope > .apex-skill-ranks > select[aria-label]');
    if (!rankSelector || protectedElement(rankSelector, true)) continue;
    const current = rankSelector.getAttribute('aria-label');
    if (current === entry.en && entry.ru !== current) {
      rankSelector.setAttribute('aria-label', entry.ru);
      counters.translatedAttributes++;
    }
  }
  for (const group of query(root, '.apex-specialists > .apex-specialist-group[data-group-key]')) {
    const id = group.getAttribute('data-group-key');
    const entry = dictionary.specialistGroups[id];
    if (!entry) continue;
    const name = group.querySelector(':scope > summary > span');
    if (name) replaceDirectText(name, value => value === entry.en ? entry.ru : null, counters);
    const trained = group.querySelector(':scope > summary > em');
    if (trained) {
      const specMap = Object.create(null);
      for (const spec of Object.values(dictionary.specialistSkillNames)) {
        if (spec.group === id) specMap[spec.en] = spec.ru;
      }
      replaceDirectText(trained, value => {
        const labels = value.split(', ');
        if (!labels.every(label => specMap[label] || Object.values(specMap).includes(label))) return null;
        const next = labels.map(label => specMap[label] ?? label).join(', ');
        return next === value ? null : next;
      }, counters);
    }
  }
}

function translateStructuredUi(root, scope, dictionary, counters, game) {
  const words = dictionary.display;
  if (scope === "actor") {
    // Numeric values and formula aliases are never rewritten; these patterns
    // only recognize a small, complete UI grammar at audited display positions.
    const rules = [
      [".apex-gear-row > .apex-gear-wt", /^(\d+(?:[.,]\d+)?) kg$/, match => `${match[1]} ${dictionary.units.kg}`],
      [".apex-rule-row > summary > .apex-rule-tier", /^T([1-3])$/, match => `${words.tierShort} ${match[1]}`],
      [".apex-rule-body > p > em", /^\(p\. (\d+)\)$/, match => `(${words.pageShort} ${match[1]})`],
      [".apex-psy-sus > b,.apex-psy-cols > span > small", /^PR (\d+)$/, match => `${words.psyRatingShort} ${match[1]}`],
      [".apex-psy-power > summary > .apex-psy-range", /^(\d+(?:[.,]\d+)?) (m|km)$/, match => `${match[1]} ${dictionary.units[match[2]]}`],
      [".dh2e-veh-tiles > .apex-tile > .apex-sub", /^Operate ([+−±-]?\d+)$/, match => `${words.operate} ${match[1]}`],
      [".dh2e-veh-tiles > .apex-tile > .apex-sub > b.warn", /^(\d+(?:[.,]\d+)?) m$/, match => `${match[1]} ${dictionary.units.m}`],
      [".dh2e-veh-tiles > .apex-tile > .apex-sub > span", /^↦ (\d+(?:[.,]\d+)?) m \((\d+(?:[.,]\d+)?)\)$/, match => `↦ ${match[1]} ${dictionary.units.m} (${match[2]})`]
    ];
    for (const [selector, pattern, replacement] of rules) {
      for (const element of query(root, selector)) {
        replaceDirectText(element, text => {
          const match = pattern.exec(text);
          return match ? replacement(match) : null;
        }, counters);
      }
    }
    for (const element of query(root, ".apex-psy-power > summary > .apex-psy-range")) {
      replaceDirectText(element, text => ({ Self: words.self, Touch: words.touch })[text], counters);
    }
    // Only the range column may contain a numeric metre suffix here. Damage
    // expressions and canonical rate-of-fire notation live in adjacent spans.
    const rangeLabels = new Set(["Rng", localized(dictionary.weaponColumns.Rng, game)]);
    for (const span of query(root, ".dh2e-veh-weapon > .stats > span")) {
      if (span.children.length !== 1 || span.firstElementChild?.tagName !== "I"
        || !rangeLabels.has(normalize(span.firstElementChild.textContent))) continue;
      replaceDirectText(span, text => {
        const match = /^(\d+(?:[.,]\d+)?) m$/.exec(text);
        return match ? `${match[1]} ${dictionary.units.m}` : null;
      }, counters);
    }
    for (const control of query(root, '.apex-stats-tab input.apex-value-input[name="system.dh2e.movementModifier"]')) {
      const row = control.closest(".apex-row.apex-subrow");
      if (!row) continue;
      for (const label of [...row.children].filter(node => node.classList.contains("apex-cap"))) {
        replaceDirectText(label, text => text.endsWith(" (m)") ? `${text.slice(0, -4)} (${dictionary.units.m})` : null, counters);
      }
    }
    for (const element of query(root, ".apex-psy-foot > span:last-child")) {
      replaceDirectText(element, text => {
        // This span is authored solely from numeric experience/page metadata.
        const match = /^(?:(\d+) xp)?(?:\s*· p\. (\d+))?$/.exec(text);
        if (!match || (!match[1] && !match[2])) return null;
        return `${match[1] ? `${match[1]} ${words.experienceShort}` : ""}${match[2] ? `${match[1] ? " " : ""}· ${words.pageShort} ${match[2]}` : ""}`;
      }, counters);
    }
    for (const element of query(root, ".apex-psy-tags > span:last-child")) {
      replaceDirectText(element, text => {
        const prefix = game?.i18n?.localize?.("FALLOUTMAW.DH2E.Apex.Psy.Sustain");
        for (const start of ["Sustain: ", prefix && prefix !== "FALLOUTMAW.DH2E.Apex.Psy.Sustain" ? `${prefix}: ` : null].filter(Boolean)) {
          if (!text.startsWith(start)) continue;
          const action = text.slice(start.length);
          if (!own(dictionary.actions, action)) continue;
          return start + localized(dictionary.actions[action], game);
        }
        return null;
      }, counters);
    }
    for (const select of query(root, 'select[name="system.dh2e.manual.size"]')) {
      translateOptions(select, null, counters, game, (source, value) => {
        const entry = dictionary.sizeNames[value];
        if (entry && source === `${entry.en} (${value})`) return `${entry.ru} (${value})`;
        if (value !== "") return null;
        // The Auto prefix may already be localized by the native i18n pack.
        const match = /^(.*): ([A-Za-z]+) \((10|[1-9])\)$/.exec(source);
        if (!match) return null;
        const size = dictionary.sizeNames[match[3]];
        const auto = game?.i18n?.localize?.("FALLOUTMAW.DH2E.Manual.Auto");
        if (!size || size.en !== match[2] || !["Auto", auto].includes(match[1])) return null;
        return `${auto && auto !== "FALLOUTMAW.DH2E.Manual.Auto" ? auto : words.auto}: ${size.ru} (${match[3]})`;
      });
    }
    for (const select of query(root, 'select[name="system.dh2e.manual.fear"]')) {
      translateOptions(select, null, counters, game, (source, value) => {
        if (/^[1-4]$/.test(value) && source === `Fear (${value})`) return `${words.fear} (${value})`;
        if (value !== "") return null;
        const match = /^(.*): Fear \(([1-4])\)$/.exec(source);
        const auto = game?.i18n?.localize?.("FALLOUTMAW.DH2E.Manual.Auto");
        if (!match || !["Auto", auto].includes(match[1])) return null;
        return `${auto && auto !== "FALLOUTMAW.DH2E.Manual.Auto" ? auto : words.auto}: ${words.fear} (${match[2]})`;
      });
    }
  }
  if (scope === "item") {
    translateCriticalCharacteristics(root, dictionary, counters, game);
    // Only the UI units beside these exact input fields. Formula examples such
    // as SB, PR, 1d10+PR and every placeholder/value remain unchanged.
    for (const [name, from, to] of [
      ["system.functions.weapon.effectiveRange.max", " (m)", " (м)"],
      ["system.weight", " (kg)", " (кг)"]
    ]) {
      for (const control of query(root, `input[name="${name}"]`)) {
        const label = control.parentElement;
        if (label?.tagName !== "LABEL") continue;
        for (const span of [...label.children].filter(node => node.tagName === "SPAN")) {
          replaceDirectText(span, text => text.endsWith(from) ? text.slice(0, -from.length) + to : null, counters);
        }
      }
    }
  }
}

/** Pure DOM pass, exported for regression tests and explicit sheet refreshes. */
export function applySheetUiTranslations(application, element, { dictionary, game = globalThis.game } = {}) {
  const counters = { active: false, scope: null, translatedText: 0, translatedAttributes: 0, translatedOptions: 0, skippedOptions: 0 };
  if (!isSheetUiAdapterActive(game)) return counters;
  const scope = sheetScope(application);
  if (!scope || element?.nodeType !== 1 || typeof element.querySelectorAll !== "function") return counters;
  if (dictionary?._meta?.schemaVersion !== 1 || dictionary?._meta?.systemId !== SHEET_UI_SYSTEM_ID) return counters;
  counters.active = true;
  counters.scope = scope;
  for (const [targetScope, selector, group] of TEXT_RULES) {
    if (targetScope !== scope) continue;
    for (const target of query(element, selector)) replaceDirectText(target, exactMap(dictionary[group], game), counters);
  }
  for (const [targetScope, selector] of ARIA_RULES) {
    if (targetScope !== scope) continue;
    for (const target of query(element, selector)) {
      if (protectedElement(target, true)) continue;
      const current = target.getAttribute("aria-label");
      if (!own(dictionary.aria, current)) continue;
      const replacement = localized(dictionary.aria[current], game);
      if (replacement && replacement !== current) {
        target.setAttribute("aria-label", replacement);
        counters.translatedAttributes++;
      }
    }
  }
  const itemType = application.document?.type ?? application.item?.type;
  for (const [targetScope, name, group, requiredItemType] of OPTION_RULES) {
    if (scope !== targetScope || (requiredItemType && itemType !== requiredItemType)) continue;
    for (const select of query(element, `select[name="${name}"]`)) translateOptions(select, dictionary[group], counters, game);
  }
  if (scope === "actor") translateActorSkillBoard(element, dictionary, counters, game);
  translateStructuredUi(element, scope, dictionary, counters, game);
  return counters;
}

export async function loadSheetUiDictionary({ url = new URL("../lang/ui-literals.ru.json", import.meta.url), fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") throw new Error(`${SHEET_UI_MODULE_ID}: dictionary fetch is unavailable`);
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`${SHEET_UI_MODULE_ID}: UI dictionary returned HTTP ${response.status}`);
  const dictionary = await response.json();
  if (dictionary?._meta?.schemaVersion !== 1 || dictionary?._meta?.systemId !== SHEET_UI_SYSTEM_ID) {
    throw new Error(`${SHEET_UI_MODULE_ID}: unsupported UI dictionary`);
  }
  return dictionary;
}

/**
 * Synchronous by design. Example in module init/setup:
 * const dictionary = await loadSheetUiDictionary({url: "modules/.../ui-literals.ru.json"});
 * const adapter = registerSheetUiAdapter({dictionary});
 * Foundry v14: renderApplicationV2(application, element, context, options).
 */
export function registerSheetUiAdapter({ dictionary, Hooks = globalThis.Hooks, game = () => globalThis.game } = {}) {
  if (dictionary?._meta?.schemaVersion !== 1 || dictionary?._meta?.systemId !== SHEET_UI_SYSTEM_ID) {
    throw new Error(`${SHEET_UI_MODULE_ID}: preload the UI dictionary before registering the adapter`);
  }
  if (!Hooks || typeof Hooks.on !== "function" || typeof Hooks.off !== "function") {
    throw new Error(`${SHEET_UI_MODULE_ID}: Foundry Hooks are unavailable`);
  }
  if (installations.has(Hooks)) return installations.get(Hooks);
  const currentGame = () => typeof game === "function" ? game() : game;
  const apply = (application, element) => applySheetUiTranslations(application, element, { dictionary, game: currentGame() });
  let warned = false;
  const hookId = Hooks.on("renderApplicationV2", (application, element) => {
    try { apply(application, element); }
    catch (error) {
      // A future system template change must not prevent its sheets from opening.
      if (!warned) console.warn(`${SHEET_UI_MODULE_ID}: UI adapter skipped a render`, error);
      warned = true;
    }
  });
  const adapter = Object.freeze({
    hookId, apply,
    dispose() {
      Hooks.off("renderApplicationV2", hookId);
      installations.delete(Hooks);
    }
  });
  installations.set(Hooks, adapter);
  return adapter;
}
