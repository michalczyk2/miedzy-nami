import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {cardSignature} from '../src/core/deck-engine.mjs';
import {validateCard} from '../src/content/card-validation.mjs';

const root=resolve(import.meta.dirname,'..');
const cards=JSON.parse(readFileSync(resolve(root,'content/library.json'),'utf8'));
const categories=new Set(['zabawne','codzienność','podróże','jedzenie','wspomnienia','przyszłość','relacja','romantyczne','głębsze','absurdalne']);
const errors=[];
const warnings=[];
const ids=new Map();
const signatures=new Map();
const byMode={};
const byCategory={};
const byLevel={1:0,2:0,3:0};

for(const card of cards){
  const result=validateCard(card,categories);
  result.errors.forEach(message=>errors.push(`${card.id||'(bez id)'}: ${message}`));
  result.warnings.forEach(message=>warnings.push(`${card.id||'(bez id)'}: ${message}`));
  if(ids.has(card.id))errors.push(`Duplikat id: ${card.id}`);else ids.set(card.id,true);
  const signature=cardSignature(card);
  if(signature){if(signatures.has(signature))errors.push(`Duplikat treści: ${signatures.get(signature)} oraz ${card.id}`);else signatures.set(signature,card.id)}
  byMode[card.mode]=(byMode[card.mode]||0)+1;
  byCategory[card.category]=(byCategory[card.category]||0)+1;
  byLevel[card.level]=(byLevel[card.level]||0)+1;
}

const expectedModes=['wave','know','who','dilemma','scale','plan','words','story','tell','challenge'];
for(const mode of expectedModes)if(!byMode[mode])errors.push(`Brak kart dla trybu ${mode}.`);
for(const category of categories)if(!byCategory[category])errors.push(`Brak kart dla kategorii ${category}.`);

const report={generatedAt:new Date().toISOString(),total:cards.length,errors,warnings,byMode,byCategory,byLevel};
writeFileSync(resolve(root,'reports/card-report.json'),JSON.stringify(report,null,2)+'\n');
const rows=Object.entries(byMode).sort((a,b)=>a[0].localeCompare(b[0],'pl')).map(([mode,count])=>`| ${mode} | ${count} |`).join('\n');
const categoryRows=Object.entries(byCategory).sort((a,b)=>a[0].localeCompare(b[0],'pl')).map(([category,count])=>`| ${category} | ${count} |`).join('\n');
const markdown=`# Raport kart — Między Nami v0.5\n\nWygenerowano: ${report.generatedAt}\n\n- Łącznie: **${cards.length}**\n- Błędy: **${errors.length}**\n- Ostrzeżenia: **${warnings.length}**\n\n## Tryby\n\n| Tryb | Liczba |\n|---|---:|\n${rows}\n\n## Kategorie\n\n| Kategoria | Liczba |\n|---|---:|\n${categoryRows}\n\n## Poziomy\n\n| Poziom | Liczba |\n|---|---:|\n| 1 | ${byLevel[1]} |\n| 2 | ${byLevel[2]} |\n| 3 | ${byLevel[3]} |\n\n## Ostrzeżenia\n\n${warnings.length?warnings.map(item=>`- ${item}`).join('\n'):'Brak.'}\n`;
writeFileSync(resolve(root,'reports/CARD_REPORT.md'),markdown);
if(errors.length){console.error(`Walidacja kart nieudana (${errors.length}):\n- ${errors.join('\n- ')}`);process.exit(1)}
console.log(`Walidacja kart OK: ${cards.length} unikalnych kart, ${warnings.length} ostrzeżeń.`);
