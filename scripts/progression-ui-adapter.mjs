/**
 * Audited display adapter for Dh2eAdvancementApplication (system 0.1.10).
 * The system's XP purchase window renders names, prerequisites and specialisation
 * labels directly from English rules catalogs, independently of Babele.
 * This adapter changes only rendered text/tooltip nodes: never data-key,
 * data-spec, actions, prices, form values, character sheets, or actor data.
 */
import sourceData from './progression-data.mjs';
import sheetData from './ui-literals.mjs';
import rulesData from './actor-rules-data.mjs';
const aptitudesByEnglish=Object.fromEntries(Object.values(rulesData.aptitudes).map(x=>[x.en,x.ru]));
export const translateAptitudeList=value=>typeof value==='string'?value.replace(/(^|,\s*)([^,]+)(?=,|$)/gu,(_match,prefix,label)=>prefix+(aptitudesByEnglish[label.trim()]??label.trim())):value;
const SYSTEM_ID='dark-heresy-2e-apex';
const INSTALLS=new WeakMap();
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x??{},k);
const norm=x=>String(x??'').trim();
const active=(g=globalThis.game)=>g?.system?.id===SYSTEM_ID && g?.i18n?.lang==='ru';

function isAdvancement(app, root) {
  let rightClass=false;
  for(let ctor=app?.constructor;typeof ctor==='function';ctor=Object.getPrototypeOf(ctor)) {
    if(ctor.name==='Dh2eAdvancementApplication'){rightClass=true;break;}
    if(ctor===Function.prototype)break;
  }
  return rightClass && root?.nodeType===1 && Boolean(root.matches?.('.dh2e-advancement-body')||root.querySelector?.('.dh2e-advancement-body'));
}
function find(root,s){const all=Array.from(root?.querySelectorAll?.(s)??[]);if(root?.matches?.(s))all.unshift(root);return all;}
function changeText(el,source,target,counters){
  if(!el || !target || source===target)return;
  for(const node of el.childNodes??[]){
    if(node.nodeType!==3)continue;
    const old=node.nodeValue??'',core=old.trim();
    if(core!==source)continue;
    const pos=old.indexOf(core);
    node.nodeValue=old.slice(0,pos)+target+old.slice(pos+core.length);
    counters.text++;
  }
}
/** Names of built-in talents, with a known Book specialisation in parentheses. */
export function translateOwnedTalentName(label,data=sourceData){
  if(typeof label!=='string')return label;
  const direct=Object.values(data.talents).find(entry=>entry.en===label);
  if(direct)return direct.ru;
  const match=/^(.+?) \(([^)]*)\)(?: \((\d+)\))?$/.exec(label);
  if(!match)return label;
  const talent=Object.values(data.talents).find(entry=>entry.en===match[1]);
  if(!talent)return label;
  const specialization=match[2].split(/,\s*/).map(s=>data.specialisations[s]??s).join(', ');
  return `${talent.ru} (${specialization})${match[3]?` (${match[3]})`:''}`;
}

// Rules lines may use proper names and skill names; replace longest known
// source terms first, with complete English-word boundaries to avoid changing
// custom terms or corrupting prices such as "40" / "1d10".
const sortedRules=Object.entries(sourceData.terms)
  .filter(([en,ru])=>en!==ru)
  .sort((a,b)=>b[0].length-a[0].length)
  .map(([en,ru])=>({en,ru,regex:new RegExp(`(?<![A-Za-z])${en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?![A-Za-z])`,'gu')}));
export function translateAdvancementRuleText(value){
  if(typeof value!=='string'||!/\b[A-Za-z]{2,}\b/.test(value))return value;
  // Replace by one-pass scanning; substitutions cannot be changed again by later rules.
  const hits=[];
  for(const row of sortedRules){
    row.regex.lastIndex=0;let match;
    while((match=row.regex.exec(value))){
      const start=match.index,end=start+match[0].length;
      if(hits.some(hit=>start<hit.end&&end>hit.start))continue;
      hits.push({start,end,replace:row.ru});
    }
  }
  let next=value;
  for(const hit of hits.sort((a,b)=>b.start-a.start))next=next.slice(0,hit.start)+hit.replace+next.slice(hit.end);
  return next;
}
function translateRuleNode(element,counters){
  if(!element)return;
  for(const node of element.childNodes??[]){
    if(node.nodeType!==3)continue;
    const next=translateAdvancementRuleText(node.nodeValue);
    if(next!==node.nodeValue){node.nodeValue=next;counters.text++;}
  }
}
function translateAptitudes(root,counters){
  // All selectable aptitude chips are keyed with their canonical system enums.
  // Preserve data-key, option.value and click handlers; only display text is changed.
  for(const el of find(root,'.dh2e-adv-aptitudes .dh2e-aptitude')){
    // The GM gets keyed <button> controls; a regular player only sees
    // readonly <span class="dh2e-aptitude owned"> with no data-key.
    const key=el.getAttribute('data-key');
    const canonical=rulesData.aptitudes?.[key];
    const shown=norm(el.textContent);
    const translated=canonical && shown===canonical.en ? canonical.ru : aptitudesByEnglish[shown];
    if(translated)changeText(el,shown,translated,counters);
  }
  for(const row of find(root,'.dh2e-talent-table tbody tr')){
    const name=row.querySelector('a.dh2e-entry-link[data-type="talent"][data-key]');
    if(!name || !sourceData.talents[name.getAttribute('data-key')])continue;
    // Talent catalog aptitudes are rendered as talent.aptitudes.join(', ') rather
    // than localize(...), so previous locale coverage left them in English.
    const cells=row.querySelectorAll('td');
    const aptitude=cells?.[1];
    if(aptitude){const current=norm(aptitude.textContent);changeText(aptitude,current,translateAptitudeList(current),counters);}
    const prereq=row.querySelector('.dh2e-talent-prereq');
    if(prereq)translateRuleNode(prereq,counters);
  }
  // Characteristics and skills already use localized aptitude names from game.i18n;
  // translate the source strings only if older system builds still emit English.
  for(const row of [...find(root,'.dh2e-adv-chars tbody tr'),...find(root,'.dh2e-adv-skills tbody tr')]){
    const cells=row.querySelectorAll('td');
    const label=cells?.[3] && row.closest?.('.dh2e-adv-chars')?cells[3]:cells?.[2];
    if(!label)continue;
    const current=norm(label.textContent);
    changeText(label,current,translateAptitudeList(current),counters);
  }
}
function translateTalentRow(row,counters){
  const link=row.querySelector('a.dh2e-entry-link[data-action="openEntry"][data-type="talent"][data-key]');
  if(!link)return;
  const entry=sourceData.talents[link.getAttribute('data-key')];
  if(!entry)return;
  changeText(link,entry.en,entry.ru,counters);
  const prereq=row.querySelector('.dh2e-talent-prereq');
  for(const e of prereq?.querySelectorAll('span')??[])translateRuleNode(e,counters);
  const specButton=row.querySelector('.dh2e-spec-chip > span');
  if(specButton){
    const shown=norm(specButton.textContent);
    const translated=sourceData.specialisations[shown]??translateKnownSkillName(shown);
    if(translated)changeText(specButton,shown,translated,counters);
  }
  for(const choice of row.querySelectorAll('.dh2e-spec-option[data-spec]')){
    const original=choice.getAttribute('data-spec');
    const translation=sourceData.specialisations[original]??getSkillByKey(original)?.ru;
    if(!translation)continue;
    const span=choice.querySelector('span');
    changeText(span,original,translation,counters);
    // Display text is sometimes a named skill rather than the mechanical key.
    const skill=getSkillByKey(original);
    if(skill){changeText(span,skill.en,translation,counters);
      const group=sheetData.specialistGroups?.[skill.group];
      if(group)changeText(span,`${group.en} (${skill.en})`,`${group.ru} (${skill.ru})`,counters);
    }
  }
}
function getSkillByKey(key){return sheetData.specialistSkillNames?.[key]??sheetData.coreSkillNames?.[key]??null;}
function displaySkillName(entry, source){
  if(!entry)return null;
  if(entry.group){
    const group=sheetData.specialistGroups?.[entry.group];
    const english=group ? `${group.en} (${entry.en})` : entry.en;
    const russian=group ? `${group.ru} (${entry.ru})` : entry.ru;
    if(source===english)return russian;
  }
  return source===entry.en?entry.ru:null;
}
function translateKnownSkillName(en){
  for(const entry of [...Object.values(sheetData.specialistSkillNames??{}),...Object.values(sheetData.coreSkillNames??{})]) {
    const translated=displaySkillName(entry,en);
    if(translated)return translated;
  }
  return null;
}
function translateSkills(root,counters){
  for(const row of find(root,'.dh2e-adv-skills tbody tr')){
    const button=row.querySelector('button[data-action="buySkill"][data-key]');
    const entry=button?getSkillByKey(button.getAttribute('data-key')):null;
    const td=row.querySelector('td:first-child');
    const label=norm(td?.textContent);
    const translated=displaySkillName(entry,label)??translateKnownSkillName(label);
    if(translated)changeText(td,label,translated,counters);
  }
}
function translateCharacteristics(root,counters){
  for(const row of find(root,'.dh2e-adv-chars tbody tr')){
    const td=row.querySelector('td:first-child');
    const en=norm(td?.textContent);
    const entry=Object.values(sheetData.characteristicNames??{}).find(e=>e.en===en);
    if(entry)changeText(td,en,entry.ru,counters);
  }
}
function translatePowers(root,counters){
  for(const row of find(root,'.dh2e-tree-node[data-key]')){
    const entry=sourceData.psychicPowers[row.getAttribute('data-key')];
    if(!entry)continue;
    const label=row.querySelector('a.dh2e-entry-link[data-type="psychicPower"]');
    if(label)changeText(label,entry.en,entry.ru,counters);
    for(const span of row.querySelectorAll('.dh2e-tree-why'))translateRuleNode(span,counters);
  }
}
function translateOwnedTalentBenefits(root,counters){
  const byEnglishBenefit=new Map(Object.values(sourceData.talents)
    .filter(t=>t.benefit && t.benefitRu)
    .map(t=>[t.benefit,t.benefitRu]));
  for(const el of find(root,'.dh2e-talent-chip[data-tooltip]')){
    const source=el.getAttribute?.('data-tooltip');
    const translated=byEnglishBenefit.get(source);
    if(translated && source!==translated){el.setAttribute('data-tooltip',translated);counters.attributes++;}
  }
}
function translateEliteAdvances(root,counters){
  // Inquisitor offers Forbidden Lore specialisations from an unlocalised book
  // catalog. Change visible text only; the option.value is the mechanical key.
  for(const option of find(root,'select[data-elite-lore] option')){
    const english=norm(option.textContent);
    const translated=sourceData.specialisations[english]??null;
    if(translated && english!==translated)changeText(option,english,translated,counters);
  }
  // The same prerequisite checker produces English warnings for elite
  // advances; localize the text nodes without altering conditions or costs.
  for(const el of find(root,'a[data-type="eliteAdvance"]')){
    const row=el.closest?.('tr');
    for(const warning of row?.querySelectorAll?.('.dh2e-talent-prereq span')??[])translateRuleNode(warning,counters);
  }
}
function translateCosts(root,counters){
  for(const el of find(root,'button.dh2e-adv-buy, .dh2e-advancement-xp button[data-action="undoLast"]')){
    for(const node of el.childNodes??[]){
      if(node.nodeType!==3)continue;
      const old=node.nodeValue??'',next=old.replace(/\b(\d+)\s+xp\b/gi,'$1 ОО');
      if(next!==old){node.nodeValue=next;counters.text++;}
    }
  }
}
export function applyAdvancementUiTranslations(app,root,{game=globalThis.game}={}){
  const counters={active:false,text:0,attributes:0};
  if(!active(game)||!isAdvancement(app,root))return counters;
  counters.active=true;
  translateCharacteristics(root,counters);
  translateSkills(root,counters);
  translateAptitudes(root,counters);
  for(const row of find(root,'.dh2e-talent-table tbody tr'))translateTalentRow(row,counters);
  for(const el of find(root,'.dh2e-talent-chip')){
    const label=norm(el.textContent),next=translateOwnedTalentName(label);
    changeText(el,label,next,counters);
  }
  translatePowers(root,counters);
  // The system attaches its *English* talent benefit text as a tooltip to
  // already-purchased talents. Match the original by exact source content;
  // never replace user-written descriptions or custom talent tooltips.
  translateOwnedTalentBenefits(root,counters);
  translateEliteAdvances(root,counters);
  translateCosts(root,counters);
  return counters;
}
export function registerAdvancementUiAdapter({Hooks=globalThis.Hooks,game=()=>globalThis.game}={}){
  if(!Hooks?.on||!Hooks?.off)throw new Error('Foundry Hooks unavailable for advancement');
  if(INSTALLS.has(Hooks))return INSTALLS.get(Hooks);
  const getGame=()=>typeof game==='function'?game():game;
  let warned=false;
  const id=Hooks.on('renderApplicationV2',(app,root)=>{
    try{applyAdvancementUiTranslations(app,root,{game:getGame()});}
    catch(e){if(!warned)console.warn('dark-heresy-2e-apex-ru: advancement UI translation failed',e);warned=true;}
  });
  const api=Object.freeze({hookId:id,dispose(){Hooks.off('renderApplicationV2',id);INSTALLS.delete(Hooks);}});
  INSTALLS.set(Hooks,api);
  return api;
}
