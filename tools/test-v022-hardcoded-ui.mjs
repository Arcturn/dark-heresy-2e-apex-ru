import assert from 'node:assert/strict';
import {translateHardcodedLiteral,translateHardcodedSystemUI,registerHardcodedUiAdapterV022} from '../scripts/hardcoded-ui-adapter-v022.mjs';
import words from '../scripts/hardcoded-ui-data-v022.mjs';

assert.equal(words._meta.version,'0.22.0');
assert.ok(Object.keys(words.labels).length >= 450);
const game = {system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
const text = nodeValue => ({nodeType:3,nodeValue});
function el(value='', {tagName='DIV',attrs={},map={},list={},protectedNode=false,isRoot=false}={}) {
  const node = {
    nodeType:1,tagName,attrs:{...attrs}, childNodes:[text(value)],children:[],
    get textContent(){return this.childNodes.map(x=>x.nodeValue??'').join('');},
    get firstChild(){return this.childNodes[0]??null;},
    closest(){return protectedNode ? this : null;},
    matches(selector){return isRoot && selector.includes('dark-heresy-2e-apex') || selector==='option, input, textarea, select, datalist, .window-title' && ['OPTION','INPUT','SELECT'].includes(this.tagName);},
    querySelector(selector){return map[selector]??null;},
    querySelectorAll(selector){return list[selector]??[];},
    getAttribute(key){return this.attrs[key]??null;},
    hasAttribute(key){return Object.hasOwn(this.attrs,key);},
    setAttribute(key,value){this.attrs[key]=value;}
  };return node;
}
const label = el('  One of them at random ');
const button = el('Apply');
const input = el('',{tagName:'INPUT',attrs:{'aria-label':'Fear rating','placeholder':'What is rolled',name:'amount','data-key':'fear', value:'51'}});
input.value='51';
const option = el('Full',{tagName:'OPTION',attrs:{value:'full'}});
const select=el('',{tagName:'SELECT',attrs:{name:'system.dh2e.weapon.rof'}});
const form = el('',{tagName:'FORM',isRoot:true, list:{
  '*':[label,button,input,select,option],
  'select option':[option]
}});
form.querySelectorAll=selector=>selector==='*'?[label,button,input,select,option]:selector==='select option'?[option]:[label,button];
form.querySelector=selector=>selector.includes('dark-heresy')?label:null;
form[0]=input;
class Dh2eItemSheet {}
const app = new Dh2eItemSheet();
assert.equal(translateHardcodedLiteral(' GM mode '),' Режим мастера ');
const first=translateHardcodedSystemUI(app,form,{game});
assert.equal(first.active,true);
assert.equal(label.textContent,'  Один из них случайным образом ');
assert.equal(button.textContent,'Применить');
assert.equal(input.getAttribute('aria-label'),'Уровень Страха');
assert.equal(input.getAttribute('placeholder'),'Предмет броска');
assert.equal(input.getAttribute('name'),'amount');
assert.equal(input.getAttribute('value'),'51');
assert.equal(input.value,'51');
assert.equal(input.getAttribute('data-key'),'fear');
assert.equal(option.textContent,'Полное действие');
assert.equal(option.getAttribute('value'),'full');
assert.equal(first.text,2); assert.equal(first.attributes,2);assert.equal(first.options,1);
const second=translateHardcodedSystemUI(app,form,{game});
assert.equal(second.text+second.attributes+second.options,0);
const untouched=el('Strong Minded',{protectedNode:true});
const node=el('',{tagName:'FORM',list:{'*':[untouched]},isRoot:true});
node.querySelectorAll=selector=>selector==='*'?[untouched]:[untouched];
assert.equal(translateHardcodedSystemUI(app,node,{game}).text,0);
assert.equal(untouched.textContent,'Strong Minded');
assert.equal(translateHardcodedSystemUI(app,form,{game:{...game,i18n:{lang:'en'}}}).active,false);
assert.equal(translateHardcodedSystemUI(app,form,{game:{...game,system:{id:'other-system'}}}).active,false);
const other=el('',{tagName:'FORM',list:{'*':[button]}});
other.querySelectorAll=()=>[button];
other.querySelector=()=>null;
assert.equal(translateHardcodedSystemUI({constructor:{name:'ForeignUI'}},other,{game}).active,false);

// DialogV2 is an upstream generic Foundry application: recognize the literal
// Corruption prompt by its title, action and field, not its constructor name.
const title=el('Gain Corruption');
const cp=el('Corruption Points');
const amount=el('',{tagName:'INPUT',attrs:{value:'1',name:'amount'}});
const dButton=el('Apply');
const dialog=el('',{tagName:'FORM',map:{'.window-title':title,'input[name="amount"][type="number"]':amount,'.dialog-content .form-group label':cp},list:{
  '.dialog-content .form-group label, .dialog-buttons button, footer button':[cp,dButton]
}});
dialog.querySelectorAll=sel=>sel==='*'?[title,cp,amount,dButton]:sel==='select option'?[]:sel.includes('dialog-content')?[cp,dButton]:[];
assert.equal(translateHardcodedSystemUI({constructor:{name:'DialogV2'}},dialog,{game}).active,true);
assert.equal(title.textContent,'Получить очки Порчи');
assert.equal(cp.textContent,'Очки Порчи');
assert.equal(dButton.textContent,'Применить');
assert.equal(amount.getAttribute('value'),'1');

// Hook lifecycle and mutation fallback; never intercept game mechanics.
class Observer {
  constructor(callback){this.callback=callback;Observer.latest=this;}
  observe(root,options){this.root=root;this.options=options;}
  disconnect(){this.disconnected=true;}
}
let next=0;const callbacks=new Map();
const Hooks={on(name,fn){const id=++next;callbacks.set(id,{name,fn});return id;},off(name,id){callbacks.delete(id);}};
const doc={body:el('')};
const reg=registerHardcodedUiAdapterV022({Hooks,game:()=>game,document:doc,MutationObserver:Observer});
assert.equal(Observer.latest.options.childList,true);
assert.equal(Observer.latest.options.subtree,true);
assert.equal(registerHardcodedUiAdapterV022({Hooks,game:()=>game}),reg);
assert.equal(callbacks.size,2);
reg.dispose();
assert.equal(callbacks.size,0);
assert.equal(Observer.latest.disconnected,true);
console.log('v0.22: first-party editor labels, real form roots, dialog, accessibility, option values, protected user text, locale/system gating and hook lifecycle: PASS');
