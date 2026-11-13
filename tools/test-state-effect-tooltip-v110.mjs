import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stateEffectSources} from '../scripts/state-effect-l10n.mjs';
import {applyStateEffectTooltipTranslations, observeStateEffectTooltips} from '../scripts/state-effect-tooltip-l10n.mjs';

const SYS = 'dark-heresy-2e-apex';
const locale = JSON.parse(fs.readFileSync(new URL('../lang/ru.json', import.meta.url), 'utf8'));
const game = {system: {id: SYS}, i18n: {lang: 'ru', localize: key => locale[key] ?? key}};
const enGame = {...game, i18n: {...game.i18n, lang: 'en'}};
class Text { constructor(value) {this.nodeType = 3; this.nodeValue = value;} }
class Element {
  constructor(tagName, attrs = {}, ...children) {this.nodeType = 1; this.tagName = tagName.toUpperCase(); this.attrs = {...attrs}; this.childNodes = children.map(node => typeof node === 'string' ? new Text(node) : node);}
  get attributes() {return Object.entries(this.attrs);}
  getAttribute(key) {return this.attrs[key] ?? null;}
  get textContent() {return this.childNodes.map(node => node.nodeType === 3 ? node.nodeValue : node.textContent).join('');}
  set innerHTML(_) {throw new Error('Tooltip markup must not be replaced');}
  matches(selector) {
    const [tagName, className] = selector.split('.');
    return (!tagName || tagName.toUpperCase() === this.tagName) && (!className || String(this.attrs.class ?? '').split(' ').includes(className));
  }
  querySelector(selector) {
    if (selector.startsWith(':scope > ')) {
      let nodes = [this];
      for (const part of selector.slice(9).split(' > ')) nodes = nodes.flatMap(node => node.childNodes.filter(child => child.nodeType === 1 && child.matches(part)));
      return nodes[0] ?? null;
    }
    return this.querySelectorAll(selector)[0] ?? null;
  }
  querySelectorAll(selector) {
    return this.childNodes.filter(node => node.nodeType === 1).flatMap(node => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]);
  }
}
function tooltip(id, source, {name = source.name, rule = source.rule, pageWord = 'p.'} = {}) {
  const title = new Element('strong', {}, name);
  const image = new Element('img', {src: source.img, alt: ''});
  const ruleP = new Element('p', {}, rule);
  const citation = new Element('em', {}, `Dark Heresy ${pageWord} ${source.page}`);
  const description = new Element('section', {class: 'description'}, ruleP, new Element('p', {}, citation));
  const changes = new Element('section', {class: 'changes'}, new Element('h4', {}, 'My extra changes'));
  const card = new Element('article', {class: 'dark-heresy-2e-apex-effect-tooltip-content'}, new Element('header', {}, image, new Element('div', {}, title)), description, changes);
  return Object.assign(card, {id, title, image, ruleP, citation, description, changes});
}
const entries = Object.entries(stateEffectSources);
assert.equal(entries.length, 39);
for (const [id, source] of entries) {
  const card = tooltip(id, source);
  const ruleNode = card.ruleP.childNodes[0], citationNode = card.citation.childNodes[0], nameNode = card.title.childNodes[0];
  const originalChildren = [...card.childNodes];
  assert.deepEqual(applyStateEffectTooltipTranslations(card, {game}), {active: true, matched: 1, translated: 3}, id);
  assert.equal(ruleNode.nodeValue, locale[`FALLOUTMAW.DH2E.States.${id}.Rule`]);
  assert.equal(citationNode.nodeValue, `Dark Heresy стр. ${source.page}`);
  assert.equal(nameNode.nodeValue, locale[`FALLOUTMAW.DH2E.States.${id}.Name`]);
  assert.equal(card.ruleP.childNodes[0], ruleNode);
  assert.equal(card.citation.childNodes[0], citationNode);
  assert.deepEqual(card.childNodes, originalChildren);
  assert.equal(card.changes.textContent, 'My extra changes');
  assert.equal(card.image.getAttribute('src'), source.img);
  assert.deepEqual(applyStateEffectTooltipTranslations(card, {game}), {active: true, matched: 1, translated: 0});
  const mixed = tooltip(id, source, {rule: locale[`FALLOUTMAW.DH2E.States.${id}.Rule`], pageWord: 'стр.'});
  assert.equal(applyStateEffectTooltipTranslations(mixed, {game}).translated, 1, 'An English stock title translates independently of an already translated rule');
}
const [id, source] = entries[0];
const freeId = 'dh2e-free-attack', freeSource = stateEffectSources[freeId], freeRu = locale[`FALLOUTMAW.DH2E.States.${freeId}.Name`];
for (const [suffix, translatedSuffix] of [['Multiple Arms','Множество рук'],['Devastating Assault','Неостановимый Натиск'],['Counter Attack','Контратака']]) {
  for (const base of [freeSource.name, freeRu]) {
    const card = tooltip(freeId, freeSource, {name: `${base}: ${suffix}`});
    applyStateEffectTooltipTranslations(card, {game});
    assert.equal(card.title.textContent, `${freeRu}: ${translatedSuffix}`);
    assert.equal(applyStateEffectTooltipTranslations(card, {game}).translated, 0);
  }
}
const customFreeName = `${freeRu}: My custom attack`;
const customFree = tooltip(freeId, freeSource, {name: customFreeName});
applyStateEffectTooltipTranslations(customFree, {game});
assert.equal(customFree.title.textContent, customFreeName);
const customFreeRule = tooltip(freeId, freeSource, {name: `${freeRu}: Multiple Arms`, rule: 'My rule'});
assert.equal(applyStateEffectTooltipTranslations(customFreeRule, {game}).translated, 0);
assert.equal(customFreeRule.title.textContent, `${freeRu}: Multiple Arms`);
const customName = tooltip(id, source, {name: 'My own title'});
assert.equal(applyStateEffectTooltipTranslations(customName, {game}).translated, 2);
assert.equal(customName.title.textContent, 'My own title');
for (const change of [
  card => {card.image.attrs.src = 'modules/custom/icon.svg';},
  card => {card.ruleP.childNodes[0].nodeValue += ' House rule.';},
  card => {card.citation.childNodes[0].nodeValue = 'Dark Heresy p. 999';},
  card => {card.description.childNodes.push(new Element('p', {}, 'More custom text'));},
  card => {card.ruleP.childNodes = [new Element('span', {}, source.rule)];},
  card => {card.ruleP.attrs.style = 'color: red';},
  card => {card.citation.attrs.title = 'My custom citation';},
  card => {card.attrs.class = 'other-module-tooltip';}
]) {
  const card = tooltip(id, source); change(card);
  const before = card.textContent;
  assert.equal(applyStateEffectTooltipTranslations(card, {game}).translated, 0);
  assert.equal(card.textContent, before);
}
for (const inactive of [enGame, {...game, system: {id: 'other'}}]) {
  const card = tooltip(id, source);
  assert.deepEqual(applyStateEffectTooltipTranslations(card, {game: inactive}), {active: false, matched: 0, translated: 0});
  assert.equal(card.ruleP.textContent, source.rule);
}
const unavailable = {...game, i18n: {...game.i18n, localize: key => key}};
assert.equal(applyStateEffectTooltipTranslations(tooltip(id, source), {game: unavailable}).matched, 0);
assert.equal(applyStateEffectTooltipTranslations(null, {game}).translated, 0);

const observers = [];
class Observer {
  constructor(callback) {this.callback = callback; observers.push(this);}
  observe(target, options) {this.target = target; this.options = options;}
  disconnect() {this.disconnected = true;}
}
const root = new Element('aside', {id: 'tooltip'});
let currentGame = game;
const registration = observeStateEffectTooltips({tooltip: root, game: () => currentGame, MutationObserver: Observer});
assert.equal(observeStateEffectTooltips({tooltip: root, MutationObserver: Observer}), registration);
assert.equal(observers.length, 1);
assert.equal(observers[0].target, root);
assert.deepEqual(observers[0].options, {childList: true, characterData: true, subtree: true});
root.childNodes = [tooltip(id, source)];
observers[0].callback([{type: 'childList', target: root}]);
assert.equal(root.childNodes[0].title.textContent, locale[`FALLOUTMAW.DH2E.States.${id}.Name`]);
assert.equal(registration.refresh().translated, 0);
root.childNodes = [tooltip(id, source)];
currentGame = enGame;
observers[0].callback([{type: 'childList', target: root}]);
assert.equal(root.childNodes[0].title.textContent, source.name);
currentGame = game;
assert.equal(registration.refresh().translated, 3);
registration.dispose(); registration.dispose();
assert.equal(observers[0].disconnected, true);
root.childNodes = [tooltip(id, source)];
assert.equal(registration.refresh().translated, 0);
assert.equal(root.childNodes[0].title.textContent, source.name);
const renewed = observeStateEffectTooltips({tooltip: root, game, MutationObserver: Observer});
assert.notEqual(renewed, registration);
assert.equal(root.childNodes[0].title.textContent, locale[`FALLOUTMAW.DH2E.States.${id}.Name`]);
renewed.dispose();
assert.equal(observeStateEffectTooltips({tooltip: null, MutationObserver: Observer}), null);
assert.equal(observeStateEffectTooltips({tooltip: root, MutationObserver: null}), null);
console.log('v1.1.0 state effect tooltips: 39 exact stock rules, untouched custom content, text nodes and observer lifecycle: PASS');
