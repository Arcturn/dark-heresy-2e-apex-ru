/**
 * v0.14.0 — Russian modifier lines in the DH2e universal roll dialog.
 * The dialog interpolates labels from unlocalized src/rolls/skill-check.mjs
 * and the source skill guide's example situations. This adapter translates
 * only system-authored rendered labels; roll state, disabled row keys, numbers,
 * difficulty enum values and user's custom documents are left unchanged.
 */
import runtime from './runtime-literals.mjs';
import progression from './progression-data.mjs';
import sheets from './ui-literals.mjs';
import guide from './skill-guide-data.mjs';
import {translateAdvancementRuleText} from './progression-ui-adapter.mjs';
import stockPowerData from './token-hud-powers.mjs';
import progressionData from './progression-data.mjs';
import {translateFocusTest} from './psychic-focus-l10n.mjs';
import {translatePowerDescriptor} from './token-hud-ui-adapter.mjs';

const SYS='dark-heresy-2e-apex';
const REG=new WeakMap();
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o??{},k);
const names=Object.freeze({
  'Situational modifiers / talents':'Ситуационные модификаторы / таланты',
  'Traits, drug penalties / encumbrance':'Черты, штрафы препаратов / перегрузка',
  'Test modifier / Fate':'Модификатор проверки / Судьба',
  'Target':'Целевое значение',
  'Attacker':'Атакующий',
  'Defender':'Защитник',
  'Base test value':'Базовое значение проверки',
  'Drug after-effects':'Последствия препаратов',
  'Encumbered':'Перегрузка',
  'Size / Incorporeal':'Размер / Бестелесность',
  'Item rules':'Правила предмета',
  'Fate':'Судьба',
  'Base characteristic':'Базовая характеристика',
  'Base skill':'Базовое значение навыка',
  'Manual modifier':'Ручной модификатор',
  'Modifiers':'Модификаторы',
  'Bonuses and penalties':'Бонусы и штрафы',
  'Situational modifiers':'Ситуационные модификаторы',
  'Target modifiers':'Модификаторы цели',
  'Psychic phenomena':'Психические феномены'
});
// Built-in strings the system still inserts directly in its test/attack UI.
// Exact matches avoid translating arbitrary player-written labels.
const rollExactLabels=Object.freeze({
  'Base test value':'Базовое значение проверки',
  'Drug after-effects':'Последствия препаратов',
  'Encumbered':'Перегрузка',
  'Size / Incorporeal':'Размер / Бестелесность',
  'Item rules':'Правила предмета',
  'Fate':'Судьба',
  'Base characteristic':'Базовая характеристика',
  'Base skill':'Базовый навык',
  'Skill value':'Значение навыка',
  'Characteristic':'Характеристика',
  'Total test modifier':'Общий модификатор проверки',
  'Modifier limit / other adjustments':'Ограничение модификатора / прочие поправки',
  'Other skill adjustments / limits':'Прочие поправки к навыку / ограничения',
  'Free Action':'Свободное действие',
  'Half Action':'Полудействие',
  'Full Action':'Полное действие',
  'No Aim':'Без прицеливания',
  'Braced':'С упором',
  'Unbraced':'Без упора',
  'One-handed':'В одной руке',
  'Aimed shot':'Прицельная атака',
  'Talent attack':'Атака от таланта',
  'Roll':'Бросок',
  'Focus Power':'Фокусировка психосилы',
  'to hit':'для попадания',
  'to pass':'для успеха',
  'to manifest':'для проявления',
  'Other modifiers':'Прочие модификаторы',
  'Test modifier':'Модификатор проверки',
  'Difficulty modifier':'Модификатор сложности',
  'Assistance':'Помощь',
  'Weapon class':'Класс оружия',
  'Aim':'Прицеливание',
  'Special uses':'Специальные применения'
});

const characteristics=Object.fromEntries(Object.values(sheets.characteristicNames??{}).map(e=>[e.en,e.ru]));
const skills=Object.fromEntries([...Object.values(sheets.coreSkillNames??{}),...Object.values(sheets.specialistSkillNames??{})].map(e=>[e.en,e.ru]));
const labels=Object.freeze({...names,...characteristics,...skills,...progression.terms,...runtime.labels,...rollExactLabels});
const live=g=>g?.system?.id===SYS && g?.i18n?.lang==='ru';
function derived(base){
  if(own(labels,base))return labels[base];
  // Some labels have a numeric, bracketed suffix; translate the canonical
  // prefix only, preserving the expression and sign. No generic word-by-word
  // replacement: that produced broken strings such as "Focus Силовое".
  const match=/^(.+?)(\s+\([+−-]?\d+\)|\s+[+−-]\d+)$/.exec(base);
  if(match && own(labels,match[1]))return labels[match[1]]+match[2];
  // Translate rule phrases only when the entire phrase becomes Russian;
  // partial literal replacement would be misleading to players.
  const computed=translateAdvancementRuleText(base);
  return computed!==base && !/[A-Za-z]{3,}/.test(computed)?computed:base;
}
/** A canonical source label, possibly with a known aptitude/skill qualifier. */
export function translateRollModifierLabel(source,{allowCompound=true}={}){
  if(typeof source!=='string')return source;
  const full=source.trim();
  if(!full)return source;
  let ru=own(labels,full)?labels[full]:null;
  if(!ru && allowCompound){
    // Dynamic rows can contain rule modifiers and known equipment names.
    // A row that contains no recognized rule name is not modified.
    const derivedLabel=derived(full);
    if(derivedLabel!==full)ru=derivedLabel;
  }
  if(!ru||ru===full)return source;
  return source.replace(full,ru);
}
const rootNode=x=>x?.nodeType ? x : (x?.[0]??x);
function includesApp(app,name){
  for(let c=app?.constructor;typeof c==='function';c=Object.getPrototypeOf(c)){
    if(c.name===name)return true;
    if(c===Function.prototype)break;
  }
  return false;
}
function find(root,selector){const found=[...(root?.querySelectorAll?.(selector)??[])];if(root.matches?.(selector))found.unshift(root);return found;}
function changeDirect(el,translator,stats,{readonlyOption=false}={}){
  if(!el)return;
  if(readonlyOption){
    // Changing OPTION's text node preserves its stable value/mechanical key.
    if(el.tagName?.toLowerCase()!=='option')return;
  }else if(el.closest?.('input,select,option,textarea,pre,code,script,style,[contenteditable],.ProseMirror,.editor'))return;
  for(const node of el.childNodes??[]){
    if(node.nodeType!==3)continue;
    const old=node.nodeValue??'',current=old.trim();if(!current)continue;
    const next=translator(current);
    if(next===current||typeof next!=='string')continue;
    const i=old.indexOf(current);node.nodeValue=old.slice(0,i)+next+old.slice(i+current.length);stats.text++;
  }
}
function changeTooltip(el,translation,stats){
  if(!el?.hasAttribute?.('data-tooltip'))return;
  const text=el.getAttribute('data-tooltip');
  const output=translation(text);
  if(output && output!==text){el.setAttribute('data-tooltip',output);stats.tooltip++;}
}
function translateUniversalRoll(root,stats){
  // Modifiers are represented by one row each; never touch the numeric <b> or row data-key.
  for(const row of find(root,'.dh2e-roll-list > .dh2e-roll-m')){
    const el=row.querySelector?.(':scope > span');
    if(el)changeDirect(el,text=>translateRollModifierLabel(text),stats);
  }
  for(const el of find(root,'.dh2e-roll-tiles .dh2e-lbl, .dh2e-roll-head .dh2e-roll-what, .dh2e-roll-num small')){
    changeDirect(el,text=>translateRollModifierLabel(text),stats);
  }
  for(const el of find(root,'.dh2e-roll-modes > button, .dh2e-roll-fields > label')){
    changeDirect(el,text=>translateRollModifierLabel(text),stats);
    changeTooltip(el,text=>translateRollModifierLabel(text),stats);
  }
  for(const select of find(root,'select[name="characteristic"],select[name="power"]')){
    for(const option of select.options??[]){
      // Option.value is the English system key, never change it.
      changeDirect(option,text=>translateRollModifierLabel(text),stats,{readonlyOption:true});
    }
  }
  for(const label of find(root,'.dh2e-roll-guide > summary > em')){
    changeDirect(label,text=>own(guide.use,text)?guide.use[text]:text,stats);
  }
  for(const span of find(root,'.dh2e-roll-guide-row > span')){
    changeDirect(span,text=>guide.modifiers[text]??text,stats);
  }
  for(const line of find(root,'.dh2e-roll-guide-use > summary')){
    changeDirect(line,text=>guide.special[text]??text,stats);
  }
  for(const el of find(root,'.dh2e-roll-guide-use > p')){
    // Long prose for special uses is custom rules text; translate only when
    // a source-exact entry has been separately verified. Never guess.
    changeDirect(el,text=>guide.specialDescriptions?.[text]??text,stats);
  }
  for(const el of find(root,'.dh2e-roll-tile[data-tooltip]'))changeTooltip(el,text=>translateRollModifierLabel(text),stats);
}
/** Fallback for source-authored Focus Power dialogs when the context bridge
 * could not be installed. All text replacements require a canonical power
 * name and exact original label. Current Psy Rating and modifier sums remain. */
function translateStockPsychicRoll(root,stats){
  const dialog=find(root,'.dh2e-roll.psychic')[0];
  if(!dialog)return;
  const title=dialog.querySelector('.dh2e-roll-name');
  const text=title?.textContent?.trim();
  const key=Object.keys(stockPowerData).find(k=>{
    const src=stockPowerData[k],translated=progressionData.psychicPowers[k];
    return text===src.en||text===translated?.ru||text===src.en.toUpperCase();
  });
  if(!key)return;
  const source=stockPowerData[key],translated=progressionData.psychicPowers[key];
  changeDirect(title,value=>value===source.en||value===source.en.toUpperCase()?translated.ru:value,stats);
  const subtitle=dialog.querySelector('.dh2e-roll-what');
  changeDirect(subtitle,value=>{
    if(value!==source.action&&!value.startsWith(source.action+', '))return value;
    return translatePowerDescriptor(source.action,'action')+value.slice(source.action.length).replace(/(\d+(?:[.,]\d+)?) m(?=\b|$)/gu,'$1 м');
  },stats);
  for(const row of find(dialog,'.dh2e-roll-list > .dh2e-roll-m')){
    changeDirect(row.querySelector(':scope > span'),value=>value===source.focusPower?translateFocusTest(value):value,stats);
  }
  for(const tile of find(dialog,'.dh2e-roll-tiles .dh2e-roll-tile')){
    const label=tile.querySelector('.dh2e-lbl')?.textContent?.trim();
    if(label==='Action'||label==='Действие')
      changeDirect(tile.querySelector('b'),value=>value===source.action?translatePowerDescriptor(value,'action'):value,stats);
  }
}
function translateLegacyCheck(root,stats){
  for(const label of find(root,'.dh2e-talent-option')){
    changeDirect(label,text=>translateRollModifierLabel(text),stats);
  }
  for(const option of find(root,'.dark-heresy-2e-apex-skill-check-dialog select[name="characteristicOverride"] option')){
    changeDirect(option,text=>translateRollModifierLabel(text),stats,{readonlyOption:true});
  }
}
export function applyRollModifiersTranslations(app,el,{game=globalThis.game}={}){
  const stats={active:false,kind:null,text:0,tooltip:0};
  if(!live(game))return stats;
  const root=rootNode(el);
  if(root?.nodeType!==1||!root.querySelectorAll)return stats;
  if(includesApp(app,'Dh2eRollDialog') && (root.matches?.('.dh2e-roll') || root.querySelector?.('.dh2e-roll'))){
    stats.active=true;stats.kind='universal';translateUniversalRoll(root,stats);translateStockPsychicRoll(root,stats);
  }else if(includesApp(app,'SkillCheckControl') && (root.matches?.('.dark-heresy-2e-apex-skill-check-dialog')||root.querySelector?.('.dark-heresy-2e-apex-skill-check-dialog'))){
    stats.active=true;stats.kind='legacy';translateLegacyCheck(root,stats);
  }
  return stats;
}
export function registerRollModifiersUiAdapter({Hooks=globalThis.Hooks,game=()=>globalThis.game}={}){
  if(!Hooks?.on||!Hooks?.off)throw new Error('Foundry Hooks unavailable');
  if(REG.has(Hooks))return REG.get(Hooks);
  let warned=false;
  const getGame=()=>typeof game==='function'?game():game;
  const hook=Hooks.on('renderApplicationV2',(app,root)=>{
    try{applyRollModifiersTranslations(app,root,{game:getGame()});}
    catch(e){if(!warned)console.warn('dh2e-ru: roll modifier translation',e);warned=true;}
  });
  const api=Object.freeze({hook,dispose(){Hooks.off('renderApplicationV2',hook);REG.delete(Hooks);}});
  REG.set(Hooks,api);
  return api;
}
