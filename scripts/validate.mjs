import {execFileSync} from 'node:child_process';
import {readFileSync, existsSync, statSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const required=[
  'index.html','styles.css','cloud-config.js','cloud-config.example.js','app.js','enhancements.js','v05.js','v06.js','v07.js','v071.js',
  'content/cards-v05.js','content/cards-v05.json','content/library.json','content/daily-match.js','content/daily-match.json',
  'manifest.webmanifest','sw.js','vercel.json','icon-180.png','icon-192.png','icon-512.png','icon.svg','version.json',
  'src/core/deck-engine.mjs','src/core/scoring.mjs','src/core/card-feedback.mjs','src/core/daily-match-engine.mjs','src/core/cloud-daily-engine.mjs','src/content/card-validation.mjs',
  'supabase/migrations/001_v07_cloud.sql','reports/CARD_REPORT.md','reports/card-report.json'
];
const errors=[];
for(const file of required){const path=resolve(root,file);if(!existsSync(path)||statSync(path).size===0)errors.push(`Brak lub pusty plik: ${file}`)}
for(const file of ['cloud-config.js','app.js','enhancements.js','content/cards-v05.js','v05.js','content/daily-match.js','v06.js','v07.js','v071.js','sw.js','scripts/export-library.mjs','scripts/card-report.mjs']){
  try{execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'pipe'})}catch(error){errors.push(`Błąd składni JavaScript: ${file}\n${error.stderr?.toString()||error.message}`)}
}
for(const file of ['manifest.webmanifest','vercel.json','version.json','content/cards-v05.json','content/library.json','content/daily-match.json','reports/card-report.json']){
  try{JSON.parse(readFileSync(resolve(root,file),'utf8'))}catch(error){errors.push(`Błędny JSON: ${file}: ${error.message}`)}
}
const html=readFileSync(resolve(root,'index.html'),'utf8');
for(const asset of ['styles.css','cloud-config.js','app.js','enhancements.js','content/cards-v05.js','v05.js','content/daily-match.js','v06.js','v07.js','v071.js','manifest.webmanifest','icon-180.png'])if(!html.includes(`/${asset}`))errors.push(`index.html nie odwołuje się do /${asset}`);
if(!html.includes('Michał Czerwiński'))errors.push('index.html nie zawiera podpisu autora Michał Czerwiński');
if(!html.includes('@supabase/supabase-js@2'))errors.push('index.html nie ładuje klienta Supabase');
const version=JSON.parse(readFileSync(resolve(root,'version.json'),'utf8'));
const library=JSON.parse(readFileSync(resolve(root,'content/library.json'),'utf8'));
if(version.version!=='0.7.1')errors.push(`version.json ma nieprawidłową wersję: ${version.version}`);
if(version.creator!=='Michał Czerwiński')errors.push('version.json ma nieprawidłowego autora');
const daily=JSON.parse(readFileSync(resolve(root,'content/daily-match.json'),'utf8'));
if(version.daily_match_questions!==daily.questions.length)errors.push(`version.json deklaruje ${version.daily_match_questions} pytań dziennych, a biblioteka ma ${daily.questions.length}`);
if(version.cards!==library.length)errors.push(`version.json deklaruje ${version.cards} kart, a biblioteka ma ${library.length}`);
const sw=readFileSync(resolve(root,'sw.js'),'utf8');
for(const asset of ['/cloud-config.js','/content/cards-v05.js','/v05.js','/content/daily-match.js','/v06.js','/v07.js','/v071.js'])if(!sw.includes(asset))errors.push(`Service worker nie buforuje ${asset}`);
const sql=readFileSync(resolve(root,'supabase/migrations/001_v07_cloud.sql'),'utf8');
for(const fragment of ['enable row level security','create_couple','join_couple','daily_submissions','daily_results','supabase_realtime'])if(!sql.toLowerCase().includes(fragment.toLowerCase()))errors.push(`Migracja Supabase nie zawiera: ${fragment}`);
if(errors.length){console.error(`\nKontrola nieudana (${errors.length}):\n- ${errors.join('\n- ')}\n`);process.exit(1)}
console.log(`Kontrola plików OK. Wersja ${version.version}, ${library.length} kart, ${daily.questions.length} pytań dziennych.`);
console.log('Frontend v0.7.1 i migracja Supabase są gotowe do konfiguracji.');
