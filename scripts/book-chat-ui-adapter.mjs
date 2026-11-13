/** v0.21: source-class-scoped, text-node-only translation of stock psychic,
 * Warp and critical chat cards. Never rewrite ChatMessage documents, roll
 * results, target/player names or HTML markup. */
import book from './book-view-data.mjs';
import {psychicNameFromEnglish} from './book-view-l10n.mjs';
const SYS='dark-heresy-2e-apex';
const REG=new WeakMap();
const active=g=>g?.system?.id===SYS&&g?.i18n?.lang==='ru';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o??{},k);

export function translateStockPsychicHeading(text){
  if(typeof text!=='string')return text;
  const leading=/^\s*/u.exec(text)?.[0]??'';
  const core=text.slice(leading.length);
  for(const [key,p] of Object.entries(book.powers)){
    if(core===p.en)return leading+p.ru;
    if(core.startsWith(p.en+' ') && /^(?:\s+→|\s*$)/u.test(core.slice(p.en.length)))return leading+p.ru+core.slice(p.en.length);
  }
  return text;
}
export function translateWarpOutcome(name,text){
  const row=book.warpEffects?.[name];
  return row&&text===row.effectEn?{name:row.ru,text:row.effectRu}:{name:book.warpNames?.[name]??name,text};
}
const DAMAGE=Object.freeze({Impact:'Ударный',Rending:'Режущий',Energy:'Энергетический',Explosive:'Взрывной'});
const LOCATION=Object.freeze({Head:'Голова',Body:'Корпус',Arm:'Рука',Leg:'Нога',Left:'Левая',Right:'Правая',Rear:'Тыл',Front:'Фронт'});
/** Only source critical-table headings, not actor/target names. */
export function translateCriticalTable(text){
  if(typeof text!=='string')return text;
  const m=/^(Impact|Rending|Energy|Explosive) critical\s*·\s*(Head|Body|Arm|Leg)$/u.exec(text);
  if(!m)return text;
  return `Критический ${DAMAGE[m[1]].toLowerCase()} урон · ${LOCATION[m[2]].toLowerCase()}`;
}
function roots(root,selector){
  if(!root?.querySelectorAll)return [];
  return [...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
}
function changeText(element,translator,stats){
  if(!element?.childNodes)return;
  for(const node of element.childNodes){
    if(node.nodeType!==3 || typeof node.nodeValue!=='string')continue;
    const next=translator(node.nodeValue);
    if(typeof next==='string' && next!==node.nodeValue){node.nodeValue=next;stats.translated++;}
  }
}
export function applyBookChatTranslations(message,html,{game=globalThis.game}={}){
  const stats={active:false,translated:0};
  if(!active(game))return stats;
  const root=html?.nodeType?html:html?.[0]??html;
  if(!root?.querySelectorAll)return stats;
  stats.active=true;
  for(const card of roots(root,'.dark-heresy-2e-apex-chat-card.dh2e-psychic-card')){
    for(const title of roots(card,'.dh2e-ti'))changeText(title,translateStockPsychicHeading,stats);
  }
  for(const card of roots(root,'.dh2e-warp-card')){
    const name=card.querySelector?.('.dh2e-warp-name');
    const description=card.querySelector?.('.dh2e-warp-text');
    const sourceName=name?.textContent??'';
    const effect=book.warpEffects?.[sourceName];
    if(effect){
      changeText(name,s=>s===sourceName?effect.ru:s,stats);
      if(description)changeText(description,s=>book.warpTexts?.[s]??(s===effect.effectEn?effect.effectRu:s),stats);
    }
  }
  for(const card of roots(root,'.dh2e-crit-card')){
    for(const title of roots(card,'.dh2e-crit-band span'))changeText(title,translateCriticalTable,stats);
    for(const paragraph of roots(card,'.dh2e-crit-text'))changeText(paragraph,s=>book.criticalTexts?.[s]??s,stats);
  }
  // Messages may contain normal chat/user text alongside the cards. Never
  // iterate outside the exact system-owned chat card subtree.
  return stats;
}
export function registerBookChatUiAdapter({Hooks=globalThis.Hooks,game=()=>globalThis.game}={}){
  if(!Hooks?.on||!Hooks?.off)throw new Error('Foundry chat hooks unavailable');
  if(REG.has(Hooks))return REG.get(Hooks);
  let warned=false;
  const hook=Hooks.on('renderChatMessageHTML',(message,html)=>{
    try{applyBookChatTranslations(message,html,{game:typeof game==='function'?game():game});}
    catch(error){if(!warned)console.warn('dh2e-ru: book chat adapter skipped one card',error);warned=true;}
  });
  const api=Object.freeze({hook,dispose(){Hooks.off('renderChatMessageHTML',hook);REG.delete(Hooks);}});
  REG.set(Hooks,api);return api;
}
