/**
 * v0.23 — opt-in, read-only QA of English labels still visible in open
 * first-party Apex system windows. Never sends data, writes DOM, or changes
 * actors/items/settings. Only known built-in English phrases are reported.
 */
import catalog from './hardcoded-ui-data-v022.mjs';
import talents from './progression-data.mjs';
import rules from './actor-rules-data.mjs';
import {translateStockVehicleAndPageLabels} from './hardcoded-ui-adapter-v022.mjs';

const SYSTEM='dark-heresy-2e-apex';
const MARKERS=[
  '.dark-heresy-2e-apex', '.dh2e-item-sheet', '.dh2e-gear-sheet',
  '.apex-actor-sheet', '.dh2e-roll-dialog', '[class*="dark-heresy-2e-apex-"]'
].join(',');
const UI_SELECTORS=[
  'label', 'legend', 'th', 'dt', 'button',
  '.apex-cap', '.dh2e-cap', '.dh2e-lbl', '.dh2e-block-hd',
  '.dh2e-roll-m > span', '.dh2e-veh-weapon .stats i',
  '.dh2e-veh-tiles .apex-sub', '.apex-rule-body em',
  '.apex-rule-name', '.apex-rule-meta', '.apex-ident-value',
  'select > option'
].join(',');
const CHECK_ATTRIBUTES=['aria-label','placeholder','title','data-tooltip'];
const IGNORE='[contenteditable]:not([contenteditable="false"]), .ProseMirror, .editor, .editor-content, .apex-notes, .dh2e-notes, .apex-note, pre, code, textarea';
const properNameTranslations=new Map([
  ...Object.values(talents.talents).map(t=>[t.en,t.ru]),
  ...Object.values(rules.traits).map(t=>[t.en,t.ru]),
  ['Feral World','Дикий мир'], ['Forge World','Мир-кузница'],
  ['Highborn','Высокородный'],['Hive World','Мир-улей'],
  ['Shrine World','Мир-храм'],['Voidborn','Пустоторождённый'],
  ['Adeptus Administratum','Адептус Администратум'],
  ['Adeptus Arbites','Адептус Арбитес'],
  ['Adeptus Astra Telepathica','Адептус Астра Телепатика'],
  ['Adeptus Mechanicus','Адептус Механикус'],
  ['Adeptus Ministorum','Адептус Министорум'],
  ['Imperial Guard','Астра Милитарум'],
  ['Outcast','Изгой'], ['Chirurgeon','Хирургеон'],
  ['Warrior','Воитель'], ['Assassin','Ассасин'],
  ['Hierophant','Иерофант'], ['Mystic','Мистик'],
  ['Sage','Мудрец'], ['Seeker','Искатель'],
  ['Desperado','Десперадо']
]);
const getText=x=>String(x??'').trim();
const looksLikeSystemWindow=root=>{
  try {return !!(root.matches?.(MARKERS) || root.querySelector?.(MARKERS));}
  catch {return false;}
};
const protectedNode=x=>{try{return !!x.closest?.(IGNORE);}catch{return false;}};

function knownEnglishLabel(element,value) {
  const str=getText(value);
  if (!str || !element || protectedNode(element)) return null;
  const matches=selector=>{try{return !!element.matches?.(selector);}catch{return false;}};
  // Disambiguate list entries from custom names: only stock talent/trait and
  // origin names are recognized, never arbitrary Latin-looking character data.
  if (matches('.apex-rule-name, .apex-ident-value') && properNameTranslations.has(str)) {
    const translated=properNameTranslations.get(str);
    return translated===str?null:translated;
  }
  if (matches('.dh2e-veh-tiles .apex-sub, .apex-rule-body em')) {
    const translated=translateStockVehicleAndPageLabels(element,str);
    if(translated!==str)return translated;
  }
  // All other checks are exact known source UI labels, not fuzzy language
  // detection (which would incorrectly flag actor names or formula tokens).
  const translated=catalog.labels[str];
  return typeof translated==='string'&&translated!==str?translated:null;
}
/**
 * Optional console QA: game.modules.get('dark-heresy-2e-apex-ru')
 *   ?.api?.inspectOpenSystemUI()
 * Findings are candidates from currently open views, not a full-world audit.
 */
export function inspectOpenSystemUI({game=globalThis.game,document=globalThis.document,maxFindings=100}={}) {
  const active=game?.system?.id===SYSTEM&&game?.i18n?.lang==='ru';
  const out={active,windows:0,checkedLabels:0,found:0,findings:[],limit:Math.min(200,Math.max(1,Number(maxFindings)||100))};
  if(!active||!document?.querySelectorAll)return out;
  for(const root of document.querySelectorAll('.application')??[]) {
    if(!looksLikeSystemWindow(root))continue;
    out.windows++;
    let count=0;
    for(const element of root.querySelectorAll(UI_SELECTORS)??[]) {
      if(protectedNode(element))continue;
      for(const node of element.childNodes??[]) {
        if(node?.nodeType!==3||!getText(node.nodeValue))continue;
        out.checkedLabels++;
        const label=getText(node.nodeValue);
        const expected=knownEnglishLabel(element,label);
        if(!expected)continue;
        out.found++;
        if(out.findings.length<out.limit)out.findings.push({type:'text',original:label,expected});
      }
      for(const name of CHECK_ATTRIBUTES){
        const label=element.getAttribute?.(name);
        if(!label)continue;
        out.checkedLabels++;
        const expected=knownEnglishLabel(element,label);
        if(!expected)continue;
        out.found++;
        if(out.findings.length<out.limit)out.findings.push({type:name,original:label,expected});
      }
    }
  }
  return out;
}
