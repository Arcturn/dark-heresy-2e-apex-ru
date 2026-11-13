/** Translate newly applied stock profiles, preserving canonical mechanical fields. */
import data from './vehicle-profile-data.mjs';
const SYSTEM = 'dark-heresy-2e-apex';
const REGISTRATIONS = new WeakMap();
const enabled = game => game?.system?.id === SYSTEM && game?.i18n?.lang === 'ru';
const own = (object, key) => Object.prototype.hasOwnProperty.call(object ?? {}, key);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const read = (object, path) => own(object, path) ? object[path] : path.split('.').reduce((value, key) => value?.[key], object);
function writeCopy(object, path, value) {
  if (own(object, path)) return {...object, [path]: value};
  const [key, ...tail] = path.split('.');
  return {...object, [key]: tail.length ? writeCopy(object?.[key] ?? {}, tail.join('.'), value) : value};
}
function same(actual, expected) {
  if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length && expected.every((value, index) => same(actual[index], value));
  if (expected && typeof expected === 'object') return actual && typeof actual === 'object' && Object.entries(expected).every(([key, value]) => same(actual[key], value));
  return actual === expected;
}
function generatedDescriptions(key, game) {
  const row = data.displayProfiles[key], profile = data.profiles[key];
  if (!row || !profile) return [];
  const n = profile.fields.threat;
  const labels = [`Threat rating ${n}`, `Рейтинг угрозы ${n}`];
  const localized = game?.i18n?.format?.('FALLOUTMAW.DH2E.Npc.Threat', {n});
  if (localized && localized !== 'FALLOUTMAW.DH2E.Npc.Threat') labels.push(localized);
  return labels.map(threat => `<h3>${escape(row.en)} (p. ${row.page})</h3><p>${escape(threat)}</p><p>${escape(row.notes)}</p>`);
}

/** A full profile apply payload, not an arbitrary edit of an actor's name or notes. */
export function translateVehicleProfileUpdate(changes, {game = globalThis.game} = {}) {
  if (!enabled(game) || !changes) return changes;
  const vehicle = read(changes, 'system.dh2e.vehicle');
  const profile = data.profiles[vehicle?.key];
  const display = data.displayProfiles[vehicle?.key];
  if (!profile || !display || !same(vehicle, profile.fields) || !Array.isArray(vehicle.crew)
    || read(changes, 'system.dh2e.wounds') !== profile.wounds || read(changes, 'system.dh2e.criticalDamage') !== 0
    || !generatedDescriptions(vehicle.key, game).includes(read(changes, 'system.description'))) return changes;
  let out = writeCopy(changes, 'system.dh2e.vehicle', {...vehicle, notes: display.notesRu});
  out = writeCopy(out, 'system.description', display.descriptionRu);
  // The rename checkbox omits this field entirely. A supplied custom name stays custom.
  if (changes.name === display.en) out.name = display.ru;
  return out;
}

function stockVehicle(actor) {
  const vehicle = actor?.system?.dh2e?.vehicle;
  const display = data.displayProfiles[vehicle?.key];
  return vehicle?.enabled && display && [display.notes, display.notesRu].includes(vehicle.notes) ? vehicle : null;
}
function stockWeapon(item, actor, {view = false} = {}) {
  const vehicle = stockVehicle(actor);
  const row = data.weapons[item?.name];
  if (!vehicle || !row || item?.type !== 'weapon' || item.system?.itemFunction !== 'weapon') return null;
  const dh2e = item.system?.dh2e;
  const mount = data.profiles[vehicle.key].mounts.find(entry => entry.mount === dh2e?.mount
    && entry.facing === (dh2e?.facing ?? '') && entry.crew === (dh2e?.mountCrew ?? '') && entry.names.includes(item.name));
  const expectedWeapon = view ? {...row.weapon, magazine: {max: row.weapon.magazine.max}} : row.weapon;
  if (!mount || !same(dh2e, row.dh2e) || !same(item.system?.functions?.weapon, expectedWeapon)) return null;
  const description = String(item.system?.description ?? '');
  if (description !== row.description && (!row.descriptionRu || description !== row.descriptionRu)) return null;
  return row;
}

/** Newly generated mounted weapons have an exact profile/mount/rules signature. */
export function translateVehicleWeaponData(item, {actor, game = globalThis.game} = {}) {
  if (!enabled(game) || actor?.documentName !== 'Actor') return null;
  const row = stockWeapon(item, actor);
  if (!row) return null;
  // The source uses name as an ammunition-compatibility fallback when gearKey
  // is empty. Keep both stored identifiers and translate names in view contexts.
  const updates = {};
  if (row.description && row.descriptionRu && item.system.description === row.description) updates['system.description'] = row.descriptionRu;
  return Object.keys(updates).length ? updates : null;
}

export function localizeVehicleItemLabel(actor, itemId, name) {
  const item = actor?.items?.get?.(itemId) ?? actor?.items?.find?.(entry => entry.id === itemId);
  const source = typeof item?.toObject === 'function' ? item.toObject() : item;
  const row = stockWeapon(source, actor, {view: true});
  return row && name === source.name ? row.nameRu : name;
}

function localizeWeaponRow(row, actor) {
  const name = localizeVehicleItemLabel(actor, row.itemId ?? row.id, row.name);
  if (name === row.name) return row;
  return {...row, name, ...(row.profile?.name === row.name ? {profile: {...row.profile, name}} : {})};
}

/** Existing stock content: display rows only, with editable source data retained. */
export function localizeVehicleActorContext(context, actor, {game = globalThis.game} = {}) {
  if (!context || !enabled(game) || !stockVehicle(actor)) return context;
  let out = context;
  if (Array.isArray(context.dh2eVehicle?.weapons)) out = {...out, dh2eVehicle: {...context.dh2eVehicle, weapons: context.dh2eVehicle.weapons.map(row => localizeWeaponRow(row, actor))}};
  if (Array.isArray(context.apex?.weapons)) out = {...out, apex: {...context.apex, weapons: context.apex.weapons.map(row => localizeWeaponRow(row, actor))}};
  if (Array.isArray(context.apexGear?.groups)) out = {...out, apexGear: {...context.apexGear, groups: context.apexGear.groups.map(group => ({...group, items: group.items?.map(row => localizeWeaponRow(row, actor)) ?? group.items}))}};
  const key = actor.system.dh2e.vehicle.key;
  if (!context.owner && generatedDescriptions(key, game).includes(String(actor.system.description ?? ''))
    && String(context.dh2eNotesHTML ?? '').trim() === String(actor.system.description).trim())
    out = {...out, dh2eNotesHTML: data.displayProfiles[key].descriptionRu};
  return out;
}

export function registerVehicleProfileTranslations({Hooks = globalThis.Hooks, game = () => globalThis.game} = {}) {
  if (!Hooks?.on || !Hooks?.off) return null;
  if (REGISTRATIONS.has(Hooks)) return REGISTRATIONS.get(Hooks);
  const current = () => typeof game === 'function' ? game() : game;
  const update = Hooks.on('preUpdateActor', (actor, changes) => {
    if (actor?.documentName !== 'Actor') return;
    const next = translateVehicleProfileUpdate(changes, {game: current()});
    if (next !== changes) Object.assign(changes, next);
  });
  const create = Hooks.on('preCreateItem', (item, source) => {
    const currentSource = typeof item?.toObject === 'function' ? item.toObject() : source;
    const updates = translateVehicleWeaponData(currentSource, {actor: item?.parent, game: current()});
    if (updates && typeof item?.updateSource === 'function') item.updateSource(updates);
  });
  let disposed = false;
  const api = Object.freeze({dispose() {
    if (disposed) return;
    disposed = true;
    Hooks.off('preUpdateActor', update); Hooks.off('preCreateItem', create);
    REGISTRATIONS.delete(Hooks);
  }});
  REGISTRATIONS.set(Hooks, api);
  return api;
}
