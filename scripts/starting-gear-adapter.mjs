/**
 * Starting equipment is built by the SOURCE SYSTEM from internal tables in
 * src/items/dh2e-origin-equipment-grant.mjs; it is not copied from Babele's
 * translated Armoury compendium. Translate only the 52 audited source names
 * on their original preCreateItem hook. Do not modify IDs, categories, flags,
 * quantity, placement, ammunition profiles or derived combat data.
 */
import dictionary from './starting-gear-data.mjs';
export const MODULE_ID = 'dark-heresy-2e-apex-ru';
export const SYSTEM_ID = 'dark-heresy-2e-apex';
const installs = new WeakMap();
const has = (o,k)=>Object.prototype.hasOwnProperty.call(o??{},k);
const active = (game=globalThis.game)=>game?.system?.id===SYSTEM_ID && game?.i18n?.lang==='ru';

export function translateStartingItemData(data, {game=globalThis.game, documentParent=null}={}) {
  if (!active(game) || !data || documentParent?.documentName!=='Actor') return null;
  const flag=data.flags?.[SYSTEM_ID]?.dh2eStartingEquipment;
  if (!flag) return null; // Authoritative origin flag set by the creation workflow.
  const canonical=String(data.name??'');
  if (!has(dictionary.items,canonical)) return null; // Preserve all custom names.
  const entry=dictionary.items[canonical];
  const changes={name:entry.ru};
  const sourceDescription=String(data.system?.description??'');
  // Only newly generated EN item descriptions. The original is from the book
  // and the translation is from the matching translated Armoury item.
  if (entry.description && sourceDescription && !/[А-Яа-яЁё]/u.test(sourceDescription)) {
    changes['system.description']=entry.description;
  } else if (/^<p>Starting equipment(?: \(p\. \d+\))?<\/p>$/i.test(sourceDescription.trim())) {
    changes['system.description']='<p>Стартовое снаряжение</p>';
  }
  return changes;
}

/** A world actor can be updated explicitly, but migration is NEVER automatic. */
export async function translateExistingStartingEquipment(actor, { dryRun=true, game=globalThis.game }={}) {
  if(!active(game)) throw new Error('Русская локализация Dark Heresy не активна');
  if(actor?.documentName!=='Actor' || !actor.isOwner) throw new Error('Необходимо выбрать доступного для редактирования персонажа');
  const updates=[];
  for (const item of actor.items??[]) {
    const data=item.toObject?.() ?? item._source;
    const diff=translateStartingItemData(data,{game,documentParent:actor});
    if (diff) updates.push({_id:item.id,...diff});
  }
  if (!dryRun && updates.length) await actor.updateEmbeddedDocuments('Item',updates);
  return {actor:actor.name, items:updates.length, changes:updates, applied:!dryRun};
}

export function registerStartingGearAdapter({Hooks=globalThis.Hooks,game=()=>globalThis.game}={}) {
  if(!Hooks?.on || !Hooks?.off)throw new Error('Foundry Hooks unavailable for starting gear');
  if(installs.has(Hooks)) return installs.get(Hooks);
  const getGame=()=>typeof game==='function'?game():game;
  let warned=false;
  const hook=Hooks.on('preCreateItem',(item,data)=>{
    try {
      const diff=translateStartingItemData(data??item?._source,{game:getGame(),documentParent:item?.parent});
      if(diff && typeof item.updateSource==='function') item.updateSource(diff);
    } catch(error) {
      if(!warned)console.warn(`${MODULE_ID}: failed to translate starting gear`,error);
      warned=true;
    }
  });
  const api=Object.freeze({hook,dispose(){Hooks.off('preCreateItem',hook);installs.delete(Hooks);}});
  installs.set(Hooks,api);
  return api;
}
