/**
 * v0.11.0 — display-only translation of the hardcoded breakdown produced by
 * src/rolls/dh2e-test-breakdown.mjs (system 0.1.10).
 *
 * The system puts its HTML-escaped `Label: +12<br>...` inside a data-tooltip on
 * skill-check chat cards. These labels never pass through game.i18n. Only the
 * source-owned tooltip is changed; ChatMessage data, roll totals, identifiers,
 * actor names, user text and any actions are left untouched.
 */
import runtimeDictionary from './runtime-literals.mjs';

export const BREAKDOWN_SYSTEM_ID = 'dark-heresy-2e-apex';
export const BREAKDOWN_MODULE_ID = 'dark-heresy-2e-apex-ru';

const SOURCE_LABELS = Object.freeze({
  'Characteristic': 'Характеристика',
  'Untrained': 'Неизученный',
  'Known': 'Знакомый',
  'Trained': 'Обученный',
  'Experienced': 'Опытный',
  'Veteran': 'Ветеран',
  'Other skill adjustments / limits': 'Прочие поправки навыка / ограничения',
  'Skill value': 'Значение навыка',
  'Situational modifiers / talents': 'Ситуационные модификаторы / таланты',
  'Traits, drug penalties / encumbrance': 'Черты, штрафы препаратов / перегрузка',
  'Test modifier / Fate': 'Модификатор проверки / Судьба',
  'Assistance': 'Помощь',
  'Attack modifiers': 'Модификаторы атаки',
  'Social disposition': 'Отношение собеседника',
  'Item rules': 'Правила предметов',
  'Modifier limit / other adjustments': 'Предел модификаторов / прочие поправки',
  'Total test modifier': 'Общий модификатор проверки',
  'Target': 'Целевое значение'
});
// Extra fixed rows emitted by src/rolls/skill-check.mjs 0.1.10. These
// are scoped to the source-owned numeric breakdown, not arbitrary chat text.
const EXTRA_TEST_ROW_NAMES = Object.freeze([
  'Haywire Field','Baneful Presence','Gas leak','Soulless Aura',
  'Short range','Point Blank range','Standard range','Long range','Extreme range',
  'Unaware / Surprised target','Aim (Half Action)','Aim (Full Action)',
  'Weapon qualities','Craftsmanship','Ammunition / modifications',
  'Weapon class (unbraced / one-handed)','Two-weapon fighting',
  'Talent attack','No Weapon Training','Attack modifiers','Assistance',
  'Social disposition','Item rules','Devastating Assault',
  'Advancement bonus','Percentage adjustment','Counter Attack',
  'Unarmed against an armed foe','Vehicles','Damaged weapon',
  'Target size','Blind','Talents (Marksman, Precision Killer…)',
  'Skill bonus / effects','Equipment / ability bonus',
  'Range','Ganging up','Shooting into melee','Darkness / shadow',
  "Target's Hard Target",'Guarded Action','Pinned','Attacking while Prone',
  'Target is Running','Target in Defensive Stance','Target is Prone',
  'Target is Stunned','Target in a Grapple','Higher ground',
  'Target at Low Altitude','Weather / fog / terrain',
  'Standard Attack','Called Shot','Semi-Auto Burst','Full Auto Burst',
  'Swift Attack','Lightning Attack','All Out Attack','Charge','Manoeuvre',
  'Double Tap','Invisibility',
  'Foreboding','Prescience','Forewarning','Bionic arm (Poor): fine dexterity, Agility halved',
  'Bionic lungs (Poor)','Synthmuscle (Best)'
]);
const DIRECT_ROWS = /^([^<>:\r\n]{1,100}): ([+\-−]?\d+)$/u;
const LINE_BREAK = /(<br\s*\/?\s*>)/i;
const HOOKS = new WeakMap();
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj ?? {}, key);

/** Generate source-English-to-Russian characteristic labels from the audited sheet dictionary. */
export function breakdownLabels(dictionary) {
  const labels = {...SOURCE_LABELS};
  for (const en of EXTRA_TEST_ROW_NAMES) {
    const ru = runtimeDictionary?.labels?.[en];
    if (typeof ru === 'string') labels[en] = ru;
  }
  for (const entry of Object.values(dictionary?.characteristicNames ?? {})) {
    if (typeof entry?.en === 'string' && typeof entry?.ru === 'string') labels[entry.en] = entry.ru;
  }
  // These are source-side skill breakdown labels that may still arrive untranslated.
  for (const entry of Object.values(dictionary?.coreSkillNames ?? {})) {
    if (typeof entry?.en === 'string' && typeof entry?.ru === 'string') labels[entry.en] = entry.ru;
  }
  return labels;
}

/**
 * Translate only documented fixed rows, keeping all numeric values and the
 * original <br> separators intact. Unknown custom rows are not touched.
 */
export function translateDh2eTestBreakdown(value, dictionary) {
  if (typeof value !== 'string' || !value.includes(': ')) return value;
  const labels = breakdownLabels(dictionary);
  const pieces = value.split(LINE_BREAK);
  // Fail closed for arbitrary text: require the stock system row signature.
  const known = pieces.filter((piece, i) => i % 2 === 0 &&
    (piece.match(DIRECT_ROWS) && own(labels, piece.match(DIRECT_ROWS)[1]))).length;
  if (known < 2) return value;
  return pieces.map((piece, index) => {
    if (index % 2 !== 0) return piece;
    const match = piece.match(DIRECT_ROWS);
    if (!match || !own(labels, match[1])) return piece;
    return `${labels[match[1]]}: ${match[2]}`;
  }).join('');
}

export function translateDh2eChatBreakdown(message, html, {
  dictionary,
  game = globalThis.game
} = {}) {
  const result = {active: false, translated: 0};
  if (game?.system?.id !== BREAKDOWN_SYSTEM_ID || game?.i18n?.lang !== 'ru') return result;
  // The system sets this flag on its own single-target test messages only.
  if (!message || typeof message.getFlag !== 'function' || !message.getFlag(BREAKDOWN_SYSTEM_ID, 'skillCheck')) return result;
  const root = html?.nodeType ? html : (html?.[0] ?? html);
  if (!root || typeof root.querySelectorAll !== 'function') return result;
  result.active = true;
  const nodes = root.querySelectorAll('.dark-heresy-2e-apex-chat-card.dh2e-card .dh2e-facts b[data-tooltip]');
  for (const node of nodes) {
    const old = node?.getAttribute?.('data-tooltip');
    if (!old || /<\/?(?:script|style|input|textarea|div|span)\b/i.test(old)) continue;
    const next = translateDh2eTestBreakdown(old, dictionary);
    if (next !== old) { node.setAttribute('data-tooltip', next); result.translated++; }
  }
  return result;
}

/** Foundry v14 provides renderChatMessageHTML as a synchronous DOM hook. */
export function registerChatBreakdownUiAdapter({dictionary, Hooks = globalThis.Hooks, game = () => globalThis.game} = {}) {
  if (!dictionary?.characteristicNames || typeof Hooks?.on !== 'function' || typeof Hooks?.off !== 'function') {
    throw new Error(`${BREAKDOWN_MODULE_ID}: invalid chat adapter registration`);
  }
  if (HOOKS.has(Hooks)) return HOOKS.get(Hooks);
  const currentGame = () => typeof game === 'function' ? game() : game;
  let warned = false;
  const hookId = Hooks.on('renderChatMessageHTML', (message, html) => {
    try { translateDh2eChatBreakdown(message, html, {dictionary, game: currentGame()}); }
    catch (error) {
      if (!warned) console.warn(`${BREAKDOWN_MODULE_ID}: skipped skill-check tooltip translation`, error);
      warned = true;
    }
  });
  let disposed = false;
  const registration = Object.freeze({
    hookId,
    dispose() {
      if (disposed) return;
      disposed = true;
      Hooks.off('renderChatMessageHTML', hookId);
      if (HOOKS.get(Hooks) === registration) HOOKS.delete(Hooks);
    }
  });
  HOOKS.set(Hooks, registration);
  return registration;
}
