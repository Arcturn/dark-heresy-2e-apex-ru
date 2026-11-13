import assert from 'node:assert/strict';
import progression from '../scripts/progression-data.mjs';
import rules from '../scripts/actor-rules-data.mjs';
import ui from '../scripts/ui-literals.mjs';
import {
 localizeTalentByKey,localizeTraitByKey,localizeSkillByKey,localizeAptitudes,
 localizeActorContext,localizeAdvancementContext,localizeRollContext,searchAdvancementRows,translationInventory
} from '../scripts/keyed-view-l10n.mjs';
import {translateRollModifierLabel} from '../scripts/roll-modifiers-ui-adapter.mjs';
import {installViewContextBridges,loadSystemViewClasses} from '../scripts/view-context-bridge.mjs';

const mockGame={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
globalThis.game=mockGame;
const originalActor={system:{dh2e:{
 homeworld:'voidborn',background:'mechanicus',role:'chirurgeon',
 talents:[{key:'strong-minded'},{key:'mechadendrite-use',spec:'Utility'},{key:'weapon-training',spec:'Solid Projectile'}],
 traits:[{key:'mechanicus-implants'},{key:'fear',spec:'2'}],
 aptitudes:['intelligence','fieldcraft'],
 advanceLog:[{type:'talent',key:'strong-minded',cost:200},{type:'characteristic',key:'intelligence',cost:250}]
}}};
const sheetContext={
 dh2eTalents:[
 {label:'Strong Minded',benefit:progression.talents['strong-minded'].benefit,aptitudes:'Willpower, Defence',prerequisites:'None'},
 {label:'Mechadendrite Use (Utility)',benefit:progression.talents['mechadendrite-use']?.benefit??'Other',aptitudes:'Intelligence, Tech'},
 {label:'Weapon Training (Solid Projectile)',benefit:'',aptitudes:'Ballistic Skill, Defence'}
 ],
 dh2eTraits:[{label:'Mechanicus Implants',summary:rules.traits['mechanicus-implants'].summaryEn},{label:'Fear (2)',summary:rules.traits.fear.summaryEn}],
 apex:{identity:{homeworld:'Voidborn',background:'Adeptus Mechanicus',role:'Chirurgeon',elite:'—'},
  advances:{aptitudes:['Intelligence','Fieldcraft'],log:[{index:0,type:'Talent',name:'Strong Minded',cost:200},{index:1,type:'Characteristic',name:'Intelligence',cost:250}]}}
};
const untouched=JSON.stringify(sheetContext),originalBefore=JSON.stringify(originalActor);
const lSheet=localizeActorContext(sheetContext,originalActor);
assert.equal(lSheet.dh2eTalents[0].label,'Непреклонный');
assert.equal(lSheet.dh2eTalents[0].benefit,progression.talents['strong-minded'].benefitRu);
assert.equal(lSheet.dh2eTalents[0].aptitudes,'Сила воли, Защита');
assert.equal(lSheet.dh2eTraits[0].label,'Имплантаты Механикус');
assert.equal(lSheet.apex.identity.homeworld,'Пустоторождённый');
assert.equal(lSheet.apex.identity.background,'Адептус Механикус');
assert.equal(lSheet.apex.identity.role,'Хирургеон');
assert.equal(lSheet.apex.advances.log[0].name,'Непреклонный');
assert.equal(lSheet.apex.advances.log[1].name,'Интеллект');
assert.equal(JSON.stringify(sheetContext),untouched,'source view not modified');
assert.equal(JSON.stringify(originalActor),originalBefore,'Actor document not modified');
assert.equal(localizeTalentByKey('custom','Magic Missile'),'Magic Missile');
assert.equal(localizeTraitByKey('custom','Space dragon'),'Space dragon');
assert.equal(localizeSkillByKey('commonLoreAdeptusMechanicus','Common Lore (Adeptus Mechanicus)'),
 'Общие знания (Адептус Механикус)');
assert.equal(localizeAptitudes('Weapon Skill, Ballistic Skill'),'Навык Рукопашной, Навык Стрельбы');

const apt2={talents:[
  {key:'strong-minded',name:'Strong Minded',benefit:progression.talents['strong-minded'].benefit,aptitudes:'Willpower, Defence',cost:200,canBuy:true,unmet:'Willpower 30'},
  {key:'resistance',name:'Resistance',benefit:progression.talents.resistance.benefit,aptitudes:'Toughness, Defence',cost:100,canBuy:false,unmet:'Toughness 30'},
  {key:'custom',name:'Handmade English',aptitudes:'Custom Aptitude',cost:321,canBuy:true}
 ],
 skills:[{key:'commonLoreAdeptusMechanicus',label:'Common Lore (Adeptus Mechanicus)',cost:100,canBuy:true,aptitudes:'Intelligence, Knowledge'},
         {key:'other',label:'Homebrew Skill',cost:555}],
 aptitudes:[{key:'willpower',label:'Willpower',owned:true}],
 psychic:{rows:[[{key:'smite',name:'Smite',value:100,canBuy:true,unmet:'Willpower 40'}]],links:'[["a","b"]]'},
 characteristics:[{key:'ballisticSkill',label:'Ballistic Skill',value:42,cost:250,aptitudes:'Ballistic Skill, Finesse'}],
 ownedTalents:[{label:'Strong Minded',benefit:progression.talents['strong-minded'].benefit}],
 talentFilter:'',skillFilter:''};
const originalAdv=JSON.stringify(apt2);
const loc=localizeAdvancementContext(apt2,originalActor);
assert.equal(loc.talents[0].name,'Непреклонный');
assert.equal(loc.talents[0].aptitudes,'Сила воли, Защита');
assert.equal(loc.talents[0].cost,200);
assert.equal(loc.talents[1].canBuy,false);
assert.equal(loc.talents[2].name,'Handmade English');
assert.equal(loc.aptitudes[0].label,'Сила воли');
assert.equal(loc.psychic.rows[0][0].name,progression.psychicPowers.smite.ru);
assert.equal(loc.psychic.links,apt2.psychic.links);
assert.equal(loc.characteristics[0].label,'Навык Стрельбы');
assert.equal(loc.skills[0].label,'Общие знания (Адептус Механикус)');
assert.equal(searchAdvancementRows(loc,{talent:'непреклон',skill:'адептус механ'})?.talents.length,1);
assert.equal(searchAdvancementRows(loc,{talent:'strong',skill:'lore'})?.talents.length,1);
assert.equal(searchAdvancementRows(loc,{talent:'непреклон',skill:'адептус механ'})?.skills.length,1);
assert.equal(JSON.stringify(apt2),originalAdv);

const originalRoll={
 base:{label:'Ballistic Skill',value:29},
 rows:[{key:'action',label:'Standard Attack',value:10,on:true},{key:'range',label:'Short range',value:10,on:true},
       {key:'unaware',label:'Unaware / Surprised target',value:30,on:false},
       {key:'homebrew',label:'Custom attack bonus',value:17,on:true},{key:'situational0',label:'Short range',value:-5,on:true}],
 modifier:'+20',target:49,
 guide:{use:'',modifiers:[{text:'Character is unable to see the source of the attack.',value:-30}],special:[{name:'Dodge',text:'A custom description',open:false}]},
 characteristics:[{key:'ballisticSkill',label:'Ballistic Skill',selected:true}],
 psychic:{powers:[{key:'smite',name:'Smite',rating:4}],selected:'smite'},
 modes:[{key:'low',label:'Low',hint:'Custom set description'}]
};
const origRollStr=JSON.stringify(originalRoll);
const r=localizeRollContext(originalRoll);
assert.equal(r.base.label,'Навык Стрельбы');
assert.equal(r.rows[0].label,'Стандартная атака');
assert.equal(r.rows[1].label,'Ближняя дистанция');
assert.equal(r.rows[3].label,'Custom attack bonus');
assert.equal(r.rows[4].label,'Short range','user-authored situational condition is not overwritten');
assert.equal(r.rows[2].value,30);
assert.equal(r.rows[2].on,false);
assert.equal(r.characteristics[0].key,'ballisticSkill');
assert.equal(r.guide.special[0].name,'Dodge','guide name is toggle stable key');
assert.equal(r.psychic.powers[0].name,progression.psychicPowers.smite.ru);
assert.equal(r.target,49);
assert.equal(JSON.stringify(originalRoll),origRollStr);
assert.equal(translateRollModifierLabel('Focus Power'),'Фокусировка психосилы');
assert.equal(translateRollModifierLabel('Other skill adjustments / limits'),'Прочие поправки к навыку / ограничения');
assert.equal(translateRollModifierLabel('Completely custom modifiers'),'Completely custom modifiers');

// The runtime patch works for first renders and for re-renders; no actor data edited.
class FalloutMaWActorSheet {constructor(actor){this.actor=actor;} async _prepareContext(){return sheetContext;}}
class Dh2eAdvancementApplication {
 constructor(actor){this.actor=actor;this.talentFilter='непреклон';this.skillFilter='адептус механ';}
 async _prepareContext(){
   const englishOnly=s=>s.toLowerCase();
   const prepared=structuredClone(apt2);
   prepared.talents=prepared.talents.filter(x=>!this.talentFilter||englishOnly(x.name).includes(englishOnly(this.talentFilter)));
   prepared.skills=prepared.skills.filter(x=>!this.skillFilter||englishOnly(x.label).includes(englishOnly(this.skillFilter)));
   prepared.talentFilter=this.talentFilter;prepared.skillFilter=this.skillFilter;
   return prepared;
 }
}
class Dh2eRollDialog {async _prepareContext(){return originalRoll;}}
const patched=installViewContextBridges({FalloutMaWActorSheet,Dh2eAdvancementApplication,Dh2eRollDialog});
assert.deepEqual(patched,{actor:true,advancement:true,roll:true});
const sApp=new FalloutMaWActorSheet(originalActor);
assert.equal((await sApp._prepareContext()).dh2eTalents[0].label,'Непреклонный');
const aApp=new Dh2eAdvancementApplication(originalActor);
const aResult=await aApp._prepareContext();
assert.equal(aResult.talents.length,1);
assert.equal(aResult.skills.length,1);
assert.equal(aResult.talentFilter,'непреклон');
assert.equal(aResult.skillFilter,'адептус механ');
assert.equal(aApp.talentFilter,'непреклон');
assert.equal(aApp.skillFilter,'адептус механ');
assert.equal(aResult.talents[0].cost,200);
assert.equal((await new Dh2eRollDialog()._prepareContext()).rows[1].label,'Ближняя дистанция');
assert.equal(JSON.stringify(originalActor),originalBefore);
assert.equal((await loadSystemViewClasses({importer:async()=>({})})).FalloutMaWActorSheet,undefined);
const originalFoundry=globalThis.foundry;
const systemRoutes=[
 'systems/dark-heresy-2e-apex/src/sheets/actor-sheet.mjs',
 'systems/dark-heresy-2e-apex/src/apps/dh2e-advancement.mjs',
 'systems/dark-heresy-2e-apex/src/apps/dh2e-roll-dialog.mjs'
];
try{
 const modules={FalloutMaWActorSheet,Dh2eAdvancementApplication,Dh2eRollDialog};
 for(const prefix of [null,'','foundry']){
   const paths=[];
   globalThis.foundry=prefix===null?undefined:{utils:{getRoute(path){
     assert.equal(path,'systems/dark-heresy-2e-apex/src');
     return `/${prefix?prefix+'/':''}${path}`;
   }}};
   const loaded=await loadSystemViewClasses({importer:async path=>{paths.push(path);return modules;}});
   assert.deepEqual(paths,systemRoutes.map(path=>`/${prefix?prefix+'/':''}${path}`));
   assert.deepEqual(loaded,modules);
 }
}finally{
 if(originalFoundry===undefined)delete globalThis.foundry;
 else globalThis.foundry=originalFoundry;
}
mockGame.i18n.lang='en';
assert.equal((await sApp._prepareContext()).dh2eTalents[0].label,'Strong Minded','non-Russian runtime untouched');
assert.equal((await new Dh2eRollDialog()._prepareContext()).rows[0].label,'Standard Attack');
console.log('v0.19: context keys, origin, aptitude, talent/trait, XP Russian search, psychic tree, universal roll and mechanics: PASS');
console.log('Dictionary counts',translationInventory);
