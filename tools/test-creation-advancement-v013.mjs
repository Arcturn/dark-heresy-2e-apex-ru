import assert from 'node:assert/strict';
import ui from '../scripts/ui-literals.mjs';
import creationDictionary from '../scripts/creation-ui.mjs';
import progression from '../scripts/progression-data.mjs';
import {applyCreationUiTranslations,registerCreationUiAdapter} from '../scripts/creation-ui-adapter.mjs';
import {applyAdvancementUiTranslations,translateOwnedTalentName,translateAdvancementRuleText,registerAdvancementUiAdapter} from '../scripts/progression-ui-adapter.mjs';

const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
const wrong={system:{id:'other-game'},i18n:{lang:'ru'}};
const node=text=>({nodeType:3,nodeValue:text});
function el(text='', {attrs={},queries={},all={},matched=[]}={}){
  const x={nodeType:1,attributes:{...attrs},childNodes:[node(text)],
    get textContent(){return this.childNodes.map(n=>n.nodeValue??'').join('');},
    set textContent(value){this.childNodes=[node(value)];},
    getAttribute(key){return this.attributes[key]??null;},setAttribute(key,value){this.attributes[key]=value;},hasAttribute(key){return Object.hasOwn(this.attributes,key);},
    querySelector(key){return queries[key]??null;},querySelectorAll(key){return all[key]??(queries[key]?[queries[key]]:[]);},
    matches(key){return matched.includes(key);}};
  return x;
}
const option=(label,value)=>Object.assign(el(label,{attrs:{value}}),{value,children:[]});
const fixedWS=el('Weapon Skill');fixedWS.querySelector=()=>null;
const fixedBS=el('Ballistic Skill');fixedBS.querySelector=()=>null;
const custom=el('Custom Player Skill');custom.querySelector=()=>null;
const specialist=option('Common Lore (Adeptus Mechanicus)','commonLoreAdeptusMechanicus');
const choiceSel={options:[specialist]};
const choose=el('',{queries:{'select[name^="choices.skill"]':choiceSel}});
const skillList={querySelectorAll(key){return key==='li'?[fixedWS,fixedBS,custom,choose]:[];}};
const createRoot=el('',{queries:{'.dh2e-creation-choices > div:first-child > ul.dh2e-creation-list':skillList},all:{'.dh2e-creation-cards > article':[],'.dh2e-creation-choices li':[],'.dh2e-creation-choices select option':[],'.dh2e-creation-gear li':[],'.dh2e-creation-gear select option':[],'.dh2e-char-name':[],'.dh2e-creation-stats b, .dh2e-creation-psyker .warn':[]}});
function Dh2eCharacterCreation(){};
assert.equal(applyCreationUiTranslations(new Dh2eCharacterCreation(),createRoot,{game:wrong,dictionary:creationDictionary,skills:ui}).active,false);
const result=applyCreationUiTranslations(new Dh2eCharacterCreation(),createRoot,{game,dictionary:creationDictionary,skills:ui});
assert.equal(result.active,true);
assert.equal(fixedWS.textContent,'Навык Рукопашной');
assert.equal(fixedBS.textContent,'Навык Стрельбы');
assert.equal(specialist.textContent,'Общие знания (Адептус Механикус)');
assert.equal(specialist.value,'commonLoreAdeptusMechanicus');
assert.equal(custom.textContent,'Custom Player Skill');
assert.equal(applyCreationUiTranslations(new Dh2eCharacterCreation(),createRoot,{game,dictionary:creationDictionary,skills:ui}).translated,0);
assert.equal(applyCreationUiTranslations({constructor:{name:'OtherApp'}},createRoot,{game,dictionary:creationDictionary,skills:ui}).active,false);

assert.equal(Object.keys(progression.talents).length,102);
assert.equal(Object.keys(progression.psychicPowers).length,45);
assert.equal(translateOwnedTalentName('Ambidextrous'),'Амбидекстрия');
assert.equal(translateOwnedTalentName('Resistance (Fear)'),'Сопротивление (Страх)');
assert.equal(translateOwnedTalentName('Player Custom Talent'),'Player Custom Talent');
const prerequisites=translateAdvancementRuleText('Intelligence 35, Tech-Use, Trade (Armourer)');
assert.ok(prerequisites.includes('Интеллект 35'),prerequisites);
assert.ok(prerequisites.includes('Техпользование'),prerequisites);
assert.match(translateAdvancementRuleText('Weapon Skill 30, Ballistic Skill 35'),/Навык Рукопашной 30, Навык Стрельбы 35/);
assert.equal(translateAdvancementRuleText('Custom XP 30'), 'Custom XP 30');

const charLabel=el('Weapon Skill');const charRow=el('',{queries:{'td:first-child':charLabel}});
const skillLabel=el('Common Lore (Adeptus Mechanicus)');
const skillButton=el('',{attrs:{'data-key':'commonLoreAdeptusMechanicus'}});
const skillRow=el('',{queries:{'button[data-action="buySkill"][data-key]':skillButton,'td:first-child':skillLabel}});
const talentName=el('Adamantium Faith',{attrs:{'data-key':'adamantium-faith'}});
const unmet=el('Jaded, Resistance (Fear), Willpower 45');
const prereq=el('',{all:{'span':[unmet]}});
const talentRow=el('',{queries:{'a.dh2e-entry-link[data-action="openEntry"][data-type="talent"][data-key]':talentName,'.dh2e-talent-prereq':prereq,'.dh2e-spec-chip > span':null},all:{'.dh2e-spec-option[data-spec]':[]}});
const powerLabel=el('Enfeeble');
const why=el('Willpower 40');
const powerRow=el('',{attrs:{'data-key':'enfeeble'},queries:{'a.dh2e-entry-link[data-type="psychicPower"]':powerLabel},all:{'.dh2e-tree-why':[why]}});
const eliteWarning=el('Willpower 45');
const eliteRow=el('',{all:{'.dh2e-talent-prereq span':[eliteWarning]}});
const eliteLink=el('Untouchable');eliteLink.closest=()=>eliteRow;
const eliteLore=option('Adeptus Mechanicus','forbiddenLoreAdeptusMechanicus');
const xpButton=el('150 xp');
const owned=el('Ambidextrous',{attrs:{'data-tooltip':progression.talents.ambidextrous.benefit}});
const location={
 '.dh2e-adv-chars tbody tr':[charRow],
 '.dh2e-adv-skills tbody tr':[skillRow],
 '.dh2e-talent-table tbody tr':[talentRow],
 '.dh2e-talent-chip':[owned],
 '.dh2e-talent-chip[data-tooltip]':[owned],
 'a[data-type="eliteAdvance"]':[eliteLink],
 'select[data-elite-lore] option':[eliteLore],
 '.dh2e-tree-node[data-key]':[powerRow],
 'button.dh2e-adv-buy, .dh2e-advancement-xp button[data-action="undoLast"]':[xpButton],
};
const root=el('',{matched:['.dh2e-advancement-body'],all:location});
function Dh2eAdvancementApplication(){};
const app=new Dh2eAdvancementApplication();
assert.equal(applyAdvancementUiTranslations(app,root,{game:wrong}).active,false);
const stats=applyAdvancementUiTranslations(app,root,{game});
assert.equal(stats.active,true);assert.ok(stats.text>=6,stats);
assert.equal(charLabel.textContent,'Навык Рукопашной');
assert.equal(skillLabel.textContent,'Общие знания (Адептус Механикус)');
assert.equal(skillButton.getAttribute('data-key'),'commonLoreAdeptusMechanicus');
assert.equal(talentName.textContent,'Несокрушимая вера');
assert.match(unmet.textContent,/Искушённый.*Сопротивление \(Страх\).*Сила воли 45/);
assert.equal(owned.textContent,'Амбидекстрия');
assert.match(owned.getAttribute('data-tooltip'),/Этот талант отображает/);
assert.ok(!owned.getAttribute('data-tooltip').includes('Аура Власти'),owned.getAttribute('data-tooltip'));
assert.equal(powerLabel.textContent,'Ослабление');
assert.equal(why.textContent,'Сила воли 40');
assert.equal(xpButton.textContent,'150 ОО');
assert.equal(eliteWarning.textContent,'Сила воли 45');
assert.equal(eliteLore.textContent,'Адептус Механикус');
assert.equal(eliteLore.value,'forbiddenLoreAdeptusMechanicus');
{const again=applyAdvancementUiTranslations(app,root,{game});assert.equal(again.text+again.attributes,0);}
assert.equal(applyAdvancementUiTranslations({constructor:{name:'OtherApp'}},root,{game}).active,false);
const entries=new Map();let next=0;
const Hooks={on(n,fn){const id=++next;entries.set(id,{n,fn});return id;},off(_name,id){entries.delete(id);}};
const a=registerAdvancementUiAdapter({Hooks,game:()=>game});
assert.strictEqual(a,registerAdvancementUiAdapter({Hooks,game:()=>game}));
a.dispose();assert.equal(entries.size,0);
const c=registerCreationUiAdapter({Hooks,game:()=>game,dictionary:creationDictionary,skills:ui});
assert.strictEqual(c,registerCreationUiAdapter({Hooks,game:()=>game,dictionary:creationDictionary,skills:ui}));
c.dispose();assert.equal(entries.size,0);
console.log('Passed v0.13 character creation, starting skills and XP advancement regression assertions');
