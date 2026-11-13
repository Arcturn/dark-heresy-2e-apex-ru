/** Russian display text for source-owned Apex 0.1.12 notifications and format arguments. */
import progression from './progression-data.mjs';
import ui from './ui-literals.mjs';
import vehicleProfiles from './vehicle-profile-data.mjs';
import {translateAdvancementRuleText} from './progression-ui-adapter.mjs';

const SYSTEM_ID = 'dark-heresy-2e-apex';
const PRESET_ERROR_PREFIX = 'Dark Heresy 2E [Apex Edition]: ';
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
  'Use interrupted. The item is kept for GM review; the effect will not repeat.': 'Применение прервано. Предмет зарезервирован до проверки Мастером игры. Эффект повторно не применяется.',
  'Natural race weapons cannot be deleted from an actor.': 'Природное оружие вида нельзя удалить у персонажа.'
});
const ITEM_MESSAGE_SUFFIXES = Object.freeze([
  [': item is depleted.', ': предмет израсходован.'],
  [': not enough charges.', ': недостаточно зарядов.']
]);
// These are complete errors owned by the preset manager, not arbitrary English
// fragments. Direct notifications also require the manager's exact prefix.
const PRESET_ERRORS = Object.freeze({
  'A base Dark Heresy 2E [Apex Edition] preset cannot be deleted.': 'Базовый набор настроек Dark Heresy 2E [Apex Edition] нельзя удалить.',
  'No settings were selected for migration.': 'Не выбраны настройки для переноса.',
  'Portable preset deletion markers are no longer supported.': 'Переносимые маркеры удаления наборов настроек больше не поддерживаются.',
  'A pending settings preset file could not be synchronized during refresh.': 'При обновлении не удалось синхронизировать файл набора настроек с незавершённой записью.',
  'A pending settings preset file could not be recovered during startup.': 'При запуске не удалось восстановить файл набора настроек с незавершённой записью.',
  'A previous settings preset write is still pending and must be synchronized first.': 'Предыдущая запись набора настроек ещё не завершена. Сначала необходимо выполнить синхронизацию.',
  'Pending preset backup is unavailable.': 'Резервная копия набора настроек с незавершённой записью недоступна.',
  'Settings preset state is not registered.': 'Состояние наборов настроек не зарегистрировано.',
  'Foundry did not materialize every managed Setting document.': 'Foundry не создала все управляемые документы настроек.',
  'Foundry rejected one or more operations in the atomic settings batch.': 'Foundry отклонила одну или несколько операций в неделимом пакете изменений настроек.',
  'Foundry rejected Setting document materialization before preset application.': 'Foundry отклонила создание документов настроек перед применением набора.',
  'Foundry game socket is unavailable.': 'Игровое сокет-соединение Foundry недоступно.',
  'Foundry FilePicker is unavailable.': 'Средство выбора файлов Foundry недоступно.',
  'Only an active GM may request settings preset mutations.': 'Только активный Мастер игры может запрашивать изменения наборов настроек.',
  'Only the active GM client can process settings preset mutations.': 'Только клиент активного Мастера игры может обрабатывать изменения наборов настроек.',
  'No active GM is available to manage settings presets.': 'Нет активного Мастера игры, который может управлять наборами настроек.',
  'Preset name cannot be empty.': 'Название набора настроек не может быть пустым.',
  'Preset name cannot exceed 200 characters.': 'Название набора настроек не может превышать 200 символов.',
  'Preset name contains control characters.': 'Название набора настроек содержит управляющие символы.',
  'A preset setting value is not JSON-safe.': 'Значение настройки в наборе невозможно безопасно представить в формате JSON.',
  'Preset application failed and its previous settings could not be fully restored.': 'Не удалось применить набор настроек и полностью восстановить предыдущие настройки.',
  'The Dark Heresy 2E [Apex Edition] server file-delete adapter did not respond. Fully restart Foundry after installing the current server patch.': 'Серверный адаптер удаления файлов Dark Heresy 2E [Apex Edition] не ответил. Полностью перезапустите Foundry после установки текущего серверного исправления.',
  'Only a GM can manage settings presets.': 'Только Мастер игры может управлять наборами настроек.',
  "A base Dark Heresy 2E [Apex Edition] preset cannot be a tombstone.": "Базовый набор настроек Dark Heresy 2E [Apex Edition] нельзя заменить маркером удаления.",
  "Only the live main Dark Heresy 2E [Apex Edition] preset can be cloned.": "Клонировать можно только неудалённый основной набор настроек Dark Heresy 2E [Apex Edition].",
  "Only a live Dark Heresy 2E [Apex Edition] base preset can be cloned.": "Клонировать можно только неудалённый базовый набор настроек Dark Heresy 2E [Apex Edition].",
  "A cloned preset must use a new id.": "Клон набора настроек должен иметь новый идентификатор.",
  "Preset settings must be an array.": "Настройки набора должны быть массивом.",
  "A preset tombstone cannot contain settings.": "Маркер удаления набора не может содержать настройки.",
  "Preset saves must be an array.": "Сохранённые версии набора должны быть массивом.",
  "A preset tombstone cannot contain saves.": "Маркер удаления набора не может содержать сохранённые версии.",
  "Preset system and systemId must match.": "Поля system и systemId набора должны совпадать.",
  "Preset id must be a safe non-empty file id.": "Идентификатор набора должен быть непустым и допустимым для имени файла.",
  "Preset name must be a string.": "Название набора должно быть строкой.",
  "Preset systemVersion must be a non-empty string or null.": "Поле systemVersion набора должно быть непустой строкой или null.",
  "Preset updatedAt must be an ISO date string or null.": "Поле updatedAt набора должно быть строкой даты в формате ISO или null.",
  "Preset revision must be a lowercase SHA-256 hex digest.": "Поле revision набора должно быть шестнадцатеричным хешем SHA-256 в нижнем регистре.",
  "Preset format must be dark-heresy-2e-apex-settings-preset.": "Поле format набора должно иметь значение dark-heresy-2e-apex-settings-preset.",
  "Preset schemaVersion must be 1.": "Поле schemaVersion набора должно иметь значение 1.",
  "Preset systemId must be dark-heresy-2e-apex.": "Поле systemId набора должно иметь значение dark-heresy-2e-apex.",
  "Preset name must contain 1-200 printable characters.": "Название набора должно содержать от 1 до 200 печатных символов.",
  "Preset deleted must be a boolean.": "Поле deleted набора должно иметь логическое значение.",
  "systemPresets must be an array.": "Поле systemPresets должно быть массивом.",
  "worldPresets must be an array.": "Поле worldPresets должно быть массивом.",
  "Preset document must be a plain object.": "Документ набора должен быть обычным объектом.",
  "Legacy settings baseline must be a plain object.": "Устаревший базовый набор настроек должен быть обычным объектом.",
  "Legacy settings baseline.settings must be a plain object.": "Поле settings устаревшего базового набора настроек должно быть обычным объектом.",
  "Preset revision input must be a plain object.": "Исходные данные ревизии набора должны быть обычным объектом.",
  'Unknown settings preset error.': 'Неизвестная ошибка набора настроек.'
});

// Anchored complete templates from settings/presets/{manager,schema}.mjs. Captured names,
// IDs, paths and response statuses are display data and are retained verbatim.
const PRESET_ERROR_PATTERNS = [
  [/^Value at (\$.*) must be a finite JSON number\.$/su, ([, path]) => `Значение по пути ${path} должно быть конечным числом JSON.`],
  [/^Value at (\$.*) is not JSON-safe\.$/su, ([, path]) => `Значение по пути ${path} невозможно безопасно представить в формате JSON.`],
  [/^Value at (\$.*) contains a circular reference\.$/su, ([, path]) => `Значение по пути ${path} содержит циклическую ссылку.`],
  [/^Value at (\$.*\[\d+\]) contains a sparse array slot\.$/su, ([, path]) => `По пути ${path} отсутствует элемент массива.`],
  [/^Value at (\$.*) contains symbol keys\.$/su, ([, path]) => `Значение по пути ${path} содержит ключи типа Symbol.`],
  [/^Preset ([A-Za-z0-9][A-Za-z0-9._-]{0,127}) has an invalid revision\.$/u, ([, id]) => `У набора ${id} неверная ревизия.`],
  [/^Preset settings\[(\d+)\]\.id must be a dark-heresy-2e-apex setting id\.$/u, ([, index]) => `Поле settings[${index}].id набора должно содержать идентификатор настройки dark-heresy-2e-apex.`],
  [/^Preset settings contains duplicate id (dark-heresy-2e-apex\.[^\s.][^\s]*)\.$/u, ([, id]) => `В настройках набора повторяется идентификатор ${id}.`],
  [/^Preset setting (dark-heresy-2e-apex\.[^\s.][^\s]*) must use world scope\.$/u, ([, id]) => `Настройка набора ${id} должна иметь область действия world.`],
  [/^Preset setting (dark-heresy-2e-apex\.[^\s.][^\s]*) must contain a value\.$/u, ([, id]) => `Настройка набора ${id} должна содержать значение.`],
  [/^Preset saves contains duplicate id ([A-Za-z0-9][A-Za-z0-9._-]{0,127})\.$/u, ([, id]) => `В сохранённых версиях набора повторяется идентификатор ${id}.`],
  [/^Preset saves\[(\d+)\]\.createdAt is required\.$/u, ([, index]) => `Поле saves[${index}].createdAt набора обязательно.`],
  [/^Preset save ([A-Za-z0-9][A-Za-z0-9._-]{0,127}) has an invalid revision\.$/u, ([, id]) => `У сохранённой версии набора ${id} неверная ревизия.`],
  [/^(systemPresets|worldPresets) contains duplicate preset id ([A-Za-z0-9][A-Za-z0-9._-]{0,127})\.$/u, ([, field, id]) => `В поле ${field} повторяется идентификатор набора ${id}.`],
  [/^Preset setting (dark-heresy-2e-apex\.[^\s.][^\s]*)\.value is not JSON-safe: (.*)$/su, ([, id, cause], translate) => `Значение настройки набора ${id} невозможно безопасно представить в формате JSON: ${translate(cause)}`],
  [/^Value at (\$.*) must be a plain object\.$/su, ([, path]) => `Значение по пути ${path} должно быть обычным объектом.`],
  [/^Preset (settings\[\d+\]|saves\[\d+\]) must be a plain object\.$/u, ([, field]) => `Элемент ${field} набора должен быть обычным объектом.`],
  [/^Preset document contains unsupported key (.*)\.$/su, ([, key]) => `Документ набора содержит неподдерживаемый ключ ${key}.`],
  [/^Preset (settings\[\d+\]|saves\[\d+\]) contains unsupported key (.*)\.$/su, ([, field, key]) => `Элемент ${field} набора содержит неподдерживаемый ключ ${key}.`],
  [/^Preset save (.+) was not found\.$/su, ([, id]) => `Сохранённая версия набора настроек ${id} не найдена.`],
  [/^Setting (.+) is not managed by presets\.$/su, ([, id]) => `Настройка ${id} не управляется наборами настроек.`],
  [/^Cannot load bundled settings preset: (\d{3}) (.*)$/su, ([, status, text]) => `Не удалось загрузить встроенный набор настроек: ${status} ${text}`],
  [/^Bundled settings preset has unexpected id (.+)\.$/su, ([, id]) => `Встроенный набор настроек имеет неожиданный идентификатор ${id}.`],
  [/^Cannot capture (\d+) managed setting\(s\):\n- (.+)$/su, ([, count, details], translate) => `Не удалось сохранить управляемые настройки (${count}):\n- ${translatePresetDetails(details, translate)}`],
  [/^Cannot activate deleted settings preset (.+)\.$/su, ([, id]) => `Нельзя активировать удалённый набор настроек ${id}.`],
  [/^Preset (.+?) was not applied atomically: (.+)$/su, ([, name, cause], translate) => `Набор настроек ${name} не был применён как единое целое: ${translate(cause)}`],
  [/^Previous Setting (.+) could not be restored\.$/su, ([, id]) => `Не удалось восстановить прежнюю настройку ${id}.`],
  [/^Foundry did not return the materialized Setting (.+)\.$/su, ([, id]) => `Foundry не вернула созданный документ настройки ${id}.`],
  [/^Preset (.+?) contains (\d+) incompatible managed setting\(s\):\n- (.+)$/su, ([, name, count, details], translate) => `Набор настроек ${name} содержит несовместимые управляемые настройки (${count}):\n- ${translatePresetDetails(details, translate)}`],
  [/^(dark-heresy-2e-apex\.[^\s]+) must be an object or array\.$/u, ([, id]) => `${id} должно быть объектом или массивом.`],
  [/^(dark-heresy-2e-apex\.[^\s]+) must be an array\.$/u, ([, id]) => `${id} должно быть массивом.`],
  [/^(dark-heresy-2e-apex\.[^\s]+) must be a string\.$/u, ([, id]) => `${id} должно быть строкой.`],
  [/^(dark-heresy-2e-apex\.[^\s]+) must be a finite number\.$/u, ([, id]) => `${id} должно быть конечным числом.`],
  [/^(dark-heresy-2e-apex\.[^\s]+) must be a boolean\.$/u, ([, id]) => `${id} должно быть логическим значением.`],
  [/^(dark-heresy-2e-apex\.[^\s]+) has an invalid value: (.+)$/su, ([, id, cause], translate) => `${id} имеет недопустимое значение: ${translate(cause)}`],
  [/^(dark-heresy-2e-apex\.[^\s]+) must be one of the registered choices\.$/u, ([, id]) => `${id} должно быть одним из зарегистрированных вариантов.`],
  [/^Preset (.+) still has an unresolved file write\.$/su, ([, id]) => `Запись файла набора настроек ${id} ещё не завершена.`],
  [/^Failed to persist preset (.+)\.$/su, ([, id]) => `Не удалось сохранить набор настроек ${id}.`],
  [/^Settings preset id (.+) is provided by multiple active modules\.$/su, ([, id]) => `Набор настроек с идентификатором ${id} предоставляется несколькими активными модулями.`],
  [/^Manifest id (.+?) does not match document id (.+)\.$/su, ([, manifest, document]) => `Идентификатор манифеста ${manifest} не совпадает с идентификатором документа ${document}.`],
  [/^Invalid module settings preset path (.+)\.$/su, ([, path]) => `Недопустимый путь к набору настроек модуля: ${path}.`],
  [/^Cannot browse settings preset directory (.+?): (.+)$/su, ([, path, cause], translate) => `Не удалось просмотреть каталог наборов настроек ${path}: ${translate(cause)}`],
  [/^Duplicate settings preset id (.+)\.$/su, ([, id]) => `Повторяющийся идентификатор набора настроек ${id}.`],
  [/^Settings preset ids (.+?) and (.+) collide on this filesystem\.$/su, ([, first, second]) => `Идентификаторы наборов настроек ${first} и ${second} конфликтуют в этой файловой системе.`],
  [/^Foundry did not confirm physical deletion of settings preset (.+)\.$/su, ([, id]) => `Foundry не подтвердила физическое удаление набора настроек ${id}.`],
  [/^Cannot create settings preset backup directory (.+?): (.+)$/su, ([, path, cause], translate) => `Не удалось создать каталог резервных копий наборов настроек ${path}: ${translate(cause)}`],
  [/^Failed to write preset (.+?) to (system|world) storage\.$/su, ([, id, storage]) => `Не удалось записать набор настроек ${id} в хранилище ${storage === 'system' ? 'системы' : 'мира'}.`],
  [/^Unsupported settings preset action (.+)\.$/su, ([, action]) => `Неподдерживаемое действие с набором настроек: ${action}.`],
  [/^Settings preset (.+) was not found\.$/su, ([, id]) => `Набор настроек ${id} не найден.`],
  [/^Preset (.+) is owned by an active module and cannot be modified\.$/su, ([, name]) => `Набор настроек ${name} принадлежит активному модулю и не может быть изменён.`]
];
const PRESET_ERROR_SOURCES = Object.freeze({
  system: 'система', world: 'мир', preset: 'набор настроек', active: 'активный набор',
  main: 'основной набор', default: 'значение по умолчанию', fallback: 'резервный источник'
});

function translatePresetDetails(details, translate) {
  return details.split('\n- ').map(detail => {
    const match = /^(dark-heresy-2e-apex\.[^\s]+): (.+)$/su.exec(detail);
    return match ? `${match[1]}: ${translate(match[2])}` : translate(detail);
  }).join('\n- ');
}

function translatePresetErrorAtDepth(message, depth) {
  if (typeof message !== 'string' || depth > 20) return message;
  if (Object.hasOwn(PRESET_ERRORS, message)) return PRESET_ERRORS[message];
  const translate = cause => translatePresetErrorAtDepth(cause, depth + 1);
  for (const [pattern, replace] of PRESET_ERROR_PATTERNS) {
    const match = pattern.exec(message);
    if (match?.[0].length === message.length) return replace(match, translate);
  }
  // The manager combines storage/candidate failures with these literal labels.
  // Split only at another source label so punctuation in external causes survives.
  if (/^(?:system|world|preset|active|main|default|fallback): /u.test(message)) {
    return message.split(/; (?=(?:system|world|preset|active|main|default|fallback): )/u).map(part => {
      const match = /^(system|world|preset|active|main|default|fallback): (.*)$/su.exec(part);
      return match ? `${PRESET_ERROR_SOURCES[match[1]]}: ${translate(match[2])}` : part;
    }).join('; ');
  }
  return message;
}

/** For preset-owned display fields only; unknown diagnostic payloads survive. */
export function translatePresetError(message) {
  return translatePresetErrorAtDepth(message, 0);
}

/** Source messages, scoped preset errors and first-aid suffixes retaining item names. */
export function translateRuntimeNotification(message) {
  if (typeof message !== 'string') return message;
  if (Object.hasOwn(NOTIFICATION_TEXT, message)) return NOTIFICATION_TEXT[message];
  if (message.startsWith(PRESET_ERROR_PREFIX)) {
    return PRESET_ERROR_PREFIX + translatePresetError(message.slice(PRESET_ERROR_PREFIX.length));
  }
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
const VEHICLE_NAMES = new Map(Object.values(vehicleProfiles.displayProfiles).map(profile => [profile.en, profile.ru]));
const FORMAT_FIELDS = new Map([
  ['FALLOUTMAW.Settings.Presets.Errors.OperationFailed', {field: 'message', translate: translatePresetError}],
  ['FALLOUTMAW.DH2E.Talents.Unmet', {field: 'list', translate: translateTalentRequirementList}],
  ['FALLOUTMAW.DH2E.Talents.Manual', {field: 'list', translate: translateTalentRequirementList}],
  ['FALLOUTMAW.DH2E.Vehicle.RepairMissing', {field: 'skills', translate: translateVehicleRepairRequirements}],
  ['FALLOUTMAW.DH2E.Vehicle.OperateHint', {field: 'skill', translate: translateStockSkillLabel}],
  ['FALLOUTMAW.DH2E.Vehicle.Applied', {
    field: 'name',
    translate: value => VEHICLE_NAMES.get(value) ?? value
  }],
  ['FALLOUTMAW.DH2E.Npc.NoRoom', {
    field: 'name',
    translate: value => Object.hasOwn(vehicleProfiles.weapons, value) ? vehicleProfiles.weapons[value].nameRu : value
  }],
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
  for (const method of ['warn', 'info', 'error']) {
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
