import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {auditCurrentSource, compareLocales} from './audit-current-source.mjs';

const root = mkdtempSync(join(tmpdir(), 'dh2e-source-audit-'));
const system = join(root, 'system'), moduleDirectory = join(root, 'module');
const write = (directory, path, value) => {
  const target = join(directory, path);
  mkdirSync(join(target, '..'), {recursive: true});
  writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
};
try {
  const mismatch = compareLocales({A: {Label: '{n} + {n}', Blank: 'text', Number: 'Number', Missing: 'missing'}},
    {'A.Label': '{n}', 'A.Blank': ' ', 'A.Number': 12});
  assert.deepEqual(mismatch.missingKeys, ['A.Missing']);
  assert.deepEqual(mismatch.blankValues, ['A.Blank']);
  assert.equal(mismatch.typeMismatches[0].key, 'A.Number');
  assert.deepEqual(mismatch.placeholderMismatches[0].source, ['{n}', '{n}']);
  assert.equal(mismatch.passed, false);

  write(system, 'system.json', {id: 'fixture', version: '0.1.12'});
  write(system, 'lang/en.json', {FALLOUTMAW: {Hello: 'Hello {name}', Mode: {one: 'First'}}});
  const ru = {'FALLOUTMAW.Hello': 'Привет, {name}', 'FALLOUTMAW.Mode.one': 'Первый', 'FALLOUTMAW.CodeOnly': 'Код'};
  write(moduleDirectory, 'lang/ru.json', ru);
  const catalog = {labels: {'Not enough charges.': 'Недостаточно зарядов.'}};
  for (const [data, script] of [['hardcoded-ui.v022.json', 'hardcoded-ui-data-v022.mjs'], ['runtime-literals.ru.json', 'runtime-literals.mjs']]) {
    write(moduleDirectory, `data/${data}`, catalog);
    write(moduleDirectory, `scripts/${script}`, `export default ${JSON.stringify(catalog)};\n`);
  }
  write(system, 'src/example.mjs', [
    '// localize("FALLOUTMAW.CommentOnly")',
    'auditLocalize("FALLOUTMAW.CodeOnly", "Fallback");',
    'game.i18n.format("FALLOUTMAW.Hello", {name: "Joe"});',
    'const dynamic = `FALLOUTMAW.Mode.${key}`;',
    'ui.notifications.warn("Not enough charges.");',
    'ui.notifications?.info?.("Optional notification.");'
  ].join('\n'));
  write(system, 'templates/example.hbs', '<label>{{localize "FALLOUTMAW.Hello"}}</label><button title="Attack">Shoot</button>');
  const manifest = {tree: ['src/example.mjs', 'templates/example.hbs', 'src/not-downloaded.mjs']
    .map(path => ({path, type: 'blob'}))};
  let result = auditCurrentSource(system, {moduleDirectory, manifest});
  assert.equal(result.locale.sourceKeys, 2);
  assert.equal(result.locale.presentSourceKeys, 2);
  assert.equal(result.checksPassed, true);
  assert.equal(result.sourceScope.complete, false);
  assert.deepEqual(result.sourceScope.missingExpectedFiles, ['src/not-downloaded.mjs']);
  assert.equal(result.staticReferences.occurrences, 3);
  assert.equal(result.staticReferences.absentFromEnglish[0].key, 'FALLOUTMAW.CodeOnly');
  assert.equal(result.dynamicKeys[0].matchingEnglishKeys, 1);
  const warning = result.candidates.find(entry => entry.kind === 'direct-notification');
  assert.equal(warning.line, 5);
  assert.equal(warning.exactRuntimeCatalogEntry, true);
  assert.ok(result.candidates.some(entry => entry.kind === 'direct-notification' && entry.text === 'Optional notification.'));
  assert.ok(result.candidates.some(entry => entry.kind === 'hbs.title' && entry.text === 'Attack'));
  assert.equal(auditCurrentSource(system, {moduleDirectory}).sourceScope.complete, null);

  write(system, 'src/not-downloaded.mjs', 'localize("FALLOUTMAW.Unknown");');
  result = auditCurrentSource(system, {moduleDirectory, manifest});
  assert.equal(result.sourceScope.complete, true);
  assert.equal(result.checksPassed, false);
  assert.equal(result.staticReferences.missingRussianReferences[0].key, 'FALLOUTMAW.Unknown');

  write(moduleDirectory, 'lang/ru.json', {...ru, 'FALLOUTMAW.Unknown': 'Новый ключ'});
  write(moduleDirectory, 'data/runtime-literals.ru.json', {labels: {'Not enough charges.': 'Другой перевод'}});
  result = auditCurrentSource(system, {moduleDirectory, manifest});
  assert.equal(result.checksPassed, false);
  assert.deepEqual(result.catalogSynchronization[1].differences, ['labels.Not enough charges.']);
  console.log('Current-source audit tests passed: locale errors, dynamic groups, code-only keys, sparse sources, candidates and catalog drift.');
} finally {
  rmSync(root, {recursive: true, force: true});
}
