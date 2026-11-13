import assert from 'node:assert/strict';
import dictionary from '../scripts/ui-literals.mjs';
import {
  translateDh2eTestBreakdown, translateDh2eChatBreakdown, registerChatBreakdownUiAdapter
} from '../scripts/chat-breakdown-ui-adapter.mjs';
const en = 'Weapon Skill: +35<br>Trained: +10<br>Skill value: +45<br>Situational modifiers / talents: -20<br>Assistance: +10<br>Other custom bonus: +5<br>Total test modifier: -10<br>Target: +35';
const ru = translateDh2eTestBreakdown(en, dictionary);
assert.match(ru, /^Навык Рукопашной: \+35<br>Обученный: \+10/);
assert.match(ru, /Ситуационные модификаторы \/ таланты: -20/);
assert.match(ru, /Other custom bonus: \+5/); // never translate user-authored labels
assert.match(ru, /Целевое значение: \+35$/);
assert.equal(translateDh2eTestBreakdown('Owner: Alice<br>Character: +1', dictionary),'Owner: Alice<br>Character: +1');
assert.equal(translateDh2eTestBreakdown('Attack modifiers: +5', dictionary),'Attack modifiers: +5');
assert.equal(translateDh2eTestBreakdown(ru,dictionary),ru);
const node={data:en,getAttribute(k){return k==='data-tooltip'?this.data:null;},setAttribute(k,v){if(k==='data-tooltip')this.data=v;}};
const root={querySelectorAll(sel){return sel.includes('.dh2e-facts')?[node]:[];}};
const flag=()=>({skillKey:'meleeCombat'});
const message={getFlag(system,key){return system==='dark-heresy-2e-apex' && key==='skillCheck'?flag():null;}};
const actual={system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
const other={system:{id:'another'},i18n:{lang:'ru'}};
assert.deepEqual(translateDh2eChatBreakdown(message,root,{dictionary,game:other}),{active:false,translated:0});
assert.equal(node.data,en);
assert.deepEqual(translateDh2eChatBreakdown({getFlag:()=>null},root,{dictionary,game:actual}),{active:false,translated:0});
assert.equal(node.data,en);
assert.deepEqual(translateDh2eChatBreakdown(message,root,{dictionary,game:actual}),{active:true,translated:1});
assert.equal(node.data,ru);
assert.deepEqual(translateDh2eChatBreakdown(message,root,{dictionary,game:actual}),{active:true,translated:0});
node.data='<script>alert(1)</script><br>'+en;
assert.deepEqual(translateDh2eChatBreakdown(message,root,{dictionary,game:actual}),{active:true,translated:0});
node.data=en;
const callbacks=new Map();let seq=0;
const hooks={on(n,cb){const id=++seq;callbacks.set(id,{n,cb});return id;},off(_name,id){callbacks.delete(id);}};
const h=registerChatBreakdownUiAdapter({dictionary,Hooks:hooks,game:()=>actual});
assert.equal(h,registerChatBreakdownUiAdapter({dictionary,Hooks:hooks,game:()=>actual}));
assert.equal(callbacks.size,1);
for(const {n,cb} of callbacks.values()){assert.equal(n,'renderChatMessageHTML');cb(message,root);}
assert.equal(node.data,ru);
h.dispose();h.dispose();assert.equal(callbacks.size,0);
console.log('Passed 12 chat breakdown UI safety and translation assertions');
