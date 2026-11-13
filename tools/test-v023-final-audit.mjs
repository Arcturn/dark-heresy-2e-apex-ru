import assert from 'node:assert/strict';
import {translateHardcodedLiteral, translateStockVehicleAndPageLabels, translateHardcodedSystemUI} from '../scripts/hardcoded-ui-adapter-v022.mjs';
import {inspectOpenSystemUI} from '../scripts/qa-ui-diagnostics-v023.mjs';
import catalog from '../scripts/hardcoded-ui-data-v022.mjs';
const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
assert.ok(Object.keys(catalog.labels).length>=520);
assert.equal(translateHardcodedLiteral('Operate'),'Управление');

const txt=value=>({nodeType:3,nodeValue:value});
function el(text='',selector='DIV',extra={}){
  const node={nodeType:1,tagName:'DIV',nodes:[txt(text)],selector,attrs:{...extra},
    get childNodes(){return this.nodes;},get textContent(){return this.nodes.map(n=>n.nodeValue??'').join('');},
    matches(q){return q.split(',').some(k=>k.trim()===selector || (k.trim()==='option, input, textarea, select, datalist, .window-title'&&selector==='OPTION'));},
    closest(){return null;}, getAttribute(k){return this.attrs[k]??null;},setAttribute(k,v){this.attrs[k]=v;},
    hasAttribute(k){return Object.hasOwn(this.attrs,k);},get children(){return []},get firstChild(){return this.nodes[0]??null;}
  };return node;
}
const weapon={class:el('Class','.dh2e-veh-weapon .stats i'),range:el('Rng','.dh2e-veh-weapon .stats i'),rof:el('RoF','.dh2e-veh-weapon .stats i'),damage:el('Dmg','.dh2e-veh-weapon .stats i'),pen:el('Pen','.dh2e-veh-weapon .stats i'),clip:el('Clip','.dh2e-veh-weapon .stats i')};
const operate=el('Operate 40','.dh2e-veh-tiles .apex-sub');
const page=el('(p. 125)','.apex-rule-body em');
const input=el('', 'INPUT',{value:'40',name:'system.dh2e.vehicle.manoeuvrability'});input.value='40';
const all=[...Object.values(weapon),operate,page,input];
const form=el('', 'FORM');form.tagName='FORM';form[0]=input;
form.matches=q=>q.includes('dark-heresy-2e-apex');
form.querySelector=q=>q.includes('dark-heresy-2e-apex')?weapon.class:null;
form.querySelectorAll=q=>q==='*'?all:q==='select option'?[]:all;
class Dh2eActorSheet {}
const first=translateHardcodedSystemUI(new Dh2eActorSheet(),form,{game});
assert.equal(first.active,true);
assert.equal(first.text,8);
assert.equal(weapon.class.textContent,'Класс');
assert.equal(weapon.range.textContent,'Дальн.');
assert.equal(weapon.rof.textContent,'СКС');
assert.equal(weapon.damage.textContent,'Урон');
assert.equal(weapon.pen.textContent,'Проб.');
assert.equal(weapon.clip.textContent,'Магазин');
assert.equal(operate.textContent,'Управление 40');
assert.equal(page.textContent,'(стр. 125)');
assert.equal(input.value,'40');assert.equal(input.getAttribute('value'),'40');assert.equal(input.getAttribute('name'),'system.dh2e.vehicle.manoeuvrability');
assert.equal(translateHardcodedSystemUI(new Dh2eActorSheet(),form,{game}).text,0);
// Only exact source patterns: no partially matching labels or user notes.
const custom=el('Operate now','.dh2e-veh-tiles .apex-sub');
assert.equal(translateStockVehicleAndPageLabels(custom,'Operate now'),'Operate now');
assert.equal(translateStockVehicleAndPageLabels(page,'(p. not a number)'),'(p. not a number)');
assert.equal(translateStockVehicleAndPageLabels(page,'(p. 125)'),'(стр. 125)');

const englishTalent=el('Strong Minded','.apex-rule-name');
const englishHeader=el('Adeptus Mechanicus','.apex-ident-value');
const vehicle=el('Class','.dh2e-veh-weapon .stats i');
const userText=el('Custom New Gear','.item-name');
const app=el('', '.application');
app.matches=q=>q.includes('dark-heresy-2e-apex');
app.querySelector=q=>q.includes('dark-heresy-2e-apex')?englishTalent:null;
app.querySelectorAll=()=>[englishTalent,englishHeader,vehicle,userText];
const document={querySelectorAll:()=>[app]};
const result=inspectOpenSystemUI({document,game});
assert.equal(result.active,true);
assert.equal(result.windows,1);
assert.equal(result.found,3);
assert.deepEqual(result.findings.map(f=>f.expected),['Непреклонный','Адептус Механикус','Класс']);
assert.equal(inspectOpenSystemUI({document,game:{system:{id:'other'},i18n:{lang:'ru'}}}).active,false);
assert.equal(inspectOpenSystemUI({document,game:{system:{id:'dark-heresy-2e-apex'},i18n:{lang:'en'}}}).found,0);
assert.equal(englishTalent.textContent,'Strong Minded'); // diagnostics are read-only
assert.equal(userText.textContent,'Custom New Gear');
console.log('v0.23: vehicle labels, dynamic Operate and page text, nonmutating diagnostic, English catalog names, locales, numeric & system keys: PASS');
