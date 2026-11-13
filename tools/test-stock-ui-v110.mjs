import assert from 'node:assert/strict';
import {STOCK_LABELS,translateStockLabel,translateStockFragment,showStockInput,restoreStockInput,translateStockUI,localizeCarouselKeybindings,registerStockUiAdapterV110} from '../scripts/stock-ui-adapter-v110.mjs';

const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'},keybindings:{actions:new Map()}};
assert.equal(Object.values(STOCK_LABELS).reduce((sum,group)=>sum+Object.keys(group).length,0),65);
assert.equal(translateStockLabel('cover',' Half '),' Половинное укрытие ');
assert.equal(translateStockLabel('action','Half'),'Half');
assert.equal(translateStockLabel('creature','Custom helmet'),'Custom helmet');
assert.equal(translateStockFragment('tier','T3'),'Ранг 3');
assert.equal(translateStockFragment('tier','T30'),'T30');
assert.equal(translateStockFragment('page','<b>Fear</b><em>p. 281</em>'),'<b>Fear</b><em>стр. 281</em>');
assert.equal(translateStockFragment('movement',' 3.5 / 6 m '),' 3.5 / 6 м ');
assert.equal(translateStockFragment('movement','My sword 6 m'),'My sword 6 m');

class Input {
  constructor(document) { this.ownerDocument=document;this.attrs={};this.dataset={};this.style={display:''};this.events={};this.value='';this.className=''; }
  getAttribute(name) { return Object.hasOwn(this.attrs,name)?this.attrs[name]:null; }
  hasAttribute(name) { return Object.hasOwn(this.attrs,name); }
  setAttribute(name,value) { this.attrs[name]=String(value); }
  removeAttribute(name) { delete this.attrs[name]; }
  insertAdjacentElement(position,element) { assert.equal(position,'afterend');this.proxy=element; }
  addEventListener(name,callback) { this.events[name]=callback; }
  dispatchEvent(event) { this.lastEvent=event;this.events[event.type]?.(event);return true; }
  remove() { this.removed=true; }
}
const document={defaultView:{Event},createElement:()=>new Input(document)};
const input=new Input(document);
input.value='Half';input.setAttribute('name','settings.entries.1.label');input.setAttribute('data-field','label');
input.setAttribute('aria-label','Название укрытия');input.setAttribute('tabindex','2');
let changes=0;input.addEventListener('change',()=>changes++);
assert.equal(showStockInput(input,'cover'),true);
assert.equal(input.proxy.value,'Половинное укрытие');
assert.equal(input.value,'Half');
assert.equal(input.getAttribute('name'),'settings.entries.1.label');
assert.equal(input.proxy.getAttribute('name'),null);
assert.equal(input.proxy.getAttribute('data-field'),null);
assert.equal(input.proxy.getAttribute('aria-label'),'Название укрытия');
assert.equal(showStockInput(input,'cover'),false);
const initialProxy=input.proxy;
input.disabled=true;input.readOnly=true;input.required=true;
input.setAttribute('aria-describedby','cover-hint');
assert.equal(showStockInput(input,'cover'),false);
assert.equal(input.proxy,initialProxy);
assert.equal(input.proxy.disabled,true);assert.equal(input.proxy.readOnly,true);assert.equal(input.proxy.required,true);
assert.equal(input.proxy.getAttribute('aria-describedby'),'cover-hint');
input.disabled=false;input.readOnly=false;input.required=false;input.removeAttribute('aria-describedby');
showStockInput(input,'cover');
assert.equal(input.proxy.disabled,false);assert.equal(input.proxy.readOnly,false);assert.equal(input.proxy.required,false);
assert.equal(input.proxy.getAttribute('aria-describedby'),null);
input.proxy.dispatchEvent(new Event('change',{bubbles:true}));
assert.equal(input.value,'Half');assert.equal(changes,1);
input.proxy.value='Моё укрытие';input.proxy.dispatchEvent(new Event('input',{bubbles:true}));
assert.equal(input.value,'Моё укрытие');assert.equal(input.lastEvent.bubbles,true);
input.proxy.dispatchEvent(new Event('change',{bubbles:true}));assert.equal(changes,2);
assert.equal(restoreStockInput(input),true);assert.equal(input.style.display,'');
assert.equal(input.getAttribute('tabindex'),'2');assert.equal(input.getAttribute('aria-hidden'),null);
assert.equal(input.value,'Моё укрытие');assert.equal(input.proxy.removed,true);
assert.equal(restoreStockInput(input),false);
const custom=new Input(document);custom.value='My Half';assert.equal(showStockInput(custom,'cover'),false);
const refreshed=new Input(document);refreshed.value='Half';showStockInput(refreshed,'cover');
const oldProxy=refreshed.proxy;refreshed.value='Partial';assert.equal(showStockInput(refreshed,'cover'),true);
assert.equal(oldProxy.removed,true);assert.equal(refreshed.proxy.value,'Частичное укрытие');

const tier={childNodes:[{nodeType:3,nodeValue:'T2'}]};
const condition={attrs:{'data-tooltip':'<em>p. 123</em>'},getAttribute(name){return this.attrs[name];},setAttribute(name,value){this.attrs[name]=value;}};
const move={childNodes:[{nodeType:3,nodeValue:'3 / 6 m'}]};
const sourceRoot={nodeType:1,matches:s=>s.includes('[class*="dh2e-"'),querySelectorAll(selector){
  if(selector==='.dh2e-talent-table .dh2e-tier')return [tier];
  if(selector==='.dh2e-condition[data-tooltip]')return [condition];
  if(selector==='.dh2e-hud-move .dark-heresy-2e-apex-token-hud-meter-header > strong')return [move];
  return [];
}};
const first=translateStockUI({constructor:{name:'Dh2eAdvancementApplication'}},sourceRoot,{game});
assert.equal(first.active,true);assert.equal(first.text,3);
assert.equal(tier.childNodes[0].nodeValue,'Ранг 2');
assert.equal(condition.attrs['data-tooltip'],'<em>стр. 123</em>');
assert.equal(move.childNodes[0].nodeValue,'3 / 6 м');
assert.equal(translateStockUI({},sourceRoot,{game}).text,0);
assert.equal(translateStockUI({},sourceRoot,{game:{...game,i18n:{lang:'en'}}}).active,false);
assert.equal(translateStockUI({},sourceRoot,{game:{...game,system:{id:'different'}}}).active,false);
const outsider={...sourceRoot,matches:()=>false,querySelector:()=>null};
assert.equal(translateStockUI({constructor:{name:'UserSheet'}},outsider,{game}).active,false);

game.keybindings.actions.set('dark-heresy-2e-apex.combatCarouselPrev',{name:'Combat Carousel: Previous Turn',onDown:()=>42});
const originalHandler=game.keybindings.actions.get('dark-heresy-2e-apex.combatCarouselPrev').onDown;
assert.equal(localizeCarouselKeybindings(game),1);
assert.equal(game.keybindings.actions.get('dark-heresy-2e-apex.combatCarouselPrev').name,'Боевая карусель — предыдущий ход');
assert.equal(game.keybindings.actions.get('dark-heresy-2e-apex.combatCarouselPrev').onDown,originalHandler);
assert.equal(localizeCarouselKeybindings(game),0);
assert.equal(localizeCarouselKeybindings({...game,i18n:{lang:'en'}}),1);

let next=0;const callbacks=new Map();
const Hooks={on(name,fn){const id=++next;callbacks.set(id,{name,fn});return id;},off(name,id){callbacks.delete(id);}};
const registration=registerStockUiAdapterV110({Hooks,game:()=>game});
assert.equal(registerStockUiAdapterV110({Hooks,game}),registration);
assert.equal(callbacks.size,3);
const option=(value,label)=>({getAttribute:name=>name==='value'?value:null,childNodes:[{nodeType:3,nodeValue:label}]});
const halfCover=option('half','Half');const customCover=option('my-cover','Half');const renamedCover=option('half','My half cover');
const rockcrete=option('rockcrete','Rockcrete, hatchways, thick iron, stone (16)');
const customMaterial=option('custom','Rockcrete, hatchways, thick iron, stone (16)');
const tileRoot={nodeType:1,matches:selector=>selector.includes('[class*="dark-heresy-2e-apex-"'),querySelectorAll(selector){
  if(selector==='.dark-heresy-2e-apex-tile-special-property-row select[name$=".coverKey"] option[value]')return [halfCover,customCover,renamedCover];
  if(selector==='.dark-heresy-2e-apex-tile-special-property-row select[data-tile-cover-material] option[value]')return [rockcrete,customMaterial];
  return [];
}};
const renderHook=[...callbacks.values()].find(entry=>entry.name==='renderApplicationV2').fn;
renderHook({constructor:{name:'FalloutMaWTileConfig'}},tileRoot);
assert.equal(halfCover.childNodes[0].nodeValue,'Половинное укрытие');
assert.equal(customCover.childNodes[0].nodeValue,'Half');assert.equal(renamedCover.childNodes[0].nodeValue,'My half cover');
assert.equal(rockcrete.childNodes[0].nodeValue,'Рокрит, люки, толстое железо, камень (16)');
assert.equal(rockcrete.getAttribute('value'),'rockcrete');
assert.equal(customMaterial.childNodes[0].nodeValue,'Rockcrete, hatchways, thick iron, stone (16)');
renderHook({constructor:{name:'FalloutMaWTileConfig'}},tileRoot);
assert.equal(halfCover.childNodes[0].nodeValue,'Половинное укрытие');
registration.dispose();assert.equal(callbacks.size,0);
class Observer {
  constructor(callback) { this.callback=callback;Observer.latest=this; }
  observe(body,options) { this.options=options; }
  disconnect() { this.disconnected=true; }
}
const heading={childNodes:[{nodeType:3,nodeValue:'Repair tools'}]};
const tooltip={nodeType:1,matches:selector=>selector.includes('[class*="dark-heresy-2e-apex-"'),closest:()=>tooltip,
  querySelectorAll(selector) { return selector.startsWith('.dark-heresy-2e-apex-inventory-tooltip .function-section')?[heading]:[]; }};
const observed=registerStockUiAdapterV110({Hooks,game,document:{body:{querySelectorAll:()=>[]}},MutationObserver:Observer});
assert.deepEqual(Observer.latest.options,{childList:true,subtree:true});
Observer.latest.callback([{addedNodes:[tooltip]}]);
assert.equal(heading.childNodes[0].nodeValue,'Ремонтные инструменты');
observed.dispose();assert.equal(Observer.latest.disconnected,true);assert.equal(callbacks.size,0);
console.log('v1.1 stock UI: 65 context labels, canonical forms, edits/state refresh, scoped fragments/tile cover, keybindings and hooks PASS');

// Optional real-DOM integration, using an external jsdom installation so the
// Foundry module and default dependency-free checks gain no runtime dependency.
// DH2E_RU_JSDOM=/absolute/path/to/node_modules/jsdom/lib/api.js node tools/test-stock-ui-v110.mjs
if (process.env.DH2E_RU_JSDOM) {
  const {JSDOM}=await import(process.env.DH2E_RU_JSDOM);
  const {registerHardcodedUiAdapterV022}=await import('../scripts/hardcoded-ui-adapter-v022.mjs');
  const dom=new JSDOM('<body></body>');
  const {document:doc,Event:DomEvent,FormData,MutationObserver}=dom.window;
  const form=doc.createElement('form');form.className='application dark-heresy-2e-apex';
  form.innerHTML='<label for="cover-label">Название укрытия</label><input id="cover-label" name="settings.entries.0.label" value="Half"><label>Второе укрытие<input name="settings.entries.1.label" value="Partial"></label><div class="dark-heresy-2e-apex-tile-special-property-list"></div>';
  doc.body.append(form);
  let hookId=0;const hookCalls=new Map();
  const domHooks={on(name,fn){hookCalls.set(++hookId,{name,fn});return hookId;},off(name,id){hookCalls.delete(id);}};
  const stock=registerStockUiAdapterV110({Hooks:domHooks,game,document:doc,MutationObserver});
  const generic=registerHardcodedUiAdapterV022({Hooks:domHooks,game,document:doc,MutationObserver});
  const render=(name,root)=>{for(const entry of hookCalls.values())if(entry.name==='renderApplicationV2')entry.fn({constructor:{name}},root);};
  render('CoverSettingsConfig',form);
  const canonical=form.querySelector('#cover-label');const proxy=canonical.nextElementSibling;
  const explicit=form.querySelector('label[for]');const wrapping=form.querySelectorAll('label')[1];
  assert.equal(explicit.control,proxy);assert.equal(wrapping.control,wrapping.querySelector('[data-dh2e-ru-stock-view]'));
  assert.equal(canonical.id,'cover-label');assert.equal(proxy.getAttribute('name'),null);
  assert.equal(new FormData(form).get('settings.entries.0.label'),'Half');
  proxy.focus();assert.equal(doc.activeElement,proxy);
  canonical.disabled=true;canonical.readOnly=true;render('CoverSettingsConfig',form);
  assert.equal(proxy.disabled,true);assert.equal(proxy.readOnly,true);
  canonical.disabled=false;canonical.readOnly=false;render('CoverSettingsConfig',form);
  let changes=0;canonical.addEventListener('change',()=>changes++);
  proxy.dispatchEvent(new DomEvent('change',{bubbles:true}));
  assert.equal(new FormData(form).get('settings.entries.0.label'),'Half');assert.equal(changes,1);
  proxy.value='Укрытие игрока';proxy.dispatchEvent(new DomEvent('input',{bubbles:true}));proxy.dispatchEvent(new DomEvent('change',{bubbles:true}));
  assert.equal(new FormData(form).get('settings.entries.0.label'),'Укрытие игрока');assert.equal(changes,2);
  restoreStockInput(canonical);assert.equal(explicit.control,canonical);assert.equal(explicit.htmlFor,'cover-label');
  const second=wrapping.querySelector('input[name]');restoreStockInput(second);
  assert.equal(wrapping.hasAttribute('for'),false);assert.equal(wrapping.control,second);

  const tileList=form.querySelector('.dark-heresy-2e-apex-tile-special-property-list');
  const tileMarkup=`<div class="dark-heresy-2e-apex-tile-special-property-row" data-tile-special-property-index="0">
    <select name="flags.dark-heresy-2e-apex.tileSpecialProperties.0.coverKey"><option value="partial">Partial</option><option value="half" selected>Half</option><option value="full">Three-Quarters</option><option value="custom">Half</option><option value="renamed">My half cover</option></select>
    <select name="flags.dark-heresy-2e-apex.tileSpecialProperties.0.material" data-tile-cover-material>
      <option value="thin">Armour-glass, genatorium pipes, thin metal, wooden planks (4)</option>
      <option value="crates">Flakboard, storage crates, sandbags, thick ice, trees (8)</option>
      <option value="barricade">Cogitator banks, stasis pods, standard barricades (12)</option>
      <option value="rockcrete" selected>Rockcrete, hatchways, thick iron, stone (16)</option>
      <option value="plasteel">Armaplas, voidship bulkheads, plasteel (32)</option>
      <option value="custom">Half</option>
    </select><input name="flags.dark-heresy-2e-apex.tileSpecialProperties.0.armour" type="number" value="11">
  </div>`;
  tileList.innerHTML=tileMarkup;
  const before=[...new FormData(form)];
  const checkTile=()=>{
    const cover=tileList.querySelector('select[name$=".coverKey"]');
    assert.deepEqual([...cover.options].map(option=>option.textContent),['Частичное укрытие','Половинное укрытие','Укрытие на три четверти','Half','My half cover']);
    const material=tileList.querySelector('[data-tile-cover-material]');
    assert.deepEqual([...material.options].map(option=>option.textContent.trim()),[
      'Бронестекло, трубы генератория, тонкий металл, деревянные доски (4)',
      'Бронеплиты, ящики, мешки с песком, толстый лёд, деревья (8)',
      'Блоки когитаторов, стазис-капсулы, обычные баррикады (12)',
      'Рокрит, люки, толстое железо, камень (16)',
      'Армапласт, переборки пустотного корабля, пласталь (32)','Half']);
    assert.deepEqual([...new FormData(form)],before);
  };
  render('FalloutMaWTileConfig',form);checkTile();
  render('FalloutMaWTileConfig',form);checkTile();
  // Source add/type-change handler calls innerHTML, not a render hook.
  tileList.innerHTML=tileMarkup;
  await new Promise(resolve=>setTimeout(resolve,0));checkTile();
  generic.dispose();stock.dispose();dom.window.close();
  console.log('Real DOM registered stock+generic hooks: tile cover/material labels, dynamic rows, custom labels, form values and accessible editor proxies PASS');
}
