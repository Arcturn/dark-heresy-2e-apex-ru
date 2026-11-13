/** v1.0.1 — first-party Dark Heresy Apex 0.1.10 dialogs for Disorders,
 * Malignancies and Mutations. Original form values are retained; an extra
 * Russian-labelled select for Disorders writes the original English name to
 * the existing input. Custom freeform disorder names remain supported. */
import {canonicalSoulOptions,translateSoulOptionLabel,translateDisorderName,soulPickerCounts} from './soul-picker-l10n.mjs';
const SYSTEM='dark-heresy-2e-apex';
const REG=new WeakMap();
const originalNames=canonicalSoulOptions; // exact stock table entries only
const rootNode=x=>x?.nodeType?x:(x?.[0]??x);
const active=game=>game?.system?.id===SYSTEM && game?.i18n?.lang==='ru';
const normalize=x=>String(x??'').trim();
const canUse=(app,DialogV2)=>typeof DialogV2==='function'?app instanceof DialogV2:
   app?.constructor?.name==='DialogV2';
function selectTable(root,type,stats){
 const select=root.querySelector?.('select[name="min"]');
 if(!select)return false;
 const book=originalNames(type),options=[...(select.options??[])];
 if(options.length!==book.length || !book.length)return false;
 // All original values and visible texts must match a known table row.
 const verified=options.every((opt,i)=>{
   const row=book[i],en=`${row.min}–${row.max}: ${row.en}`,ru=`${row.min}–${row.max}: ${row.ru}`;
   return opt.getAttribute?.('value')===String(row.min) && [en,ru].includes(normalize(opt.textContent));
 });
 if(!verified)return false;
 options.forEach((opt,i)=>{
   const next=translateSoulOptionLabel(type,opt.getAttribute('value'),normalize(opt.textContent));
   if(next!==normalize(opt.textContent)){opt.textContent=next;stats.translated++;}
 });
 stats.kind=type;
 return true;
}
function selectDisorders(root,stats){
 const input=root.querySelector?.('input[name="name"][list^="dh2e-disorders-"]');
 const severity=root.querySelector?.('select[name="severity"]');
 if(!input||!severity)return false;
 const listId=input.getAttribute('list');
 const list=[...root.querySelectorAll('datalist')].find(row=>row.id===listId);
 if(!list)return false;
 const options=[...list.querySelectorAll('option')];
 const canonical=originalNames('disorder');
 // Only this exact built-in picker is eligible; never touch third-party forms.
 if(options.length!==soulPickerCounts.disorders || options.length!==canonical.length)return false;
 if(!options.every((opt,i)=>opt.getAttribute('value')===canonical[i].en))return false;
 const severities=[...(severity.options??[])];
 if(severities.length!==3 || !severities.every((option,i)=>option.value===['Minor','Severe','Acute'][i]))return false;
 if(root.querySelector('.dh2e-ru-disorder-choices'))return true;
 const doc=input.ownerDocument??root.ownerDocument;
 if(!doc?.createElement)return false;
 const wrapper=doc.createElement('label');
 wrapper.className='dh2e-ru-disorder-choices';
 const caption=doc.createElement('span');caption.textContent='Расстройство из таблицы';
 const dropdown=doc.createElement('select');dropdown.setAttribute('aria-label','Выбор расстройства из книги правил');
 dropdown.className='dh2e-ru-disorder-select';
 const blank=doc.createElement('option');blank.value='';blank.textContent='— Своё название —';
 dropdown.append(blank);
 for(const item of canonical){
   const o=doc.createElement('option');o.value=item.en;o.textContent=item.ru;dropdown.append(o);
 }
 wrapper.append(caption,dropdown);
 const parent=input.closest?.('label')??input.parentElement;
 if(!parent?.parentElement)return false;
 parent.parentElement.insertBefore(wrapper,parent);
 // Default = freeform. When built-in selected, keep the existing input's
 // original English name as the value FormData reads; hide only its label.
 const chosen=canonical.find(item=>item.en===input.value || item.ru===input.value);
 if(chosen)dropdown.value=chosen.en;
 const sync=()=>{
   const selected=dropdown.value;
   if(selected){input.value=selected;parent.hidden=true;}
   else {if(canonical.some(item=>item.en===input.value))input.value='';parent.hidden=false;}
 };
 dropdown.addEventListener('change',sync);
 // The source datalist shows English values; the new Russian picker replaces
 // those suggestions. A separate text field remains for player custom names.
 input.removeAttribute('list');
 sync();
 stats.kind='disorder';stats.translated=canonical.length;
 return true;
}
export function applySoulPickerTranslations(app,element,{game=globalThis.game,DialogV2=globalThis.foundry?.applications?.api?.DialogV2}={}){
 const stats={active:false,kind:null,translated:0};
 if(!active(game)||!canUse(app,DialogV2))return stats;
 const root=rootNode(element);
 if(root?.nodeType!==1 || !root.querySelectorAll)return stats;
 if(selectDisorders(root,stats)){stats.active=true;return stats;}
 if(selectTable(root,'malignancy',stats)||selectTable(root,'mutation',stats))stats.active=true;
 return stats;
}
export function registerSoulPickerUiAdapter({Hooks=globalThis.Hooks,game=()=>globalThis.game,DialogV2}={}){
 if(!Hooks?.on||!Hooks?.off)throw new Error('Foundry hooks missing');
 if(REG.has(Hooks))return REG.get(Hooks);
 const getGame=()=>typeof game==='function'?game():game;
 let warned=false;
 const hook=Hooks.on('renderApplicationV2',(app,el)=>{
   try{applySoulPickerTranslations(app,el,{game:getGame(),DialogV2:DialogV2??globalThis.foundry?.applications?.api?.DialogV2});}
   catch(err){if(!warned)console.warn('dh2e-ru: soul picker translation unavailable',err);warned=true;}
 });
 const adapter={hook,dispose(){Hooks.off('renderApplicationV2',hook);REG.delete(Hooks);}};
 REG.set(Hooks,adapter);return adapter;
}
