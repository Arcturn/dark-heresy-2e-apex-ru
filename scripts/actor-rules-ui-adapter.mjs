/**
 * v0.16.0 — display-only translations for built-in talent/trait rows and
 * Acolyte origins on Apex Actor sheets.  Apex uses independent in-memory
 * catalogs to render these rows; Babele compendium translations do not alter
 * system.dh2e.talents/traits or the prepared sheet context.
 *
 * The original renderApplicationV2 hook is retained. A narrowly scoped
 * MutationObserver is additionally used because Foundry 14 can replace
 * individual PARTS after a tab change without re-running that app-level hook.
 * It watches only child-list changes, never actor data or form values.
 */
import rules from './actor-rules-data.mjs';
import progression from './progression-data.mjs';
import originTranslations from './creation-ui.mjs';
import {translateOwnedTalentName,translateAdvancementRuleText} from './progression-ui-adapter.mjs';

const ID='dark-heresy-2e-apex';
const SHEET_CSS='.dark-heresy-2e-apex-actor-sheet';
const REG=new WeakMap();
const original=value=>String(value??'').trim();
const talentByEnglish=new Map(Object.entries(progression.talents).map(([key,t])=>[t.en,{...t,key}]));
const traitByEnglish=new Map(Object.entries(rules.traits).map(([key,t])=>[t.en,{...t,key}]));
const aptitudeByEnglish=Object.fromEntries(Object.values(rules.aptitudes).map(x=>[x.en,x.ru]));
const displayOnly=game=>game?.system?.id===ID && game?.i18n?.lang==='ru';
const appActor=app=>app?.document?.documentName==='Actor'?app.document:app?.actor?.documentName==='Actor'?app.actor:null;
function isActorSheet(app){
  if(!appActor(app))return false;
  for(let c=app.constructor;typeof c==='function';c=Object.getPrototypeOf(c)){
    if(c.name==='FalloutMaWActorSheet')return true;
    if(c===Function.prototype)break;
  }
  return false;
}
const rootNode=root=>root?.nodeType ? root : (root?.[0]??root);
function find(root,sel){const out=[...(root?.querySelectorAll?.(sel)??[])];if(root?.matches?.(sel))out.unshift(root);return out;}
function replaceDirect(el,transform,counters){
  if(!el||el.closest?.('input,textarea,select,option,pre,code,script,style,[contenteditable],.editor,.ProseMirror'))return;
  for(const node of el.childNodes??[]){
    if(node.nodeType!==3)continue;
    const old=node.nodeValue??'',src=old.trim(),translated=src?transform(src):null;
    if(typeof translated!=='string'||translated===src||!translated)continue;
    const at=old.indexOf(src);
    node.nodeValue=old.slice(0,at)+translated+old.slice(at+src.length);
    counters.text++;
  }
}
/** Source aptitude labels from DH2E_APTITUDES, not skill keys. */
export function translateAptitudeList(value){
  if(typeof value!=='string'||!value.trim())return value;
  return value.replace(/(^|,\s*)([^,]+)(?=,|$)/gu,(_,separator,label)=>{
    const src=label.trim();return separator+(aptitudeByEnglish[src]??src);
  });
}
function translateSpecialisation(spec){
  return spec.split(/,\s*/).map(term=>{
    const clean=term.trim();
    return progression.specialisations[clean]??progression.terms[clean]??aptitudeByEnglish[clean]??clean;
  }).join(', ');
}
export function translateTraitLabel(label){
  if(typeof label!=='string')return label;
  if(traitByEnglish.has(label))return traitByEnglish.get(label).ru;
  for(const [en,entry] of traitByEnglish){
    if(!label.startsWith(en+' (')||!label.endsWith(')'))continue;
    return entry.ru+' ('+translateSpecialisation(label.slice(en.length+2,-1))+')';
  }
  return label;
}
export function translateCoreRuleSummary(value){
  if(typeof value!=='string')return value;
  for(const entry of Object.values(rules.traits))if(value===entry.summaryEn)return entry.summaryRu;
  for(const entry of Object.values(progression.talents))if(entry.benefit&&value===entry.benefit&&entry.benefitRu)return entry.benefitRu;
  return value;
}
// Canonical names are read from the Apex 0.1.10 origins catalogs and our
// existing Russian creation dictionary. Custom home worlds/roles are untouched.
const originEnglish=Object.freeze({
  homeworld: {feral:'Feral World',forge:'Forge World',highborn:'Highborn',hive:'Hive World',shrine:'Shrine World',voidborn:'Voidborn'},
  background: {administratum:'Adeptus Administratum',arbites:'Adeptus Arbites',astraTelepathica:'Adeptus Astra Telepathica',mechanicus:'Adeptus Mechanicus',ministorum:'Adeptus Ministorum',imperialGuard:'Imperial Guard',outcast:'Outcast'},
  role: {assassin:'Assassin',chirurgeon:'Chirurgeon',desperado:'Desperado',hierophant:'Hierophant',mystic:'Mystic',sage:'Sage',seeker:'Seeker',warrior:'Warrior'}
});
const originsByEnglish=Object.freeze(Object.fromEntries(
  [ ['homeworld','homeworlds'],['background','backgrounds'],['role','roles'] ].map(([kind,key])=>[
    kind, Object.fromEntries(Object.entries(originEnglish[kind]).map(([id,en])=>[en,originTranslations[key]?.[id]?.label??en]))
  ])
));
export function translateActorOriginLabel(kind,label){
  if(typeof label!=='string')return label;
  return originsByEnglish[kind]?.[label]??label;
}

function translateTalentList(root,counters){
  // A scoped selector works both when Foundry supplies the whole sheet and
  // when it renders only the identity tab's document part.
  const rows=new Set([...find(root,'.apex-rule-row[data-dh2e-talent]'),...find(root,'.apex-abilities .apex-rule-row[data-dh2e-talent]')]);
  for(const row of rows){
    const label=row.querySelector?.('summary > .apex-rule-name');
    if(label)replaceDirect(label,translateOwnedTalentName,counters);
    for(const el of row.querySelectorAll?.('summary > .apex-rule-meta')??[])replaceDirect(el,translateAptitudeList,counters);
    for(const el of row.querySelectorAll?.('.apex-rule-body > p')??[])
      replaceDirect(el,text=>translateCoreRuleSummary(text)===text?translateAdvancementRuleText(text):translateCoreRuleSummary(text),counters);
    for(const el of row.querySelectorAll?.('.apex-rule-body > .apex-rule-pre')??[])replaceDirect(el,translateAdvancementRuleText,counters);
  }
}
function translateTraitList(root,counters){
  const rows=new Set([...find(root,'.apex-rule-list > .apex-rule-row:not([data-dh2e-talent])'),...find(root,'.apex-abilities .apex-rule-list > .apex-rule-row:not([data-dh2e-talent])')]);
  for(const row of rows){
    for(const el of row.querySelectorAll?.('summary > .apex-rule-name')??[])replaceDirect(el,translateTraitLabel,counters);
    for(const el of row.querySelectorAll?.('summary > .apex-rule-meta')??[])replaceDirect(el,translateCoreRuleSummary,counters);
    for(const el of row.querySelectorAll?.('.apex-rule-body > p')??[])replaceDirect(el,translateCoreRuleSummary,counters);
  }
}
function translateActorAdvances(root,counters){
  for(const chip of find(root,'.apex-advances .apex-quals .apex-chip'))replaceDirect(chip,text=>aptitudeByEnglish[text]??null,counters);
  // Same treatment for an advances-part fragment (Foundry V14 partial renders).
  if(root.matches?.('.apex-advances'))for(const chip of find(root,'.apex-quals .apex-chip'))replaceDirect(chip,text=>aptitudeByEnglish[text]??null,counters);
  for(const row of find(root,'.apex-advances .apex-log li'))translateHistoryRow(row,counters);
  if(root.matches?.('.apex-advances'))for(const row of find(root,'.apex-log li'))translateHistoryRow(row,counters);
}
function translateHistoryRow(row,counters){
  const em=row.querySelector?.('em'),name=row.querySelector?.('span');
  if(em)replaceDirect(em,text=>({Talent:'Талант',Trait:'Черта',Skill:'Навык',Characteristic:'Характеристика',Elite:'Элитное улучшение',Psychic:'Психосила','Psychic Power':'Психосила','Psy Rating':'Пси-рейтинг'})[text]??null,counters);
  if(name)replaceDirect(name,text=>translateOwnedTalentName(text)!==text?translateOwnedTalentName(text):translateTraitLabel(text)!==text?translateTraitLabel(text):translateAdvancementRuleText(text),counters);
}
function translateIdentityHeader(root,counters){
  for(const header of find(root,'.apex-sheet-header')){
    const fields=header.querySelectorAll?.('.apex-idents:not(.apex-idents-unset) > .apex-ident')??[];
    ['homeworld','background','role','elite'].forEach((kind,index)=>{
      const label=fields[index]?.querySelector?.('.apex-ident-value');
      if(!label)return;
      replaceDirect(label,text=>kind==='elite'?(progression.terms[text]??text):translateActorOriginLabel(kind,text),counters);
    });
  }
}
function applyToRoot(root,counters){
  // Do not translate a widget, inventory name or an arbitrary embedded HTML
  // element simply because it contains a familiar English word.
  const abilitySections=find(root,'.apex-abilities');
  if(abilitySections.length)for(const section of abilitySections){
    translateTalentList(section,counters);
    translateTraitList(section,counters);
  }
  else {
    // Compatibility with a full-form hook root or a forwarded part wrapper.
    translateTalentList(root,counters);
    translateTraitList(root,counters);
  }
  const advancesSections=find(root,'.apex-advances');
  if(advancesSections.length)for(const section of advancesSections)translateActorAdvances(section,counters);
  else translateActorAdvances(root,counters);
  translateIdentityHeader(root,counters);
  return counters;
}
/** Hook-based path: requires the actual Apex sheet class and Actor document. */
export function applyActorRuleTranslations(app,html,{game=globalThis.game}={}){
  const result={active:false,text:0};
  const root=rootNode(html);
  if(!displayOnly(game)||!isActorSheet(app)||!root?.querySelectorAll)return result;
  result.active=true;
  applyToRoot(root,result);
  return result;
}
/** Fallback path: requires the system-specific Actor sheet CSS class. */
export function applyApexActorSheetDomTranslations(root,{game=globalThis.game}={}){
  const out={active:false,text:0};
  const node=rootNode(root);
  if(!displayOnly(game)||!node?.querySelectorAll||!node?.matches?.(SHEET_CSS))return out;
  out.active=true;
  applyToRoot(node,out);
  return out;
}
/**
 * Watches only Apex actor sheets. No mutation of the stored Actor or Item;
 * no text changes outside known rows, header values and advancement chips.
 */
export function registerActorRuleUiAdapter({
  Hooks=globalThis.Hooks, game=()=>globalThis.game,
  document=globalThis.document, MutationObserver=globalThis.MutationObserver
}={}){
  if(!Hooks?.on||!Hooks?.off)throw new Error('Foundry hooks unavailable');
  if(REG.has(Hooks))return REG.get(Hooks);
  const current=()=>typeof game==='function'?game():game;
  let warned=false, observer=null,readyId=null;
  function safeApply(host){
    try{return applyApexActorSheetDomTranslations(host,{game:current()});}
    catch(error){if(!warned)console.warn('dh2e-ru: actor sheet translation',error);warned=true;return null;}
  }
  function watch(){
    if(observer||!document?.body||typeof MutationObserver!=='function')return;
    observer=new MutationObserver(records=>{
      if(!displayOnly(current()))return;
      const hosts=new Set();
      for(const mutation of records){
        const target=mutation.target;
        const ancestor=target?.nodeType===1?target.closest?.(SHEET_CSS):target?.parentElement?.closest?.(SHEET_CSS);
        if(ancestor)hosts.add(ancestor);
        for(const node of mutation.addedNodes??[]){
          if(node?.nodeType!==1)continue;
          if(node.matches?.(SHEET_CSS))hosts.add(node);
          for(const nested of node.querySelectorAll?.(SHEET_CSS)??[])hosts.add(nested);
        }
      }
      for(const host of hosts)safeApply(host);
    });
    observer.observe(document.body,{childList:true,subtree:true});
    for(const host of document.querySelectorAll?.(SHEET_CSS)??[])safeApply(host);
  }
  const hook=Hooks.on('renderApplicationV2',(app,root)=>{
    try{
      applyActorRuleTranslations(app,root,{game:current()});
      // The sheet can render individual Handlebars PARTS asynchronously. If
      // the hook supplied only a fragment, use its existing full DOM host.
      if(isActorSheet(app)){
        const element=rootNode(app.element);
        if(element?.matches?.(SHEET_CSS))safeApply(element);
      }
    }catch(error){if(!warned)console.warn('dh2e-ru: actor rule labels',error);warned=true;}
  });
  if(document?.body)watch();
  else readyId=Hooks.on('ready',()=>{if(readyId!==null)Hooks.off('ready',readyId);readyId=null;watch();});
  const api=Object.freeze({hook,dispose(){
    Hooks.off('renderApplicationV2',hook);
    if(readyId!==null)Hooks.off('ready',readyId);
    observer?.disconnect();REG.delete(Hooks);
  }});
  REG.set(Hooks,api);
  return api;
}
