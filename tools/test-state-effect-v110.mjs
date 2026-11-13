import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  stateEffectSources, translateStateEffectDescription, translateStateEffectName, translateNewStateEffect,
  translateStateStatusDefinitions, installStateEffectView, registerStateEffectTranslations
} from '../scripts/state-effect-l10n.mjs';

const SYSTEM = 'dark-heresy-2e-apex';
const translations = JSON.parse(fs.readFileSync(new URL('../lang/ru.json', import.meta.url), 'utf8'));
const game = {system: {id: SYSTEM}, i18n: {lang: 'ru', localize: key => translations[key] ?? key}};
const english = {...game, i18n: {...game.i18n, lang: 'en'}};
const entries = Object.entries(stateEffectSources);
assert.equal(entries.length, 39);
const markup = (rule, page, word = 'p.') => `<p>${rule}</p><p><em>Dark Heresy ${word} ${page}</em></p>`;
const stock = (id, entry) => ({name: entry.name, description: markup(entry.rule, entry.page), flags: {[SYSTEM]: {dh2eState: id}}});
for (const [id, entry] of entries) {
  const rule = translations[`FALLOUTMAW.DH2E.States.${id}.Rule`];
  assert.match(rule, /[А-Яа-яЁё]/u, id);
  const target = markup(rule, entry.page, 'стр.');
  assert.equal(translateStateEffectDescription(id, markup(entry.rule, entry.page), game), target, id);
  assert.equal(translateStateEffectDescription(id, markup(rule, entry.page), game), target, id);
  assert.equal(translateStateEffectDescription(id, target, game), target, id);
  assert.equal(translateStateEffectDescription(id, `${markup(entry.rule, entry.page)}<p>House rule</p>`, game), `${markup(entry.rule, entry.page)}<p>House rule</p>`);
  assert.equal(translateStateEffectDescription(id, markup(entry.rule, entry.page + 1), game), markup(entry.rule, entry.page + 1));
  assert.equal(translateStateEffectDescription(id, markup(entry.rule, entry.page), english), markup(entry.rule, entry.page));
}
assert.equal(translateStateEffectDescription('custom', 'My rule', game), 'My rule');
assert.equal(translateStateEffectDescription(entries[0][0], null, game), null);

function pending(source, parent = 'Actor') {
  return {parent: {documentName: parent}, updates: [], toObject: () => structuredClone(source), updateSource(value) {this.updates.push(value);}};
}
const [id, entry] = entries[0];
const source = stock(id, entry);
const expected = markup(translations[`FALLOUTMAW.DH2E.States.${id}.Rule`], entry.page, 'стр.');
const expectedName = translations[`FALLOUTMAW.DH2E.States.${id}.Name`];
const effect = pending(source);
assert.equal(translateNewStateEffect(effect, source, {game}), true);
assert.deepEqual(effect.updates, [{description: expected, name: expectedName}]);
assert.equal(source.name, entry.name);
assert.equal(source.description, markup(entry.rule, entry.page));
const renamed = pending({...source, name: 'My state'});
translateNewStateEffect(renamed, source, {game});
assert.deepEqual(renamed.updates, [{description: expected}]);
const nameOnly = pending({...source, description: expected});
assert.equal(translateNewStateEffect(nameOnly, source, {game}), true);
assert.deepEqual(nameOnly.updates, [{name: expectedName}]);
const custom = pending({...source, description: 'Custom description'});
assert.equal(translateNewStateEffect(custom, source, {game}), false);
assert.deepEqual(custom.updates, []);
assert.equal(translateNewStateEffect(pending(source, 'Item'), source, {game}), false);
assert.equal(translateNewStateEffect(pending({...source, flags: {}}), source, {game}), false);
assert.equal(translateNewStateEffect(pending(source), source, {game: english}), false);
// A prior hook's pending edits win over the original creation data.
assert.equal(translateNewStateEffect(pending({...source, description: 'Prior hook'}), source, {game}), false);

const statuses = entries.map(([key, row]) => ({id: key, img: row.img, description: markup(row.rule, row.page)}));
statuses.push({id, img: 'modules/custom/icon.webp', description: source.description});
statuses.push({id, img: `systems/${SYSTEM}/icons/effects/test.webp`, description: 'Custom description'});
assert.equal(translateStateStatusDefinitions({game, CONFIG: {statusEffects: statuses}}), 39);
assert.equal(translateStateStatusDefinitions({game, CONFIG: {statusEffects: statuses}}), 0);
assert.equal(statuses[39].description, source.description);
assert.equal(statuses[40].description, 'Custom description');

let activeGame = game;
class EffectSheet {
  constructor(context) { this.context = context; this.document = {parent: {documentName: 'Actor'}}; }
  async _prepareContext() { return this.context; }
  _processFormData(...args) { this.args = args; return args.at(-1); }
}
assert.equal(installStateEffectView(EffectSheet, {game: () => activeGame}), true);
assert.equal(installStateEffectView(EffectSheet, {game: () => activeGame}), true);
const sheet = new EffectSheet({source, other: 'Unchanged'});
const view = await sheet._prepareContext();
assert.equal(view.source.description, expected);
assert.equal(view.source.name, expectedName);
assert.equal(view.other, 'Unchanged');
assert.equal(sheet.context.source, source);
assert.equal(source.description, markup(entry.rule, entry.page));
const event = {};
const unchanged = {description: expected, name: expectedName, disabled: true};
assert.deepEqual(sheet._processFormData(event, null, unchanged), {...unchanged, name: source.name, description: source.description});
assert.equal(unchanged.description, expected, 'submission object is not mutated');
assert.equal(sheet.args[0], event);
assert.deepEqual(sheet._processFormData(event, null, {...unchanged, description: `${expected}<p>Моя поправка</p>`, name: 'Моё состояние'}), {...unchanged, description: `${expected}<p>Моя поправка</p>`, name: 'Моё состояние'});
const customSheet = new EffectSheet({source: {...source, description: 'Custom'}});
assert.equal(await customSheet._prepareContext(), customSheet.context);
const nameOnlySheet = new EffectSheet({source: {...source, description: expected}});
const nameOnlyView = await nameOnlySheet._prepareContext();
assert.equal(nameOnlyView.source.name, expectedName);
assert.equal(nameOnlyView.source.description, expected);
assert.equal(nameOnlySheet._processFormData(null, null, nameOnlyView.source).name, source.name);
const freeId = 'dh2e-free-attack', freeSource = stateEffectSources[freeId];
const freeRu = translations[`FALLOUTMAW.DH2E.States.${freeId}.Name`];
for (const [suffix, translatedSuffix] of [['Multiple Arms','Множество рук'],['Devastating Assault','Неостановимый Натиск'],['Counter Attack','Контратака']]) {
  const target = `${freeRu}: ${translatedSuffix}`;
  for (const base of [freeSource.name, freeRu]) {
    const value = `${base}: ${suffix}`;
    assert.equal(translateStateEffectName(freeId, value, game), target);
    const namedSource = {...stock(freeId, freeSource), name: value};
    const unchangedSource = JSON.stringify(namedSource);
    const pendingEffect = pending(namedSource);
    translateNewStateEffect(pendingEffect, namedSource, {game});
    assert.equal(pendingEffect.updates[0].name, target);
    assert.equal(pendingEffect.updates[0].flags, undefined);
    assert.equal(JSON.stringify(namedSource), unchangedSource);
    const stateSheet = new EffectSheet({source: namedSource});
    const stateView = await stateSheet._prepareContext();
    assert.equal(stateView.source.name, target);
    assert.equal(stateSheet._processFormData(null, null, stateView.source).name, value);
  }
  assert.equal(translateStateEffectName(freeId, target, game), target);
}
for (const customName of [`${freeRu}: My custom attack`, `${freeSource.name}: Multiple Arms + custom`, 'Custom: Counter Attack'])
  assert.equal(translateStateEffectName(freeId, customName, game), customName);
assert.equal(translateStateEffectName(id, `${entry.name}: Counter Attack`, game), `${entry.name}: Counter Attack`);
assert.equal(translateStateEffectName(freeId, `${freeSource.name}: Counter Attack`, english), `${freeSource.name}: Counter Attack`);
const unflagged = new EffectSheet({source: {...source, flags: {}}});
assert.equal(await unflagged._prepareContext(), unflagged.context);
// HUD effects lack dh2eState: accept all 39 exact icons/status IDs and stock bodies.
for (const [statusId, row] of entries) {
  const hudSource = {...stock(statusId, row), flags: {}, statuses: [statusId], img: row.img};
  const hudSheet = new EffectSheet({source: hudSource});
  const hudView = await hudSheet._prepareContext();
  assert.equal(hudView.source.description, markup(translations[`FALLOUTMAW.DH2E.States.${statusId}.Rule`], row.page, 'стр.'), statusId);
  assert.equal(hudSheet._processFormData(null, null, hudView.source).description, hudSource.description, statusId);
  assert.equal(translateNewStateEffect(pending(hudSource), hudSource, {game}), true, statusId);
}
const hudSource = {...source, flags: {}, statuses: new Set([id]), img: entry.img};
assert.notEqual((await new EffectSheet({source: hudSource})._prepareContext()).source.description, source.description);
for (const changes of [
  {statuses: [id, 'custom']}, {statuses: ['custom']}, {img: 'modules/custom/icon.svg'},
  {description: source.description + '<p>My rule</p>'}, {flags: {[SYSTEM]: {dh2eState: 'custom'}}}
]) {
  const hudSheet = new EffectSheet({source: {...hudSource, ...changes}});
  assert.equal(await hudSheet._prepareContext(), hudSheet.context);
}
activeGame = english;
assert.equal(await sheet._prepareContext(), sheet.context);
assert.equal(sheet._processFormData(event, null, unchanged), unchanged);
assert.equal(installStateEffectView(class {}), false);

const callbacks = new Map(); let nextId = 0;
const Hooks = {
  on(name, callback) { const key = ++nextId; callbacks.set(key, {name, callback}); return key; },
  once(name, callback) { return this.on(name, callback); },
  off(name, key) { assert.equal(callbacks.get(key)?.name, name); callbacks.delete(key); }
};
const fire = async (name, ...args) => Promise.all([...callbacks.values()].filter(row => row.name === name).map(row => row.callback(...args)));
class RegisteredSheet extends EffectSheet {}
let imports = [];
const api = registerStateEffectTranslations({Hooks, game: () => game, CONFIG: {statusEffects: []}, importer: async path => {imports.push(path); return {FalloutMaWActiveEffectSheet: RegisteredSheet};}});
assert.equal(registerStateEffectTranslations({Hooks}), api);
assert.equal(callbacks.size, 3);
const hooked = pending(source);
assert.deepEqual(await fire('preCreateActiveEffect', hooked, source), [undefined], 'creation hook never vetoes document creation');
assert.equal(hooked.updates[0].description, expected);
await fire('i18nInit');
await fire('ready');
assert.deepEqual(imports, [`/systems/${SYSTEM}/src/sheets/active-effect-sheet.mjs`]);
assert.deepEqual(api.status(), {viewInstalled: true, viewError: null});
api.dispose(); api.dispose(); assert.equal(callbacks.size, 0);
// The dynamic source import respects Foundry's optional hosting prefix.
const oldFoundry = globalThis.foundry;
try {
  for (const prefix of ['', '/foundry']) {
    const requested = [];
    globalThis.foundry = {utils: {getRoute(path) {
      assert.equal(path, `systems/${SYSTEM}/src/sheets/active-effect-sheet.mjs`);
      return `${prefix}/${path}`;
    }}};
    const routed = registerStateEffectTranslations({Hooks, game, CONFIG: {statusEffects: []}, importer: async path => {
      requested.push(path);
      return {FalloutMaWActiveEffectSheet: RegisteredSheet};
    }});
    await fire('ready');
    assert.deepEqual(requested, [`${prefix}/systems/${SYSTEM}/src/sheets/active-effect-sheet.mjs`]);
    assert.deepEqual(routed.status(), {viewInstalled: true, viewError: null});
    routed.dispose();
  }
} finally {
  if (oldFoundry === undefined) delete globalThis.foundry;
  else globalThis.foundry = oldFoundry;
}
assert.equal(registerStateEffectTranslations({Hooks: null}), null);
console.log('v1.1.0 state effects: 39 exact stock descriptions, new creation, view/save semantics and hooks: PASS');
