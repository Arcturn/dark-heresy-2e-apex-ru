import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest=JSON.parse(readFileSync(join(root,'module.json'), 'utf8'));
assert.equal(manifest.id,'dark-heresy-2e-apex-ru');
assert.match(manifest.version,/^1\.\d+\.\d+$/u);
assert.equal(manifest.compatibility.minimum,'14');
assert.equal(manifest.relationships.systems[0].id,'dark-heresy-2e-apex');
assert.equal(manifest.relationships.systems[0].compatibility.minimum,'0.1.10');
assert.ok(manifest.relationships.requires.some(m=>m.id==='babele'));
assert.ok(manifest.relationships.requires.some(m=>m.id==='lib-wrapper'));
assert.ok(manifest.esmodules.every(e=>e.startsWith('scripts/')));
const maps=readdirSync(join(root,'compendium/ru')).filter(n=>n.endsWith('.json'));
assert.equal(maps.length,9);
for (const file of maps) {
  const value=JSON.parse(readFileSync(join(root,'compendium/ru',file),'utf8'));
  assert.ok(value && typeof value==='object',file);
  assert.match(value.label,/[А-Яа-яЁё]/,`Compendium label is not Russian: ${file}`);
}
console.log('Package manifest, Babele dependencies and 9 maps: PASS');
