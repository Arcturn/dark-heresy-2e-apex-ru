export const CREATION_SYSTEM_ID = 'dark-heresy-2e-apex';
export const CREATION_CLASS = 'Dh2eCharacterCreation';
const installations = new WeakMap();
const norm = v => String(v ?? '').trim();

function active(game = globalThis.game) {
  return game?.system?.id === CREATION_SYSTEM_ID && game?.i18n?.lang === 'ru';
}
function isCreationApp(app) {
  for (let ctor = app?.constructor; typeof ctor === 'function'; ctor = Object.getPrototypeOf(ctor)) {
    if (ctor.name === CREATION_CLASS) return true;
    if (ctor === Function.prototype) break;
  }
  return false;
}
function directText(el, transform) {
  if (!el) return 0;
  let count = 0;
  for (const n of el.childNodes) {
    if (n.nodeType !== 3) continue;
    const raw = n.nodeValue ?? '', core = raw.trim();
    if (!core) continue;
    const next = transform(core);
    if (typeof next !== 'string' || next === core) continue;
    const at = raw.indexOf(core);
    n.nodeValue = raw.slice(0, at) + next + raw.slice(at + core.length);
    count++;
  }
  return count;
}
function translateSelect(select, map) {
  if (!select || !map) return 0;
  let count = 0;
  for (const opt of select.options ?? []) {
    const entry = map[opt.value];
    if (!entry || opt.children.length || opt.childNodes.length !== 1) continue;
    if (norm(opt.textContent) === entry.label) continue;
    opt.textContent = entry.label;
    count++;
  }
  return count;
}
function translateExact(root, selector, map) {
  let count = 0;
  for (const el of root.querySelectorAll(selector)) count += directText(el, t => map[t] ?? null);
  return count;
}
function skillTranslation(key, english, skills) {
  const info=skills?.specialistSkillNames?.[key]??skills?.coreSkillNames?.[key];
  if (!info) return null;
  if (info.group) {
    const group=skills.specialistGroups?.[info.group];
    if (group && english===`${group.en} (${info.en})`) return `${group.ru} (${info.ru})`;
  }
  return english===info.en ? info.ru : null;
}
function translateEquipmentText(text, map) {
  return text.split(' + ').map(part => {
    const m = /^(\d+) × (.+)$/.exec(part);
    if (m) return `${m[1]} × ${map[m[2]] ?? m[2]}`;
    return map[part] ?? part;
  }).join(' + ');
}

export function applyCreationUiTranslations(app, root, {dictionary, skills, game=globalThis.game}={}) {
  const out = {active:false, translated:0};
  if (!active(game) || !isCreationApp(app) || root?.nodeType !== 1 || !dictionary) return out;
  out.active = true;
  const selects = {
    homeworld: root.querySelector('select[name="homeworld"]'),
    background: root.querySelector('select[name="background"]'),
    role: root.querySelector('select[name="role"]')
  };
  out.translated += translateSelect(selects.homeworld, dictionary.homeworlds);
  out.translated += translateSelect(selects.background, dictionary.backgrounds);
  out.translated += translateSelect(selects.role, dictionary.roles);

  const cards = [...root.querySelectorAll('.dh2e-creation-cards > article')];
  const groups = [dictionary.homeworlds, dictionary.backgrounds, dictionary.roles];
  const values = [selects.homeworld?.value, selects.background?.value, selects.role?.value];
  cards.forEach((card, index) => {
    const entry = groups[index]?.[values[index]];
    if (!entry) return;
    const h3 = card.querySelector('h3');
    out.translated += directText(h3, () => entry.label);
    const small = h3?.querySelector('small');
    if (small && norm(small.textContent) !== `стр. ${entry.page}`) { small.textContent = `стр. ${entry.page}`; out.translated++; }
    const p = card.querySelector('p');
    if (p && norm(p.textContent) !== entry.bonus) { p.textContent = entry.bonus; out.translated++; }
  });

  // This column is exclusively the starting skills provided by the background.
  // Fixed labels have no data-key; options always retain their canonical key in value.
  const skillList=root.querySelector('.dh2e-creation-choices > div:first-child > ul.dh2e-creation-list');
  if (skillList && skills) for (const li of skillList.querySelectorAll('li')) {
    const select=li.querySelector('select[name^="choices.skill"]');
    if (select) {
      for (const option of select.options ?? []) {
        if (!option.hasAttribute('value') || option.children.length || option.childNodes.length!==1) continue;
        const original=norm(option.textContent);
        const replacement=skillTranslation(option.value,original,skills);
        if(replacement && replacement!==original) { option.textContent=replacement;out.translated++; }
      }
    } else {
      out.translated += directText(li, original => {
        const all=[...Object.values(skills.coreSkillNames??{}),...Object.values(skills.specialistSkillNames??{})];
        for (const entry of all) {
          const group=skills.specialistGroups?.[entry.group];
          if(entry.group && group && original===`${group.en} (${entry.en})`)return `${group.ru} (${entry.ru})`;
          if (original===entry.en)return entry.ru;
        }
        return null;
      });
    }
  }
  out.translated += translateExact(root, '.dh2e-creation-choices li', dictionary.talents);
  for (const opt of root.querySelectorAll('.dh2e-creation-choices select option')) {
    const next = dictionary.talents[norm(opt.textContent)];
    if (next && next !== norm(opt.textContent)) { opt.textContent = next; out.translated++; }
  }
  for (const li of root.querySelectorAll('.dh2e-creation-gear li')) {
    out.translated += directText(li, t => translateEquipmentText(t, dictionary.equipment));
  }
  for (const opt of root.querySelectorAll('.dh2e-creation-gear select option')) {
    const src = norm(opt.textContent), next = translateEquipmentText(src, dictionary.equipment);
    if (next !== src) { opt.textContent = next; out.translated++; }
  }

  const charMap = {
    'Weapon Skill':'НР','Ballistic Skill':'НС','Strength':'Сил','Toughness':'Вын','Agility':'Лов','Intelligence':'Инт','Perception':'Вос','Willpower':'СВ','Fellowship':'Общ','Influence':'Вли',
    'Навык Рукопашной':'НР','Навык Стрельбы':'НС','Сила':'Сил','Выносливость':'Вын','Ловкость':'Лов','Интеллект':'Инт','Восприятие':'Вос','Сила Воли':'СВ','Общительность':'Общ','Влияние':'Вли'
  };
  out.translated += translateExact(root, '.dh2e-char-name', charMap);
  for (const el of root.querySelectorAll('.dh2e-creation-stats b, .dh2e-creation-psyker .warn')) {
    out.translated += directText(el, t => t.replace(/(\d+)d(\d+)/g, '$1к$2'));
  }
  return out;
}

export function registerCreationUiAdapter({dictionary, skills, Hooks=globalThis.Hooks, game=()=>globalThis.game}={}) {
  if (!Hooks?.on || !Hooks?.off) throw new Error('dark-heresy-2e-apex-ru: Foundry Hooks unavailable');
  if (installations.has(Hooks)) return installations.get(Hooks);
  const currentGame = () => typeof game === 'function' ? game() : game;
  let warned = false;
  const apply = (app, root) => applyCreationUiTranslations(app, root, {dictionary, skills, game:currentGame()});
  const hookId = Hooks.on('renderApplicationV2', (app, root) => {
    try { apply(app, root); }
    catch (e) { if (!warned) console.warn('dark-heresy-2e-apex-ru: creation UI adapter skipped a render', e); warned = true; }
  });
  const api = Object.freeze({hookId, apply, dispose(){Hooks.off('renderApplicationV2', hookId); installations.delete(Hooks);}});
  installations.set(Hooks, api);
  return api;
}
