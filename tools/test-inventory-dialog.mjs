import assert from 'node:assert/strict';
import dictionary from '../scripts/dialog-ui.mjs';
import {applyDialogUiTranslations,registerDialogUiAdapter} from '../scripts/dialog-ui-adapter.mjs';
const source=dictionary.inventoryReceipt;
const e=(tag,text,attrs={})=>({
  nodeType:1,tagName:tag.toUpperCase(),children:[],attributes:attrs,
  childNodes:[{nodeType:3,nodeValue:text}],
  get textContent(){return this.childNodes.map(n=>n.nodeValue).join('')},
  getAttribute(k){return this.attributes[k]??null;},
  hasAttribute(k){return Object.hasOwn(this.attributes,k);},
  setAttribute(k,v){this.attributes[k]=v;}
});
const title=e('h4',source.title.en),content=e('p',source.content.en);
const buttons=['consumed','cancelled','close'].map(key=>e('button',source[key].en,{'data-action':key}));
const form={
  querySelector(){return null;},
  querySelectorAll(sel){
    if(sel==='p')return [content];
    if(sel==='button[data-action]')return buttons;
    if(sel==='input,select,textarea')return [];
    return [];
  }
};
const root={nodeType:1,querySelectorAll(sel){
  if(sel==='form')return [form];
  if(sel==='.window-header > .window-title')return [title];
  return [];
},matches(){return false;}};
class DialogV2 {}
const app=new DialogV2();app.options={window:{title:source.title.en}};
const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
assert.deepEqual(applyDialogUiTranslations(app,root,{dictionary,game:{system:{id:'wrong'},i18n:{lang:'ru'}},DialogV2}),
  {active:false,matched:null,translatedText:0,pinnedOptionValues:0});
const r=applyDialogUiTranslations(app,root,{dictionary,game,DialogV2});
assert.equal(r.matched,'inventoryReceipt');assert.equal(r.translatedText,5);
assert.equal(title.textContent,source.title.ru);assert.equal(content.textContent,source.content.ru);
for(let i=0;i<buttons.length;i++){const key=['consumed','cancelled','close'][i];assert.equal(buttons[i].textContent,source[key].ru);assert.equal(buttons[i].getAttribute('data-action'),key);}
assert.equal(applyDialogUiTranslations(app,root,{dictionary,game,DialogV2}).translatedText,0);
buttons[0].setAttribute('data-action','other');
assert.equal(applyDialogUiTranslations(app,root,{dictionary,game,DialogV2}).matched,null);
assert.equal(title.textContent,source.title.ru); // partial changes disallowed
console.log('Passed 9 inventory receipt recovery-dialog safety assertions');
