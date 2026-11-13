import assert from 'node:assert/strict';
import core from '../scripts/actor-rules-data.mjs';
import progression from '../scripts/progression-data.mjs';
import guide from '../scripts/skill-guide-data.mjs';
import {
  translateAptitudeList, translateTraitLabel, translateCoreRuleSummary,
  applyActorRuleTranslations, registerActorRuleUiAdapter
} from '../scripts/actor-rules-ui-adapter.mjs';
import {translateRollModifierLabel,applyRollModifiersTranslations,registerRollModifiersUiAdapter} from '../scripts/roll-modifiers-ui-adapter.mjs';
import {applyAdvancementUiTranslations} from '../scripts/progression-ui-adapter.mjs';

const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
const nonRussian={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'en'}};
const wrongGame={system:{id:'fake-game'},i18n:{lang:'ru'}};
const txt=s=>({nodeType:3,nodeValue:s});
function el(text='',{attr={},one={},many={},match=[]}={}){
  return {nodeType:1,childNodes:[txt(text)],attributes:{...attr},
    get textContent(){return this.childNodes.map(n=>n.nodeValue??'').join('');},
    set textContent(t){this.childNodes=[txt(t)];},
    getAttribute(k){return this.attributes[k]??null;},
    hasAttribute(k){return Object.hasOwn(this.attributes,k);},
    setAttribute(k,v){this.attributes[k]=v;},
    closest(){return null;},
    matches(s){return match.includes(s);},
    querySelector(s){return one[s]??null;},
    querySelectorAll(s){return many[s]??(one[s]?[one[s]]:[]);}
  };
}
assert.equal(Object.keys(core.traits).length,42);
assert.equal(Object.keys(core.aptitudes).length,19);
assert.equal(Object.keys(progression.talents).length,102);
assert.equal(Object.keys(guide.modifiers).length,220);
assert.equal(Object.keys(guide.use).length,20);
assert.equal(Object.keys(guide.special).length,23);
for(const row of Object.values(core.traits)){
  assert.equal(translateTraitLabel(row.en),row.ru);
  assert.equal(translateTraitLabel(`${row.en} (3)`),`${row.ru} (3)`);
  assert.equal(translateTraitLabel(row.ru),row.ru);
  assert.equal(translateCoreRuleSummary(row.summaryEn),row.summaryRu);
  assert.notEqual(row.summaryRu,row.summaryEn);
}
for(const row of Object.values(core.aptitudes)){
  assert.equal(translateAptitudeList(row.en),row.ru);
  assert.equal(translateAptitudeList(row.ru),row.ru);
}
assert.equal(translateAptitudeList('Weapon Skill, Offence, Defence'), 'Навык Рукопашной, Нападение, Защита');
assert.equal(translateAptitudeList('My Custom Aptitude'), 'My Custom Aptitude');
assert.equal(translateTraitLabel('Baneful Presence (10)'), 'Пагубное присутствие (10)');
assert.equal(translateTraitLabel('Unnatural Characteristic (Strength, 2)'), 'Сверхъестественная характеристика (Сила, 2)');
assert.equal(translateTraitLabel('My Custom Trait (5)'), 'My Custom Trait (5)');
assert.equal(translateCoreRuleSummary('Custom author biography'), 'Custom author biography');

const talent=progression.talents['adamantium-faith'];
const talentName=el(talent.en),talentAptitudes=el('Willpower, Defence'),talentBody=el(talent.benefit);
const prereq=el('Willpower 45, Resistance (Fear)');
const talentRow=el('',{one:{'summary > .apex-rule-name':talentName},many:{
  'summary > .apex-rule-meta':[talentAptitudes], '.apex-rule-body > p':[talentBody],'.apex-rule-body > .apex-rule-pre':[prereq]
}});
const trait=core.traits['baneful-presence'];
const traitName=el('Baneful Presence (10)'),traitMeta=el(trait.summaryEn),traitBody=el(trait.summaryEn);
const traitRow=el('',{many:{'summary > .apex-rule-name':[traitName], 'summary > .apex-rule-meta':[traitMeta],'.apex-rule-body > p':[traitBody]}});
const sheetChip=el('Offence'),sheetLog=el('');
const sheet=el('',{many:{
 '.apex-abilities .apex-rule-row[data-dh2e-talent]':[talentRow],
 '.apex-abilities .apex-rule-list > .apex-rule-row:not([data-dh2e-talent])':[traitRow],
 '.apex-advances .apex-quals .apex-chip':[sheetChip],'.apex-advances .apex-log li':[]
}});
class FalloutMaWActorSheet{constructor(doc){this.document=doc;}}
const npc=new FalloutMaWActorSheet({documentName:'Actor',pack:'dark-heresy-2e-apex.dh2e-bestiary'});
assert.equal(applyActorRuleTranslations(npc,sheet,{game:nonRussian}).active,false);
assert.equal(applyActorRuleTranslations(npc,sheet,{game:wrongGame}).active,false);
assert.equal(applyActorRuleTranslations({constructor:{name:'AnotherApp'}},sheet,{game}).active,false);
const translated=applyActorRuleTranslations(npc,sheet,{game});
assert.equal(translated.active,true);
assert.ok(translated.text>=7,translated);
assert.equal(talentName.textContent,talent.ru);
assert.equal(talentAptitudes.textContent,'Сила воли, Защита');
assert.equal(talentBody.textContent,talent.benefitRu);
assert.equal(traitName.textContent,'Пагубное присутствие (10)');
assert.equal(traitMeta.textContent,trait.summaryRu);
assert.equal(traitBody.textContent,trait.summaryRu);
assert.equal(sheetChip.textContent,'Нападение');
assert.equal(applyActorRuleTranslations(npc,sheet,{game}).text,0);
assert.equal(applyActorRuleTranslations(new FalloutMaWActorSheet({documentName:'Actor'}),sheet,{game}).active,true);

const aptButton=el('Offence',{attr:{'data-key':'offence'}});
const playerAptitude=el('Defence'); // read-only span shown to non-GM players
const talentLink=el(talent.en,{attr:{'data-key':'adamantium-faith'}});
const skillCost=el('200 xp');
const prereqCell=el('');
const aptCell=el('Willpower, Defence');
const talentAdvRow=el('',{one:{'a.dh2e-entry-link[data-type="talent"][data-key]':talentLink,'a.dh2e-entry-link[data-action="openEntry"][data-type="talent"][data-key]':talentLink,'.dh2e-talent-prereq':prereqCell},many:{'td':[el('T1'),aptCell,prereqCell],'.dh2e-spec-option[data-spec]':[]}});
const advRoot=el('',{match:['.dh2e-advancement-body'],many:{
 '.dh2e-adv-aptitudes .dh2e-aptitude':[aptButton,playerAptitude],
 '.dh2e-talent-table tbody tr':[talentAdvRow],
 '.dh2e-adv-chars tbody tr':[],'.dh2e-adv-skills tbody tr':[],
 '.dh2e-talent-chip':[],'.dh2e-talent-chip[data-tooltip]':[],
 '.dh2e-tree-node[data-key]':[],'a[data-type="eliteAdvance"]':[],
 'select[data-elite-lore] option':[],
 'button.dh2e-adv-buy, .dh2e-advancement-xp button[data-action="undoLast"]':[skillCost]
}});
class Dh2eAdvancementApplication{}
const advancement=new Dh2eAdvancementApplication();
const astats=applyAdvancementUiTranslations(advancement,advRoot,{game});
assert.equal(astats.active,true);
assert.equal(aptButton.textContent,'Нападение');
assert.equal(playerAptitude.textContent,'Защита');
assert.equal(aptButton.getAttribute('data-key'),'offence');
assert.equal(aptCell.textContent,'Сила воли, Защита');
assert.equal(talentLink.textContent,talent.ru);
assert.equal(skillCost.textContent,'200 ОО');
assert.equal(applyAdvancementUiTranslations(advancement,advRoot,{game}).text,0);

const firstExample='Moving in an open environment with Earth-like gravity or completely unarmoured.';
const modifier=el('Aim (Half Action)'),sourceRow=el('',{one:{':scope > span':modifier}});
const example=el(firstExample),usage=el('Full Action unless otherwise noted.');
const specialName=el('Contortionist');
const tooltip=el('',{attr:{'data-tooltip':'Target size'}});
const charOption=el('Ballistic Skill');charOption.tagName='OPTION';charOption.value='ballisticSkill';
const charSelect=el('');charSelect.options=[charOption];
const rollRoot=el('',{match:['.dh2e-roll'],many:{
 '.dh2e-roll-list > .dh2e-roll-m':[sourceRow],
 '.dh2e-roll-tiles .dh2e-lbl, .dh2e-roll-head .dh2e-roll-what, .dh2e-roll-num small':[],
 '.dh2e-roll-modes > button, .dh2e-roll-fields > label':[],
 'select[name="characteristic"],select[name="power"]':[charSelect],
 '.dh2e-roll-guide > summary > em':[usage],'.dh2e-roll-guide-row > span':[example],
 '.dh2e-roll-guide-use > summary':[specialName],'.dh2e-roll-guide-use > p':[],
 '.dh2e-roll-tile[data-tooltip]':[tooltip]
}});
class Dh2eRollDialog{}
assert.equal(applyRollModifiersTranslations(new Dh2eRollDialog(),rollRoot,{game:nonRussian}).active,false);
const rolled=applyRollModifiersTranslations(new Dh2eRollDialog(),rollRoot,{game});
assert.equal(rolled.active,true);
assert.equal(rolled.kind,'universal');
assert.equal(modifier.textContent,'Прицеливание (полудействие)');
assert.equal(example.textContent,'Перемещение по открытой местности с земной гравитацией или совсем без брони.');
assert.equal(usage.textContent,'Полное действие, если не указано иное.');
assert.equal(specialName.textContent,'Акробатическое освобождение');
assert.equal(tooltip.getAttribute('data-tooltip'),'Размер цели');
assert.equal(charOption.textContent,'Навык Стрельбы');
assert.equal(charOption.value,'ballisticSkill');
assert.equal(translateRollModifierLabel('Aim (Full Action)'), 'Прицеливание (полное действие)');
assert.equal(translateRollModifierLabel('Custom User Modifier'), 'Custom User Modifier');
assert.equal(applyRollModifiersTranslations(new Dh2eRollDialog(),rollRoot,{game}).text,0);

const callbacks=new Map();let index=0;
const Hooks={on(event,fn){const key=++index;callbacks.set(key,{event,fn});return key;},off(_event,key){callbacks.delete(key);}};
const a=registerActorRuleUiAdapter({Hooks,game:()=>game});assert.equal(registerActorRuleUiAdapter({Hooks,game:()=>game}),a);
const r=registerRollModifiersUiAdapter({Hooks,game:()=>game});assert.equal(registerRollModifiersUiAdapter({Hooks,game:()=>game}),r);
a.dispose();r.dispose();assert.equal(callbacks.size,0);
console.log('Passed v0.14: 42 traits, 19 aptitudes, 102 talents, 220 skill modifier examples, actor sheets, XP and roll UI');
