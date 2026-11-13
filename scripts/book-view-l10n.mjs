/**
 * v0.20-v0.21. Display-only localization of stock Bestiary actors, owned
 * items/abilities, and stock psychic powers in actor sheets and the token HUD.
 * The source actor and every persisted mechanical field remain unchanged.
 */
import book from './book-view-data.mjs';
import {translatePowerDescriptor, translatedStockPowerTooltip, stockPowerTooltip} from './token-hud-ui-adapter.mjs';
import {translateAdvancementRuleText} from './progression-ui-adapter.mjs';

const own=(o,k)=>Object.prototype.hasOwnProperty.call(o??{},k);
const NPC_BY_RU=new Map(Object.entries(book.npcs).map(([en,npc])=>[npc.name,{en,npc}]));
const NPC_BY_SOURCE_ID=new Map(Object.entries(book.npcs).filter(([,npc])=>npc.sourceId).map(([en,npc])=>[npc.sourceId,{en,npc}]));
const powerByEnglish=new Map(Object.entries(book.powers).map(([key,p])=>[p.en,{key,...p}]));
const nameMatches=(display,en,ru)=>typeof display==='string'&&(display===en||display===ru);
export const bookCatalogStats=Object.freeze({npcActors:Object.keys(book.npcs).length,npcNested:Object.values(book.npcs).reduce((n,v)=>n+Object.keys(v.items).length,0),powers:Object.keys(book.powers).length,warpEffects:Object.keys(book.warpNames).length,criticalEffects:Object.keys(book.criticalNames).length});

/** Source compendium UUID is authoritative even after GM renames a world copy. */
export function stockNpc(actor){
  if(!actor)return null;
  const from=String(actor?._stats?.compendiumSource??actor?.flags?.core?.sourceId??'');
  const match=from.match(/(?:Compendium\.dark-heresy-2e-apex\.dh2e-bestiary\.(?:Actor\.)?)?([A-Za-z0-9]{16})$/);
  if(match&&from.includes('dh2e-bestiary')&&NPC_BY_SOURCE_ID.has(match[1]))return NPC_BY_SOURCE_ID.get(match[1]);
  const name=actor.name;
  if(typeof name!=='string')return null;
  if(own(book.npcs,name))return {en:name,npc:book.npcs[name]};
  return NPC_BY_RU.get(name)??null;
}
function ownedItem(actor,id){
  if(!id)return null;
  return actor?.items?.get?.(id)??actor?.items?.contents?.find?.(item=>item.id===id)??actor?.items?.find?.(item=>item.id===id)??null;
}
function knownNpcItem(actor,id,visibleName){
  const source=stockNpc(actor),item=ownedItem(actor,id);
  if(!source||!item)return null;
  const entries=source.npc.items??{};
  const original=item.name;
  if(own(entries,original)&&nameMatches(visibleName,original,entries[original].name))return {item,entry:entries[original],sourceName:original};
  const found=Object.entries(entries).find(([en,row])=>row.name===original && nameMatches(visibleName,en,original));
  return found?{item,entry:found[1],sourceName:found[0]}:null;
}
export function localizeNpcItemLabel(actor,itemId,visibleName){
  const known=knownNpcItem(actor,itemId,visibleName);
  return known?.entry?.name??visibleName;
}
function translateNpcItemRow(row,actor){
  if(!row || !actor)return row;
  const id=row.itemId??row.id;
  const known=knownNpcItem(actor,id,row.name);
  if(!known)return row;
  const {entry,sourceName,item}=known;
  const next={...row};
  if(row.name===sourceName)next.name=entry.name;
  // An embedded item may have a translated name but the source's original
  // English HTML description. Translate only an exact source-data match.
  const originalDescription=entry.sourceDescription??'';
  if(typeof row.description==='string' && entry.description &&
     row.description===originalDescription &&
     String(item.system?.description??'')===originalDescription){
    next.description=entry.description;
  }
  return next;
}
export function stockPower(key){return book.powers?.[key]??null;}
export function localizePowerName(key,name){
  const p=stockPower(key);
  return p&&nameMatches(name,p.en,p.ru)?p.ru:name;
}
const TYPES=Object.freeze({'Attack':'Атака','Concentration':'Сосредоточение','Melee':'Ближний бой','Ranged':'Дальний бой','Movement':'Перемещение','Special':'Особое'});
function types(value){
  if(typeof value!=='string')return value;
  return value.split(/(,\s*|\s*\/\s*)/g).map(x=>TYPES[x]??x).join('');
}
function powerAction(value){
  if(typeof value!=='string')return value;
  const text=translatePowerDescriptor(value,'action');
  if(text!==value)return text;
  const withoutAction=value.replace(/\s*Action\b/i,'').trim();
  return translatePowerDescriptor(withoutAction+' Action','action')!==withoutAction+' Action' ? translatePowerDescriptor(withoutAction+' Action','action') : value;
}
function powerRange(value){return typeof value==='string'?translatePowerDescriptor(value,'range'):value;}
function powerFocus(value){return typeof value==='string'?translatePowerDescriptor(value,'test'):value;}
function powerSustain(value){
  if(typeof value!=='string')return value;
  if(value==='No')return 'Нет';
  if(value.startsWith('Поддержание: '))return 'Поддержание: '+powerAction(value.slice('Поддержание: '.length));
  if(value.startsWith('Sustain: '))return 'Поддержание: '+powerAction(value.slice('Sustain: '.length));
  return powerAction(value);
}
/** Only replace *exactly the system's original* description. */
function translatedEffect(p,rendered){
  return typeof rendered==='string' && p.effectRu && rendered.trim()===p.effectEn.trim() ? p.effectRu : rendered;
}
export function localizePowerRow(row){
  const p=stockPower(row?.key);
  if(!p||!row)return row;
  const out={...row};
  if(nameMatches(row.name,p.en,p.ru))out.name=p.ru;
  if(nameMatches(row.label,p.en,p.ru))out.label=p.ru;
  // The built-in generator uses the original English spell metadata. Other
  // values (including any homebrew, power edits or profile fields) are retained.
  if(row.action===p.action)out.action=powerAction(row.action);
  const shortAction=p.action.replace(/\s*Action\b/i,'').trim();
  if(row.action===shortAction)out.action=powerAction(p.action);
  if(row.actionFull===p.action)out.actionFull=powerAction(row.actionFull);
  if(row.focusFull===p.focusPower)out.focusFull=powerFocus(row.focusFull);
  if(typeof row.focus==='string')out.focus=row.focus.replace(/^(WP|Per|Psy|Int|Fel|T)(?=\s+[+\-−]\d+)/,v=>({WP:'СВ',Per:'Вос',Psy:'Пси',Int:'Инт',Fel:'Общ',T:'Вын'})[v]??v);
  if(row.focusPower===p.focusPower)out.focusPower=powerFocus(row.focusPower);
  if(row.range===p.range)out.range=powerRange(row.range);
  if(row.prerequisites===p.prerequisites)out.prerequisites=translateAdvancementRuleText(row.prerequisites);
  if(row.effect===p.effectEn)out.effect=translatedEffect(p,row.effect);
  if(row.sustained===p.sustained)out.sustained=powerSustain(row.sustained);
  if(row.sustained===`Поддержание: ${p.sustained}` || row.sustained===`Sustain: ${p.sustained}`)out.sustained=powerSustain(row.sustained);
  if(Array.isArray(row.tags))out.tags=row.tags.map(types);
  if(row.discipline===p.discipline)out.discipline=row.discipline; // technical key
  return out;
}
/** Actor sheet context: only known source data rendered by the templates. */
export function localizeActorBookContext(context,actor){
  if(!context||typeof context!=='object'||!actor)return context;
  const out={...context};
  const stock=stockNpc(actor);
  if(stock&&context.actorName===stock.en)out.actorName=stock.npc.name;
  if(stock&&Array.isArray(context.abilities))out.abilities=context.abilities.map(row=>translateNpcItemRow(row,actor));
  if(stock&&Array.isArray(context.apexGear?.groups))out.apexGear={...context.apexGear,
    groups:context.apexGear.groups.map(group=>({...group,items:group.items?.map(row=>{
      const next=translateNpcItemRow(row,actor);
      return next.profile?.name===row.name?{...next,profile:{...next.profile,name:next.name}}:next;
    })??group.items}))};
  if(stock&&context.apex?.weapons)out.apex={...context.apex,
    weapons:context.apex.weapons.map(row=>translateNpcItemRow(row,actor))};
  if(context.dh2ePsychic?.groups){
    const psy=context.dh2ePsychic;
    out.dh2ePsychic={...psy,groups:psy.groups.map(group=>({
      ...group,powers:group.powers?.map(localizePowerRow)??group.powers
    })),sustained:psy.sustained ? {...psy.sustained,
      entries:psy.sustained.entries?.map(localizePowerRow)??psy.sustained.entries} : psy.sustained};
  }
  return out;
}
function mapItemDisplay(actor,rows){return Array.isArray(rows)?rows.map(row=>translateNpcItemRow(row,actor)):rows;}
function localizeHudPsychicGroups(groups){
  if(!Array.isArray(groups))return groups;
  return groups.map(group=>({...group,powers:group.powers?.map(row=>{
    const p=stockPower(row.key);
    if(!p)return row;
    const out={...row};
    if(nameMatches(row.label,p.en,p.ru))out.label=p.ru;
    const exact=stockPowerTooltip(p);
    if(row.tooltip===exact)out.tooltip=translatedStockPowerTooltip({...p,ru:p.ru});
    return out;
  })??group.powers}));
}
/** HUD contexts are independently prepared after every selected-token change. */
export function localizeHudBookContext(context,actor){
  if(!context||typeof context!=='object'||!actor)return context;
  const out={...context};
  if(context.tray){
    const t=context.tray;
    out.tray={...t,
      psychicGroups:localizeHudPsychicGroups(t.psychicGroups),
      items:mapItemDisplay(actor,t.items),
      abilities:mapItemDisplay(actor,t.abilities),
      abilityGroups:Array.isArray(t.abilityGroups)?t.abilityGroups.map(group=>({...group,
        categories:group.categories?.map(cat=>({...cat,items:mapItemDisplay(actor,cat.items)}))??group.categories
      })):t.abilityGroups};
  }
  if(context.weaponSets)out.weaponSets=context.weaponSets.map(set=>({...set,
    slots:set.slots?.map(slot=>slot.item?{...slot,item:translateNpcItemRow(slot.item,actor)}:slot)??set.slots}));
  if(context.weaponSet)out.weaponSet={...context.weaponSet,
    slots:context.weaponSet.slots?.map(slot=>slot.item?{...slot,item:translateNpcItemRow(slot.item,actor)}:slot)??context.weaponSet.slots};
  if(context.selectedWeapon)out.selectedWeapon=translateNpcItemRow(context.selectedWeapon,actor);
  return out;
}
export function psychicNameFromEnglish(name){return powerByEnglish.get(name)?.ru??name;}
export function sourceChatLabels(){return {warp:book.warpNames,critical:book.criticalNames};}
