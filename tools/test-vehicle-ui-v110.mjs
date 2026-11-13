import assert from 'node:assert/strict';
import {
  vehicleTraitSources, localizeVehicleContext, translateVehicleRepairOption,
  translateVehicleUnit, applyVehicleUiTranslations, applyVehicleChatTranslations,
  registerVehicleUiAdapter
} from '../scripts/vehicle-ui-l10n.mjs';

const game = {system: {id: 'dark-heresy-2e-apex'}, i18n: {lang: 'ru'}};
const stock = Object.entries(vehicleTraitSources);
assert.equal(stock.length, 19);
const vehicle = {
  traits: stock.map(([key, row]) => ({key, name: row.en, summary: `${row.summary} (p. ${row.page})`, fixed: true})),
  traitChoices: stock.map(([key, row]) => ({key, label: row.en})),
  crew: [{name: 'John', skill: {label: 'BS', value: 41}}, {name: 'Jan', skill: {label: 'Operate (Surface)', value: 22}}],
  notes: 'My custom vehicle', tacticalSpeed: 9, typeKey: 'wheeled'
};
const original = JSON.stringify(vehicle);
const result = localizeVehicleContext(vehicle);
assert.equal(JSON.stringify(vehicle), original);
for (let index = 0; index < stock.length; index++) {
  const [key, row] = stock[index];
  assert.equal(result.traits[index].key, key);
  assert.notEqual(result.traits[index].name, row.en, key);
  assert.equal(result.traits[index].summary, `${row.summaryRu} (стр. ${row.page})`);
  assert.equal(result.traits[index].fixed, true);
  assert.equal(result.traitChoices[index].key, key);
  assert.equal(result.traitChoices[index].label, result.traits[index].name);
}
assert.equal(result.crew[0].skill.label, 'НС');
assert.equal(result.crew[0].skill.value, 41);
assert.match(result.crew[1].skill.label, /Управление/);
assert.equal(result.crew[1].name, 'Jan');
assert.equal(result.notes, vehicle.notes);
assert.deepEqual(localizeVehicleContext(result), result);
const custom = {traits: [{key: 'amphibious', name: 'My amphibian', summary: 'Custom rule'}], crew: [{skill: {label: 'Custom skill', value: 20}}]};
assert.deepEqual(localizeVehicleContext(custom), custom);
assert.equal(localizeVehicleContext(null), null);

class TextNode { constructor(value) { this.nodeType = 3; this.nodeValue = value; } }
class Element {
  constructor(text = '', attrs = {}) { this.nodeType = 1; this.childNodes = [new TextNode(text)]; this.attrs = {...attrs}; this.options = []; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  get textContent() { return this.childNodes.filter(n => n.nodeType === 3).map(n => n.nodeValue).join(''); }
  set textContent(value) { this.childNodes = [new TextNode(value)]; }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  matches() { return false; }
}
const locations = [
  [30, 'Revered and ancient forge world; well-stocked repair facility.'],
  [20, 'Field base with ample supplies; hive world of superior manufacturing prowess.'],
  [10, 'Area free from enemy fire; field encampment with basic supplies; hive world of standard prowess.'],
  [0, 'Required tools and supplies; calm weather or away from enemy fire.'],
  [-10, 'Rudimentary or faulty tools; close to battlefields; run-down forge world; open without facilities; inclement weather.'],
  [-20, 'Ruined forge world; storms, blizzards or sandstorms; insect swarms; under bombardment; primitive locale.'],
  [-30, 'Blistering desert or ice sheet; dense jungle; poorly-supplied field base; ongoing battle; orbital bombardment; cult-dominated region.']
];
function repairRoot() {
  const root = new Element();
  const location = new Element();
  location.options = locations.map(([value, label]) => new Element(`${value >= 0 ? '+' : ''}${value}: ${label}`, {value: String(value)}));
  const condition = new Element(); condition.options = [new Element('Лёгкие повреждения', {value: 'lightlyDamaged'})];
  const mode = new Element(); mode.options = ['normal', 'rush', 'careful'].map(value => new Element(value, {value}));
  const selects = {'select[name="condition"]': condition, 'select[name="location"]': location, 'select[name="mode"]': mode};
  root.querySelector = selector => selects[selector] ?? null;
  root.location = location;
  return root;
}
class DialogV2 {}
const repair = repairRoot();
const values = repair.location.options.map(o => o.getAttribute('value'));
assert.equal(applyVehicleUiTranslations(new DialogV2(), repair, {game}).translated, 7);
for (const option of repair.location.options) assert.match(option.textContent, /[А-Яа-яЁё]/u);
assert.deepEqual(repair.location.options.map(o => o.getAttribute('value')), values);
assert.equal(applyVehicleUiTranslations(new DialogV2(), repair, {game}).translated, 0);
const edited = repairRoot(); edited.location.options[0].textContent = 'My custom repair shop';
assert.equal(applyVehicleUiTranslations(new DialogV2(), edited, {game}).active, false);
assert.equal(applyVehicleUiTranslations({}, repairRoot(), {game}).active, false);
assert.equal(applyVehicleUiTranslations(new DialogV2(), repairRoot(), {game: {...game, i18n: {lang: 'en'}}}).active, false);
assert.equal(translateVehicleRepairOption(30, 'Personal custom location'), 'Personal custom location');
assert.equal(translateVehicleRepairOption(55, 'Unknown modifier'), 'Unknown modifier');

const first = vehicleTraitSources.amphibious;
const chip = new Element(`${first.en} `, {'data-tooltip': `${first.summary} (p. ${first.page})`});
const button = new Element('×', {'data-key': 'amphibious'}); chip.childNodes.push(button);
const option = new Element(first.en, {value: 'amphibious'});
const crewSkill = new Element('BS '); const score = new Element('41'); crewSkill.childNodes.push(score);
const panel = new Element(); panel.matches = selector => selector === '.dh2e-veh';
panel.querySelectorAll = selector => ({
  '[data-dh2e-vehicle-add="traits"] option[value]': [option],
  '.apex-chip[data-tooltip]': [chip],
  '.dh2e-veh-crewrow > .skill': [crewSkill]
})[selector] ?? [];
assert.equal(applyVehicleUiTranslations({}, panel, {game}).translated, 4);
assert.equal(option.getAttribute('value'), 'amphibious');
assert.equal(chip.childNodes[1], button);
assert.equal(crewSkill.childNodes[1], score);
assert.equal(crewSkill.childNodes[0].nodeValue, 'НС ');
assert.equal(applyVehicleUiTranslations({}, panel, {game}).translated, 0);

assert.equal(translateVehicleUnit('12 m'), '12 м');
assert.equal(translateVehicleUnit(' 1.5 h '), ' 1.5 ч ');
assert.equal(translateVehicleUnit('Actor 12 m'), 'Actor 12 m');
const metres = new Element('12 m'), hours = new Element('1.5 h'), customValue = new Element('My 12 m');
const card = new Element(); card.matches = selector => selector === '.dh2e-vehicle-card';
card.querySelectorAll = selector => selector === 'p > b' ? [metres, hours, customValue] : [];
assert.equal(applyVehicleChatTranslations({}, card, {game}).translated, 2);
assert.equal(customValue.textContent, 'My 12 m');
assert.equal(applyVehicleChatTranslations({}, card, {game}).translated, 0);
assert.equal(applyVehicleChatTranslations({}, card, {game: {...game, system: {id: 'other'}}}).active, false);

const callbacks = new Map(); const calls = [];
const Hooks = {on(name, callback) { callbacks.set(name, callback); calls.push(name); return name; }, off(name) { callbacks.delete(name); }};
let currentGame = game;
const registered = registerVehicleUiAdapter({Hooks, game: () => currentGame});
assert.equal(registerVehicleUiAdapter({Hooks}), registered);
assert.equal(calls.length, 2);
const fromHook = repairRoot(); callbacks.get('renderApplicationV2')(new DialogV2(), fromHook);
assert.match(fromHook.location.options[0].textContent, /[А-Яа-яЁё]/u);
currentGame = {...game, i18n: {lang: 'en'}};
const english = repairRoot(); callbacks.get('renderApplicationV2')(new DialogV2(), english);
assert.match(english.location.options[0].textContent, /Revered/);
registered.dispose(); registered.dispose(); assert.equal(callbacks.size, 0);
console.log('v1.1.0 vehicle traits, repair forms, crew, chat units and lifecycle: PASS');
