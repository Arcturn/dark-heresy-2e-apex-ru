import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname,join} from "node:path";
const HERE=dirname(fileURLToPath(import.meta.url));
const englishPath=process.argv[2] && resolve(process.argv[2]);
if (!englishPath) {console.error("Usage: node tools/verify-ru-locale.mjs <system-lang/en.json>");process.exit(2)}
const EN=JSON.parse(readFileSync(englishPath,"utf8"));
const RU=JSON.parse(readFileSync(join(HERE,"../lang/ru.json"),"utf8"));
function flatten(source,prefix="",o={}){
  for (const [k,v] of Object.entries(source)) {
    const path=prefix?`${prefix}.${k}`:k;
    if (v && typeof v==="object" && !Array.isArray(v)) flatten(v,path,o);
    else o[path]=v;
  }
  return o;
}
const source=flatten(EN);
const tokens=s=>(s.match(/\{[\w.]+\}/g)||[]).sort().join("|");
for (const [key,value] of Object.entries(source)) {
  assert.equal(typeof RU[key],"string",`Missing translation ${key}`);
  assert.ok(RU[key].trim(),`Blank translation ${key}`);
  assert.equal(tokens(value),tokens(RU[key]),`Placeholder mismatch at ${key}`);
}
const counts={source:Object.keys(source).length,translated:Object.keys(source).filter(k=>k in RU).length,extra:Object.keys(RU).length-Object.keys(source).length};
console.log("Translation check passed:",counts);
