import dictionary from "./ui-literals.mjs";
import {registerSheetUiAdapter} from "./sheet-ui-adapter.mjs";
import dialogDictionary from "./dialog-ui.mjs";
import {registerDialogUiAdapter} from "./dialog-ui-adapter.mjs";
import creationDictionary from "./creation-ui.mjs";
import bookData from "./book-view-data.mjs";
import {bookCatalogStats} from "./book-view-l10n.mjs";
import {registerBookChatUiAdapter} from "./book-chat-ui-adapter.mjs";
import {registerTokenHudUiAdapter} from "./token-hud-ui-adapter.mjs";
import {registerCreationUiAdapter} from "./creation-ui-adapter.mjs";
import {registerAdvancementUiAdapter} from "./progression-ui-adapter.mjs";
import {registerActorRuleUiAdapter} from "./actor-rules-ui-adapter.mjs";
import {registerRollModifiersUiAdapter} from "./roll-modifiers-ui-adapter.mjs";
import {registerViewContextBridges} from "./view-context-bridge.mjs";
import {registerHardcodedUiAdapterV022} from "./hardcoded-ui-adapter-v022.mjs";
import {inspectOpenSystemUI} from "./qa-ui-diagnostics-v023.mjs";
import {registerStartingGearAdapter,translateExistingStartingEquipment} from "./starting-gear-adapter.mjs";
import {registerChatBreakdownUiAdapter} from "./chat-breakdown-ui-adapter.mjs";
import runtimeDictionary from "./runtime-literals.mjs";
import {registerRuntimeUiAdapter} from "./runtime-ui-adapter.mjs";
import {registerSoulPickerUiAdapter} from "./soul-picker-ui-adapter.mjs";

export const MODULE_ID = "dark-heresy-2e-apex-ru";
export const SYSTEM_ID = "dark-heresy-2e-apex";

/** Only typography is toggled here; all document data remains owned by the system. */
export function applyRussianTypography(gameInstance = globalThis.game, documentInstance = globalThis.document) {
  const enabled = gameInstance?.system?.id === SYSTEM_ID && gameInstance?.i18n?.lang === "ru";
  documentInstance?.body?.classList.toggle("dh2e-ru", enabled);
  return enabled;
}

// Static dictionary import keeps the render path synchronous, even on first render.
registerSheetUiAdapter({dictionary});
registerDialogUiAdapter({dictionary: dialogDictionary});
registerSoulPickerUiAdapter();
registerCreationUiAdapter({dictionary: creationDictionary, skills: dictionary});
registerAdvancementUiAdapter();
registerActorRuleUiAdapter();
registerRollModifiersUiAdapter();
// v0.17-0.21: translate prepared view contexts before Handlebars receives them.
// Existing DOM adapters remain as guarded fallbacks for partial renders.
registerViewContextBridges();
registerHardcodedUiAdapterV022();
registerStartingGearAdapter();
registerTokenHudUiAdapter({dictionary, powers: bookData.powers});
registerChatBreakdownUiAdapter({dictionary});
registerRuntimeUiAdapter({dictionary: runtimeDictionary});
registerBookChatUiAdapter();
Hooks.once("init", () => applyRussianTypography());
Hooks.once("ready", () => {
  applyRussianTypography();
  const module=globalThis.game?.modules?.get?.(MODULE_ID);
  if(module)module.api=Object.freeze({...module.api,translateExistingStartingEquipment,bookCatalogStats,inspectOpenSystemUI});
});

// Babele 2.9.1 calls this during init, before discovering translation sources.
// Babele filters these nine translation maps by active language. The maps
// translate only views; source compendiums and world documents stay untouched.
Hooks.on("babele.init", babele => {
  if (globalThis.game?.system?.id !== SYSTEM_ID) return;
  babele.register({module: MODULE_ID, lang: "ru", dir: "compendium/ru"});
});
