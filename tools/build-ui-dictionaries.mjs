/** Rebuild static imports after changing the editable JSON UI dictionaries. */
import {readFile, writeFile} from "node:fs/promises";
const root = new URL("../", import.meta.url);
for (const [source, output] of [
  ["lang/ui-literals.ru.json", "scripts/ui-literals.mjs"],
  ["lang/dialog-ui.ru.json", "scripts/dialog-ui.mjs"],
  ["data/picker-quality-names.en.json", "scripts/canonical-qualities.mjs"]
]) {
  const dictionary = JSON.parse(await readFile(new URL(source, root), "utf8"));
  await writeFile(new URL(output, root),
    `// Generated from ${source}. Run tools/build-ui-dictionaries.mjs after editing.\n` +
    `export default ${JSON.stringify(dictionary, null, 2)};\n`, "utf8");
  console.log(output);
}
