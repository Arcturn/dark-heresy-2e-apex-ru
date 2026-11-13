/** v1.0.1: source-exact, display-only localization of mental disorders,
 * Malignancies ("Рудименты") and Mutations for core DH2e Apex 0.1.10.
 * Numeric result keys and saved Actor data always retain the original values. */
import source from './soul-picker-data.mjs';
import runtime from './runtime-literals.mjs';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o??{},k);
const SOURCES=Object.freeze({malignancy:'malignancies',mutation:'mutations'});
const DISORDERS=new Map(source.disorders.map(row=>[row.en,row.ru]));
const RU_TO_DISORDER=new Map(source.disorders.map(row=>[row.ru,row.en]));
const CATALOG=Object.freeze({
 malignancy:new Map(source.malignancies.map(row=>[row.min,row])),
 mutation:new Map(source.mutations.map(row=>[row.min,row]))
});
export const soulPickerCounts=Object.freeze({malignancies:source.malignancies.length,mutations:source.mutations.length,disorders:source.disorders.length});
export const canonicalSoulOptions=type=>type==='disorder'?source.disorders:(source[SOURCES[type]]??[]);
export function translateDisorderName(name){return typeof name==='string'?DISORDERS.get(name)??name:name;}
export function sourceDisorderName(name){return typeof name==='string'?RU_TO_DISORDER.get(name)??name:name;}
export function translateMalignancyName(type,min,name){
 const entry=CATALOG[type]?.get(Number(min));
 if(!entry||typeof name!=='string')return name;
 return name===entry.en?entry.ru:name;
}
export function translateCorruptionEffect(effect){
 return typeof effect==='string'&&own(runtime.sanity,effect)?runtime.sanity[effect]:effect;
}
/** Every visible label is verified against an original numeric table entry. */
export function translateSoulOptionLabel(type,value,label){
 const row=CATALOG[type]?.get(Number(value));
 if(!row||typeof label!=='string')return label;
 const en=`${row.min}–${row.max}: ${row.en}`;
 const ru=`${row.min}–${row.max}: ${row.ru}`;
 return label===en?ru:label;
}
const degreeName=x=>typeof x==='string' ? runtime.labels?.[x]??x : x;
export function localizeSoulContext(soul){
 if(!soul || typeof soul!=='object')return soul;
 const out={...soul};
 if(out.insanity?.degree)out.insanity={...out.insanity,degree:degreeName(out.insanity.degree)};
 if(out.corruption?.degree)out.corruption={...out.corruption,degree:degreeName(out.corruption.degree)};
 if(Array.isArray(soul.disorders))out.disorders=soul.disorders.map(row=>({...row,
   name:translateDisorderName(row.name),
   severity:runtime.labels?.[row.severity]??row.severity
 }));
 for(const [field,type] of [['malignancies','malignancy'],['mutations','mutation']]){
   if(!Array.isArray(soul[field]))continue;
   out[field]=soul[field].map(row=>({...row,
     name:translateMalignancyName(type,row.min,row.name),
     effect:translateCorruptionEffect(row.effect)
   }));
 }
 return out;
}
