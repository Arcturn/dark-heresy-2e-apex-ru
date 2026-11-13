/**
 * Dark Heresy Apex v0.1.10 context-level display localization for Foundry 14.
 * This bridge transforms ONLY the Handlebars context returned by _prepareContext.
 * It does not change Actor.system, Item documents, combat calculations, XP, prerequisites,
 * system catalog exports, internal keys, settings or input fields.
 */
import {localizeActorContext,localizeAdvancementContext,localizeRollContext,searchAdvancementRows} from './keyed-view-l10n.mjs';
import {localizeHudBookContext} from './book-view-l10n.mjs';
import {localizeVehicleHudContext} from './vehicle-owned-view-l10n.mjs';
const SYS='dark-heresy-2e-apex';
const MOD='dark-heresy-2e-apex-ru';
const PATCHED=Symbol.for(`${MOD}.contextBridge.v021`);
const state={attempts:0,patched:[],failed:[],enabled:false};
const active=()=>globalThis.game?.system?.id===SYS&&globalThis.game?.i18n?.lang==='ru';
const asText=x=>typeof x==='string'?x:'';

function patchConstructor(ctor,kind){
  const proto=ctor?.prototype;
  if(!proto||typeof proto._prepareContext!=='function')return false;
  if(proto[PATCHED])return true;
  const original=proto._prepareContext;
  const wrapper=async function(...args){
    if(!active())return original.apply(this,args);
    if(kind==='actor'){
      const prepared=await original.apply(this,args);
      return localizeActorContext(prepared,this.actor??this.document);
    }
    if(kind==='hud'){
      const prepared=await original.apply(this,args);
      return localizeVehicleHudContext(localizeHudBookContext(prepared,this.actor),this.actor);
    }
    if(kind==='roll'){
      const prepared=await original.apply(this,args);
      return localizeRollContext(prepared);
    }
    if(kind==='advancement'){
      // The original catalog filters by English `talent.name` and by its
      // English `skill.label`. For Russian input, ask the original code for
      // its unfiltered *view rows*, then filter the localized view ourselves.
      // The original private #talentRows still computes *all* prices and
      // prerequisites: no gameplay code is replaced.
      const filters={talent:asText(this.talentFilter),skill:asText(this.skillFilter)};
      const needsWideSearch=/[А-Яа-яЁё]/u.test(filters.talent+filters.skill);
      let prepared;
      if(!needsWideSearch)prepared=await original.apply(this,args);
      else{
        this.talentFilter='';this.skillFilter='';
        try{prepared=await original.apply(this,args);}
        finally{this.talentFilter=filters.talent;this.skillFilter=filters.skill;}
        prepared={...prepared,talentFilter:filters.talent,skillFilter:filters.skill};
      }
      const localized=localizeAdvancementContext(prepared,this.actor);
      return needsWideSearch?searchAdvancementRows(localized,filters):localized;
    }
    return original.apply(this,args);
  };
  Object.defineProperty(wrapper,'name',{value:`dh2eRu_${kind}_prepareContext`});
  Object.defineProperty(proto,'_prepareContext',{configurable:true,writable:true,value:wrapper});
  Object.defineProperty(proto,PATCHED,{configurable:true,value:{original,kind}});
  return true;
}
/** Public/testable: classes can be supplied without a Foundry runtime. */
export function installViewContextBridges(classes={}){
  const outcomes={};
  const constructors={
    actor:classes.FalloutMaWActorSheet,
    advancement:classes.Dh2eAdvancementApplication,
    roll:classes.Dh2eRollDialog
  };
  if(classes.TokenActionHud)constructors.hud=classes.TokenActionHud;
  for(const [kind,ctor] of Object.entries(constructors)){
    const ok=patchConstructor(ctor,kind);
    outcomes[kind]=ok;
    if(ok&&!state.patched.includes(kind))state.patched.push(kind);
  }
  state.enabled=Object.values(outcomes).some(Boolean);
  return outcomes;
}
/** Resolve the classes from the *installed system* — no changes to source files. */
export async function loadSystemViewClasses({importer=path=>import(path)}={}){
  // Foundry may be hosted below a route prefix (for example /foundry/).
  const route=`systems/${SYS}/src`;
  const base=typeof globalThis.foundry?.utils?.getRoute==='function'
    ? globalThis.foundry.utils.getRoute(route) : `/${route}`;
  const entries={
    FalloutMaWActorSheet:`${base}/sheets/actor-sheet.mjs`,
    Dh2eAdvancementApplication:`${base}/apps/dh2e-advancement.mjs`,
    Dh2eRollDialog:`${base}/apps/dh2e-roll-dialog.mjs`
  };
  const found={};
  for(const [name,path] of Object.entries(entries)){
    try{
      const module=await importer(path);
      if(typeof module?.[name]==='function')found[name]=module[name];
      else state.failed.push(`${name}: missing export`);
    }catch(error){state.failed.push(`${name}: ${String(error?.message??error)}`);}
  }
  return found;
}
export function getViewBridgeStatus(){return {attempts:state.attempts,patched:[...state.patched],failed:[...state.failed],enabled:state.enabled};}
export function registerViewContextBridges({Hooks=globalThis.Hooks,game=()=>globalThis.game,importer}={}){
  if(!Hooks?.once)throw new Error('Foundry Hooks.once unavailable');
  const current=()=>typeof game==='function'?game():game;
  // TokenActionHud is deliberately private in the Apex system. Capture its
  // constructor on first render and patch future contexts without changing the
  // system export surface. The existing HUD DOM adapter covers that first render.
  Hooks.on?.('renderApplicationV2',app=>{
    if(!active()||app?.constructor?.name!=='TokenActionHud')return;
    installViewContextBridges({TokenActionHud:app.constructor});
  });
  Hooks.once('ready',async()=>{
    if(current()?.system?.id!==SYS||current()?.i18n?.lang!=='ru')return;
    state.attempts++;
    const classes=await loadSystemViewClasses({importer});
    const result=installViewContextBridges(classes);
    if(!Object.values(result).every(Boolean))console.warn('dh2e-ru: context bridge partially unavailable',getViewBridgeStatus());
    const module=current()?.modules?.get?.(MOD);
    if(module){
      // Keep other APIs installed by main.mjs, expose read-only diagnostics.
      const previous=module.api??{};
      module.api=Object.freeze({...previous,viewBridgeStatus:getViewBridgeStatus});
    }
  });
}
