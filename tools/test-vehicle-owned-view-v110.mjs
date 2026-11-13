import assert from 'node:assert/strict';
import data from '../scripts/vehicle-profile-data.mjs';
import {localizeVehicleHudContext, installVehicleOwnedItemView, applyVehicleOwnedViewLabels} from '../scripts/vehicle-owned-view-l10n.mjs';
import {installViewContextBridges} from '../scripts/view-context-bridge.mjs';
import {registerVehicleUiAdapter} from '../scripts/vehicle-ui-l10n.mjs';
const SYSTEM = 'dark-heresy-2e-apex';
const game = {system: {id: SYSTEM}, i18n: {lang: 'ru'}};
const clone = value => structuredClone(value);
class Item {
  #value = 42;
  constructor(source, parent) {Object.assign(this, source); this.parent=parent; this.documentName='Item';}
  toObject() {return {id:this.id,name:this.name,type:this.type,system:this.system};}
  get answer() {return this.#value;}
  method() {return this.#value;}
}
function fixture(key='chimera', name='Heavy Bolter') {
  const profile=data.profiles[key], display=data.displayProfiles[key], weapon=data.weapons[name];
  const mount=profile.mounts.find(row=>row.names.includes(name));
  const actor={documentName:'Actor',system:{dh2e:{vehicle:{...clone(profile.fields),notes:display.notesRu}}},items:new Map()};
  const item=new Item({id:'weapon-id',name,type:'weapon',system:{itemFunction:'weapon',description:weapon.description,dh2e:{...clone(weapon.dh2e),mount:mount.mount,facing:mount.facing,mountCrew:mount.crew},functions:{weapon:clone(weapon.weapon)}}},actor);
  actor.items.set(item.id,item); return {actor,item,weapon};
}
const {actor,item,weapon}=fixture();
const slot={item, canonical:'unchanged'};
const set={key:'set1',slots:[slot],weapons:[slot],displaySlots:[slot]};
const context={selectedWeapon:item,weaponSet:set,weaponSets:[set],tray:{weaponSets:[set],items:[{itemId:item.id,name:item.name}],abilities:[{id:item.id,name:item.name}],weaponEquipChoices:[{id:item.id,name:item.name}],weaponActionRows:[{id:'weapon',label:item.name,actions:[{itemId:item.id}]},{id:'extra',label:item.name}]}};
const original=item.toObject();
const view=localizeVehicleHudContext(context,actor,{game});
assert.equal(view.selectedWeapon.name,weapon.nameRu);
assert.equal(view.selectedWeapon.id,item.id);
assert.equal(view.selectedWeapon.answer,42);
assert.equal(view.selectedWeapon.method(),42);
assert.equal(view.selectedWeapon.toObject().name,item.name,'method stays bound to source document');
for(const group of [view.weaponSet,view.weaponSets[0],view.tray.weaponSets[0]]) for(const path of ['slots','weapons','displaySlots']){
 assert.equal(group[path][0].item.name,weapon.nameRu,path);assert.equal(group[path][0].canonical,'unchanged');
}
for(const path of ['items','abilities','weaponEquipChoices']) assert.equal(view.tray[path][0].name,weapon.nameRu);
assert.equal(view.tray.weaponActionRows[0].label,weapon.nameRu);
assert.equal(view.tray.weaponActionRows[1].label,item.name,'secondary/custom weapon-function headings stay unchanged');
assert.equal(context.selectedWeapon.name,item.name);
assert.deepEqual(item.toObject(),original);
assert.equal(localizeVehicleHudContext(context,actor,{game:{...game,i18n:{lang:'en'}}}),context);
const custom={...context,selectedWeapon:{id:item.id,name:'My gun'}};
assert.equal(localizeVehicleHudContext(custom,actor,{game}).selectedWeapon.name,'My gun');

class Dh2eItemSheet {
 constructor(item){this.item=item;this.context={item,source:item.system,descriptionHTML:item.system.description,editable:true};}
 async _prepareContext(){return this.context;}
 _processFormData(...args){return args.at(-1);}
}
assert.equal(installVehicleOwnedItemView(Dh2eItemSheet,{game}),true);
assert.equal(installVehicleOwnedItemView(Dh2eItemSheet,{game}),true);
const sheet=new Dh2eItemSheet(item), itemView=await sheet._prepareContext();
assert.equal(itemView.item.name,weapon.nameRu);
assert.equal(itemView.item.answer,42);
assert.equal(itemView.item.method(),42);
assert.equal(itemView.item.toObject().name,item.name);
assert.equal(itemView.source.description,weapon.descriptionRu);
assert.equal(itemView.descriptionHTML,weapon.descriptionRu);
assert.equal(item.system.description,weapon.description);
const unchanged={name:weapon.nameRu,'system.description':weapon.descriptionRu,'system.quantity':3};
assert.deepEqual(sheet._processFormData(null,null,unchanged),{...unchanged,name:item.name,'system.description':weapon.description});
assert.equal(unchanged.name,weapon.nameRu);
assert.deepEqual(sheet._processFormData(null,null,{name:weapon.nameRu,system:{description:weapon.descriptionRu,quantity:5}}),{name:item.name,system:{description:weapon.description,quantity:5}});
const edited={name:'My bolter','system.description':'<p>Мои правила</p>'};
assert.equal(sheet._processFormData(null,null,edited),edited);
assert.equal(installVehicleOwnedItemView(class {}),false);
const customItem=fixture().item;customItem.name='My gun';
const customSheet=new Dh2eItemSheet(customItem);assert.equal(await customSheet._prepareContext(),customSheet.context);

// The registered physical sheet extends the engine class, not Dh2eItemSheet.
class EngineItemSheet {
 constructor(item){this.item=item;}
 async _prepareContext(){return {item:this.item,source:this.item.system,descriptionHTML:this.item.system.description};}
 _processFormData(_event,_form,value){this.processedItemName=this.item.name;return value;}
}
class Dh2eGearSheet extends EngineItemSheet {
 async _prepareContext(){return {...await super._prepareContext(),physical:true};}
 _processFormData(event,form,value){return super._processFormData(event,form,value);}
}
assert.equal(installVehicleOwnedItemView(Dh2eGearSheet,{game}),true);
const gearSheet=new Dh2eGearSheet(item), gearView=await gearSheet._prepareContext();
assert.equal(gearView.item.name,weapon.nameRu);
assert.equal(gearView.source.description,weapon.descriptionRu);
assert.equal(gearView.physical,true);
const gearSubmit=gearSheet._processFormData(null,null,{name:weapon.nameRu,system:{description:weapon.descriptionRu,quantity:9}});
assert.deepEqual(gearSubmit,{name:item.name,system:{description:weapon.description,quantity:9}});
assert.equal(gearSheet.processedItemName,item.name,'original gear processing receives the real canonical item');

class Element {
 constructor(text='',attrs={}){this.nodeType=1;this.childNodes=[{nodeType:3,nodeValue:text}];this.attrs={...attrs};}
 getAttribute(key){return this.attrs[key]??null;}
 setAttribute(key,value){this.attrs[key]=value;}
 querySelector(){return null;}
 querySelectorAll(){return [];}
 get text(){return this.childNodes[0].nodeValue;}
}
class TokenActionHud {constructor(){this.actor=actor;}async _prepareContext(){return context;}}
const button=new Element('',{'data-item-id':item.id,title:item.name,'aria-label':item.name});
const label=new Element(' '+item.name+' '), img=new Element('',{alt:item.name});
button.querySelectorAll=selector=>selector===':scope > span'?[label]:selector===':scope > img[alt]'?[img]:[];
const heading=new Element(item.name), action=new Element('',{'data-item-id':item.id}), row=new Element();
row.querySelector=selector=>selector.includes('data-weapon-function-id')?action:heading;
const root=new Element();root.classList={contains:name=>name==='dark-heresy-2e-apex-token-action-hud'};
root.querySelectorAll=selector=>selector.startsWith('button[')?[button]:selector.endsWith('hud-action-row')?[row]:[];
assert.equal(applyVehicleOwnedViewLabels(new TokenActionHud(),root,{game}),5);
assert.equal(label.text,' '+weapon.nameRu+' ');assert.equal(heading.text,weapon.nameRu);assert.equal(button.getAttribute('data-item-id'),item.id);
assert.equal(applyVehicleOwnedViewLabels(new TokenActionHud(),root,{game}),0);
const title=new Element(item.name), itemRoot=new Element();itemRoot.querySelectorAll=selector=>selector==='.window-title'?[title]:[];
assert.equal(applyVehicleOwnedViewLabels(sheet,itemRoot,{game}),1);assert.equal(title.text,weapon.nameRu);
title.childNodes[0].nodeValue=item.name;
assert.equal(applyVehicleOwnedViewLabels(gearSheet,itemRoot,{game}),1);assert.equal(title.text,weapon.nameRu);

// Live bridge integration: source HUD class is captured independently of the actor sheet.
globalThis.game=game;
assert.equal(installViewContextBridges({TokenActionHud}).hud,true);
assert.equal((await new TokenActionHud()._prepareContext()).weaponSet.weapons[0].item.name,weapon.nameRu);
const hooks=new Map();let id=0;
const Hooks={on(name,callback){const key=++id;hooks.set(key,{name,callback});return key;},once(name,callback){return this.on(name,callback);},off(name,key){assert.equal(hooks.get(key).name,name);hooks.delete(key);}};
class ReadySheet {async _prepareContext(){return {};} _processFormData(){return {};}}
class ReadyGearSheet extends EngineItemSheet {async _prepareContext(){return {...await super._prepareContext(),physical:true};} _processFormData(...args){return super._processFormData(...args);}}
const paths=[];
const importer=async path=>{paths.push(path);return path.endsWith('/dh2e-gear-sheet.mjs')?{Dh2eGearSheet:ReadyGearSheet}:{Dh2eItemSheet:ReadySheet};};
const registration=registerVehicleUiAdapter({Hooks,game,importer});
await [...hooks.values()].find(row=>row.name==='ready').callback();
assert.deepEqual(paths,[`/systems/${SYSTEM}/src/sheets/dh2e-item-sheet.mjs`,`/systems/${SYSTEM}/src/sheets/dh2e-gear-sheet.mjs`]);
const readyGear=new ReadyGearSheet(item);
assert.equal((await readyGear._prepareContext()).item.name,weapon.nameRu,'ready registration patches the physical default sheet');
assert.equal(readyGear._processFormData(null,null,{name:weapon.nameRu}).name,item.name);
registration.dispose();assert.equal(hooks.size,0);
const oldFoundry=globalThis.foundry;
globalThis.foundry={utils:{getRoute:path=>'/foundry/'+path}};
const prefixed=registerVehicleUiAdapter({Hooks,game,importer});
await [...hooks.values()].find(row=>row.name==='ready').callback();
assert.deepEqual(paths.slice(-2),[`/foundry/systems/${SYSTEM}/src/sheets/dh2e-item-sheet.mjs`,`/foundry/systems/${SYSTEM}/src/sheets/dh2e-gear-sheet.mjs`]);
prefixed.dispose();assert.equal(hooks.size,0);
if(oldFoundry===undefined)delete globalThis.foundry;else globalThis.foundry=oldFoundry;
delete globalThis.game;
console.log('v1.1.0 vehicle owned views: HUD paths/first render, item editor view-save round trip, canonical names and lifecycle: PASS');
