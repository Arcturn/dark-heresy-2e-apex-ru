/** Display-only labels for the defence strips appended by the system's chat hooks. */
import ui from './ui-literals.mjs';
import progression from './progression-data.mjs';

const SYSTEM = 'dark-heresy-2e-apex';
const REGISTRATIONS = new WeakMap();
const CHOICES = Object.freeze({
  dodge: ui.coreSkillNames.dodge,
  parry: ui.coreSkillNames.parry,
  willpowerTest: ui.coreSkillNames.willpowerTest,
  foreboding: progression.psychicPowers.foreboding,
  none: {en: 'Take', ru: 'Принять попадание'},
  resist: {en: 'Resist', ru: 'Сопротивляться'},
  yield: {en: 'Yield', ru: 'Не сопротивляться'}
});
const active = game => game?.system?.id === SYSTEM && game?.i18n?.lang === 'ru';
const own = (object, key) => Object.prototype.hasOwnProperty.call(object ?? {}, key);
const rootOf = html => html?.nodeType ? html : html?.[0] ?? html;
const roots = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];

/** Exact choice names with an optional displayed percentage; no numeric conversion. */
export function translateDefenceChoiceLabel(choice, text) {
  const entry = own(CHOICES, choice) ? CHOICES[choice] : null;
  if (!entry || typeof text !== 'string') return text;
  const core = text.trim();
  if (!core.startsWith(entry.en)) return text;
  const suffix = core.slice(entry.en.length);
  if (suffix && !/^ \d+(?:\.\d+)?%$/u.test(suffix)) return text;
  const position = text.indexOf(core);
  return text.slice(0, position) + entry.ru + suffix + text.slice(position + core.length);
}

function entriesFor(message, flag) {
  const value = message?.getFlag?.(SYSTEM, flag) ?? message?.flags?.[SYSTEM]?.[flag];
  return Array.isArray(value?.entries) ? value.entries : [];
}
function changeText(element, before, after) {
  if (before === after || !element || element.children?.length) return 0;
  let count = 0;
  for (const node of element.childNodes ?? []) {
    if (node.nodeType !== 3 || node.nodeValue.trim() !== before) continue;
    const position = node.nodeValue.indexOf(before);
    node.nodeValue = node.nodeValue.slice(0, position) + after + node.nodeValue.slice(position + before.length);
    count++;
  }
  return count;
}
function stockUiLabel(game, namespace, key, fallback) {
  const id = `FALLOUTMAW.DH2E.${namespace}.${key}`;
  const value = game?.i18n?.localize?.(id);
  return typeof value === 'string' && value !== id ? value : fallback;
}

function translateStrip(strip, entries, response, game) {
  const attribute = response ? 'data-dh2e-response' : 'data-dh2e-defence';
  const byId = new Map(entries.map(entry => [String(entry.id), entry]));
  let changed = 0;
  for (const button of strip.querySelectorAll(`.dh2e-act[data-entry-row] > button.dh2e-act-btn[${attribute}][data-entry]`)) {
    const id = button.getAttribute('data-entry');
    const entry = byId.get(id);
    if (!entry || entry.result || button.parentElement.getAttribute('data-entry-row') !== id) continue;
    const choice = button.getAttribute(attribute);
    const before = button.textContent.trim();
    let after = before;
    if (['dodge', 'parry', 'willpowerTest', 'foreboding'].includes(choice)) {
      if (response && !['stun', 'grapple'].includes(entry.kind)) continue;
      const option = entry.defence?.options?.find(row => row.key === choice);
      // Bind the visible text to this exact saved choice, including its number.
      if (!option || before !== `${option.label} ${option.target}%`) continue;
      after = translateDefenceChoiceLabel(choice, before);
    } else if (choice === 'none' && before === 'Take') {
      if (response && !['stun', 'grapple'].includes(entry.kind)) continue;
      after = stockUiLabel(game, response ? 'Response' : 'Defence', 'Take', response ? 'Принять' : 'Принять попадание');
    } else if (response && !['stun', 'grapple'].includes(entry.kind) && ['resist', 'yield'].includes(choice)) {
      after = translateDefenceChoiceLabel(choice, before);
    }
    changed += changeText(button, before, after);
  }
  // Dodge, Parry and Willpower results use i18n already. Foreboding's result
  // name is the source's remaining literal; reconstruct the whole known label.
  if (!response) for (const row of strip.querySelectorAll('.dh2e-resolved[data-entry-result]')) {
    const entry = byId.get(row.getAttribute('data-entry-result'));
    if (entry?.result?.choice !== 'foreboding') continue;
    const result = entry.result;
    if (result.pending || result.cancelled || result.voided) continue;
    const who = entries.length > 1 ? `${entry.name} · ` : '';
    const test = result.test ? ` ${result.test.roll} / ${result.test.target}` : '';
    const before = `${who}Foreboding${test}`;
    const after = `${who}${CHOICES.foreboding.ru}${test}`;
    // Only the source's choice line is a system label. A later trauma or an
    // earlier actor-name line can contain exactly the same words.
    const index = Number(Boolean(result.why)) + Number(Boolean(result.blastNote));
    const line = row.querySelectorAll(':scope > .dh2e-line')[index];
    changed += changeText(line?.querySelector(':scope > span:first-child'), before, after);
  }
  return changed;
}

export function applyDefenceChatTranslations(message, html, {game = globalThis.game} = {}) {
  const result = {active: false, translated: 0};
  const root = rootOf(html);
  if (!active(game) || !root?.querySelectorAll) return result;
  for (const [flag, selector, response] of [
    ['dh2eDefence', '.dh2e-defence-strip:not(.dh2e-response-strip)', false],
    ['dh2eResponses', '.dh2e-defence-strip.dh2e-response-strip', true]
  ]) {
    const entries = entriesFor(message, flag);
    if (!entries.length) continue;
    result.active = true;
    for (const strip of roots(root, selector)) result.translated += translateStrip(strip, entries, response, game);
  }
  return result;
}

export function registerDefenceChatUiAdapter({Hooks = globalThis.Hooks, game = () => globalThis.game} = {}) {
  if (!Hooks?.on || !Hooks?.off) return null;
  if (REGISTRATIONS.has(Hooks)) return REGISTRATIONS.get(Hooks);
  let disposed = false, warned = false;
  const apply = (message, html) => {
    if (disposed) return;
    try {applyDefenceChatTranslations(message, html, {game: typeof game === 'function' ? game() : game});}
    catch (error) {
      if (!warned) console.warn('dh2e-ru: defence card translation unavailable', error);
      warned = true;
    }
  };
  const hook = Hooks.on('renderChatMessageHTML', (message, html) => {
    apply(message, html);
    // System hooks append/replace these strips during the same synchronous
    // render event. Translate after those hooks even when ours ran first.
    queueMicrotask(() => apply(message, html));
  });
  const api = Object.freeze({dispose() {
    if (disposed) return;
    disposed = true;
    Hooks.off('renderChatMessageHTML', hook);
    REGISTRATIONS.delete(Hooks);
  }});
  REGISTRATIONS.set(Hooks, api);
  return api;
}
