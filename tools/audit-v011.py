#!/usr/bin/env python3
"""Offline audit: base-language keys, placeholders, Babele coverage and source literals.

This is a static check, NOT a Foundry integration test or editorial review.
Usage: python tools/audit-v011.py <system/lang/en.json> [system/src]
"""
from __future__ import annotations
import collections
import json
from pathlib import Path
import re
import sys
from datetime import date

ROOT = Path(__file__).resolve().parents[1]
EN = Path(sys.argv[1]).resolve() if len(sys.argv) >= 2 else None
SRC = Path(sys.argv[2]).resolve() if len(sys.argv) >= 3 else None
if not EN or not EN.exists():
    sys.exit('Usage: python tools/audit-v011.py /path/to/system/lang/en.json [/path/to/system/src]')

def flatten(x: dict, prefix='') -> dict:
    result = {}
    for k,v in x.items():
        key = f'{prefix}.{k}' if prefix else k
        if isinstance(v,dict):result.update(flatten(v,key))
        else:result[key]=v
    return result

english = flatten(json.loads(EN.read_text(encoding='utf8')))
russian = json.loads((ROOT/'lang/ru.json').read_text(encoding='utf8'))
assert len(english)==7048, 'Unexpected source version: localization target 0.1.10 expected 7048 keys'
missing=sorted(set(english)-set(russian))
blank=[key for key in english if not isinstance(russian.get(key),str) or not russian[key].strip()]
tokens=lambda s: sorted(re.findall(r'\{[a-zA-Z_][a-zA-Z_0-9.]*\}',str(s)))
missing_tokens=[key for key in english if key not in missing and tokens(english[key])!=tokens(russian[key])]
unchanged=[key for key in english if english[key] == russian.get(key)]
english_only=[key for key in english if not re.search('[А-ЯЁа-яё]',russian.get(key,'')) and re.search('[A-Za-z]{3,}',russian.get(key,''))]

pack_files=sorted((ROOT/'compendium/ru').glob('dark-heresy-2e-apex.dh2e-*.json'))
expected_packs={p['name'] for p in json.loads((SRC.parent/'system.json').read_text(encoding='utf8'))['packs']} if SRC and (SRC.parent/'system.json').exists() else set()
pack_summaries=[]
for path in pack_files:
    data=json.loads(path.read_text(encoding='utf8'))
    entries=data.get('entries')
    assert isinstance(entries,dict) and entries, f'{path.name} has no entries'
    fields=[]
    def inspect(obj,where=''):
        if isinstance(obj,dict):
            for key,val in obj.items():
                where2=f'{where}.{key}' if where else key
                if key in ('name','description','tokenName','text','label') and isinstance(val,str):
                    fields.append((where2,val))
                if isinstance(val,(dict,list)):inspect(val,where2)
        elif isinstance(obj,list):
            for i,val in enumerate(obj):inspect(val,f'{where}[{i}]')
    inspect(entries)
    # Top-level names MUST be Russian. Some embedded entries have empty original description.
    missing_cyrillic=[where for where,value in fields if value and not re.search('[А-ЯЁа-яё]',value)
        and re.search('[A-Za-z]{3,}', re.sub(r'<[^>]*>', '',value))
        and not re.fullmatch(r'\d+[dк]\d+(?:[+-]\d+)?',value.strip())]
    # Explicitly count textual leaves without assuming they are all game-visible.
    pack_summaries.append({
        'pack':path.stem.removeprefix('dark-heresy-2e-apex.'),
        'entries':len(entries),
        'folders':len(data.get('folders',{})),
        'translation_fields':len(fields),
        'english_only_text_fields':len(missing_cyrillic),
        'english_only_examples':missing_cyrillic[:12],
        'has_mapping':bool(data.get('mapping')),
    })

literal_candidates=[]
if SRC and SRC.exists():
    static_rule=re.compile(r'''\b(?P<key>label|title|tooltip|hint|message|placeholder|description|text|short|typeName|name|ariaLabel|labelText|headerText)\s*:\s*(['"])(?P<val>[^'"\n]{3,130})\2''')
    for path in SRC.rglob('*.mjs'):
        data=path.read_text(encoding='utf8')
        for hit in static_rule.finditer(data):
            value=hit['val']
            if not re.search('[A-Za-z]{3}',value) or value.startswith(('FALLOUTMAW.','dh2e','fa-','data-','system.','ui.','<','--','.')) or '/' in value:
                continue
            literal_candidates.append({'file':str(path.relative_to(SRC)),
                'line':data.count('\n',0,hit.start())+1,
                'kind':hit['key'],'literal':value})

report={
 'version':'0.11.0',
 'system_version':'0.1.10',
 'method':'static audit; no running Foundry VTT instance',
 'interface':{
    'source_keys':len(english),'russian_keys_present':len(english)-len(missing),
    'extra_keys':len(set(russian)-set(english)),
    'missing':missing,'blank':blank,'placeholder_mismatches':missing_tokens,
    'unchanged_vs_english':unchanged,
    'no_cyrillic_with_latin_keys':english_only,
    'note':'A translated key does not prove visual reachability or editorial correctness.'
 },
 'compendiums':{'expected_packs':sorted(expected_packs),'files':pack_summaries,
               'total_entry_keys':sum(row['entries'] for row in pack_summaries),
               'note':'Character Creation includes a generic Psyker fallback plus ID-specific disambiguation.'},
 'source_english_literals':{
     'candidate_occurrences':len(literal_candidates),
     'source_files':len(set(row['file'] for row in literal_candidates)),
     'note':'Heuristic! Includes data catalog names, internal IDs, scripted dialogue, and other strings; not an exact count of untranslated UI.',
     'priority_examples':[r for r in literal_candidates if r['file'] in {
       'rolls/skill-check.mjs','rolls/dh2e-test-breakdown.mjs','inventory/consumption-receipt.mjs',
       'rolls/dh2e-fear.mjs','rolls/dh2e-fate.mjs','rolls/dh2e-gear-effects.mjs'
     }][:45]
 },
 'fixes':{
   'chat_check_breakdown':'Scoped renderChatMessageHTML adapter replaces known source-label rows, preserves all numeric values.',
   'glossary':'Fixed Адептус Арбитрес → Адептус Арбитес in live dictionaries and 2 compendium packs; Psyniscience unified as Психонаука.',
   'unmodified':'No source system modules or document IDs, stored actor/item keys, UUIDs or dice formulas changed.'
 },
 'limitations':[
   'No live Foundry VTT 14 testing.',
   'Not all source-hardcoded English strings are fixed in 0.11.0; priority examples are documented.',
   'Importing translated documents into a world, Babele runtime and all UI layouts require hands-on validation.',
   'This is a consistency and mechanical-safety pass, not a complete manual proofreading of the nine compendiums.'
 ]
}
assert not(missing or blank or missing_tokens),'Interface key or placeholder coverage regression'
assert len(pack_files)==9 and all(p['has_mapping'] for p in pack_summaries),'Missing pack or mapping'
assert not any(p['english_only_text_fields'] for p in pack_summaries), 'Untranslated text-only fields in Babele packs'
assert (not expected_packs or expected_packs=={p['pack'] for p in pack_summaries}), 'Pack list mismatch'
report_path=ROOT/'docs/quality-audit-v0.11.json'
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({
 'locale_keys':report['interface']['russian_keys_present'],
 'extra_keys':report['interface']['extra_keys'],
 'unchanged_identical':len(unchanged),
 'compendiums':len(pack_files),
 'compendium_entry_keys':report['compendiums']['total_entry_keys'],
 'english_only_compendium_fields':sum(p['english_only_text_fields'] for p in pack_summaries),
 'source_literal_candidates':len(literal_candidates),
 'source_literal_files':report['source_english_literals']['source_files'],
 'report':str(report_path)
},ensure_ascii=False,indent=2))
