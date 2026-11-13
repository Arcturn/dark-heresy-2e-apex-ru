/** Vehicle weapon names are views: the source uses stored names to match ammunition. */
import data from './vehicle-profile-data.mjs';
import {localizeVehicleItemLabel} from './vehicle-profile-l10n.mjs';
const SYSTEM = 'dark-heresy-2e-apex';
const PATCHED = Symbol.for('dark-heresy-2e-apex-ru.vehicleItemView.v110');
const active = game => game?.system?.id === SYSTEM && game?.i18n?.lang === 'ru';
const current = game => typeof game === 'function' ? game() : game;
function itemView(item, name) {
  return new Proxy(item, {get(target, key) {
    if (key === 'name') return name;
    const value = Reflect.get(target, key, target);
    return typeof value === 'function' ? value.bind(target) : value;
  }});
}
function rowName(row, actor) {
  if (!row) return row;
  const name = localizeVehicleItemLabel(actor, row.itemId ?? row.id, row.name);
  if (name === row.name) return row;
  return row.documentName === 'Item' ? itemView(row, name) : {...row, name};
}
function weaponSet(set, actor) {
  if (!set) return set;
  const out = {...set};
  for (const key of ['slots', 'weapons', 'displaySlots']) if (Array.isArray(set[key]))
    out[key] = set[key].map(slot => slot.item ? {...slot, item: rowName(slot.item, actor)} : slot);
  return out;
}

/** Includes each independently prepared HUD surface and the primary action-row heading. */
export function localizeVehicleHudContext(context, actor, {game = globalThis.game} = {}) {
  if (!context || !actor || !active(game)) return context;
  const out = {...context};
  if (context.selectedWeapon) out.selectedWeapon = rowName(context.selectedWeapon, actor);
  if (context.weaponSet) out.weaponSet = weaponSet(context.weaponSet, actor);
  if (Array.isArray(context.weaponSets)) out.weaponSets = context.weaponSets.map(set => weaponSet(set, actor));
  if (context.tray) {
    const tray = {...context.tray};
    for (const key of ['items', 'abilities', 'weaponEquipChoices']) if (Array.isArray(tray[key])) tray[key] = tray[key].map(row => rowName(row, actor));
    if (Array.isArray(tray.weaponSets)) tray.weaponSets = tray.weaponSets.map(set => weaponSet(set, actor));
    if (Array.isArray(tray.weaponActionRows)) tray.weaponActionRows = tray.weaponActionRows.map(row => {
      // Source getEnabledWeaponFunctions uses id "weapon" for its primary function.
      if (row.id !== 'weapon') return row;
      const id = context.selectedWeapon?.id;
      return {...row, label: localizeVehicleItemLabel(actor, id, row.label)};
    });
    out.tray = tray;
  }
  return out;
}

/** A translated name in the editable form maps back only when left unchanged. */
export function installVehicleOwnedItemView(ctor, {game = () => globalThis.game} = {}) {
  const proto = ctor?.prototype;
  if (!proto || typeof proto._prepareContext !== 'function' || typeof proto._processFormData !== 'function') return false;
  if (Object.prototype.hasOwnProperty.call(proto, PATCHED)) return true;
  const prepare = proto._prepareContext, process = proto._processFormData;
  const views = new WeakMap();
  proto._prepareContext = async function (...args) {
    const context = await prepare.apply(this, args);
    views.delete(this);
    const item = this.item ?? this.document;
    if (!active(current(game)) || !item || !context?.item) return context;
    const name = localizeVehicleItemLabel(item.parent, item.id, item.name);
    if (name === item.name) return context;
    const row = data.weapons[item.name];
    const description = String(item.system?.description ?? '');
    const view = {originalName: item.name, name};
    const out = {...context, item: itemView(context.item, name)};
    if (row?.description && row.descriptionRu && description === row.description
      && context.source?.description === description && String(context.descriptionHTML ?? '').trim() === description.trim()) {
      out.source = {...context.source, description: row.descriptionRu};
      out.descriptionHTML = row.descriptionRu;
      view.description = row.descriptionRu;
      view.originalDescription = description;
    }
    views.set(this, view);
    return out;
  };
  proto._processFormData = function (...args) {
    const result = process.apply(this, args), view = views.get(this);
    if (!view || !result || typeof result !== 'object') return result;
    let out = result;
    if (result.name === view.name) out = {...out, name: view.originalName};
    if (view.description && result['system.description'] === view.description) out = {...out, 'system.description': view.originalDescription};
    else if (view.description && result.system?.description === view.description) out = {...out, system: {...result.system, description: view.originalDescription}};
    return out;
  };
  Object.defineProperty(proto, PATCHED, {value: true});
  return true;
}

function changeText(element, translate) {
  let count = 0;
  for (const node of element?.childNodes ?? []) if (node.nodeType === 3 && typeof node.nodeValue === 'string') {
    const text = node.nodeValue, core = text.trim(), next = translate(core);
    if (next !== core) {node.nodeValue = text.replace(core, next); count++;}
  }
  return count;
}
/** First render fallback, limited to exact source-owned item labels and item IDs. */
export function applyVehicleOwnedViewLabels(app, html, {game = globalThis.game} = {}) {
  if (!active(game)) return 0;
  const root = html?.nodeType ? html : html?.[0] ?? html;
  if (!root?.querySelectorAll) return 0;
  const name = app?.constructor?.name;
  let count = 0;
  if (name === 'TokenActionHud' && root.classList?.contains('dark-heresy-2e-apex-token-action-hud')) {
    const actor = app.actor;
    for (const button of root.querySelectorAll('button[data-item-id][data-action="toggleWeaponActions"], button[data-item-id][data-action="equipHudWeapon"]')) {
      const id = button.getAttribute('data-item-id');
      const translate = value => localizeVehicleItemLabel(actor, id, value);
      for (const child of button.querySelectorAll(':scope > span')) count += changeText(child, translate);
      for (const attribute of ['title', 'aria-label']) {
        const original = button.getAttribute(attribute); if (original == null) continue;
        const next = translate(original);
        if (next !== original) {button.setAttribute(attribute, next); count++;}
      }
      for (const image of button.querySelectorAll(':scope > img[alt]')) {
        const original = image.getAttribute('alt'), next = translate(original);
        if (next !== original) {image.setAttribute('alt', next); count++;}
      }
    }
    for (const row of root.querySelectorAll('.dark-heresy-2e-apex-token-hud-action-row')) {
      const action = row.querySelector('[data-item-id][data-weapon-function-id="weapon"]');
      if (!action) continue;
      count += changeText(row.querySelector('.dark-heresy-2e-apex-token-hud-action-row-title'), value => localizeVehicleItemLabel(actor, action.getAttribute('data-item-id'), value));
    }
  } else if (name === 'Dh2eItemSheet' || name === 'Dh2eGearSheet') {
    const item = app.item ?? app.document;
    for (const title of root.querySelectorAll('.window-title')) count += changeText(title, value => localizeVehicleItemLabel(item?.parent, item?.id, value));
  }
  return count;
}
