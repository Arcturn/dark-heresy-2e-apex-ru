// This exported formatter belongs to the exact system version declared in module.json.
// Import it synchronously so canonical serialization is installed before any picker opens.
import {DH2E_PICKER_FORMATS} from "../../../systems/dark-heresy-2e-apex/src/apps/dh2e-picker.mjs";
import {installPickerCompatibility} from "./picker-compat.mjs";
import canonicalNames from "./canonical-qualities.mjs";

installPickerCompatibility({formats: DH2E_PICKER_FORMATS, canonicalNames});
