/**
 * Source-exact display-layer translations for DH2e Apex 0.1.10.
 *
 * Scope: the system's rendered actor/item applications, UI-owned accessory
 * applications and its distinctive chat-card markup. We never intercept
 * writes or rules, replace innerHTML, alter data-* identifiers or input values,
 * or translate arbitrary user chat. Unknown/custom text is always preserved.
 */
export const RUNTIME_SYSTEM_ID = 'dark-heresy-2e-apex';
export const RUNTIME_MODULE_ID = 'dark-heresy-2e-apex-ru';
const REGISTRATIONS = new WeakMap();
const OWN = (o,k)=>Object.prototype.hasOwnProperty.call(o??{},k);
const SOURCE_APP = /^(?:FalloutMaW|Dh2e|DarkHeresy)/;
const SOURCE_MARKERS = '[class*="dh2e-"], [class*="apex-"], [class*="dark-heresy-2e-apex"]';
const CARD_MARKERS = '.dh2e-sanity-card, .dark-heresy-2e-apex-chat-card.dh2e-card';
const PROTECTED = [
  'input','textarea','select','option','datalist','script','style','pre','code','prose-mirror',
  '[contenteditable]:not([contenteditable="false"])',
  '.ProseMirror','.editor','.editor-content','.tinymce',
  '[data-tab="description"]','[data-tab="notes"]',
  '.apex-notes','.dh2e-notes','.apex-gear-description',
  '.apex-psy-name','.apex-gear-name','.item-name','.actor-name','.document-name',
  '.window-title','.chat-message .message-sender'
].join(',');
const ATTRIBUTES = Object.freeze(['title','aria-label','data-tooltip','placeholder']);

function nodeRoot(element) { return element?.nodeType ? element : (element?.[0] ?? element); }
function available(game){return game?.system?.id === RUNTIME_SYSTEM_ID && game?.i18n?.lang === 'ru';}
function protectedElement(node){return Boolean(node?.closest?.(PROTECTED));}
function sourceUiApp(application, root){
  const name=String(application?.constructor?.name ?? '');
  if(!SOURCE_APP.test(name) || !root?.querySelectorAll) return false;
  return Boolean(root.matches?.(SOURCE_MARKERS) || root.querySelector?.(SOURCE_MARKERS));
}
function exactMap(value,map){return typeof value === 'string' && OWN(map,value) ? map[value] : null;}

/** Use only whitelisted full-string literals; preserve whitespace and markup nodes. */
export function translateExactRuntimeString(value, dictionary, category='labels') {
  if(typeof value !== 'string' || !dictionary?._meta || !['labels','sanity'].includes(category))return value;
  const core=value.trim();
  const translated=exactMap(core,dictionary[category]);
  if(!translated || translated===core)return value;
  const pos=value.indexOf(core);
  return value.slice(0,pos)+translated+value.slice(pos+core.length);
}

function translateTextNode(node,dictionary, counters, category='labels'){
  if(node?.nodeType!==3 || !node.nodeValue)return;
  const next=translateExactRuntimeString(node.nodeValue,dictionary,category);
  if(next!==node.nodeValue){node.nodeValue=next;counters.text++;}
}
function translateAttributes(element,dictionary,counters,category='labels'){
  if(!element?.hasAttribute || !element?.getAttribute || !element?.setAttribute)return;
  for(const attr of ATTRIBUTES){
    if(!element.hasAttribute(attr))continue;
    const old=element.getAttribute(attr);
    const next=translateExactRuntimeString(old,dictionary,category);
    if(next!==old){element.setAttribute(attr,next);counters.attributes++;}
  }
}
function directText(element,dictionary,counters,category='labels'){
  for(const child of element?.childNodes ?? [])translateTextNode(child,dictionary,counters,category);
}
function elements(root){
  const nodes=[root];
  if(typeof root?.querySelectorAll==='function')for(const e of root.querySelectorAll('*'))nodes.push(e);
  return nodes;
}
/** A narrow sanitizer: only text and presentation attributes are eligible. */
export function translateSourceOwnedUi(root, dictionary, {
  category='labels', scopedTo=null
}={}){
  const counters={text:0,attributes:0,inspected:0};
  if(!root?.querySelectorAll || !dictionary?._meta || dictionary._meta.systemId !== RUNTIME_SYSTEM_ID)return counters;
  for(const element of elements(root)){
    if(!element || element.nodeType!==1 || protectedElement(element))continue;
    if(scopedTo && element!==root && !element.closest?.(scopedTo) && !element.matches?.(scopedTo))continue;
    counters.inspected++;
    directText(element,dictionary,counters,category);
    translateAttributes(element,dictionary,counters,category);
  }
  return counters;
}
/** The system's Fear/Insanity/Corruption renderer uses exact source sentences. */
export function translateSanityCard(root,dictionary){
  const counters={text:0,attributes:0,inspected:0};
  if(!root?.querySelectorAll)return counters;
  const cards=[];
  if(root.matches?.('.dh2e-sanity-card'))cards.push(root);
  for(const card of root.querySelectorAll('.dh2e-sanity-card'))cards.push(card);
  for(const card of cards){
    // The ChatMessage markup is source-generated and escaped; all strings here
    // are mapped by their complete exact English source text. This also covers
    // trauma and malignancy tooltips, not just the shock outcome paragraph.
    const labels=translateSourceOwnedUi(card,dictionary,{category:'labels'});
    const sanity=translateSourceOwnedUi(card,dictionary,{category:'sanity'});
    counters.text+=labels.text+sanity.text;
    counters.attributes+=labels.attributes+sanity.attributes;
    counters.inspected+=sanity.inspected;
    // The rule's NewDisorder i18n key contains an English enum interpolated by
    // the source before rendering. Replace only that single recognized pattern.
    const line=/^(Новое расстройство, тяжесть: )(Minor|Severe|Acute)(; выбирает Ведущий \(стр\. 287\)\.)$/u;
    for(const element of elements(card)){
      if(protectedElement(element))continue;
      for(const node of element.childNodes ?? []){
        if(node?.nodeType!==3)continue;
        const old=node.nodeValue;
        if(typeof old!=='string')continue;
        const match=old.trim().match(line);
        if(!match)continue;
        const translated=dictionary.labels[match[2]];
        if(!translated)continue;
        node.nodeValue=old.replace(match[0],match[1]+translated.toLowerCase()+match[3]);
        counters.text++;
      }
    }
  }
  return counters;
}

export function applyRuntimeUiTranslations(application, element, {
  dictionary, game=globalThis.game
}={}){
  const counters={active:false,text:0,attributes:0,inspected:0};
  if(!available(game))return counters;
  const root=nodeRoot(element);
  if(!sourceUiApp(application,root))return counters;
  counters.active=true;
  const result=translateSourceOwnedUi(root,dictionary);
  return {...counters,...result};
}
/**
 * Other original DH2e chat cards may attach raw source-owned modifier names to
 * data-tooltip.  Translate ONLY exact tooltip literals (never dynamic text nodes
 * or chat flavor), so character names, user descriptions and rolls stay intact.
 */
export function translateFixedCardTooltips(root, dictionary){
  const counters={text:0,attributes:0,inspected:0};
  if(!root?.querySelectorAll || dictionary?._meta?.systemId!==RUNTIME_SYSTEM_ID)return counters;
  const cards=[];
  if(root.matches?.(CARD_MARKERS))cards.push(root);
  for(const card of root.querySelectorAll(CARD_MARKERS))cards.push(card);
  for(const card of cards){
    for(const element of elements(card)){
      if(!element || element.nodeType!==1 || protectedElement(element))continue;
      counters.inspected++;
      if(!element.hasAttribute?.('data-tooltip'))continue;
      const old=element.getAttribute('data-tooltip');
      const next=translateExactRuntimeString(old,dictionary,'labels');
      if(old===next)continue;
      element.setAttribute('data-tooltip',next);
      counters.attributes++;
    }
  }
  return counters;
}

export function applyRuntimeChatTranslations(message, html, {
  dictionary, game=globalThis.game
}={}){
  const counters={active:false,text:0,attributes:0,inspected:0};
  if(!available(game))return counters;
  const root=nodeRoot(html);
  if(!root?.querySelectorAll)return counters;
  const hasSanity=Boolean(root.matches?.('.dh2e-sanity-card') || root.querySelector?.('.dh2e-sanity-card'));
  const hasCard=Boolean(root.matches?.(CARD_MARKERS) || root.querySelector?.(CARD_MARKERS));
  if(!message || !hasCard)return counters;
  counters.active=true;
  if(hasSanity){
    const sanity=translateSanityCard(root,dictionary);
    counters.text+=sanity.text;counters.attributes+=sanity.attributes;counters.inspected+=sanity.inspected;
  } else {
    // The source-authored non-sanity chat cards are allowed only exact
    // *tooltip* translations; the displayed name/value content is untouched.
    const generic=translateFixedCardTooltips(root,dictionary);
    counters.attributes+=generic.attributes;counters.inspected+=generic.inspected;
  }
  // Numeric skill-check breakdowns are handled by their dedicated adapter.
  return counters;
}
export function registerRuntimeUiAdapter({
  dictionary, Hooks=globalThis.Hooks, game=()=>globalThis.game
}={}){
  if(dictionary?._meta?.schemaVersion!==1 || dictionary._meta.systemId!==RUNTIME_SYSTEM_ID
    || !dictionary.labels || !dictionary.sanity)throw new Error('Invalid runtime display dictionary');
  if(!Hooks?.on || !Hooks?.off)throw new Error('Foundry Hooks unavailable');
  if(REGISTRATIONS.has(Hooks))return REGISTRATIONS.get(Hooks);
  const currentGame=()=>typeof game==='function'?game():game;
  let warned=false;
  const safeApply=(fn,...args)=>{
    try{fn(...args,{dictionary,game:currentGame()});}
    catch(e){if(!warned)console.warn(`${RUNTIME_MODULE_ID}: runtime UI translation skipped`,e);warned=true;}
  };
  const appHook=Hooks.on('renderApplicationV2',(app,el)=>safeApply(applyRuntimeUiTranslations,app,el));
  const chatHook=Hooks.on('renderChatMessageHTML',(message,el)=>safeApply(applyRuntimeChatTranslations,message,el));
  let disposed=false;
  const registration=Object.freeze({appHook,chatHook,dispose(){
    if(disposed)return;disposed=true;
    Hooks.off('renderApplicationV2',appHook);
    Hooks.off('renderChatMessageHTML',chatHook);
    if(REGISTRATIONS.get(Hooks)===registration)REGISTRATIONS.delete(Hooks);
  }});
  REGISTRATIONS.set(Hooks,registration);
  return registration;
}
