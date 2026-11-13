import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import progression from '../scripts/progression-data.mjs';
import rules from '../scripts/actor-rules-data.mjs';
import {
  translateRulePickerLabel, translateRulePickerSpecialisation,
  applyRulePickerTranslations, registerRulePickerUiAdapter
} from '../scripts/rule-picker-ui-adapter.mjs';

for (const [key, row] of Object.entries(progression.talents)) {
  assert.equal(translateRulePickerLabel('talent',key,row.en),row.ru,key);
  for (const tier of [1,2,3]) {
    const result=translateRulePickerLabel('talent',key,`T${tier} · ${row.en}`);
    assert.equal(result,`Ранг ${tier} · ${row.ru}`,key);
    assert.equal(translateRulePickerLabel('talent',key,result),result);
  }
  assert.equal(translateRulePickerLabel('talent',key,`${row.en}: my custom talent`),`${row.en}: my custom talent`);
}
for (const [key,row] of Object.entries(rules.traits)) {
  assert.equal(translateRulePickerLabel('trait',key,row.en),row.ru,key);
  assert.equal(translateRulePickerLabel('trait',key,row.ru),row.ru,key);
}
assert.equal(Object.keys(progression.talents).length,102);
assert.equal(Object.keys(rules.traits).length,42);
assert.equal(translateRulePickerLabel('talent','ambidextrous','T1·Ambidextrous'),'Ранг 1 · Амбидекстрия');
assert.equal(translateRulePickerLabel('talent','ambidextrous','T4 · Ambidextrous'),'T4 · Ambidextrous');
assert.equal(translateRulePickerLabel('other','ambidextrous','Ambidextrous'),'Ambidextrous');
for (const key of ['homebrew-talent','constructor','toString','__proto__']) {
  assert.equal(translateRulePickerLabel('talent',key,'T1 · Ambidextrous'),'T1 · Ambidextrous');
  assert.equal(translateRulePickerLabel('trait',key,'Amorphous'),'Amorphous');
}
for (const [source,target] of Object.entries(progression.specialisations)) {
  assert.equal(translateRulePickerSpecialisation(source,source),target,source);
  assert.equal(translateRulePickerSpecialisation(source,target),target);
  assert.equal(translateRulePickerSpecialisation(source,`Custom ${source}`),`Custom ${source}`);
}
assert.equal(translateRulePickerSpecialisation('my-value','Las'),'Las');
assert.equal(translateRulePickerSpecialisation('constructor','constructor'),'constructor');
console.log('v1.1.1 rule picker labels: 102 talents, 42 traits, exact keys and custom names PASS');

// Optional integration executes the actual pinned private handler bodies. It
// therefore exercises the source HTML, change listener, form callback and actor
// update without needing to import the entire Foundry application graph.
if (!process.env.DH2E_RU_JSDOM || !process.env.DH2E_RU_SYSTEM_PATH) {
  console.log('Source/DOM integration skipped (set DH2E_RU_JSDOM and DH2E_RU_SYSTEM_PATH).');
} else {
  const {JSDOM}=await import(pathToFileURL(resolve(process.env.DH2E_RU_JSDOM)).href);
  const systemPath=resolve(process.env.DH2E_RU_SYSTEM_PATH);
  const source=readFileSync(resolve(systemPath,'src/sheets/actor-sheet.mjs'),'utf8');
  const talents=await import(pathToFileURL(resolve(systemPath,'src/rolls/dh2e-talents.mjs')).href);
  const traits=await import(pathToFileURL(resolve(systemPath,'src/rolls/dh2e-traits.mjs')).href);
  const choices=await import(pathToFileURL(resolve(systemPath,'src/items/dh2e-item-choices.mjs')).href);
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  function handler(name,dependencies) {
    const start=source.indexOf(`  static async #${name}(event) {`);
    assert.ok(start>=0,`Missing source handler ${name}`);
    const open=source.indexOf('{',start)+1;
    const end=source.indexOf('\n  }',open);
    assert.ok(end>open,`Missing source handler end ${name}`);
    const body=source.slice(open,end);
    return new AsyncFunction('event',...Object.keys(dependencies),body);
  }
  const allSpecs=[...new Set(talents.DH2E_TALENTS.flatMap(row=>talents.getTalentSpecialisations(row.key)?.options??[]).filter(value=>value!=='Other'))];
  assert.equal(allSpecs.length,54);
  for (const value of allSpecs) {
    const translated=progression.specialisations[value]??progression.terms[value];
    assert.ok(translated&&translated!==value,value);
    assert.equal(translateRulePickerSpecialisation(value,value),translated,value);
  }
  const locale=JSON.parse(readFileSync(new URL('../lang/ru.json',import.meta.url),'utf8'));
  const game={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru',localize:key=>locale[key]??key},user:{isGM:true}};
  const dom=new JSDOM('<!doctype html><body></body>');
  const {document,Event,FormData,MutationObserver}=dom.window;
  const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
  const callbacks=new Map();let nextId=0;
  const Hooks={
    on(name,callback){const id=++nextId;callbacks.set(id,{name,callback});return id;},
    off(name,id){assert.equal(callbacks.get(id)?.name,name);callbacks.delete(id);},
    emit(name,...args){for(const entry of [...callbacks.values()])if(entry.name===name)entry.callback(...args);}
  };
  let onPrompt;
  class DialogV2 {static async prompt(options){return onPrompt(options);}}
  const registration=registerRulePickerUiAdapter({Hooks,game,DialogV2,MutationObserver});
  const foundry={utils:{escapeHTML:value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))},
    applications:{ux:{FormDataExtended:class {constructor(form){this.object=Object.fromEntries(new FormData(form));}}}}};
  const actor={id:'actor-fixture',name:'Кремень',isOwner:true,_source:{system:{dh2e:{talents:[],traits:[]}}},updates:[],update(change){this.updates.push(structuredClone(change));return change;}};
  const dependencies={DialogV2,game,foundry,
    getDh2eTalentCatalog:()=>[...talents.getDh2eTalentCatalog(),{key:'homebrew-talent',name:'Ambidextrous',tier:1}],
    getTalentSpecialisations:talents.getTalentSpecialisations,getTalent:talents.getTalent,addTalent:talents.addTalent,
    getDh2eTraitCatalog:()=>[...traits.getDh2eTraitCatalog(),{key:'homebrew-trait',name:'Amorphous',spec:false,value:false}],
    getTrait:traits.getTrait,parseDh2eSpecChoices:choices.parseDh2eSpecChoices,
    getCharacteristicSettings:()=>[{key:'strength',label:'Strength'}],Dh2eAdvancementApplication:class {render(){throw new Error('GM picker unexpectedly opened advancement.');}}};
  const makeHandler=name=>handler(name,dependencies);
  const talentHandler=makeHandler('onDh2eAddTalentDialog'),traitHandler=makeHandler('onDh2eAddTraitDialog');
  async function run(kind,{hookFirst=false,customSpec=false}={}) {
    onPrompt=async options=>{
      const app=new DialogV2();
      const root=document.createElement('dialog');root.className='application';
      root.innerHTML='<header><h1 class="window-title"></h1></header><form><div class="dialog-content"></div><footer><button type="submit">OK</button></footer></form>';
      root.querySelector('.window-title').textContent=options.window.title;
      root.querySelector('.dialog-content').innerHTML=options.content;
      document.body.append(root);app.element=root;
      const select=root.querySelector('select[name="key"]'),form=root.querySelector('form');
      const originalOptions=[...select.options];
      const originalAttributes=originalOptions.map(option=>[...option.attributes].map(attr=>[attr.name,attr.value]));
      const initialForm=Object.fromEntries(new FormData(form));
      if(hookFirst)Hooks.emit('renderApplicationV2',app,root);
      options.render(null,app);
      if(!hookFirst)Hooks.emit('renderApplicationV2',app,root);
      await flush();
      const dictionary=kind==='talent'?progression.talents:rules.traits;
      for (const option of select.options) {
        const row=dictionary[option.value];
        if(row)assert.ok(option.textContent.endsWith(row.ru),`${kind}: ${option.value} not translated`);
      }
      assert.equal(select.querySelector(`option[value="homebrew-${kind}"]`).textContent,kind==='talent'?'T1 · Ambidextrous':'Amorphous');
      assert.deepEqual([...select.options],originalOptions,'Existing option elements are retained');
      assert.deepEqual([...select.options].map(option=>[...option.attributes].map(attr=>[attr.name,attr.value])),originalAttributes,'Canonical values and source flags stay unchanged');
      assert.equal(Object.fromEntries(new FormData(form)).key,initialForm.key,'Translation does not choose a different key');
      let changes=0;select.addEventListener('change',()=>changes++);
      const choose=async value=>{select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));await flush();};
      if(kind==='talent') {
        // Repeated source sync replaces specPick options; each new set must be translated.
        for(const row of talents.DH2E_TALENTS.filter(row=>talents.getTalentSpecialisations(row.key))) {
          await choose(row.key);
          const spec=root.querySelector('select[name="specPick"]');
          const expected=(talents.getTalentSpecialisations(row.key)?.options??[]).filter(value=>value!=='Other');
          assert.deepEqual([...spec.options].map(option=>option.value),expected);
          for(const option of spec.options)assert.equal(option.textContent,progression.specialisations[option.value]??progression.terms[option.value],`${row.key}/${option.value}`);
        }
        await choose(customSpec?'resistance':'weapon-training');
        const spec=root.querySelector('select[name="specPick"]');spec.value=customSpec?'Cold':'Chain';
        if(customSpec)root.querySelector('input[name="specOwn"]').value='My custom specialisation';
        assert.equal(spec.selectedOptions[0].textContent,customSpec?'Холод':'Цепное');
      } else {
        await choose('unnatural-characteristic');
        assert.deepEqual([...root.querySelectorAll('datalist option')].map(option=>option.value),choices.parseDh2eSpecChoices('','unnatural-characteristic'),'Trait datalist values are deliberately canonical');
        await choose('fear');root.querySelector('input[name="value"]').value='3';
      }
      assert.ok(changes>0);
      const beforeRepeat=Object.fromEntries(new FormData(form)),beforeChanges=changes;
      Hooks.emit('renderApplicationV2',app,root);await flush();
      assert.deepEqual(Object.fromEntries(new FormData(form)),beforeRepeat);
      assert.equal(changes,beforeChanges,'Translation emits no synthetic source changes');
      const result=options.ok.callback(null,{form});
      Hooks.emit('closeApplicationV2',app);await flush();
      const detachedOption=document.createElement('option');detachedOption.value=kind==='talent'?'ambidextrous':'amorphous';detachedOption.textContent=kind==='talent'?'T1 · Ambidextrous':'Amorphous';select.append(detachedOption);await flush();
      assert.equal(detachedOption.textContent,kind==='talent'?'T1 · Ambidextrous':'Amorphous','Closed dialog observer is disconnected');
      root.remove();return result;
    };
    const fn=kind==='talent'?talentHandler:traitHandler;
    const updatesBefore=actor.updates.length;
    await fn.call({actor},{preventDefault(){}},...Object.values(dependencies));
    assert.equal(actor.updates.length,updatesBefore+1);
    if(kind==='talent')assert.deepEqual(actor.updates.at(-1),{'system.dh2e.talents':talents.addTalent([],customSpec?'resistance':'weapon-training',customSpec?'My custom specialisation':'Chain')});
    else assert.deepEqual(actor.updates.at(-1),{'system.dh2e.traits':[{key:'fear',spec:'',value:3}]});
  }
  await run('talent');await run('talent',{hookFirst:true,customSpec:true});await run('trait');await run('trait',{hookFirst:true});
  const unrelated=document.createElement('div');unrelated.innerHTML='<select name="key"><option value="ambidextrous">T1 · Ambidextrous</option></select>';
  const untouched=unrelated.innerHTML;applyRulePickerTranslations(new DialogV2(),unrelated,{game,DialogV2});assert.equal(unrelated.innerHTML,untouched);
  const guarded=document.createElement('div');guarded.innerHTML='<select name="key"><option value="ambidextrous">T1 · Ambidextrous</option></select><label data-talent-spec-pick><select name="specPick"></select></label><label data-talent-spec-own><input name="specOwn" type="text"></label>';
  const guardedOriginal=guarded.innerHTML;
  for(const inactive of [{...game,i18n:{...game.i18n,lang:'en'}},{...game,system:{id:'other'}}])applyRulePickerTranslations(new DialogV2(),guarded,{game:inactive,DialogV2});
  applyRulePickerTranslations({},guarded,{game,DialogV2});assert.equal(guarded.innerHTML,guardedOriginal);
  assert.equal(registerRulePickerUiAdapter({Hooks,game,DialogV2,MutationObserver}),registration);
  const reusable=new DialogV2(),oldRoot=guarded.cloneNode(true),newRoot=guarded.cloneNode(true);
  reusable.element=oldRoot;
  Hooks.emit('renderApplicationV2',reusable,[oldRoot]);await flush();
  assert.equal(oldRoot.querySelector('option').textContent,'Ранг 1 · Амбидекстрия');
  reusable.element=newRoot;
  // A part-only hook must resolve the complete marker-bearing app.element.
  Hooks.emit('renderApplicationV2',reusable,newRoot.querySelector('select[name="specPick"]'));
  oldRoot.querySelector('option').textContent='T1 · Ambidextrous';
  const late=document.createElement('option');late.value='ambidextrous';late.textContent='T1 · Ambidextrous';newRoot.querySelector('select[name="key"]').append(late);
  await flush();
  assert.equal(oldRoot.querySelector('option').textContent,'T1 · Ambidextrous','Replacement root releases the old observer');
  assert.equal(late.textContent,'Ранг 1 · Амбидекстрия','Replacement root receives a live observer');
  const custom=document.createElement('option');custom.value='homebrew-talent';custom.textContent='T1 · Ambidextrous';
  const newSelect=newRoot.querySelector('select[name="key"]');newSelect.append(custom);newSelect.value='homebrew-talent';
  newRoot.querySelector('select[name="specPick"]').innerHTML='<option value="Las">Las</option>';
  newSelect.dispatchEvent(new Event('change',{bubbles:true}));await flush();
  assert.equal(newRoot.querySelector('select[name="specPick"] option').textContent,'Las','Homebrew specialisations are not rewritten');
  Hooks.emit('closeApplicationV2',reusable);
  late.textContent='T1 · Ambidextrous';await flush();assert.equal(late.textContent,'T1 · Ambidextrous');
  Hooks.emit('renderApplicationV2',reusable,newRoot);await flush();assert.equal(late.textContent,'Ранг 1 · Амбидекстрия','A reopened dialog gets an observer again');
  registration.dispose();assert.equal(callbacks.size,0);
  late.textContent='T1 · Ambidextrous';await flush();assert.equal(late.textContent,'T1 · Ambidextrous','Disposal disconnects all live observers');
  dom.window.close();
  console.log('Real source/DOM rule pickers: 102 talents, 42 traits, 54 specialisations, change listeners, canonical submit and cleanup PASS');
}
