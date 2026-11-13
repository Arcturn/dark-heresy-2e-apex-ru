import assert from 'node:assert/strict';
import book from '../scripts/book-view-data.mjs';
import {localizeActorBookContext,localizePowerRow,localizeSustainWarning} from '../scripts/book-view-l10n.mjs';
import {applyBookChatTranslations,registerBookChatUiAdapter,translatePsychicChatFact,translateTickTestSmall} from '../scripts/book-chat-ui-adapter.mjs';

const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
const actor={name:'Acolyte',items:{contents:[]}};
const sustained={count:2,entries:[
  {key:'enfeeble',name:book.powers.enfeeble.en,action:'Half Action',rating:2},
  {key:'iron-arm',name:book.powers['iron-arm'].en,action:'Free Action',rating:1}
],warning:{text:'Каждая поддерживаемая психосила получает −2 ПР · Half Action каждый ход',phenomena:'+10 Психические феномены'}};
const context={dh2ePsychic:{groups:[],sustained}};
const before=JSON.stringify(context);
const translated=localizeActorBookContext(context,actor);
assert.equal(translated.dh2ePsychic.sustained.warning.text,'Каждая поддерживаемая психосила получает −2 ПР · Полудействие каждый ход');
assert.equal(translated.dh2ePsychic.sustained.entries[1].action,'Свободное действие');
assert.equal(translated.dh2ePsychic.sustained.entries[1].rating,1);
assert.equal(JSON.stringify(context),before);
assert.deepEqual(localizeActorBookContext(translated,actor),translated);
assert.equal(localizeSustainWarning({...sustained,warning:{text:'Each sustained power at −2 PR · Half Action each turn'}}).text,translated.dh2ePsychic.sustained.warning.text);
const customWarning={text:'My custom warning about Half Action'};
assert.equal(localizeSustainWarning({...sustained,warning:customWarning}),customWarning);
assert.equal(localizeSustainWarning({count:1,entries:sustained.entries,warning:customWarning}),customWarning);
const attack={damage:'1d10+3 E',pen:'4',kind:'Психический разряд'};
const attackRow={key:'smite',attack};
assert.equal(localizePowerRow(attackRow).attack.damage,'1d10+3 Э');
assert.equal(attack.damage,'1d10+3 E');
assert.equal(localizePowerRow({...attackRow,attack:{damage:'My custom damage E'}}).attack.damage,'My custom damage E');

class TextNode {
  constructor(value){this.nodeType=3;this.nodeValue=value;}
  get textContent(){return this.nodeValue;}
}
class Element {
  constructor(tag,{text='',classes='',attributes={},children=[]}={}){
    this.nodeType=1;this.tagName=tag.toUpperCase();this.classes=new Set(classes.split(' ').filter(Boolean));
    this.attributes={...attributes};this.childNodes=[...(text?[new TextNode(text)]:[]),...children];
  }
  get children(){return this.childNodes.filter(node=>node.nodeType===1);}
  get textContent(){return this.childNodes.map(node=>node.textContent).join('');}
  getAttribute(name){return this.attributes[name]??null;}
  setAttribute(name,value){this.attributes[name]=value;}
  matches(selector){
    if(selector.startsWith('.'))return selector.slice(1).split('.').every(name=>this.classes.has(name));
    return this.tagName===selector.toUpperCase();
  }
  querySelectorAll(selector){
    return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);
  }
  querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
}
function fact(label,value='',tooltip=''){
  return new Element('p',{attributes:tooltip?{'data-tooltip':tooltip}:{},children:[
    new Element('span',{text:label}),...(value?[new Element('b',{text:value})]:[])
  ]});
}
const target=new Element('span',{text:'→ Soul Bound, Range'});
const title=new Element('div',{text:'Enfeeble ',classes:'dh2e-ti',children:[target]});
const sustain=fact('Поддерживаемые','Half Action','Поддерживается (Half Action каждый ход).');
const range=fact('Дальность','12.5 m');
const damage=fact('Психический разряд','1d10+3 · Pen 4');
const endTurn=fact('Конец хода','PR 3');
const soul=fact('Soul Bound','87 → 82','d10: 5');
const effect=fact('Эффект','',book.powers.enfeeble.effectEn);
const customEffect=fact('Эффект','','My customized power effect');
const customName=fact('Soul Bound','+3','A healed actor');
const haywire=fact('Электромагнитное поле','Player Field m · 6 m');
const warp=book.warpEffects['Aura of Taint'];
const phenomena=fact('Психические феномены','Aura of Taint',`30: ${warp.effectEn}`);
const card=new Element('article',{classes:'dark-heresy-2e-apex-chat-card dh2e-card dh2e-psychic-card',children:[title,sustain,range,damage,endTurn,soul,effect,customEffect,customName,haywire,phenomena]});
const unrelated=fact('Дальность','99 m');
const root=new Element('section',{children:[card,unrelated]});
const message={content:'original persisted HTML',flags:{'dark-heresy-2e-apex':{dh2eResponses:{}}}};
const originalMessage=JSON.stringify(message);
const result=applyBookChatTranslations(message,root,{game});
assert.equal(result.active,true);
assert.ok(result.translated>=10);
assert.equal(title.childNodes[0].nodeValue,book.powers.enfeeble.ru+' ');
assert.equal(target.textContent,'→ Soul Bound, Range');
assert.equal(sustain.children[1].textContent,'Полудействие');
assert.equal(sustain.getAttribute('data-tooltip'),'Поддерживается (Полудействие каждый ход).');
assert.equal(range.children[1].textContent,'12.5 м');
assert.equal(damage.children[1].textContent,'1d10+3 · БП 4');
assert.equal(endTurn.children[1].textContent,'ПР 3');
assert.equal(soul.children[0].textContent,'Связанный душой');
assert.equal(soul.getAttribute('data-tooltip'),'d10: 5');
assert.equal(effect.getAttribute('data-tooltip'),book.powers.enfeeble.effectRu);
assert.equal(customEffect.getAttribute('data-tooltip'),'My customized power effect');
assert.equal(customName.children[0].textContent,'Soul Bound');
assert.equal(haywire.children[1].textContent,'Player Field m · 6 м');
assert.equal(phenomena.children[1].textContent,warp.ru);
assert.equal(phenomena.getAttribute('data-tooltip'),`30: ${warp.effectRu}`);
assert.equal(unrelated.children[1].textContent,'99 m');
assert.equal(JSON.stringify(message),originalMessage);
assert.equal(applyBookChatTranslations(message,root,{game}).translated,0,'re-render is idempotent');
assert.equal(applyBookChatTranslations(message,root,{game:{...game,i18n:{lang:'en'}}}).active,false);
assert.equal(applyBookChatTranslations(message,root,{game:{...game,system:{id:'other'}}}).active,false);
assert.deepEqual(translatePsychicChatFact({label:'A user label',value:'PR 3',tooltip:'Half Action'},{game}),{label:'A user label',value:'PR 3',tooltip:'Half Action'});
assert.equal(translatePsychicChatFact({label:'Поддерживаемые',value:'Полудействие',tooltip:'Поддерживается (Half Action каждый ход).'},{game}).tooltip,'Поддерживается (Полудействие каждый ход).');
// Registration uses the normal chat hook and keeps one handler per Hooks instance.
const callbacks=new Map();let registrations=0;
const Hooks={on(name,callback){callbacks.set(name,callback);return ++registrations;},off(name){callbacks.delete(name);}};
const registration=registerBookChatUiAdapter({Hooks,game:()=>game});
assert.equal(registerBookChatUiAdapter({Hooks,game:()=>game}),registration);
assert.equal(registrations,1);
const fresh=fact('Range','4 m');
const freshCard=new Element('article',{classes:'dark-heresy-2e-apex-chat-card dh2e-psychic-card',children:[fresh]});
callbacks.get('renderChatMessageHTML')({},freshCard);
assert.equal(fresh.children[1].textContent,'4 м');
registration.dispose();assert.equal(callbacks.size,0);
// Source tickTestPill shapes, including characteristic modifiers and unlabelled Medicae rolls.
const tickSmall=new Element('small',{text:'WP-20 43/50'});
const tickPill=new Element('span',{classes:'dh2e-tick-pill bad',text:'WP',attributes:{'data-tooltip':'43 / 50 · 1 DoF — Custom WP note','data-roll':'43'},children:[new Element('i'),tickSmall]});
const medicae=new Element('span',{classes:'dh2e-tick-pill ok',text:'Medicae',attributes:{'data-tooltip':'23 / 60 · 4 DoS'},children:[new Element('small',{text:'23/60'})]});
const actorHeading=new Element('span',{classes:'dh2e-tick-name',text:'Medicae · WP 43/50'});
const metric=new Element('span',{classes:'dh2e-tick-pill',text:'4 m'});
const namedPill=new Element('span',{classes:'dh2e-tick-pill',text:'Medicae',attributes:{'data-tooltip':'Custom item description'},children:[new Element('small',{text:'Левая рука'})]});
const tickCard=new Element('div',{classes:'dh2e-tick-card',children:[actorHeading,tickPill,medicae,metric,namedPill]});
const unrelatedPill=new Element('span',{classes:'dh2e-tick-pill',text:'WP',attributes:{'data-tooltip':'43 / 50 · 1 DoS'},children:[new Element('small',{text:'WP 43/50'})]});
const tickRoot=new Element('section',{children:[tickCard,unrelatedPill]});
applyBookChatTranslations({},tickRoot,{game});
assert.equal(tickPill.childNodes[0].nodeValue,'СВ');
assert.equal(tickSmall.textContent,'СВ-20 43/50');
assert.equal(tickPill.getAttribute('data-tooltip'),'43 / 50 · 1 СП — Custom WP note');
assert.equal(tickPill.getAttribute('data-roll'),'43');
assert.equal(medicae.childNodes[0].nodeValue,'Медика');
assert.equal(medicae.children[0].textContent,'23/60');
assert.equal(medicae.getAttribute('data-tooltip'),'23 / 60 · 4 СУ');
assert.equal(metric.textContent,'4 м');
assert.equal(actorHeading.textContent,'Medicae · WP 43/50');
assert.equal(namedPill.childNodes[0].nodeValue,'Medicae');
assert.equal(unrelatedPill.childNodes[0].nodeValue,'WP');
assert.equal(applyBookChatTranslations({},tickRoot,{game}).translated,0);
for(const [source,expected] of [['T 20/40','Вын 20/40'],['Ag 30/40','Лов 30/40'],['Int+20 43/50','Инт+20 43/50'],['Custom 43/50','Custom 43/50'],['WP Player','WP Player']])assert.equal(translateTickTestSmall(source),expected);
console.log('v1.1.0 psychic and tick cards, stock tooltips, language gates and re-render safety: PASS');
