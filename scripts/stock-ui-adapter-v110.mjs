/** Stock display values introduced by Apex settings and template fragments. */
const SYSTEM = 'dark-heresy-2e-apex';
const REGISTRATIONS = new WeakMap();
const INPUT_VIEWS = new WeakMap();
let nextProxyId = 0;
const active = game => game?.system?.id === SYSTEM && game?.i18n?.lang === 'ru';
const rootOf = element => element?.nodeType ? element : element?.[0];

export const STOCK_LABELS = Object.freeze({
  cover: {Partial:'Частичное укрытие',Half:'Половинное укрытие','Three-Quarters':'Укрытие на три четверти'},
  creature: {Helmet:'Шлем',Glasses:'Очки',Mask:'Маска',Clothing:'Одежда',Armor:'Броня',Cloak:'Плащ',Rig:'Разгрузка',Belt:'Пояс',Backpack:'Рюкзак',Head:'Голова',Eyes:'Глаза',Torso:'Торс',Groin:'Пах','Left arm':'Левая рука','Right arm':'Правая рука','Left leg':'Левая нога','Right leg':'Правая нога',Human:'Человек',Humanoid:'Гуманоид',Standard:'Стандартный',Strike:'Удар','Set 1':'Комплект 1'},
  category: {Weapons:'Оружие',Las:'Лазерное','Solid Projectile':'Твердоснарядное',Bolt:'Болтерное',Melta:'Мельта',Plasma:'Плазменное',Flame:'Огнемётное',Launcher:'Пусковые установки','Grenades and Missiles':'Гранаты и ракеты',Explosives:'Взрывчатка',Exotic:'Экзотическое',Chain:'Цепное',Power:'Энергетическое',Shock:'Электрошоковое',Force:'Силовое','Low-Tech':'Низкотехнологичное',Ammunition:'Боеприпасы','Weapon Modifications':'Модификации оружия',Armour:'Броня','Force Fields':'Силовые поля','Clothing and Personal Gear':'Одежда и личные вещи','Drugs and Consumables':'Препараты и расходные материалы',Tools:'Инструменты',Cybernetics:'Кибернетика'},
  light: {Dark:'Темнота',Dim:'Тусклый свет',Lit:'Освещено','Bright light':'Яркий свет','Very bright light':'Очень яркий свет'},
  action: {Medicine:'Медицина',Repair:'Ремонт',Search:'Поиск',Trade:'Торговля',Crafting:'Изготовление',Stealth:'Скрытность',Traps:'Ловушки'},
  tool: {'Medical tools':'Медицинские инструменты','Repair tools':'Ремонтные инструменты','Electronic hacking tools':'Инструменты электронного взлома','Mechanical lockpicking tools':'Отмычки'}
});
const KEYBINDINGS = Object.freeze({
  combatCarouselPrev:['Combat Carousel: Previous Turn','Боевая карусель — предыдущий ход'],
  combatCarouselNext:['Combat Carousel: Next Turn','Боевая карусель — следующий ход']
});
const SETTINGS_GROUPS = Object.freeze({
  CoverSettingsConfig:'cover',CreatureOptionsConfig:'creature',LimbSettingsConfig:'creature',
  ItemCategorySettingsConfig:'category',StealthSettingsConfig:'light'
});
const TILE_COVER_LABELS = Object.freeze({partial:'Partial',half:'Half',full:'Three-Quarters'});
// src/rolls/dh2e-cover.mjs, Table 7–4. Match the stock key AND label;
// neither the selected value nor custom material/cover names are rewritten.
const TILE_MATERIAL_LABELS = Object.freeze({
  thin:['Armour-glass, genatorium pipes, thin metal, wooden planks','Бронестекло, трубы генератория, тонкий металл, деревянные доски'],
  crates:['Flakboard, storage crates, sandbags, thick ice, trees','Бронеплиты, ящики, мешки с песком, толстый лёд, деревья'],
  barricade:['Cogitator banks, stasis pods, standard barricades','Блоки когитаторов, стазис-капсулы, обычные баррикады'],
  rockcrete:['Rockcrete, hatchways, thick iron, stone','Рокрит, люки, толстое железо, камень'],
  plasteel:['Armaplas, voidship bulkheads, plasteel','Армапласт, переборки пустотного корабля, пласталь']
});
const TILE_COVER_SELECTOR = '.dark-heresy-2e-apex-tile-special-property-row select[name$=".coverKey"] option[value]';
const TILE_MATERIAL_SELECTOR = '.dark-heresy-2e-apex-tile-special-property-row select[data-tile-cover-material] option[value]';

export function translateStockLabel(group, value) {
  if (typeof value !== 'string') return value;
  const translation = STOCK_LABELS[group]?.[value.trim()];
  return translation ? value.replace(value.trim(), translation) : value;
}

/** Template-owned patterns; numeric values and the surrounding nodes are kept. */
export function translateStockFragment(kind, value) {
  if (typeof value !== 'string') return value;
  if (kind === 'tier') return value.replace(/^(\s*)T([1-3])(\s*)$/u,'$1Ранг $2$3');
  if (kind === 'page') return value.replace(/(<em>\s*)p\.\s*(\d+)(\s*<\/em>)/gu,'$1стр. $2$3');
  if (kind === 'movement') return value.replace(/^(\s*-?\d+(?:[.,]\d+)?\s*\/\s*-?\d+(?:[.,]\d+)?\s+)m(\s*)$/u,'$1м$2');
  return value;
}

function directText(element, translate) {
  let changed = 0;
  for (const node of element?.childNodes ?? []) {
    if (node.nodeType !== 3) continue;
    const after = translate(node.nodeValue);
    if (after !== node.nodeValue) { node.nodeValue = after; changed++; }
  }
  return changed;
}
function each(root, selector, callback) {
  if (root.matches?.(selector)) callback(root);
  for (const element of root.querySelectorAll?.(selector) ?? []) callback(element);
}

/**
 * The canonical input keeps its form name/data-field and source event listeners.
 * An unnamed proxy shows the translation. Untouched forms submit the original;
 * deliberate edits update the canonical field through its normal event path.
 */
export function showStockInput(input, group) {
  if (!input?.ownerDocument?.createElement || input.dataset?.dh2eRuStockView) return false;
  const previous = INPUT_VIEWS.get(input);
  if (previous) {
    // Settings can disable/read-only a field without changing its value.
    syncProxyState(input,previous.proxy);
    if (input.value === previous.lastCanonical) return false;
    // The source can refresh a field while reusing its element. A focused
    // editor owns pending keystrokes until its input/change event is forwarded.
    if (input.ownerDocument.activeElement === previous.proxy) return false;
    restoreStockInput(input);
  }
  const canonical = input.value;
  const displayed = translateStockLabel(group, canonical);
  if (displayed === canonical) return false;
  const proxy = input.ownerDocument.createElement('input');
  proxy.type = 'text';
  proxy.className = input.className;
  proxy.value = displayed;
  proxy.defaultValue = displayed;
  syncProxyState(input,proxy);
  proxy.dataset.dh2eRuStockView = 'true';
  const labels = Array.from(input.labels ?? []);
  // Give explicit and wrapping labels a real, focusable control. Keep the
  // source input's id unchanged for source code that looks it up by id.
  do { proxy.id = `dh2e-ru-stock-${++nextProxyId}`; }
  while (input.ownerDocument.getElementById?.(proxy.id));
  const labelAssociations = labels.map(label => ({label,oldFor:label.getAttribute('for')}));
  for (const {label} of labelAssociations) label.setAttribute('for',proxy.id);
  const state = {
    proxy,canonical,displayed,lastCanonical:canonical,labelAssociations,
    oldDisplay:input.style.display,
    oldAriaHidden:input.getAttribute('aria-hidden'),
    oldTabIndex:input.getAttribute('tabindex')
  };
  input.style.display = 'none';
  input.setAttribute('aria-hidden','true');
  input.setAttribute('tabindex','-1');
  input.insertAdjacentElement('afterend',proxy);
  const forward = event => {
    event.stopPropagation();
    input.value = proxy.value === displayed ? canonical : proxy.value;
    state.lastCanonical = input.value;
    const EventClass = input.ownerDocument.defaultView?.Event ?? globalThis.Event;
    input.dispatchEvent(new EventClass(event.type,{bubbles:true}));
  };
  proxy.addEventListener('input',forward);
  proxy.addEventListener('change',forward);
  INPUT_VIEWS.set(input,state);
  return true;
}

function syncProxyState(input, proxy) {
  proxy.disabled = input.disabled;
  proxy.readOnly = input.readOnly;
  proxy.required = input.required;
  for (const attribute of ['aria-label','aria-labelledby','aria-describedby','title','placeholder','maxlength','minlength','size']) {
    const value = input.getAttribute?.(attribute);
    if (value !== null && value !== undefined) proxy.setAttribute(attribute,value);
    else proxy.removeAttribute(attribute);
  }
}

export function restoreStockInput(input) {
  const state = INPUT_VIEWS.get(input);
  if (!state) return false;
  input.style.display = state.oldDisplay;
  for (const [name,value] of [['aria-hidden',state.oldAriaHidden],['tabindex',state.oldTabIndex]]) {
    if (value === null) input.removeAttribute(name);
    else input.setAttribute(name,value);
  }
  for (const {label,oldFor} of state.labelAssociations) {
    // Do not undo an independent association change made by the source UI.
    if (label.getAttribute('for') !== state.proxy.id) continue;
    if (oldFor === null) label.removeAttribute('for');
    else label.setAttribute('for',oldFor);
  }
  state.proxy.remove();
  INPUT_VIEWS.delete(input);
  return true;
}

function editorInputs(name, root) {
  if (name === 'CoverSettingsConfig') return root.querySelectorAll('input[name^="settings.entries."][name$=".label"]');
  if (name === 'CreatureOptionsConfig') return root.querySelectorAll('input[name="type.name"], input[name="race.name"], [data-limb-row] input[data-field="label"], [data-equipment-slot-row] input[data-field="label"], [data-weapon-set-row] input[data-field="label"], [data-natural-set-row] input[data-field="label"]');
  if (name === 'ItemCategorySettingsConfig') return root.querySelectorAll('input[data-field="categoryLabel"], input[data-field="subcategoryLabel"]');
  if (name === 'StealthSettingsConfig') return root.querySelectorAll('input[name^="difficultyLevels."][name$=".label"]');
  return [];
}
function translateSettings(name, root, stats) {
  const group = SETTINGS_GROUPS[name];
  if (!group) return;
  for (const input of editorInputs(name,root)) stats.inputs += Number(showStockInput(input,group));
  each(root,'button[data-action="selectType"], button[data-action="selectRace"], .dark-heresy-2e-apex-race-group > h3, .dark-heresy-2e-apex-panel-header > h2, option[value]',element => {
    stats.text += directText(element,value => translateStockLabel(group,value));
  });
  if (name === 'CreatureOptionsConfig') each(root,'[data-natural-weapon-row] > span',element => {
    stats.text += directText(element,value => value.trim() === 'Strike' ? translateStockLabel('creature',value) : value);
  });
}
function translateSystemOptions(root, stats) {
  const optionGroups = [
    ['select[name$="toolKey"] option[value], select[data-tool-function-key] option[value]','tool'],
    ['select[name="system.itemCategory"] option[value], select[name="system.itemSubcategory"] option[value], select[data-ability-item-use-category] option[value]','category'],
    ['select[name$="typeId"] option[value], select[name$="raceId"] option[value]','creature']
  ];
  for (const [selector,group] of optionGroups) each(root,selector,element => {
    stats.text += directText(element,value => translateStockLabel(group,value));
  });
  each(root,'[data-system-action-key], [data-hud-icon-key]',element => {
    const key = element.getAttribute('data-system-action-key') ?? element.getAttribute('data-hud-icon-key');
    const names = {medicine:'Medicine',repair:'Repair',search:'Search',trade:'Trade',craft:'Crafting',stealth:'Stealth',traps:'Traps'};
    const source = names[key];
    if (!source) return;
    stats.text += directText(element,value => value.trim() === source ? translateStockLabel('action',value) : value);
    for (const label of element.querySelectorAll('span')) {
      stats.text += directText(label,value => value.trim() === source ? translateStockLabel('action',value) : value);
    }
    for (const attr of ['title','aria-label','data-tooltip']) {
      const value = element.getAttribute(attr);
      if (value?.trim() === source) element.setAttribute(attr,translateStockLabel('action',value));
    }
    for (const image of element.querySelectorAll('img[alt]')) {
      const value = image.getAttribute('alt');
      if (value?.trim() === source) image.setAttribute('alt',translateStockLabel('action',value));
    }
  });
}

function translateTileCover(root, stats) {
  each(root,TILE_COVER_SELECTOR,option => {
    const source = TILE_COVER_LABELS[option.getAttribute('value')];
    if (!source) return;
    stats.text += directText(option,value => value.trim() === source ? translateStockLabel('cover',value) : value);
  });
  each(root,TILE_MATERIAL_SELECTOR,option => {
    const labels = TILE_MATERIAL_LABELS[option.getAttribute('value')];
    if (!labels) return;
    const [source,translation] = labels;
    stats.text += directText(option,value => {
      const label = value.trim();
      if (!label.startsWith(source)) return value;
      // Source appends the armour in parentheses. Preserve its literal value
      // and spacing instead of replacing it with the stock numeric default.
      const suffix = label.slice(source.length);
      if (!/^\s+\(\d+(?:[.,]\d+)?\)$/u.test(suffix)) return value;
      return value.replace(source,translation);
    });
  });
}

function translateToolTooltip(root, stats) {
  const selector = '.dark-heresy-2e-apex-inventory-tooltip .function-section > h4, .dark-heresy-2e-apex-inventory-tooltip .function-row > span';
  each(root,selector,element => {
    stats.text += directText(element,value => {
      const label = value.trim().replace(/:$/u,'');
      const translated = translateStockLabel('tool',label);
      return translated === label ? value : value.replace(label,translated);
    });
  });
}

export function localizeCarouselKeybindings(game = globalThis.game) {
  if (game?.system?.id !== SYSTEM) return 0;
  let changed = 0;
  for (const [key,[english,russian]] of Object.entries(KEYBINDINGS)) {
    const action = game.keybindings?.actions?.get?.(`${SYSTEM}.${key}`);
    if (!action || ![english,russian].includes(action.name)) continue;
    const next = active(game) ? russian : english;
    if (action.name !== next) { action.name = next; changed++; }
  }
  return changed;
}

export function translateStockUI(app, element, {game = globalThis.game} = {}) {
  const stats = {active:false,text:0,inputs:0};
  const root = rootOf(element);
  if (!root?.querySelectorAll) return stats;
  const name = app?.constructor?.name ?? '';
  if (!active(game)) {
    for (const input of root.querySelectorAll('input')) restoreStockInput(input);
    return stats;
  }
  if (name === 'KeybindingsConfig') {
    localizeCarouselKeybindings(game);
    each(root,'label, h3, h4, .action-name, .keybind-name, .name',element => {
      stats.text += directText(element,value => {
        for (const [english,russian] of Object.values(KEYBINDINGS)) if (value.trim() === english) return value.replace(english,russian);
        return value;
      });
    });
    stats.active = true;
    return stats;
  }
  const marker = '.dark-heresy-2e-apex, [class*="dark-heresy-2e-apex-"], [class*="dh2e-"], [class*="apex-"]';
  if (!SETTINGS_GROUPS[name] && !root.matches?.(marker) && !root.querySelector?.(marker)) return stats;
  stats.active = true;
  each(root,'.dh2e-talent-table .dh2e-tier',element => { stats.text += directText(element,value => translateStockFragment('tier',value)); });
  each(root,'.dh2e-condition[data-tooltip]',element => {
    const before = element.getAttribute('data-tooltip');
    const after = translateStockFragment('page',before);
    if (after !== before) { element.setAttribute('data-tooltip',after); stats.text++; }
  });
  each(root,'.dh2e-hud-move .dark-heresy-2e-apex-token-hud-meter-header > strong',element => { stats.text += directText(element,value => translateStockFragment('movement',value)); });
  translateSettings(name,root,stats);
  translateTileCover(root,stats);
  translateSystemOptions(root,stats);
  translateToolTooltip(root,stats);
  return stats;
}

export function registerStockUiAdapterV110({Hooks = globalThis.Hooks,game = () => globalThis.game,document = globalThis.document,MutationObserver = globalThis.MutationObserver} = {}) {
  if (!Hooks?.on || !Hooks?.off) return null;
  if (REGISTRATIONS.has(Hooks)) return REGISTRATIONS.get(Hooks);
  const currentGame = () => typeof game === 'function' ? game() : game;
  const render = (app,root) => translateStockUI(app,root,{game:currentGame()});
  const renderId = Hooks.on('renderApplicationV2',render);
  const legacyId = Hooks.on('renderKeybindingsConfig',render);
  let observer = null;
  const observeLateStockUI = () => {
    if (observer || !document?.body || typeof MutationObserver !== 'function') return;
    observer = new MutationObserver(records => {
      if (!active(currentGame())) return;
      const roots = new Set();
      for (const record of records) {
        for (const node of record.addedNodes ?? []) {
          if (node.nodeType !== 1) continue;
          // Tile add/type-change handlers replace their list via innerHTML
          // without a renderApplicationV2 hook; inventory tooltips do likewise.
          const selector = '.dark-heresy-2e-apex-inventory-tooltip, .dark-heresy-2e-apex-tile-special-property-row';
          const host = node.closest?.(selector);
          if (host) roots.add(host);
          else if (node.querySelector?.(selector)) roots.add(node);
        }
      }
      for (const root of roots) render(null,root);
    });
    // Character-data replacements made by this adapter do not retrigger it.
    observer.observe(document.body,{childList:true,subtree:true});
  };
  const readyId = Hooks.on('ready',() => {
    localizeCarouselKeybindings(currentGame());
    observeLateStockUI();
  });
  observeLateStockUI();
  const registration = {dispose() {
    Hooks.off('renderApplicationV2',renderId);
    Hooks.off('renderKeybindingsConfig',legacyId);
    Hooks.off('ready',readyId);
    observer?.disconnect();
    for (const input of document?.body?.querySelectorAll?.('input') ?? []) restoreStockInput(input);
    REGISTRATIONS.delete(Hooks);
  }};
  REGISTRATIONS.set(Hooks,registration);
  return registration;
}
