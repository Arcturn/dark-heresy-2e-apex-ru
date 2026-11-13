import assert from 'node:assert/strict';
import data from '../scripts/vehicle-profile-data.mjs';
import {translateVehicleProfileUpdate, translateVehicleWeaponData, localizeVehicleActorContext, localizeVehicleItemLabel, registerVehicleProfileTranslations} from '../scripts/vehicle-profile-l10n.mjs';
const SYSTEM = 'dark-heresy-2e-apex';
const game = {system: {id: SYSTEM}, i18n: {lang: 'ru'}};
const clone = value => structuredClone(value);
const description = key => {const row = data.displayProfiles[key], profile = data.profiles[key];return `<h3>${row.en} (p. ${row.page})</h3><p>Рейтинг угрозы ${profile.fields.threat}</p><p>${row.notes}</p>`;};
function applyData(key) {
  const row = data.profiles[key];
  return {name: data.displayProfiles[key].en, 'system.dh2e.vehicle': {...clone(row.fields), crew: [{actorUuid: 'Actor.person', role: 'driver'}]}, 'system.dh2e.wounds': row.wounds, 'system.dh2e.criticalDamage': 0, 'system.description': description(key), other: 'Retained'};
}
function actorData(key, translated = false) {
  const row = data.profiles[key], display = data.displayProfiles[key];
  return {documentName: 'Actor', system: {dh2e: {vehicle: {...clone(row.fields), notes: translated ? display.notesRu : display.notes}}, description: translated ? display.descriptionRu : description(key)}};
}
function weaponData(name, mount) {
  const row = data.weapons[name];
  return {name, type: 'weapon', system: {itemFunction: 'weapon', description: row.description, dh2e: {...clone(row.dh2e), mount: mount.mount, facing: mount.facing, mountCrew: mount.crew}, functions: {weapon: clone(row.weapon)}, placement: {mode: 'inventory', x: 3}}};
}
assert.equal(Object.keys(data.profiles).length, 7);
assert.equal(Object.keys(data.weapons).length, 8);
for (const key of Object.keys(data.profiles)) {
  const source = applyData(key), before = JSON.stringify(source), display = data.displayProfiles[key];
  const result = translateVehicleProfileUpdate(source, {game});
  assert.equal(JSON.stringify(source), before, key);
  assert.equal(result.name, display.ru, key);
  assert.equal(result['system.description'], display.descriptionRu, key);
  assert.deepEqual({...result['system.dh2e.vehicle'], notes: display.notes}, source['system.dh2e.vehicle'], key);
  assert.equal(result['system.dh2e.wounds'], source['system.dh2e.wounds']);
  assert.equal(result.other, source.other);
  const renameOff = {...source}; delete renameOff.name;
  assert.equal(Object.hasOwn(translateVehicleProfileUpdate(renameOff, {game}), 'name'), false);
  assert.equal(translateVehicleProfileUpdate({...source, name: 'My vehicle'}, {game}).name, 'My vehicle');
  for (const custom of [
    {...source, 'system.description': source['system.description'] + '<p>My rules</p>'},
    {...source, 'system.dh2e.vehicle': {...source['system.dh2e.vehicle'], notes: 'My rules'}},
    {...source, 'system.dh2e.vehicle': {...source['system.dh2e.vehicle'], key: 'custom'}},
    {...source, 'system.dh2e.wounds': 999}
  ]) assert.equal(translateVehicleProfileUpdate(custom, {game}), custom);
  const expanded = {name: source.name, system: {dh2e: {vehicle: source['system.dh2e.vehicle'], wounds: source['system.dh2e.wounds'], criticalDamage: 0}, description: source['system.description']}};
  const expandedResult = translateVehicleProfileUpdate(expanded, {game});
  assert.equal(expandedResult.system.dh2e.vehicle.notes, display.notesRu);
  assert.equal(expandedResult.system.description, display.descriptionRu);
  assert.equal(expanded.system.description, source['system.description']);
  const actor = actorData(key, true);
  for (const mount of data.profiles[key].mounts) for (const name of mount.names) {
    const item = weaponData(name, mount), original = JSON.stringify(item);
    const diff = translateVehicleWeaponData(item, {actor, game});
    if (data.weapons[name].description) assert.deepEqual(diff, {'system.description': data.weapons[name].descriptionRu}, `${key}/${name}`);
    else assert.equal(diff, null);
    assert.equal(diff?.name, undefined, 'stored weapon name remains the source ammunition fallback');
    assert.equal(diff?.['system.dh2e.gearKey'], undefined, 'empty canonical key is never rewritten');
    assert.equal(JSON.stringify(item), original);
    for (const custom of [
      {...item, name: 'My gun'},
      {...item, system: {...item.system, description: item.system.description + '<p>My rule</p>'}},
      {...item, system: {...item.system, dh2e: {...item.system.dh2e, gearKey: 'custom'}}},
      {...item, system: {...item.system, functions: {weapon: {...item.system.functions.weapon, damage: '999d10'}}}},
      {...item, system: {...item.system, dh2e: {...item.system.dh2e, mount: 'unknown'}}}
    ]) assert.equal(translateVehicleWeaponData(custom, {actor, game}), null);
    const contextActor = actorData(key); contextActor.items = new Map([['weapon', {...item, id: 'weapon'}]]);
    const context = {owner: false, dh2eNotesHTML: contextActor.system.description, dh2eVehicle: {weapons: [{id: 'weapon', name, damage: 99}]}, apex: {weapons: [{id: 'weapon', name}]}, apexGear: {groups: [{items: [{itemId: 'weapon', name, profile: {name}}]}]}};
    const localized = localizeVehicleActorContext(context, contextActor, {game});
    assert.equal(localized.dh2eNotesHTML, display.descriptionRu);
    assert.equal(localized.dh2eVehicle.weapons[0].name, data.weapons[name].nameRu);
    assert.equal(localized.dh2eVehicle.weapons[0].damage, 99);
    assert.equal(localized.apex.weapons[0].name, data.weapons[name].nameRu);
    assert.equal(localized.apexGear.groups[0].items[0].name, data.weapons[name].nameRu);
    assert.equal(localized.apexGear.groups[0].items[0].profile.name, data.weapons[name].nameRu);
    assert.equal(context.dh2eVehicle.weapons[0].name, name);
    const used = contextActor.items.get('weapon');
    used.system.functions.weapon.magazine.value = 0;
    assert.equal(localizeVehicleItemLabel(contextActor, 'weapon', name), data.weapons[name].nameRu, 'firing does not remove view translation');
    const ownerView = {...context, owner: true};
    assert.equal(localizeVehicleActorContext(ownerView, contextActor, {game}).dh2eNotesHTML, context.dh2eNotesHTML);
  }
}
const sample = applyData('chimera');
assert.equal(translateVehicleProfileUpdate(sample, {game: {...game, i18n: {lang: 'en'}}}), sample);
const partial = {name: data.displayProfiles.chimera.en}; assert.equal(translateVehicleProfileUpdate(partial, {game}), partial);
const calls = new Map(); let index = 0;
const Hooks = {on(name, callback) {const key=++index; calls.set(key, {name, callback}); return key;}, off(name, key) {assert.equal(calls.get(key)?.name, name); calls.delete(key);}};
const api = registerVehicleProfileTranslations({Hooks, game});
assert.equal(registerVehicleProfileTranslations({Hooks}), api);
const updateHook = [...calls.values()].find(row => row.name === 'preUpdateActor').callback;
const changes = applyData('chimera');
assert.equal(updateHook({documentName: 'Actor'}, changes), undefined);
assert.equal(changes.name, data.displayProfiles.chimera.ru);
const createHook = [...calls.values()].find(row => row.name === 'preCreateItem').callback;
const source = weaponData('Heavy Bolter', data.profiles.chimera.mounts[0]);
const document = {parent: actorData('chimera', true), toObject: () => source, updates: [], updateSource(diff) {this.updates.push(diff);}};
assert.equal(createHook(document, source), undefined);
assert.deepEqual(document.updates[0], {'system.description': data.weapons['Heavy Bolter'].descriptionRu});
const priorEdited = {...document, toObject: () => ({...source, name: 'Prior hook'}), updates: []};
createHook(priorEdited, source); assert.equal(priorEdited.updates.length, 0);
api.dispose(); api.dispose(); assert.equal(calls.size, 0);
console.log('v1.1.0 vehicle profile application: exact seven profiles/eight weapons, custom edits, mechanical preservation and lifecycle: PASS');
