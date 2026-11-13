#!/usr/bin/env python3
"""Static localization audit for Apex 0.1.10. Read only.
Usage: python3 tools/audit-v023-static.py /path/to/extracted/system
Does not assert complete runtime coverage; JS identifiers are not user-facing strings.
"""
import csv
import html
import json
import re
import sys
from collections import Counter
from pathlib import Path
HERE=Path(__file__).resolve().parent.parent
SYSTEM=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else None
if not SYSTEM or not (SYSTEM/'system.json').is_file():
    raise SystemExit('Usage: python tools/audit-v023-static.py <extracted original Apex system dir>')

original=json.loads((SYSTEM/'system.json').read_text())
EN=json.loads((SYSTEM/'lang/en.json').read_text())
RU=json.loads((HERE/'lang/ru.json').read_text())
STOCK=json.loads((HERE/'data/hardcoded-ui.v022.json').read_text())['labels']

def flat(obj,prefix=''):
    for k,v in obj.items():
        key=prefix+'.'+k if prefix else k
        if isinstance(v,dict):yield from flat(v,key)
        else:yield key,v

def variables(s):return sorted(re.findall(r'\{[A-Za-z0-9_.]+\}',s))
flat_en=dict(flat(EN));assert len(flat_en)==7048,len(flat_en)
missing=[key for key in flat_en if not isinstance(RU.get(key),str) or not RU[key].strip()]
placeholders=[key for key,value in flat_en.items() if isinstance(value,str) and key in RU and variables(value)!=variables(RU[key])]
if missing or placeholders:raise AssertionError(f'Missing keys {missing[:4]}, mismatched placeholders {placeholders[:4]}')

packs=original.get('packs',[])
pack_names={p['name'] for p in packs}
file_names={p.stem.split('.')[-1] for p in (HERE/'compendium/ru').glob('*.json')}
missing_packs=sorted(pack_names-file_names)
extra_packs=sorted(file_names-pack_names)
if missing_packs or extra_packs:raise AssertionError((missing_packs,extra_packs))
comp_counts={}
for p in (HERE/'compendium/ru').glob('*.json'):
    obj=json.loads(p.read_text())
    assert isinstance(obj.get('entries'),dict)
    comp_counts[p.stem.split('.')[-1]]=len(obj['entries'])

js_files=list((SYSTEM/'src').rglob('*.mjs'))
hbs_files=list((SYSTEM/'templates').rglob('*.hbs'))
css_files=list((SYSTEM/'styles').rglob('*.css'))
found=[]
for p in hbs_files:
    s=p.read_text(errors='replace'); rel=p.relative_to(SYSTEM).as_posix()
    for m in re.finditer(r'(?<=>)([^<]+)(?=<)',s):
        raw=re.sub(r'{{.*?}}','',m.group(1))
        literal=html.unescape(raw).strip()
        if re.search(r'[A-Z][a-z]{2}',literal) and re.fullmatch(r'[a-zA-Z0-9 /+,.\-:!?()′’]+',literal):
            found.append((rel,s[:m.start()].count('\n')+1,literal,'text'))
    for m in re.finditer(r'\b(?:title|aria-label|placeholder|data-tooltip)\s*=\s*["\']([^"\']+)["\']',s):
        literal=m.group(1).strip()
        if '{{' not in literal and re.search(r'[A-Z][a-z]{2}',literal):
            found.append((rel,s[:m.start()].count('\n')+1,literal,'attribute'))
classification=[]
for rel,line,label,kind in found:
    if label in STOCK:state='dictionary'
    elif re.fullmatch(r'(COMBAT|FALLOUTMAW)\.[A-Za-z0-9.]+',label):state='localization-key'
    elif label in {'Las, Solid Projectile, Chain…','Tearing, Proven (3), Blast (2)'}:state='technical-input-example'
    elif label == 'Operate':state='v0.23-dynamic-vehicle-label'
    else:state='unclassified-review'
    classification.append({'source':rel,'line':line,'label':label,'kind':kind,'state':state})

css=[]
for p in css_files:
    s=p.read_text(errors='replace');rel=p.relative_to(SYSTEM).as_posix()
    for m in re.finditer(r'\bcontent\s*:\s*[\'\"]([^\'\"]+)[\'\"]\s*;',s):
        t=m.group(1)
        if re.search('[A-Za-z]',t) and len(t)>1:
            css.append({'source':rel,'line':s[:m.start()].count('\n')+1,'text':t,
                'status':'css-translated' if t in ('GM mode','DoS','DoF') else 'review'})

result={
 'version':'0.23.0','system_version':original.get('version'),'files':{'js':len(js_files),'hbs':len(hbs_files),'css':len(css_files)},
 'core_i18n':{'source_keys':len(flat_en),'translated_keys':len(flat_en)-len(missing),'missing_keys':len(missing),'placeholder_mismatches':len(placeholders)},
 'compendium_counts':comp_counts,'compendium_total':sum(comp_counts.values()),
 'hbs_static_literals':{'occurrences':len(found),'unique':len(set(row['label'] for row in classification)),
  'classification':dict(Counter(row['state'] for row in classification))},
 'css_visible_text':css,
 'limitations':[
    'Only obvious static HBS text is classified, not arbitrary JavaScript output.',
    'An i18n key in data-tooltip is not itself English and requires Foundry to resolve it at runtime.',
    'Hardcoded JS may be emitted by dynamic code paths; no VTT browser session tested.',
    'User-authored and third-party module content is excluded.'
 ]
}
(HERE/'docs/v0.23.0-static-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
with (HERE/'docs/v0.23.0-template-candidates.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=['source','line','label','kind','state']);writer.writeheader();writer.writerows(classification)
print(json.dumps(result,ensure_ascii=False,indent=2))
