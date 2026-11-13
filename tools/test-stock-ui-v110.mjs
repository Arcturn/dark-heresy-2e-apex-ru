import assert from 'node:assert/strict';
import {STOCK_LABELS,translateStockLabel,translateStockFragment,showStockInput,restoreStockInput,translateStockUI,localizeCarouselKeybindings,registerStockUiAdapterV110} from '../scripts/stock-ui-adapter-v110.mjs';

const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'},keybindings:{actions:new Map()}};
assert.equal(Object.values(STOCK_LABELS).reduce((sum,group)=>sum+Object.keys(group).length,0),65);
assert.equal(translateStockLabel('cover',' Half '),' Половинное укрытие ');
assert.equal(translateStockLabel('action','Half'),'Half');
assert.equal(translateStockLabel('creature','Custom helmet'),'Custom helmet');
for (const name of ['constructor','toString','__proto__']) {
  assert.equal(translateStockLabel('creature',name),name);
  assert.equal(translateStockLabel(name,'Helmet'),'Helmet');
}
assert.equal(translateStockFragment('tier','T3'),'Ранг 3');
assert.equal(translateStockFragment('tier','T30'),'T30');
assert.equal(translateStockFragment('page','<b>Fear</b><em>p. 281</em>'),'<b>Fear</b><em>стр. 281</em>');
assert.equal(translateStockFragment('movement',' 3.5 / 6 m '),' 3.5 / 6 м ');
assert.equal(translateStockFragment('movement','My sword 6 m'),'My sword 6 m');
assert.equal(translateStockFragment('grip','1H'),'1 р.');
assert.equal(translateStockFragment('grip','2H'),'2 р.');
assert.equal(translateStockFragment('grip',' 1H / 2H '),' 1 р. / 2 р. ');
assert.equal(translateStockFragment('grip','1H −20'),'1 р. −20');
assert.equal(translateStockFragment('grip','Custom 1H'),'Custom 1H');
assert.equal(translateStockFragment('grip','1H −30'),'1H −30');
assert.equal(translateStockFragment('lift',' 128 px '),' 128 пикс. ');
assert.equal(translateStockFragment('lift','Custom 128 px'),'Custom 128 px');
assert.equal(translateStockFragment('lift','-12 px'),'-12 px');
assert.equal(translateStockFragment('thrown','Дальность (SB ×)'),'Дальность (БС ×)');
assert.equal(translateStockFragment('thrown','SB * 3'),'SB * 3');

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
assert.equal(input.getAttribute('type'),'hidden');
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
assert.equal(input.getAttribute('type'),null);
assert.equal(input.getAttribute('tabindex'),'2');assert.equal(input.getAttribute('aria-hidden'),null);
assert.equal(input.value,'Моё укрытие');assert.equal(input.proxy.removed,true);
assert.equal(restoreStockInput(input),false);
const custom=new Input(document);custom.value='My Half';assert.equal(showStockInput(custom,'cover'),false);
const hidden=new Input(document);hidden.type='hidden';hidden.value='Half';assert.equal(showStockInput(hidden,'cover'),false);
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
const rangeHint=new Input(document);rangeHint.setAttribute('placeholder','20 metres x psy rating');rangeHint.value='5 metres x psy rating';
const qualityHint=new Input(document);qualityHint.setAttribute('placeholder','Tearing, Proven (3), Blast (2)');qualityHint.value='Tearing';
const groupHint=new Input(document);groupHint.setAttribute('placeholder','Las, Solid Projectile, Chain…');groupHint.value='las';
const hintsRoot={nodeType:1,matches:selector=>selector.includes('[class*="dh2e-"'),querySelectorAll(selector){
  if(selector==='input[name="system.dh2e.range"][placeholder]')return [rangeHint];
  if(selector==='input[name="system.dh2e.qualities"][placeholder]')return [qualityHint];
  if(selector==='input[name="system.dh2e.weaponGroup"][placeholder]')return [groupHint];
  return [];
}};
renderHook({constructor:{name:'Dh2eItemSheet'}},hintsRoot);
assert.equal(rangeHint.getAttribute('placeholder'),'Пример записи: 20 metres x psy rating');
assert.equal(groupHint.getAttribute('placeholder'),'Одна группа: las / solidProjectile / chain');
assert.equal(qualityHint.getAttribute('placeholder'),'Свойства по-английски: Tearing, Proven (3), Blast (2)');
assert.equal(rangeHint.value,'5 metres x psy rating');assert.equal(groupHint.value,'las');assert.equal(qualityHint.value,'Tearing');
assert.equal(translateStockUI({constructor:{name:'Dh2eItemSheet'}},hintsRoot,{game}).text,0);
const registeredSheetId='dark-heresy-2e-apex.Dh2eItemSheet';
const sheetChoice=option(registeredSheetId,'Dark Heresy Item');
const otherChoice=option('unrelated.sheet','Dark Heresy Item');
const configRoot={nodeType:1,querySelectorAll:selector=>selector==='select option[value]'?[sheetChoice,otherChoice]:[]};
const configApp={document:{documentName:'Item',type:'talent'},constructor:{name:'DocumentSheetConfig',getSheetClassesForSubType(name,type){
  assert.equal(name,'Item');assert.equal(type,'talent');return {sheetClasses:{[registeredSheetId]:'Dark Heresy Item'}};
}}};
renderHook(configApp,configRoot);
assert.equal(sheetChoice.childNodes[0].nodeValue,'Предмет Dark Heresy');
assert.equal(otherChoice.childNodes[0].nodeValue,'Dark Heresy Item');
assert.equal(sheetChoice.getAttribute('value'),registeredSheetId);
const presetError=new Input(document);presetError.setAttribute('title','Preset name cannot be empty.');
presetError.children=[{tagName:'SPAN',childNodes:[{nodeType:3,nodeValue:'Preset name cannot be empty.'}]}];
const presetRoot={nodeType:1,matches:selector=>selector.includes('[class*="dark-heresy-2e-apex-"'),querySelectorAll:selector=>selector==='.dark-heresy-2e-apex-settings-presets-summary-error'?[presetError]:[]};
renderHook({constructor:{name:'SettingsPresetsConfig'}},presetRoot);
assert.equal(presetError.getAttribute('title'),'Название набора настроек не может быть пустым.');
assert.equal(presetError.children[0].childNodes[0].nodeValue,'Название набора настроек не может быть пустым.');
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

  // A CSS-hidden required original would invalidate the form without a
  // focusable target. Only the visible proxy must own constraint validation.
  const required=doc.createElement('input');required.type='text';required.name='required-stock';
  required.defaultValue='Half';required.required=true;form.append(required);
  assert.equal(required.willValidate,true);showStockInput(required,'cover');
  const requiredProxy=required.nextElementSibling;
  assert.equal(required.type,'hidden');assert.equal(required.willValidate,false);
  assert.equal(requiredProxy.type,'text');assert.equal(requiredProxy.willValidate,true);
  assert.equal(requiredProxy.required,true);assert.equal(new FormData(form).get('required-stock'),'Half');
  requiredProxy.value='';requiredProxy.dispatchEvent(new DomEvent('input',{bubbles:true}));
  assert.equal(new FormData(form).get('required-stock'),'');
  assert.equal(required.checkValidity(),true);assert.equal(requiredProxy.validity.valueMissing,true);
  const invalid=[];const onInvalid=event=>invalid.push(event.target);form.addEventListener('invalid',onInvalid,true);
  assert.equal(form.checkValidity(),false);assert.deepEqual(invalid,[requiredProxy]);
  requiredProxy.focus();assert.equal(doc.activeElement,requiredProxy);
  required.readOnly=true;showStockInput(required,'cover');
  assert.equal(requiredProxy.readOnly,true);assert.equal(requiredProxy.willValidate,false);assert.equal(form.checkValidity(),true);
  required.readOnly=false;required.required=false;showStockInput(required,'cover');
  assert.equal(requiredProxy.readOnly,false);assert.equal(requiredProxy.required,false);assert.equal(form.checkValidity(),true);
  required.required=true;showStockInput(required,'cover');
  assert.equal(requiredProxy.required,true);assert.equal(form.checkValidity(),false);assert.equal(required.willValidate,false);
  form.removeEventListener('invalid',onInvalid,true);
  form.addEventListener('reset',event=>event.preventDefault(),{once:true});
  form.reset();await Promise.resolve();
  assert.equal(required.value,'');assert.equal(requiredProxy.value,'');
  form.reset();await Promise.resolve();
  assert.equal(required.value,'Half');assert.equal(requiredProxy.value,'Половинное укрытие');
  assert.equal(new FormData(form).get('required-stock'),'Half');assert.equal(form.checkValidity(),true);
  requiredProxy.value='';requiredProxy.dispatchEvent(new DomEvent('input',{bubbles:true}));
  restoreStockInput(required);
  assert.equal(required.type,'text');assert.equal(required.willValidate,true);assert.equal(required.required,true);
  assert.equal(required.value,'');assert.equal(required.defaultValue,'Half');assert.equal(required.validity.valueMissing,true);
  assert.equal(new FormData(form).get('required-stock'),'');required.remove();
  const dirty=doc.createElement('input');dirty.name='dirty-stock';dirty.defaultValue='Half';dirty.value='Partial';form.append(dirty);
  showStockInput(dirty,'cover');const dirtyProxy=dirty.nextElementSibling;
  assert.equal(dirtyProxy.value,'Частичное укрытие');
  form.reset();await Promise.resolve();
  assert.equal(dirtyProxy.value,'Половинное укрытие');
  dirtyProxy.dispatchEvent(new DomEvent('change',{bubbles:true}));
  assert.equal(new FormData(form).get('dirty-stock'),'Half');
  restoreStockInput(dirty);assert.equal(dirty.getAttribute('type'),null);dirty.remove();

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

  const itemForm=doc.createElement('form');itemForm.className='application dh2e-item-sheet';
  const itemMarkup=`<input type="text" name="system.dh2e.range" value="5 metres x psy rating" placeholder="20 metres x psy rating" list="power-range">
    <datalist id="power-range"><option value="20 metres x psy rating"></option></datalist>
    <input type="text" name="system.dh2e.weaponGroup" value="solidProjectile" placeholder="Las, Solid Projectile, Chain…">
    <input type="text" name="system.dh2e.qualities" value="Tearing, Blast (2)" placeholder="Tearing, Proven (3), Blast (2)">
    <input type="text" name="custom.notes" value="Las, Solid Projectile, Chain…" placeholder="Las, Solid Projectile, Chain…">
    <input type="text" name="system.dh2e.range" value="My range" placeholder="My range example">`;
  itemForm.innerHTML=itemMarkup;doc.body.append(itemForm);
  const itemValues=[...new FormData(itemForm)];let itemEvents=0;
  itemForm.addEventListener('input',()=>itemEvents++);itemForm.addEventListener('change',()=>itemEvents++);
  const itemInputs=[...itemForm.querySelectorAll('input')];
  const canonicalAttributes=itemInputs.map(input=>['name','value','type','list'].map(attr=>input.getAttribute(attr)));
  render('Dh2eItemSheet',itemForm);
  assert.deepEqual(itemInputs.map(input=>input.placeholder),[
    'Пример записи: 20 metres x psy rating','Одна группа: las / solidProjectile / chain',
    'Свойства по-английски: Tearing, Proven (3), Blast (2)','Las, Solid Projectile, Chain…','My range example']);
  assert.deepEqual([...new FormData(itemForm)],itemValues);
  assert.deepEqual(itemInputs.map(input=>['name','value','type','list'].map(attr=>input.getAttribute(attr))),canonicalAttributes);
  assert.equal(itemForm.querySelector('datalist option').value,'20 metres x psy rating');assert.equal(itemEvents,0);
  assert.equal(translateStockUI({constructor:{name:'Dh2eItemSheet'}},itemForm,{game}).text,0);
  const inactive=itemForm.cloneNode(false);inactive.innerHTML=itemMarkup;
  translateStockUI({constructor:{name:'Dh2eItemSheet'}},inactive,{game:{...game,i18n:{lang:'en'}}});
  assert.equal(inactive.querySelector('input').placeholder,'20 metres x psy rating');
  translateStockUI({constructor:{name:'Dh2eItemSheet'}},inactive,{game:{...game,system:{id:'different'}}});
  assert.equal(inactive.querySelector('input').placeholder,'20 metres x psy rating');

  const fragmentForm=doc.createElement('form');fragmentForm.className='application apex-actor-sheet';
  fragmentForm.innerHTML=`<span class="apex-hands"><em class="apex-grip fixed">1H</em><em class="apex-grip fixed">2H</em><em class="apex-grip fixed idle">1H / 2H</em><a class="apex-grip one" data-action="dh2eSetGrip" data-item-id="weapon1" data-mode="two">1H −20</a><a class="apex-grip" data-mode="one">2H</a><em class="apex-grip">Custom 1H</em></span>
    <div class="apex-notes">1H −20; SB ×</div><span class="apex-grip">1H</span>
    <label class="dark-heresy-2e-apex-token-action-hud-scale-field"><span>Смещение</span><strong data-token-action-hud-lift-output>128 px</strong><input type="range" name="lift" value="128" min="0" max="320" step="4" data-token-action-hud-lift></label>
    <strong data-token-action-hud-lift-output>128 px</strong>
    <div class="dh2e-profile"><label><span>Дальность (SB ×)</span><input type="number" name="dh2eThrownRange" value="3" min="1" step="1"></label><label><span>Свой текст (SB ×)</span><input name="custom-formula" value="SB * 3"></label></div>`;
  doc.body.append(fragmentForm);
  const fragmentsBefore=[...new FormData(fragmentForm)];
  render('Dh2eItemSheet',fragmentForm);
  assert.deepEqual([...fragmentForm.querySelectorAll('.apex-hands .apex-grip')].map(element=>element.textContent),[
    '1 р.','2 р.','1 р. / 2 р.','1 р. −20','2 р.','Custom 1H']);
  const activeGrip=fragmentForm.querySelector('.apex-grip.one');
  assert.equal(activeGrip.dataset.mode,'two');assert.equal(activeGrip.dataset.action,'dh2eSetGrip');assert.equal(activeGrip.dataset.itemId,'weapon1');
  assert.equal(fragmentForm.querySelector('.apex-notes').textContent,'1H −20; SB ×');
  assert.equal(fragmentForm.querySelector(':scope > .apex-grip').textContent,'1H');
  const liftOutput=fragmentForm.querySelector('label strong[data-token-action-hud-lift-output]');
  assert.equal(liftOutput.textContent,'128 пикс.');
  assert.equal(fragmentForm.querySelector(':scope > strong[data-token-action-hud-lift-output]').textContent,'128 px');
  assert.equal(fragmentForm.querySelector('input[name="dh2eThrownRange"]').previousElementSibling.textContent,'Дальность (БС ×)');
  assert.equal(fragmentForm.querySelector('input[name="custom-formula"]').previousElementSibling.textContent,'Свой текст (SB ×)');
  assert.deepEqual([...new FormData(fragmentForm)],fragmentsBefore);
  assert.equal(translateStockUI({constructor:{name:'Dh2eItemSheet'}},fragmentForm,{game}).text,0);
  // Mirror the exact source input handler's live textContent replacement.
  const lift=fragmentForm.querySelector('[data-token-action-hud-lift]');
  lift.addEventListener('input',event=>{liftOutput.textContent=`${event.currentTarget.value} px`;});
  lift.value='144';lift.dispatchEvent(new DomEvent('input',{bubbles:true}));
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(liftOutput.textContent,'144 пикс.');assert.equal(new FormData(fragmentForm).get('lift'),'144');
  liftOutput.textContent='Custom 144 px';await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(liftOutput.textContent,'Custom 144 px');

  const configForm=doc.createElement('form');configForm.className='application sheet-config';
  const systemId='dark-heresy-2e-apex';
  const itemId=`${systemId}.Dh2eItemSheet`,engineId=`${systemId}.FalloutMaWItemSheet`,gearId=`${systemId}.Dh2eGearSheet`;
  configForm.innerHTML=`<select name="sheetClass"><option value="" selected>По умолчанию</option><option value="${itemId}">Dark Heresy Item</option><option value="${engineId}">Dark Heresy 2E [Apex Edition] V2</option><option value="${gearId}">Мой лист предмета</option><option value="other.Dh2eItemSheet">Dark Heresy Item</option><option value="${systemId}.UnregisteredSheet">Dark Heresy Item</option></select>
    <select name="defaultClass"><option value="${itemId}" selected>Dark Heresy Item</option></select>
    <select name="theme"><option value="dark">Dark Heresy Item</option><option value="light">Dark Heresy 2E [Apex Edition] V2</option></select>`;
  doc.body.append(configForm);
  const configBefore=[...new FormData(configForm)];
  const idsBefore=[...configForm.querySelectorAll('option')].map(element=>element.getAttribute('value'));
  const selectionBefore=[...configForm.querySelectorAll('option')].map(element=>[element.selected,element.defaultSelected]);
  class DocumentSheetConfig {
    static getSheetClassesForSubType(documentName,subtype) {
      assert.equal(documentName,'Item');assert.equal(subtype,'talent');
      return {sheetClasses:{[itemId]:'Dark Heresy Item',[engineId]:'Dark Heresy 2E [Apex Edition] V2',[gearId]:'Мой лист предмета'},defaultClasses:{[itemId]:'Dark Heresy Item'},defaultClass:itemId};
    }
    document={documentName:'Item',type:'talent'};
  }
  const coreApp=new DocumentSheetConfig();
  // Invoke the registered hook with the real constructor shape, without adding
  // a system CSS marker to this core application.
  for(const entry of hookCalls.values())if(entry.name==='renderApplicationV2')entry.fn(coreApp,configForm);
  assert.deepEqual([...configForm.querySelectorAll('select[name="sheetClass"] option')].map(element=>element.textContent),[
    'По умолчанию','Предмет Dark Heresy','Dark Heresy 2E [Apex Edition] — лист V2','Мой лист предмета','Dark Heresy Item','Dark Heresy Item']);
  assert.equal(configForm.querySelector('select[name="defaultClass"] option').textContent,'Предмет Dark Heresy');
  assert.deepEqual([...configForm.querySelectorAll('select[name="theme"] option')].map(element=>element.textContent),['Dark Heresy Item','Dark Heresy 2E [Apex Edition] V2']);
  assert.deepEqual([...new FormData(configForm)],configBefore);
  assert.deepEqual([...configForm.querySelectorAll('option')].map(element=>element.getAttribute('value')),idsBefore);
  assert.deepEqual([...configForm.querySelectorAll('option')].map(element=>[element.selected,element.defaultSelected]),selectionBefore);
  assert.equal(translateStockUI(coreApp,configForm,{game}).text,0);
  const untouchedConfig=configForm.cloneNode(true);untouchedConfig.querySelector(`option[value="${itemId}"]`).textContent='Dark Heresy Item';
  translateStockUI({constructor:{name:'OtherConfig'},document:coreApp.document},untouchedConfig,{game});
  assert.equal(untouchedConfig.querySelector(`option[value="${itemId}"]`).textContent,'Dark Heresy Item');
  translateStockUI(coreApp,untouchedConfig,{game:{...game,i18n:{lang:'en'}}});
  assert.equal(untouchedConfig.querySelector(`option[value="${itemId}"]`).textContent,'Dark Heresy Item');
  const previousFoundry=globalThis.foundry;
  try {
    globalThis.foundry={applications:{apps:{DocumentSheetConfig}}};
    const sameNamedCustomApp={document:coreApp.document,constructor:{name:'DocumentSheetConfig',getSheetClassesForSubType:DocumentSheetConfig.getSheetClassesForSubType}};
    translateStockUI(sameNamedCustomApp,untouchedConfig,{game});
    assert.equal(untouchedConfig.querySelector(`option[value="${itemId}"]`).textContent,'Dark Heresy Item');
    translateStockUI(coreApp,untouchedConfig,{game});
    assert.equal(untouchedConfig.querySelector(`option[value="${itemId}"]`).textContent,'Предмет Dark Heresy');
  } finally {
    if(previousFoundry===undefined)delete globalThis.foundry;
    else globalThis.foundry=previousFoundry;
  }

  const presetForm=doc.createElement('form');presetForm.className='application dark-heresy-2e-apex-settings-presets';
  const presetMarkup=`<div class="dark-heresy-2e-apex-settings-presets-summary-error" title="Preset name cannot be empty."><i aria-hidden="true"></i><span>Preset name cannot be empty.</span></div>
    <div class="dark-heresy-2e-apex-settings-presets-summary-error" title="Custom error: Preset name cannot be empty."><span>Custom error: Preset name cannot be empty.</span></div>
    <div class="other-error" title="Preset name cannot be empty."><span>Preset name cannot be empty.</span></div>
    <input name="status.error" value="Preset name cannot be empty.">`;
  presetForm.innerHTML=presetMarkup;doc.body.append(presetForm);
  const status={error:'Preset name cannot be empty.'};const presetApp={constructor:{name:'SettingsPresetsConfig'},status};
  const presetValues=[...new FormData(presetForm)];
  for(const entry of hookCalls.values())if(entry.name==='renderApplicationV2')entry.fn(presetApp,presetForm);
  const sourceErrors=presetForm.querySelectorAll('.dark-heresy-2e-apex-settings-presets-summary-error');
  assert.equal(sourceErrors[0].title,'Название набора настроек не может быть пустым.');
  assert.equal(sourceErrors[0].querySelector('span').textContent,'Название набора настроек не может быть пустым.');
  assert.equal(sourceErrors[1].title,'Custom error: Preset name cannot be empty.');
  assert.equal(sourceErrors[1].querySelector('span').textContent,'Custom error: Preset name cannot be empty.');
  assert.equal(presetForm.querySelector('.other-error').title,'Preset name cannot be empty.');
  assert.equal(presetForm.querySelector('.other-error span').textContent,'Preset name cannot be empty.');
  assert.deepEqual([...new FormData(presetForm)],presetValues);assert.equal(status.error,'Preset name cannot be empty.');
  assert.equal(translateStockUI(presetApp,presetForm,{game}).text,0);
  const unrelatedPreset=presetForm.cloneNode(false);unrelatedPreset.innerHTML=presetMarkup;
  translateStockUI({constructor:{name:'OtherConfig'}},unrelatedPreset,{game});
  assert.equal(unrelatedPreset.querySelector('span').textContent,'Preset name cannot be empty.');
  translateStockUI(presetApp,unrelatedPreset,{game:{...game,i18n:{lang:'en'}}});
  assert.equal(unrelatedPreset.querySelector('span').textContent,'Preset name cannot be empty.');
  generic.dispose();stock.dispose();dom.window.close();
  console.log('Real DOM stock+generic hooks: tile labels, parser-safe hints, grip/HUD units, sheet choices, preset status, canonical forms and validation PASS');
}
