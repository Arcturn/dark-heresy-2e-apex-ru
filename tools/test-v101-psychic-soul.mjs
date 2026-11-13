import assert from 'node:assert/strict';
import powerSources from '../scripts/token-hud-powers.mjs';
import progression from '../scripts/progression-data.mjs';
import {translateFocusTest,localizeStockFocusRollContext,stockFocusCount} from '../scripts/psychic-focus-l10n.mjs';
import {localizeRollContext,localizeActorContext} from '../scripts/keyed-view-l10n.mjs';
import {soulPickerCounts,canonicalSoulOptions,translateSoulOptionLabel,translateDisorderName,sourceDisorderName,localizeSoulContext} from '../scripts/soul-picker-l10n.mjs';
import {applySoulPickerTranslations} from '../scripts/soul-picker-ui-adapter.mjs';
const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
assert.equal(stockFocusCount,45);
assert.deepEqual(soulPickerCounts,{malignancies:18,mutations:19,disorders:14});
for(const [key,stock] of Object.entries(powerSources)){
 const output=translateFocusTest(stock.focusPower);
 assert.notEqual(output,stock.focusPower,key);
 assert.doesNotMatch(output,/[A-Za-z]{3,}/,key);
 assert.ok(progression.psychicPowers[key]?.ru,key);
}
assert.equal(translateFocusTest('Opposed Difficult (–10) Willpower test'),'Встречная сложная (–10) проверка Силы воли');
assert.equal(translateFocusTest('Custom Focus test'), 'Custom Focus test');
// Verify all 45 stock powers work through the same source-keyed view path.
for(const [key,src] of Object.entries(powerSources)){
 const view={title:src.en,subtitle:`${src.action}, 15 m`,
   psychic:{rating:2,powers:[{key,name:src.en}]},
   rows:[{key:'powerDifficulty',label:src.focusPower,value:10}],
   tiles:[{label:'Действие',value:src.action}]};
 const result=localizeStockFocusRollContext(view);
 assert.equal(result.title,progression.psychicPowers[key].ru,key);
 assert.doesNotMatch(result.subtitle, /Half Action|Full Action|Reaction|Extended Action|Special/u,key);
 assert.doesNotMatch(result.rows[0].label,/[A-Za-z]{3,}/u,key);
 assert.equal(result.rows[0].value,10,key);
 assert.equal(result.tiles[0].value,result.subtitle.split(',')[0],key);
}

const sample={title:'Manipulate Flame',subtitle:'Half Action, 30 m',caption:'чтобы применить',
 rows:[{key:'powerDifficulty',label:'Routine (+20) Willpower test',value:20,info:true},{key:'strength',label:'Без сдерживания',value:0}],
 tiles:[{label:'Действие',value:'Half Action'},{label:'Феномены',value:'дубли'}],base:{label:'Сила Воли',value:55},
 psychic:{rating:3,powers:[{key:'manipulate-flame',name:'Manipulate Flame'}]}};
const before=JSON.stringify(sample);
const ru=localizeRollContext(sample);
assert.equal(ru.title,'Управление Пламенем');
assert.equal(ru.subtitle,'Полудействие, 30 м');
assert.equal(ru.rows[0].label,'Обыденная (+20) проверка Силы воли');
assert.equal(ru.rows[0].value,20);
assert.equal(ru.tiles[0].value,'Полудействие');
assert.equal(ru.psychic.powers[0].name,ru.title);
assert.equal(JSON.stringify(sample),before);
assert.equal(JSON.stringify(localizeRollContext(ru)),JSON.stringify(ru),'idempotence');
const edited={...sample,title:'My Personal Manipulate Flame',subtitle:'Custom Action, 30 m',rows:[{key:'powerDifficulty',label:'My custom test',value:99}]};
const editedRu=localizeRollContext(edited);
assert.equal(editedRu.title,edited.title);
assert.equal(editedRu.subtitle,edited.subtitle);
assert.equal(editedRu.rows[0].label,'My custom test');
for(const type of ['malignancy','mutation']){
 const book=canonicalSoulOptions(type);
 for(const row of book){
   assert.equal(translateSoulOptionLabel(type,row.min,`${row.min}–${row.max}: ${row.en}`),`${row.min}–${row.max}: ${row.ru}`);
   assert.equal(translateSoulOptionLabel(type,row.min,`Custom ${row.en}`),`Custom ${row.en}`);
 }
}
for(const entry of canonicalSoulOptions('disorder')){
 assert.equal(translateDisorderName(entry.en),entry.ru);
 assert.equal(sourceDisorderName(entry.ru),entry.en);
}
assert.equal(translateDisorderName('My disorder'),'My disorder');
const sources={insanity:{degree:'Unsettled'},corruption:{degree:'Soiled'},
 disorders:[{name:'Phobia: Fear of the Dead',severity:'Severe',other:1},{name:'Custom Disorder',severity:'Minor'}],
 malignancies:[{name:'Palsy',min:1,effect:canonicalSoulOptions('malignancy')[0].effectEn,penalty:3}],
 mutations:[{name:'Bestial Hide',min:1,effect:canonicalSoulOptions('mutation')[0].effectEn,quantity:7}]};
const sourceBefore=JSON.stringify(sources);
const translated=localizeSoulContext(sources);
assert.equal(translated.insanity.degree,'Встревоженный');
assert.equal(translated.corruption.degree,'Осквернённый');
assert.equal(translated.disorders[0].name,'Фобия: Страх перед мертвецами');
assert.equal(translated.disorders[0].severity,'Тяжёлое');
assert.equal(translated.disorders[1].name,'Custom Disorder');
assert.equal(translated.malignancies[0].name,'Подёргивание');
assert.equal(translated.malignancies[0].effect,canonicalSoulOptions('malignancy')[0].effectRu);
assert.equal(translated.mutations[0].name,'Звериная Кожа');
assert.equal(translated.mutations[0].quantity,7);
assert.equal(JSON.stringify(sources),sourceBefore);
const actor={system:{dh2e:{}}};
assert.equal(localizeActorContext({apex:{soul:sources}},actor).apex.soul.mutations[0].name,'Звериная Кожа');
// The table picker is source-signature scoped: its numeric values cannot change.
class DialogV2 {}
function mockOption(row){
 const attrs={value:String(row.min)};let text=`${row.min}–${row.max}: ${row.en}`;
 return {getAttribute(name){return attrs[name]??null;},get textContent(){return text;},set textContent(v){text=v;}};
}
function tableRoot(type){
 const book=canonicalSoulOptions(type);const options=book.map(mockOption);
 const select={options};
 return {nodeType:1,options,querySelector(selector){return selector==='select[name="min"]'?select:null;},querySelectorAll(){return []}};
}
for(const type of ['malignancy','mutation']){
 const root=tableRoot(type);const opts=root.options.map(o=>o.getAttribute('value'));
 const result=applySoulPickerTranslations(new DialogV2(),root,{game,DialogV2});
 assert.equal(result.active,true);assert.equal(result.kind,type);assert.equal(result.translated,root.options.length);
 assert.deepEqual(root.options.map(o=>o.getAttribute('value')),opts);
 const again=applySoulPickerTranslations(new DialogV2(),root,{game,DialogV2});
 assert.equal(again.translated,0);
}
const rogue=tableRoot('mutation');rogue.options[0].textContent='A different monster';
assert.equal(applySoulPickerTranslations(new DialogV2(),rogue,{game,DialogV2}).active,false);
assert.equal(applySoulPickerTranslations({},tableRoot('mutation'),{game,DialogV2}).active,false);
assert.equal(applySoulPickerTranslations(new DialogV2(),tableRoot('mutation'),{game:{system:{id:'other'},i18n:{lang:'ru'}},DialogV2}).active,false);
// No DOM in Node's standard library; lightweight nodes exercise the dialog
// injection, source-value preservation and custom-name fallback.
class Element {
 constructor(tag){this.tagName=tag.toUpperCase();this.nodeType=1;this.attrs={};this.children=[];this.parentElement=null;this.ownerDocument=doc;this.hidden=false;this._events={};this.value='';this.className='';this.id='';this.textContent='';}
 append(...elements){for(const child of elements){child.parentElement=this;this.children.push(child);}}
 insertBefore(element,ref){element.parentElement=this;const idx=this.children.indexOf(ref);this.children.splice(idx<0?0:idx,0,element);}
 setAttribute(name,v){this.attrs[name]=String(v);}
 getAttribute(name){return this.attrs[name]??null;}
 removeAttribute(name){delete this.attrs[name];}
 addEventListener(name,callback){this._events[name]=callback;}
 querySelectorAll(selector){if(selector==='option')return this.children.filter(x=>x.tagName==='OPTION');return [];}
 querySelector(selector){if(selector==='.dh2e-ru-disorder-choices')return this.children.find(x=>x.className==='dh2e-ru-disorder-choices')??null;return null;}
 closest(selector){if(selector==='label')return this.parentElement?.tagName==='LABEL'?this.parentElement:null;return null;}
 get options(){return this.children.filter(x=>x.tagName==='OPTION');}
}
const doc={createElement(tag){return new Element(tag);}};
const container=new Element('div');
const nameLabel=new Element('label');container.append(nameLabel);
const input=new Element('input');input.setAttribute('name','name');input.setAttribute('list','dh2e-disorders-Abc123');nameLabel.append(input);
const severity=new Element('select');
for(const value of ['Minor','Severe','Acute']){const o=new Element('option');o.value=value;severity.append(o)}
const list=new Element('datalist');list.id='dh2e-disorders-Abc123';
for(const item of canonicalSoulOptions('disorder')){const o=new Element('option');o.setAttribute('value',item.en);list.append(o)}
const root={nodeType:1,querySelector(selector){
 if(selector==='input[name="name"][list^="dh2e-disorders-"]')return input;
 if(selector==='select[name="severity"]')return severity;
 if(selector==='select[name="min"]')return null;
 if(selector==='.dh2e-ru-disorder-choices')return container.querySelector(selector);
 return null;
 },querySelectorAll(selector){return selector==='datalist'?[list]:[]}};
const dialogResult=applySoulPickerTranslations(new DialogV2(),root,{game,DialogV2});
assert.equal(dialogResult.kind,'disorder');assert.equal(dialogResult.translated,14);
const selector=container.querySelector('.dh2e-ru-disorder-choices').children[1];
assert.equal(selector.options[1].textContent,'Фобия');
assert.equal(selector.options[1].value,'Phobia');
selector.value='Phobia';selector._events.change();
assert.equal(input.value,'Phobia');assert.equal(nameLabel.hidden,true);
selector.value='';selector._events.change();
assert.equal(input.value,'');assert.equal(nameLabel.hidden,false);
input.value='My custom phobia';
assert.equal(applySoulPickerTranslations(new DialogV2(),root,{game,DialogV2}).active,false,'already installed, no duplicates');
assert.equal(input.value,'My custom phobia');
console.log('v1.0.1: psychic power + soul selection tests passed');
