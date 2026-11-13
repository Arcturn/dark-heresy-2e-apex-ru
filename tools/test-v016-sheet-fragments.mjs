/** v0.16: real Apex sheet template structure, part replacement and origins.
 * This test catches the old gap: renderApplicationV2 can run for an inactive
 * tab and will not necessarily run again when a PART is swapped in later.
 */
import assert from 'node:assert/strict';
import {
  translateActorOriginLabel, applyActorRuleTranslations,
  applyApexActorSheetDomTranslations, registerActorRuleUiAdapter
} from '../scripts/actor-rules-ui-adapter.mjs';
import progression from '../scripts/progression-data.mjs';
const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
const tn=value=>({nodeType:3,nodeValue:value});
function el(value='',{matches=[],one={},many={},attrs={}}={}){
  return {
    nodeType:1,childNodes:[tn(value)],attrs:{...attrs},
    get textContent(){return this.childNodes.map(n=>n.nodeValue??'').join('');},
    closest(){return null;},
    matches(s){return matches.includes(s);},
    querySelector(s){return one[s]??null;},
    querySelectorAll(s){return many[s]??(one[s]?[one[s]]:[]);},
    getAttribute(s){return this.attrs[s]??null;},
    setAttribute(s,v){this.attrs[s]=v;}
  };
}
const talents = [
  ['Strong Minded','Willpower, Defence'],
  ['Mechadendrite Use (Utility)','Intelligence, Tech'],
  ['Weapon Training (Solid Projectile)','General, Finesse'],
  ['Resistance','Toughness, Defence'],
  ['Superior Chirurgeon','Intelligence, Fieldcraft'],
  ['Mechadendrite Use','Intelligence, Tech']
];
const talentNodes=talents.map(([name,apts])=>{
  const node=el('',{one:{'summary > .apex-rule-name':el(name)},many:{
    'summary > .apex-rule-meta':[el(apts)],'.apex-rule-body > p':[],'.apex-rule-body > .apex-rule-pre':[]
  },attrs:{'data-dh2e-talent':''}});
  return node;
});
const traitName=el('Mechanicus Implants'),traitDesc=el('Character has mechanical augmentations.');
const trait=el('',{many:{
  'summary > .apex-rule-name':[traitName], 'summary > .apex-rule-meta':[traitDesc],
  '.apex-rule-body > p':[el('Character has mechanical augmentations.')]
}});
const abilities=el('',{matches:['.apex-abilities'],many:{
  '.apex-rule-row[data-dh2e-talent]':talentNodes,
  '.apex-rule-list > .apex-rule-row:not([data-dh2e-talent])':[trait]
}});
const headings=[el('Voidborn'),el('Adeptus Mechanicus'),el('Chirurgeon'),el('—')];
const identityFields=headings.map(x=>el('',{one:{'.apex-ident-value':x}}));
const header=el('',{matches:['.apex-sheet-header'],many:{'.apex-idents:not(.apex-idents-unset) > .apex-ident':identityFields}});
const actorRoot=el('',{matches:['.dark-heresy-2e-apex-actor-sheet'],many:{
  '.apex-abilities':[abilities],'.apex-sheet-header':[header],'.apex-advances':[]
}});
const actor={documentName:'Actor',system:{dh2e:{talents:[{key:'strong-minded'}]}},name:'Сутура-IX'};
class FalloutMaWActorSheet{constructor(){this.document=actor;this.element=actorRoot;}}
assert.equal(translateActorOriginLabel('homeworld','Voidborn'),'Пустоторождённый');
assert.equal(translateActorOriginLabel('background','Adeptus Mechanicus'),'Адептус Механикус');
assert.equal(translateActorOriginLabel('role','Chirurgeon'),'Хирургеон');
assert.equal(translateActorOriginLabel('role','My custom role'),'My custom role');
// Before observer fires, clicking a tab can hand the hook only the identity part.
const part=applyActorRuleTranslations(new FalloutMaWActorSheet(),abilities,{game});
assert.equal(part.active,true);
assert.equal(part.text,15);
// Full DOM fallback translates header and maintains already-localized talents.
const first=applyApexActorSheetDomTranslations(actorRoot,{game});
assert.equal(first.active,true);
assert.equal(first.text,3);
assert.deepEqual(headings.map(e=>e.textContent),['Пустоторождённый','Адептус Механикус','Хирургеон','—']);
const expectNames=[
  'Непреклонный', 'Использование Механодендритов (Вспомогательный)',
  'Выучка с Оружием (Твёрдотельное)', 'Сопротивление',
  'Превосходный Хирургеон','Использование Механодендритов'
];
for(let i=0;i<talentNodes.length;i++){
  assert.equal(talentNodes[i].querySelector('summary > .apex-rule-name').textContent,expectNames[i]);
  assert.ok(!talentNodes[i].querySelectorAll('summary > .apex-rule-meta')[0].textContent.match(/\b(Willpower|Intelligence|General|Toughness|Fieldcraft|Tech|Finesse|Defence)\b/));
}
assert.equal(traitName.textContent,'Имплантаты Механикус');
assert.equal(traitDesc.textContent,'Персонаж обладает механическими улучшениями тела.');
assert.equal(actor.name,'Сутура-IX');
assert.equal(actor.system.dh2e.talents[0].key,'strong-minded');
assert.equal(applyApexActorSheetDomTranslations(actorRoot,{game}).text,0,'idempotent');
// DOM fallback must never touch unrelated sheets or run outside ru.
assert.equal(applyApexActorSheetDomTranslations(el(),{game}).active,false);
assert.equal(applyApexActorSheetDomTranslations(actorRoot,{game:{...game,i18n:{lang:'en'}}}).active,false);
// Simulated late PART insertion: an observer catches mutations even without a render hook.
const tnode=el('Strong Minded'),row=el('',{one:{'summary > .apex-rule-name':tnode},many:{'summary > .apex-rule-meta':[]}});
const latePart=el('',{matches:['.apex-abilities'],many:{'.apex-rule-row[data-dh2e-talent]':[row]}});
actorRoot.querySelectorAll=s=>s==='.apex-abilities'?[latePart]:s==='.apex-sheet-header'?[header]:[];
class Observer {
  constructor(fn){this.fn=fn;Observer.latest=this;}
  observe(body,opts){this.body=body;this.opts=opts;}
  disconnect(){this.disconnected=true;}
  emit(records){this.fn(records);}
}
const callbacks=new Map();let next=0;
const hooks={on(event,fn){const key=++next;callbacks.set(key,{event,fn});return key;},off(event,key){callbacks.delete(key);}};
const doc={body:el(''),querySelectorAll(s){return s==='.dark-heresy-2e-apex-actor-sheet'?[]:[];}};
const reg=registerActorRuleUiAdapter({Hooks:hooks,game:()=>game,document:doc,MutationObserver:Observer});
assert.equal(Observer.latest.opts.childList,true);
assert.equal(Observer.latest.opts.subtree,true);
Observer.latest.emit([{target:doc.body,addedNodes:[actorRoot]}]);
assert.equal(tnode.textContent,'Непреклонный','translate a newly inserted identity PART');
reg.dispose();
assert.equal(Observer.latest.disconnected,true);
assert.equal(callbacks.size,0);
console.log('v0.16: 6 talent rows, trait summary, 3 identity fields, lazy part insertion, system/language guards and unchanged actor state: PASS');
