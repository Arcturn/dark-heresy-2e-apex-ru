import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import progression from '../scripts/progression-data.mjs';
import vehicleProfiles from '../scripts/vehicle-profile-data.mjs';
import {translateAdvancementRuleText} from '../scripts/progression-ui-adapter.mjs';
import {
  translateRuntimeNotification,
  translatePresetError,
  translateTalentRequirementList,
  translateVehicleRepairRequirements,
  installRuntimeMessageLocalization,
  registerRuntimeMessageLocalization
} from '../scripts/runtime-message-l10n.mjs';

const fixedMessages = [
  'No active GM is available to apply damage.',
  'No GM response was received for damage application.',
  'No GM response was received for damage hub action.',
  'No active GM is available to create a first aid effect.',
  'No active GM is available to create a first aid withdrawal effect.',
  'No active GM is available to remove first aid effects.',
  'The item is already being used. Wait for the action to finish.',
  'The previous use is already paid for. The effect is not repeated.',
  'The previous use is complete. The effect is not repeated.',
  'The previous item use is unfinished. The GM must check the effect and either consume or release the item.',
  'Use interrupted. The item is kept for GM review; the effect will not repeat.',
  'Natural race weapons cannot be deleted from an actor.'
];
for (const english of fixedMessages) {
  const russian = translateRuntimeNotification(english);
  assert.notEqual(russian, english);
  assert.doesNotMatch(russian, /[A-Za-z]{2,}/u);
  assert.equal(translateRuntimeNotification(russian), russian);
}
assert.equal(translateRuntimeNotification('Medkit Alpha: item is depleted.'), 'Medkit Alpha: предмет израсходован.');
assert.equal(translateRuntimeNotification('Комплект: Alpha: not enough charges.'), 'Комплект: Alpha: недостаточно зарядов.');
assert.equal(translateRuntimeNotification('GM notes: keep the item for review.'), 'GM notes: keep the item for review.');
assert.equal(translateRuntimeNotification('No active GM is available to apply damage. Custom note'), 'No active GM is available to apply damage. Custom note');
const objectMessage = {message: fixedMessages[0]};
assert.equal(translateRuntimeNotification(objectMessage), objectMessage);
assert.equal(translateRuntimeNotification(null), null);

const presetPrefix = 'Dark Heresy 2E [Apex Edition]: ';
const presetErrors = [
  'A base Dark Heresy 2E [Apex Edition] preset cannot be deleted.',
  'No settings were selected for migration.',
  'Portable preset deletion markers are no longer supported.',
  'A pending settings preset file could not be synchronized during refresh.',
  'A pending settings preset file could not be recovered during startup.',
  'A previous settings preset write is still pending and must be synchronized first.',
  'Pending preset backup is unavailable.',
  'Settings preset state is not registered.',
  'Foundry did not materialize every managed Setting document.',
  'Foundry rejected one or more operations in the atomic settings batch.',
  'Foundry rejected Setting document materialization before preset application.',
  'Foundry game socket is unavailable.',
  'Foundry FilePicker is unavailable.',
  'Only an active GM may request settings preset mutations.',
  'Only the active GM client can process settings preset mutations.',
  'No active GM is available to manage settings presets.',
  'Preset name cannot be empty.',
  'Preset name cannot exceed 200 characters.',
  'Preset name contains control characters.',
  'A preset setting value is not JSON-safe.',
  'Preset application failed and its previous settings could not be fully restored.',
  'The Dark Heresy 2E [Apex Edition] server file-delete adapter did not respond. Fully restart Foundry after installing the current server patch.',
  'Only a GM can manage settings presets.',
  "A base Dark Heresy 2E [Apex Edition] preset cannot be a tombstone.",
  "Only the live main Dark Heresy 2E [Apex Edition] preset can be cloned.",
  "Only a live Dark Heresy 2E [Apex Edition] base preset can be cloned.",
  "A cloned preset must use a new id.",
  "Preset settings must be an array.",
  "A preset tombstone cannot contain settings.",
  "Preset saves must be an array.",
  "A preset tombstone cannot contain saves.",
  "Preset system and systemId must match.",
  "Preset id must be a safe non-empty file id.",
  "Preset name must be a string.",
  "Preset systemVersion must be a non-empty string or null.",
  "Preset updatedAt must be an ISO date string or null.",
  "Preset revision must be a lowercase SHA-256 hex digest.",
  "Preset format must be dark-heresy-2e-apex-settings-preset.",
  "Preset schemaVersion must be 1.",
  "Preset systemId must be dark-heresy-2e-apex.",
  "Preset name must contain 1-200 printable characters.",
  "Preset deleted must be a boolean.",
  "systemPresets must be an array.",
  "worldPresets must be an array.",
  "Preset document must be a plain object.",
  "Legacy settings baseline must be a plain object.",
  "Legacy settings baseline.settings must be a plain object.",
  "Preset revision input must be a plain object.",
  'Unknown settings preset error.'
];
for (const english of presetErrors) {
  const russian = translatePresetError(english);
  assert.match(russian, /[А-Яа-яЁё]/u);
  assert.equal(translatePresetError(russian), russian);
  assert.equal(translateRuntimeNotification(presetPrefix + english), presetPrefix + russian);
  assert.equal(translateRuntimeNotification(english), english, 'bare errors have no preset context');
  assert.equal(translateRuntimeNotification('OtherModule: ' + english), 'OtherModule: ' + english);
  assert.equal(translateRuntimeNotification(presetPrefix + english + ' Custom details'), presetPrefix + english + ' Custom details');
}
assert.equal(translatePresetError('Preset name cannot be empty.'), 'Название набора настроек не может быть пустым.');
assert.equal(translatePresetError('A pending settings preset file could not be recovered during startup.'), 'При запуске не удалось восстановить файл набора настроек с незавершённой записью.');
assert.equal(translatePresetError('A previous settings preset write is still pending and must be synchronized first.'), 'Предыдущая запись набора настроек ещё не завершена. Сначала необходимо выполнить синхронизацию.');
const customPresetError = 'My custom storage rejected preset Alpha.';
assert.equal(translatePresetError(customPresetError), customPresetError);
assert.equal(translateRuntimeNotification(presetPrefix + customPresetError), presetPrefix + customPresetError);
assert.equal(translatePresetError(objectMessage), objectMessage);

const schemaDynamicErrors = [
  [
    "Value at $.speed must be a finite JSON number.",
    "Значение по пути $.speed должно быть конечным числом JSON."
  ],
  [
    "Value at $.custom is not JSON-safe.",
    "Значение по пути $.custom невозможно безопасно представить в формате JSON."
  ],
  [
    "Value at $.self contains a circular reference.",
    "Значение по пути $.self содержит циклическую ссылку."
  ],
  [
    "Value at $.values[2] contains a sparse array slot.",
    "По пути $.values[2] отсутствует элемент массива."
  ],
  [
    "Value at $.custom contains symbol keys.",
    "Значение по пути $.custom содержит ключи типа Symbol."
  ],
  [
    "Preset alpha has an invalid revision.",
    "У набора alpha неверная ревизия."
  ],
  [
    "Preset settings[2].id must be a dark-heresy-2e-apex setting id.",
    "Поле settings[2].id набора должно содержать идентификатор настройки dark-heresy-2e-apex."
  ],
  [
    "Preset settings contains duplicate id dark-heresy-2e-apex.foo.",
    "В настройках набора повторяется идентификатор dark-heresy-2e-apex.foo."
  ],
  [
    "Preset setting dark-heresy-2e-apex.foo must use world scope.",
    "Настройка набора dark-heresy-2e-apex.foo должна иметь область действия world."
  ],
  [
    "Preset setting dark-heresy-2e-apex.foo must contain a value.",
    "Настройка набора dark-heresy-2e-apex.foo должна содержать значение."
  ],
  [
    "Preset saves contains duplicate id save-1.",
    "В сохранённых версиях набора повторяется идентификатор save-1."
  ],
  [
    "Preset saves[0].createdAt is required.",
    "Поле saves[0].createdAt набора обязательно."
  ],
  [
    "Preset save save-1 has an invalid revision.",
    "У сохранённой версии набора save-1 неверная ревизия."
  ],
  [
    "worldPresets contains duplicate preset id alpha.",
    "В поле worldPresets повторяется идентификатор набора alpha."
  ],
  [
    "Preset setting dark-heresy-2e-apex.foo.value is not JSON-safe: Plugin custom failure",
    "Значение настройки набора dark-heresy-2e-apex.foo невозможно безопасно представить в формате JSON: Plugin custom failure"
  ],
  [
    "Preset saves[1] must be a plain object.",
    "Элемент saves[1] набора должен быть обычным объектом."
  ],
  [
    "Preset settings[1] contains unsupported key surprise.",
    "Элемент settings[1] набора содержит неподдерживаемый ключ surprise."
  ]
];
const settingId = 'dark-heresy-2e-apex.custom$Setting';
const presetDynamicErrors = [
  ...schemaDynamicErrors,
  ['Preset save Alpha-v2 was not found.', 'Сохранённая версия набора настроек Alpha-v2 не найдена.'],
  ['Setting otherModule.setting is not managed by presets.', 'Настройка otherModule.setting не управляется наборами настроек.'],
  ['Cannot load bundled settings preset: 503 My Server Message', 'Не удалось загрузить встроенный набор настроек: 503 My Server Message'],
  ['Bundled settings preset has unexpected id Alpha-v2.', 'Встроенный набор настроек имеет неожиданный идентификатор Alpha-v2.'],
  [`Cannot capture 1 managed setting(s):\n- ${settingId}: ${settingId} must be a string.`, `Не удалось сохранить управляемые настройки (1):\n- ${settingId}: ${settingId} должно быть строкой.`],
  ['Cannot activate deleted settings preset Alpha-v2.', 'Нельзя активировать удалённый набор настроек Alpha-v2.'],
  ['Preset Alpha$ & Бета was not applied atomically: Custom backend: bad request; try later', 'Набор настроек Alpha$ & Бета не был применён как единое целое: Custom backend: bad request; try later'],
  [`Previous Setting ${settingId} could not be restored.`, `Не удалось восстановить прежнюю настройку ${settingId}.`],
  [`Foundry did not return the materialized Setting ${settingId}.`, `Foundry не вернула созданный документ настройки ${settingId}.`],
  [`Preset Alpha$ & Бета contains 1 incompatible managed setting(s):\n- ${settingId}: preset: ${settingId} must be a string.; default: Custom validator said no`, `Набор настроек Alpha$ & Бета содержит несовместимые управляемые настройки (1):\n- ${settingId}: набор настроек: ${settingId} должно быть строкой.; значение по умолчанию: Custom validator said no`],
  [`${settingId} must be an object or array.`, `${settingId} должно быть объектом или массивом.`],
  [`${settingId} must be an array.`, `${settingId} должно быть массивом.`],
  [`${settingId} must be a string.`, `${settingId} должно быть строкой.`],
  [`${settingId} must be a finite number.`, `${settingId} должно быть конечным числом.`],
  [`${settingId} must be a boolean.`, `${settingId} должно быть логическим значением.`],
  [`${settingId} has an invalid value: Custom backend: bad request; try later`, `${settingId} имеет недопустимое значение: Custom backend: bad request; try later`],
  [`${settingId} must be one of the registered choices.`, `${settingId} должно быть одним из зарегистрированных вариантов.`],
  ['Preset Alpha-v2 still has an unresolved file write.', 'Запись файла набора настроек Alpha-v2 ещё не завершена.'],
  ['Failed to persist preset Alpha-v2.', 'Не удалось сохранить набор настроек Alpha-v2.'],
  ['Settings preset id Alpha-v2 is provided by multiple active modules.', 'Набор настроек с идентификатором Alpha-v2 предоставляется несколькими активными модулями.'],
  ['Manifest id Alpha-v2 does not match document id Beta-v3.', 'Идентификатор манифеста Alpha-v2 не совпадает с идентификатором документа Beta-v3.'],
  ['Invalid module settings preset path ../Alpha-v2.json.', 'Недопустимый путь к набору настроек модуля: ../Alpha-v2.json.'],
  ['Cannot browse settings preset directory C:/My Presets: Custom backend: bad request; try later', 'Не удалось просмотреть каталог наборов настроек C:/My Presets: Custom backend: bad request; try later'],
  ['Duplicate settings preset id Alpha-v2.', 'Повторяющийся идентификатор набора настроек Alpha-v2.'],
  ['Settings preset ids Alpha-v2 and ALPHA-V2 collide on this filesystem.', 'Идентификаторы наборов настроек Alpha-v2 и ALPHA-V2 конфликтуют в этой файловой системе.'],
  ['Foundry did not confirm physical deletion of settings preset Alpha-v2.', 'Foundry не подтвердила физическое удаление набора настроек Alpha-v2.'],
  ['Cannot create settings preset backup directory C:/My Presets: Custom backend: bad request; try later', 'Не удалось создать каталог резервных копий наборов настроек C:/My Presets: Custom backend: bad request; try later'],
  ['Failed to write preset Alpha-v2 to system storage.', 'Не удалось записать набор настроек Alpha-v2 в хранилище системы.'],
  ['Unsupported settings preset action customAction.', 'Неподдерживаемое действие с набором настроек: customAction.'],
  ['Settings preset Alpha-v2 was not found.', 'Набор настроек Alpha-v2 не найден.'],
  ['Preset Alpha$ & Бета is owned by an active module and cannot be modified.', 'Набор настроек Alpha$ & Бета принадлежит активному модулю и не может быть изменён.']
];
for (const [english, russian] of presetDynamicErrors) {
  assert.equal(translatePresetError(english), russian);
  assert.equal(translatePresetError(russian), russian, 'translated errors must be idempotent');
  assert.equal(translateRuntimeNotification(presetPrefix + english), presetPrefix + russian);
  assert.equal(translateRuntimeNotification(english), english);
  assert.equal(translateRuntimeNotification('OtherModule: ' + english), 'OtherModule: ' + english);
}
assert.equal(translatePresetError('Failed to write preset Alpha-v2 to world storage.'), 'Не удалось записать набор настроек Alpha-v2 в хранилище мира.');
assert.equal(translatePresetError('system: Custom storage cause; keep punctuation; world: Foundry FilePicker is unavailable.'), 'система: Custom storage cause; keep punctuation; мир: Средство выбора файлов Foundry недоступно.');
assert.equal(translatePresetError('Preset Alpha was not applied atomically: Preset name cannot be empty.'), 'Набор настроек Alpha не был применён как единое целое: Название набора настроек не может быть пустым.');
for (const external of ['503 External Server Message', 'MyField must be a string.', 'A story about Preset Alpha-v2 was not found.', 'Settings preset Alpha-v2 was not found. Extra details', 'Something else: Preset name cannot be empty.']) {
  assert.equal(translatePresetError(external), external);
}
assert.equal(translatePresetError('Value at $.custom\nproperty must be a plain object.'), 'Значение по пути $.custom\nproperty должно быть обычным объектом.');
assert.equal(translatePresetError('Preset settings[3] must be a plain object.'), 'Элемент settings[3] набора должен быть обычным объектом.');
assert.equal(translatePresetError('Preset document contains unsupported key custom\nproperty.'), 'Документ набора содержит неподдерживаемый ключ custom\nproperty.');
assert.equal(translatePresetError('Preset saves[2] contains unsupported key customField.'), 'Элемент saves[2] набора содержит неподдерживаемый ключ customField.');
assert.equal(translatePresetError('Preset setting dark-heresy-2e-apex.foo.value is not JSON-safe: Value at $.speed must be a finite JSON number.'), 'Значение настройки набора dark-heresy-2e-apex.foo невозможно безопасно представить в формате JSON: Значение по пути $.speed должно быть конечным числом JSON.');
for (const external of ['Custom document must be a plain object.', 'Value at custom.path contains a circular reference.', 'Preset deleted must be a boolean.\n', 'Preset settings[3] must be a plain object.\n']) {
  assert.equal(translatePresetError(external), external, 'require exact stock schema context and whole-string match');
}

// All stock prerequisite text uses the same exact group catalog as the purchase path.
for (const [key, talent] of Object.entries(progression.talents)) {
  assert.doesNotMatch(translateTalentRequirementList(talent.prerequisites), /[A-Za-z]{2,}/u, key);
  assert.doesNotMatch(translateAdvancementRuleText(talent.prerequisites), /[A-Za-z]{2,}/u, key);
}
assert.equal(translateTalentRequirementList('Ballistic Skill 40 or Weapon Skill 40'), 'Навык Стрельбы 40 или Навык Рукопашной 40');
assert.equal(translateTalentRequirementList('Inquisitor elite advance, Rank 4 in selected skill'), 'Элитное улучшение «Инквизитор», Ранг 4 в выбранном навыке');
assert.equal(translateTalentRequirementList('Untouchable elite advance'), 'Элитное улучшение «Неприкасаемый»');
assert.equal(translateTalentRequirementList('  Strength of my custom oath,  Void Cult  '), '  Strength of my custom oath,  Void Cult  ');
assert.equal(translateTalentRequirementList('  Strength 40,  Void Cult  '), '  Сила 40,  Void Cult  ');
const paired = translateTalentRequirementList('Agility 45, Two-Weapon Wielder (Melee, Ranged)');
assert.equal(paired, 'Ловкость 45, Обоерукий воин (Рукопашный бой, Стрельба)');
assert.equal(translateTalentRequirementList(null), null);
assert.equal(translateVehicleRepairRequirements('repair|tradeArmourer, tradeTechnomat'), 'Техпользование или Ремесло (Оружейник), Ремесло (Техномат)');
assert.equal(translateVehicleRepairRequirements('essential'), 'Общие знания (Адептус Механикус) или Общие знания (Технологии) или Запретные знания (Адептус Механикус)');
assert.equal(translateVehicleRepairRequirements('repair|customSkill'), 'repair|customSkill');
const mirror = JSON.parse(await readFile(new URL('../data/progression-data.ru.json', import.meta.url), 'utf8'));
assert.deepEqual(mirror, progression, 'runtime MJS and JSON catalog must agree');

const hooks = new Map();
const Hooks = {once(name, callback) {
  const callbacks = hooks.get(name) ?? [];
  callbacks.push(callback);
  hooks.set(name, callbacks);
}};
const calls = [];
const result = {id: 'original-notification-result'};
const failure = new Error('Original notification failed');
const notifications = {
  warn(...args) {
    if (args[0] === 'throw') throw failure;
    calls.push({method: 'warn', receiver: this, args});
    return result;
  },
  info(...args) {
    calls.push({method: 'info', receiver: this, args});
    return result;
  },
  error(...args) {
    if (args[0] === 'throw') throw failure;
    calls.push({method: 'error', receiver: this, args});
    return result;
  }
};
const formatCalls = [];
const formatResult = {id: 'original-format-result'};
let game = {
  system: {id: 'dark-heresy-2e-apex'},
  i18n: {lang: 'ru', format(...args) {
    formatCalls.push({receiver: this, args});
    return formatResult;
  }}
};
const dependencies = {Hooks, game: () => game, ui: {notifications}};
const state = registerRuntimeMessageLocalization(dependencies);
const wrappedWarn = notifications.warn;
const wrappedError = notifications.error;
const wrappedFormat = game.i18n.format;
assert.equal(registerRuntimeMessageLocalization(dependencies), state);
assert.equal(hooks.get('init').length, 1);
assert.equal(hooks.get('ready').length, 1);
for (const callbacks of hooks.values()) for (const callback of callbacks) callback();
assert.equal(notifications.warn, wrappedWarn);
assert.equal(notifications.error, wrappedError);
assert.equal(game.i18n.format, wrappedFormat);

const options = Object.freeze({permanent: true});
assert.equal(notifications.warn(fixedMessages[0], options, 7), result);
assert.equal(calls.at(-1).receiver, notifications);
assert.deepEqual(calls.at(-1).args, [translateRuntimeNotification(fixedMessages[0]), options, 7]);
assert.equal(notifications.info(fixedMessages[7], options), result);
assert.notEqual(calls.at(-1).args[0], fixedMessages[7]);
assert.throws(() => notifications.warn('throw'), error => error === failure);
const alternateReceiver = {};
notifications.warn.call(alternateReceiver, fixedMessages[0]);
assert.equal(calls.at(-1).receiver, alternateReceiver);
for (const english of presetErrors) {
  assert.equal(notifications.error.call(alternateReceiver, presetPrefix + english, options, 9), result);
  assert.equal(calls.at(-1).method, 'error');
  assert.equal(calls.at(-1).receiver, alternateReceiver);
  assert.deepEqual(calls.at(-1).args, [presetPrefix + translatePresetError(english), options, 9]);
}
for (const [english, russian] of presetDynamicErrors) {
  notifications.error(presetPrefix + english, options);
  assert.deepEqual(calls.at(-1).args, [presetPrefix + russian, options]);
}
assert.throws(() => notifications.error('throw'), error => error === failure);
notifications.error(presetPrefix + customPresetError, options);
assert.deepEqual(calls.at(-1).args, [presetPrefix + customPresetError, options]);
notifications.error(objectMessage);
assert.equal(calls.at(-1).args[0], objectMessage);
notifications.error();
assert.equal(calls.at(-1).args.length, 0);

for (const english of presetErrors) {
  const payload = Object.freeze({message: english, details: options});
  assert.equal(game.i18n.format('FALLOUTMAW.Settings.Presets.Errors.OperationFailed', payload, options), formatResult);
  assert.deepEqual(formatCalls.at(-1).args, ['FALLOUTMAW.Settings.Presets.Errors.OperationFailed', {message: translatePresetError(english), details: options}, options]);
  assert.equal(payload.message, english);
  assert.equal(formatCalls.at(-1).args[1].details, options);
}
for (const [english, russian] of presetDynamicErrors) {
  const payload = Object.freeze({message: english, details: options});
  game.i18n.format('FALLOUTMAW.Settings.Presets.Errors.OperationFailed', payload);
  assert.deepEqual(formatCalls.at(-1).args[1], {message: russian, details: options});
  assert.equal(payload.message, english);
}
const customErrorPayload = Object.freeze({message: customPresetError});
game.i18n.format('FALLOUTMAW.Settings.Presets.Errors.OperationFailed', customErrorPayload);
assert.equal(formatCalls.at(-1).args[1], customErrorPayload);
const unrelatedErrorPayload = Object.freeze({message: presetErrors[0]});
game.i18n.format('OtherModule.Errors.OperationFailed', unrelatedErrorPayload);
assert.equal(formatCalls.at(-1).args[1], unrelatedErrorPayload);

const originalData = Object.freeze({list: 'Strength 40, Mechanicus Implants', other: options});
assert.equal(game.i18n.format('FALLOUTMAW.DH2E.Talents.Unmet', originalData, options), formatResult);
assert.equal(formatCalls.at(-1).receiver, game.i18n);
assert.deepEqual(formatCalls.at(-1).args, ['FALLOUTMAW.DH2E.Talents.Unmet', {list: 'Сила 40, Имплантаты Механикус', other: options}, options]);
assert.equal(originalData.list, 'Strength 40, Mechanicus Implants');
assert.equal(formatCalls.at(-1).args[1].other, options);
assert.notEqual(formatCalls.at(-1).args[1], originalData);
for (const key of ['FALLOUTMAW.DH2E.Talents.Manual']) {
  game.i18n.format(key, {list: 'Ferric Lure Implants'});
  assert.equal(formatCalls.at(-1).args[1].list, 'Имплантаты Железного Призыва');
}
game.i18n.format('FALLOUTMAW.DH2E.Vehicle.RepairMissing', {skills: 'repair|tradeArmourer'});
assert.equal(formatCalls.at(-1).args[1].skills, 'Техпользование или Ремесло (Оружейник)');
game.i18n.format('FALLOUTMAW.DH2E.Vehicle.OperateHint', {skill: 'Operate (Surface)'});
assert.equal(formatCalls.at(-1).args[1].skill, 'Управление (Наземный транспорт)');
for (const direction of ["45 degrees to the vehicle's left.", 'Straight ahead.', "45 degrees to the vehicle's right."]) {
  game.i18n.format('FALLOUTMAW.DH2E.Vehicle.OutOfControlMove', {direction, distance: 42});
  assert.doesNotMatch(formatCalls.at(-1).args[1].direction, /[A-Za-z]/u);
  assert.equal(formatCalls.at(-1).args[1].distance, 42);
}
const customSkill = {skill: 'Voidcraft of my own design'};
game.i18n.format('FALLOUTMAW.DH2E.Vehicle.OperateHint', customSkill);
assert.equal(formatCalls.at(-1).args[1], customSkill);
for (const profile of Object.values(vehicleProfiles.displayProfiles)) {
  const payload = Object.freeze({name: profile.en, actorId: 'existing-actor'});
  game.i18n.format('FALLOUTMAW.DH2E.Vehicle.Applied', payload);
  assert.equal(formatCalls.at(-1).args[1].name, profile.ru);
  assert.equal(formatCalls.at(-1).args[1].actorId, 'existing-actor');
  assert.equal(payload.name, profile.en, 'profile formatter must preserve input data');
}
for (const [name, weapon] of Object.entries(vehicleProfiles.weapons)) {
  const payload = Object.freeze({name, weaponKey: name});
  game.i18n.format('FALLOUTMAW.DH2E.Npc.NoRoom', payload);
  assert.equal(formatCalls.at(-1).args[1].name, weapon.nameRu);
  assert.equal(formatCalls.at(-1).args[1].weaponKey, name);
  assert.equal(payload.name, name, 'weapon formatter must preserve canonical input');
}
for (const key of ['FALLOUTMAW.DH2E.Vehicle.Applied', 'FALLOUTMAW.DH2E.Npc.NoRoom']) {
  for (const name of ['My Custom Chimera', 'Autogun of Hope', 'constructor', 'Химера игрока']) {
    const payload = Object.freeze({name});
    game.i18n.format(key, payload);
    assert.equal(formatCalls.at(-1).args[1], payload, 'custom label must retain its original payload');
  }
}
const unrelatedVehicle = {name: Object.values(vehicleProfiles.displayProfiles)[0].en};
game.i18n.format('CustomModule.NamedActor', unrelatedVehicle);
assert.equal(formatCalls.at(-1).args[1], unrelatedVehicle);
game.i18n.format('CustomModule.Key', originalData);
assert.equal(formatCalls.at(-1).args[1], originalData);
game.i18n.format('FALLOUTMAW.DH2E.Talents.Unmet');
assert.equal(formatCalls.at(-1).args.length, 1);

for (const disabled of ['language', 'system']) {
  if (disabled === 'language') game.i18n.lang = 'en';
  else { game.i18n.lang = 'ru'; game.system.id = 'another-system'; }
  notifications.warn(fixedMessages[0]);
  assert.equal(calls.at(-1).args[0], fixedMessages[0]);
  notifications.error(presetPrefix + presetErrors[0]);
  assert.equal(calls.at(-1).args[0], presetPrefix + presetErrors[0]);
  game.i18n.format('FALLOUTMAW.Settings.Presets.Errors.OperationFailed', unrelatedErrorPayload);
  assert.equal(formatCalls.at(-1).args[1], unrelatedErrorPayload);
  game.i18n.format('FALLOUTMAW.DH2E.Talents.Unmet', originalData);
  assert.equal(formatCalls.at(-1).args[1], originalData);
}
game.system.id = 'dark-heresy-2e-apex';
notifications.warn(fixedMessages[0]);
assert.notEqual(calls.at(-1).args[0], fixedMessages[0]);
assert.deepEqual(installRuntimeMessageLocalization({game: null, notifications: null}), {warn: false, info: false, error: false, format: false});

console.log('PASS runtime messages v1.1.0 — 14 notification forms, 49 fixed and 48 dynamic scoped preset error families, stock prerequisites, vehicle parameters, lifecycle, API behavior and language gating');
