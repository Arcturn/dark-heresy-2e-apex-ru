import assert from 'node:assert/strict';
import dictionary from '../scripts/runtime-literals.mjs';
import uiDictionary from '../scripts/ui-literals.mjs';
import {translateDh2eTestBreakdown} from '../scripts/chat-breakdown-ui-adapter.mjs';
import {
  translateExactRuntimeString, translateSanityCard, translateFixedCardTooltips, translateSourceOwnedUi,
  applyRuntimeChatTranslations, applyRuntimeUiTranslations, registerRuntimeUiAdapter
} from '../scripts/runtime-ui-adapter.mjs';

const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
const other={system:{id:'other'},i18n:{lang:'ru'}};
const t=(value)=>({nodeType:3,nodeValue:value});
class E{
  constructor(tag='span',name='',value='',attrs={}){
    this.nodeType=1;this.tagName=tag.toUpperCase();this.name=name;
    this.childNodes=value!==null?[t(value)]:[];this.attributes={...attrs};
    this.children=[];this.parent=null;this.locked=false;
  }
  add(child){this.children.push(child);this.childNodes.push(child);child.parent=this;return child;}
  matches(selector){
    if(selector==='*')return true;
    if(selector==='.dh2e-sanity-card')return this.name==='dh2e-sanity-card';
    if(selector.includes('[class*='))return /(?:apex-|dh2e-|dark-heresy-2e-apex)/.test(this.name);
    if(selector.includes('dark-heresy-2e-apex-chat-card') && this.name.includes('dark-heresy-2e-apex-chat-card'))return true;
    if(selector.includes('.dh2e-sanity-card'))return this.name==='dh2e-sanity-card';
    return false;
  }
  querySelectorAll(selector){
    const all=[];const visit=e=>{for(const c of e.children){all.push(c);visit(c);}};visit(this);
    if(selector==='*')return all;
    if(selector==='.dh2e-sanity-card')return all.filter(e=>e.name==='dh2e-sanity-card');
    return all.filter(e=>e.matches(selector));
  }
  querySelector(selector){return this.querySelectorAll(selector)[0] ?? null;}
  getAttribute(k){return this.attributes[k]??null;}
  hasAttribute(k){return Object.hasOwn(this.attributes,k);}
  setAttribute(k,v){this.attributes[k]=v;}
  closest(selector){
    if(this.locked || /^(INPUT|SELECT|OPTION|TEXTAREA|PRE|CODE)$/.test(this.tagName))return this;
    if(selector.includes('[data-tab=') && this.name==='notes')return this;
    if(selector.includes('.item-name') && this.name==='item-name')return this;
    return null;
  }
  text(){return this.childNodes.filter(c=>c.nodeType===3).map(c=>c.nodeValue).join('');}
}
const shockEn='Startled: a single Half Action next turn';
const shockRu='Вздрогнул: в следующий ход только одно полудействие';
const shockEffect='The character is badly startled. He can only take a single Half Action during his next turn, but afterward he acts normally.';
assert.equal(dictionary.sanity[shockEn],shockRu);
assert.match(dictionary.sanity[shockEffect],/только одно полудействие/);
assert.equal(translateExactRuntimeString('  Phobia  ',dictionary),'  Фобия  ');
assert.equal(translateExactRuntimeString('Actor Roltin',dictionary),'Actor Roltin');
const sourceText='Weapon Skill: +35<br>Trained: +10<br>Haywire Field: -10<br>Gas leak: -20<br>Target: +15';
const translated=translateDh2eTestBreakdown(sourceText,uiDictionary);
assert.match(translated,/Электромагнитное поле: -10/);
assert.match(translated,/Утечка газа: -20/);
assert.match(translated,/Целевое значение: \+15$/);
assert.equal(translateDh2eTestBreakdown(translated,uiDictionary),translated);

// One full source-generated chat card: summary + book-rule tooltip + trauma tooltip.
const root=new E('div','message-root',null);
const card=root.add(new E('div','dh2e-sanity-card',null));
const outcome=card.add(new E('p','dh2e-outcome',shockEn,{'data-tooltip':shockEffect,'data-action':'fear'}));
const row=card.add(new E('p','dh2e-line','Психическая травма',{'data-tooltip':'The character becomes withdrawn and quiet. He suffers a –10 penalty to all Fellowship-based tests for 3d10 hours.'}));
const runtimeOnly=card.add(new E('span','dh2e-track','Unsettled'));
const userNote=card.add(new E('span','notes','Phobia'));userNote.locked=true;
const changed=translateSanityCard(root,dictionary);
assert.equal(changed.text,2);assert.equal(changed.attributes,2);
assert.equal(outcome.text(),shockRu);
assert.equal(outcome.getAttribute('data-tooltip'),dictionary.sanity[shockEffect]);
assert.match(row.getAttribute('data-tooltip'),/3к10 часов/);
assert.equal(runtimeOnly.text(),'Встревоженный');
assert.equal(userNote.text(),'Phobia');
assert.equal(outcome.getAttribute('data-action'),'fear');
assert.deepEqual(translateSanityCard(root,dictionary).text,0);
assert.deepEqual(translateSanityCard(root,dictionary).attributes,0);

const anotherRoot=new E('div','chat-message',null);anotherRoot.add(new E('p','','Phobia'));
assert.deepEqual(applyRuntimeChatTranslations({id:'m1'},anotherRoot,{dictionary,game}),{active:false,text:0,attributes:0,inspected:0});
assert.deepEqual(applyRuntimeChatTranslations({id:'m1'},root,{dictionary,game:other}),{active:false,text:0,attributes:0,inspected:0});
assert.equal(applyRuntimeChatTranslations({id:'m1'},root,{dictionary,game}).active,true);

// Non-sanity source cards: translate exact tooltips but NEVER actor/user text.
const genericRoot=new E('div','message-root',null);
const genericCard=genericRoot.add(new E('article','dark-heresy-2e-apex-chat-card dh2e-card',null));
const genericLine=genericCard.add(new E('p','','Player: Psyker',{'data-tooltip':'Haywire Field','data-action':'fire'}));
const genericResult=applyRuntimeChatTranslations({id:'m2'},genericRoot,{dictionary,game});
assert.equal(genericResult.active,true);
assert.equal(genericResult.attributes,1);
assert.equal(genericLine.text(),'Player: Psyker');
assert.equal(genericLine.getAttribute('data-tooltip'),'Электромагнитное поле');
assert.equal(genericLine.getAttribute('data-action'),'fire');
assert.equal(translateFixedCardTooltips(genericRoot,dictionary).attributes,0);

const applicationRoot=new E('div','apex-actor-sheet',null);
const trait=applicationRoot.add(new E('span','apex-trait','From Beyond',{'title':'Soulless Aura','data-skill-id':'from-beyond'}));
const sensitive=applicationRoot.add(new E('input','','The Flesh is Weak'));sensitive.locked=true;
const custom=applicationRoot.add(new E('span','','My Custom Name'));
const userNamed=applicationRoot.add(new E('span','item-name','Counter Attack'));
class Dh2eTestApplication {}
class UnrelatedApplication {}
const app=new Dh2eTestApplication();
assert.equal(applyRuntimeUiTranslations(new UnrelatedApplication(),applicationRoot,{dictionary,game}).active,false);
assert.equal(applyRuntimeUiTranslations(app,applicationRoot,{dictionary,game:other}).active,false);
let result=applyRuntimeUiTranslations(app,applicationRoot,{dictionary,game});
assert.equal(result.active,true);
assert.equal(trait.text(),'Из-за граней');
assert.equal(trait.getAttribute('title'),'Аура Бездушия');
assert.equal(trait.getAttribute('data-skill-id'),'from-beyond');
assert.equal(sensitive.text(),'The Flesh is Weak');
assert.equal(userNamed.text(),'Counter Attack');
assert.equal(custom.text(),'My Custom Name');
result=applyRuntimeUiTranslations(app,applicationRoot,{dictionary,game});
assert.equal(result.text,0);assert.equal(result.attributes,0);

// Everything is fully disposable and does not mutate Hooks globally.
const h=new Map();let next=0;
const Hooks={on(name,fn){const id=++next;h.set(id,{name,fn});return id;},off(name,id){assert.equal(h.get(id)?.name,name);h.delete(id);}};
const reg=registerRuntimeUiAdapter({dictionary,Hooks,game:()=>game});
assert.equal(registerRuntimeUiAdapter({dictionary,Hooks,game:()=>game}),reg);
assert.equal(h.size,2);
for(const {name} of h.values())assert.ok(['renderApplicationV2','renderChatMessageHTML'].includes(name));
reg.dispose();reg.dispose();assert.equal(h.size,0);

console.log('Passed v0.12.0 runtime UI: exact source labels, shock, trauma, options, tooltips, scoped chat and app safety.');
