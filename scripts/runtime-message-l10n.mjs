/** Russian display text for source-owned Apex 0.1.12 notifications and format arguments. */
import progression from './progression-data.mjs';
import ui from './ui-literals.mjs';
import {translateAdvancementRuleText} from './progression-ui-adapter.mjs';

const SYSTEM_ID = 'dark-heresy-2e-apex';
const INSTALLATIONS = new WeakMap();
const WRAPPED_METHODS = new WeakMap();
const NOTIFICATION_TEXT = Object.freeze({
  'No active GM is available to apply damage.': 'Нет активного Мастера игры, который может применить урон.',
  'No GM response was received for damage application.': 'Не получен ответ Мастера игры на запрос применения урона.',
  'No GM response was received for damage hub action.': 'Не получен ответ Мастера игры на запрос обработки урона.',
  'No active GM is available to create a first aid effect.': 'Нет активного Мастера игры, который может применить эффект первой помощи.',
  'No active GM is available to create a first aid withdrawal effect.': 'Нет активного Мастера игры, который может применить последствия окончания действия первой помощи.',
  'No active GM is available to remove first aid effects.': 'Нет активного Мастера игры, который может снять эффекты первой помощи.',
  'The item is already being used. Wait for the action to finish.': 'Предмет уже используется. Дождитесь завершения действия.',
  'The previous use is already paid for. The effect is not repeated.': 'Расход за предыдущее применение уже учтён. Эффект повторно не применяется.',
  'The previous use is complete. The effect is not repeated.': 'Предыдущее применение завершено. Эффект повторно не применяется.',
  'The previous item use is unfinished. The GM must check the effect and either consume or release the item.': 'Предыдущее применение предмета не завершено. Мастер игры должен проверить эффект и списать предмет либо снять резервирование.',
  'Use interrupted. The item is kept for GM review; the effect will not repeat.': 'Применение прервано. Предмет зарезервирован до проверки Мастером игры. Эффект повторно не применяется.'
});
const ITEM_MESSAGE_SUFFIXES = Object.freeze([
  [': item is depleted.', ': предмет израсходован.'],
  [': not enough charges.', ': недостаточно зарядов.']
]);

/** Exact source messages and two complete first-aid suffixes, retaining the item name. */
export function translateRuntimeNotification(message) {
  if (typeof message !== 'string') return message;
  if (Object.hasOwn(NOTIFICATION_TEXT, message)) return NOTIFICATION_TEXT[message];
  for (const [english, russian] of ITEM_MESSAGE_SUFFIXES) {
    if (message.length > english.length && message.endsWith(english)) {
      return message.slice(0, -english.length) + russian;
    }
  }
  return message;
}

/** Split the book's AND/OR groups without splitting specialisations in parentheses. */
function splitRequirements(value, separator) {
  const groups = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < value.length; index++) {
    if (value[index] === '(') depth++;
    if (value[index] === ')') depth--;
    if (depth === 0 && value.startsWith(separator, index)) {
      groups.push(value.slice(start, index));
      index += separator.length - 1;
      start = index + 1;
    }
  }
  groups.push(value.slice(start));
  return groups;
}

// Only catalog requirements and their narrowed alternatives qualify. A custom
// prerequisite sentence containing a familiar word is preserved in full.
const STOCK_REQUIREMENTS = new Set([
  'Inquisitor elite advance',
  'Untouchable elite advance'
]);
for (const talent of Object.values(progression.talents)) {
  for (const group of splitRequirements(talent.prerequisites, ',')) {
    STOCK_REQUIREMENTS.add(group.trim());
    for (const alternative of splitRequirements(group, ' or ')) {
      STOCK_REQUIREMENTS.add(alternative.trim());
    }
  }
}

export function translateTalentRequirementList(value) {
  if (typeof value !== 'string') return value;
  return splitRequirements(value, ',').map(group => {
    const core = group.trim();
    return STOCK_REQUIREMENTS.has(core)
      ? group.replace(core, () => translateAdvancementRuleText(core))
      : group;
  }).join(',');
}

function skillLabel(key) {
  const entry = ui.coreSkillNames[key] ?? ui.specialistSkillNames[key];
  if (!entry) return null;
  const group = entry.group ? ui.specialistGroups[entry.group] : null;
  return group ? group.ru + ' (' + entry.ru + ')' : entry.ru;
}

/** The vehicle rules emit skill IDs joined by | and the stock sentinel essential. */
export function translateVehicleRepairRequirements(value) {
  if (typeof value !== 'string') return value;
  return value.split(', ').map(group => {
    const keys = group === 'essential'
      ? ['commonLoreAdeptusMechanicus', 'commonLoreTech', 'forbiddenLoreAdeptusMechanicus']
      : group.split('|');
    const labels = keys.map(skillLabel);
    return labels.every(Boolean) ? labels.join(' или ') : group;
  }).join(', ');
}

function translateStockSkillLabel(value) {
  for (const [key, entry] of Object.entries({...ui.coreSkillNames, ...ui.specialistSkillNames})) {
    const group = entry.group ? ui.specialistGroups[entry.group] : null;
    const english = group ? group.en + ' (' + entry.en + ')' : entry.en;
    if (value === english) return skillLabel(key);
  }
  return value;
}

const VEHICLE_DIRECTIONS = Object.freeze({
  "45 degrees to the vehicle's left.": 'На 45° влево от направления машины.',
  'Straight ahead.': 'Прямо вперёд.',
  "45 degrees to the vehicle's right.": 'На 45° вправо от направления машины.'
});
const FORMAT_FIELDS = new Map([
  ['FALLOUTMAW.DH2E.Talents.Unmet', {field: 'list', translate: translateTalentRequirementList}],
  ['FALLOUTMAW.DH2E.Talents.Manual', {field: 'list', translate: translateTalentRequirementList}],
  ['FALLOUTMAW.DH2E.Vehicle.RepairMissing', {field: 'skills', translate: translateVehicleRepairRequirements}],
  ['FALLOUTMAW.DH2E.Vehicle.OperateHint', {field: 'skill', translate: translateStockSkillLabel}],
  ['FALLOUTMAW.DH2E.Vehicle.OutOfControlMove', {
    field: 'direction',
    translate: value => Object.hasOwn(VEHICLE_DIRECTIONS, value) ? VEHICLE_DIRECTIONS[value] : value
  }]
]);

function translatedFormatData(key, data) {
  if (!data || typeof data !== 'object') return data;
  const entry = FORMAT_FIELDS.get(key);
  if (!entry || typeof data[entry.field] !== 'string') return data;
  const translated = entry.translate(data[entry.field]);
  return translated !== data[entry.field] ? {...data, [entry.field]: translated} : data;
}

function active(game) {
  return game?.system?.id === SYSTEM_ID && game?.i18n?.lang === 'ru';
}

function wrapMethod(target, name, transform) {
  if (!target || typeof target[name] !== 'function') return false;
  let installed = WRAPPED_METHODS.get(target);
  if (!installed) {
    installed = new Set();
    WRAPPED_METHODS.set(target, installed);
  }
  if (installed.has(name)) return true;
  const original = target[name];
  target[name] = function(...args) {
    return Reflect.apply(original, this, transform(args));
  };
  installed.add(name);
  return true;
}

/** Install on current Foundry instances. The language/system gate is evaluated on every call. */
export function installRuntimeMessageLocalization({game = () => globalThis.game, notifications = globalThis.ui?.notifications} = {}) {
  const currentGame = () => typeof game === 'function' ? game() : game;
  const current = currentGame();
  const wrapped = {};
  for (const method of ['warn', 'info']) {
    wrapped[method] = wrapMethod(notifications, method, args => {
      if (active(currentGame()) && args.length) args[0] = translateRuntimeNotification(args[0]);
      return args;
    });
  }
  wrapped.format = wrapMethod(current?.i18n, 'format', args => {
    if (active(currentGame()) && args.length > 1) args[1] = translatedFormatData(args[0], args[1]);
    return args;
  });
  return wrapped;
}

/** Retry at init/ready because notification and localization instances may appear later. */
export function registerRuntimeMessageLocalization({Hooks = globalThis.Hooks, game = () => globalThis.game, ui = () => globalThis.ui} = {}) {
  if (!Hooks?.once) return false;
  if (INSTALLATIONS.has(Hooks)) return INSTALLATIONS.get(Hooks);
  const install = () => installRuntimeMessageLocalization({
    game,
    notifications: (typeof ui === 'function' ? ui() : ui)?.notifications
  });
  const state = {install};
  INSTALLATIONS.set(Hooks, state);
  install();
  Hooks.once('init', install);
  Hooks.once('ready', install);
  return state;
}
