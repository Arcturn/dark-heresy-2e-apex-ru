/**
 * Keep DH2E weapon-quality storage canonical while Russian labels are displayed.
 *
 * The system's qualities writer resolves pick.key to the current localized label.
 * Its reader and mechanics parse English book names. For Russian weapon qualities
 * only, pass the original English names as keys to that same writer: these names
 * are not source keys, so nameOf keeps them verbatim. All value formatting remains
 * the responsibility of the original writer, including 0, X and PR/2.
 *
 * canonicalNames is an own-key map such as { tearing: "Tearing" }, extracted from
 * the original system en.json. No document, catalog, input, or pick is mutated.
 */
const SYSTEM_ID = "dark-heresy-2e-apex";
const installations = new WeakMap();

/**
 * Install once on the imported DH2E_PICKER_FORMATS object.
 * @returns {boolean} true when installed; false when this wrapper is already there.
 */
export function installPickerCompatibility({ formats, canonicalNames, game = () => globalThis.game }) {
  const qualities = formats?.qualities;
  if (!qualities || typeof qualities.write !== "function") {
    throw new TypeError("DH2E picker qualities.write is required.");
  }
  if (!canonicalNames || typeof canonicalNames !== "object" || Array.isArray(canonicalNames)) {
    throw new TypeError("Canonical English weapon-quality names are required.");
  }
  if (typeof game !== "function") throw new TypeError("game must be a function.");
  if (installations.get(qualities) === qualities.write) return false;

  const names = Object.create(null);
  for (const [key, name] of Object.entries(canonicalNames)) {
    if (typeof name !== "string" || !name) {
      throw new TypeError(`Invalid canonical weapon-quality name for ${key}.`);
    }
    names[key] = name;
  }
  Object.freeze(names);
  const original = qualities.write;
  const wrapped = function (picks, source, ...rest) {
    const currentGame = game();
    if (source !== "weaponQualities" || currentGame?.system?.id !== SYSTEM_ID || currentGame?.i18n?.lang !== "ru") {
      return original.call(this, picks, source, ...rest);
    }
    const canonicalPicks = picks.map(pick => Object.hasOwn(names, pick.key)
      ? { ...pick, key: names[pick.key] }
      : pick);
    return original.call(this, canonicalPicks, source, ...rest);
  };
  qualities.write = wrapped;
  installations.set(qualities, wrapped);
  return true;
}
