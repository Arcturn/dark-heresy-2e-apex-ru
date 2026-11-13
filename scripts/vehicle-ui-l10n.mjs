/** Display translations for stock Apex 0.1.12 vehicle views. */
import runtime from './runtime-literals.mjs';
import ui from './ui-literals.mjs';
import profileData from './vehicle-profile-data.mjs';
import {registerVehicleProfileTranslations} from './vehicle-profile-l10n.mjs';
import {applyVehicleOwnedViewLabels, installVehicleOwnedItemView} from './vehicle-owned-view-l10n.mjs';
const SYSTEM = 'dark-heresy-2e-apex';
const REGISTRATIONS = new WeakMap();
export const vehicleTraitSources = Object.freeze({
  "amphibious": {
    "en": "Amphibious",
    "summary": "Treats bodies of water as open ground.",
    "page": 187,
    "summaryRu": "Считает водоёмы открытой местностью."
  },
  "bike": {
    "en": "Bike",
    "summary": "Counts as Open-Topped; melee attackers may pick rider or vehicle without a Called Shot; cannot Ram!.",
    "page": 187,
    "summaryRu": "Считается транспортом с открытым верхом. В ближнем бою атакующий может выбрать водителя или машину без прицельной атаки. Таран недоступен."
  },
  "bred-for-war": {
    "en": "Bred for War",
    "summary": "Living mount automatically passes Willpower tests to avoid fleeing from the Bestial trait.",
    "page": 187,
    "summaryRu": "Живой скакун автоматически проходит проверки Силы воли против бегства из-за черты «Звериный»."
  },
  "daemonic-possession": {
    "en": "Daemonic Possession",
    "summary": "Needs no crew; uses its own characteristics, fires all weapons in one attack action, ignores crew Critical effects.",
    "page": 187,
    "summaryRu": "Экипаж не требуется. Использует собственные характеристики, стреляет из всего оружия за одно действие атаки и игнорирует критические эффекты, затрагивающие экипаж."
  },
  "damage-control": {
    "en": "Damage Control",
    "summary": "May re-roll the 1d5 of a Righteous Fury Critical; putting out a fire is a Free Action.",
    "page": 188,
    "summaryRu": "Позволяет перебросить 1d5 критического эффекта Праведного гнева. Тушение пожара занимает свободное действие."
  },
  "immobile": {
    "en": "Immobile",
    "summary": "Cannot move under its own power, Manoeuvrability +0, cannot Jink.",
    "page": 188,
    "summaryRu": "Не может двигаться своим ходом. Манёвренность +0. Уклонение транспортом недоступно."
  },
  "enclosed": {
    "en": "Enclosed",
    "summary": "Crew and passengers cannot use personal weapons or be targeted from outside.",
    "page": 188,
    "summaryRu": "Экипаж и пассажиры не могут применять личное оружие, и их нельзя выбрать целью снаружи."
  },
  "enhanced-motive-systems": {
    "en": "Enhanced Motive Systems",
    "summary": "Twice Tactical Speed as a Half Action, three times as a Full Action; Floor It! triples speed at Ordinary (+10).",
    "page": 188,
    "summaryRu": "За полудействие проходит удвоенную тактическую скорость, за полное действие — утроенную. Действие «Полный газ!» утраивает скорость при заурядной (+10) проверке."
  },
  "environmentally-sealed": {
    "en": "Environmentally Sealed",
    "summary": "Own life support; no personal weapons fired without breaching the seals.",
    "page": 188,
    "summaryRu": "Имеет собственную систему жизнеобеспечения. Стрельба из личного оружия требует нарушения герметичности."
  },
  "extremely-volatile": {
    "en": "Extremely Volatile",
    "summary": "Doubles the chance of exploding when on fire; its explosion sets those caught alight on a failed Difficult (-10) Agility test.",
    "page": 188,
    "summaryRu": "Удваивает вероятность взрыва при пожаре. Попавшие под взрыв загораются при провале сложной (−10) проверки Ловкости."
  },
  "living": {
    "en": "Living",
    "summary": "A steed: has characteristics, riding uses Survival instead of Operate, heals like a creature.",
    "page": 188,
    "summaryRu": "Скакун имеет характеристики. Для езды используется Выживание вместо Управления. Восстанавливает раны как живое существо."
  },
  "open-topped": {
    "en": "Open-Topped",
    "summary": "Crew may fire personal weapons and can be targeted with a Called Shot; passengers are struck by Blast and Spray.",
    "page": 188,
    "summaryRu": "Экипаж может стрелять из личного оружия и становится доступен для прицельной атаки. Пассажиров поражает оружие со свойствами «Взрыв» и «Распыление»."
  },
  "ramshackle": {
    "en": "Ramshackle",
    "summary": "Righteous Fury rolls 1d10, double damage to itself when ramming, repairs take half time at +20.",
    "page": 189,
    "summaryRu": "Праведный гнев бросает 1d10. Удваивает урон себе при таране. Ремонт занимает половину времени и получает +20."
  },
  "reinforced-armour": {
    "en": "Reinforced Armour",
    "summary": "Critical damage it receives is halved (rounding up), except Righteous Fury.",
    "page": 189,
    "summaryRu": "Получаемый критический урон уменьшается вдвое с округлением вверх, кроме урона Праведного гнева."
  },
  "rugged": {
    "en": "Rugged",
    "summary": "All Repair tests gain +20.",
    "page": 189,
    "summaryRu": "Все проверки ремонта получают +20."
  },
  "skimmer": {
    "en": "Skimmer",
    "summary": "Hovers, ignores difficult terrain, +10 Manoeuvrability, Crashes instead of going Out of Control, melee attacks against it -10.",
    "page": 189,
    "summaryRu": "Парит и игнорирует труднопроходимую местность. Получает +10 к манёвренности. Вместо потери управления терпит крушение. Атаки ближнего боя по нему получают −10."
  },
  "tracked": {
    "en": "Tracked",
    "summary": "-10 Manoeuvrability, +10 in difficult terrain, Motive slowing halved, Motive repairs take twice as long.",
    "page": 189,
    "summaryRu": "Манёвренность −10, в труднопроходимой местности +10. Замедление от повреждений ходовой части уменьшается вдвое. Её ремонт занимает вдвое больше времени."
  },
  "walker": {
    "en": "Walker",
    "summary": "Ignores most difficult terrain, cannot Ram! (Charges with a melee weapon), turns to face melee foes freely, Falls Over instead of going Out of Control.",
    "page": 189,
    "summaryRu": "Игнорирует большинство видов труднопроходимой местности. Вместо тарана совершает натиск оружием ближнего боя. Свободно поворачивается к противникам в ближнем бою. Вместо потери управления падает."
  },
  "wheeled": {
    "en": "Wheeled",
    "summary": "-20 in difficult terrain, +10 Manoeuvrability; after any Motive Critical every move needs Operate at -10; Motive repairs take half as long.",
    "page": 189,
    "summaryRu": "В труднопроходимой местности получает −20, к манёвренности +10. После любого критического повреждения ходовой части каждое перемещение требует проверки Управления с −10. Ремонт ходовой части занимает половину времени."
  }
});
export const vehicleProfileSources = Object.freeze(profileData.displayProfiles);
const REPAIR_LOCATIONS = Object.freeze({
  "0": "Required tools and supplies; calm weather or away from enemy fire.",
  "10": "Area free from enemy fire; field encampment with basic supplies; hive world of standard prowess.",
  "20": "Field base with ample supplies; hive world of superior manufacturing prowess.",
  "30": "Revered and ancient forge world; well-stocked repair facility.",
  "-10": "Rudimentary or faulty tools; close to battlefields; run-down forge world; open without facilities; inclement weather.",
  "-20": "Ruined forge world; storms, blizzards or sandstorms; insect swarms; under bombardment; primitive locale.",
  "-30": "Blistering desert or ice sheet; dense jungle; poorly-supplied field base; ongoing battle; orbital bombardment; cult-dominated region."
});

const LAST_REPAIR_LOCATION = 'Раскалённая пустыня или ледяной покров; густые джунгли; плохо снабжаемая полевая база; продолжающееся сражение; орбитальная бомбардировка; район под властью культа.';
const PROFILE_WEAPONS = Object.freeze({
  'Dagger Teeth': 'Зубы-кинжалы', 'Autogun': 'Автоган', 'Multilaser': 'Мультилазер',
  'Heavy Bolter': 'Тяжелый болтер', 'Heavy Flamer': 'Тяжелый огнемет',
  'Autocannon': 'Автопушка', 'Storm Bolter': 'Шторм-болтер', 'Heavy Stubber': 'Тяжелый стаббер'
});
const enabled = game => game?.system?.id === SYSTEM && game?.i18n?.lang === 'ru';
const nodeRoot = element => element?.nodeType ? element : element?.[0] ?? element;
const traitName = source => runtime.labels[source.en] ?? source.en;
const skills = new Map([['BS', ui.characteristicAbbreviations.BS]]);
for (const entry of Object.values(ui.coreSkillNames)) skills.set(entry.en, entry.ru);
for (const entry of Object.values(ui.specialistSkillNames)) {
  const group = ui.specialistGroups[entry.group];
  if (group) skills.set(`${group.en} (${entry.en})`, `${group.ru} (${entry.ru})`);
}

function translateTrait(row) {
  const stock = vehicleTraitSources[row?.key];
  if (!stock) return row;
  const translated = {...row};
  if (row.name === stock.en) translated.name = traitName(stock);
  if (row.label === stock.en) translated.label = traitName(stock);
  if (row.summary === `${stock.summary} (p. ${stock.page})`)
    translated.summary = `${stock.summaryRu} (стр. ${stock.page})`;
  return translated;
}

/** Receives context.dh2eVehicle, with canonical keys and custom values retained. */
export function localizeVehicleContext(vehicle) {
  if (!vehicle || typeof vehicle !== 'object') return vehicle;
  const out = {...vehicle};
  if (Array.isArray(vehicle.traits)) out.traits = vehicle.traits.map(translateTrait);
  if (Array.isArray(vehicle.traitChoices)) out.traitChoices = vehicle.traitChoices.map(translateTrait);
  if (Array.isArray(vehicle.crew)) out.crew = vehicle.crew.map(row => row.skill ? {
    ...row, skill: {...row.skill, label: skills.get(row.skill.label) ?? row.skill.label}
  } : row);
  const profile = Object.values(vehicleProfileSources).find(row => row.notes === vehicle.notes);
  if (profile) out.notes = profile.notesRu;
  return out;
}

export function translateVehicleProfileOption(key, text) {
  const row = vehicleProfileSources[key];
  return row && text === `${row.en} (p. ${row.page})` ? `${row.ru} (стр. ${row.page})` : text;
}

function profileDialog(app, root) {
  if (app?.constructor?.name !== 'DialogV2' || !root.querySelector('input[name="rename"][type="checkbox"]')) return null;
  const select = root.querySelector('select[name="key"]');
  if (!select?.options || select.options.length !== Object.keys(vehicleProfileSources).length) return null;
  const keys = Object.keys(vehicleProfileSources);
  const options = Array.from(select.options);
  if (options.some((option, index) => {
    const key = option.getAttribute('value');
    const row = vehicleProfileSources[key];
    if (key !== keys[index] || !row) return true;
    const original = `${row.en} (p. ${row.page})`;
    return option.textContent !== original && option.textContent !== translateVehicleProfileOption(key, original);
  })) return null;
  return options;
}

export function translateVehicleRepairOption(value, text) {
  const source = REPAIR_LOCATIONS[String(value)];
  if (!source || typeof text !== 'string') return text;
  const prefix = `${Number(value) >= 0 ? '+' : ''}${value}: `;
  if (text !== prefix + source) return text;
  const ru = runtime.labels[source] ?? (Number(value) === -30 ? LAST_REPAIR_LOCATION : null);
  return ru ? prefix + ru : text;
}

function repairDialog(app, root) {
  if (app?.constructor?.name !== 'DialogV2') return null;
  const condition = root.querySelector('select[name="condition"]');
  const location = root.querySelector('select[name="location"]');
  const mode = root.querySelector('select[name="mode"]');
  if (!condition?.options?.length || !location?.options || !mode?.options) return null;
  const modes = Array.from(mode.options, option => option.getAttribute('value'));
  if (modes.join(',') !== 'normal,rush,careful') return null;
  const options = Array.from(location.options);
  if (options.length !== 7) return null;
  const expected = ['30', '20', '10', '0', '-10', '-20', '-30'];
  if (options.some((option, index) => option.getAttribute('value') !== expected[index])) return null;
  // Require every source label or its own translated result, including rerenders.
  if (options.some(option => {
    const value = option.getAttribute('value');
    const source = `${Number(value) >= 0 ? '+' : ''}${value}: ${REPAIR_LOCATIONS[value]}`;
    return option.textContent !== source && option.textContent !== translateVehicleRepairOption(value, source);
  })) return null;
  return options;
}

function updateText(element, translator) {
  let changes = 0;
  for (const node of element?.childNodes ?? []) {
    if (node.nodeType !== 3) continue;
    const before = node.nodeValue;
    const after = translator(before);
    if (after === before) continue;
    node.nodeValue = after;
    changes++;
  }
  return changes;
}

/** Covers the initial actor render before the context bridge has loaded. */
export function applyVehicleUiTranslations(app, html, {game = globalThis.game} = {}) {
  const stats = {active: false, translated: 0};
  if (!enabled(game)) return stats;
  const root = nodeRoot(html);
  if (!root?.querySelectorAll || !root?.querySelector) return stats;
  const options = repairDialog(app, root);
  if (options) {
    stats.active = true;
    for (const option of options) {
      const before = option.textContent;
      const after = translateVehicleRepairOption(option.getAttribute('value'), before);
      if (after !== before) { option.textContent = after; stats.translated++; }
    }
  }
  const profiles = profileDialog(app, root);
  if (profiles) {
    stats.active = true;
    for (const option of profiles) stats.translated += updateText(option, text => translateVehicleProfileOption(option.getAttribute('value'), text));
    for (const label of root.querySelectorAll('label[data-dh2e-vehicle-for]')) {
      const profile = vehicleProfileSources[label.getAttribute('data-dh2e-vehicle-for')];
      if (!profile) continue;
      stats.translated += updateText(label, text => text.startsWith(`${profile.en}: `) ? profile.ru + text.slice(profile.en.length) : text);
      for (const option of label.querySelectorAll('select option')) stats.translated += updateText(option, text => PROFILE_WEAPONS[text] ?? text);
    }
  }
  const panel = root.matches?.('.dh2e-veh') ? root : root.querySelector('.dh2e-veh');
  if (!panel) return stats;
  stats.active = true;
  for (const option of panel.querySelectorAll('[data-dh2e-vehicle-add="traits"] option[value]')) {
    const stock = vehicleTraitSources[option.getAttribute('value')];
    if (stock) stats.translated += updateText(option, value => value === stock.en ? traitName(stock) : value);
  }
  for (const chip of panel.querySelectorAll('.apex-chip[data-tooltip]')) {
    const before = chip.getAttribute('data-tooltip');
    const stock = Object.values(vehicleTraitSources).find(row => before === `${row.summary} (p. ${row.page})`);
    if (!stock) continue;
    chip.setAttribute('data-tooltip', `${stock.summaryRu} (стр. ${stock.page})`);
    stats.translated++;
    stats.translated += updateText(chip, value => value.trim() === stock.en ? value.replace(stock.en, traitName(stock)) : value);
  }
  for (const skill of panel.querySelectorAll('.dh2e-veh-crewrow > .skill')) {
    stats.translated += updateText(skill, value => {
      const name = value.trim();
      const translated = skills.get(name);
      return translated ? value.replace(name, translated) : value;
    });
  }
  for (const note of panel.querySelectorAll('p.apex-note')) stats.translated += updateText(note, text => {
    const profile = Object.values(vehicleProfileSources).find(row => row.notes === text);
    return profile?.notesRu ?? text;
  });
  return stats;
}

/** Only numeric right-hand facts in source vehicle cards carry these units. */
export function translateVehicleUnit(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/^(\s*[+−-]?\d+(?:[.,]\d+)?\s+)(m|h)(\s*)$/u,
    (_match, number, unit, trailing) => number + (unit === 'm' ? 'м' : 'ч') + trailing);
}

export function applyVehicleChatTranslations(message, html, {game = globalThis.game} = {}) {
  const stats = {active: false, translated: 0};
  if (!enabled(game) || !message) return stats;
  const root = nodeRoot(html);
  if (!root?.querySelectorAll) return stats;
  const cards = [...(root.matches?.('.dh2e-vehicle-card') ? [root] : []), ...root.querySelectorAll('.dh2e-vehicle-card')];
  stats.active = cards.length > 0;
  for (const card of cards) {
    for (const value of card.querySelectorAll('p > b')) stats.translated += updateText(value, translateVehicleUnit);
  }
  return stats;
}

export function registerVehicleUiAdapter({Hooks = globalThis.Hooks, game = () => globalThis.game, importer = path => import(path)} = {}) {
  if (!Hooks?.on || !Hooks?.off) return null;
  if (REGISTRATIONS.has(Hooks)) return REGISTRATIONS.get(Hooks);
  const current = () => typeof game === 'function' ? game() : game;
  const profileRegistration = registerVehicleProfileTranslations({Hooks, game});
  const appHook = Hooks.on('renderApplicationV2', (app, html) => {
    applyVehicleUiTranslations(app, html, {game: current()});
    applyVehicleOwnedViewLabels(app, html, {game: current()});
  });
  const chatHook = Hooks.on('renderChatMessageHTML', (message, html) => applyVehicleChatTranslations(message, html, {game: current()}));
  let disposed = false;
  const readyHook = Hooks.once?.('ready', async () => {
    if (!enabled(current()) || disposed) return;
    // Physical weapons use Dh2eGearSheet, which extends the engine item sheet
    // directly. Dh2eItemSheet is a separate class, so each needs its own bridge.
    for (const [file, name] of [['dh2e-item-sheet', 'Dh2eItemSheet'], ['dh2e-gear-sheet', 'Dh2eGearSheet']]) {
      try {
        const path = `systems/${SYSTEM}/src/sheets/${file}.mjs`;
        const route = typeof globalThis.foundry?.utils?.getRoute === 'function'
          ? globalThis.foundry.utils.getRoute(path) : `/${path}`;
        const source = await importer(route);
        if (!disposed) installVehicleOwnedItemView(source[name], {game});
      } catch (error) { console.warn(`dh2e-ru: ${name} vehicle item view translation unavailable`, error); }
    }
  });
  const registration = Object.freeze({appHook, chatHook, dispose() {
    if (disposed) return;
    disposed = true;
    Hooks.off('renderApplicationV2', appHook);
    Hooks.off('renderChatMessageHTML', chatHook);
    profileRegistration?.dispose();
    if (readyHook !== undefined) Hooks.off('ready', readyHook);
    REGISTRATIONS.delete(Hooks);
  }});
  REGISTRATIONS.set(Hooks, registration);
  return registration;
}
