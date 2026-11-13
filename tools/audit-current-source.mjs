/** Read-only audit. Usage: node tools/audit-current-source.mjs SYSTEM [--manifest TREE.json] */
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const MODULE_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_FILE = /^(?:src\/.*\.(?:mjs|js)|templates\/.*\.hbs|styles\/.*\.css)$/;
const CATALOG_PAIRS = [
  ['data/hardcoded-ui.v022.json', 'scripts/hardcoded-ui-data-v022.mjs'],
  ['data/runtime-literals.ru.json', 'scripts/runtime-literals.mjs']
];
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;

export function flattenLocale(source, prefix = '', result = {}) {
  for (const [name, value] of Object.entries(source)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (value && typeof value === 'object' && !Array.isArray(value)) flattenLocale(value, key, result);
    else result[key] = value;
  }
  return result;
}

function placeholders(value) {
  return typeof value === 'string' ? (value.match(/\{[A-Za-z0-9_.]+\}/g) ?? []).sort() : [];
}

export function compareLocales(english, russian) {
  const source = flattenLocale(english), translated = flattenLocale(russian);
  const missingKeys = [], blankValues = [], typeMismatches = [], placeholderMismatches = [], identicalValues = [];
  for (const [key, value] of Object.entries(source)) {
    if (!Object.hasOwn(translated, key)) { missingKeys.push(key); continue; }
    if (typeof value !== 'string' || typeof translated[key] !== 'string') {
      typeMismatches.push({key, sourceType: typeof value, translationType: typeof translated[key]});
      continue;
    }
    if (!translated[key].trim()) blankValues.push(key);
    const original = placeholders(value), localized = placeholders(translated[key]);
    if (JSON.stringify(original) !== JSON.stringify(localized)) placeholderMismatches.push({key, source: original, translation: localized});
    if (value === translated[key]) identicalValues.push({key, value});
  }
  return {
    sourceKeys: Object.keys(source).length, russianKeys: Object.keys(translated).length,
    presentSourceKeys: Object.keys(source).filter(key => Object.hasOwn(translated, key)).length,
    missingKeys, blankValues, typeMismatches, placeholderMismatches, identicalValues,
    passed: !missingKeys.length && !blankValues.length && !typeMismatches.length && !placeholderMismatches.length
  };
}

function filesBelow(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }).sort();
}

function withoutComments(text) {
  // Preserve line/offset positions and quoted values for the lexical inventory.
  return text.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    value => value.startsWith('//') || value.startsWith('/*') ? value.replace(/[^\n]/g, ' ') : value);
}

function loadRuntimeCatalog(path) {
  // The generated modules contain JSON after export default. Avoid executing them.
  const text = readFileSync(path, 'utf8'), marker = text.indexOf('export default ');
  if (marker < 0) throw new Error(`Unsupported data module: ${path}`);
  return JSON.parse(text.slice(marker + 15).trim().replace(/;$/, ''));
}

function catalogsAt(moduleDirectory) {
  const labels = new Set(), synchronization = [];
  for (const [jsonPath, modulePath] of CATALOG_PAIRS) {
    const jsonFile = join(moduleDirectory, jsonPath), runtimeFile = join(moduleDirectory, modulePath);
    if (!existsSync(jsonFile) || !existsSync(runtimeFile)) {
      synchronization.push({jsonPath, modulePath, synchronized: false, missing: [jsonPath, modulePath].filter(path => !existsSync(join(moduleDirectory, path)))});
      continue;
    }
    const runtime = loadRuntimeCatalog(runtimeFile), editable = readJson(jsonFile);
    for (const group of ['labels', 'sanity']) for (const key of Object.keys(runtime[group] ?? {})) labels.add(key);
    const left = flattenLocale(editable), right = flattenLocale(runtime);
    const differences = [...new Set([...Object.keys(left), ...Object.keys(right)])].filter(key => JSON.stringify(left[key]) !== JSON.stringify(right[key]));
    synchronization.push({jsonPath, modulePath, synchronized: !differences.length, differences});
  }
  return {labels, synchronization};
}

function expectedFiles(manifest) {
  if (!manifest) return null;
  const entries = manifest.system?.files ?? manifest.tree ?? manifest.files;
  if (!Array.isArray(entries)) throw new Error('Manifest must contain a GitHub tree array, files array or system.files array');
  return entries.filter(entry => entry.type === 'blob' && SOURCE_FILE.test(entry.path)).map(entry => entry.path).sort();
}

export function auditCurrentSource(systemDirectory, {moduleDirectory = MODULE_DIRECTORY, manifest = null} = {}) {
  systemDirectory = resolve(systemDirectory);
  const english = readJson(join(systemDirectory, 'lang/en.json')), russian = readJson(join(moduleDirectory, 'lang/ru.json'));
  const en = flattenLocale(english), ru = flattenLocale(russian), locale = compareLocales(english, russian);
  const system = existsSync(join(systemDirectory, 'system.json')) ? readJson(join(systemDirectory, 'system.json')) : {};
  const catalog = catalogsAt(moduleDirectory);
  const files = ['src', 'templates', 'styles'].flatMap(name => filesBelow(join(systemDirectory, name)))
    .map(path => relative(systemDirectory, path).replaceAll('\\', '/')).filter(path => SOURCE_FILE.test(path));
  const expected = expectedFiles(manifest), actual = new Set(files);
  const missingExpectedFiles = expected ? expected.filter(path => !actual.has(path)) : [];
  const references = [], dynamicKeys = [], candidates = [];
  for (const file of files) {
    const original = readFileSync(join(systemDirectory, file), 'utf8');
    const text = file.endsWith('.hbs') ? original.replace(/{{!--[\s\S]*?--}}|<!--[\s\S]*?-->/g, value => value.replace(/[^\n]/g, ' ')) : withoutComments(original);
    for (const match of text.matchAll(/\b(?:auditLocalize|auditFormat|localize(?:OrFallback)?|format|L)\s*\(?\s*(["'])(FALLOUTMAW\.[A-Za-z0-9_.-]+)\1/g)) {
      references.push({file, line: lineAt(text, match.index), key: match[2], inEnglish: Object.hasOwn(en, match[2]),
        inRussian: typeof ru[match[2]] === 'string' && Boolean(ru[match[2]].trim())});
    }
    for (const match of text.matchAll(/`(FALLOUTMAW\.[^`\n]*\$\{[^`\n]*)`/g)) {
      const prefix = match[1].split('${')[0], declared = Object.keys(en).filter(key => key.startsWith(prefix));
      dynamicKeys.push({file, line: lineAt(text, match.index), expression: match[1], prefix,
        matchingEnglishKeys: declared.length, missingDeclaredRussianKeys: declared.filter(key => !Object.hasOwn(ru, key))});
    }
    const add = (match, kind, value) => {
      if (/[A-Za-z]/.test(value)) candidates.push({file, line: lineAt(text, match.index), kind, text: value,
        exactRuntimeCatalogEntry: catalog.labels.has(value), reviewRequired: true});
    };
    if (/\.(?:mjs|js)$/.test(file)) {
      for (const m of text.matchAll(/\bui\.notifications(?:\?\.|\.)(?:warn|info|error|notify)(?:\?\.)?\s*\(\s*(["'`])((?:\\.|(?!\1)[^\n])*)\1/g)) add(m, 'direct-notification', m[2]);
      for (const m of text.matchAll(/\b(label|title|tooltip|hint|placeholder|message)\s*:\s*(["'])((?:\\.|(?!\2)[^\n])*)\2/g)) {
        if (!/^FALLOUTMAW\./.test(m[3])) add(m, `property.${m[1]}`, m[3]);
      }
    } else if (file.endsWith('.hbs')) {
      for (const m of text.matchAll(/\b(title|aria-label|placeholder|data-tooltip)\s*=\s*(["'])(.*?)\2/g)) {
        if (!m[3].includes('{{') && !/^(?:FALLOUTMAW|COMBAT)\./.test(m[3])) add(m, `hbs.${m[1]}`, m[3]);
      }
      for (const m of text.matchAll(/>([^<>]+)</g)) add(m, 'hbs.fragment', m[1].replace(/{{.*?}}/g, '').trim());
    } else {
      for (const m of text.matchAll(/\bcontent\s*:\s*(["'])(.*?)\1\s*;/g)) add(m, 'css.content', m[2]);
    }
  }
  const missingRussianReferences = references.filter(entry => !entry.inRussian);
  return {
    system: {id: system.id ?? null, version: system.version ?? null}, locale,
    sourceScope: {manifestProvided: Boolean(manifest), complete: expected ? !missingExpectedFiles.length : null,
      expectedFiles: expected?.length ?? null, observedFiles: files.length, missingExpectedFiles,
      missingDirectories: ['src', 'templates', 'styles'].filter(name => !existsSync(join(systemDirectory, name))),
      files: {js: files.filter(path => /\.(?:mjs|js)$/.test(path)).length, hbs: files.filter(path => path.endsWith('.hbs')).length, css: files.filter(path => path.endsWith('.css')).length}},
    staticReferences: {occurrences: references.length, unique: new Set(references.map(entry => entry.key)).size,
      missingRussianReferences, absentFromEnglish: references.filter(entry => !entry.inEnglish)},
    dynamicKeys, catalogSynchronization: catalog.synchronization, candidates,
    checksPassed: locale.passed && !missingRussianReferences.length && catalog.synchronization.every(entry => entry.synchronized),
    limitations: [
      'checksPassed validates locale entries, placeholders, recognized full key calls and paired catalogs, not full UI coverage.',
      'Source completeness is unknown without a manifest; missing source files are reported when one is supplied.',
      'Candidates include technical values, hidden branches and already covered adapters. Their count is not an untranslated UI count.',
      'Dynamic prefixes validate declared English keys only. Runtime values and namespace helpers require review.',
      'Extraction is lexical, not an AST or full call graph. Identical values also include formulas, names and symbols.',
      'Foundry rendering, binary compendiums, user-created documents and third-party modules are outside this static check.'
    ]
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [systemDirectory, flag, manifestPath] = process.argv.slice(2);
  if (!systemDirectory || (flag && (flag !== '--manifest' || !manifestPath))) {
    console.error('Usage: node tools/audit-current-source.mjs SYSTEM [--manifest TREE.json]');
    process.exitCode = 2;
  } else {
    const result = auditCurrentSource(systemDirectory, {manifest: manifestPath ? readJson(resolve(manifestPath)) : null});
    console.log(JSON.stringify(result, null, 2));
    if (!result.checksPassed) process.exitCode = 1;
  }
}
