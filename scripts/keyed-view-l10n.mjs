/**
 * v0.17.0 — single source of truth for *display-only* book names.
 * Never translate persistence keys, Item/Actor documents, prices, formulas or event payloads.
 */
import progression from './progression-data.mjs';
import actorRules from './actor-rules-data.mjs';
import ui from './ui-literals.mjs';
import origins from './creation-ui.mjs';
import {translateAdvancementRuleText,translateOwnedTalentName} from './progression-ui-adapter.mjs';
import {translateRollModifierLabel} from './roll-modifiers-ui-adapter.mjs';
import {translateActorOriginLabel} from './actor-rules-ui-adapter.mjs';
import guide from './skill-guide-data.mjs';
import {localizeActorBookContext} from './book-view-l10n.mjs';
import {localizeSoulContext} from './soul-picker-l10n.mjs';
import powerData from './token-hud-powers.mjs';
import {translatePowerDescriptor} from './token-hud-ui-adapter.mjs';
import {localizeStockFocusRollContext} from './psychic-focus-l10n.mjs';
import {localizeVehicleContext} from './vehicle-ui-l10n.mjs';
import {localizeVehicleActorContext} from './vehicle-profile-l10n.mjs';

const has=(o,key)=>Object.prototype.hasOwnProperty.call(o??{},key);
const text=x=>typeof x==='string'?x:'';
const enTalent=new Map(Object.entries(progression.talents).map(([key,val])=>[val.en,key]));
const enTrait=new Map(Object.entries(actorRules.traits).map(([key,val])=>[val.en,key]));
const aptitudes=new Map(Object.entries(actorRules.aptitudes).map(([key,val])=>[val.en,{key,ru:val.ru}]));
const characteristicByEn=Object.fromEntries(Object.values(ui.characteristicNames).map(v=>[v.en,v.ru]));
const skillByEn=Object.fromEntries(Object.values(ui.coreSkillNames).map(v=>[v.en,v.ru]));

function skillEntry(key){return ui.coreSkillNames[key]??ui.specialistSkillNames[key]??null;}
export function localizeSkillByKey(key,english){
  const entry=skillEntry(key);
  if(!entry||!english)return english;
  if(entry.group){
    const group=ui.specialistGroups[entry.group];
    const fullEn=group?`${group.en} (${entry.en})`:entry.en;
    const fullRu=group?`${group.ru} (${entry.ru})`:entry.ru;
    if(english===fullEn||english===entry.en)return fullRu;
  }
  return english===entry.en?entry.ru:english;
}
export function localizeAptitudes(value,keys){
  if(typeof value!=='string')return value;
  const names=value.split(/,\s*/);
  return names.map((name,i)=>{
    const entry=keys?.length && typeof keys[i]==='string'?actorRules.aptitudes[keys[i]]:null;
    if(entry && name.trim()===entry.en)return entry.ru;
    const en=name.trim();
    if(aptitudes.has(en))return aptitudes.get(en).ru;
    // A few catalog requirements use the book phrase "A or B" rather than
    // a comma-delimited pair. Only translate if *both* are known aptitudes.
    const alternative=/^(.+?)\s+or\s+(.+)$/i.exec(en);
    if(alternative && aptitudes.has(alternative[1]) && aptitudes.has(alternative[2]))
      return `${aptitudes.get(alternative[1]).ru} или ${aptitudes.get(alternative[2]).ru}`;
    return name;
  }).join(', ');
}
function localizeSpecName(spec){
  if(!spec||typeof spec!=='string')return spec;
  if(skillEntry(spec)){
    const entry=skillEntry(spec),group=entry.group?ui.specialistGroups[entry.group]:null;
    return group?`${group.ru} (${entry.ru})`:entry.ru;
  }
  return spec.split(/,\s*/).map(part=>progression.specialisations[part]??progression.terms[part]??aptitudes.get(part)?.ru??part).join(', ');
}
/** Text-only label; the owner actor keeps the original talent key and specialisation. */
export function localizeTalentByKey(key,original,spec=''){
  const info=progression.talents[key];
  if(!info||typeof original!=='string')return original;
  if(original===info.en)return spec ? `${info.ru} (${localizeSpecName(spec)})` : info.ru;
  // The book's formatTalentLabel uses English names + specialisation + stack count.
  if(original.startsWith(info.en+' (')){
    const translated=translateOwnedTalentName(original);
    if(translated!==original)return translated;
    const suffix=original.slice(info.en.length);
    return info.ru+suffix.replace(/\(([^()]*)\)/g,(_m,group)=>`(${localizeSpecName(group)})`);
  }
  return original;
}
export function localizeTraitByKey(key,original){
  const entry=actorRules.traits[key];
  if(!entry||typeof original!=='string')return original;
  if(original===entry.en)return entry.ru;
  if(original.startsWith(entry.en+' (')){
    return entry.ru+original.slice(entry.en.length).replace(/\(([^()]*)\)/g,(_m,group)=>`(${localizeSpecName(group)})`);
  }
  return original;
}
function localizeTalentText(key,english,field){
  const data=progression.talents[key];
  if(!data||typeof english!=='string')return english;
  if(field==='benefit' && english===data.benefit && data.benefitRu)return data.benefitRu;
  if(field==='prerequisites' || field==='unmet' || field==='manual')return translateAdvancementRuleText(english);
  return english;
}
function localizeTraitSummary(key,original){
  const entry=actorRules.traits[key];
  if(!entry||typeof original!=='string')return original;
  return original===entry.summaryEn?entry.summaryRu:original;
}
function localizeOrigin(kind,key,label){
  const table=origins[kind==='homeworld'?'homeworlds':kind==='background'?'backgrounds':'roles'];
  const translated=table?.[key]?.label;
  if(!translated||typeof label!=='string')return label;
  // Only rewrite original built-in English labels: custom origins are untouched.
  return translateActorOriginLabel(kind,label)===translated?translated:label;
}
/** XP history labels use the persisted *key*, never the already-formatted English slug. */
function localizeAdvanceHistory(row,source){
  if(!source||typeof source!=='object')return {...row,
    name:translateAdvancementRuleText(row?.name)};
  const key=source.key,kind=source.type;
  let label=null;
  if(kind==='talent' && progression.talents[key])label=progression.talents[key].ru;
  else if(kind==='skill' && skillEntry(key)){
    const entry=skillEntry(key),group=entry.group?ui.specialistGroups[entry.group]:null;
    label=group?`${group.ru} (${entry.ru})`:entry.ru;
  }
  else if(kind==='characteristic')label=ui.characteristicNames[key]?.ru??null;
  else if((kind==='psychicPower'||kind==='power'||kind==='psychic')&&progression.psychicPowers[key])label=progression.psychicPowers[key].ru;
  if(!label)return {...row,name:translateAdvancementRuleText(row.name)};
  return {...row,name:source.spec?`${label} (${localizeSpecName(source.spec)})`:label};
}
/** View-model transformation for actor sheets; never touches actor/system data. */
export function localizeActorContext(context,actor){
  if(!context||typeof context!=='object'||!actor)return context;
  const system=actor.system?.dh2e??{};
  const out={...context};
  if(context.dh2eVehicle)out.dh2eVehicle=localizeVehicleContext(context.dh2eVehicle);
  if(Array.isArray(context.dh2eTalents))out.dh2eTalents=context.dh2eTalents.map((row,i)=>{
    const entry=system.talents?.[i]??{};
    const key=entry.key;
    if(!progression.talents[key])return row;
    return {...row,label:localizeTalentByKey(key,row.label,entry.spec),
      benefit:localizeTalentText(key,row.benefit,'benefit'),
      prerequisites:localizeTalentText(key,row.prerequisites,'prerequisites'),
      aptitudes:localizeAptitudes(row.aptitudes)};
  });
  if(Array.isArray(context.dh2eTraits))out.dh2eTraits=context.dh2eTraits.map((row,i)=>{
    const key=system.traits?.[i]?.key;
    if(!actorRules.traits[key])return row;
    return {...row,label:localizeTraitByKey(key,row.label),summary:localizeTraitSummary(key,row.summary)};
  });
  if(Array.isArray(context.dh2eTraitCatalog))out.dh2eTraitCatalog=context.dh2eTraitCatalog.map(row=>({
    ...row,name:actorRules.traits[row.key]&&row.name===actorRules.traits[row.key].en?actorRules.traits[row.key].ru:row.name
  }));
  if(context.apex){
    const apex={...context.apex};
    if(apex.identity)apex.identity={...apex.identity,
      homeworld:localizeOrigin('homeworld',system.homeworld,apex.identity.homeworld),
      background:localizeOrigin('background',system.background,apex.identity.background),
      role:localizeOrigin('role',system.role,apex.identity.role)};
    if(apex.soul)apex.soul=localizeSoulContext(apex.soul);
    if(apex.advances){
      apex.advances={...apex.advances};
      if(Array.isArray(apex.advances.aptitudes))apex.advances.aptitudes=apex.advances.aptitudes.map((label,i)=>{
        const key=system.aptitudes?.[i];
        const data=actorRules.aptitudes[key];
        return data&&label===data.en?data.ru:(aptitudes.get(label)?.ru??label);
      });
      if(Array.isArray(apex.advances.log))apex.advances.log=apex.advances.log.map(row=>
        localizeAdvanceHistory(row,system.advanceLog?.[row.index]));
    }
    out.apex=apex;
  }
  return localizeVehicleActorContext(localizeActorBookContext(out,actor),actor);
}
/** View-model transformation for XP purchase. Source arrays are not mutated. */
export function localizeAdvancementContext(context,actor){
  if(!context||typeof context!=='object')return context;
  const out={...context};
  if(Array.isArray(context.aptitudes))out.aptitudes=context.aptitudes.map(row=>({
    ...row,label:actorRules.aptitudes[row.key]&&row.label===actorRules.aptitudes[row.key].en ? actorRules.aptitudes[row.key].ru : row.label
  }));
  if(Array.isArray(context.characteristics))out.characteristics=context.characteristics.map(row=>({
    ...row,label:ui.characteristicNames[row.key]&&row.label===ui.characteristicNames[row.key].en?ui.characteristicNames[row.key].ru:row.label,
    aptitudes:localizeAptitudes(row.aptitudes)
  }));
  if(Array.isArray(context.skills))out.skills=context.skills.map(row=>({
    ...row,label:localizeSkillByKey(row.key,row.label),aptitudes:localizeAptitudes(row.aptitudes)
  }));
  if(Array.isArray(context.talents))out.talents=context.talents.map(row=>{
    const t=progression.talents[row.key];
    if(!t)return row;
    return {...row,name:row.name===t.en?t.ru:row.name,
      benefit:localizeTalentText(row.key,row.benefit,'benefit'),
      prerequisites:localizeTalentText(row.key,row.prerequisites,'prerequisites'),
      unmet:localizeTalentText(row.key,row.unmet,'unmet'),
      manual:localizeTalentText(row.key,row.manual,'manual'),
      aptitudes:localizeAptitudes(row.aptitudes),
      specLabel:localizeSpecName(row.specLabel),
      specOptions:row.specOptions?.map(option=>({
        ...option,label:localizeSpecName(option.label),note:progression.terms[option.note]??option.note
      }))??row.specOptions};
  });
  if(Array.isArray(context.ownedTalents))out.ownedTalents=context.ownedTalents.map((row,i)=>{
    const key=actor?.system?.dh2e?.talents?.[i]?.key;
    if(!progression.talents[key])return row;
    return {...row,label:localizeTalentByKey(key,row.label,actor.system.dh2e.talents[i].spec),
      benefit:localizeTalentText(key,row.benefit,'benefit')};
  });
  if(Array.isArray(context.elites))out.elites=context.elites.map(row=>({
    ...row,unmet:translateAdvancementRuleText(row.unmet),
    loreOptions:row.loreOptions?.map(choice=>({...choice,label:progression.specialisations[choice.label]??choice.label}))??row.loreOptions
  }));
  if(context.psychic){
    const psy={...context.psychic};
    if(Array.isArray(psy.rows))psy.rows=psy.rows.map(cells=>Array.isArray(cells)?cells.map(row=>{
      const entry=progression.psychicPowers[row.key];
      return {...row,name:entry&&row.name===entry.en?entry.ru:row.name,
        unmet:translateAdvancementRuleText(row.unmet)};
    }):cells);
    if(Array.isArray(psy.nodes))psy.nodes=psy.nodes.map(row=>{
      const entry=progression.psychicPowers[row.key];
      return {...row,name:entry&&row.name===entry.en?entry.ru:row.name,
        unmet:translateAdvancementRuleText(row.unmet)};
    });
    if(Array.isArray(psy.powers))psy.powers=psy.powers.map(row=>{
      const entry=progression.psychicPowers[row.key];
      return {...row,name:entry&&row.name===entry.en?entry.ru:row.name,
        unmet:translateAdvancementRuleText(row.unmet)};
    });
    out.psychic=psy;
  }
  if(context.lastAdvance && typeof context.lastAdvance==='object')out.lastAdvance={...context.lastAdvance,
    name:translateAdvancementRuleText(context.lastAdvance.name)};
  return out;
}
/** English/Russian search simultaneously, without modifying game persistence. */
export function searchAdvancementRows(context,filters){
  if(!context||typeof context!=='object')return context;
  const query=(value)=>text(value).toLocaleLowerCase('ru').trim();
  const out={...context};
  const talentQuery=query(filters?.talent);
  if(talentQuery && Array.isArray(context.talents))out.talents=context.talents.filter(row=>{
    const entry=progression.talents[row.key];
    const values=[row.name,entry?.en,entry?.ru,row.specLabel].filter(Boolean);
    return values.some(value=>String(value).toLocaleLowerCase('ru').includes(talentQuery));
  });
  const skillQuery=query(filters?.skill);
  if(skillQuery && Array.isArray(context.skills))out.skills=context.skills.filter(row=>{
    const entry=skillEntry(row.key);
    return [row.label,entry?.en,entry?.ru].filter(Boolean).some(value=>String(value).toLocaleLowerCase('ru').includes(skillQuery));
  });
  return out;
}
/** Separate translation of names from mechanics in the universal roll dialog. */
export function localizeRollContext(context){
  if(!context||typeof context!=='object')return context;
  const display=value=>translateRollModifierLabel(value);
  const out={...context};
  if(context.base?.label)out.base={...context.base,label:display(context.base.label)};
  if(Array.isArray(context.rows))out.rows=context.rows.map(row=>{
    const key=String(row?.key??'');
    // `situational0` etc. originate in actor.system.dh2eRuleBonuses and
    // contain user-authored labels. Never rewrite custom condition names.
    if(/^situational\d+$/.test(key))return {...row};
    return {...row,label:display(row.label)};
  });
  if(Array.isArray(context.tiles))out.tiles=context.tiles.map(tile=>({
    ...tile,label:display(tile.label),hint:display(tile.hint)
  }));
  if(Array.isArray(context.modes))out.modes=context.modes.map(entry=>({...entry,label:display(entry.label),hint:display(entry.hint)}));
  if(Array.isArray(context.characteristics))out.characteristics=context.characteristics.map(entry=>({
    ...entry,label:ui.characteristicNames[entry.key]&&entry.label===ui.characteristicNames[entry.key].en?ui.characteristicNames[entry.key].ru:display(entry.label)
  }));
  if(Array.isArray(context.fate))out.fate=context.fate.map(row=>({...row,label:display(row.label)}));
  if(context.guide){
    out.guide={...context.guide,
      use:guide.use?.[context.guide.use]??context.guide.use,
      modifiers:context.guide.modifiers?.map(row=>({...row,text:guide.modifiers?.[row.text]??row.text})),
      special:context.guide.special?.map(row=>({
        ...row, // Keep name unchanged: it is also the guide toggle's data-use key.
        text:guide.specialDescriptions?.[row.text]??row.text
      }))};
  }
  if(context.psychic?.powers)out.psychic={...context.psychic,powers:context.psychic.powers.map(row=>({
    ...row,name:progression.psychicPowers[row.key]?.en===row.name?progression.psychicPowers[row.key].ru:row.name
  }))};
  if(typeof context.subtitle==='string')out.subtitle=display(context.subtitle);
  if(typeof context.caption==='string')out.caption=display(context.caption);
  return localizeStockFocusRollContext(out);
}
export const translationInventory=Object.freeze({
  talents:Object.keys(progression.talents).length,
  traits:Object.keys(actorRules.traits).length,
  skills:Object.keys(ui.coreSkillNames).length,
  specialistSkills:Object.keys(ui.specialistSkillNames).length,
  aptitudes:Object.keys(actorRules.aptitudes).length,
  psychicPowers:Object.keys(progression.psychicPowers).length
});
