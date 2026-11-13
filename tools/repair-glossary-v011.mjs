import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const target=[
  'lang/ru.json',
  'lang/ui-literals.ru.json',
  'compendium/ru/dark-heresy-2e-apex.dh2e-equipment.json',
  'compendium/ru/dark-heresy-2e-apex.dh2e-character.json',
  'compendium/ru/dark-heresy-2e-apex.dh2e-bestiary.json',
  'compendium/ru/dark-heresy-2e-apex.dh2e-psychic-powers.json',
  'compendium/ru/dark-heresy-2e-apex.dh2e-critical-effects.json',
  'compendium/ru/dark-heresy-2e-apex.dh2e-critical-tables.json',
  'compendium/ru/dark-heresy-2e-apex.dh2e-vehicles.json',
  'compendium/ru/dark-heresy-2e-apex.dh2e-warp-effects.json',
  'compendium/ru/dark-heresy-2e-apex.dh2e-warp-tables.json'
];
const totals={};
function transform(data,stats){
  if(Array.isArray(data))return data.map(value=>transform(value,stats));
  if(data && typeof data==='object')return Object.fromEntries(Object.entries(data).map(([k,v])=>[k,transform(v,stats)]));
  if(typeof data!=='string')return data;
  const x=data.replaceAll('Арбитрес','Арбитес');
  if(x!==data)stats.correctedArbites++;
  return x;
}
for(const file of target){
  const path=join(root,file);
  const data=JSON.parse(await readFile(path,'utf8'));
  const stats={correctedArbites:0,correctedPsyniscience:0};
  const changed=transform(data,stats);
  if(file==='lang/ui-literals.ru.json'){
    const term=changed.focusResist?.psyniscience;
    if(term?.ru==='Психическое чутьё'){
      term.ru='Психонаука';stats.correctedPsyniscience++;
    }
  }
  if(stats.correctedArbites||stats.correctedPsyniscience){
    await writeFile(path,JSON.stringify(changed,null,2)+'\n','utf8');
    totals[file]=stats;
  }
}
console.log(JSON.stringify(totals,null,2));
