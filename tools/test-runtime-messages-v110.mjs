import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import progression from '../scripts/progression-data.mjs';
import {translateAdvancementRuleText} from '../scripts/progression-ui-adapter.mjs';
import {
  translateRuntimeNotification,
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
  'Use interrupted. The item is kept for GM review; the effect will not repeat.'
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
const wrappedFormat = game.i18n.format;
assert.equal(registerRuntimeMessageLocalization(dependencies), state);
assert.equal(hooks.get('init').length, 1);
assert.equal(hooks.get('ready').length, 1);
for (const callbacks of hooks.values()) for (const callback of callbacks) callback();
assert.equal(notifications.warn, wrappedWarn);
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
game.i18n.format('CustomModule.Key', originalData);
assert.equal(formatCalls.at(-1).args[1], originalData);
game.i18n.format('FALLOUTMAW.DH2E.Talents.Unmet');
assert.equal(formatCalls.at(-1).args.length, 1);

for (const disabled of ['language', 'system']) {
  if (disabled === 'language') game.i18n.lang = 'en';
  else { game.i18n.lang = 'ru'; game.system.id = 'another-system'; }
  notifications.warn(fixedMessages[0]);
  assert.equal(calls.at(-1).args[0], fixedMessages[0]);
  game.i18n.format('FALLOUTMAW.DH2E.Talents.Unmet', originalData);
  assert.equal(formatCalls.at(-1).args[1], originalData);
}
game.system.id = 'dark-heresy-2e-apex';
notifications.warn(fixedMessages[0]);
assert.notEqual(calls.at(-1).args[0], fixedMessages[0]);
assert.deepEqual(installRuntimeMessageLocalization({game: null, notifications: null}), {warn: false, info: false, format: false});

console.log('PASS runtime messages v1.1.0 — 13 notification forms, stock prerequisites, vehicle parameters, lifecycle, API behavior and language gating');
