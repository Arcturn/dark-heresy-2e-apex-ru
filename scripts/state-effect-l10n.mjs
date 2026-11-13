/** Source-exact view and creation translation for Apex stock state effects. */
import {observeStateEffectTooltips} from './state-effect-tooltip-l10n.mjs';
const SYSTEM = "dark-heresy-2e-apex";
const PATCHED = Symbol.for("dark-heresy-2e-apex-ru.stateEffectView.v110");
const REGISTRATIONS = new WeakMap();
export const stateEffectSources = Object.freeze({
  "dh2e-aim-half": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/marked.svg",
    "page": 218,
    "name": "Aim (Half)",
    "rule": "+10 to the next attack's WS or BS test. Lost if anything but an attack comes next or a Reaction is used."
  },
  "dh2e-aim-full": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/marked.svg",
    "page": 218,
    "name": "Aim (Full)",
    "rule": "+20 to the next attack's WS or BS test. Lost if anything but an attack comes next or a Reaction is used."
  },
  "dh2e-guarded": {
    "img": "systems/dark-heresy-2e-apex/icons/item-icons/shield.svg",
    "page": 222,
    "name": "Guarded Action",
    "rule": "−10 to WS and BS tests this turn; +10 to all Evasion tests until the start of the next turn."
  },
  "dh2e-defensive-stance": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/shieldUp.svg",
    "page": 220,
    "name": "Defensive Stance",
    "rule": "One extra Reaction, Evasion only; opponents suffer −20 to WS tests against this character until the start of his next turn."
  },
  "dh2e-running": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/running.svg",
    "page": 223,
    "name": "Running",
    "rule": "Until the start of the next turn: ranged attacks against this character suffer −20 BS, melee attacks gain +20 WS."
  },
  "dh2e-charging": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/challenged.svg",
    "page": 220,
    "name": "Charging",
    "rule": "Charge declared: the next melee attack is a Routine (+20) WS test. Counts as charging until the start of the next turn."
  },
  "dh2e-all-out-attack": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/exposedStance.svg",
    "page": 218,
    "name": "All Out Attack",
    "rule": "The next melee attack is an Easy (+30) WS test; no Evasion reactions until the start of the next turn. Cannot be combined with Aim."
  },
  "dh2e-swift-attack": {
    "img": "systems/dark-heresy-2e-apex/icons/item-icons/weapon-melee.svg",
    "page": 225,
    "name": "Swift Attack",
    "rule": "The next melee attack: +0 WS, one extra hit per two extra degrees of success (up to WS bonus)."
  },
  "dh2e-lightning-attack": {
    "img": "systems/dark-heresy-2e-apex/icons/item-icons/weapon-knife.svg",
    "page": 222,
    "name": "Lightning Attack",
    "rule": "The next melee attack: −10 WS, one hit per degree of success (up to WS bonus)."
  },
  "dh2e-full-auto": {
    "img": "systems/dark-heresy-2e-apex/icons/item-icons/weapon-heavy.svg",
    "page": 221,
    "name": "Full Auto",
    "rule": "The next burst: −10 BS, one hit per degree of success (up to the full-auto RoF); jams on 94+."
  },
  "dh2e-braced": {
    "img": "systems/dark-heresy-2e-apex/icons/item-icons/weapon-stationary.svg",
    "page": 219,
    "name": "Braced",
    "rule": "The heavy weapon is braced: no −30 penalty for firing it unbraced. Lost when the weapon is moved."
  },
  "dh2e-disengaged": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/disengaging.svg",
    "page": 220,
    "name": "Disengaged",
    "rule": "Broke off from melee: opponents get no free attack for this movement."
  },
  "dh2e-overwatch": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/marked.svg",
    "page": 223,
    "name": "Overwatch",
    "rule": "Watching a 45° kill zone: may fire at a foe entering it before the next turn; ends with any action or Reaction."
  },
  "dh2e-delayed": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/stasis.svg",
    "page": 220,
    "name": "Delayed",
    "rule": "One Half Action may be taken before the start of the next turn."
  },
  "dh2e-feint": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/dazed.svg",
    "page": 220,
    "name": "Feint",
    "rule": "The next melee Standard Attack against the feinted target this turn cannot be Evaded."
  },
  "dh2e-free-attack": {
    "img": "systems/dark-heresy-2e-apex/icons/item-icons/weapon-melee.svg",
    "page": 125,
    "name": "Free attack",
    "rule": "An attack granted by a talent: costs no action and carries its own modifier."
  },
  "dh2e-eye-of-vengeance": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/marked.svg",
    "page": 127,
    "name": "Eye of Vengeance",
    "rule": "The next attack adds its degrees of success to damage and penetration."
  },
  "dh2e-killing-strike": {
    "img": "systems/dark-heresy-2e-apex/icons/item-icons/weapon-axe.svg",
    "page": 129,
    "name": "Killing Strike",
    "rule": "Melee attacks this turn cannot be Evaded."
  },
  "dh2e-pinned": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/pinned.svg",
    "page": 230,
    "name": "Pinned",
    "rule": "One Half Action each turn, −20 to BS tests; must stay in or reach cover. Willpower test at the end of the turn to escape (+30 if not shot at since the last turn); engaged in melee escapes at once."
  },
  "dh2e-surprised": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/surprised.svg",
    "page": 216,
    "name": "Surprised",
    "rule": "Loses this first-round turn and cannot use Reactions; attacks against this character gain +30."
  },
  "dh2e-sustaining": {
    "img": "systems/dark-heresy-2e-apex/icons/item-icons/psychicpower.svg",
    "page": 198,
    "name": "Sustaining",
    "rule": "Sustaining psychic powers: the listed action each turn. With two or more, each power's effective psy rating drops by their number and Psychic Phenomena gain +10 per power after the first (p. 198). Delete to drop them."
  },
  "dh2e-suffocating": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/suffocating.svg",
    "page": 243,
    "name": "Suffocating",
    "rule": "Holding breath: a Toughness test each round or a level of Fatigue; Unconscious when the air runs out."
  },
  "dh2e-prone": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/prone.svg",
    "page": 230,
    "name": "Prone",
    "rule": "Lying on the ground. WS tests to hit gain +10, BS tests −10 (except at Point Blank). Suffers −10 to WS tests and −20 to Evasion. Standing up is a Half Action."
  },
  "dh2e-fatigued": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/fatigued.svg",
    "page": 233,
    "name": "Fatigued",
    "rule": "Levels of Fatigue: each characteristic whose bonus is lower than the Fatigue level counts as half in combat. Above the threshold (TB + WPB) the character passes out; above double it he dies."
  },
  "dh2e-frenzied": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/inRage.svg",
    "page": 128,
    "name": "Frenzied",
    "rule": "+10 WS and Strength, −20 BS, Intelligence and Fellowship; immune to Fear, Pinning, Stunning and Fatigue; must attack the nearest foe; cannot Parry, retreat or flee, nor use psychic powers."
  },
  "dh2e-encumbered": {
    "img": "systems/dark-heresy-2e-apex/icons/item-icons/cargo.svg",
    "page": 249,
    "name": "Encumbered",
    "rule": "Carrying more than the Carrying Weight: −10 to Agility tests; a Toughness test after TB hours or a level of Fatigue."
  },
  "dh2e-lost-arm": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/lostArms.svg",
    "page": 242,
    "name": "Lost Arm",
    "rule": "−20 to tests needing two hands; cannot wield two-handed weapons nor strap a shield to that arm."
  },
  "dh2e-lost-leg": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/lostLegs.svg",
    "page": 243,
    "name": "Lost Leg",
    "rule": "Movement halved, −20 to Movement actions and mobility tests; cannot Dodge. Both legs lost: cannot walk."
  },
  "stun": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/stunned.svg",
    "page": 243,
    "name": "Stunned",
    "rule": "Cannot take actions or Reactions such as Evasion. WS and BS tests to hit a Stunned character gain +20. Not Helpless or Unaware."
  },
  "blind": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/blinded.svg",
    "page": 242,
    "name": "Blinded",
    "rule": "Automatically fails all tests based on vision and all Ballistic Skill tests; −30 to Weapon Skill tests and most other tests that ordinarily benefit from vision."
  },
  "deaf": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/deafened.svg",
    "page": 242,
    "name": "Deafened",
    "rule": "Automatically fails any skill or characteristic test that relies on hearing; cannot communicate well with others."
  },
  "burning": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/burning.svg",
    "page": 243,
    "name": "On Fire",
    "rule": "1d10 Energy damage to the Body (ignoring Armour) and 1 level of Fatigue each round. A Challenging (+0) Willpower test at the start of each turn to act normally; dropping Prone and a Hard (−20) Agility test as a Full Action puts the fire out."
  },
  "bleeding": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/bleeding.svg",
    "page": 242,
    "name": "Blood Loss",
    "rule": "1 level of Fatigue at the start of each turn. Once per round, as a Free Action, a Difficult (−10) Medicae test removes it. Does not stack."
  },
  "grappled": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/grappling.svg",
    "page": 228,
    "name": "Grappled",
    "rule": "No Reactions; only the Grapple action. Engaged in melee; other attackers gain +20 WS against grappling characters."
  },
  "helpless": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/helpless.svg",
    "page": 229,
    "name": "Helpless",
    "rule": "Weapon Skill tests to hit automatically succeed with degrees of success equal to the attacker's WS bonus; damage is rolled twice and added."
  },
  "paralysis": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/paralyzed.svg",
    "page": 233,
    "name": "Paralysed",
    "rule": "Cannot take actions; counts as Helpless."
  },
  "unconscious": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/unconscious.svg",
    "page": 243,
    "name": "Unconscious",
    "rule": "Unaware of the surroundings and takes no actions; a Helpless target. Lasts 10 minutes unless the cause says otherwise."
  },
  "dead": {
    "img": "systems/dark-heresy-2e-apex/ui/hud-icons/condition-dead.svg",
    "page": 232,
    "name": "Dead",
    "rule": "The character is slain."
  },
  "invisible": {
    "img": "systems/dark-heresy-2e-apex/icons/conditions/seesOnlyCaster.svg",
    "page": 229,
    "name": "Hidden",
    "rule": "Unseen by the enemy: attacks against an Unaware target gain +30, and he cannot Evade them."
  }
});

const enabled = game => game?.system?.id === SYSTEM && game?.i18n?.lang === 'ru';
const current = source => typeof source === 'function' ? source() : source;
function stateId(document) {
  const flag = document?.getFlag?.(SYSTEM, 'dh2eState') ?? document?.flags?.[SYSTEM]?.dh2eState;
  if (flag != null) return flag;
  // Core HUD-created effects have no system flag. Identify them only by the
  // single stock status and its exact source icon; the complete rule is checked below.
  const statuses = Array.isArray(document?.statuses) || document?.statuses instanceof Set ? [...document.statuses] : [];
  if (statuses.length !== 1) return null;
  const id = statuses[0];
  return stateEffectSources[id]?.img === document?.img ? id : null;
}
const ruleKey = id => `FALLOUTMAW.DH2E.States.${id}.Rule`;
const nameKey = id => `FALLOUTMAW.DH2E.States.${id}.Name`;
const markup = (rule, page, pageWord) => `<p>${rule}</p><p><em>Dark Heresy ${pageWord} ${page}</em></p>`;
// Exact labels written by the built-in extra-attack rules. These are display
// substitutions only; the combat flag's label and attack eligibility stay intact.
const FREE_ATTACK_LABELS = Object.freeze({
  'Multiple Arms': 'Множество рук',
  'Devastating Assault': 'Неостановимый Натиск',
  'Counter Attack': 'Контратака'
});

export function translateStateEffectName(id, value, game = globalThis.game) {
  const source = stateEffectSources[id];
  if (!enabled(game) || !source || typeof value !== 'string') return value;
  const key = nameKey(id), localized = game.i18n.localize(key);
  if (typeof localized !== 'string' || localized === key) return value;
  if (value === source.name) return localized;
  if (id !== 'dh2e-free-attack') return value;
  for (const base of [source.name, localized]) {
    const prefix = `${base}: `;
    if (!value.startsWith(prefix)) continue;
    const suffix = value.slice(prefix.length);
    const label = FREE_ATTACK_LABELS[suffix] ?? (Object.values(FREE_ATTACK_LABELS).includes(suffix) ? suffix : null);
    if (label) return `${localized}: ${label}`;
  }
  return value;
}

function matchedDescription(id, value, game) {
  const source = stateEffectSources[id];
  if (!enabled(game) || !source || typeof value !== 'string') return null;
  const rule = game.i18n.localize(ruleKey(id));
  if (typeof rule !== 'string' || rule === ruleKey(id)) return null;
  const translated = markup(rule, source.page, 'стр.');
  const accepted = [markup(source.rule, source.page, 'p.'), markup(rule, source.page, 'p.'), translated];
  return accepted.includes(value) ? translated : null;
}

/** Translate only an exact complete stock rule and its source page. */
export function translateStateEffectDescription(id, value, game = globalThis.game) {
  return matchedDescription(id, value, game) ?? value;
}

function translatedFields(source, game) {
  const id = stateId(source);
  const entry = stateEffectSources[id];
  if (!entry) return {};
  const description = matchedDescription(id, source.description, game);
  if (description === null) return {};
  const values = description === source.description ? {} : {description};
  const name = translateStateEffectName(id, source.name, game);
  if (name !== source.name) values.name = name;
  return values;
}

export function translateNewStateEffect(document, data, {game = globalThis.game} = {}) {
  if (!enabled(game) || document?.parent?.documentName !== 'Actor' || typeof document?.updateSource !== 'function') return false;
  // Earlier preCreate hooks may have updated the pending document already.
  const source = typeof document.toObject === 'function' ? document.toObject() : data;
  const updates = translatedFields(source, game);
  if (!Object.keys(updates).length) return false;
  document.updateSource(updates);
  return true;
}

/** Update the in-memory stock status catalogue after system i18nInit runs. */
export function translateStateStatusDefinitions({game = globalThis.game, CONFIG = globalThis.CONFIG} = {}) {
  if (!enabled(game) || !Array.isArray(CONFIG?.statusEffects)) return 0;
  let changed = 0;
  for (const status of CONFIG.statusEffects) {
    if (stateEffectSources[status.id]?.img !== status.img) continue;
    const next = translateStateEffectDescription(status.id, status.description, game);
    if (next === status.description) continue;
    status.description = next;
    changed++;
  }
  return changed;
}

/** View substitutions are reversed when an unchanged field is submitted. */
export function installStateEffectView(ctor, {game = () => globalThis.game} = {}) {
  const proto = ctor?.prototype;
  if (!proto || typeof proto._prepareContext !== 'function' || typeof proto._processFormData !== 'function') return false;
  if (Object.prototype.hasOwnProperty.call(proto, PATCHED)) return true;
  const prepare = proto._prepareContext;
  const process = proto._processFormData;
  const views = new WeakMap();
  proto._prepareContext = async function (...args) {
    const context = await prepare.apply(this, args);
    views.delete(this);
    const instance = current(game);
    if (!enabled(instance) || !context?.source || this.document?.parent?.documentName !== 'Actor') return context;
    const updates = translatedFields(context.source, instance);
    if (!Object.keys(updates).length) return context;
    const originals = Object.fromEntries(Object.keys(updates).map(key => [key, context.source[key]]));
    views.set(this, {originals, updates});
    return {...context, source: {...context.source, ...updates}};
  };
  proto._processFormData = function (...args) {
    const result = process.apply(this, args);
    const view = views.get(this);
    if (!view || !result || typeof result !== 'object') return result;
    // A submitted custom edit is kept. Only our untouched display value maps back.
    const restored = {};
    for (const [key, value] of Object.entries(view.updates)) {
      if (result[key] === value) restored[key] = view.originals[key];
    }
    return Object.keys(restored).length ? {...result, ...restored} : result;
  };
  Object.defineProperty(proto, PATCHED, {value: true});
  return true;
}

export function registerStateEffectTranslations({
  Hooks = globalThis.Hooks, game = () => globalThis.game, CONFIG = () => globalThis.CONFIG,
  importer = path => import(path)
} = {}) {
  if (!Hooks?.on || !Hooks?.once || !Hooks?.off) return null;
  if (REGISTRATIONS.has(Hooks)) return REGISTRATIONS.get(Hooks);
  const state = {viewInstalled: false, viewError: null};
  let disposed = false;
  let tooltipObserver = null;
  const createHook = Hooks.on('preCreateActiveEffect', (document, data) => {
    // Hook return values must not cancel creation.
    translateNewStateEffect(document, data, {game: current(game)});
  });
  const catalog = () => translateStateStatusDefinitions({game: current(game), CONFIG: current(CONFIG)});
  const i18nHook = Hooks.once('i18nInit', catalog);
  const readyHook = Hooks.once('ready', async () => {
    catalog();
    if (!enabled(current(game)) || disposed) return;
    tooltipObserver = observeStateEffectTooltips({tooltip: current(game)?.tooltip?.tooltip, game});
    try {
      const path = `systems/${SYSTEM}/src/sheets/active-effect-sheet.mjs`;
      const route = typeof globalThis.foundry?.utils?.getRoute === 'function'
        ? globalThis.foundry.utils.getRoute(path) : `/${path}`;
      const source = await importer(route);
      if (!disposed) state.viewInstalled = installStateEffectView(source.FalloutMaWActiveEffectSheet, {game});
    } catch (error) {
      state.viewError = String(error?.message ?? error);
      console.warn('dh2e-ru: state effect view translation unavailable', state.viewError);
    }
  });
  const api = Object.freeze({status: () => ({...state}), dispose() {
    if (disposed) return;
    disposed = true;
    Hooks.off('preCreateActiveEffect', createHook);
    Hooks.off('i18nInit', i18nHook);
    Hooks.off('ready', readyHook);
    tooltipObserver?.dispose();
    REGISTRATIONS.delete(Hooks);
  }});
  REGISTRATIONS.set(Hooks, api);
  return api;
}
