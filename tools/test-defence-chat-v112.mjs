import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {translateDefenceChoiceLabel,applyDefenceChatTranslations,registerDefenceChatUiAdapter} from '../scripts/defence-chat-ui-adapter.mjs';

const labels={dodge:['Dodge','Уклонение'],parry:['Parry','Парирование'],willpowerTest:['Willpower','Сила воли'],foreboding:['Foreboding','Предчувствие']};
for(const [key,[en,ru]] of Object.entries(labels)) for(const number of [0,34,110]) {
  assert.equal(translateDefenceChoiceLabel(key,`${en} ${number}%`),`${ru} ${number}%`);
  assert.equal(translateDefenceChoiceLabel(key,`${ru} ${number}%`),`${ru} ${number}%`);
  assert.equal(translateDefenceChoiceLabel(key,`My ${en} ${number}%`),`My ${en} ${number}%`);
}
for(const [key,text] of [['constructor','Dodge 34%'],['__proto__','Dodge 34%'],['parry','Dodge 34%'],['custom','Dodge 34%'],['dodge','Dodge vs Parry']])
  assert.equal(translateDefenceChoiceLabel(key,text),text);
for(const [key,en] of [['none','Take'],['resist','Resist'],['yield','Yield']]) {
  assert.match(translateDefenceChoiceLabel(key,en),/[А-Яа-яЁё]/u);
  assert.equal(translateDefenceChoiceLabel(key,`My ${en}`),`My ${en}`);
}
assert.equal(translateDefenceChoiceLabel('resist','Resist 65%'),'Сопротивляться 65%');
console.log('v1.1.2 defence labels: source choices, percentages, custom text and idempotence PASS');

if(!process.env.DH2E_RU_JSDOM||!process.env.DH2E_RU_SYSTEM_PATH) {
  console.log('Source/DOM integration skipped (set DH2E_RU_JSDOM and DH2E_RU_SYSTEM_PATH).');
} else {
  const {JSDOM}=await import(pathToFileURL(resolve(process.env.DH2E_RU_JSDOM)).href);
  const sourceDir=resolve(process.env.DH2E_RU_SYSTEM_PATH);
  const defenceSource=readFileSync(resolve(sourceDir,'src/combat/dh2e-defence.mjs'),'utf8');
  const responseSource=readFileSync(resolve(sourceDir,'src/combat/dh2e-responses.mjs'),'utf8');
  function sourceFunction(source,name) {
    const start=source.indexOf(`function ${name}(`);
    assert.ok(start>=0,`Source function missing: ${name}`);
    const end=source.indexOf('\n}',start);
    assert.ok(end>start);
    return source.slice(source.slice(start-6,start)==='async '?start-6:start,end+2);
  }
  const dom=new JSDOM('<!doctype html><body></body>');
  const {document,MouseEvent}=dom.window;
  const SYS='dark-heresy-2e-apex';
  const locale=JSON.parse(readFileSync(new URL('../lang/ru.json',import.meta.url),'utf8'));
  const game={system:{id:SYS},i18n:{lang:'ru',localize:key=>locale[key]??key},user:{isGM:false},users:{activeGM:{}}};
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const foundry={utils:{escapeHTML:escape,hasProperty:()=>false}};
  const L=(_key,fallback)=>fallback; // The source can render legacy English values stored in chat flags.
  const fromUuidSync=uuid=>({isOwner:uuid!=='Actor.blocked'});
  const callbacks=new Map();let nextId=0;
  const Hooks={
    on(name,callback){const id=++nextId;callbacks.set(id,{name,callback});return id;},
    off(name,id){assert.equal(callbacks.get(id)?.name,name);callbacks.delete(id);},
    emit(name,...args){for(const row of [...callbacks.values()])if(row.name===name)row.callback(...args);}
  };
  const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
  const CONFIG={};
  const queryPayloads=[];
  game.users.activeGM.query=async(query,payload,options)=>{queryPayloads.push({query,payload,options});return true;};
  const definitions=[
    sourceFunction(defenceSource,'cannotReact'),sourceFunction(defenceSource,'canChoose'),sourceFunction(defenceSource,'renderRow'),
    sourceFunction(defenceSource,'renderResolved'),sourceFunction(defenceSource,'renderResolvedBody'),sourceFunction(defenceSource,'TEST_LABELS'),
    sourceFunction(defenceSource,'registerDh2eDefenceHooks')
  ].join('\n');
  const factory=new Function('Hooks','CONFIG','game','foundry','document','fromUuidSync','L','escape','CSS',`
    const SYSTEM_ID=${JSON.stringify(SYS)},FLAG='dh2eDefence',QUERY=SYSTEM_ID+'.dh2eResolveDefence';
    const autoResolveHelpless=()=>{},hitsText=n=>n+' hits',STUCK_AFTER_MS=8000;
    const format=(_key,_values,fallback)=>fallback,localize=(_key,fallback)=>fallback;
    ${defenceSource.match(/^const line = .*$/m)[0]}
    ${defenceSource.match(/^const lbl = .*$/m)[0]}
    ${definitions}
    return {registerDh2eDefenceHooks,renderRow,renderResolved};
  `);
  const source=factory(Hooks,CONFIG,game,foundry,document,fromUuidSync,L,escape,{escape:value=>String(value).replace(/["\\]/g,'\\$&')});
  // Skip only the lazy psychic-data import; execute the source render and click hooks unchanged.
  const responseHooks=sourceFunction(responseSource,'registerDh2eResponseHooks').replace(/^  import\("\.\/dh2e-psychic-runtime\.mjs"\).*\n/m,'');
  assert.ok(!responseHooks.includes('import('),'Psychic lazy import must be removed from the isolated source fixture');
  const responseFactory=new Function('Hooks','CONFIG','game','document','L','escape','CSS',`
    const SYSTEM_ID=${JSON.stringify(SYS)},FLAG='dh2eResponses',QUERY=SYSTEM_ID+'.dh2eResolveResponse',REROLL_QUERY=SYSTEM_ID+'.dh2eRerollResponse';
    const canAnswer=entry=>entry.targetUuid!=='Actor.blocked',resistTarget=entry=>entry.chance??65;
    const autoResolveOpposed=()=>{},renderResolved=()=>'',canRerollActor=()=>false,canReroll=()=>false;
    ${sourceFunction(responseSource,'renderPending')}
    ${sourceFunction(responseSource,'answer')}
    ${responseHooks}
    return {registerDh2eResponseHooks,renderPending};
  `);
  const responseSourceApi=responseFactory(Hooks,CONFIG,game,document,L,escape,{escape:value=>String(value).replace(/["\\]/g,'\\$&')});
  const {renderPending}=responseSourceApi;
  function deepFreeze(value){if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))deepFreeze(child);}return value;}
  function messageFor(entries,responseEntries=[]) {
    const flags=deepFreeze({dh2eDefence:{entries},dh2eResponses:{entries:responseEntries}});
    return {id:'message-fixture',flags:{[SYS]:flags},getFlag(system,key){assert.equal(system,SYS);return flags[key];}};
  }
  function pendingEntry(id='hit-1',targetUuid='Actor.allowed') {
    return {id,targetUuid,name:'Dodge 34%',hits:2,result:null,defence:{options:[
      {key:'dodge',label:'Dodge',target:0},{key:'parry',label:'Parry',target:110},
      {key:'willpowerTest',label:'Willpower',target:34},{key:'foreboding',label:'Foreboding',target:42},
      {key:'custom',label:'Dodge',target:34},{key:'dodge',label:'My Dodge',target:88}
    ]}};
  }
  function container(){const root=document.createElement('div');root.innerHTML='<article class="dark-heresy-2e-apex-chat-card"><h2>Dodge 34%</h2></article><p class="user-message">Parry 110%</p>';document.body.append(root);return root;}

  // Execute the actual system render hook both before and after the module hook.
  for(const moduleFirst of [false,true]) {
    callbacks.clear();
    let registration;
    if(moduleFirst)registration=registerDefenceChatUiAdapter({Hooks,game});
    source.registerDh2eDefenceHooks();
    if(!moduleFirst)registration=registerDefenceChatUiAdapter({Hooks,game});
    const entry=pendingEntry(),blocked=pendingEntry('blocked','Actor.blocked');
    const message=messageFor([entry,blocked]),before=JSON.stringify(message.flags),root=container();
    Hooks.emit('renderChatMessageHTML',message,root);await flush();
    const row=root.querySelector('[data-entry-row="hit-1"]');
    const buttons=[...row.querySelectorAll('button')];
    assert.deepEqual(buttons.map(button=>button.textContent),['Уклонение 0%','Парирование 110%','Сила воли 34%','Предчувствие 42%','Dodge 34%','My Dodge 88%',translateDefenceChoiceLabel('none','Take')]);
    assert.equal(row.querySelector('.dh2e-act-name').firstChild.nodeValue.trim(),'Dodge 34%');
    assert.equal(root.querySelector('h2').textContent,'Dodge 34%');
    assert.equal(root.querySelector('.user-message').textContent,'Parry 110%');
    assert.ok([...root.querySelectorAll('[data-entry-row="blocked"] button')].every(button=>button.disabled));
    const attributes=buttons.map(button=>[...button.attributes].map(attribute=>[attribute.name,attribute.value]));
    const nodes=buttons.map(button=>button.firstChild);
    applyDefenceChatTranslations(message,root,{game});
    assert.deepEqual([...row.querySelectorAll('button')],buttons);
    assert.deepEqual(buttons.map(button=>button.firstChild),nodes);
    assert.deepEqual(buttons.map(button=>[...button.attributes].map(attribute=>[attribute.name,attribute.value])),attributes);
    assert.equal(JSON.stringify(message.flags),before,'Message flags remain immutable');
    buttons[0].dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));await flush();
    assert.deepEqual(queryPayloads.at(-1),{query:SYS+'.dh2eResolveDefence',payload:{messageId:message.id,entryId:'hit-1',choice:'dodge'},options:{timeout:30000}});
    assert.ok(buttons.every(button=>button.disabled),'Original system click listener still disables the row');
    Hooks.emit('renderChatMessageHTML',message,root);await flush();
    assert.equal(root.querySelectorAll('.dh2e-defence-strip').length,1);
    assert.equal(root.querySelector('[data-dh2e-defence="parry"]').textContent,'Парирование 110%');
    registration.dispose();root.remove();
  }

  // Stun/grapple rows are a separate source renderer with distinct action attributes.
  const responseEntries=['stun','grapple','opposed'].map((kind,i)=>({...pendingEntry('response-'+i),kind,chance:65}));
  const responseMessage=messageFor([],responseEntries),responseBefore=JSON.stringify(responseMessage.flags),responseRoot=container();
  responseRoot.querySelector('article').insertAdjacentHTML('beforeend','<section class="dh2e-defence-strip dh2e-response-strip">'+responseEntries.map(renderPending).join('')+'</section>');
  let clickCount=0;responseRoot.addEventListener('click',()=>clickCount++);
  const originalResponseButtons=[...responseRoot.querySelectorAll('button')];
  const originalResponseTextNodes=originalResponseButtons.map(button=>button.firstChild);
  const originalResponseAttrs=originalResponseButtons.map(button=>[...button.attributes].map(attribute=>[attribute.name,attribute.value]));
  applyDefenceChatTranslations(responseMessage,responseRoot,{game});
  for(const row of responseRoot.querySelectorAll('[data-entry-row]')) {
    const dodge=row.querySelector('[data-dh2e-response="dodge"]');
    if(dodge){assert.equal(dodge.textContent,'Уклонение 0%');assert.equal(row.querySelector('[data-dh2e-response="parry"]').textContent,'Парирование 110%');}
    const resist=row.querySelector('[data-dh2e-response="resist"]');
    if(resist){assert.equal(resist.textContent,'Сопротивляться 65%');assert.match(row.querySelector('[data-dh2e-response="yield"]').textContent,/[А-Яа-яЁё]/u);}
  }
  assert.deepEqual([...responseRoot.querySelectorAll('button')],originalResponseButtons);
  assert.deepEqual(originalResponseButtons.map(button=>button.firstChild),originalResponseTextNodes);
  assert.deepEqual(originalResponseButtons.map(button=>[...button.attributes].map(attribute=>[attribute.name,attribute.value])),originalResponseAttrs);
  originalResponseButtons[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));assert.equal(clickCount,1);
  assert.equal(JSON.stringify(responseMessage.flags),responseBefore);

  for(const moduleFirst of [false,true]) {
    callbacks.clear();
    let registration;
    if(moduleFirst)registration=registerDefenceChatUiAdapter({Hooks,game});
    responseSourceApi.registerDh2eResponseHooks();
    if(!moduleFirst)registration=registerDefenceChatUiAdapter({Hooks,game});
    const message=messageFor([],[{...pendingEntry('response-hit'),kind:'grapple'}]),root=container();
    const before=JSON.stringify(message.flags);
    Hooks.emit('renderChatMessageHTML',message,root);await flush();
    const button=root.querySelector('[data-dh2e-response="parry"]');
    assert.equal(button.textContent,'Парирование 110%');
    assert.equal(root.querySelector('[data-dh2e-response="none"]').textContent,'Принять');
    button.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));await flush();
    assert.deepEqual(queryPayloads.at(-1),{query:SYS+'.dh2eResolveResponse',payload:{messageId:message.id,entryId:'response-hit',choice:'parry'},options:{timeout:60000}});
    assert.ok([...root.querySelectorAll('button')].every(item=>item.disabled));
    assert.equal(JSON.stringify(message.flags),before);
    Hooks.emit('renderChatMessageHTML',message,root);await flush();
    assert.equal(root.querySelectorAll('.dh2e-response-strip').length,1);
    assert.equal(root.querySelector('[data-dh2e-response="parry"]').textContent,'Парирование 110%');
    registration.dispose();root.remove();
  }

  // The source localizes other resolved tests but hardcodes Foreboding.
  // Match the actual renderer's whole line, including its optional actor prefix.
  for(const multiple of [false,true]) for(const test of [null,{roll:23,target:110}]) {
    const entry={...pendingEntry('resolved'),name:'Foreboding 23 / 110',result:{choice:'foreboding',test,landed:0,damage:0,hits:[],traumas:['Custom Foreboding result']}};
    const entries=multiple?[entry,{...pendingEntry('other'),name:'Other target'}]:[entry];
    const message=messageFor(entries),before=JSON.stringify(message.flags),root=container();
    root.querySelector('article').insertAdjacentHTML('beforeend','<section class="dh2e-defence-strip">'+source.renderResolved(entry,multiple)+'</section>');
    const spans=[...root.querySelectorAll('.dh2e-resolved .dh2e-line > span')],nodes=spans.map(span=>span.firstChild);
    const prefix=multiple?entry.name+' · ':'';
    const suffix=test?' 23 / 110':'';
    assert.equal(spans[0].textContent,prefix+'Foreboding'+suffix);
    const result=applyDefenceChatTranslations(message,root,{game});
    assert.equal(result.translated,1);
    assert.equal(spans[0].textContent,prefix+'Предчувствие'+suffix);
    assert.equal(spans[1].textContent,'Custom Foreboding result');
    assert.deepEqual(spans.map(span=>span.firstChild),nodes);
    assert.equal(applyDefenceChatTranslations(message,root,{game}).translated,0);
    assert.equal(JSON.stringify(message.flags),before);
    root.remove();
  }

  // Pending/cancelled names and trauma text can equal a canonical choice label.
  for(const state of ['pending','cancelled','voided']) {
    const entry={...pendingEntry('named'),name:'Foreboding',result:{choice:'foreboding',[state]:true}};
    const message=messageFor([entry]),root=container();
    root.querySelector('article').insertAdjacentHTML('beforeend','<section class="dh2e-defence-strip">'+source.renderResolved(entry,false)+'</section>');
    const before=root.innerHTML;
    assert.equal(applyDefenceChatTranslations(message,root,{game}).translated,0,`${state} actor name is not a choice label`);
    assert.equal(root.innerHTML,before);root.remove();
  }
  for(const why of [undefined,'helpless']) for(const blastNote of [undefined,'blocked']) {
    const entry={...pendingEntry('named-result'),name:'Foreboding 23 / 110',result:{choice:'foreboding',test:{roll:23,target:110},why,blastNote,landed:0,damage:0,hits:[],traumas:['Foreboding 23 / 110']}};
    const message=messageFor([entry]),root=container();
    root.querySelector('article').insertAdjacentHTML('beforeend','<section class="dh2e-defence-strip">'+source.renderResolved(entry,false)+'</section>');
    const spans=[...root.querySelectorAll('.dh2e-resolved > .dh2e-line > span')];
    const expected=[...(why?['No defence']:[]),...(blastNote?['Foreboding 23 / 110']:[]),'Foreboding 23 / 110','Foreboding 23 / 110'];
    assert.deepEqual(spans.map(span=>span.textContent),expected);
    assert.equal(applyDefenceChatTranslations(message,root,{game}).translated,1);
    expected[Number(Boolean(why))+Number(Boolean(blastNote))]='Предчувствие 23 / 110';
    assert.deepEqual(spans.map(span=>span.textContent),expected);
    root.remove();
  }

  // Disposal suppresses the queued pass when the source appends after this hook.
  callbacks.clear();
  const registration=registerDefenceChatUiAdapter({Hooks,game});
  assert.equal(registerDefenceChatUiAdapter({Hooks,game}),registration,'Registration is idempotent');
  source.registerDh2eDefenceHooks();
  const disposedMessage=messageFor([pendingEntry()]),disposedRoot=container();
  Hooks.emit('renderChatMessageHTML',disposedMessage,disposedRoot);
  registration.dispose();registration.dispose();await flush();
  assert.equal(disposedRoot.querySelector('button').textContent,'Dodge 0%');
  disposedRoot.remove();

  // Correct-looking text without matching flags/row ids, and unrelated elements, stay untouched.
  for(const mutate of [
    (message,root)=>{message.getFlag=()=>undefined;message.flags={};},
    (message,root)=>{root.querySelector('button').dataset.entry='wrong-entry';},
    (message,root)=>{root.querySelector('[data-entry-row]').dataset.entryRow='wrong-row';}
  ]) {
    const message=messageFor([pendingEntry()]),root=container();
    root.querySelector('article').insertAdjacentHTML('beforeend','<section class="dh2e-defence-strip">'+source.renderRow(message.getFlag(SYS,'dh2eDefence').entries[0],false)+'</section>');
    mutate(message,root);applyDefenceChatTranslations(message,root,{game});
    assert.equal(root.querySelector('button').textContent,'Dodge 0%');root.remove();
  }
  for(const otherGame of [{...game,i18n:{...game.i18n,lang:'en'}},{...game,system:{id:'other'}}]) {
    const message=messageFor([pendingEntry()]),root=container();
    root.querySelector('article').insertAdjacentHTML('beforeend','<section class="dh2e-defence-strip">'+source.renderRow(message.getFlag(SYS,'dh2eDefence').entries[0],false)+'</section>');
    const before=root.innerHTML;applyDefenceChatTranslations(message,root,{game:otherGame});assert.equal(root.innerHTML,before);root.remove();
  }
  responseRoot.remove();dom.window.close();
  console.log('Real source/DOM defence chat: both hook orders for both strips, original GM click payloads, rerender, resolved Foreboding, disposal and immutable flags PASS');
}
