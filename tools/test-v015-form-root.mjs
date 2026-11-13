/** Regression: Foundry 14 passes an actual HTMLFormElement to renderApplicationV2.
 * HTMLFormElement[0] is its FIRST CONTROL, not a jQuery wrapper: passing
 * root[0] to an adapter therefore silently discards the entire roll dialog.
 */
import assert from 'node:assert/strict';
import {applyRollModifiersTranslations, translateRollModifierLabel} from '../scripts/roll-modifiers-ui-adapter.mjs';
import {applyActorRuleTranslations} from '../scripts/actor-rules-ui-adapter.mjs';
const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
const text=s=>({nodeType:3,nodeValue:s});
function element(value='',{one={},many={},selectors=[],attributes={},tagName='DIV'}={}){
  return {nodeType:1,tagName,childNodes:[text(value)],attrs:{...attributes},
    get textContent(){return this.childNodes.map(n=>n.nodeValue??'').join('');},
    closest(){return null;},
    matches(selector){return selectors.includes(selector);},
    querySelector(selector){return one[selector]??null;},
    querySelectorAll(selector){return many[selector]??(one[selector]?[one[selector]]:[]);},
    getAttribute(key){return this.attrs[key]??null;},
    hasAttribute(key){return Object.hasOwn(this.attrs,key);},
    setAttribute(key,value){this.attrs[key]=value;}
  };
}
const firstControl=element('',{tagName:'INPUT'});
const baseLabel=element('Ballistic Skill');
const baseValue=element('29',{tagName:'B'});
const standardLabel=element('Standard Attack');
const shortLabel=element('Short range');
function row(label,num,key){
  return element('',{one:{':scope > span':label},attributes:{'data-key':key},many:{'b':[num]}});
}
const baseRow=row(baseLabel,baseValue,'');
const attackRow=row(standardLabel,element('+10',{tagName:'B'}),'action');
const rangeRow=row(shortLabel,element('+10',{tagName:'B'}),'range');
const seenRows=[baseRow,attackRow,rangeRow];
const selectors={
  '.dh2e-roll-list > .dh2e-roll-m':seenRows,
  '.dh2e-roll-tiles .dh2e-lbl, .dh2e-roll-head .dh2e-roll-what, .dh2e-roll-num small':[],
  '.dh2e-roll-modes > button, .dh2e-roll-fields > label':[],
  'select[name="characteristic"],select[name="power"]':[],
  '.dh2e-roll-guide > summary > em':[],
  '.dh2e-roll-guide-row > span':[],
  '.dh2e-roll-guide-use > summary':[],
  '.dh2e-roll-guide-use > p':[],
  '.dh2e-roll-tile[data-tooltip]':[]
};
const inner=element('',{selectors:['.dh2e-roll'],many:selectors});
const form=element('',{one:{'.dh2e-roll':inner},many:selectors,tagName:'FORM'});
form[0]=firstControl; // Real HTMLFormElement: firstControl is a form field.
class Dh2eRollDialog{}
const app=new Dh2eRollDialog();
assert.equal(translateRollModifierLabel('Ballistic Skill'),'Навык Стрельбы');
assert.equal(translateRollModifierLabel('Standard Attack'),'Стандартная атака');
assert.equal(translateRollModifierLabel('Short range'),'Ближняя дистанция');
const first=applyRollModifiersTranslations(app,form,{game});
assert.equal(first.active,true, 'Foundry HTMLFormElement must be selected instead of form[0]');
assert.equal(first.kind,'universal');
assert.equal(first.text,3);
assert.equal(baseLabel.textContent,'Навык Стрельбы');
assert.equal(standardLabel.textContent,'Стандартная атака');
assert.equal(shortLabel.textContent,'Ближняя дистанция');
assert.equal(baseValue.textContent,'29');
assert.equal(attackRow.getAttribute('data-key'),'action');
assert.equal(rangeRow.getAttribute('data-key'),'range');
assert.equal(applyRollModifiersTranslations(app,form,{game}).text,0,'Must be idempotent on re-render');
// Legacy jQuery-style array wrappers should continue to work.
assert.equal(applyRollModifiersTranslations(app,{0:form},{game}).active,true);
// Related bug: actor sheet form indexed by first control fails the same way.
const aptitude=element('Offence');
const actorForm=element('',{many:{
  '.apex-abilities .apex-rule-row[data-dh2e-talent]':[],
  '.apex-abilities .apex-rule-list > .apex-rule-row:not([data-dh2e-talent])':[],
  '.apex-advances .apex-quals .apex-chip':[aptitude],
  '.apex-advances .apex-log li':[]
},tagName:'FORM'});
actorForm[0]=firstControl;
class FalloutMaWActorSheet{constructor(){this.document={documentName:'Actor'};}}
const sheet=applyActorRuleTranslations(new FalloutMaWActorSheet(),actorForm,{game});
assert.equal(sheet.active,true);
assert.equal(sheet.text,1);
assert.equal(aptitude.textContent,'Нападение');
console.log('v0.15: indexed Foundry forms, all three screenshot labels, mechanic state, jQuery compatibility and actor sheets: PASS');
