/** v1.0.1 — stock Focus Power dialogs. Translates only view fields that match
 * the known power key + English source text from Apex 0.1.10. Never changes
 * rating, roll difficulty, modifiers, action costs or submitted inputs. */
import powerSources from './token-hud-powers.mjs';
import progression from './progression-data.mjs';
const DIFFICULTY=Object.freeze({
 Challenging:'Серьёзная',Difficult:'Сложная',Hard:'Тяжёлая',
 Routine:'Обыденная',Ordinary:'Ординарная'
});
const ATTRIBUTE=Object.freeze({
 Willpower:'Силы воли',Perception:'Восприятия',Psyniscience:'Психонауки',
 Intelligence:'Интеллекта',Fellowship:'Общительности',Toughness:'Выносливости'
});
const ACTION=Object.freeze({
 'Half Action':'Полудействие','Full Action':'Полное действие',
 'Free Action':'Свободное действие',Reaction:'Реакция',Special:'Особое действие',
 'Extended Action (3)':'Длительное действие (3)'
});
/** One strict translation for the 45 stock Focus Power formulas. */
export function translateFocusTest(source){
 if(typeof source!=='string')return source;
 const m=/^(Opposed )?(Challenging|Difficult|Hard|Routine|Ordinary)\s+(\([+−–-]?\d+\))\s+(Opposed )?(Willpower|Perception|Psyniscience|Intelligence|Fellowship|Toughness) test$/u.exec(source);
 if(!m)return source;
 const opposing=Boolean(m[1]||m[4]);
 const diff=DIFFICULTY[m[2]];
 return `${opposing?'Встречная ':''}${opposing?diff.toLowerCase():diff} ${m[3]} проверка ${ATTRIBUTE[m[5]]}`;
}
export function localizeStockFocusRollContext(context){
 if(!context || typeof context!=='object' || !context.psychic || !Array.isArray(context.psychic.powers))return context;
 const powers=context.psychic.powers;
 const sole=powers.length===1?powers[0]:null;
 if(!sole)return context;
 const data=powerSources[sole.key],translation=progression.psychicPowers[sole.key];
 if(!data || !translation || typeof context.title!=='string')return context;
 const out={...context};
 if(context.title===data.en || context.title===translation.en)out.title=translation.ru;
 if(typeof context.subtitle==='string'){
   // The system computes the range for the current Psy Rating, so translate
   // only the book action prefix and SI-unit presentation, not the number.
   const action=data.action;
   if(context.subtitle===action || context.subtitle.startsWith(`${action}, `)){
     out.subtitle=(ACTION[action]??action)+context.subtitle.slice(action.length).replace(/(\d+(?:[.,]\d+)?) m(?=\b|$)/gu,'$1 м');
   }
 }
 if(Array.isArray(context.rows))out.rows=context.rows.map(row=>{
   if(row?.key==='powerDifficulty' && row.label===data.focusPower)
     return {...row,label:translateFocusTest(row.label)};
   return row;
 });
 if(Array.isArray(context.tiles))out.tiles=context.tiles.map(row=>{
   if((row.label==='Действие'||row.label==='Action')&&row.value===data.action)
     return {...row,value:ACTION[data.action]??row.value};
   return row;
 });
 if(Array.isArray(context.psychic.powers))out.psychic={...context.psychic,powers:context.psychic.powers.map(row=>{
   const src=powerSources[row.key],translation=progression.psychicPowers[row.key];
   return src&&translation&&row.name===src.en?{...row,name:translation.ru}:row;
 })};
 return out;
}
export const stockFocusCount=Object.keys(powerSources).length;
