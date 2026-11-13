/** v0.21: source-class-scoped, text-node-only translation of stock psychic,
 * Warp and critical chat cards. Never rewrite ChatMessage documents, roll
 * results, target/player names or HTML markup. */
import book from './book-view-data.mjs';
import {psychicNameFromEnglish} from './book-view-l10n.mjs';
import {translatePowerDescriptor} from './token-hud-ui-adapter.mjs';
import uiDictionary from './ui-literals.mjs';
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
const PSYCHIC_LABELS=Object.freeze({
  SustainedLabel:['Sustained','Поддерживаемые'],
  RangeLabel:['Range','Дальность'],
  EffectLabel:['Effect','Эффект'],
  EndOfTurnBlast:['End of turn','Конец хода'],
  HaywireField:['Haywire Field','Электромагнитное поле'],
  Kind_bolt:['Psychic Bolt','Психический разряд'],
  Kind_barrage:['Psychic Barrage','Психический шквал'],
  Kind_storm:['Psychic Storm','Психический шторм'],
  Kind_blast:['Psychic Blast','Психический взрыв'],
  Phenomena:['Psychic Phenomena','Психические феномены'],
  Perils:['Perils of the Warp','Опасности Варпа']
});
const STOCK_POWER_EFFECTS=new Map(Object.values(book.powers)
  .filter(power=>power.effectEn&&power.effectRu).map(power=>[power.effectEn.trim(),power.effectRu]));
const SUSTAIN_ACTIONS=[...new Set(Object.values(book.powers).map(power=>power.sustained))]
  .map(action=>[action,translatePowerDescriptor(action,'action')]).filter(([source,translated])=>source!==translated);
function psychicLabelMatches(label,key,game){
  const variants=PSYCHIC_LABELS[key]??[];
  return variants.includes(label)||label===game?.i18n?.localize?.(`FALLOUTMAW.DH2E.Psychic.${key}`);
}
/** Match a source-authored fact and its shape before touching any value. */
export function translatePsychicChatFact(fact,{game=globalThis.game}={}){
  const {label,value='',tooltip=''}=fact;
  const out={...fact};
  const matches=key=>psychicLabelMatches(label,key,game);
  if(matches('SustainedLabel')){
    out.value=translatePowerDescriptor(value,'action');
    for(const [source,translated] of SUSTAIN_ACTIONS){
      if(value!==source&&value!==translated)continue;
      if(tooltip===`Sustained (${source} each turn).`
        ||tooltip===`Поддерживается (${source} каждый ход).`
        ||tooltip===game?.i18n?.format?.('FALLOUTMAW.DH2E.Psychic.Sustained',{action:source}))
        out.tooltip=`Поддерживается (${translated} каждый ход).`;
    }
  }
  if(matches('RangeLabel')&&/^\d+(?:[.,]\d+)? m$/u.test(value))out.value=value.slice(0,-1)+'м';
  if(matches('HaywireField'))out.value=value.replace(/(^| · )(\d+(?:[.,]\d+)?) m$/u,'$1$2 м');
  if(matches('EndOfTurnBlast'))out.value=value.replace(/^PR (\d+)$/u,'ПР $1');
  if(['Kind_bolt','Kind_barrage','Kind_storm','Kind_blast'].some(matches))
    out.value=value.replace(/ · Pen (\d+)$/u,' · БП $1');
  if(label==='Soul Bound' && /^\d+ → \d+$/u.test(value)&&/^d10: \d+$/u.test(tooltip))
    out.label='Связанный душой';
  if(matches('EffectLabel'))out.tooltip=STOCK_POWER_EFFECTS.get(tooltip.trim())??tooltip;
  if(matches('Phenomena')||matches('Perils')){
    out.value=book.warpNames?.[value]??value;
    const match=/^(\d+): (.+)$/u.exec(tooltip);
    if(match){
      const translated=book.warpTexts?.[match[2]]??book.warpEffects?.[value]?.effectRu;
      const source=book.warpEffects?.[value]?.effectEn;
      if(book.warpTexts?.[match[2]] || match[2]===source)out.tooltip=`${match[1]}: ${translated}`;
    }
  }
  return out;
}
function replaceFactText(element,before,after,stats){
  if(before===after)return;
  changeText(element,text=>{
    if(text.trim()!==before)return text;
    const position=text.indexOf(before);
    return text.slice(0,position)+after+text.slice(position+before.length);
  },stats);
}
function translatePsychicFacts(card,game,stats){
  for(const line of roots(card,'p')){
    const children=Array.from(line.children??[]);
    const left=children[0],right=children[1];
    // cardLine emits a plain span and optional b. Nested content is outside this shape.
    if(left?.tagName!=='SPAN'||children.length>2||(right&&right.tagName!=='B'))continue;
    if(left.children?.length||right?.children?.length)continue;
    const fact={label:left.textContent?.trim()??'',value:right?.textContent?.trim()??'',tooltip:line.getAttribute?.('data-tooltip')??''};
    const translated=translatePsychicChatFact(fact,{game});
    replaceFactText(left,fact.label,translated.label,stats);
    replaceFactText(right,fact.value,translated.value,stats);
    if(translated.tooltip!==fact.tooltip){line.setAttribute('data-tooltip',translated.tooltip);stats.translated++;}
  }
}
const TICK_TEST_TOOLTIP=/^(\d+ \/ \d+ · \d+) (DoS|DoF|СУ|СП)(?=$| — )/u;
const TICK_DEGREES=Object.freeze({DoS:'СУ',DoF:'СП'});
/** tickTestPill writes these numeric strings separately from actor names. */
export function translateTickTestSmall(text){
  if(typeof text!=='string')return text;
  const match=/^([A-Za-z]+)([+−-]\d+)? (\d+\/\d+)$/u.exec(text);
  const label=match&&uiDictionary.characteristicAbbreviations[match[1]];
  return label?`${label}${match[2]??''} ${match[3]}`:text;
}
function translateTickPills(card,stats){
  for(const pill of roots(card,'.dh2e-tick-pill')){
    const small=Array.from(pill.children??[]).find(child=>child.tagName==='SMALL');
    const tooltip=pill.getAttribute?.('data-tooltip')??'';
    if(TICK_TEST_TOOLTIP.test(tooltip)){
      changeText(small,translateTickTestSmall,stats);
      changeText(pill,text=>{
        const core=text.trim();
        const translated=core==='Medicae'?uiDictionary.coreSkillNames.doctor.ru:uiDictionary.characteristicAbbreviations[core];
        if(!translated)return text;
        const position=text.indexOf(core);
        return text.slice(0,position)+translated+text.slice(position+core.length);
      },stats);
      const translated=tooltip.replace(TICK_TEST_TOOLTIP,(_match,numbers,degrees)=>
        `${numbers} ${TICK_DEGREES[degrees]??degrees}`);
      if(translated!==tooltip){pill.setAttribute('data-tooltip',translated);stats.translated++;}
    }
    if(!small&&!tooltip)changeText(pill,text=>text.replace(/^(\s*\d+(?:[.,]\d+)?) m(\s*)$/u,'$1 м$2'),stats);
    if(/^\d+$/u.test(small?.textContent??''))changeText(pill,text=>text==='Table 5-3'?'Таблица 5-3':text,stats);
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
    translatePsychicFacts(card,game,stats);
  }
  for(const card of roots(root,'.dh2e-warp-card')){
    translateTickPills(card,stats);
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
    translateTickPills(card,stats);
    for(const title of roots(card,'.dh2e-crit-band span'))changeText(title,translateCriticalTable,stats);
    for(const paragraph of roots(card,'.dh2e-crit-text'))changeText(paragraph,s=>book.criticalTexts?.[s]??s,stats);
  }
  for(const card of roots(root,'.dh2e-tick-card'))translateTickPills(card,stats);
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
