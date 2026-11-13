/**
 * Display-only Russian repairs for the Dark Heresy 2E Apex v0.1.10 token HUD.
 *
 * This adapter touches ONLY the source-audited TokenActionHud ApplicationV2;
 * it never mutates Actor, Item, Token, attack state, source data, or identifiers.
 * UI localization keys continue to be provided by lang/ru.json. This handles
 * source hard-coded English characteristic abbreviations, specialisations,
 * action subtype/page headings and stock psychic power tooltip metadata.
 */
export const TOKEN_HUD_SYSTEM_ID = 'dark-heresy-2e-apex';
export const TOKEN_HUD_MODULE_ID = 'dark-heresy-2e-apex-ru';
const installs = new WeakMap();
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj ?? {}, key);
const trimmed = value => String(value ?? '').trim();

// Exactly the hard-coded values in src/apps/token-action-hud.mjs.
const CHARACTERISTIC_TEST_SHORTS = Object.freeze({
  meleeCombat: ['WS', 'НР'],
  rangedCombat: ['BS', 'НС'],
  throwing: ['BS·Thr', 'НС·Мет'],
  strengthTest: ['S', 'Сил'],
  resilience: ['T', 'Вын'],
  agilityTest: ['Ag', 'Лов'],
  intelligenceTest: ['Int', 'Инт'],
  perceptionTest: ['Per', 'Вос'],
  willpowerTest: ['WP', 'СВ'],
  fellowshipTest: ['Fel', 'Общ'],
  influenceTest: ['Ifl', 'Вли']
});

const ACTION_SUBTYPES = Object.freeze({
  Attack: 'Атака',
  Concentration: 'Сосредоточение',
  Melee: 'Ближний бой',
  Ranged: 'Дальний бой',
  Movement: 'Перемещение',
  Miscellaneous: 'Прочее',
  Fate: 'Судьба'
});

const POWER_ACTIONS = Object.freeze({
  'Half Action': 'Полудействие', 'Full Action': 'Полное действие',
  'Free Action': 'Свободное действие', Reaction: 'Реакция',
  Special: 'Особое действие', 'Extended Action (3)': 'Длительное действие (3)'
});

export function isTokenHudUiActive(game = globalThis.game) {
  return game?.system?.id === TOKEN_HUD_SYSTEM_ID && game?.i18n?.lang === 'ru';
}

function isHudApplication(app, root) {
  if (!root || root.nodeType !== 1 || typeof root.querySelectorAll !== 'function') return false;
  // Both the JS constructor identity and the template class are checked.
  let found = false;
  for (let ctor = app?.constructor; typeof ctor === 'function'; ctor = Object.getPrototypeOf(ctor)) {
    if (ctor.name === 'TokenActionHud') { found = true; break; }
    if (ctor === Function.prototype) break;
  }
  if (!found) return false;
  return Boolean(root.classList?.contains('dark-heresy-2e-apex-token-action-hud'));
}

function query(root, selector) {
  const nodes = Array.from(root.querySelectorAll(selector));
  if (root.matches?.(selector)) nodes.unshift(root);
  return nodes;
}

/** Never rebuild the element: keep event handlers, nodes, and active controls. */
function replaceDirectText(element, from, to, counters) {
  if (!element || !to || from === to) return;
  for (const child of element.childNodes ?? []) {
    if (child.nodeType !== 3) continue;
    const text = child.nodeValue ?? '';
    const core = trimmed(text);
    if (core !== from) continue;
    const start = text.indexOf(core);
    child.nodeValue = text.slice(0, start) + to + text.slice(start + core.length);
    counters.text++;
  }
}
function replaceAttribute(element, name, from, to, counters) {
  if (!element || from === to || !to || element.getAttribute(name) !== from) return;
  element.setAttribute(name, to);
  counters.attributes++;
}
function getEntryByKey(dictionary, key) {
  return dictionary?.specialistSkillNames?.[key] ?? dictionary?.coreSkillNames?.[key] ?? null;
}

/** Only precise, canonical English source labels are replaced, not user names. */
function translateSkillTray(root, dictionary, counters) {
  for (const button of query(root, 'button.dh2e-hud-stat[data-action="rollSkill"][data-skill-key]')) {
    const id = button.getAttribute('data-skill-key');
    const entry = dictionary?.coreSkillNames?.[id];
    if (!entry) continue;
    const [enShort, ruShort] = CHARACTERISTIC_TEST_SHORTS[id] ?? [];
    replaceDirectText(button.querySelector('span'), enShort, ruShort, counters);
    replaceAttribute(button, 'data-tooltip', entry.en, entry.ru, counters);
    if(id==='meleeCombat')replaceAttribute(button,'data-tooltip','Рукопашная','Навык Рукопашной',counters);
    if(id==='rangedCombat')replaceAttribute(button,'data-tooltip','Стрельба','Навык Стрельбы',counters);
  }
  for (const button of query(root, 'button.dh2e-hud-check[data-action="rollSkill"][data-skill-key]')) {
    const id = button.getAttribute('data-skill-key');
    const entry = getEntryByKey(dictionary, id);
    if (!entry) continue;
    const label = button.querySelector('span.dh2e-hud-check-label');
    if (entry.group && own(dictionary.specialistGroups, entry.group)) {
      const group = dictionary.specialistGroups[entry.group];
      replaceDirectText(label, entry.en, entry.ru, counters);
      const fullEnglish = `${group.en} (${entry.en})`;
      const fullRussian = `${group.ru} (${entry.ru})`;
      replaceDirectText(label, fullEnglish, fullRussian, counters);
      replaceAttribute(button, 'data-tooltip', fullEnglish, fullRussian, counters);
    } else {
      replaceDirectText(label, entry.en, entry.ru, counters);
      replaceAttribute(button, 'data-tooltip', entry.en, entry.ru, counters);
    }
  }
  for (const group of query(root, '.dh2e-hud-check-group[data-skill-group-key]')) {
    const entry = dictionary?.specialistGroups?.[group.getAttribute('data-skill-group-key')];
    if (!entry) continue;
    replaceDirectText(group.querySelector('summary > span'), entry.en, entry.ru, counters);
  }
}

/** Translate the literal action-subtype column, which the source does not i18n. */
export function translateActionTooltip(tooltip) {
  const input = String(tooltip ?? '');
  const parts = input.split(' — ');
  let changed = false;
  for (let i = 0; i < parts.length; i++) {
    const segments = parts[i].split(' · ');
    if (segments.length < 2 || !segments.some(part => /^p\. \d+$/.test(part))) continue;
    const updated = segments.map(part => {
      if (/^p\. \d+$/.test(part)) return part.replace(/^p\./, 'стр.');
      const types = part.split(/(, |\/)/g);
      const everyType = types.some(type => own(ACTION_SUBTYPES, type));
      if (everyType && types.every(type => own(ACTION_SUBTYPES, type) || type === ', ' || type === '/')) {
        return types.map(type => ACTION_SUBTYPES[type] ?? type).join('');
      }
      return part;
    });
    const next = updated.join(' · ');
    if (next !== parts[i]) { parts[i] = next; changed = true; }
  }
  return changed ? parts.join(' — ') : input;
}
function translateActionTooltips(root, counters) {
  for (const button of query(root, 'button[data-action="useSystemAction"][data-system-action-key^="dh2e:"][data-tooltip]')) {
    const current = button.getAttribute('data-tooltip');
    const translated = translateActionTooltip(current);
    if (translated !== current) {
      button.setAttribute('data-tooltip', translated);
      counters.attributes++;
    }
  }
}

/** Translators for the immutable built-in psychic power fields only. */
export function translatePowerDescriptor(value, kind) {
  const text = String(value ?? '');
  if (kind === 'action') return POWER_ACTIONS[text] ?? text;
  if (kind === 'range') return text
    .replace(/\bkilometres?\b/g, 'км').replace(/\bmetres?\b/g, 'м')
    .replace(/\bx psy rating\b/g, '× пси-рейтинг')
    .replace(/\bradius\b/g, '(радиус)')
    .replace(/^Self$/, 'На себя');
  if (kind === 'test') return text
    .replace(/\bOpposed\b/g, 'Встречная')
    .replace(/\bChallenging\b/g, 'Заурядная')
    .replace(/\bDifficult\b/g, 'Непростая')
    .replace(/\bHard\b/g, 'Трудная')
    .replace(/\bRoutine\b/g, 'Простая')
    .replace(/\bOrdinary\b/g, 'Лёгкая')
    .replace(/\bWillpower test\b/g, 'проверка Силы воли')
    .replace(/\bPsyniscience test\b/g, 'проверка Психонауки')
    .replace(/\bPerception test\b/g, 'проверка Восприятия')
    .replace(/\bToughness test\b/g, 'проверка Выносливости');
  return text;
}
export function stockPowerTooltip(power) {
  const { action, range, focusPower, sustained } = power;
  return [action, range, focusPower, sustained && !/^no$/i.test(sustained) ? `Sustained: ${sustained}` : ''].filter(Boolean).join(' · ');
}
export function translatedStockPowerTooltip(power) {
  const { action, range, focusPower, sustained } = power;
  return [translatePowerDescriptor(action, 'action'), translatePowerDescriptor(range, 'range'),
    translatePowerDescriptor(focusPower, 'test'), sustained && !/^no$/i.test(sustained) ? `Поддержание: ${translatePowerDescriptor(sustained, 'action').toLowerCase()}` : ''].filter(Boolean).join(' · ');
}
function translatePsychicPowerTray(root, catalog, counters) {
  for (const button of query(root, 'button[data-action="useDh2ePsychicPower"][data-power-key]')) {
    const power = catalog?.[button.getAttribute('data-power-key')];
    if (!power) continue; // No translation for unknown/homebrew abilities.
    // Never overwrite a renamed or homebrew owned power item.  A stock power
    // already named in Russian must still receive its translated tooltip.
    const name = button.querySelector('span');
    if (![power.en, power.ru].includes(trimmed(name?.textContent))) continue;
    replaceDirectText(name, power.en, power.ru, counters);
    replaceAttribute(button.querySelector('img'), 'alt', power.en, power.ru, counters);
    replaceAttribute(button, 'data-tooltip', stockPowerTooltip(power), translatedStockPowerTooltip(power), counters);
  }
}
function translateLiteralAria(root, counters) {
  for (const svg of query(root, 'svg.dark-heresy-2e-apex-token-hud-limb-silhouette[aria-label]')) {
    replaceAttribute(svg, 'aria-label', 'Body', 'Тело', counters);
    replaceAttribute(svg, 'aria-label', 'Limbs', 'Части тела', counters);
  }
  for (const flag of query(root, 'strong.dh2e-hud-pinned')) {
    replaceDirectText(flag, '−20 BS · ½', '−20 НС · ½', counters);
  }
}

export function applyTokenHudUiTranslations(application, element, { dictionary, powers, game = globalThis.game } = {}) {
  const counters = { active: false, text: 0, attributes: 0 };
  if (!isTokenHudUiActive(game) || !isHudApplication(application, element)) return counters;
  if (dictionary?._meta?.schemaVersion !== 1 || dictionary?._meta?.systemId !== TOKEN_HUD_SYSTEM_ID) return counters;
  counters.active = true;
  translateSkillTray(element, dictionary, counters);
  translateActionTooltips(element, counters);
  translatePsychicPowerTray(element, powers, counters);
  translateLiteralAria(element, counters);
  return counters;
}

/** Synchronous Foundry v14 hook; source system version must match module.json. */
export function registerTokenHudUiAdapter({ dictionary, powers, Hooks = globalThis.Hooks, game = () => globalThis.game } = {}) {
  if (dictionary?._meta?.schemaVersion !== 1 || dictionary?._meta?.systemId !== TOKEN_HUD_SYSTEM_ID || !powers || typeof powers !== 'object') {
    throw new Error(`${TOKEN_HUD_MODULE_ID}: preload verified token HUD dictionaries`);
  }
  if (!Hooks || typeof Hooks.on !== 'function' || typeof Hooks.off !== 'function') throw new Error(`${TOKEN_HUD_MODULE_ID}: Foundry Hooks unavailable`);
  if (installs.has(Hooks)) return installs.get(Hooks);
  const currentGame = () => typeof game === 'function' ? game() : game;
  const apply = (app, element) => applyTokenHudUiTranslations(app, element, { dictionary, powers, game: currentGame() });
  let warned = false;
  const toolbarHookId = Hooks.on('getSceneControlButtons', controls => {
    if (!isTokenHudUiActive(currentGame())) return;
    // System-owned tool name and English label from addTokenActionHudControlButton.
    const tool = controls?.tokens?.tools?.falloutMawTokenHud;
    if (tool?.name === 'falloutMawTokenHud' && tool.title === 'Token Action HUD') {
      tool.title = 'Панель действий токена';
    }
  });
  const hookId = Hooks.on('renderApplicationV2', (app, element) => {
    try { apply(app, element); }
    catch (error) {
      if (!warned) console.warn(`${TOKEN_HUD_MODULE_ID}: token HUD adapter skipped a render`, error);
      warned = true;
    }
  });
  const adapter = Object.freeze({ hookId, toolbarHookId, apply, dispose() {
    Hooks.off('renderApplicationV2', hookId);
    Hooks.off('getSceneControlButtons', toolbarHookId);
    installs.delete(Hooks);
  } });
  installs.set(Hooks, adapter);
  return adapter;
}
