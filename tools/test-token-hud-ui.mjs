import assert from 'node:assert/strict';
import dictionary from '../scripts/ui-literals.mjs';
import powers from '../scripts/token-hud-powers.mjs';
import {
  applyTokenHudUiTranslations, registerTokenHudUiAdapter,
  translateActionTooltip, translatePowerDescriptor, stockPowerTooltip, translatedStockPowerTooltip
} from '../scripts/token-hud-ui-adapter.mjs';

const suite = [];
const test = (name, fn) => { fn(); suite.push(name); };
const node = (value) => ({nodeType: 3, nodeValue: value});
function el({ attrs = {}, text = null, descendants = {} } = {}) {
  const entry = {
    nodeType: 1,
    attributes: { ...attrs },
    childNodes: text === null ? [] : [node(text)],
    get textContent() { return this.childNodes.map(x=>x.nodeValue).join(''); },
    getAttribute(k) { return this.attributes[k] ?? null; },
    setAttribute(k, v) { this.attributes[k] = v; },
    querySelector(s) {return descendants[s] ?? null;},
    querySelectorAll(s) {return descendants[s] ? [descendants[s]] : [];},
    matches() {return false;}
  };
  return entry;
}

const statSpan = el({text:'WS'});
const stat = el({attrs: {'data-skill-key':'meleeCombat','data-tooltip':'Weapon Skill'},descendants:{span:statSpan}});
const skilled = el({attrs:{'data-skill-key':'commonLoreAdeptusMechanicus','data-tooltip':'Common Lore (Adeptus Mechanicus)'},descendants:{'span.dh2e-hud-check-label':el({text:'Adeptus Mechanicus'})}});
const group = el({attrs:{'data-skill-group-key':'commonLore'},descendants:{'summary > span':el({text:'Common Lore'})}});
const action = el({attrs:{'data-system-action-key':'dh2e:aimHalf','data-tooltip':'⚠ Нет полудействий — Полудействие · Concentration, Melee/Ranged · p. 218 — Прицеливание повышает шанс попадания.'}});
const psychicSpan = el({text:'Enfeeble'});
const psychic = el({attrs:{'data-power-key':'enfeeble','data-tooltip':stockPowerTooltip(powers.enfeeble)},descendants:{span:psychicSpan,img:el({attrs:{alt:'Enfeeble'}})}});
const body = el({attrs:{'aria-label':'Body'}});
const pinned = el({text:'−20 BS · ½'});
const locations = {
  'button.dh2e-hud-stat[data-action="rollSkill"][data-skill-key]': [stat],
  'button.dh2e-hud-check[data-action="rollSkill"][data-skill-key]': [skilled],
  '.dh2e-hud-check-group[data-skill-group-key]': [group],
  'button[data-action="useSystemAction"][data-system-action-key^="dh2e:"][data-tooltip]': [action],
  'button[data-action="useDh2ePsychicPower"][data-power-key]': [psychic],
  'svg.dark-heresy-2e-apex-token-hud-limb-silhouette[aria-label]': [body],
  'strong.dh2e-hud-pinned': [pinned]
};
const root = el();
root.classList = {contains:(x)=>x==='dark-heresy-2e-apex-token-action-hud'};
root.querySelectorAll = (selector) => locations[selector] ?? [];
function TokenActionHud() {};
const app = new TokenActionHud();
const activeGame = {system:{id:'dark-heresy-2e-apex'},i18n:{lang:'ru'}};
const inactiveGame = {system:{id:'another'},i18n:{lang:'ru'}};

test('HUD scope fails closed for another game', () => {
  const r=applyTokenHudUiTranslations(app,root,{dictionary,powers,game:inactiveGame});
  assert.equal(r.active,false);
  assert.equal(statSpan.childNodes[0].nodeValue,'WS');
});
test('HUD scope fails closed for another application', () => {
  const r=applyTokenHudUiTranslations({constructor:{name:'Unrelated'}},root,{dictionary,powers,game:activeGame});
  assert.equal(r.active,false);
});
test('Translate the HUD without touching data skill keys', () => {
  const r=applyTokenHudUiTranslations(app,root,{dictionary,powers,game:activeGame});
  assert.equal(r.active,true);
  assert.ok(r.text >= 5 && r.attributes >= 5,r);
  assert.equal(statSpan.childNodes[0].nodeValue,'НР');
  assert.equal(stat.getAttribute('data-tooltip'),'Навык Рукопашной');
  assert.equal(skilled.querySelector('span.dh2e-hud-check-label').childNodes[0].nodeValue,'Адептус Механикус');
  assert.equal(skilled.getAttribute('data-tooltip'),'Общие знания (Адептус Механикус)');
  assert.equal(skilled.getAttribute('data-skill-key'),'commonLoreAdeptusMechanicus');
  assert.equal(group.querySelector('summary > span').childNodes[0].nodeValue,'Общие знания');
  assert.match(action.getAttribute('data-tooltip'),/Сосредоточение, Ближний бой\/Дальний бой · стр\. 218/);
  assert.equal(action.getAttribute('data-system-action-key'),'dh2e:aimHalf');
  assert.equal(psychicSpan.childNodes[0].nodeValue,'Ослабление');
  assert.match(psychic.getAttribute('data-tooltip'),/Заурядная \(\+0\) Встречная проверка Силы воли/);
  assert.equal(body.getAttribute('aria-label'),'Тело');
  assert.equal(pinned.childNodes[0].nodeValue,'−20 НС · ½');
});
test('Russian stock power keeps Russian name but receives translated tooltip', () => {
  psychic.setAttribute('data-tooltip',stockPowerTooltip(powers.enfeeble));
  const r=applyTokenHudUiTranslations(app,root,{dictionary,powers,game:activeGame});
  assert.equal(r.text,0);
  assert.equal(psychicSpan.childNodes[0].nodeValue,'Ослабление');
  assert.match(psychic.getAttribute('data-tooltip'),/Встречная проверка Силы воли/);
});
test('Second pass is idempotent', () => {
  const r=applyTokenHudUiTranslations(app,root,{dictionary,powers,game:activeGame});
  assert.equal(r.text+r.attributes,0);
});
test('Action tooltip transformations are limited and deterministic', () => {
  assert.equal(translateActionTooltip('Полудействие · Concentration, Attack · p. 125 — Проверка'), 'Полудействие · Сосредоточение, Атака · стр. 125 — Проверка');
  assert.equal(translateActionTooltip('⚠ блок — Полное действие · p. 201 — Примечание'), '⚠ блок — Полное действие · стр. 201 — Примечание');
  assert.equal(translateActionTooltip('Custom User Story p. 18'), 'Custom User Story p. 18');
});
test('Preserve numeric power metadata while translating labels', () => {
  assert.equal(translatePowerDescriptor('20 metres x psy rating', 'range'), '20 м × пси-рейтинг');
  assert.equal(translatePowerDescriptor('Self', 'range'), 'На себя');
  assert.equal(translatePowerDescriptor('Difficult (–10) Opposed Willpower test', 'test'), 'Непростая (–10) Встречная проверка Силы воли');
  assert.equal(translatePowerDescriptor('Half Action', 'action'), 'Полудействие');
  assert.equal(powers['gate-of-infinity'].ru,'Врата бесконечности');
});
test('Hooks install synchronously and are disposable', () => {
  const handlers = new Map(); let i=0;
  const Hooks={on(n,cb){handlers.set(++i,{n,cb});return i;},off(_n,id){handlers.delete(id);}};
  const h=registerTokenHudUiAdapter({dictionary,powers,Hooks,game:()=>activeGame});
  assert.strictEqual(h,registerTokenHudUiAdapter({dictionary,powers,Hooks,game:()=>activeGame}));
  assert.equal(handlers.size,2);
  const controls = {tokens:{tools:{falloutMawTokenHud:{name:'falloutMawTokenHud',title:'Token Action HUD'}}}};
  for (const {n,cb} of handlers.values()) if (n==='getSceneControlButtons') cb(controls);
  assert.equal(controls.tokens.tools.falloutMawTokenHud.title,'Панель действий токена');
  h.dispose();
  assert.equal(handlers.size,0);
});
console.log(`Passed ${suite.length} token HUD adapter regression tests`);
